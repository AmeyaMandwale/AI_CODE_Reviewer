using Microsoft.AspNetCore.Mvc;
using GitHubIntegrationBackend.Services;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PRReviewController : ControllerBase
    {
        private readonly PRReviewService _reviewService;

        public PRReviewController(PRReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpPost("run/{prId}")]
        public async Task<IActionResult> Run(int prId)
        {
            await _reviewService.ReviewPR(prId);
            return Ok("✅ Gemini review posted to PR");
        }
    }
}
