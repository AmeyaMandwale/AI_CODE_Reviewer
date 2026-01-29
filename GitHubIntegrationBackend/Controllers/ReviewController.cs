using Microsoft.AspNetCore.Mvc;
using GitHubIntegrationBackend.Services;
namespace GitHubIntegrationBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly GeminiService _gemini;
        private readonly IConfiguration _config;
        private readonly RulePackService _rulePackService;   

        public ReviewController(
            GeminiService gemini,
            IConfiguration config,
            RulePackService rulePackService)                 
        {
            _gemini = gemini;
            _config = config;
            _rulePackService = rulePackService;              
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeCode([FromBody] ReviewRequest request, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
                return BadRequest(new { error = "Missing 'code' in request body." });
             request.OrgId=1;
            if (request.OrgId <= 0) 
                 {  
                    Console.WriteLine($"📥 Received OrgId: {request.OrgId}, Code Length: {request.Code?.Length}");
 
                return BadRequest(new { error = "Missing or invalid 'orgId' in request body." });
                 }
            // 🔹 Fetch custom rules from DB using RulePackService
            var rulesText = await _rulePackService.GetEnabledRulesForOrg(request.OrgId);

            var prompt = $@"
You are an AI code reviewer for organization '{_config["Organization:Name"]}' and do not consider diff coming from any test folder in any project.
Return the code review as GitHub-style Markdown with headings, bullet points, and fenced code blocks. Do not wrap the response in JSON.
Apply the following organization rules strictly:
{rulesText}
5. All variable and function names must start with the 'ctpl' prefix (e.g., ctplUserData, ctplProcessInput).
Analyze ONLY the code diff / PR patch below and identify concrete rule violations, syntax or runtime bugs, and provide suggested fixes.
Return a concise structured review.

CODE/DIFF:
{request.Code}
";

            var result = await _gemini.GenerateAsync(prompt, ct);
            return Ok(new { result });
        }
    }



    public class ReviewRequest
    {
        public string Code { get; set; } = string.Empty;
        public int OrgId { get; set; }
    }
}
