using Microsoft.AspNetCore.Mvc;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using GitHubIntegrationBackend.Services;


namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IntegrationController : ControllerBase
    {
        private readonly AppDbContext _db;
        public IntegrationController(AppDbContext db) => _db = db;

        [HttpGet("{orgId}")]
        public async Task<IActionResult> GetForOrg(int orgId)
        {
            var list = await _db.Integrations.Where(i => i.OrgId == orgId).ToListAsync();
            return Ok(list);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _db.Integrations.FindAsync(id);
            if (ent == null) return NotFound();
            _db.Integrations.Remove(ent);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("update-config/{id}")]
        public async Task<IActionResult> UpdateConfig(int id, [FromBody] object config)
        {
            var ent = await _db.Integrations.FindAsync(id);
            if (ent == null) return NotFound();
            ent.Config = JsonSerializer.Serialize(config);
            _db.Integrations.Update(ent);
            await _db.SaveChangesAsync();
            return Ok(ent);
        }
    }
}
