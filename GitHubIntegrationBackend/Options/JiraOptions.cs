namespace GitHubIntegrationBackend.Services
{
    public class JiraOptions
    {
        public string BaseUrl { get; set; } = "";
        public string Email { get; set; } = "";
        public string ApiToken { get; set; } = "";
        public List<string> ProjectKeys { get; set; } = new();
        public bool RequireAssigneeMatch { get; set; } = true;
        public List<string> AllowedStatuses { get; set; } = new() { "In Progress", "To Do" };
    }
}