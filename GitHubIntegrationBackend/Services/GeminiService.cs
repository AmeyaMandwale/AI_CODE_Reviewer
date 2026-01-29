using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

namespace GitHubIntegrationBackend.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        public GeminiService(IHttpClientFactory factory, IConfiguration config)
        {
            _httpClient = factory.CreateClient();
            _config = config;
        }

       private string GeminiUrl
       {
            get
            {
                var apiKey = _config["Gemini:ApiKey"];
                var model = _config["Gemini:Model"];

                return $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
            }
       }
        public async Task<string> GenerateAsync(string prompt, CancellationToken ct = default)
        {
            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                }
            };

            var response = await _httpClient.PostAsJsonAsync(GeminiUrl, payload, ct);

            if (!response.IsSuccessStatusCode)
                return $"Gemini failed: {response.StatusCode}";

            var json = await response.Content.ReadAsStringAsync(ct);

            try
            {
                using var doc = JsonDocument.Parse(json);

                var text =
                    doc.RootElement.GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                return text ?? "";
            }
            catch
            {
                return "⚠️ No meaningful response from Gemini";
            }
        }
    }
}
