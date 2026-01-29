using Microsoft.AspNetCore.Mvc;
using GitHubIntegrationBackend.Services;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SonarQubeController : ControllerBase
    {
        private readonly SonarQubeService _sonarService;

        public SonarQubeController(SonarQubeService sonarService)
        {
            _sonarService = sonarService;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard([FromQuery] string repoName)
        {
            if (string.IsNullOrEmpty(repoName))
                return BadRequest("Repository name is required.");

            try
            {
                bool connected = await _sonarService.IsProjectConnectedAsync(repoName);
                if (!connected)
                    return Ok(new { connected = false, message = "Repository not connected to SonarQube." });

                var metrics = await _sonarService.GetProjectMetricsAsync(repoName);
                var issues = await _sonarService.GetProjectIssuesAsync(repoName);
                var fileDuplications = await _sonarService.GetFileDuplicationsAsync(repoName);
                var trends = await _sonarService.GetActivityTrendsAsync(repoName);

                return Ok(new
                {
                    connected = true,
                    projectKey = repoName,
                    metrics,
                    issues,
                    fileDuplications,
                    trends
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch data from SonarQube", details = ex.Message });
            }
        }
        [HttpPost("run-analysis")]
public async Task<IActionResult> RunAnalysis([FromQuery] string projectKey)
{
    if (string.IsNullOrEmpty(projectKey))
        return BadRequest("Project key is required.");

    try
    {
        await _sonarService.RunFullAnalysis();
        return Ok(new
        {
            status = "success",
            message = "SonarQube analysis started and completed."
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            status = "error",
            message = ex.Message
        });
    }
}
[HttpPost("run-sonarqube")]
public async Task<IActionResult> RunSonarqube([FromQuery] string projectKey)
{
    if (string.IsNullOrEmpty(projectKey))
        return BadRequest("Project key is required.");

    try
    {
        await _sonarService.StartSonarQubeAsync();

        return Ok(new
        {
            status = "success",
            message = "SonarQube running."
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            status = "error",
            message = ex.Message
        });
    }
}
    }
}
