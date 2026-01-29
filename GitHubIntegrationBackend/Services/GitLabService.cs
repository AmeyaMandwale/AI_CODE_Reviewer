using System.Net.Http.Headers;
using System.Text.Json;

namespace GitHubIntegrationBackend.Services
{
    public class GitLabService
    {
        private readonly HttpClient _client;
        private readonly IConfiguration _config;

        public GitLabService(HttpClient client, IConfiguration config)
        {
            _client = client;
            _config = config;
        }

        // 🔹 Exchange code for access token
        public async Task<string?> ExchangeCodeForTokenAsync(string code)
        {
            var clientId = _config["GITLAB_CLIENT_ID"];
            var clientSecret = _config["GITLAB_CLIENT_SECRET"];
            var redirectUri = _config["GITLAB_REDIRECT_URI"];

            var form = new Dictionary<string, string>
            {
                { "client_id", clientId },
                { "client_secret", clientSecret },
                { "code", code },
                { "grant_type", "authorization_code" },
                { "redirect_uri", redirectUri }
            };

            var response = await _client.PostAsync("https://gitlab.com/oauth/token", new FormUrlEncodedContent(form));
            var json = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.TryGetProperty("access_token", out var tokenElem)
                ? tokenElem.GetString()
                : null;
        }

        // 🔹 Fetch user repositories (projects)
        public async Task<(bool ok, string body, int status)> GetUserReposAsync(string token)
        {
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var resp = await _client.GetAsync("https://gitlab.com/api/v4/projects?membership=true");
            var body = await resp.Content.ReadAsStringAsync();
            return (resp.IsSuccessStatusCode, body, (int)resp.StatusCode);
        }
    }
}
