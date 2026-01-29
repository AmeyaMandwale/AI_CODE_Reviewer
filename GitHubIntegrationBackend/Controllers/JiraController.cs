using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using GitHubIntegrationBackend.Services;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JiraController : ControllerBase
    {
        private readonly JiraValidator _validator;
        private readonly ILogger<JiraController> _logger;

        public JiraController(JiraValidator validator, ILogger<JiraController> logger)
        {
            _validator = validator;
            _logger = logger;
        }

        public record ValidatePrRequest(string PrTitleOrBranch, string PrAuthorGitHubLogin);

        [HttpPost("validate")]
        public async Task<IActionResult> Validate([FromBody] ValidatePrRequest req)
        {
            var res = await _validator.ValidatePrAgainstJiraAsync(req.PrTitleOrBranch, req.PrAuthorGitHubLogin);
            if (!res.IsValid) return BadRequest(new { ok = false, message = res.Message });
            return Ok(new { ok = true, message = res.Message, issue = res.Issue?.Key });
        }
    }
}
