using System;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using System.Text;

namespace GitHubIntegrationBackend.Services
{
    public class logService
    {
        private readonly HttpClient _http;
        private readonly string _token;

        public logService(HttpClient http)
        {
            _http = http;
            _token = Environment.GetEnvironmentVariable("GITHUB_TOKEN");

            if (!string.IsNullOrEmpty(_token))
            {
                _http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", _token);
            }

            _http.DefaultRequestHeaders.UserAgent.ParseAdd("CiLogFetcher/1.0");
        }

public async Task<string?> GetLatestWorkflowLogsCombinedText(string owner, string repo, string branch = "main")
{
    // 1) Fetch runs
    var runsUrl = $"https://api.github.com/repos/{owner}/{repo}/actions/runs?branch={branch}&per_page=5";

    var runsResp = await _http.GetAsync(runsUrl);
    if (!runsResp.IsSuccessStatusCode) return null;

    var json = await runsResp.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(json);

    if (!doc.RootElement.TryGetProperty("workflow_runs", out var runs) || runs.GetArrayLength() == 0)
        return null;

    var latestRun = runs[0];
    var runId = latestRun.GetProperty("id").GetInt64();

    // 2) Fetch logs ZIP
    var logsUrl = $"https://api.github.com/repos/{owner}/{repo}/actions/runs/{runId}/logs";
    var logsResp = await _http.GetAsync(logsUrl);
    if (!logsResp.IsSuccessStatusCode) return null;

    var tmpZip = Path.GetTempFileName();
    using (var fs = File.Create(tmpZip))
    {
        await logsResp.Content.CopyToAsync(fs);
    }

    // 3) Filter patterns
    string[] filterPatterns = new[]
    {
        "error", "failed", "fail", "exception", "warning",
        "critical", "traceback", "FATAL", "CRITICAL",
        "##[error]", "##[warning]",
        "Run ", "Job ", "Step "
    };

    var sb = new System.Text.StringBuilder();

    // 4) Extract ZIP and filter content
    using (var archive = ZipFile.OpenRead(tmpZip))
    {
        foreach (var entry in archive.Entries)
        {
            if (entry.Length == 0) continue;

            using var s = entry.Open();
            using var reader = new StreamReader(s);

            var content = await reader.ReadToEndAsync();
            var lines = content.Split('\n');

            var entryBuilder = new System.Text.StringBuilder();

            foreach (var line in lines)
            {
                if (filterPatterns.Any(p =>
                    line.IndexOf(p, StringComparison.OrdinalIgnoreCase) >= 0))
                {
                    entryBuilder.AppendLine(line.Trim());
                }
            }

            // Only add file section if has filtered logs
            if (entryBuilder.Length > 0)
            {
                sb.AppendLine($"--- {entry.FullName} ---");
                sb.Append(entryBuilder.ToString());
                sb.AppendLine();
            }
        }
    }

    try { File.Delete(tmpZip); } catch { }

    return sb.ToString();
}


  }
}
