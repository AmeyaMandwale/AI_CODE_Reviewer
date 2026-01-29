using Microsoft.AspNetCore.Mvc;
using GitHubIntegrationBackend.Services;

namespace GitHubIntegrationBackend.Controllers

{
[ApiController]
[Route("api/docs")]
public class DocsController : ControllerBase
{
    private readonly DocumentationService _docService;

    public DocsController(DocumentationService docService)
    {
        _docService = docService;
    }

    [HttpPost("update")]
    public async Task<IActionResult> UpdateDocumentation([FromBody] DocUpdateRequest request)
    {
            Console.WriteLine("in controller: " + request);

        var updated = await _docService.UpdateReadmeAsync(request.Diff, request.Readme);

        if (updated == null)
            return Ok("NO_CHANGES");

        return Ok(updated);
    }
}

public class DocUpdateRequest
{
    public string Diff { get; set; }
    public string Readme { get; set; }
}
}

