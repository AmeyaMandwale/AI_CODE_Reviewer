using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GitHubIntegrationBackend.Dto;
namespace GitHubIntegrationBackend.Services
{
    public class JiraValidationResult
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = "";
        public JiraIssueDto? Issue { get; set; }
    }

    public class JiraValidator
    {
        private readonly JiraService _jira;
        private readonly JiraOptions _opts;
        private readonly ILogger<JiraValidator> _logger;

        public JiraValidator(JiraService jira, IOptions<JiraOptions> opts, ILogger<JiraValidator> logger)
        {
            _jira = jira;
            _opts = opts.Value;
            _logger = logger;
        }

        /// <summary>
        /// Validate a PR or branch against the Jira issue.
        /// - Extract issue key (if provided)
        /// - Fetch issue metadata
        /// - Check project allowed, assignee match (optional), status allowed
        /// </summary>
        public async Task<JiraValidationResult> ValidatePrAgainstJiraAsync(
            string prTitleOrBranch,
            string prAuthorGitHubLogin,
            CancellationToken ct = default)
        {   
            _logger.LogWarning("🚨 JIRA VALIDATOR CALLED with title: {title}", prTitleOrBranch);
            var key = JiraService.ExtractJiraKey(prTitleOrBranch);
             _logger.LogInformation("🔑 Extracted Jira Key: {key}", key);
            if (key == null)
                return new JiraValidationResult { IsValid = false, Message = "No Jira key found in PR title/branch." };

            var issue = await _jira.GetIssueAsync(key, ct);
            if (issue == null)
                return new JiraValidationResult { IsValid = false, Message = $"Jira issue {key} not found or not accessible." };

            // check project whitelist if configured
            if (_opts.ProjectKeys?.Count > 0)
            {
                var projKey = key.Split('-')[0];
                if (!_opts.ProjectKeys.Contains(projKey))
                    return new JiraValidationResult { IsValid = false, Message = $"Issue {key} is not in allowed projects." };
            }

            // check status
            var status = issue.Fields.Status?.Name ?? "";
            if (_opts.AllowedStatuses?.Count > 0 && !_opts.AllowedStatuses.Contains(status))
            {
                return new JiraValidationResult { IsValid = false, Message = $"Issue {key} is in status '{status}' which is not allowed for PRs." };
            }

            // optional: check assignee. Matches by display name or email if available.
            if (_opts.RequireAssigneeMatch)
            {
                var assignee = issue.Fields.Assignee;
                if (assignee == null)
                {
                    return new JiraValidationResult { IsValid = false, Message = $"Issue {key} has no assignee." };
                }

                // This is a heuristic: you might map GitHub login ↔ Jira account in DB for reliable check.
                var matches = string.Equals(prAuthorGitHubLogin, assignee.DisplayName, System.StringComparison.OrdinalIgnoreCase)
                              || (!string.IsNullOrEmpty(assignee.Email) && assignee.Email.Contains(prAuthorGitHubLogin, System.StringComparison.OrdinalIgnoreCase));

                if (!matches)
                {
                    // Not fatal — return warning-style failure so callers can decide to block or just warn
                    return new JiraValidationResult
                    {
                        IsValid = false,
                        Message = $"Issue {key} is assigned to {assignee.DisplayName}. PR author '{prAuthorGitHubLogin}' does not match."
                    };
                }
            }

            return new JiraValidationResult { IsValid = true, Message = $"OK: issue {key} passes checks.", Issue = issue };
        }
    }
}
