using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GitHubIntegrationBackend.Models
{
 public class RulePack
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Organization")]
        public int OrgId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool Enabled { get; set; } = true;
        public string? Rules { get; set; } // JSON (rules)

        public Organization? Organization { get; set; }
         public string? RepoIds { get; set; }
         public string? RepoNames { get; set; }
    }
}