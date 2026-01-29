using System.Diagnostics;
using System.Text;

namespace GitHubIntegrationBackend.Services
{
    public class SastService
    {
        private readonly string _snyk;
        private readonly string _htmlConverter;
        private readonly string _severity;
        private readonly string _org;

        public SastService(IConfiguration config)
        {
            _snyk = config["Snyk:Path"] ?? "snyk";
            _htmlConverter = config["Snyk:HtmlConverter"] ?? "snyk-to-html";
            _severity = config["Snyk:Severity"] ?? "low";
            _org = config["Snyk:Org"] ?? "";
        }

        private string OrgArg() =>
            string.IsNullOrWhiteSpace(_org) ? "" : $"--org={_org}";

        // ------------------ SCA Scan ------------------
        public async Task<string?> RunScaHtmlAsync(string repoDir)
        {
            string json = Path.Combine(repoDir, "sca.json");
            string html = Path.Combine(repoDir, "sca.html");

            await RunAsync(repoDir, _snyk,
                $"test --json-file-output=\"{json}\" --severity-threshold={_severity} {OrgArg()}");

            if (!File.Exists(json))
                return null;

            await RunAsync(repoDir, _htmlConverter,
                $"-i \"{json}\" -o \"{html}\"");

            return File.Exists(html) ? html : null;
        }

        // ------------------ SAST Scan ------------------
        public async Task<string?> RunSastHtmlAsync(string repoDir)
        {
            string json = Path.Combine(repoDir, "sast.json");
            string html = Path.Combine(repoDir, "sast.html");

            await RunAsync(repoDir, _snyk,
                $"code test --json-file-output=\"{json}\" --severity-threshold={_severity} {OrgArg()}");

            if (!File.Exists(json))
                return null;

            await RunAsync(repoDir, _htmlConverter,
                $"-i \"{json}\" -o \"{html}\"");

            return File.Exists(html) ? html : null;
        }

        // ------------------ Combined Report ------------------
        public string BuildCombinedSnykReport(string? scaHtmlPath, string? sastHtmlPath, string owner, string repo, int pr)
        {
            var sb = new StringBuilder();
            string now = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm 'UTC'");

            sb.Append("<html><body style='font-family:Segoe UI;padding:24px;'>");

            sb.Append($@"
<h1>SAST & SCA Report</h1>
<div><b>Repository:</b> {owner}/{repo}</div>
<div><b>Pull Request:</b> #{pr}</div>
<div><b>Generated:</b> {now}</div>
<hr/>
");

            sb.Append("<h2>📦 SCA - Dependency Vulnerabilities</h2>");
            sb.Append(scaHtmlPath != null
                ? File.ReadAllText(scaHtmlPath)
                : "<p>No dependency files found. SCA scan skipped.</p>");

            sb.Append("<hr/>");

            sb.Append("<h2>🔐 SAST - Code Vulnerabilities</h2>");
            sb.Append(sastHtmlPath != null
                ? File.ReadAllText(sastHtmlPath)
                : "<p>No SAST issues detected by Snyk Code.</p>");

            sb.Append("</body></html>");
            return sb.ToString();
        }

        // ------------------ Process Runner ------------------
        private async Task RunAsync(string dir, string cmd, string args)
        {
            var psi = new ProcessStartInfo
            {
                FileName = cmd,
                Arguments = args,
                WorkingDirectory = dir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            var p = Process.Start(psi)!;

            // Keep minimal logs for debugging
            string stdout = await p.StandardOutput.ReadToEndAsync();
            string stderr = await p.StandardError.ReadToEndAsync();

            if (!string.IsNullOrWhiteSpace(stderr))
                Console.WriteLine($"[SNYK ERROR] {stderr}");

            p.WaitForExit();
        }
    }
}
