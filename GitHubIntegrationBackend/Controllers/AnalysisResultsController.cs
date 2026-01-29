using Microsoft.AspNetCore.Mvc;
using GitHubIntegrationBackend.Services;
namespace GitHubIntegrationBackend.Controllers{

[ApiController]
[Route("api/[controller]")]
public class AnalysisResultsController : ControllerBase
{
    private readonly AnalysisResultService _service;

    public AnalysisResultsController(AnalysisResultService service)
    {
        _service = service;
    }

    // GET /api/analysisresults/pr/123
    [HttpGet("pr/{prId}")]
    public async Task<IActionResult> GetByPr(int prId)
    {
        var results = await _service.GetResultsForPrAsync(prId);
        return Ok(results);
    }

    // POST /api/analysisresults
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AnalysisResultCreateDto dto)
    {
        var result = await _service
            .SaveAnalysisAsync(dto.PrId, dto.Findings, dto.ToolName, dto.Type);

        return Ok(result);
    }
}

public class AnalysisResultCreateDto
{
    public int PrId { get; set; }
    public string Findings { get; set; } = "";
    public string ToolName { get; set; } = "Gemini";
    public string Type { get; set; } = "AI-Review";
}
}
