using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GitHubIntegrationBackend.Models
{
    public class PullRequest
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Repository")]
        public int RepoId { get; set; }

        public string ExternalId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int AuthorId { get; set; }
        public string Status { get; set; } = "open";
        public string SourceBranch { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Repository? Repository { get; set; }
   
    }
}