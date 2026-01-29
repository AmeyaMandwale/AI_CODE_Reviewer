using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;
using System.Security.Claims;

namespace GitHubIntegrationBackend.Services
{
    public class GitHubAppAuthService
    {
        private readonly IConfiguration _config;
        private readonly RsaSecurityKey _rsaKey;

        public GitHubAppAuthService(IConfiguration config)
        {
            _config = config;

            var pemPath = _config["GITHUB_PRIVATE_KEY_PATH"];
            if (!File.Exists(pemPath))
                throw new Exception($"❌ Private key file NOT found at path: {pemPath}");

            var pem = File.ReadAllText(pemPath);

            var rsa = RSA.Create();
            rsa.ImportFromPem(pem);

            _rsaKey = new RsaSecurityKey(rsa);
        }

        public string GenerateAppJwt()
        {
            var appId = _config["GITHUB_APP_ID"];
            var now = DateTimeOffset.UtcNow;

            var creds = new SigningCredentials(_rsaKey, SecurityAlgorithms.RsaSha256);

            // REQUIRED BY GITHUB: explicit iat in payload
            var iatUnix = now.ToUnixTimeSeconds();

            var claims = new[]
            {
                new Claim("iat", iatUnix.ToString(), ClaimValueTypes.Integer64)
            };

            // NOTE: exp is automatically added by 'expires:' and MUST NOT be manually added.
            var token = new JwtSecurityToken(
                issuer: appId,
                claims: claims,
                notBefore: now.UtcDateTime,
                expires: now.AddMinutes(2).UtcDateTime,   // GitHub allows max 10 minutes; we use 2 for safety
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<string> GetInstallationTokenAsync()
        {
            var jwt = GenerateAppJwt();
            var installationId = _config["GITHUB_INSTALLATION_ID"];

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {jwt}");
            client.DefaultRequestHeaders.Add("Accept", "application/vnd.github+json");
            client.DefaultRequestHeaders.Add("User-Agent", "CTPL-Code-Reviewer-Bot");

            var url = $"https://api.github.com/app/installations/{installationId}/access_tokens";
            var res = await client.PostAsync(url, null);
            var json = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                throw new Exception($"❌ Installation Token Error: {json}");

            var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("token").GetString()!;
        }
    }
}