using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using GitHubIntegrationBackend.Services;
using Microsoft.EntityFrameworkCore;



namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RepositoryController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly GitHubService _gitHubService;
        private readonly IConfiguration _config;
        private readonly ILogger<RepositoryController> _logger;

        public RepositoryController(AppDbContext db, GitHubService gitHubService, IConfiguration config, ILogger<RepositoryController> logger)
        {
            _db = db;
            _gitHubService = gitHubService;
            _config = config;
            _logger = logger;
        }
        
        // Get repository details by ID
[HttpGet("{id}")]
public async Task<IActionResult> GetById(int id)
{
    if (id <= 0)
        return BadRequest("Invalid repository ID");

    var repo = await _db.Repositories.FirstOrDefaultAsync(r => r.Id == id);

    if (repo == null)
        return NotFound($"Repository with ID {id} not found");

    return Ok(repo);
}

        [HttpGet("github/all")]
public async Task<IActionResult> GetAllGitHubRepos([FromQuery] int orgId)
{
    if (orgId <= 0) return BadRequest("orgId required");

    var integration = await _db.Integrations
        .FirstOrDefaultAsync(i => i.OrgId == orgId && i.Provider == "github");

    if (integration == null)
        return BadRequest("No GitHub integration for this org");

    var cfg = JsonSerializer.Deserialize<JsonElement>(integration.Config ?? "{}");
    if (!cfg.TryGetProperty("access_token", out var tokenEl))
        return BadRequest("Integration missing token");

    var token = tokenEl.GetString();

    var (ok, body, status) = await _gitHubService.GetUserReposAsync(token!);
    if (!ok) return StatusCode(status, body);

    return Ok(JsonDocument.Parse(body));
}

        // Sync repos from GitHub into DB for orgId
        [HttpPost("sync")]
        public async Task<IActionResult> Sync([FromQuery] int orgId)
        {
            if (orgId <= 0) return BadRequest("orgId required");

            var integration = await _db.Integrations.FirstOrDefaultAsync(i => i.OrgId == orgId && i.Provider == "github");
            if (integration == null) return BadRequest("No GitHub integration for this org");

            var cfg = JsonSerializer.Deserialize<JsonElement>(integration.Config ?? "{}");
            if (!cfg.TryGetProperty("access_token", out var tokenEl)) return BadRequest("Integration missing token");
            var token = tokenEl.GetString();

            var (ok, body, status) = await _gitHubService.GetUserReposAsync(token!);
            _logger.LogInformation("GitHub repos response status {Status}", status);

            if (!ok) return StatusCode(status, body);

            // parse JSON array and upsert into Repositories table
            try
            {
                var doc = JsonDocument.Parse(body);
                foreach (var item in doc.RootElement.EnumerateArray())
                {
                    var externalId = item.GetProperty("id").GetInt64().ToString();
                    var fullName = item.GetProperty("full_name").GetString() ?? "";
                    var provider = "github";

                    var existing = await _db.Repositories.FirstOrDefaultAsync(r => r.ExternalId == externalId && r.OrgId == orgId);
                    if (existing == null)
                    {
                        var repo = new Repository
                        {
                            OrgId = orgId,
                            Provider = provider,
                            ExternalId = externalId,
                            Name = fullName,
                            LastSyncedAt = DateTime.UtcNow
                        };
                        _db.Repositories.Add(repo);
                    }
                    else
                    {
                        existing.Name = fullName;
                        existing.LastSyncedAt = DateTime.UtcNow;
                        _db.Repositories.Update(existing);
                    }
                }

                await _db.SaveChangesAsync();

                // return DB repos for org
                var repos = await _db.Repositories.Where(r => r.OrgId == orgId).ToListAsync();
                return Ok(repos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed parsing GitHub repos JSON");
                return StatusCode(500, "Failed parsing GitHub response");
            }
        }

        [HttpGet]
public async Task<IActionResult> GetRepositories([FromQuery] int orgId, [FromQuery] string? provider = null)
{
    if (orgId <= 0)
        return BadRequest("orgId required");

    var query = _db.Repositories.AsQueryable().Where(r => r.OrgId == orgId);

    if (!string.IsNullOrEmpty(provider))
        query = query.Where(r => r.Provider.ToLower() == provider.ToLower());

    var repos = await query.ToListAsync();
    return Ok(repos);
}


        // Connect (create webhook) and mark repo as connected
        [HttpPost("connect")]
        public async Task<IActionResult> Connect([FromQuery] int orgId, [FromBody] ConnectRequest req)
        {
            if (orgId <= 0) return BadRequest("orgId required");
            if (string.IsNullOrEmpty(req.Owner) || string.IsNullOrEmpty(req.Repo)) return BadRequest("owner & repo required");

            var integration = await _db.Integrations.FirstOrDefaultAsync(i => i.OrgId == orgId && i.Provider == "github");
            if (integration == null) return BadRequest("No GitHub integration found");

            var cfg = JsonSerializer.Deserialize<JsonElement>(integration.Config ?? "{}");
            if (!cfg.TryGetProperty("access_token", out var tokenEl)) return BadRequest("Integration missing token");
            var token = tokenEl.GetString()!;

            // create webhook
            var webhookUrl = _config["GITHUB_WEBHOOK_URL"] ?? "http://localhost:5142/api/webhook/github";
            var secret = _config["GITHUB_WEBHOOK_SECRET"] ?? "mywebhooksecret";

            var (ok, body, status) = await _gitHubService.CreateWebhookAsync(token, req.Owner, req.Repo, webhookUrl, secret);
            if (!ok) {
    Console.WriteLine("Webhook failed: " + body);
}

            // mark repository as connected/upsert
            var externalId = req.ExternalId ?? "";
            var repoDb = await _db.Repositories.FirstOrDefaultAsync(r => r.ExternalId == externalId && r.OrgId == orgId);
            if (repoDb == null)
            {
                repoDb = new Repository
                {
                    OrgId = orgId,
                    Provider = "github",
                    ExternalId = externalId,
                    Name = $"{req.Owner}/{req.Repo}",
                    LastSyncedAt = DateTime.UtcNow
                };
                _db.Repositories.Add(repoDb);
            }
            else
            {
                repoDb.LastSyncedAt = DateTime.UtcNow;
                repoDb.Name = $"{req.Owner}/{req.Repo}";
                _db.Repositories.Update(repoDb);
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "Webhook created and repo saved", details = body });
        }
    }

    public class ConnectRequest
    {
        public string Owner { get; set; } = string.Empty;
        public string Repo { get; set; } = string.Empty;
        public string? ExternalId { get; set; } // optional external repo id as string
    }
}
