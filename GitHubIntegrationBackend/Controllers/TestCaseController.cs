using Microsoft.AspNetCore.Mvc;
using GitHubIntegrationBackend.Services;

namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly GeminiService _gemini;

        public TestController(GeminiService gemini)
        {
            _gemini = gemini;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateTests([FromBody] TestRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Code))
                return BadRequest(new { error = "Missing code." });

            var prompt = $@"
You are a senior test automation engineer.
Generate 5 JUnit 5 test cases for the following code.
Include positive, negative, and boundary cases.

Code:
{req.Code}
";
            var result = await _gemini.GenerateAsync(prompt);
            return Ok(new { result });
        }

        [HttpPost("validate")]
        public async Task<IActionResult> ValidateTests([FromBody] ValidationRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Tests))
                return BadRequest(new { error = "Missing tests." });

            var prompt = $@"
You are a QA validator.and Do not consider diff came from test folder which is in any project folder .
Check if these tests follow good practices and respond '✅ Follows' or '❌ Does Not Follow' with one line reason.
Return the code review as GitHub-style Markdown with headings, bullet points, and fenced code blocks. Do not wrap the response in JSON.
Tests:
{req.Tests}
";

            var result = await _gemini.GenerateAsync(prompt);
            return Ok(new { result });
        }
    
  [HttpPost("jestGenerate")]
    public async Task<IActionResult> GenerateJestTests([FromBody] JestTestRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Code))
            return BadRequest(new { error = "Missing code." });

        var prompt = $@"
You are an expert JavaScript test automation engineer.
Generate 5 Jest test cases for the following code.
Follow these rules:
- Use `describe`, `it`, `expect`
- Include positive, negative, edge & async cases
- Do NOT include explanations
- Do NOT wrap inside markdown fences

Code:
{req.Code}
";

        var result = await _gemini.GenerateAsync(prompt);
        return Ok(new { result });
    }

[HttpPost("jestValidate")]
public async Task<IActionResult> ValidateJestTests([FromBody] JestValidationRequest req)
{
    if (string.IsNullOrWhiteSpace(req.Tests))
        return BadRequest(new { error = "Missing tests." });

    var prompt = $@"
You are a senior QA reviewer.
Validate the following **Jest tests**.

Return:
- '✅ Valid Jest Tests' or '❌ Invalid Jest Tests'
- Then provide bullet-point reasons
- Use GitHub-style markdown
- Do NOT rewrite the code
- Do NOT wrap the response in JSON

Tests:
{req.Tests}
";

    var result = await _gemini.GenerateAsync(prompt);
    return Ok(new { result });
}

}

    public class TestRequest { public string Code { get; set; } = string.Empty; }
    public class ValidationRequest { public string Tests { get; set; } = string.Empty; }
    public class JestTestRequest { public string Code { get; set; } = string.Empty; }
public class JestValidationRequest { public string Tests { get; set; } = string.Empty; }
}
