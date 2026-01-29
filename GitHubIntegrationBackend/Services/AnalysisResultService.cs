using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace GitHubIntegrationBackend.Services
{
public class AnalysisResultService
{
    private readonly AppDbContext _ctx;

    public AnalysisResultService(AppDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<AnalysisResult> SaveAnalysisAsync(
        int prId,
        string analysisText,
        string toolName = "Gemini",
        string type = "AI-Review")
    {
        var result = new AnalysisResult
        {
            PrId = prId,
            ToolName = toolName,
            Type = type,
            Findings = analysisText,       // raw Gemini text or JSON
            RunAt = DateTime.UtcNow
        };

        _ctx.AnalysisResults.Add(result);
        await _ctx.SaveChangesAsync();

        return result;
    }

    public async Task<List<AnalysisResult>> GetResultsForPrAsync(int prId)
    {
        return await _ctx.AnalysisResults
            .Where(a => a.PrId == prId)
            .OrderByDescending(a => a.RunAt)
            .ToListAsync();
    }
}
}
