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
using GitHubIntegrationBackend.Dto;
namespace GitHubIntegrationBackend.Services
{
    // ========================================================================
    //  PROMPT BUILDER  (Used by Gemini review generator)
    // ========================================================================
   public class PromptBuilder
{
    private readonly RulePackService _rulePackService;
    private readonly LearningService _learning;
    private readonly JiraService _jiraService;
    public PromptBuilder(RulePackService rulePackService, LearningService learning, JiraService jiraService)
    {
        _rulePackService = rulePackService;
        _learning = learning;
        _jiraService = jiraService;
    }

    /// <summary>
    /// Build a structured prompt combining:
    ///  - rulepacks (repo-level)
    ///  - learned guidelines (human-feedback)
    ///  - PR diffs (list of PRFile)
    /// The returned prompt is ready to be passed to GeminiService.GenerateAsync.
    /// </summary>
    public async Task<string> BuildPromptAsync(Repository repo, List<PRFile> files,GitHubIntegrationBackend.Dto.JiraIssueDto? jiraIssue = null, int maxLearned = 20)
    {
        var ruleContent = await _rulePackService.GetEnabledRulesForRepo(repo.OrgId, repo.Name);
        var learned = await _learning.GetRulesForRepoAsync(repo.Id, maxLearned);

        var sb = new StringBuilder();
        sb.AppendLine("You are a senior code reviewer AI. Use the following RULES and repository-specific learned guidelines.");
        sb.AppendLine();
        sb.AppendLine("=== RULEPACKS ===");
        sb.AppendLine(string.IsNullOrWhiteSpace(ruleContent) ? "(No rulepacks configured for this repo.)" : ruleContent);
        sb.AppendLine();
        sb.AppendLine("=== HUMAN-LEARNED GUIDELINES ===");
        if (learned == null || learned.Count == 0)
            sb.AppendLine("(No human-learned guidelines for this repo yet.)");
        else
        {
            foreach (var l in learned)
            {
                sb.AppendLine($"- {l.PatternRecognized} (observed {l.Frequency} times)");
            }
        }

        sb.AppendLine();
        sb.AppendLine("=== PULL REQUEST DIFFS ===");
        if (files == null || files.Count == 0)
            sb.AppendLine("(No files available)");
        else
        {
            foreach (var f in files)
            {
                sb.AppendLine($"FILE: {f.Path}");
                sb.AppendLine("DIFF:");
                sb.AppendLine(f.Diff ?? "");
                sb.AppendLine("----------");
            }
        }

        sb.AppendLine();
        sb.AppendLine("Generate a 300-400 word developer-friendly structured review containing:");
        sb.AppendLine("1) Short Summary (approx 100 words)");
        sb.AppendLine("2) Major Suggestions (approx 150 words)");
        sb.AppendLine("3) Key Changes (approx 80-100 words)");
        sb.AppendLine();
        sb.AppendLine("When a violation matches a learned guideline above, explicitly mention the guideline and suggest a fix.");
         if (jiraIssue != null)
    {
        sb.AppendLine();
        sb.AppendLine("=== PRODUCT REQUIREMENT (JIRA) ===");
        sb.AppendLine($"{jiraIssue.Key}: {jiraIssue.Fields.Summary}");
        sb.AppendLine($"Link: {_jiraService.IssueUrl(jiraIssue.Key)}");
        sb.AppendLine();
        sb.AppendLine("Check whether the PR implements the requirement above. If not, explain which acceptance criteria are missing.");
    }

        return sb.ToString();
    }
}
}