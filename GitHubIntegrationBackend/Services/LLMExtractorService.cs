using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace GitHubIntegrationBackend.Services
{
    public class LLMExtractorService
    {
        private readonly GeminiService _gemini;
        private readonly ILogger<LLMExtractorService> _logger;

        public LLMExtractorService(GeminiService gemini, ILogger<LLMExtractorService> logger)
        {
            _gemini = gemini;
            _logger = logger;
        }

        /// <summary>
        /// Convert a raw human comment into a single reusable guideline sentence.
        /// Uses Gemini to extract concise guideline. Falls back to shortened comment.
        /// </summary>
     public async Task<string> ExtractRuleAsync(string comment, CancellationToken ct = default)
{
    if (string.IsNullOrWhiteSpace(comment))
        return string.Empty;

    // SAFE MULTILINE STRING — Cannot break C# compiler
    var prompt =
        "Extract ONE concise repository-level guideline from this human reviewer comment.\n" +
        "Return only the guideline sentence (no numbers, no extra explanation).\n" +
        "If the comment is not a guideline, convert it into a guideline.\n\n" +
        "Comment:\n" +
        "\"\"\"" + comment + "\"\"\"\n\n" +
        "Example output:\n" +
        "Follow Interface Segregation Principle: split large services into smaller interfaces.\n";

    try
    {
        var outText = await _gemini.GenerateAsync(prompt, ct);
        if (string.IsNullOrWhiteSpace(outText))
            return Fallback(comment);

        var firstLine = outText
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault();

        var result = (firstLine ?? outText).Trim();

        if (result.Length > 300)
            result = result.Substring(0, 300).Trim();

        return result;
    }
    catch (OperationCanceledException)
    {
        throw;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "LLM extraction failed — using fallback");
        return Fallback(comment);
    }
}

private string Fallback(string comment)
{
    var shortened = comment.Length > 200 ? comment.Substring(0, 200) + "..." : comment;
    return shortened.Replace("\n", " ").Replace("\r", " ").Trim();
}
    }
}
