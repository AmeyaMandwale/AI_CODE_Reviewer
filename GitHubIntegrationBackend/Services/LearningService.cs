using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;

namespace GitHubIntegrationBackend.Services
{
    // ========================================================================
    //  LEARNING SERVICE  (Upsert rules into LearningJournal)
    // ========================================================================
     public class LearningService
{
    private readonly AppDbContext _ctx;

    public LearningService(AppDbContext ctx)
    {
        _ctx = ctx;
    }

    // Upsert a normalized rule for a repo (increment frequency if exists)
    public async Task<LearningJournal> UpsertPatternAsync(int orgId, int repoId, string pattern, string sourceType = "human_feedback", string? modelVersion = null)
    {
        var normalized = (pattern ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new ArgumentException("pattern cannot be empty", nameof(pattern));

        var existing = await _ctx.LearningJournals
            .Where(l => l.RepoId == repoId && l.PatternRecognized == normalized)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            existing.Frequency += 1;
            existing.LastObservedAt = DateTime.UtcNow;
            if (!string.IsNullOrEmpty(modelVersion)) existing.ModelVersion = modelVersion;
            await _ctx.SaveChangesAsync();
            return existing;
        }

        var entry = new LearningJournal
        {
            OrgId = orgId,
            RepoId = repoId,
            SourceType = sourceType,
            PatternRecognized = normalized,
            ModelVersion = modelVersion ?? string.Empty,
            Frequency = 1,
            CreatedAt = DateTime.UtcNow,
            LastObservedAt = DateTime.UtcNow
        };

        _ctx.LearningJournals.Add(entry);
        await _ctx.SaveChangesAsync();
        return entry;
    }

    // Get top rules for repo ordered by frequency
    public async Task<List<LearningJournal>> GetRulesForRepoAsync(int repoId, int max = 20)
    {
        return await _ctx.LearningJournals
            .Where(l => l.RepoId == repoId)
            .OrderByDescending(l => l.Frequency)
            .Take(max)
            .ToListAsync();
    }
}
}