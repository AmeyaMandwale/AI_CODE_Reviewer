using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubIntegrationBackend.Models
{
    public class DeploymentLog
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey(nameof(DeploymentRequest))]
        public int DeploymentRequestId { get; set; }

        [Required]
        public string StepName { get; set; } = string.Empty;

        [Required]
        public string LogContent { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DeploymentRequest? DeploymentRequest { get; set; }
    }
}
