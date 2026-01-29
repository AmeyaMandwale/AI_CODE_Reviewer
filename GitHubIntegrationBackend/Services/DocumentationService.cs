using System.Text.Json;
using System.Text;

namespace GitHubIntegrationBackend.Services
{

public class DocumentationService
{
    private readonly AiService _ai;

    public DocumentationService(AiService ai)
    {
        _ai = ai;
    }

    public async Task<string?> UpdateReadmeAsync(string diff, string existingReadme)
    {
        // Extract relevant changes
        var summary = DiffExtractor.GetMeaningfulChanges(diff);

        if (string.IsNullOrWhiteSpace(summary))
            return null;

        // Ask AI to analyze if documentation needs updates
        var aiResponse = await _ai.GenerateDocumentationUpdate(existingReadme, summary);

        if (aiResponse.Trim() == existingReadme.Trim())
            return null;

        return aiResponse;
    }
}
}