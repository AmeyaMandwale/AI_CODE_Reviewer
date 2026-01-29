namespace GitHubIntegrationBackend.Models
{
public class GitHubAppInstallation
{
    public int Id { get; set; }
     public string Owner { get; set; } = string.Empty;  
    public string RepoName { get; set; } = string.Empty;

    public long InstallationId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
}