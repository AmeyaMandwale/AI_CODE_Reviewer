using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GitHubIntegrationBackend.Dto;
namespace GitHubIntegrationBackend.Services
{
    public class JiraService
    {
        private readonly HttpClient _http;
        private readonly JiraOptions _opts;
        private readonly ILogger<JiraService> _logger;

        public JiraService(IHttpClientFactory httpFactory, IOptions<JiraOptions> opts, ILogger<JiraService> logger)
        {
            _http = httpFactory.CreateClient("jira");
            _opts = opts.Value;
            _logger = logger;
            // base address can be left blank because we pass full URL
        }

        private string GetAuthHeaderValue()
        {
            var raw = $"{_opts.Email}:{_opts.ApiToken}";
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
        }

        public async Task<JiraIssueDto?> GetIssueAsync(string issueKey, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(issueKey)) return null;

            var url = $"{_opts.BaseUrl}/rest/api/3/issue/{issueKey}";
             _logger.LogInformation("🌐 Calling Jira API → {url}", url);
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.Authorization = new AuthenticationHeaderValue("Basic", GetAuthHeaderValue());
            req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            try
            {
                var res = await _http.SendAsync(req, ct);
                if (!res.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Jira.GetIssueAsync failed ({code}) for {key}: {msg}", (int)res.StatusCode, issueKey, await res.Content.ReadAsStringAsync(ct));
                    return null;
                }

                var json = await res.Content.ReadAsStringAsync(ct);
                var dto = JsonSerializer.Deserialize<JiraIssueDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return dto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Jira.GetIssueAsync error for {key}", issueKey);
                return null;
            }
        }

        /// <summary>
        /// Extracts Jira key from strings like branch or PR title. Example patterns: CTPL-123, PROJ-9
        /// Returns null if none found.
        /// </summary>
        public static string? ExtractJiraKey(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return null;
            // simple regex: letters+dash+digits
            var m = System.Text.RegularExpressions.Regex.Match(input!, @"([A-Z][A-Z0-9]+-\d+)");
            return m.Success ? m.Groups[1].Value : null;
        }

        /// <summary>
        /// Convenience: builds the public issue URL
        /// </summary>
        public string IssueUrl(string issueKey) => $"{_opts.BaseUrl}/browse/{issueKey}";
    }
}
