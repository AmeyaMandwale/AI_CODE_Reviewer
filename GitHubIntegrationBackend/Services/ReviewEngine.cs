// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading;
// using System.Threading.Tasks;
// using System.Net.Http;
// using System.Text;
// using Microsoft.Extensions.Logging;
// using Microsoft.EntityFrameworkCore;
// using GitHubIntegrationBackend.Data;
// using GitHubIntegrationBackend.Models;
// using GitHubIntegrationBackend.Dto;
// namespace GitHubIntegrationBackend.Services
// {
//     public class ReviewEngine
//     {
//         private readonly AppDbContext _ctx;
//         private readonly PRFileSyncService _prFileSync;
//         private readonly PromptBuilder _promptBuilder;
//         private readonly GeminiService _gemini;
//         private readonly AnalysisResultService _analysisService;
//         private readonly GitHubCommentService _githubComment;
//         private readonly GitLabCommentService _gitlabComment;
//         private readonly JiraValidator _jiraValidator;
//         private readonly JiraService _jiraService;
//         private readonly ILogger<ReviewEngine> _logger;

//         public ReviewEngine(
//             AppDbContext ctx,
//             PRFileSyncService prFileSync,
//             PromptBuilder promptBuilder,
//             GeminiService gemini,
//             AnalysisResultService analysisService,
//             GitHubCommentService githubComment,
//             GitLabCommentService gitlabComment,
//             JiraValidator jiraValidator,
//             JiraService jiraService,
//             ILogger<ReviewEngine> logger)
//         {
//             _ctx = ctx;
//             _prFileSync = prFileSync;
//             _promptBuilder = promptBuilder;
//             _gemini = gemini;
//             _analysisService = analysisService;
//             _githubComment = githubComment;
//             _gitlabComment = gitlabComment;
//             _jiraValidator = jiraValidator;
//             _jiraService = jiraService;
//             _logger = logger;
//         }

//         public async Task ReviewPullRequestAsync(int prId, CancellationToken ct = default)
// {   
//     _logger.LogWarning("🧪 REVIEWENGINE LOADED — BUILD VERSION X1");

//     _logger.LogInformation("🔥 Starting ReviewEngine for PR {prId}", prId);

//     JiraIssueDto? matchedIssue = null;

//     var pr = await _ctx.PullRequests
//         .Include(p => p.Repository)
//         .FirstOrDefaultAsync(p => p.Id == prId, ct);

//     if (pr == null)
//         throw new Exception("❌ PR not found");

//     // STEP 1 — Sync PR files
//     try
//     {
//         await _prFileSync.SyncPRFiles(prId);
//     }
//     catch (Exception ex)
//     {
//         _logger.LogError(ex, "⚠️ SyncPRFiles error");
//     }

//     // STEP 2 — Load PR files
//     var files = await _ctx.PRFiles
//         .Where(f => f.PrId == prId)
//         .ToListAsync(ct);

//     if (!files.Any())
//     {
//         _logger.LogWarning("❌ No PRFiles found — aborting review.");
//         return;
//     }

//     var repo = pr.Repository!;
//     var provider = repo.Provider?.ToLower() ?? "github";

//     // ⭐ STEP 3 — JIRA VALIDATION (MUST BE BEFORE PROMPT BUILD)
//     _logger.LogWarning("🚨 ENTERING JIRA VALIDATION BLOCK 🚨");

//     try
//     {
//         var titleOrBranch = pr.Title ?? "";
//         var authorLogin = "AmeyaMandwale";

//         _logger.LogWarning("🚨 JIRA VALIDATOR CALLED with title: {title}", titleOrBranch);

//         var jiraResult = await _jiraValidator.ValidatePrAgainstJiraAsync(titleOrBranch, authorLogin, ct);

//         if (jiraResult.Issue != null)
//         {
//             matchedIssue = jiraResult.Issue;
//             _logger.LogInformation("📌 Jira issue found: {key}", matchedIssue.Key);
//         }

//         if (!jiraResult.IsValid)
//             _logger.LogWarning("⚠ Jira validation failed: {msg}", jiraResult.Message);
//     }
//     catch (Exception ex)
//     {
//         _logger.LogError(ex, "❌ Jira validation crashed");
//     }

//     // ⭐ STEP 4 — BUILD PROMPT WITH JIRA INFO
//     var prompt = await _promptBuilder.BuildPromptAsync(repo, files, matchedIssue);

//     // ⭐ STEP 5 — GEMINI CALL
//     var aiResponse = await _gemini.GenerateAsync(prompt, ct) ?? "No analysis returned.";

//     // STEP 6 — Prepare Comment
//     var finalComment = new StringBuilder();
//     finalComment.AppendLine("[AI-REVIEW]");
//     finalComment.AppendLine();
//     finalComment.AppendLine(aiResponse);

//     // STEP 7 — Post Comment (Same as before)
//     try
//     {
//         var parts = repo.Name.Split('/');
//         var owner = parts[0];
//         var repoName = parts[1];

//         if (provider == "github")
//         {
//             await _githubComment.AddCommentAsync(owner, repoName, pr.ExternalId, finalComment.ToString());
//         }
//         else
//         {
//             await _gitlabComment.AddCommentAsync(pr.ExternalId!, finalComment.ToString());
//         }

//         _logger.LogInformation("💬 Posted AI review comment");
//     }
//     catch (Exception ex)
//     {
//         _logger.LogError(ex, "❌ Failed to post review comment");
//     }

//     // STEP 8 — Save Analysis
//     try
//     {
//         await _analysisService.SaveAnalysisAsync(prId, finalComment.ToString(), "Gemini", "AI-Review");
//     }
//     catch (Exception ex)
//     {
//         _logger.LogError(ex, "❌ Failed to save analysis");
//     }
// }

//         private async Task PostDirectPRComment(string owner, string repo, string externalId, string comment)
//         {
//             using var http = new HttpClient();
//             http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");

//             string url = $"https://api.github.com/repos/{owner}/{repo}/issues/{externalId}/comments";

//             var payload = new { body = comment };
//             var res = await http.PostAsJsonAsync(url, payload);

//             Console.WriteLine($"Fallback comment status: {res.StatusCode}");
//         }
//     }
// }
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;

namespace GitHubIntegrationBackend.Services
{
    /// <summary>
    /// REVIEWENGINE IS NOW IN "OPTION B" MODE:
    /// - It does NOT run Gemini
    /// - It does NOT run Jira
    /// - It ONLY ensures PR files stay synced (optional)
    /// The full AI review pipeline is now handled ONLY in PRFileSyncService.
    /// </summary>
    public class ReviewEngine
    {
        private readonly AppDbContext _ctx;
        private readonly PRFileSyncService _prFileSync;
        private readonly ILogger<ReviewEngine> _logger;

        public ReviewEngine(
            AppDbContext ctx,
            PRFileSyncService prFileSync,
            ILogger<ReviewEngine> logger)
        {
            _ctx = ctx;
            _prFileSync = prFileSync;
            _logger = logger;
        }

        public async Task ReviewPullRequestAsync(int prId, CancellationToken ct = default)
        {
            _logger.LogInformation("⚙ ReviewEngine invoked for PR {prId}", prId);

            var pr = await _ctx.PullRequests
                .Include(p => p.Repository)
                .FirstOrDefaultAsync(p => p.Id == prId, ct);

            if (pr == null)
            {
                _logger.LogError("❌ PR not found for ReviewEngine: {prId}", prId);
                return;
            }

            // OPTIONAL: Sync only PR file metadata
            try
            {
                _logger.LogInformation("📁 Syncing PR files through ReviewEngine wrapper…");
                await _prFileSync.SyncPRFiles(prId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠ File sync error inside ReviewEngine wrapper");
            }

            _logger.LogInformation("✅ ReviewEngine completed (AI review is handled in PRFileSyncService)");
        }
    }
}