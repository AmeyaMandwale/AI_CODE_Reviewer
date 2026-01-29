using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using System.Text.Json;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RulePackController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RulePackController(AppDbContext context)
        {
            _context = context;
        }

        // ============================
        // 🔹 GET ALL Rule Packs (Raw Entity)
        // ============================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var packs = await _context.RulePacks.ToListAsync();
            return Ok(packs);
        }

        // ============================
        // 🔹 GET Rule Packs by Organization (DTO response)
        // ============================
        [HttpGet("org/{orgId}")]
        public async Task<IActionResult> GetByOrg(int orgId)
        {
            var packs = await _context.RulePacks
                .Where(r => r.OrgId == orgId)
                .ToListAsync();

            var result = packs.Select(p => new RulePackDto
            {
                Id = p.Id,
                OrgId = p.OrgId,
                Name = p.Name,
                Type = p.Type,
                Enabled = p.Enabled,
                Rules = p.Rules ?? "{}",
                RepoIds = string.IsNullOrEmpty(p.RepoIds) 
                            ? new List<int>() 
                            : JsonSerializer.Deserialize<List<int>>(p.RepoIds),
                RepoNames = string.IsNullOrEmpty(p.RepoNames) 
                            ? new List<string>() 
                            : JsonSerializer.Deserialize<List<string>>(p.RepoNames)
            });

            return Ok(result);
        }

        // ============================
        // 🔹 GET Single Rule Pack (DTO response)
        // ============================
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var pack = await _context.RulePacks.FindAsync(id);
            if (pack == null)
                return NotFound(new { message = "Rule Pack not found" });

            var dto = new RulePackDto
            {
                Id = pack.Id,
                OrgId = pack.OrgId,
                Name = pack.Name,
                Type = pack.Type,
                Enabled = pack.Enabled,
                Rules = pack.Rules ?? "{}",
                RepoIds = string.IsNullOrEmpty(pack.RepoIds) 
                            ? new List<int>() 
                            : JsonSerializer.Deserialize<List<int>>(pack.RepoIds),
                RepoNames = string.IsNullOrEmpty(pack.RepoNames) 
                            ? new List<string>() 
                            : JsonSerializer.Deserialize<List<string>>(pack.RepoNames)
            };

            return Ok(dto);
        }

        // ============================
        // 🔹 CREATE Rule Pack (DTO input)
        // ============================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] RulePackDto dto)
        {
            if (!_context.Organizations.Any(o => o.Id == dto.OrgId))
                return BadRequest("Invalid OrgId");

            var pack = new RulePack
            {
                OrgId = dto.OrgId,
                Name = dto.Name,
                Type = dto.Type,
                Enabled = dto.Enabled,
                Rules = dto.Rules,
                RepoIds = JsonSerializer.Serialize(dto.RepoIds ?? new List<int>()),
                RepoNames = JsonSerializer.Serialize(dto.RepoNames ?? new List<string>())
            };

            _context.RulePacks.Add(pack);
            await _context.SaveChangesAsync();

            dto.Id = pack.Id; // Return ID
            return CreatedAtAction(nameof(Get), new { id = pack.Id }, dto);
        }

        // ============================
        // 🔹 UPDATE Rule Pack (DTO input)
        // ============================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] RulePackDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var existing = await _context.RulePacks.FindAsync(id);
            if (existing == null)
                return NotFound("Rule Pack not found");

            existing.Name = dto.Name;
            existing.Type = dto.Type;
            existing.Enabled = dto.Enabled;
            existing.Rules = dto.Rules;
            existing.RepoIds = JsonSerializer.Serialize(dto.RepoIds ?? new List<int>());
            existing.RepoNames = JsonSerializer.Serialize(dto.RepoNames ?? new List<string>());

            await _context.SaveChangesAsync();

            return Ok(dto);
        }

        // ============================
        // 🔹 DELETE Rule Pack
        // ============================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var pack = await _context.RulePacks.FindAsync(id);
            if (pack == null)
                return NotFound(new { message = "Rule Pack not found" });

            _context.RulePacks.Remove(pack);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Rule Pack deleted successfully" });
        }

        // ============================
        // 🔹 ENABLE / DISABLE Rule Pack
        // ============================
        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleRulePack(int id)
        {
            var pack = await _context.RulePacks.FindAsync(id);
            if (pack == null)
                return NotFound("Rule Pack not found");

            pack.Enabled = !pack.Enabled;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Rule pack updated",
                enabled = pack.Enabled
            });
        }

        // ============================
        // 🔹 UPDATE ONLY RULES JSON
        // ============================
        [HttpPut("{id}/rules")]
        public async Task<IActionResult> UpdateRules(int id, [FromBody] JsonElement rulesJson)
        {
            var pack = await _context.RulePacks.FindAsync(id);
            if (pack == null)
                return NotFound("Rule Pack not found");

            pack.Rules = JsonSerializer.Serialize(rulesJson);
            await _context.SaveChangesAsync();

            return Ok(pack);
        }
    }

    // DTO Definition
    public class RulePackDto
    {
        public int? Id { get; set; }
        public int OrgId { get; set; }
        public string Name { get; set; } = "";
        public string Type { get; set; } = "custom";
        public bool Enabled { get; set; } = true;
        public string Rules { get; set; } = "{}";
        public List<int>? RepoIds { get; set; }
        public List<string>? RepoNames { get; set; }
    }
}
