using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Octokit;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using DeploymentStatusEnum = GitHubIntegrationBackend.Models.DeploymentStatus;
using RepoEntity = GitHubIntegrationBackend.Models.Repository;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/deployment")]
    public class DeploymentController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly string _uploadRoot;

        public DeploymentController(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
            _uploadRoot = Path.Combine(
                Directory.GetCurrentDirectory(),
                "uploads",
                "workflows"
            );
        }

        // =========================================================
        // 1️⃣ CREATE DEPLOYMENT + UPLOAD YAML + TRIGGER ACTION
        // =========================================================
        [HttpPost("check")]
[Consumes("multipart/form-data")]
public async Task<IActionResult> CreateDeploymentRequest(
    [FromForm] DeploymentCheckRequest request
)
{
    var repoId = request.RepoId;
    var branch = request.Branch;
    var workflow = request.Workflow;
            try
            {
                // 🔐 Validation
                if (workflow == null || workflow.Length == 0)
                    return BadRequest(new { message = "Workflow file is required" });

                if (!workflow.FileName.EndsWith(".yml") &&
                    !workflow.FileName.EndsWith(".yaml"))
                    return BadRequest(new { message = "Only .yml or .yaml files are allowed" });

                var repo = await _db.Repositories
                    .FirstOrDefaultAsync(r => r.Id == repoId);

                if (repo == null)
                    return NotFound(new { message = "Repository not found" });

                // 📁 Ensure directory exists
                Directory.CreateDirectory(_uploadRoot);

                // 🧾 Safe filename
                var workflowFileName = Path.GetFileName(workflow.FileName);
                var localPath = Path.Combine(
                    _uploadRoot,
                    $"{Guid.NewGuid()}_{workflowFileName}"
                );

                // ✅ BULLETPROOF FILE SAVE (NO FileStream)
                await using (var stream = System.IO.File.Create(localPath))
                {
                    await workflow.CopyToAsync(stream);
                }

                // 🗃 Save deployment request
                var deployment = new DeploymentRequest
                {
                    RepoId = repoId,
                    BranchName = branch,
                    WorkflowFileName = workflowFileName,
                    Status = DeploymentStatusEnum.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                _db.DeploymentRequests.Add(deployment);
                await _db.SaveChangesAsync();

                // 🚀 GitHub Actions flow
                await CommitWorkflowToRepo(repo, branch, localPath, workflowFileName);
                await TriggerWorkflow(repo, branch, workflowFileName);
                await CaptureWorkflowRun(repo, deployment);

                return Ok(new
                {
                    deploymentId = deployment.Id,
                    status = deployment.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                // 🔴 Always return JSON
                return StatusCode(500, new
                {
                    message = "Deployment failed",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // 2️⃣ DEPLOYMENT STATUS API (UI POLLING)
        // =========================================================
        [HttpGet("status/{deploymentId}")]
        public async Task<IActionResult> GetDeploymentStatus(int deploymentId)
        {
            var deployment = await _db.DeploymentRequests
                .Include(d => d.Repository)
                .FirstOrDefaultAsync(d => d.Id == deploymentId);

            if (deployment == null)
                return NotFound(new { message = "Deployment not found" });

            if (deployment.GitHubRunId == null)
                return Ok(new { status = deployment.Status.ToString() });

            var repo = deployment.Repository!;
            var (owner, repoName) = ParseRepo(repo.Name);

            var client = CreateGitHubClient();
            var run = await client.Actions.Workflows.Runs.Get(
                owner,
                repoName,
                deployment.GitHubRunId.Value
            );

            if (run.Status == "completed")
            {
                deployment.CompletedAt = DateTime.UtcNow;
                deployment.Status = run.Conclusion == "success"
                    ? DeploymentStatusEnum.Success
                    : DeploymentStatusEnum.Failed;

                await _db.SaveChangesAsync();

                await FetchAndStoreWorkflowLogs(repo, deployment);
            }

            return Ok(new
            {
                status = deployment.Status.ToString(),
                conclusion = run.Conclusion
            });
        }

        // =========================================================
        // 3️⃣ FETCH BRANCHES
        // =========================================================
        [HttpGet("branches/{repoId}")]
        public async Task<IActionResult> GetBranches(int repoId)
        {
            var repo = await _db.Repositories.FirstOrDefaultAsync(r => r.Id == repoId);
            if (repo == null)
                return NotFound();

            var (owner, repoName) = ParseRepo(repo.Name);
            var client = CreateGitHubClient();

            var branches = await client.Repository.Branch.GetAll(owner, repoName);
            return Ok(branches.Select(b => new { name = b.Name }));
        }
        
        private async Task FetchAndStoreWorkflowLogs(
    RepoEntity repo,
    DeploymentRequest deployment
)
{
    if (deployment.GitHubRunId == null)
        return;

    var (owner, repoName) = ParseRepo(repo.Name);

    var token = _config["GitHubPAT"];
    if (string.IsNullOrWhiteSpace(token))
        throw new Exception("GitHubPAT missing");

    var logsRoot = Path.Combine(
        Directory.GetCurrentDirectory(),
        "uploads",
        "workflows",
        "logs",
        deployment.Id.ToString()
    );

    Directory.CreateDirectory(logsRoot);

    var zipPath = Path.Combine(logsRoot, "logs.zip");

    using var http = new HttpClient();
    http.DefaultRequestHeaders.UserAgent.ParseAdd("DeploymentChecker");
    http.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

    var url =
        $"https://api.github.com/repos/{owner}/{repoName}/actions/runs/{deployment.GitHubRunId}/logs";

    // 1️⃣ Download logs ZIP
    var bytes = await http.GetByteArrayAsync(url);
    await System.IO.File.WriteAllBytesAsync(zipPath, bytes);

    // 2️⃣ Extract ZIP
    System.IO.Compression.ZipFile.ExtractToDirectory(zipPath, logsRoot, true);

    // 3️⃣ Store logs in DB
    var logFiles = Directory.GetFiles(logsRoot, "*.txt", SearchOption.AllDirectories);

    foreach (var file in logFiles)
    {
        var content = await System.IO.File.ReadAllTextAsync(file);

        _db.DeploymentLogs.Add(new DeploymentLog
        {
            DeploymentRequestId = deployment.Id,
            StepName = Path.GetFileNameWithoutExtension(file),
            LogContent = content,
            CreatedAt = DateTime.UtcNow
        });
    }

    await _db.SaveChangesAsync();
}



        [HttpGet("logs/{deploymentId}")]
public async Task<IActionResult> GetDeploymentLogs(int deploymentId)
{
    var logs = await _db.DeploymentLogs
        .Where(l => l.DeploymentRequestId == deploymentId)
        .OrderBy(l => l.CreatedAt)
        .Select(l => new
        {
            step = l.StepName,
            content = l.LogContent
        })
        .ToListAsync();

    if (!logs.Any())
        return NotFound(new { message = "No logs found yet" });

    return Ok(logs);
}

        // =========================================================
        // 🔧 HELPERS
        // =========================================================

        private async Task CommitWorkflowToRepo(
            RepoEntity repo,
            string branch,
            string localPath,
            string workflowFileName
        )
        {
            var client = CreateGitHubClient();
            var (owner, repoName) = ParseRepo(repo.Name);

            var content = await System.IO.File.ReadAllTextAsync(localPath);
            var githubPath = $".github/workflows/{workflowFileName}";

            try
            {
                var existing = await client.Repository.Content
                    .GetAllContentsByRef(owner, repoName, githubPath, branch);

                await client.Repository.Content.UpdateFile(
                    owner,
                    repoName,
                    githubPath,
                    new UpdateFileRequest(
                        "Update workflow via deployment",
                        content,
                        existing[0].Sha,
                        branch
                    )
                );
            }
            catch (NotFoundException)
            {
                await client.Repository.Content.CreateFile(
                    owner,
                    repoName,
                    githubPath,
                    new CreateFileRequest(
                        "Add workflow via deployment",
                        content,
                        branch
                    )
                );
            }
        }

        private async Task TriggerWorkflow(
            RepoEntity repo,
            string branch,
            string workflowFileName
        )
        {
            var client = CreateGitHubClient();
            var (owner, repoName) = ParseRepo(repo.Name);

            await client.Actions.Workflows.CreateDispatch(
                owner,
                repoName,
                workflowFileName,
                new CreateWorkflowDispatch(branch)
            );
        }

        private async Task CaptureWorkflowRun(
            RepoEntity repo,
            DeploymentRequest deployment
        )
        {
            var client = CreateGitHubClient();
            var (owner, repoName) = ParseRepo(repo.Name);

            var runs = await client.Actions.Workflows.Runs.List(owner, repoName);

            var latest = runs.WorkflowRuns
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefault();

            deployment.GitHubRunId = latest?.Id;
            deployment.Status = DeploymentStatusEnum.Running;
            deployment.StartedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        private GitHubClient CreateGitHubClient()
        {
            var token = _config["GitHubPAT"];
            if (string.IsNullOrWhiteSpace(token))
                throw new Exception("GitHubPAT missing");

            return new GitHubClient(new ProductHeaderValue("DeploymentChecker"))
            {
                Credentials = new Credentials(token)
            };
        }

        private (string owner, string repo) ParseRepo(string fullName)
        {
            var parts = fullName.Split('/');
            return (parts[0], parts[1]);
        }
    }

    public class DeploymentCheckRequest
{
    public int RepoId { get; set; }
    public string Branch { get; set; } = string.Empty;
    public IFormFile Workflow { get; set; } = default!;
}

}
