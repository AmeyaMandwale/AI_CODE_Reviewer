using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Services;
using GitHubIntegrationBackend.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Text.Json;
using System.Net.Http.Headers;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/sast")]
    public class SastController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly GitHubCommentService _comments;
        private readonly SastService _sast;
        private readonly AnalysisResultService _analysis;
        private readonly PdfService _pdf;
        private readonly AppDbContext _ctx;

        public SastController(
            IConfiguration config,
            GitHubCommentService comments,
            SastService sast,
            AnalysisResultService analysis,
            PdfService pdf,
            AppDbContext ctx)
        {
            _config = config;
            _comments = comments;
            _sast = sast;
            _analysis = analysis;
            _pdf = pdf;
            _ctx = ctx;
        }

        [HttpGet("trigger")]
        public async Task<IActionResult> Trigger(string owner, string repo, int pr, long exp, string sig)
        {
            Console.WriteLine("=== SAST Trigger Started ===");
            Console.WriteLine($"Owner={owner}, Repo={repo}, PR={pr}");

            // Validate signature
            string secret = _config["SastTriggerSecret"] ?? "";
            if (!SastTriggerUrlHelper.ValidateSignature(owner, repo, pr, exp, sig, secret))
                return BadRequest("❌ Invalid SAST trigger link");

            // Create temp work folder
            string tempDir = Path.Combine(Path.GetTempPath(), $"sast_{Guid.NewGuid()}");
            Directory.CreateDirectory(tempDir);

            try
            {
                // Clone repo using PAT
                string pat = _config["GitHubPAT"] ?? "";
                string cloneUrl = $"https://{pat}@github.com/{owner}/{repo}.git";

                Console.WriteLine("📥 Cloning repo...");
                var clone = Process.Start(new ProcessStartInfo
                {
                    FileName = "git",
                    Arguments = $"clone {cloneUrl} \"{tempDir}\" --depth=1",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                });
                clone!.WaitForExit();

                // Fetch PR branch
                Console.WriteLine("📥 Fetching PR branch...");
                Process.Start(new ProcessStartInfo
                {
                    FileName = "git",
                    Arguments = $"fetch origin pull/{pr}/head:pr-{pr}",
                    WorkingDirectory = tempDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                })!.WaitForExit();

                // Checkout PR branch
                Console.WriteLine("📀 Checking out PR...");
                Process.Start(new ProcessStartInfo
                {
                    FileName = "git",
                    Arguments = $"checkout pr-{pr}",
                    WorkingDirectory = tempDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                })!.WaitForExit();

                // Install dependencies (for SCA)
                Console.WriteLine("📦 Installing dependencies for SCA...");
                var install = Process.Start(new ProcessStartInfo
                {
                    FileName = "npm.cmd",
                    Arguments = "install --force",
                    WorkingDirectory = tempDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                });
                install!.WaitForExit();

                // Run Snyk SCA & SAST
                Console.WriteLine("🔍 Running Snyk SCA...");
                string? scaHtml = await _sast.RunScaHtmlAsync(tempDir);

                Console.WriteLine("🛡 Running Snyk SAST...");
                string? sastHtml = await _sast.RunSastHtmlAsync(tempDir);

                // Build combined HTML & PDF
                string html = _sast.BuildCombinedSnykReport(scaHtml, sastHtml, owner, repo, pr);
                byte[] pdfBytes = _pdf.GeneratePdf(html);

                string reportsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "sast-reports");
                Directory.CreateDirectory(reportsDir);

                string fileName = $"SAST_SCA_{pr}_{DateTime.UtcNow:yyyyMMdd}.pdf";
                string pdfDiskPath = Path.Combine(reportsDir, fileName);

                await System.IO.File.WriteAllBytesAsync(pdfDiskPath, pdfBytes);

                string baseUrl = (_config["PublicBaseUrl"] ?? "").TrimEnd('/');
                string pdfUrl = $"{baseUrl}/sast-reports/{fileName}";

                Console.WriteLine("📄 PDF saved: " + pdfUrl);

                //-----------------------------
                // 🔟 FIX: Resolve PR external ID (GitHub long ID)
                //-----------------------------
                Console.WriteLine("🔎 Fetching GitHub PR metadata to resolve ExternalId...");

                using var http = new HttpClient();
                http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
                http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", pat);
                http.DefaultRequestHeaders.Accept.Add(
                    new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

                string prUrl = $"https://api.github.com/repos/{owner}/{repo}/pulls/{pr}";
                var prRes = await http.GetStringAsync(prUrl);

                var prDoc = JsonDocument.Parse(prRes);

                long externalId = prDoc.RootElement.GetProperty("id").GetInt64();
                string externalPrId = externalId.ToString();

                Console.WriteLine($"✔ GitHub external PR ID resolved: {externalPrId}");

                //-----------------------------
                // 🔟 FIX: Repo name must match "owner/repo"
                //-----------------------------
                string repoFullName = $"{owner}/{repo}";

                var prDb = await _ctx.PullRequests
                    .Include(p => p.Repository)
                    .FirstOrDefaultAsync(p =>
                        p.ExternalId == externalPrId &&
                        p.Repository.Name == repoFullName);

                if (prDb == null)
                {
                    Console.WriteLine($"❌ PR not found in DB: externalId={externalPrId}, repo={repoFullName}");
                    return BadRequest($"❌ PR {pr} not found in DB.");
                }

                Console.WriteLine($"✔ DB PR Found: DB_ID={prDb.Id}");

                //-----------------------------
                // 1️⃣1️⃣ Save analysis result
                //-----------------------------
                await _analysis.SaveAnalysisAsync(prDb.Id, html, "Snyk", "SAST+SCA");

                //-----------------------------
                // 1️⃣2️⃣ Post comment on GitHub
                //-----------------------------
                string md =
                    "### 🔒 SAST & SCA Security Scan (Snyk)\n\n" +
                    "Security scan completed.\n\n" +
                    (scaHtml != null ? "📦 **SCA:** Issues found.\n" : "📦 **SCA:** No dependency issues.\n") +
                    (sastHtml != null ? "🛡 **SAST:** Issues found.\n" : "🛡 **SAST:** No code vulnerabilities.\n") +
                    $"\n📄 **Full Report:** [Download PDF]({pdfUrl})\n";

                await _comments.AddSastResultCommentAsync(owner, repo, pr, md);

                Console.WriteLine("✅ SAST + SCA Completed Successfully");
            }
            finally
            {
                try { Directory.Delete(tempDir, true); } catch { }
            }

            return Redirect($"https://github.com/{owner}/{repo}/pull/{pr}");
        }
    }
} 