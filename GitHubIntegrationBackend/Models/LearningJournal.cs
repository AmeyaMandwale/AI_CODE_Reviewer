
// using System;
// using System.ComponentModel.DataAnnotations;
// using System.ComponentModel.DataAnnotations.Schema;
// using System.Text.Json;

// namespace GitHubIntegrationBackend.Models
// {
//     public class LearningJournal
//     {
//         [Key]
//         public int Id { get; set; }

//         [ForeignKey("Organization")]
//         public int OrgId { get; set; }

//         [ForeignKey("Repository")]
//         public int RepoId { get; set; }

//         public string SourceType { get; set; } = string.Empty;
//         public string PatternRecognized { get; set; } = string.Empty;
//         public string ModelVersion { get; set; } = string.Empty;

//         public Organization? Organization { get; set; }
//         public Repository? Repository { get; set; }
//     }
// }


using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubIntegrationBackend.Models
{
    public class LearningJournal
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Organization")]
        public int OrgId { get; set; }

        [ForeignKey("Repository")]
        public int RepoId { get; set; }

        public string SourceType { get; set; } = string.Empty;

        // The extracted rule / guideline
        public string PatternRecognized { get; set; } = string.Empty;

        // Optional: allow null
        public string? ModelVersion { get; set; }

        // NEW: How many times this rule is observed
        public int Frequency { get; set; } = 1;

        // NEW: created timestamp
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // NEW: updated when new matching rule is added
        public DateTime LastObservedAt { get; set; } = DateTime.UtcNow;

        public Organization? Organization { get; set; }
        public Repository? Repository { get; set; }
    }
}