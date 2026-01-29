using Microsoft.AspNetCore.Mvc;
using GitHubIntegrationBackend.Services;
using GitHubIntegrationBackend.Data;
using Microsoft.EntityFrameworkCore;
namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PRFileController : ControllerBase
    {   
    private readonly AppDbContext _ctx;
        private readonly PRFileSyncService _sync;

        public PRFileController(PRFileSyncService sync,AppDbContext ctx)
        {
            _sync = sync;
             _ctx = ctx;
        }

        [HttpPost("sync/{prId}")]
        public async Task<IActionResult> SyncPRFiles(int prId)
        {
            await _sync.SyncPRFiles(prId);
            return Ok("PR files synced");
        }

        [HttpGet("byPrId/{prId}")]
public async Task<IActionResult> GetFiles(int prId)
{
    var files = await _ctx.PRFiles
        .Where(x => x.PrId == prId)
        .ToListAsync();

    return Ok(files);
}

    }
}
