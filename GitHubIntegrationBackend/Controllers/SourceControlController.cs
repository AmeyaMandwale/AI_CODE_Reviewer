using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using GitHubIntegrationBackend.Services;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using GitHubIntegrationBackend.Dto;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/sourcecontrol")]
    public class SourceControlController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly GitHubService _gitHubService;
        private readonly GitLabService _gitlabService;
        private readonly AppDbContext _db;
        private readonly HttpClient _http;

        public SourceControlController(
            IConfiguration config,
            GitHubService gitHubService,
             GitLabService gitLabService,
            AppDbContext db,
            ILogger<SourceControlController> logger,
            IHttpClientFactory factory)
        {
            _config = config;
            _gitHubService = gitHubService;
            _gitlabService = gitLabService;
            _db = db;
            _http = factory.CreateClient();
        }

        // ==========================
        // 🔹 LOGIN: GitHub or GitLab
        // ==========================
        [HttpGet("login")]
        public IActionResult Login([FromQuery] string provider, [FromQuery] int orgId)
        {
            if (string.IsNullOrEmpty(provider))
                return BadRequest("Provider is required");

            if (orgId <= 0)
                return BadRequest("orgId required");

            provider = provider.ToLower();

            if (provider == "github")
            {
                var clientId = _config["GITHUB_CLIENT_ID"];
                var redirectUri = _config["GITHUB_REDIRECT_URI"];
                var nonce = Guid.NewGuid().ToString("N");
                var state = $"org:{orgId}:{nonce}";

                var url =
                    $"https://github.com/login/oauth/authorize"
                    + $"?client_id={clientId}"
                    + $"&redirect_uri={redirectUri}"
                    + $"&scope=repo,admin:repo_hook"
                    + $"&state={state}";

                return Redirect(url);
            }
            else if (provider == "gitlab")
            {
                var clientId = _config["GITLAB_CLIENT_ID"];
                var redirectUri = _config["GITLAB_REDIRECT_URI"];
                var scope = "api read_user read_repository";

                // 🟢 Add org info in state
                var nonce = Guid.NewGuid().ToString("N");
                var state = $"org:{orgId}:{nonce}";

                var authUrl =
                    $"https://gitlab.com/oauth/authorize"
                    + $"?client_id={clientId}"
                    + $"&redirect_uri={redirectUri}"
                    + $"&response_type=code"
                    + $"&scope={scope}"
                    + $"&state={state}";  // ✅ include org + nonce for validation

                return Redirect(authUrl);
            }


            return BadRequest("Unsupported provider");
        }

        // ==========================
        // 🔹 CALLBACK: GitHub
        // ==========================
        [HttpGet("github/callback")]
        public async Task<IActionResult> GitHubCallback([FromQuery] string? code, [FromQuery] string? state)
        {
            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
                return BadRequest("Missing code or state");

            int orgId = 0;
            try
            {
                var parts = state.Split(':');
                if (parts.Length >= 2 && parts[0] == "org")
                    orgId = int.Parse(parts[1]);
            }
            catch
            {
                return BadRequest("Invalid state");
            }

            if (orgId <= 0)
                return BadRequest("Invalid orgId");

            var token = await _gitHubService.ExchangeCodeForTokenAsync(code);
            if (string.IsNullOrEmpty(token))
                return BadRequest("GitHub token exchange failed");

            var cfg = JsonSerializer.Serialize(new
            {
                access_token = token,
                installed_at = DateTime.UtcNow
            });

            var integration = await _db.Integrations
                .FirstOrDefaultAsync(i => i.OrgId == orgId && i.Provider.ToLower() == "github");

            if (integration == null)
            {
                integration = new Integration
                {
                    OrgId = orgId,
                    Type = "scm",
                    Provider = "github",
                    Config = cfg
                };
                _db.Integrations.Add(integration);
            }
            else
            {
                integration.Config = cfg;
                _db.Integrations.Update(integration);
            }

            await _db.SaveChangesAsync();

            var redirectFrontend =
                _config["FRONTEND_REPOSITORIES_URL"]
                ?? "http://localhost:5173/code-overview/repositories";

            return Redirect($"{redirectFrontend}?orgId={orgId}&provider=github");
        }

        // ==========================
        // 🔹 CALLBACK: GitLab
        // ==========================
        [HttpGet("gitlab/callback")]
        public async Task<IActionResult> GitLabCallback([FromQuery] string? code, [FromQuery] string? state)
        {
            if (string.IsNullOrEmpty(code))
                return BadRequest("Missing code");

            int orgId = 0;
            try
            {
                var parts = state?.Split(':');
                if (parts?.Length >= 2 && parts[0] == "org")
                    orgId = int.Parse(parts[1]);
            }
            catch
            {
                return BadRequest("Invalid state");
            }

            if (orgId <= 0)
                return BadRequest("Invalid orgId");

            var clientId = _config["GITLAB_CLIENT_ID"];
            var clientSecret = _config["GITLAB_CLIENT_SECRET"];
            var redirectUri = _config["GITLAB_REDIRECT_URI"];

            var tokenResponse = await _http.PostAsync(
                "https://gitlab.com/oauth/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
            {"client_id", clientId},
            {"client_secret", clientSecret},
            {"code", code},
            {"grant_type", "authorization_code"},
            {"redirect_uri", redirectUri}
                })
            );

            var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(tokenJson);
            var accessToken = doc.RootElement.GetProperty("access_token").GetString();

            if (string.IsNullOrEmpty(accessToken))
                return BadRequest("GitLab token exchange failed");

            // 🟢 Save or update integration in DB
            var cfg = JsonSerializer.Serialize(new
            {
                access_token = accessToken,
                installed_at = DateTime.UtcNow
            });

            var integration = await _db.Integrations
                .FirstOrDefaultAsync(i => i.OrgId == orgId && i.Provider.ToLower() == "gitlab");

            if (integration == null)
            {
                integration = new Integration
                {
                    OrgId = orgId,
                    Type = "scm",
                    Provider = "gitlab",
                    Config = cfg
                };
                _db.Integrations.Add(integration);
            }
            else
            {
                integration.Config = cfg;
                _db.Integrations.Update(integration);
            }

            await _db.SaveChangesAsync();

            var redirectFrontend =
                _config["FRONTEND_REPOSITORIES_URL"]
                ?? "http://localhost:5173/code-overview/repositories";

            return Redirect($"{redirectFrontend}?orgId={orgId}&provider=gitlab");
        }


        // ==========================
        // 🔹 Get GitHub Repositories
        // ==========================
        [HttpGet("github/repos")]
        public async Task<IActionResult> GetGitHubRepos([FromQuery] int orgId)
        {
            if (orgId <= 0)
                return BadRequest("orgId required");

            var integration = await _db.Integrations
                .FirstOrDefaultAsync(i => i.OrgId == orgId && i.Provider == "github");

            if (integration == null)
                return NotFound("GitHub integration not found");

            var cfg = JsonSerializer.Deserialize<Dictionary<string, object>>(integration.Config);
            var token = cfg["access_token"]?.ToString();

            if (string.IsNullOrEmpty(token))
                return BadRequest("No GitHub token stored");

            var (ok, body, status) = await _gitHubService.GetUserReposAsync(token);

            if (!ok)
                return StatusCode(status, body);

            try
            {
                var repos = JsonSerializer.Deserialize<List<object>>(body)
                           ?? new List<object>();

                return Ok(repos);
            }
            catch
            {
                return Ok(new List<object>());
            }
        }

        // ==========================
// 🔹 Get GitLab Repositories
// ==========================
[HttpGet("gitlab/repos")]
public async Task<IActionResult> GetGitLabRepos([FromQuery] int orgId)
{
    if (orgId <= 0)
        return BadRequest("orgId required");

    var integration = await _db.Integrations
        .FirstOrDefaultAsync(i => i.OrgId == orgId && i.Provider == "gitlab");

    if (integration == null)
        return NotFound("GitLab integration not found");

    var cfg = JsonSerializer.Deserialize<Dictionary<string, object>>(integration.Config);
    var token = cfg["access_token"]?.ToString();

    if (string.IsNullOrEmpty(token))
        return BadRequest("No GitLab token stored");

    var (ok, body, status) = await _gitlabService.GetUserReposAsync(token);

    if (!ok)
        return StatusCode(status, body);

    var gitlabRepos = JsonSerializer.Deserialize<List<GitLabRepoDto>>(body) ?? new List<GitLabRepoDto>();

    // ✅ Map and save to DB
    foreach (var repo in gitlabRepos)
    {
        var existing = await _db.Repositories.FirstOrDefaultAsync(r =>
            r.OrgId == orgId && r.Provider == "gitlab" && r.ExternalId == repo.id.ToString());

        if (existing == null)
        {
            _db.Repositories.Add(new Repository
            {
                OrgId = orgId,
                Provider = "gitlab",
                ExternalId = repo.id.ToString(),
                Name = repo.name,
                LastSyncedAt = DateTime.UtcNow
            });
        }
    }

    await _db.SaveChangesAsync();

    return Ok(gitlabRepos);
}

    }
}
