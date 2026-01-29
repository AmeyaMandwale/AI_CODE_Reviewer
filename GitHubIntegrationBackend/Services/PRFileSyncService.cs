// using GitHubIntegrationBackend.Data;
// using GitHubIntegrationBackend.Services;
// using Microsoft.EntityFrameworkCore;
// using GitHubIntegrationBackend.Models;

// public class PRFileSyncService
// {
//     private readonly AppDbContext _ctx;
//     private readonly GitHubPRFileService _githubPRFileService;
//     private readonly GitLabPRFileService _gitlabPRFileService;
//     private readonly RulePackService _rules;
//     private readonly GeminiService _gemini;
//      private readonly GitLabCommentService _gitlabComment;
// private readonly GitHubCommentService _githubComment;

// private readonly AnalysisResultService _analysisResultService;
//     public PRFileSyncService(AppDbContext ctx, GitHubPRFileService githubPRFileService,  GitLabPRFileService gitlabPRFileService, GeminiService gemini,
//     GitHubCommentService githubComment, GitLabCommentService gitlabComment,RulePackService rules,AnalysisResultService analysisResultService)
//     {
//         _ctx = ctx;
//         _githubPRFileService = githubPRFileService;
//          _gitlabPRFileService = gitlabPRFileService;
//          _gemini = gemini;
//     _githubComment = githubComment;
//      _gitlabComment = gitlabComment;
//     _rules = rules;
//     _analysisResultService = analysisResultService;
//     }



//    public async Task SyncPRFiles(int prId)
// {
//     var pr = await _ctx.PullRequests.Include(p => p.Repository).FirstOrDefaultAsync(p => p.Id == prId);
//     if (pr == null)
//         throw new Exception("PR not found");

//     var provider = pr.Repository.Provider.ToLower();   // github | gitlab
//     var files = new List<dynamic>();

//     if (provider == "github")
//     {
//         var parts = pr.Repository.Name.Split('/');
//         if (parts.Length != 2)
//             throw new Exception("Invalid GitHub repository name format. Expected: owner/repo");

//         var owner = parts[0];
//         var repo = parts[1];

//         var result = await _githubPRFileService.GetPRFilesAsync(owner, repo, pr.ExternalId);
//         files.AddRange(result);
//     }
//     else if (provider == "gitlab")
// {
//     if (string.IsNullOrWhiteSpace(pr.ExternalId))
//         throw new Exception("GitLab ExternalId missing");

//     var parts = pr.ExternalId.Split(':');
//     if (parts.Length != 2)
//         throw new Exception($"Invalid ExternalId format for GitLab PR: {pr.ExternalId}");

//     var iid = parts[0];
//     var projectId = parts[1];

//     var result = await _gitlabPRFileService.GetPRFilesAsync(projectId, iid);
//     files.AddRange(result);
// }

//     else
//     {
//         throw new Exception($"Unknown provider: {provider}");
//     }

//     // remove old files
//     var old = _ctx.PRFiles.Where(f => f.PrId == prId);
//     _ctx.PRFiles.RemoveRange(old);

//     // add new files
//     foreach (var f in files)
//     {
//         if (provider == "github")
//         {
//             var gh = (GitHubFileDto)f;
//             _ctx.PRFiles.Add(new PRFile
//             {
//                 PrId = prId,
//                 Path = gh.filename,
//                 ChangeType = gh.status,
//                 Diff = gh.patch
//             });
//         }
//         else if (provider == "gitlab")
//         {
//             var gl = (GitLabFileDto)f;
//             _ctx.PRFiles.Add(new PRFile
//             {
//                 PrId = prId,
//                 Path = gl.new_path,
//                 ChangeType = "modified",  // GitLab does not provide exact change type
//                 Diff = gl.diff
//             });
//         }
//     }

//     await _ctx.SaveChangesAsync();

//     // -------------------------------------------------
//         // 2️⃣ CHECK IF NEW COMMITS EXIST (OPTION B LOGIC)
//         // -------------------------------------------------

//         var http = new HttpClient();
//         http.DefaultRequestHeaders.UserAgent.ParseAdd("App");

//         bool shouldRunGemini = false;

//         if (provider == "github")
//         {
//             var parts = pr.Repository.Name.Split('/');
//             var owner = parts[0];
//             var repo = parts[1];

//             var prNumber = await _githubPRFileService
//                 .GetPRNumberFromExternalId(http, owner, repo, pr.ExternalId);
//              if (prNumber == null)
// {
//     Console.WriteLine($"⚠ Cannot resolve PR number for PR {pr.Id}. ExternalId={pr.ExternalId}");
//     return;
// }
//             var lastCommit = await _githubPRFileService
//                 .GetLastCommitTimeAsync(http, owner, repo, prNumber.Value);

//             var lastAIComment = await _githubComment
//                 .GetLastAICommentTimeAsync(http, owner, repo, prNumber.Value);

//             shouldRunGemini = lastAIComment == null || lastCommit > lastAIComment;
//         }
//         else if (provider == "gitlab")
//         {
//             var parts = pr.ExternalId.Split(':');
//             var iid = parts[0];
//             var projectId = parts[1];

//             var lastCommit = await _gitlabPRFileService
//                 .GetLastCommitTimeAsync(http, projectId, iid);

//             var lastAIComment = await _gitlabComment
//                 .GetLastAICommentTimeAsync(projectId, iid, http);

//             bool isNewMR = lastAIComment == null && files.Count > 0;

// shouldRunGemini = isNewMR;
//         }

//         if (!shouldRunGemini)
//         {
//             Console.WriteLine($"⏭ Skipping Gemini for PR {pr.Id} — no new commits.");
//             return;
//         }

//     //  var ruleContent = await _rules.GetEnabledRulesForOrg(pr.Repository.OrgId);
// var ruleContent = await _rules.GetEnabledRulesForRepo(
//     pr.Repository.OrgId,
//     pr.Repository.Name
// );
// Console.WriteLine("Rule ->"+ ruleContent);
//         // --------------------------
//         // 🔹 5. Build AI Prompt (350 words)
//         // --------------------------
//         var fileBlocks = string.Join("\n\n", files.Select(f =>
//             provider == "github"
//                 ? $"FILE: {((GitHubFileDto)f).filename}\nPATCH:\n{((GitHubFileDto)f).patch}"
//                 : $"FILE: {((GitLabFileDto)f).new_path}\nPATCH:\n{((GitLabFileDto)f).diff}"
//         ));

//         var fullPrompt = $@"
// You are a senior code reviewer AI.  
// Follow these RULES strictly also mention which rule not followed:

// {ruleContent}

// Below is the pull request code diff:

// {fileBlocks}

// Generate a **350-word structured review** containing:

// 1. Summary (100–120 words)
// 2. Major Suggestions (150–180 words)
// 3. Key Changes (80–100 words)

// Be developer-friendly and apply the above rulepacks.
// ";

//         // --------------------------
//         // 🔹 6. Generate Gemini Analysis
//         // --------------------------
//         var analysis = await _gemini.GenerateAsync(fullPrompt);
//          var finalComment = "[AI-REVIEW]\n\n" + analysis;
//         // --------------------------
//         // 🔹 7. Post PR Comment (GitHub only)
//         // --------------------------
//         if (provider == "github")
//         {
//             var parts = pr.Repository.Name.Split('/');
//             var owner = parts[0];
//             var repo = parts[1];

//            // string? reportUrl= await GetReportUrlByRepoAsync(repo);
//            //await _githubComment.AddCommentAsync(owner, repo, pr.ExternalId!, finalComment);
//             await _githubComment.AddCommentWithReportAsync(
//                 owner,
//                 repo,
//                 pr.ExternalId,
//                 finalComment,
//                 // reportUrl  
//                 "http://localhost:5142/reports/Ctpl-Code-Reviewer/SonarReport_20251120_053241.pdf"

//             );


//         }
//          else if (provider == "gitlab")
//         {
//             await _gitlabComment.AddCommentAsync(pr.ExternalId!, finalComment);
//         }

// // SAVE ANALYSIS RESULT INTO DB
// await _analysisResultService.SaveAnalysisAsync(
//     prId,
//     finalComment,
//     "Gemini",
//     "AI-Review"
// );

// }

// // TO FETCH URL OF GENERATED SONARQUBE REPORT
// public async Task<string?> GetReportUrlByRepoAsync(string repo)
// {
//     var report = await _ctx.ReportFiles
//         .Where(r => r.ProjectKey == repo)
//         .OrderByDescending(r => r.CreatedAt)
//         .FirstOrDefaultAsync();

//     return report?.FileUrl;
// }


// }
//<---------------------Code 1--------------------------->
// using GitHubIntegrationBackend.Data;
// using GitHubIntegrationBackend.Services;
// using GitHubIntegrationBackend.Utils;
// using Microsoft.EntityFrameworkCore;
// using GitHubIntegrationBackend.Models;

// public class PRFileSyncService
// {
//     private readonly AppDbContext _ctx;
//     private readonly GitHubPRFileService _githubPRFileService;
//     private readonly GitLabPRFileService _gitlabPRFileService;
//     private readonly RulePackService _rules;
//     private readonly GeminiService _gemini;
//     private readonly GitLabCommentService _gitlabComment;
//     private readonly GitHubCommentService _githubComment;
//     private readonly AnalysisResultService _analysisResultService;
//     private readonly IConfiguration _config;

//     public PRFileSyncService(
//         AppDbContext ctx,
//         GitHubPRFileService githubPRFileService,
//         GitLabPRFileService gitlabPRFileService,
//         GeminiService gemini,
//         GitHubCommentService githubComment,
//         GitLabCommentService gitlabComment,
//         RulePackService rules,
//         AnalysisResultService analysisResultService,
//         IConfiguration config)
//     {
//         _ctx = ctx;
//         _githubPRFileService = githubPRFileService;
//         _gitlabPRFileService = gitlabPRFileService;
//         _gemini = gemini;
//         _githubComment = githubComment;
//         _gitlabComment = gitlabComment;
//         _rules = rules;
//         _analysisResultService = analysisResultService;
//         _config = config;   // ⭐ newly added
//     }

//     public async Task SyncPRFiles(int prId)
//     {
//         Console.WriteLine($"\n========== 🔄 SyncPRFiles START — PR {prId} ==========");

//         var pr = await _ctx.PullRequests.Include(p => p.Repository).FirstOrDefaultAsync(p => p.Id == prId);
//         if (pr == null) throw new Exception("❌ PR not found");

//         var provider = pr.Repository.Provider.ToLower();
//         var files = new List<dynamic>();

//         // FETCH FILES
//         if (provider == "github")
//         {
//             var parts = pr.Repository.Name.Split('/');
//             var owner = parts[0];
//             var repo = parts[1];

//             var result = await _githubPRFileService.GetPRFilesAsync(owner, repo, pr.ExternalId);
//             files.AddRange(result);
//         }
//         else if (provider == "gitlab")
//         {
//             var parts = pr.ExternalId.Split(':');
//             var iid = parts[0];
//             var projectId = parts[1];

//             var result = await _gitlabPRFileService.GetPRFilesAsync(projectId, iid);
//             files.AddRange(result);
//         }

//         // SAVE PR FILES
//         var old = _ctx.PRFiles.Where(f => f.PrId == prId);
//         _ctx.PRFiles.RemoveRange(old);

//         foreach (var f in files)
//         {
//             if (provider == "github")
//             {
//                 var gh = (GitHubFileDto)f;
//                 _ctx.PRFiles.Add(new PRFile
//                 {
//                     PrId = prId,
//                     Path = gh.filename,
//                     ChangeType = gh.status,
//                     Diff = gh.patch
//                 });
//             }
//             else
//             {
//                 var gl = (GitLabFileDto)f;
//                 _ctx.PRFiles.Add(new PRFile
//                 {
//                     PrId = prId,
//                     Path = gl.new_path,
//                     ChangeType = "modified",
//                     Diff = gl.diff
//                 });
//             }
//         }

//         await _ctx.SaveChangesAsync();

//         // CHECK NEED FOR AI REVIEW
//         var http = new HttpClient();
//         http.DefaultRequestHeaders.UserAgent.ParseAdd("App");

//         bool shouldRunGemini = true;

//         if (provider == "github")
//         {
//             var parts = pr.Repository.Name.Split('/');
//             var owner = parts[0];
//             var repo = parts[1];

//             var prNumber = await _githubPRFileService.GetPRNumberFromExternalId(http, owner, repo, pr.ExternalId);
//             if (prNumber == null) return;

//             var lastCommit = await _githubPRFileService.GetLastCommitTimeAsync(http, owner, repo, prNumber.Value);
//             var lastAIComment = await _githubComment.GetLastAICommentTimeAsync(http, owner, repo, prNumber.Value);

//             shouldRunGemini = lastAIComment == null || lastCommit > lastAIComment;
//         }

//         if (!shouldRunGemini) return;

//         // LOAD RULES
//         var ruleContent = await _rules.GetEnabledRulesForRepo(pr.Repository.OrgId, pr.Repository.Name);

//         // BUILD PROMPT
//         var fileBlocks = string.Join("\n\n", files.Select(f =>
//             provider == "github"
//                 ? $"FILE: {((GitHubFileDto)f).filename}\nPATCH:\n{((GitHubFileDto)f).patch}"
//                 : $"FILE: {((GitLabFileDto)f).new_path}\nPATCH:\n{((GitLabFileDto)f).diff}"
//         ));

//         var fullPrompt = $@"
// You are a senior code reviewer AI.  
// Follow these RULES strictly also mention which rule not followed:

// {ruleContent}

// Below is the pull request code diff:

// {fileBlocks}

// Generate a **350-word structured review** containing:

// 1. Summary (100–120 words)
// 2. Major Suggestions (150–180 words)
// 3. Key Changes (80–100 words)

// Be developer-friendly and apply the above rulepacks.
// ";

//         var analysis = await _gemini.GenerateAsync(fullPrompt);
//         var finalComment = "[AI-REVIEW]\n\n" + analysis;

//         // ⭐⭐⭐ ADD SAST BUTTON HERE ⭐⭐⭐
//         if (provider == "github")
//         {
//             var parts = pr.Repository.Name.Split('/');
//             var owner = parts[0];
//             var repo = parts[1];

//             var prNumber = await _githubPRFileService
//                 .GetPRNumberFromExternalId(http, owner, repo, pr.ExternalId);

//             string baseUrl = _config["APP_BASE_URL"];
//             string secret = _config["SastTriggerSecret"];

//             string sastUrl = SastTriggerUrlHelper.GenerateSignedUrl(
//                 baseUrl,
//                 owner,
//                 repo,
//                 prNumber.Value,
//                 secret,
//                 TimeSpan.FromHours(1)
//             );

//             finalComment += $@"

// ---

// ### 🔐 Security Scan Available
// Click to run Semgrep SAST:

// [![Review SAST and SCA report 
// ](https://img.shields.io/badge/Run%20SAST%20Scan-green?style=for-the-badge)]({sastUrl})

// ";
//         }

//         // POST COMMENT
//         if (provider == "github")
//         {
//             var parts = pr.Repository.Name.Split('/');
//             var owner = parts[0];
//             var repo = parts[1];

//             await _githubComment.AddCommentAsync(owner, repo, pr.ExternalId, finalComment);
//         }
//         else
//         {
//             await _gitlabComment.AddCommentAsync(pr.ExternalId!, finalComment);
//         }

//         // SAVE ANALYSIS
//         await _analysisResultService.SaveAnalysisAsync(
//             prId,
//             finalComment,
//             "Gemini",
//             "AI-Review"
//         );

//         Console.WriteLine("========== END SyncPRFiles ==========\n");
//     }
//     // TO FETCH URL OF GENERATED SONARQUBE REPORT
// public async Task<string?> GetReportUrlByRepoAsync(string repo)
// {
//     var report = await _ctx.ReportFiles
//         .Where(r => r.ProjectKey == repo)
//         .OrderByDescending(r => r.CreatedAt)
//         .FirstOrDefaultAsync();

//     return report?.FileUrl;
// }
// }

using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Services;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Models;
using GitHubIntegrationBackend.Utils;
using GitHubIntegrationBackend.Dto;
public class PRFileSyncService
{
    private readonly AppDbContext _ctx;
    private readonly GitHubPRFileService _githubPRFileService;
    private readonly GitLabPRFileService _gitlabPRFileService;
    private readonly RulePackService _rules;
    private readonly GeminiService _gemini;
    private readonly GitLabCommentService _gitlabComment;
    private readonly GitHubCommentService _githubComment;
    private readonly IConfiguration _config;
    private readonly AnalysisResultService _analysisResultService;
    private readonly JiraValidator _jiraValidator;
    private readonly JiraService _jiraService;
    private readonly EmailService _emailService;
    public PRFileSyncService(
        AppDbContext ctx,
        GitHubPRFileService githubPRFileService,
        GitLabPRFileService gitlabPRFileService,
        GeminiService gemini,
        GitHubCommentService githubComment,
        GitLabCommentService gitlabComment,
        RulePackService rules,
        AnalysisResultService analysisResultService,
        IConfiguration config,
        JiraValidator jiraValidator,
    JiraService jiraService,
    EmailService emailService)
    {
        _ctx = ctx;
        _githubPRFileService = githubPRFileService;
        _gitlabPRFileService = gitlabPRFileService;
        _gemini = gemini;
        _githubComment = githubComment;
        _gitlabComment = gitlabComment;
        _rules = rules;
        _analysisResultService = analysisResultService;
        _config = config;
        _jiraValidator = jiraValidator;
        _jiraService = jiraService;
         _emailService = emailService;
    }

    public async Task SyncPRFiles(int prId)
    {
        Console.WriteLine($"\n========== 🔄 SyncPRFiles START — PR {prId} ==========");

        var pr = await _ctx.PullRequests.Include(p => p.Repository).FirstOrDefaultAsync(p => p.Id == prId);
        if (pr == null)
        {
            Console.WriteLine("❌ PR not found");
            throw new Exception("PR not found");
        }

        var provider = pr.Repository.Provider.ToLower();
        Console.WriteLine($"📌 Provider = {provider}");
        Console.WriteLine($"📌 Repo = {pr.Repository.Name}");

        var files = new List<dynamic>();

        // -----------------------------
        // FETCH FILES
        // -----------------------------
        if (provider == "github")
        {
            var parts = pr.Repository.Name.Split('/');
            var owner = parts[0];
            var repo = parts[1];

            var result = await _githubPRFileService.GetPRFilesAsync(owner, repo, pr.ExternalId);
            Console.WriteLine($"📄 Total changed files = {result.Count}");

            files.AddRange(result);
        }
        else if (provider == "gitlab")
        {
            var parts = pr.ExternalId.Split(':');
            var iid = parts[0];
            var projectId = parts[1];

            var result = await _gitlabPRFileService.GetPRFilesAsync(projectId, iid);
            Console.WriteLine($"📄 Total changed files = {result.Count}");

            files.AddRange(result);
        }

        // -----------------------------
        // SAVE PR FILES
        // -----------------------------
        var old = _ctx.PRFiles.Where(f => f.PrId == prId);
        _ctx.PRFiles.RemoveRange(old);

        foreach (var f in files)
        {
            if (provider == "github")
            {
                var gh = (GitHubFileDto)f;
                _ctx.PRFiles.Add(new PRFile
                {
                    PrId = prId,
                    Path = gh.filename,
                    ChangeType = gh.status,
                    Diff = gh.patch
                });
            }
            else
            {
                var gl = (GitLabFileDto)f;
                _ctx.PRFiles.Add(new PRFile
                {
                    PrId = prId,
                    Path = gl.new_path,
                    ChangeType = "modified",
                    Diff = gl.diff
                });
            }
        }

        await _ctx.SaveChangesAsync();
        // Console.WriteLine("PRFiles saved.");

        // -----------------------------
        // CHECK SHOULD TRIGGER GEMINI
        // -----------------------------
        bool shouldRunGemini = false;
        string authorLogin = "unknown";
        if (provider == "github")
        {
            var http = new HttpClient();
            http.DefaultRequestHeaders.UserAgent.ParseAdd("App");

            var parts = pr.Repository.Name.Split('/');
            var owner = parts[0];
            var repo = parts[1];

            var prNumber = await _githubPRFileService.GetPRNumberFromExternalId(http, owner, repo, pr.ExternalId);
            if (prNumber == null) return;

            var lastCommit = await _githubPRFileService.GetLastCommitTimeAsync(http, owner, repo, prNumber.Value);
            var lastAIComment = await _githubComment.GetLastAICommentTimeAsync(http, owner, repo, prNumber.Value);

            shouldRunGemini = lastAIComment == null || lastCommit > lastAIComment;

            // Fetch PR Author from GitHub API
            authorLogin = await _githubPRFileService.GetPRAuthorLoginAsync(http, owner, repo, prNumber.Value);

            if (string.IsNullOrEmpty(authorLogin))
            {
                Console.WriteLine("⚠ Could not fetch GitHub author login, using fallback.");
                authorLogin = "unknown";
            }

            Console.WriteLine($"👤 PR Author GitHub Login = {authorLogin}");
        }

        if (!shouldRunGemini)
        {
            Console.WriteLine("No new commits. Skipping Gemini.");
            return;
        }

        // ⭐ JIRA VALIDATION ADDED HERE
        //var titleOrBranch = pr.Title ?? "";
        var titleOrBranch = $"{pr.Title} {pr.SourceBranch}".Trim();
        //var authorLogin = "AmeyaMandwale"; // or fetch dynamically

        Console.WriteLine("🔎 Running Jira validation...");
        var jiraResult = await _jiraValidator.ValidatePrAgainstJiraAsync(titleOrBranch, authorLogin);

        JiraIssueDto? matchedIssue = jiraResult.Issue;

        if (matchedIssue != null)
        {
            Console.WriteLine($"📌 Jira issue found: {matchedIssue.Key}");
        }
        else
        {
            Console.WriteLine("⚠ No Jira issue matched.");
        }


        // LOAD RULES
        var ruleContent = await _rules.GetEnabledRulesForRepo(pr.Repository.OrgId, pr.Repository.Name);

        // BUILD PROMPT
        var fileBlocks = string.Join("\n\n", files.Select(f =>
            provider == "github"
                ? $"FILE: {((GitHubFileDto)f).filename}\nPATCH:\n{((GitHubFileDto)f).patch}"
                : $"FILE: {((GitLabFileDto)f).new_path}\nPATCH:\n{((GitLabFileDto)f).diff}"
        ));

        // ⭐ BUILD PRD BLOCK
        string prdBlock = "";

        if (matchedIssue != null)
        {
            var summary = matchedIssue.Fields.Summary ?? "(No summary provided)";

            prdBlock = $@"
=== PRODUCT REQUIREMENT (JIRA) ===
Key: {matchedIssue.Key}
Summary: {summary}
Link: {_jiraService.IssueUrl(matchedIssue.Key)}

Evaluate whether the PR code satisfies the acceptance criteria.
Identify what is missing or incorrect.
";
        }

        var fullPrompt = $@"
You are a senior code reviewer AI.  
{prdBlock}
Follow these RULES strictly also mention which rule not followed:

{ruleContent}

Below is the pull request code diff:

{fileBlocks}

Generate a 350-word structured review in 3 sections:
1. Summary
2. Major Suggestions
3. Key Changes
";

        // -----------------------------
        // CALL GEMINI
        // -----------------------------
        var analysis = await _gemini.GenerateAsync(fullPrompt);
        Console.WriteLine("======== GEMINI RAW OUTPUT ========");
        Console.WriteLine(analysis);
        Console.WriteLine("===================================");
        var finalComment = "[AI-REVIEW]\n\n" + analysis;

        Console.WriteLine("🤖 Gemini analysis generated ✔");
        // 🔥 Hook email here
     await _emailService.SendPrHealthMail(finalComment);
        // -----------------------------
        // ADD SAST BUTTON
        // -----------------------------
        if (provider == "github")
        {
            try
            {
                var http2 = new HttpClient();
                http2.DefaultRequestHeaders.UserAgent.ParseAdd("App");

                var parts = pr.Repository.Name.Split('/');
                var owner = parts[0];
                var repo = parts[1];

                var prNumber = await _githubPRFileService.GetPRNumberFromExternalId(http2, owner, repo, pr.ExternalId);

                if (prNumber != null)
                {
                    string baseUrl = _config["APP_BASE_URL"];
                    string secret = _config["SastTriggerSecret"];

                    string sastUrl = SastTriggerUrlHelper.GenerateSignedUrl(
                        baseUrl, owner, repo, prNumber.Value, secret, TimeSpan.FromHours(1));

                    finalComment += $@"

---

### 🔐 Security Scan Available
Click below to run SAST SCA Scan:

[![Review SAST and SCA Report](https://img.shields.io/badge/Review%20SAST%20and%20SCA%20Report-blue?style=for-the-badge)]({sastUrl})

";
                    Console.WriteLine("🔐 SAST button added ✔");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Error generating SAST URL: " + ex.Message);
            }
        }

        // -----------------------------
        // POST COMMENT
        // -----------------------------
        if (provider == "github")
        {
            var parts = pr.Repository.Name.Split('/');
            var owner = parts[0];
            var repo = parts[1];

            string? SonarURL = await GetReportUrlByRepoAsync(repo);
            bool ok = await _githubComment.AddCommentWithReportAsync(
                owner, repo, pr.ExternalId, finalComment,
                SonarURL
            //   "http://localhost:5142/reports/Ctpl-Code-Reviewer/SonarReport_20251126_093224.pdf"
            );

            Console.WriteLine(ok ? "🟩 GitHub comment posted ✔" : "❌ Failed to post comment");
        }

        // SAVE ANALYSIS
        await _analysisResultService.SaveAnalysisAsync(
            prId, finalComment, "Gemini", "AI-Review");

        Console.WriteLine("🎉 AI Review saved to DB.");
        Console.WriteLine("========== END SyncPRFiles ==========\n");
    }

    public async Task<string?> GetReportUrlByRepoAsync(string repo)
    {
        var report = await _ctx.ReportFiles
            .Where(r => r.ProjectKey == repo)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        return report?.FileUrl ?? "";
    }
}