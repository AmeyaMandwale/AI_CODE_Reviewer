using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;

namespace GitHubIntegrationBackend.Services
{
    public class GitLabCommentService
    {
        private readonly AppDbContext _ctx;
        private readonly IHttpClientFactory _factory;

        public GitLabCommentService(AppDbContext ctx, IHttpClientFactory factory)
        {
            _ctx = ctx;
            _factory = factory;
        }

        // --------------------------------------------------------
        // 🔹 Add a comment to GitLab Merge Request
        // --------------------------------------------------------
        public async Task<bool> AddCommentAsync(string externalId, string comment)
        {
            // externalId format expected → "iid:projectId"
            var parts = externalId.Split(':');

            if (parts.Length != 2)
                throw new Exception($"❌ Invalid GitLab ExternalId format: {externalId}");

            string iid = parts[0];
            string projectId = parts[1];

            // Fetch integration token
            var integration = await _ctx.Integrations
                .FirstOrDefaultAsync(i => i.Provider == "gitlab");

            if (integration == null)
                throw new Exception("❌ GitLab Integration not found");

            var token = ExtractToken(integration.Config);

            var http = _factory.CreateClient();
            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            string url =
                $"https://gitlab.com/api/v4/projects/{projectId}/merge_requests/{iid}/notes";

            var payload = new
            {
                body = comment
            };

            var response = await http.PostAsJsonAsync(url, payload);

            Console.WriteLine($"POST MR COMMENT → {url} → {(int)response.StatusCode}");

            return response.IsSuccessStatusCode;
        }

        public async Task<DateTime?> GetLastAICommentTimeAsync(string projectId, string iid, HttpClient http)
{
    var url = $"https://gitlab.com/api/v4/projects/{projectId}/merge_requests/{iid}/notes";

    var res = await http.GetStringAsync(url);
    var notes = JsonSerializer.Deserialize<List<GitLabNoteDto>>(res);

    var aiNote = notes?
        .Where(n => n.body.Contains("[AI-REVIEW]"))
        .OrderByDescending(n => n.created_at)
        .FirstOrDefault();

    return aiNote?.created_at;
}

public class GitLabNoteDto
{
    public string body { get; set; }
    public DateTime created_at { get; set; }
}


        // --------------------------------------------------------
        // 🔹 Extract token (JSON or string)
        // --------------------------------------------------------
        private string ExtractToken(string config)
        {
            try
            {
                var json = JsonDocument.Parse(config);
                if (json.RootElement.TryGetProperty("access_token", out var prop))
                    return prop.GetString()!;
            }
            catch
            {
                // fallback: raw token
            }

            return config;
        }
    }
}
