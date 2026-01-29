using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using GitHubIntegrationBackend.Services;
using GitHubIntegrationBackend.Dto; 


namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContributorsController : ControllerBase
    {
        private readonly ContributorService _service;
        private readonly AppDbContext _context;

        public ContributorsController(ContributorService service, AppDbContext context)
        {
            _service = service;
            _context = context;
        }
        // GET: api/contributors/repo/{repoId}
        [HttpGet("repo/{repoId}")]
        public async Task<IActionResult> GetContributorsByRepo(int repoId)
        {
            var repo = await _context.Repositories.FindAsync(repoId);
            if (repo == null)
                return NotFound("Repository not found");

            var users = await _context.Users
                .Where(u => u.OrgId == repo.OrgId)
                .ToListAsync();

            return Ok(users);
        }
           [HttpPost("sync/{repoId}")]
public async Task<IActionResult> SyncContributors(int repoId)
{
    var repo = await _context.Repositories.FindAsync(repoId);
    if (repo == null) return NotFound("Repository not found");

    var integration = await _context.Integrations
        .FirstOrDefaultAsync(i => i.Provider == repo.Provider && i.OrgId == repo.OrgId);

    if (integration == null)
        return BadRequest("SCM authentication not found");

    if (repo.Provider == "github")
        await _service.SyncContributorsFromGitHub(repoId, integration.Config);
    else if (repo.Provider == "gitlab")
        await _service.SyncContributorsFromGitLab(repoId, integration.Config);

    return Ok("Contributors synced successfully");
}

    }
}
