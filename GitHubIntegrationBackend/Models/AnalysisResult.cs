using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GitHubIntegrationBackend.Models
{
 public class AnalysisResult
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("PullRequest")]
        public int PrId { get; set; }

        public string Type { get; set; } = string.Empty;
        public string ToolName { get; set; } = string.Empty;
        public string? Findings { get; set; } // JSONB
        public DateTime RunAt { get; set; } = DateTime.UtcNow;

        public PullRequest? PullRequest { get; set; }
    }
}