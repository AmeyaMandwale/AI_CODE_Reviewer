using System.Net.Http.Headers;
using System.Text.Json;

namespace GitHubIntegrationBackend.Services
{
    public class GitHubService
    {
        private readonly HttpClient _client;
        private readonly IConfiguration _config;

        public GitHubService(HttpClient client, IConfiguration config)
        {
            _client = client;
            _config = config;
            _client.DefaultRequestHeaders.UserAgent.Add(
                new ProductInfoHeaderValue("MyApp", "1.0")
            );
        }

        public async Task<string?> ExchangeCodeForTokenAsync(string code)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token");
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "client_id", _config["GITHUB_CLIENT_ID"] },
                { "client_secret", _config["GITHUB_CLIENT_SECRET"] },
                { "code", code }
            });

            var resp = await _client.SendAsync(request);
            resp.EnsureSuccessStatusCode();

            var json = await resp.Content.ReadAsStringAsync();
            var obj = JsonSerializer.Deserialize<Dictionary<string, object>>(json);

            return obj?["access_token"]?.ToString();
        }

        // public async Task<(bool ok, string body, int status)> GetUserReposAsync(string token)
        // {
        //     _client.DefaultRequestHeaders.Authorization =
        //         new AuthenticationHeaderValue("Bearer", token);

        //     _client.DefaultRequestHeaders.UserAgent.Clear();
        //     _client.DefaultRequestHeaders.UserAgent.Add(
        //         new ProductInfoHeaderValue("MyApp", "1.0")
        //     );

        //     var resp = await _client.GetAsync("https://api.github.com/user/repos");
        //     var body = await resp.Content.ReadAsStringAsync();
        //     return (resp.IsSuccessStatusCode, body, (int)resp.StatusCode);
        // }


public async Task<(bool ok, string body, int status)> GetUserReposAsync(string token)
{
    _client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);

    _client.DefaultRequestHeaders.UserAgent.Clear();
    _client.DefaultRequestHeaders.UserAgent.Add(
        new ProductInfoHeaderValue("MyApp", "1.0")
    );

    int page = 1;
    bool hasMore = true;
    var allRepos = new List<JsonElement>();

    while (hasMore)
    {
        var url = $"https://api.github.com/user/repos?per_page=100&page={page}";

        var resp = await _client.GetAsync(url);
        var body = await resp.Content.ReadAsStringAsync();

        if (!resp.IsSuccessStatusCode)
            return (false, body, (int)resp.StatusCode);

        var json = JsonDocument.Parse(body);
        var arr = json.RootElement.EnumerateArray().ToList();

        if (arr.Count == 0)
        {
            hasMore = false;
        }
        else
        {
            allRepos.AddRange(arr);
            page++;
        }
    }

    var finalJson = JsonSerializer.Serialize(allRepos);
    return (true, finalJson, 200);
}

        public async Task<(bool ok, string body, int status)> CreateWebhookAsync(
            string token,
            string owner,
            string repo,
            string webhookUrl,
            string secret)
        {
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            _client.DefaultRequestHeaders.UserAgent.Clear();
            _client.DefaultRequestHeaders.UserAgent.Add(
                new ProductInfoHeaderValue("MyApp", "1.0")
            );

            var bodyData = new
            {
                name = "web",
                active = true,
                events = new[] { "push", "pull_request" },
                config = new
                {
                    url = webhookUrl,
                    content_type = "json",
                    secret
                }
            };

            var req = new HttpRequestMessage(
                HttpMethod.Post,
                $"https://api.github.com/repos/{owner}/{repo}/hooks"
            );

            req.Content = new StringContent(JsonSerializer.Serialize(bodyData),
                System.Text.Encoding.UTF8,
                "application/json");

            var resp = await _client.SendAsync(req);
            var body = await resp.Content.ReadAsStringAsync();

            return (resp.IsSuccessStatusCode, body, (int)resp.StatusCode);
        }
    }
}
