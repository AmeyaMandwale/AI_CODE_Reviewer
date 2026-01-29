using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;

namespace GitHubIntegrationBackend.Services
{
    public class GitHubPRFileService
    {
        private readonly AppDbContext _ctx;
        private readonly IHttpClientFactory _factory;
        private readonly GitHubAppAuthService _appAuth;

        public GitHubPRFileService(AppDbContext ctx, IHttpClientFactory factory, GitHubAppAuthService appAuth)
        {
            _ctx = ctx;
            _factory = factory;
            _appAuth = appAuth;
        }

        // ================================
        // 1️⃣ GET PR FILES (USING EXTERNAL ID)
        // ================================
        public async Task<List<GitHubFileDto>> GetPRFilesAsync(
            string owner,
            string repo,
            string externalId)
        {
            var integration = await _ctx.Integrations
                .FirstOrDefaultAsync(i => i.Provider == "github");

            if (integration == null)
                throw new Exception("❌ GitHub Integration not found");

            var token = ExtractToken(integration.Config);

            var http = _factory.CreateClient();
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
            http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
            );
            http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
            );

            // Convert stored external ID → GitHub PR number
            var prNumber = await GetPRNumberFromExternalId(http, owner, repo, externalId);

            if (prNumber == null)
                throw new Exception($"❌❌ Could not find PR number for ExternalId={externalId}");

            string url = $"https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}/files";
            // string url = $"https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}/files";
            Console.WriteLine($"CALL: {url}");

            var res = await http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var files = JsonSerializer.Deserialize<List<GitHubFileDto>>(json);

            return files ?? new List<GitHubFileDto>();
        }

        // ================================
        // 2️⃣ RESOLVE PR NUMBER USING EXTERNAL ID
        // ================================
        public async Task<int?> GetPRNumberFromExternalId(
            HttpClient http,
            string owner,
            string repo,
            string externalId)
        {
            // Re-authenticate with GitHub App Token
            http.DefaultRequestHeaders.UserAgent.Clear();
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");

            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer",
                    await _appAuth.GetInstallationTokenAsync());

            http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
            );

            // ⭐⭐ AUTHENTICATE ⭐⭐
            http.DefaultRequestHeaders.UserAgent.Clear();
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");

            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer",
                    await _appAuth.GetInstallationTokenAsync());

            http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
            );

            string listUrl =
                $"https://api.github.com/repos/{owner}/{repo}/pulls?state=all&per_page=100";

            Console.WriteLine($"CALL: {listUrl}");

            var res = await http.GetAsync(listUrl);
            if (!res.IsSuccessStatusCode)
            {
                Console.WriteLine("❌ Failed to fetch PR list: " + res.StatusCode);
            {
                Console.WriteLine("❌ Failed to fetch PR list: " + res.StatusCode);
                return null;
            }
            }

            var json = await res.Content.ReadAsStringAsync();
            Console.WriteLine("🔍 Raw PR List JSON:...");
            // Console.WriteLine(json);

            List<GitHubPRListDto>? prs = null;

            try
            {
                prs = JsonSerializer.Deserialize<List<GitHubPRListDto>>(json);
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ JSON parse error: " + ex.Message);
                return null;
            }

            Console.WriteLine("🔍 Parsed count: " + (prs?.Count ?? 0));

            var match = prs?.FirstOrDefault(p => p.id.ToString() == externalId);

            if (match == null)
            {
                Console.WriteLine($"❌ No PR matched externalId: {externalId}");
                return null;
            }

            Console.WriteLine($"✔ Matched PR: externalId={externalId} → number={match.number}");

            return match.number;
          
        }

        // ================================
        // 3️⃣ GET LAST COMMIT TIME OF PR
        // ================================
        public async Task<DateTime?> GetLastCommitTimeAsync(HttpClient http, string owner, string repo, int prNumber)
                {
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer",
                    await _appAuth.GetInstallationTokenAsync());
            http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
            );

                    // Use same auth as above
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer",
                    await _appAuth.GetInstallationTokenAsync());
            http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
            );

            var url = $"https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}";
                    var res = await http.GetStringAsync(url);

            var dto = JsonSerializer.Deserialize<GitHubPRDetailDto>(res);
            return dto?.updated_at;
        }

        // ================================
        // 4️⃣ GET CHANGED FILE NAMES (FOR SEMGREP)
        // ================================
        public async Task<List<string>> GetChangedFileNamesByNumberAsync(
            string owner,
            string repo,
            int prNumber)
        {
            var token = await _appAuth.GetInstallationTokenAsync();

            var http = _factory.CreateClient();
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
            http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
            );

            string url = $"https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}/files";
            var res = await http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var files = JsonSerializer.Deserialize<List<GitHubFileDto>>(json);

            return files?.Select(f => f.filename).ToList() ?? new List<string>();
        }

        // ================================
        // 5️⃣ RETURN TOKEN (BACKWARD COMPATIBLE)
        // ================================
        public async Task<string> GetIntegrationTokenAsync()
        {
            // Forward GitHub App token
            return await _appAuth.GetInstallationTokenAsync();
        }

        // ================================
        // 6️⃣ GET RAW FILE CONTENT AT REF/BRANCH
        // ================================
    public async Task<string?> GetRawFileContentAsync(
    string owner,
    string repo,
    string path,
    string @ref)
{
    var token = await _appAuth.GetInstallationTokenAsync();

    var http = _factory.CreateClient();
    http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
    http.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);
    http.DefaultRequestHeaders.Accept.Add(
        new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
    );

    // 1️⃣ First get file metadata (to extract blob SHA)
    string metaUrl =
        $"https://api.github.com/repos/{owner}/{repo}/contents/{Uri.EscapeDataString(path)}?ref={Uri.EscapeDataString(@ref)}";

    var metaRes = await http.GetAsync(metaUrl);
    if (!metaRes.IsSuccessStatusCode)
        return null;

    var metaJson = await metaRes.Content.ReadAsStringAsync();
    using var metaDoc = JsonDocument.Parse(metaJson);

    if (!metaDoc.RootElement.TryGetProperty("sha", out var shaProp))
        return null;

    string sha = shaProp.GetString()!;
    
    // 2️⃣ Use SHA to fetch the raw file blob
    string blobUrl =
        $"https://api.github.com/repos/{owner}/{repo}/git/blobs/{sha}";

    var blobRes = await http.GetAsync(blobUrl);
    if (!blobRes.IsSuccessStatusCode)
        return null;

    var blobJson = await blobRes.Content.ReadAsStringAsync();
    using var blobDoc = JsonDocument.Parse(blobJson);

    if (blobDoc.RootElement.TryGetProperty("content", out var contentEl) &&
        blobDoc.RootElement.TryGetProperty("encoding", out var encEl))
    {
        if (encEl.GetString() == "base64")
        {
            var raw = Convert.FromBase64String(
                contentEl.GetString()!.Replace("\n", "")
            );
            return System.Text.Encoding.UTF8.GetString(raw);
        }
    }

    return null;
}


        // ================================
        // 7️⃣ EXTRACT TOKEN FROM DB
        // ================================
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
    public async Task<string?> GetPrHeadShaAsync(string owner, string repo, int prNumber)
    { 
        var token = await _appAuth.GetInstallationTokenAsync();

        var http = _factory.CreateClient();
        http.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        http.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/vnd.github+json")
        );

        var url = $"https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}";
        var res = await http.GetAsync(url);

        if (!res.IsSuccessStatusCode)
            return null;

        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (doc.RootElement.TryGetProperty("head", out var head) &&
            head.TryGetProperty("sha", out var shaProp))
        {
            return shaProp.GetString();
        }

        return null;
    }
    public async Task<string?> GetRawFileContentFromPrAsync(
    string owner,
    string repo,
    string path,
    int prNumber)
{
    // 1️⃣ Get the HEAD commit SHA of this PR
    var sha = await GetPrHeadShaAsync(owner, repo, prNumber);
    if (sha == null)
        return null;

    // 2️⃣ Reuse existing content API helper, but pass SHA instead of "HEAD"
    return await GetRawFileContentAsync(owner, repo, path, sha);
}
    
public async Task<string?> GetPRAuthorLoginAsync(
    HttpClient http, 
    string owner, 
    string repo, 
    int prNumber)
{
    var url = $"https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}";

    var req = new HttpRequestMessage(HttpMethod.Get, url);
    req.Headers.UserAgent.ParseAdd("CTPL-Code-Reviewer");

    // ✅ Use GitHub App Installation Token
    req.Headers.Authorization = new AuthenticationHeaderValue(
        "Bearer", await _appAuth.GetInstallationTokenAsync()
    );

    req.Headers.Accept.ParseAdd("application/vnd.github+json");

    var res = await http.SendAsync(req);
    if (!res.IsSuccessStatusCode)
    {
        Console.WriteLine("❌ Failed fetching PR details for author");
        return null;
    }

    var json = await res.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(json);

    return doc.RootElement.GetProperty("user")
                          .GetProperty("login")
                          .GetString();
}


    }

    // ================================
    // DTOs
    // ================================

    public class GitHubPRDetailDto
    {
        public DateTime updated_at { get; set; }
    }
    public class GitHubFileDto
    {
        public string filename { get; set; } = "";
        public string status { get; set; } = "";
        public string? patch { get; set; }
    }

    public class GitHubPRListDto
    {
        public long id { get; set; }
        public int number { get; set; }
    }

    public class GitHubCommentDto
    {
        public string body { get; set; } = "";
    }
}
