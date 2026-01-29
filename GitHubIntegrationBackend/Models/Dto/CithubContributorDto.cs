namespace GitHubIntegrationBackend.Dto
{
    public class GithubContributorDto
    {
        public int id { get; set; }
        public string login { get; set; } = "";
        public string? email { get; set; } // Some contributors may not have email public
    }
}
