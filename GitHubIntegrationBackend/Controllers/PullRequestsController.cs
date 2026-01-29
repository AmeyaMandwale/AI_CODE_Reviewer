using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Models;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Services;
using System.Text.Json;
using GitHubIntegrationBackend.Dto;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
[Route("api/[controller]")]
public class PullRequestController : ControllerBase
{
    private readonly PullRequestService _service;
    private readonly AppDbContext _context;

    public PullRequestController(PullRequestService service, AppDbContext context)
    {
        _service = service;
        _context = context;
    }

        // ✅ GET: api/pullrequests
        [HttpGet]
        public async Task<IActionResult> GetAllPRs()
        {
            var prs = await _context.PullRequests
                        .Include(p => p.Repository)
                        .ToListAsync();

            return Ok(prs);
        }

        // ✅ GET: api/pullrequests/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPRById(int id)
        {
            var pr = await _context.PullRequests
                        .Include(p => p.Repository)
                        .FirstOrDefaultAsync(p => p.Id == id);

            if (pr == null) return NotFound("Pull Request not found");

            return Ok(pr);
        }

        // ✅ GET: api/pullrequests/repo/{repoId}
        [HttpGet("repo/{repoId}")]
        public async Task<IActionResult> GetPRsByRepo(int repoId)
        {
            var prs = await _context.PullRequests
                        .Where(p => p.RepoId == repoId)
                        .Include(p => p.Repository)
                        .ToListAsync();

            return Ok(prs);
        }

        // ✅ POST: api/pullrequests
        // Used by webhook
        [HttpPost]
        public async Task<IActionResult> CreatePR([FromBody] PullRequest body)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Optional: Validate repo exists
            var repo = await _context.Repositories.FindAsync(body.RepoId);
            if (repo == null)
                return BadRequest("Repository not found");

            var pr = new PullRequest
            {
                RepoId = body.RepoId,
                ExternalId = body.ExternalId,
                Title = body.Title,
                AuthorId = body.AuthorId,
                Status = string.IsNullOrWhiteSpace(body.Status) ? "open" : body.Status,
                CreatedAt = DateTime.UtcNow
            };

            _context.PullRequests.Add(pr);
            await _context.SaveChangesAsync();

            return Ok(pr);
        }
        
        [HttpPost("sync/{repoId}")]
    public async Task<IActionResult> SyncPRs(int repoId)
    {
        var repo = await _context.Repositories.FindAsync(repoId);
        if (repo == null) return NotFound("Repository not found");

        var integration = await _context.Integrations
            .FirstOrDefaultAsync(i => i.Provider == repo.Provider && i.OrgId == repo.OrgId);

        if (integration == null)
            return BadRequest("GitHub authentication not found");

        if (repo.Provider == "gitlab")
{
    await _service.SyncPullRequestsFromGitLab(repoId, integration.Config);
}
else
{
    await _service.SyncPullRequestsFromGitHub(repoId, integration.Config);
}

        return Ok("PRs synced");
    }


        // ✅ PUT: api/pullrequests/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePR(int id, [FromBody] PullRequest body)
        {
            var pr = await _context.PullRequests.FindAsync(id);
            if (pr == null) return NotFound("Pull Request not found");

            pr.Title = body.Title ?? pr.Title;
            pr.Status = body.Status ?? pr.Status;
            pr.AuthorId = body.AuthorId != default ? body.AuthorId : pr.AuthorId;

            _context.PullRequests.Update(pr);
            await _context.SaveChangesAsync();

            return Ok(pr);
        }

        // ✅ PUT: api/pullrequests/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdatePRStatus(int id, [FromBody] string newStatus)
        {
            var pr = await _context.PullRequests.FindAsync(id);
            if (pr == null) return NotFound("Pull Request not found");

            pr.Status = newStatus;
            _context.PullRequests.Update(pr);
            await _context.SaveChangesAsync();

            return Ok(pr);
        }

        // ✅ DELETE: api/pullrequests/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePR(int id)
        {
            var pr = await _context.PullRequests.FindAsync(id);
            if (pr == null) return NotFound("Pull Request not found");

            _context.PullRequests.Remove(pr);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pull Request deleted" });
        }

    }
}
