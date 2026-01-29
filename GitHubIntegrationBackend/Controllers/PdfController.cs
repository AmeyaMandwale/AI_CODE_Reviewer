using Microsoft.AspNetCore.Mvc;
using GitHubIntegrationBackend.Services;
using System.Text;

namespace GitHubIntegrationBackend.Controllers
{
    [Route("api/pdf")]
    [ApiController]
    public class PdfController : ControllerBase
    {
        private readonly SonarQubeService _sonar;
        private readonly PdfService _pdf;
        private readonly PdfStorageService _pdfStorage;
        private readonly IWebHostEnvironment _env;

        public PdfController(
            SonarQubeService sonar,
            PdfService pdf,
            PdfStorageService pdfStorage,
            IWebHostEnvironment env)
        {
            _sonar = sonar;
            _pdf = pdf;
            _pdfStorage = pdfStorage;
            _env = env;
        }

        [HttpGet("sonar-report")]
        public async Task<IActionResult> GenerateReport([FromQuery] string projectKey)
        {
            if (string.IsNullOrWhiteSpace(projectKey))
                return BadRequest(new { success = false, message = "projectKey required" });

            try
            {
                // fetch sonar data (you already have these methods)
                var metrics = await _sonar.GetProjectMetricsAsync(projectKey);
                var issues = await _sonar.GetProjectIssuesAsync(projectKey);

                // load template
                string templatePath = Path.Combine(_env.ContentRootPath, "SonarReportTemplate.html");
                if (!System.IO.File.Exists(templatePath))
                    return StatusCode(500, new { success = false, message = $"Template not found: {templatePath}" });

                string html = System.IO.File.ReadAllText(templatePath);

                // Replace placeholders (your existing replacement logic)
                var metricsRows = new StringBuilder();
                foreach (dynamic m in metrics)
                    metricsRows.Append($"<tr><td>{m.Metric}</td><td>{m.Value}</td></tr>");

                var issuesRows = new StringBuilder();
                foreach (dynamic i in issues.Take(10))
                {
                    issuesRows.Append($@"<tr>
                        <td>{i.Severity}</td>
                        <td>{i.FilePath}</td>
                        <td>{i.Message}</td>
                        <td>{i.Line}</td>
                        <td>{i.Effort}</td>
                    </tr>");
                }

                html = html.Replace("{{metricsRows}}", metricsRows.ToString())
                           .Replace("{{issuesRows}}", issuesRows.ToString());

                // create PDF bytes
                byte[] pdfBytes = _pdf.GeneratePdf(html);

                // Save PDF and persist URL
                string fileUrl = await _pdfStorage.SavePdfAsync(projectKey, pdfBytes);

                // Return JSON with pdfUrl (relative path served by static files)
                return Ok(new { success = true, pdfUrl = fileUrl });
            }
            catch (Exception ex)
            {
                // Log ex (Console for now)
                Console.Error.WriteLine("GenerateReport error: " + ex);

                // Return JSON error (so frontend res.json() doesn't fail)
                return StatusCode(500, new { success = false, message = "Failed to generate report", detail = ex.Message });
            }
        }
    }
}
