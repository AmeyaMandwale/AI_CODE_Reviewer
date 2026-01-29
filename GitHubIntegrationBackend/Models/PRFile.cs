using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GitHubIntegrationBackend.Models
{
 public class PRFile
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("PullRequest")]
        public int PrId { get; set; }

        public string Path { get; set; } = string.Empty;
        public string ChangeType { get; set; } = string.Empty;
        public string? Diff { get; set; }

        public PullRequest? PullRequest { get; set; }
    }
}