using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GitHubIntegrationBackend.Models
{
     public class User
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Organization")]
        public int OrgId { get; set; }

        public string Email { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string Role { get; set; } = "user";
        public string? Preferences { get; set; } // JSON (preferences)

        public Organization? Organization { get; set; }
    }
}