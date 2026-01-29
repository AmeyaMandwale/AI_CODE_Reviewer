namespace GitHubIntegrationBackend.Dto
{
    public class GithubPRDto
    {
        public long id { get; set; }
        public string title { get; set; } = "";
        public string state { get; set; } = "";
        public DateTime created_at { get; set; }
        public UserDto user { get; set; }
    }

    public class UserDto
    {
        public int id { get; set; }
    }
}
