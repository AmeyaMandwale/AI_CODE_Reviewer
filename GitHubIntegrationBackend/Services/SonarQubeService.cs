using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Diagnostics;

namespace GitHubIntegrationBackend.Services
{
    public class SonarQubeService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly string token;

        private readonly string _projectPath;

        private readonly string _projectKey;


        public SonarQubeService(IConfiguration config)
        {
            _baseUrl = config["SonarQube:BaseUrl"]!;
             token = config["SonarQube:Token"]!;
            _projectPath = config["SonarQube:ProjectPath"]!;
            _projectKey = config["SonarQube:ProjectKey"]!;

            _httpClient = new HttpClient();
            var byteArray = Encoding.ASCII.GetBytes($"{token}:");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(byteArray));
        }

        // START - BUILD- END SONARQUBE AUTOMATION 
        private async Task Run(string file, string args)
        {
            var psi = new ProcessStartInfo
            {
                FileName = file,
                Arguments = args,
                WorkingDirectory = _projectPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            // IMPORTANT: give full PATH, otherwise dotnet build gets stuck
            psi.EnvironmentVariables["PATH"] = Environment.GetEnvironmentVariable("PATH")!;

            var process = new Process { StartInfo = psi };
            process.Start();

            // Read live output (prevents deadlock)
            _ = Task.Run(() =>
            {
                while (!process.StandardOutput.EndOfStream);
                     Console.WriteLine(process.StandardOutput.ReadLine());
            });

            _ = Task.Run(() =>
            {
                while (!process.StandardError.EndOfStream);
                    Console.WriteLine(process.StandardError.ReadLine());
            });

            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
                throw new Exception($"Command failed: {file} {args}");
        }

        public async Task RunFullAnalysis()
        {
            // 1️⃣ BEGIN ANALYSIS
            await Run("dotnet",
               // $"sonarscanner begin /k:\"Ctpl-Code-Reviewer\" /d:sonar.host.url=\"{_sonarHost}\" /d:sonar.token=\"{_token}\"");
            $"sonarscanner begin /k:\"{_projectKey}\" /d:sonar.host.url=\"{_baseUrl}\" /d:sonar.token=\"{token}\"");


            // 2️⃣ BUILD PROJECT
            await Run("dotnet", "build --no-incremental");

            // 3️⃣ END ANALYSIS
            await Run("dotnet",
                $"sonarscanner end /d:sonar.token=\"{token}\"");
        }
        public async Task StartSonarQubeAsync()
{
    await Task.Run(() =>
    {
        var psi = new ProcessStartInfo
        {
            FileName = @"C:\Users\Lenovo\Downloads\sonarqube-25.11.0.114957\sonarqube-25.11.0.114957\bin\windows-x86-64\StartSonar.bat",
            WorkingDirectory = @"C:\Users\Lenovo\Downloads\sonarqube-25.11.0.114957\sonarqube-25.11.0.114957\bin\windows-x86-64",
            UseShellExecute = true,     // SonarQube must open its own window
            CreateNoWindow = false
        };

        Console.WriteLine("[INFO] Starting SonarQube server...");
        Process.Start(psi);
    });

    Console.WriteLine("[INFO] SonarQube start command sent.");
}

        // Check if project exists
        public async Task<bool> IsProjectConnectedAsync(string projectKey)
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/projects/search?projects={projectKey}");
            if (!response.IsSuccessStatusCode) return false;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var total = doc.RootElement.GetProperty("paging").GetProperty("total").GetInt32();
            return total > 0;
        }

        // Get project metrics
        public async Task<List<object>> GetProjectMetricsAsync(string projectKey)
        {
            var url = $"{_baseUrl}/api/measures/component?component={projectKey}&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return new List<object>();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            return doc.RootElement.GetProperty("component").GetProperty("measures")
                .EnumerateArray()
                .Select(x => new
                {
                    Metric = x.GetProperty("metric").GetString(),
                    Value = x.GetProperty("value").GetString()
                }).Cast<object>().ToList();
        }

        // Get detailed issues
        public async Task<List<object>> GetProjectIssuesAsync(string projectKey)
        {
            var issues = new List<object>();
            int page = 1, pageSize = 100;
            bool hasMore = true;

            while (hasMore)
            {
                var url = $"{_baseUrl}/api/issues/search?project={projectKey}&ps={pageSize}&p={page}";
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode) break;

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                var issueArray = doc.RootElement.GetProperty("issues").EnumerateArray()
                    .Select(i => new
                    {
                        Key = i.GetProperty("key").GetString(),
                        Component = i.GetProperty("component").GetString(),
                        FilePath = i.GetProperty("component").GetString(),
                        Line = i.TryGetProperty("line", out var lineProp) ? lineProp.GetInt32() : (int?)null,
                        Type = i.GetProperty("type").GetString(),
                        Severity = i.GetProperty("severity").GetString(),
                        Message = i.GetProperty("message").GetString(),
                        Effort = i.TryGetProperty("effort", out var effortProp) ? effortProp.GetString() : null
                    }).ToList();

                issues.AddRange(issueArray);

                int total = doc.RootElement.GetProperty("total").GetInt32();
                hasMore = issues.Count < total;
                page++;
            }

            return issues;
        }

        // Get file-level duplication
        public async Task<List<object>> GetFileDuplicationsAsync(string projectKey)
        {
            var url = $"{_baseUrl}/api/measures/component_tree?component={projectKey}&qualifiers=FIL";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return new List<object>();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            return doc.RootElement.GetProperty("components")
                .EnumerateArray()
                .Select(f => new
                {
                    File = f.GetProperty("path").GetString(),
                    Key = f.GetProperty("key").GetString(),
                    Measures = f.TryGetProperty("measures", out var m) ?
                        m.EnumerateArray()
                         .Where(me => me.GetProperty("metric").GetString() == "duplicated_lines_density")
                         .Select(me => new
                         {
                             Metric = me.GetProperty("metric").GetString(),
                             Value = me.GetProperty("value").GetString()
                         }).FirstOrDefault()
                        : null
                }).Cast<object>().ToList();
        }

        // Get historical trends / activity
        public async Task<List<object>> GetActivityTrendsAsync(string projectKey)
        {
            var url = $"{_baseUrl}/api/measures/search_history?component={projectKey}&metrics=bugs,vulnerabilities,code_smells,coverage";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return new List<object>();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            return doc.RootElement.GetProperty("measures")
                .EnumerateArray()
                .Select(m => new
                {
                    Metric = m.GetProperty("metric").GetString(),
                    History = m.GetProperty("history")
                               .EnumerateArray()
                               .Select(h => new
                               {
                                   Date = h.GetProperty("date").GetString(),
                                   Value = h.GetProperty("value").GetString()
                               }).ToList()
                }).Cast<object>().ToList();
        }
    }
}
