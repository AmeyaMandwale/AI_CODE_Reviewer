using System.Text.Json;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace GitHubIntegrationBackend.Services
{
public class RulePackService
{
    private readonly AppDbContext _ctx;

    public RulePackService(AppDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<string> GetEnabledRulesForOrg(int orgId)
    {
        var packs = await _ctx.RulePacks
            .Where(r => r.OrgId == orgId && r.Enabled == true)
            .ToListAsync();

        if (!packs.Any()) return "No active rules found.";

        // Combine all enabled rules
        var merged = string.Join("\n\n", packs
            .Where(p => !string.IsNullOrWhiteSpace(p.Rules))
            .Select(p => p.Rules));

        return merged;
    }
 public async Task<string> GetEnabledRulesForRepo(int orgId, string repoName)
    {
        // 1️⃣ Fetch all enabled rule packs for this org
        var packs = await _ctx.RulePacks
            .Where(r => r.OrgId == orgId && r.Enabled)
            .ToListAsync();

        if (!packs.Any())
            return "// No active rules found.";

        // 2️⃣ Filter rule packs based ONLY on RepoNames
        var applicablePacks = packs.Where(pack =>
        {
            // If RepoNames is null or empty → treat as "applies to all repos"
            if (string.IsNullOrWhiteSpace(pack.RepoNames))
                return true;

            try
            {
                var names = JsonSerializer.Deserialize<List<string>>(pack.RepoNames) 
                            ?? new List<string>();

                // Full match (case-insensitive)
                return names.Any(name => 
                    name.Equals(repoName, StringComparison.OrdinalIgnoreCase));
            }
            catch
            {
                // Invalid JSON → ignore this pack
                return false;
            }
        });

        // 3️⃣ Merge rule text from applicable packs
        var merged = string.Join("\n\n", applicablePacks
            .Where(p => !string.IsNullOrWhiteSpace(p.Rules))
            .Select(p => FormatRuleContent(p)));

        return string.IsNullOrWhiteSpace(merged)
            ? "// No matching rulepacks for this repository."
            : merged;
    }
    private string FormatRuleContent(RulePack pack)
        {
              
        if (string.IsNullOrWhiteSpace(pack.Rules))
            return $"// RulePack: {pack.Name}\n";

        try
        {
            var json = JsonSerializer.Deserialize<JsonElement>(pack.Rules);

            if (json.ValueKind == JsonValueKind.Object &&
                json.TryGetProperty("content", out var contentProp))
            {
                var content = contentProp.GetString();
                if (!string.IsNullOrWhiteSpace(content))
                {
                    return $"// RulePack: {pack.Name}\n{content}";
                }
            }
        }
        catch
        {
            // ignore parse error and fall back to raw string
        }

        return $"// RulePack: {pack.Name}\n{pack.Rules}";
    }
        }

    }

