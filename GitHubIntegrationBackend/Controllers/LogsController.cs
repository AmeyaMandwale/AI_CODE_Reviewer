using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using GitHubIntegrationBackend.Services;

[ApiController]
[Route("api/logs")]
public class LogsController : ControllerBase
{
    private readonly logService _gh;

    public LogsController(logService gh)
    {
        _gh = gh;
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] RepoRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Owner) || string.IsNullOrWhiteSpace(req.Repo))
            return BadRequest("owner and repo required");

        var combined = await _gh.GetLatestWorkflowLogsCombinedText(
            req.Owner,
            req.Repo,
            req.Branch ?? "main"
        );

        if (combined == null)
            return NotFound("No workflow runs found or logs unavailable");

        return Content(combined, "text/plain");
    }
}

public class RepoRequest
{
    public string Owner { get; set; }
    public string Repo { get; set; }
    public string Branch { get; set; }
}
