using System.Security.Cryptography;
using System.Text;
using System.Web;

namespace GitHubIntegrationBackend.Utils
{
    public static class SastTriggerUrlHelper
    {
        // Generate URL to send to GitHub PR
        public static string GenerateSignedUrl(
            string baseUrl,
            string owner,
            string repo,
            int prNumber,
            string secret,
            TimeSpan expiration)
        {
            long exp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                       + (long)expiration.TotalSeconds;

            string payload = $"{owner}|{repo}|{prNumber}|{exp}";
            string sig = ComputeSignature(payload, secret);

            return $"{baseUrl}/api/sast/trigger?" +
                   $"owner={owner}&repo={repo}&pr={prNumber}&exp={exp}&sig={HttpUtility.UrlEncode(sig)}";
        }

        // Compute HMAC SHA256 signature
        public static string ComputeSignature(string payload, string secret)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));

            return Convert.ToBase64String(hash)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');
        }

        // Validate incoming URL
        public static bool ValidateSignature(
            string owner,
            string repo,
            int pr,
            long exp,
            string sig,
            string secret)
        {
            string payload = $"{owner}|{repo}|{pr}|{exp}";
            string expected = ComputeSignature(payload, secret);

            return sig == expected;
        }
    }
}
