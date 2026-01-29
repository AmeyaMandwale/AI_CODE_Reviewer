using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace GitHubIntegrationBackend.Services
{
    public class AiService
    {
        private readonly IHttpClientFactory _httpFactory;
        private readonly IConfiguration _config;
        private const string Model = "gemini-2.5-pro";

        public AiService(IHttpClientFactory factory, IConfiguration config)
        {
            _httpFactory = factory;
            _config = config;
        }

        private string GeminiUrl =>
            $"https://generativelanguage.googleapis.com/v1beta/models/{Model}:generateContent?key={_config["Gemini:ApiKey"]}";

        public async Task<string> GenerateDocumentationUpdate(string readme, string newCodeSummary)
        {
            var client = _httpFactory.CreateClient();

            // Encode README safely
            var encodedReadme = Convert.ToBase64String(Encoding.UTF8.GetBytes(readme));

            var promptText = $@"
You will receive README content in Base64 format.
1. Decode it.
2. Analyze README.
3. words limit (100-300).
4. follow the format of existed README.
5. Return ONLY the updates need to add into README (no JSON, no markdown inside code blocks).
6. At the end append: Updated Successfully!

Base64 README:
{encodedReadme}

New code summary:
{newCodeSummary}
";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = promptText }
                        }
                    }
                }
            };

            // Send request to Gemini
            var response = await client.PostAsJsonAsync(GeminiUrl, payload);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return $"ERROR: {response.StatusCode}\n\n{responseBody}";

            // ---------------------------
            // FIX: Detect plain text output
            // ---------------------------
            var trimmed = responseBody.TrimStart();
            if (!trimmed.StartsWith("{"))
            {
                // Gemini returned plain text README directly
                return trimmed;
            }

            // ---------------------------
            // PARSE JSON SAFELY
            // ---------------------------
            try
            {
                using var doc = JsonDocument.Parse(responseBody);

                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return text?.Trim() ?? "";
            }
            catch
            {
                return "update not required!!";
            }
        }
    }
}
