using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GitHubIntegrationBackend.Data;
using Microsoft.EntityFrameworkCore;

namespace GitHubIntegrationBackend.Services
{
    public class GitHubPRCommentService
    {
        private readonly AppDbContext _ctx;
        private readonly IHttpClientFactory _factory;

        public GitHubPRCommentService(AppDbContext ctx, IHttpClientFactory factory)
        {
            _ctx = ctx;
            _factory = factory;
        }

        public async Task PostCommentAsync(
            string owner,
            string repo,
            int prNumber,
            string comment)
        {
            // find token from DB
            var integration = await _ctx.Integrations
                .FirstOrDefaultAsync(i => i.Provider == "github");

            if (integration == null)
                throw new Exception("❌ GitHub Integration not found");

            string token = ExtractToken(integration.Config);

            var http = _factory.CreateClient();
            http.DefaultRequestHeaders.UserAgent.ParseAdd("App");
            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var body = new { body = comment };

            var json = JsonSerializer.Serialize(body);

            var res = await http.PostAsync(
                $"https://api.github.com/repos/{owner}/{repo}/issues/{prNumber}/comments",
                new StringContent(json, Encoding.UTF8, "application/json")
            );

            res.EnsureSuccessStatusCode();
        }

        private static string ExtractToken(string config)
        {
            try
            {
                using var doc = JsonDocument.Parse(config);
                if (doc.RootElement.TryGetProperty("access_token", out var t))
                    return t.GetString()!;
            }
            catch { }
            return config;
        }
    }
}
