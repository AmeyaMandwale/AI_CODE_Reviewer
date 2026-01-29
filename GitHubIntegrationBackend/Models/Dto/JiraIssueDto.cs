using System.Text.Json.Serialization;

namespace GitHubIntegrationBackend.Dto
{
    public class JiraIssueDto
    {
        [JsonPropertyName("key")]
        public string Key { get; set; } = "";

        [JsonPropertyName("fields")]
        public JiraIssueFields Fields { get; set; } = new();
    }

    public class JiraIssueFields
    {
        [JsonPropertyName("summary")]
        public string Summary { get; set; } = "";

        [JsonPropertyName("status")]
        public JiraStatus Status { get; set; } = new();

        [JsonPropertyName("assignee")]
        public JiraUser? Assignee { get; set; }

        [JsonPropertyName("customfield_10007")] // optional: sprint field key (varies)
        public object? Sprint { get; set; }

        // Add any more fields you need
    }

    public class JiraStatus
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
    }

    public class JiraUser
    {
        [JsonPropertyName("displayName")]
        public string DisplayName { get; set; } = "";

        [JsonPropertyName("accountId")]
        public string AccountId { get; set; } = "";

        [JsonPropertyName("emailAddress")]
        public string? Email { get; set; }
    }
}
