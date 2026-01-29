using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using GitHubIntegrationBackend.Data;
using Microsoft.EntityFrameworkCore;


namespace GitHubIntegrationBackend.Services
{
    public class GitHubCommentService
    {
        private readonly AppDbContext _ctx;
        private readonly IHttpClientFactory _factory;
        
        private readonly GitHubPRFileService _prFileService;
        private readonly IConfiguration _config;
        private readonly GitHubAppAuthService _appAuth;
        public GitHubCommentService(AppDbContext ctx, IHttpClientFactory factory, GitHubPRFileService prFileService, IConfiguration config,GitHubAppAuthService appAuth)
        {
            _ctx = ctx;
            _factory = factory;
             _prFileService = prFileService;
            _config = config;
            _appAuth = appAuth;
        }   
public async Task<bool> AddCommentAsync(string owner, string repo, string externalId, string comment)
{
    Console.WriteLine("\n=========== 🟦 AddCommentAsync START ===========");
    Console.WriteLine($"Repo = {owner}/{repo}, ExternalId = {externalId}");
    
    // 1️⃣ Get App Installation Token
    Console.WriteLine("🔑 Getting installation token...");
    var installationToken = await _appAuth.GetInstallationTokenAsync();

    Console.WriteLine($"🔑 Token starts with: {installationToken.Substring(0, 10)}...");

    var http = _factory.CreateClient();
    http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
    http.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", installationToken);

    http.DefaultRequestHeaders.Accept.Add(
        new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
    );

    // 2️⃣ Resolve PR number
    Console.WriteLine("🔢 Resolving PR number...");
    var prNumber = await _prFileService.GetPRNumberFromExternalId(http, owner, repo, externalId);
    Console.WriteLine($"🔢 PR NUMBER = {prNumber}");

    if (prNumber == null)
    {
        Console.WriteLine("❌ Cannot resolve PR number — stopping comment");
        throw new Exception("❌ Cannot resolve PR number for comment.");
    }

    // 3️⃣ Post comment
    string url = $"https://api.github.com/repos/{owner}/{repo}/issues/{prNumber}/comments";
    Console.WriteLine($"🌐 Posting to URL: {url}");

    var payload = new { body = comment };
    var res = await http.PostAsJsonAsync(url, payload);

    Console.WriteLine($"📡 GitHub Comment Status: {res.StatusCode}");

    if (!res.IsSuccessStatusCode)
    {
        Console.WriteLine("❌ Comment failed:");
        Console.WriteLine(await res.Content.ReadAsStringAsync());
    }
    else
    {
        Console.WriteLine("✅ Comment posted successfully!");
    }

    Console.WriteLine("=========== END AddCommentAsync ===========\n");
    return res.IsSuccessStatusCode;
}



    public async Task<DateTime?> GetLastAICommentTimeAsync(HttpClient http, string owner, string repo, int prNumber)
{
    var url = $"https://api.github.com/repos/{owner}/{repo}/issues/{prNumber}/comments";
    var res = await http.GetStringAsync(url);

    var comments = JsonSerializer.Deserialize<List<GitHubCommentDto>>(res);

    var aiComment = comments?
        .Where(c => c.body != null && c.body.Contains("[AI-REVIEW]"))
        .OrderByDescending(c => c.created_at)
        .FirstOrDefault();

    return aiComment?.created_at;
}
  // ---------------- NEW METHOD TO APPEND REPORT URL ----------------
        public async Task<bool> AddCommentWithReportAsync(
            string owner,
            string repo,
            string externalId,
            string baseComment,
            string reportUrl)
        {

            // Prepare the final combined comment
            string finalComment =
                $"{baseComment}\n\n" +
                $"According to the current PR, the raised issues or modifications can be reviewed here:\n\n" +
                $"➡️ {reportUrl}";

            // Reuse existing method (NO breaking change)
            return await AddCommentAsync(owner, repo, externalId, finalComment);
        }

        // ✅ NEW METHOD (safe - does not affect any old logic)
public async Task<bool> AddSastResultCommentAsync(
    string owner,
    string repo,
    int prNumber,
    string sastMarkdown)
{
    Console.WriteLine("\n=========== 🟪 AddSastResultCommentAsync START ===========");

    // 1️⃣ Get GitHub App Installation Token (same logic your AddCommentAsync uses)
    var installationToken = await _appAuth.GetInstallationTokenAsync();

    var http = _factory.CreateClient();
    http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
    http.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", installationToken);

    http.DefaultRequestHeaders.Accept.Add(
        new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
    );

    // 2️⃣ Build GitHub comment API URL
    string url = $"https://api.github.com/repos/{owner}/{repo}/issues/{prNumber}/comments";
    Console.WriteLine($"🌐 Posting SAST result to: {url}");

    var payload = new { body = sastMarkdown };
    var res = await http.PostAsJsonAsync(url, payload);

    Console.WriteLine($"📡 GitHub Status: {res.StatusCode}");

    if (!res.IsSuccessStatusCode)
    {
        Console.WriteLine("❌ SAST comment failed:");
        Console.WriteLine(await res.Content.ReadAsStringAsync());
    }
    else
    {
        Console.WriteLine("✅ SAST comment posted");
    }

    Console.WriteLine("=========== END AddSastResultCommentAsync ===========\n");
    return res.IsSuccessStatusCode;
}

public class GitHubCommentDto
{
    public string body { get; set; }
    public DateTime created_at { get; set; }
}

    

    private string ExtractToken(string config)
    {
        try
        {
            var root = JsonDocument.Parse(config);
            if (root.RootElement.TryGetProperty("access_token", out var t))
                return t.GetString()!;
        }
        catch { }

        return config;
    }
}
}