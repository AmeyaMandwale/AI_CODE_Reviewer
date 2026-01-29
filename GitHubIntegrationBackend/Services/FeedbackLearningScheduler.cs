// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading;
// using System.Threading.Tasks;
// using System.Net.Http;
// using System.Text;
// using System.Text.Json;
// using Microsoft.Extensions.Hosting;
// using Microsoft.Extensions.Logging;
// using Microsoft.Extensions.Configuration;
// using Microsoft.EntityFrameworkCore;
// using GitHubIntegrationBackend.Data;
// using GitHubIntegrationBackend.Models;

// namespace GitHubIntegrationBackend.Services
// {


//     // ========================================================================
//     //  BACKGROUND SCHEDULER  (Processes unprocessed ReviewerFeedback)
//     // ========================================================================
//     public class FeedbackLearningScheduler : BackgroundService
// {
//     private readonly ILogger<FeedbackLearningScheduler> _logger;
//     private readonly IServiceProvider _services;
//     private readonly TimeSpan _interval;

//     public FeedbackLearningScheduler(ILogger<FeedbackLearningScheduler> logger, IServiceProvider services, IConfiguration config)
//     {
//         _logger = logger;
//         _services = services;
//         var seconds = int.TryParse(config["FeedbackLearning:IntervalSeconds"], out var s) ? s : 60;
//         _interval = TimeSpan.FromSeconds(Math.Max(10, seconds));
//     }

//     protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//     {
//         _logger.LogInformation("FeedbackLearningScheduler started. Interval: {s}s", _interval.TotalSeconds);

//         while (!stoppingToken.IsCancellationRequested)
//         {
//             try
//             {
//                 // Create a scope per iteration to get scoped services (DbContext etc.)
//                 using var scope = _services.CreateScope();
//                 var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
//                 var extractor = scope.ServiceProvider.GetRequiredService<LLMExtractorService>();
//                 var learning = scope.ServiceProvider.GetRequiredService<LearningService>();

//                 // Fetch up to 200 unprocessed feedbacks
//                 var unprocessed = await ctx.Feedbacks
//                     .Where(f => !f.Processed)
//                     .OrderBy(f => f.Id)
//                     .Take(200)
//                     .ToListAsync(stoppingToken);

//                 if (!unprocessed.Any())
//                 {
//                     _logger.LogDebug("No unprocessed feedbacks found.");
//                 }

//                 foreach (var fb in unprocessed)
//                 {
//                     try
//                     {
//                         // skip bot comments if you have a bot user id or name: simple heuristic
//                         // if (IsBotAuthor(fb.AuthorId))
//                         // {
//                         //     fb.Processed = true;
//                         //     fb.ProcessedAt = DateTime.UtcNow;
//                         //     continue;
//                         // }
//                         if (IsBotFeedback(fb))
// {
//     fb.Processed = true;
// fb.ProcessedAt = DateTime.UtcNow;

//     continue;
// }


//                         // Ensure repo exists
//                         var repo = await ctx.Repositories.FirstOrDefaultAsync(r => r.Id == fb.RepoId, stoppingToken);
//                         if (repo == null)
//                         {
//                             _logger.LogWarning("Repo not found for feedback id {id} repoId {repoId}", fb.Id, fb.RepoId);
//                             fb.Processed = true;
//                             fb.ProcessedAt = DateTime.UtcNow;
//                             continue;
//                         }

//                         // Extract rule
//                         var rule = await extractor.ExtractRuleAsync(fb.CommentBody, stoppingToken);

//                         if (string.IsNullOrWhiteSpace(rule))
//                         {
//                             _logger.LogInformation("Extraction returned empty for feedback {id}", fb.Id);
//                             fb.Processed = true;
//                             fb.ProcessedAt = DateTime.UtcNow;
//                             continue;
//                         }

//                         // Upsert into LearningJournal
//                         await learning.UpsertPatternAsync(repo.OrgId, repo.Id, rule, "human_feedback");

//                         // Mark processed
//                         fb.Processed = true;
//                         fb.ProcessedAt = DateTime.UtcNow;

//                         _logger.LogInformation("Processed feedback {id} -> rule: {rule}", fb.Id, rule);
//                     }
//                     catch (Exception innerEx)
//                     {
//                         _logger.LogError(innerEx, "Failed processing feedback id {id}", fb.Id);
//                         // Mark processed=false so it can be retried next time, or optionally mark processed true to skip
//                     }
//                 }

//                 await ctx.SaveChangesAsync(stoppingToken);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "FeedbackLearningScheduler loop error");
//             }

//             await Task.Delay(_interval, stoppingToken);
//         }
//     }

//     // private bool IsBotAuthor(int authorId)
//     // {
//     //     // Adapt to your project's bot user id(s). Example: skip system user id 1 or usernames by checking Users table.
//     //     return authorId == 1; // modify as needed
//     // }

//         private bool IsBotFeedback(ReviewerFeedback fb)
// {
//     if (fb == null) return false;

//     // Skip feedback generated by AI bot
//     if (!string.IsNullOrEmpty(fb.CommentBody) &&
//         fb.CommentBody.Contains("[AI-REVIEW]", StringComparison.OrdinalIgnoreCase))
//         return true;

//     // Skip if username of bot appears inside comment text (fallback)
//     if (fb.CommentBody.Contains("ctpl-s-ai-code-reviewer-bot", StringComparison.OrdinalIgnoreCase))
//         return true;

//     return false;
// }

// }
// }

// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading;
// using System.Threading.Tasks;
// using System.Net.Http;
// using System.Text.Json;
// using Microsoft.Extensions.Hosting;
// using Microsoft.Extensions.Logging;
// using Microsoft.Extensions.Configuration;
// using Microsoft.EntityFrameworkCore;
// using GitHubIntegrationBackend.Data;
// using GitHubIntegrationBackend.Models;

// namespace GitHubIntegrationBackend.Services
// {
//     // ========================================================================
//     //  BACKGROUND SCHEDULER (Fetches reviewer feedback + learns from them)
//     // ========================================================================
//     public class FeedbackLearningScheduler : BackgroundService
//     {
//         private readonly ILogger<FeedbackLearningScheduler> _logger;
//         private readonly IServiceProvider _services;
//         private readonly TimeSpan _interval;

//         public FeedbackLearningScheduler(
//             ILogger<FeedbackLearningScheduler> logger,
//             IServiceProvider services,
//             IConfiguration config)
//         {
//             _logger = logger;
//             _services = services;

//             var seconds = int.TryParse(config["FeedbackLearning:IntervalSeconds"], out var s) ? s : 60;
//             _interval = TimeSpan.FromSeconds(Math.Max(10, seconds));
//         }

//         protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//         {
//             _logger.LogInformation("FeedbackLearningScheduler started. Interval: {s}s", _interval.TotalSeconds);

//             while (!stoppingToken.IsCancellationRequested)
//             {
//                 try
//                 {
//                     using var scope = _services.CreateScope();
//                     var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
//                     var extractor = scope.ServiceProvider.GetRequiredService<LLMExtractorService>();
//                     var learning = scope.ServiceProvider.GetRequiredService<LearningService>();

//                     // ==========================================================
//                     // 1️⃣ STEP 1 — Fetch reviewer comments from GitHub
//                     // ==========================================================
//                     await FetchReviewerCommentsFromGitHub(ctx, stoppingToken);

//                     // ==========================================================
//                     // 2️⃣ STEP 2 — Process unprocessed feedback
//                     // ==========================================================
//                     var unprocessed = await ctx.Feedbacks
//                         .Where(f => !f.Processed)
//                         .OrderBy(f => f.Id)
//                         .Take(200)
//                         .ToListAsync(stoppingToken);

//                     if (!unprocessed.Any())
//                     {
//                         _logger.LogDebug("No unprocessed reviewer feedback found.");
//                     }

//                     foreach (var fb in unprocessed)
//                     {
//                         try
//                         {
//                             if (IsBotFeedback(fb))
//                             {
//                                 fb.Processed = true;
//                                 fb.ProcessedAt = DateTime.UtcNow;
//                                 continue;
//                             }

//                             var repo = await ctx.Repositories
//                                 .FirstOrDefaultAsync(r => r.Id == fb.RepoId, stoppingToken);

//                             if (repo == null)
//                             {
//                                 _logger.LogWarning("Repo not found for feedback id {id}", fb.Id);
//                                 fb.Processed = true;
//                                 fb.ProcessedAt = DateTime.UtcNow;
//                                 continue;
//                             }

//                             // Extract rule
//                             var rule = await extractor.ExtractRuleAsync(fb.CommentBody, stoppingToken);

//                             if (string.IsNullOrWhiteSpace(rule))
//                             {
//                                 _logger.LogInformation("Extraction empty for feedback {id}", fb.Id);
//                                 fb.Processed = true;
//                                 fb.ProcessedAt = DateTime.UtcNow;
//                                 continue;
//                             }

//                             // Save learned rule
//                             await learning.UpsertPatternAsync(repo.OrgId, repo.Id, rule, "human_feedback");

//                             fb.Processed = true;
//                             fb.ProcessedAt = DateTime.UtcNow;

//                             _logger.LogInformation("Processed feedback {id} -> rule: {rule}", fb.Id, rule);
//                         }
//                         catch (Exception innerEx)
//                         {
//                             _logger.LogError(innerEx, "Failed processing feedback {id}", fb.Id);
//                         }
//                     }

//                     await ctx.SaveChangesAsync(stoppingToken);
//                 }
//                 catch (Exception ex)
//                 {
//                     _logger.LogError(ex, "FeedbackLearningScheduler loop error");
//                 }

//                 await Task.Delay(_interval, stoppingToken);
//             }
//         }

//         // =====================================================================
//         // ⭐ NEW: FETCH REVIEWER COMMENTS FROM GITHUB AND INSERT INTO DB
//         // =====================================================================
//         private async Task FetchReviewerCommentsFromGitHub(AppDbContext ctx, CancellationToken ct)
// {
//     _logger.LogInformation("🔍 Fetching reviewer comments from GitHub...");

//     var openPrs = await ctx.PullRequests
//         .Include(p => p.Repository)
//         .Where(p => p.Status == "open")
//         .ToListAsync(ct);

//     if (!openPrs.Any())
//     {
//         _logger.LogInformation("No open PRs found for fetching comments.");
//         return;
//     }

//     foreach (var pr in openPrs)
//     {
//         try
//         {
//             var repo = pr.Repository;
//             var parts = repo.Name.Split('/');
//             var owner = parts[0];
//             var repoName = parts[1];

//             // Fetch comments from GitHub
//             var comments = await FetchCommentsFromGitHubApi(owner, repoName, pr.ExternalId);

//             foreach (var c in comments)
//             {
//                 // Skip bot comments
//                 if (c.body.Contains("[AI-REVIEW]", StringComparison.OrdinalIgnoreCase)) continue;
//                 if (c.user?.login?.Contains("bot", StringComparison.OrdinalIgnoreCase) == true) continue;

//                 // Skip duplicates by checking CommentBody
//                 bool exists = await ctx.Feedbacks.AnyAsync(
//                     f => f.CommentBody == c.body && f.RepoId == repo.Id,
//                     ct);

//                 if (exists) continue;

//                 // Save reviewer comment (minimal fields only)
//                 ctx.Feedbacks.Add(new ReviewerFeedback
//                 {
//                     RepoId = repo.Id,
//                     AuthorId = (int)(c.user?.id ?? 0), // cast long → int
//                     CommentBody = c.body,
//                     Processed = false
//                 });

//                 _logger.LogInformation("💬 Saved reviewer feedback (repo={repoId})", repo.Id);
//             }

//             await ctx.SaveChangesAsync(ct);
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Failed fetching comments for PR {prId}", pr.Id);
//         }
//     }
// }


//         // =====================================================================
//         // ⭐ GitHub API call for PR comments
//         // =====================================================================
//         private async Task<List<GithubCommentModel>> FetchCommentsFromGitHubApi(string owner, string repo, string prExternalId)
//         {
//             using var client = new HttpClient();
//             client.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");

//             string url = $"https://api.github.com/repos/{owner}/{repo}/issues/{prExternalId}/comments";

//             try
//             {
//                 var json = await client.GetStringAsync(url);
//                 return JsonSerializer.Deserialize<List<GithubCommentModel>>(json) ?? new List<GithubCommentModel>();
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine("❌ Failed to fetch GitHub comments: " + ex.Message);
//                 return new List<GithubCommentModel>();
//             }
//         }

//         // =====================================================================
//         // ⭐ BOT SKIP LOGIC
//         // =====================================================================
//         private bool IsBotFeedback(ReviewerFeedback fb)
//         {
//             if (fb == null) return false;

//             if (fb.CommentBody.Contains("[AI-REVIEW]", StringComparison.OrdinalIgnoreCase))
//                 return true;

//             if (fb.CommentBody.Contains("ctpl-s-ai-code-reviewer-bot", StringComparison.OrdinalIgnoreCase))
//                 return true;

//             return false;
//         }
//     }

//     // =====================================================================
//     // ⭐ MODELS FOR GITHUB COMMENT API
//     // =====================================================================
//     public class GithubCommentModel
//     {
//         public long id { get; set; }
//         public string body { get; set; }
//         public DateTime created_at { get; set; }
//         public GithubUser user { get; set; }
//     }

//     public class GithubUser
//     {
//         public long id { get; set; }
//         public string login { get; set; }
//     }
// }


using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text.Json;
using System.Net.Http.Headers;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;

namespace GitHubIntegrationBackend.Services
{
    public class FeedbackLearningScheduler : BackgroundService
    {
        private readonly ILogger<FeedbackLearningScheduler> _logger;
        private readonly IServiceProvider _services;
        private readonly TimeSpan _interval;

        public FeedbackLearningScheduler(
            ILogger<FeedbackLearningScheduler> logger,
            IServiceProvider services,
            IConfiguration config)
        {
            _logger = logger;
            _services = services;

            var seconds = int.TryParse(config["FeedbackLearning:IntervalSeconds"], out var s) ? s : 60;
            _interval = TimeSpan.FromSeconds(Math.Max(10, seconds));
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("FeedbackLearningScheduler started. Interval: {s}s", _interval.TotalSeconds);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _services.CreateScope();
                    var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var extractor = scope.ServiceProvider.GetRequiredService<LLMExtractorService>();
                    var learning = scope.ServiceProvider.GetRequiredService<LearningService>();
                    var prFileService = scope.ServiceProvider.GetRequiredService<GitHubPRFileService>();
                    var appAuth = scope.ServiceProvider.GetRequiredService<GitHubAppAuthService>();

                    // STEP 1 — Fetch reviewer comments
                    await FetchReviewerComments(ctx, prFileService, appAuth, stoppingToken);

                    // STEP 2 — Process unprocessed feedback
                    var unprocessed = await ctx.Feedbacks
                        .Where(f => !f.Processed)
                        .OrderBy(f => f.Id)
                        .Take(200)
                        .ToListAsync(stoppingToken);

                    foreach (var fb in unprocessed)
                    {
                        try
                        {
                            if (IsBotFeedback(fb))
                            {
                                fb.Processed = true;
                                fb.ProcessedAt = DateTime.UtcNow;
                                continue;
                            }

                            var repo = await ctx.Repositories
                                .FirstOrDefaultAsync(r => r.Id == fb.RepoId, stoppingToken);

                            if (repo == null)
                            {
                                fb.Processed = true;
                                fb.ProcessedAt = DateTime.UtcNow;
                                continue;
                            }

                            var rule = await extractor.ExtractRuleAsync(fb.CommentBody, stoppingToken);

                            if (string.IsNullOrWhiteSpace(rule))
                            {
                                fb.Processed = true;
                                fb.ProcessedAt = DateTime.UtcNow;
                                continue;
                            }

                            await learning.UpsertPatternAsync(repo.OrgId, repo.Id, rule, "human_feedback");

                            fb.Processed = true;
                            fb.ProcessedAt = DateTime.UtcNow;
                        }
                        catch (Exception innerEx)
                        {
                            _logger.LogError(innerEx, "Failed processing feedback id {id}", fb.Id);
                        }
                    }

                    await ctx.SaveChangesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "FeedbackLearningScheduler loop error");
                }

                await Task.Delay(_interval, stoppingToken);
            }
        }

        // =====================================================================
        // ⭐ STEP-1 — CHECK IF GITHUB APP HAS ACCESS TO REPO
        // =====================================================================
        private async Task<bool> AppHasAccessToRepo(string owner, string repo, GitHubAppAuthService appAuth)
        {
            try
            {
                var token = await appAuth.GetInstallationTokenAsync();

                using var http = new HttpClient();
                http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
                http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                var url = $"https://api.github.com/repos/{owner}/{repo}";
                var res = await http.GetAsync(url);

                return res.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        // =====================================================================
        // ⭐ Fetch Reviewer Comments (with APP ACCESS CHECK added)
        // =====================================================================
        private async Task FetchReviewerComments(
            AppDbContext ctx,
            GitHubPRFileService prFileService,
            GitHubAppAuthService appAuth,
            CancellationToken ct)
        {
            _logger.LogInformation("🔍 Fetching reviewer comments...");

            var openPrs = await ctx.PullRequests
                .Include(p => p.Repository)
                .Where(p => p.Status == "open")
                .ToListAsync(ct);

            if (!openPrs.Any())
            {
                _logger.LogInformation("No open PRs found.");
                return;
            }

            foreach (var pr in openPrs)
            {
                try
                {
                    var repo = pr.Repository;
                    var parts = repo.Name.Split('/');
                    var owner = parts[0];
                    var repoName = parts[1];

                    // ⭐ STEP-2 — SKIP IF GITHUB APP IS NOT INSTALLED
                    if (!await AppHasAccessToRepo(owner, repoName, appAuth))
                    {
                        _logger.LogWarning("🚫 App not installed on repo {repo}, skipping comment fetch.", repo.Name);
                        continue;
                    }

                    using var http = new HttpClient();
                    var token = await appAuth.GetInstallationTokenAsync();

                    http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
                    http.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", token);
                    http.DefaultRequestHeaders.Accept.Add(
                        new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

                    // Convert externalId → PR number
                    var prNumber = await prFileService
                        .GetPRNumberFromExternalId(http, owner, repoName, pr.ExternalId);

                    if (prNumber == null)
                    {
                        _logger.LogWarning("❌ Could not resolve PR number for externalId={ext}", pr.ExternalId);
                        continue;
                    }

                    // Fetch review comments using PR NUMBER
                    var comments = await FetchPullReviewComments(owner, repoName, prNumber.Value, token);

                    foreach (var c in comments)
                    {
                        if (c.body.Contains("[AI-REVIEW]", StringComparison.OrdinalIgnoreCase)) continue;
                        if (c.user?.login?.Contains("bot", StringComparison.OrdinalIgnoreCase) == true) continue;

                        bool exists = await ctx.Feedbacks.AnyAsync(
                            f => f.CommentBody == c.body && f.RepoId == repo.Id,
                            ct);

                        if (exists) continue;

                        // Fetch latest analysis for this PR
// Fetch latest analysis for this PR
var analysis = await ctx.AnalysisResults
    .Where(a => a.PrId == pr.Id)
    .OrderByDescending(a => a.RunAt)
    .FirstOrDefaultAsync(ct);

if (analysis == null)
{
    _logger.LogWarning("⚠ No AnalysisResult found for PR {prId}, skipping reviewer feedback insert", pr.Id);
    continue;
}

// Insert reviewer feedback
ctx.Feedbacks.Add(new ReviewerFeedback
{
    RepoId = repo.Id,
    AuthorId = (int)(c.user?.id ?? 0),
    CommentBody = c.body,
    Processed = false,
    AnalysisId = analysis.Id   // <-- REQUIRED FOREIGN KEY
});

_logger.LogInformation("💬 Saved reviewer feedback for repo={RepoId}, analysis={AnalysisId}", 
    repo.Id, analysis.Id);
                    }

                    await ctx.SaveChangesAsync(ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed fetching comments for PR {id}", pr.Id);
                }
            }
        }

        // =====================================================================
        // ⭐ Fetch review comments using PR NUMBER
        // =====================================================================
        private async Task<List<GithubCommentModel>> FetchPullReviewComments(
            string owner, string repo, int prNumber, string token)
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

            string url = $"https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}/comments";

            try
            {
                var json = await client.GetStringAsync(url);
                return JsonSerializer.Deserialize<List<GithubCommentModel>>(json)
                    ?? new List<GithubCommentModel>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to fetch GitHub comments: {ex.Message}");
                return new List<GithubCommentModel>();
            }
        }

        private bool IsBotFeedback(ReviewerFeedback fb)
        {
            if (fb.CommentBody.Contains("[AI-REVIEW]", StringComparison.OrdinalIgnoreCase)) return true;
            if (fb.CommentBody.Contains("ctpl-s-ai-code-reviewer-bot", StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }
    }

    public class GithubCommentModel
    {
        public long id { get; set; }
        public string body { get; set; }
        public DateTime created_at { get; set; }
        public GithubUser user { get; set; }
    }

    public class GithubUser
    {
        public long id { get; set; }
        public string login { get; set; }
    }
}
