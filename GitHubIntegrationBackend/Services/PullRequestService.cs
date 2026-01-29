using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using GitHubIntegrationBackend.Dto;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace GitHubIntegrationBackend.Services
{
public class PullRequestService
{
    private readonly AppDbContext _context;

    public PullRequestService(AppDbContext context)
    {
        _context = context;
    }

    public async Task SyncPullRequestsFromGitHub(int repoId, string rawAccessToken)
    {
        var repo = await _context.Repositories.FindAsync(repoId);
        if (repo == null) return;

        // ✅ repo.Name expected as "owner/repoName"
        var parts = repo.Name.Split('/');
        if (parts.Length < 2) return;

        var owner = parts[0];
        var repoName = parts[1];

        // ✅ extract pure access token
        string accessToken = ParseAccessToken(rawAccessToken);

        using var http = new HttpClient();
        http.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");
        http.DefaultRequestHeaders.Add("User-Agent", "App");

        var url = $"https://api.github.com/repos/{owner}/{repoName}/pulls?state=all";

        var json = await http.GetStringAsync(url);

        var prs = JsonSerializer.Deserialize<List<GithubPRDto>>(json);

        if (prs == null) return;

        foreach (var pr in prs)
        {
    bool isClosed = 
        pr.state == "closed";

    var existing = await _context.PullRequests
        .FirstOrDefaultAsync(x => x.ExternalId == pr.id.ToString());

    // ❌ DO NOT STORE closed/merged PRs
    if (isClosed)
    {
        if (existing != null)
            _context.PullRequests.Remove(existing);

        continue; // skip
    }
            if (existing == null)
            {
                _context.PullRequests.Add(new PullRequest
                {
                    RepoId = repoId,
                    ExternalId = pr.id.ToString(),
                    Title = pr.title,
                    AuthorId = pr.user.id,
                    Status = pr.state,
                    CreatedAt = pr.created_at
                });
            }
            else
            {
                existing.Status = pr.state;
                existing.Title = pr.title;
                existing.AuthorId = pr.user.id;

                
            }
        }

        await _context.SaveChangesAsync();
    }

    /// ✅ Token extractor — Works for:
    /// ✅ "gho_xxx"
    /// ✅ "{\"access_token\":\"gho_xxx\", ...}"
    private string ParseAccessToken(string tokenString)
    {
        try
        {
            var obj = JsonSerializer.Deserialize<JsonElement>(tokenString);

            if (obj.TryGetProperty("access_token", out var tokenProp))
            {
                return tokenProp.GetString()!;
            }
        }
        catch
        {
            // ✅ already plain token, return as-is
        }
        return tokenString;
    }

public async Task SyncPullRequestsFromGitLab(int repoId, string rawAccessToken)
{
    Console.WriteLine($"\n==============================");
    Console.WriteLine($"[GITLAB-SYNC] START repoId={repoId}");
    Console.WriteLine("==============================");

    var repo = await _context.Repositories.FindAsync(repoId);
    if (repo == null)
    {
        Console.WriteLine("[GITLAB-SYNC] ❌ Repo not found");
        return;
    }

    Console.WriteLine($"[GITLAB-SYNC] Repo provider={repo.Provider}, ExternalId={repo.ExternalId}");

    var projectId = repo.ExternalId;
    string accessToken = ParseAccessToken(rawAccessToken);

    using var http = new HttpClient();
    http.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

    var url = $"https://gitlab.com/api/v4/projects/{projectId}/merge_requests?state=all";

    Console.WriteLine($"[GITLAB-SYNC] Calling GitLab API: {url}");

    string json;

    try
    {
        json = await http.GetStringAsync(url);
        Console.WriteLine($"[GITLAB-SYNC] API Response Raw: {json}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[GITLAB-SYNC] ❌ API ERROR: {ex.Message}");
        return;
    }

    var mrs = JsonSerializer.Deserialize<List<GitlabMRDto>>(json);

    if (mrs == null)
    {
        Console.WriteLine("[GITLAB-SYNC] ❌ Deserialized MRs is NULL");
        return;
    }

    if (mrs.Count == 0)
    {
        Console.WriteLine("[GITLAB-SYNC] ⚠ No Merge Requests found.");
        return;
    }

    Console.WriteLine($"[GITLAB-SYNC] Found {mrs.Count} MRs");

    foreach (var mr in mrs)
    {
        Console.WriteLine($"[GITLAB-SYNC] MR FOUND → IID={mr.iid}, ProjectId={mr.project_id}, State={mr.state}, Title={mr.title}");

        bool isClosed = mr.state == "closed" || mr.state == "merged";
        string combinedExternalId = $"{mr.iid}:{mr.project_id}";

        var existing = await _context.PullRequests
            .FirstOrDefaultAsync(x => x.ExternalId == combinedExternalId);

        if (existing == null)
            Console.WriteLine($"[GITLAB-SYNC] MR is NEW → ExternalId={combinedExternalId}");
        else
            Console.WriteLine($"[GITLAB-SYNC] MR ALREADY EXISTS → ExternalId={combinedExternalId}");

        // DELETE closed MR
        if (isClosed)
        {
            Console.WriteLine($"[GITLAB-SYNC] Removing CLOSED MR {combinedExternalId}");

            if (existing != null)
                _context.PullRequests.Remove(existing);

            continue;
        }

        if (existing == null)
        {
            Console.WriteLine($"[GITLAB-SYNC] INSERTING MR {combinedExternalId} into PullRequests table");

            _context.PullRequests.Add(new PullRequest
            {
                RepoId = repoId,
                ExternalId = combinedExternalId,
                Title = mr.title,
                AuthorId = mr.author.id,
                Status = mr.state,
                CreatedAt = mr.created_at
            });
        }
        else
        {
            Console.WriteLine($"[GITLAB-SYNC] Updating existing MR {combinedExternalId}");

            existing.Status = mr.state;
            existing.Title = mr.title;
            existing.AuthorId = mr.author.id;
        }
    }

    await _context.SaveChangesAsync();
    Console.WriteLine("[GITLAB-SYNC] ✔ MR SYNC COMPLETED\n");
}

}
}
