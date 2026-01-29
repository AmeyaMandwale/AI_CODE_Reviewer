using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using System.Text.Json;
namespace GitHubIntegrationBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganizationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrganizationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/organization
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Organization>>> GetOrganizations()
        {
            return await _context.Organizations.ToListAsync();
        }

        // GET: api/organization/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Organization>> GetOrganization(int id)
        {
            var org = await _context.Organizations.FindAsync(id);

            if (org == null)
                return NotFound(new { message = "Organization not found" });

            return org;
        }

        // POST: api/organization
        [HttpPost]
        public async Task<ActionResult<Organization>> CreateOrganization(Organization organization)
        {
            _context.Organizations.Add(organization);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrganization), new { id = organization.Id }, organization);
        }

        // PUT: api/organization/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrganization(int id, Organization updatedOrganization)
        {
            if (id != updatedOrganization.Id)
                return BadRequest(new { message = "ID mismatch" });

            _context.Entry(updatedOrganization).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Organizations.Any(e => e.Id == id))
                    return NotFound(new { message = "Organization not found" });
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/organization/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrganization(int id)
        {
            var org = await _context.Organizations.FindAsync(id);
            if (org == null)
                return NotFound(new { message = "Organization not found" });

            _context.Organizations.Remove(org);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Organization deleted successfully" });
        }

 


    }
}
