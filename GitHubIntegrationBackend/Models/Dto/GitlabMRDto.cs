namespace GitHubIntegrationBackend.Dto
{
public class GitlabMRDto
{
    public int id { get; set; }              // Global MR ID (not used)
    public int iid { get; set; }             // Merge Request IID (used for API)
    public int project_id { get; set; }      // Project ID
    public string title { get; set; }
    public string state { get; set; }
    public GitlabUser author { get; set; }
    public DateTime created_at { get; set; }
}

public class GitlabUser
{
    public int id { get; set; }
    public string username { get; set; }
}
}