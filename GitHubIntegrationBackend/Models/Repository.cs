using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GitHubIntegrationBackend.Models
{
    public class Repository
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Organization")]
        public int OrgId { get; set; }

        public string Provider { get; set; } = string.Empty;
        public string ExternalId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime? LastSyncedAt { get; set; }

        public Organization? Organization { get; set; }
    }
}