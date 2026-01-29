using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using GitHubIntegrationBackend.Data;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Services;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebhookController : ControllerBase
    {
        private readonly ILogger<WebhookController> _logger;
        private readonly AppDbContext _db;

        public WebhookController(ILogger<WebhookController> logger, AppDbContext db)
        {
            _logger = logger;
            _db = db;
        }

        [HttpPost("github")]
        public async Task<IActionResult> GitHub([FromBody] JsonElement payload)
        {
            try
            {
                // Example: log action and PR url
                var action = payload.GetProperty("action").GetString();
                var prUrl = payload.GetProperty("pull_request").GetProperty("html_url").GetString();

                _logger.LogInformation("GitHub Webhook received: action={Action} pr={Pr}", action, prUrl);

                // Optional: store basic PR record
                var prElement = payload.GetProperty("pull_request");
                var externalId = prElement.GetProperty("id").GetInt64().ToString();
                var title = prElement.GetProperty("title").GetString();
                var repoFullName = prElement.GetProperty("base").GetProperty("repo").GetProperty("full_name").GetString();

                // Insert minimal PullRequest record if you want to persist
                var repo = await _db.Repositories.FirstOrDefaultAsync(r => r.Name == repoFullName);
                var pr = new GitHubIntegrationBackend.Models.PullRequest
                {
                    RepoId = repo?.Id ?? 0,
                    ExternalId = externalId,
                    Title = title ?? "",
                    CreatedAt = DateTime.UtcNow,
                    Status = action ?? "unknown"
                };

                // Save only if repo exists and PR not already present (simple example)
                if (repo != null)
                {
                    var existing = await _db.PullRequests.FirstOrDefaultAsync(x => x.ExternalId == externalId);
                    if (existing == null)
                    {
                        _db.PullRequests.Add(pr);
                        await _db.SaveChangesAsync();
                    }
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Webhook handling failed");
                return StatusCode(500, ex.Message);
            }
        }
    }
}
