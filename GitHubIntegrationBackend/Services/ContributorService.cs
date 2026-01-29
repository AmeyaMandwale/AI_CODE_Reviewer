using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using GitHubIntegrationBackend.Dto;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Net.Http.Headers;

namespace GitHubIntegrationBackend.Services
{

public class ContributorService
{
    private readonly AppDbContext _context;

    public ContributorService(AppDbContext context)
    {
        _context = context;
    }

    public async Task SyncContributorsFromGitHub(int repoId, string rawAccessToken)
    {
        var repo = await _context.Repositories.FindAsync(repoId);
        if (repo == null) return;

        // Extract owner/repoName
        var parts = repo.Name.Split('/');
        if (parts.Length < 2) return;

        var owner = parts[0];
        var repoName = parts[1];

        // Extract token
        string accessToken = ParseAccessToken(rawAccessToken);

        using var http = new HttpClient();
        http.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");
        http.DefaultRequestHeaders.Add("User-Agent", "App");

        var url = $"https://api.github.com/repos/{owner}/{repoName}/contributors";

        var json = await http.GetStringAsync(url);

        var contributors = JsonSerializer.Deserialize<List<GithubContributorDto>>(json);

        if (contributors == null) return;

        foreach (var c in contributors)
        {
            
            // var existing = await _context.Users
            //     .FirstOrDefaultAsync(u => u.Provider == repo.Provider && u.Email == c.login);
             var username = c.login?.Trim();
            if (string.IsNullOrEmpty(username))
                continue;

            // look for a matching user by username (temporary email)
            var existing = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Provider == repo.Provider &&
                    u.Email == username // username stored in Email column
                );

            if (existing == null)
            {
                _context.Users.Add(new User
                {
                    OrgId = repo.OrgId,
                    //Email = c.login,
                    Email = username, // store username as email temporarily
                    Provider = repo.Provider,
                    Role = "user",
                    Preferences = null
                });
            }
            // Optional: you can update existing users if needed
        }

        await _context.SaveChangesAsync();
    }

    // ==========================================================
    // 🔹 NEW LOGIC: Sync CONTRIBUTORS FROM GITLAB (real emails!)
    // ==========================================================
    public async Task SyncContributorsFromGitLab(int repoId, string rawAccessToken)
{
    var repo = await _context.Repositories.FindAsync(repoId);
    if (repo == null) return;

    var projectId = repo.ExternalId;
    string accessToken = ParseAccessToken(rawAccessToken);

    using var http = new HttpClient();
    http.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", accessToken);

    // ✔ Fetch project collaborators (members)
    var url = $"https://gitlab.com/api/v4/projects/{projectId}/members/all";

    string json;
    try
    {
        json = await http.GetStringAsync(url);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[GitLab] member fetch failed: {ex.Message}");
        return;
    }

    var members = JsonSerializer.Deserialize<List<GitLabMemberDto>>(json);
    if (members == null) return;

    foreach (var m in members)
    {
        if (string.IsNullOrEmpty(m.username))
            continue;

        // Real email only if allowed by GitLab user privacy settings
        var emailToStore =
            !string.IsNullOrEmpty(m.email) ? m.email : m.username;

        var existing = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Provider == "gitlab" &&
                u.Email == emailToStore
            );

        if (existing == null)
        {
            _context.Users.Add(new User
            {
                OrgId = repo.OrgId,
                Email = emailToStore,
                Provider = "gitlab",
                Role = "user",
                Preferences = null
            });
        }
    }

    await _context.SaveChangesAsync();
}


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
            // already plain token
        }
        return tokenString;
    }
}


// GitLab DTO
public class GitLabMemberDto
{
    public string username { get; set; }
    public string email { get; set; }  // appears if user allows email visibility
    public string name { get; set; }
    public int access_level { get; set; }
}
}

