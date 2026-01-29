namespace GitHubIntegrationBackend.Dto
{
    public class GitLabRepoDto
{
    public int id { get; set; }
    public string name { get; set; } = string.Empty;
    public string? description { get; set; }
    public string? web_url { get; set; }
    public string? visibility { get; set; }
}
}