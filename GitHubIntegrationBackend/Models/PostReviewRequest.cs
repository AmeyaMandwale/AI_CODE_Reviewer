// Models/PostReviewRequest.cs
namespace GitHubIntegrationBackend.Models
{
    public class PostReviewRequest
    {
        public string RepoOwner { get; set; }
        public string RepoName { get; set; }
        public int PrNumber { get; set; }
        public string AccessToken { get; set; }
        public GeminiResponse GeminiResponse { get; set; }
    }
}
