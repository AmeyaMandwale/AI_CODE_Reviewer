using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubIntegrationBackend.Models
{
    public class DeploymentRequest
    {
        [Key]
        public int Id { get; set; }

        // FK → repositories.id
        [ForeignKey(nameof(Repository))]
        public int RepoId { get; set; }

        [Required]
        [MaxLength(255)]
        public string BranchName { get; set; } = string.Empty;

        // Uploaded GitHub Actions YAML file name
        [Required]
        [MaxLength(255)]
        public string WorkflowFileName { get; set; } = string.Empty;

        // GitHub Actions workflow run ID
        public long? GitHubRunId { get; set; }

        // Deployment status
        public DeploymentStatus Status { get; set; } = DeploymentStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        // Navigation
        public Repository? Repository { get; set; }
    }

    public enum DeploymentStatus
    {
        Pending,
        Running,
        Success,
        Failed
    }
}
