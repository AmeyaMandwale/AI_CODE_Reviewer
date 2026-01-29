using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GitHubIntegrationBackend.Models
{
     public class Integration
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Organization")]
        public int OrgId { get; set; }

        public string Type { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string? Config { get; set; } // JSON (config)

        public Organization? Organization { get; set; }
    }
}