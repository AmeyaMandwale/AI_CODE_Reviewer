namespace GitHubIntegrationBackend.Models
{
    public class ReportFile
    {
        public int Id { get; set; }
        public string ProjectKey { get; set; } = "";
        public string FileName { get; set; } = "";
        public string FileUrl { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
