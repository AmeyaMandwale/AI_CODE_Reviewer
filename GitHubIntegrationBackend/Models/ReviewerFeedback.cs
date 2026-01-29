// using System;
// using System.ComponentModel.DataAnnotations;
// using System.ComponentModel.DataAnnotations.Schema;
// using System.Text.Json;

// namespace GitHubIntegrationBackend.Models
// {
//     public class ReviewerFeedback
//     {
//         [Key]
//         public int Id { get; set; }

//         [ForeignKey("AnalysisResult")]
//         public int AnalysisId { get; set; }

//         public int AuthorId { get; set; }
//         public string FilePath { get; set; } = string.Empty;
//         public int LineNum { get; set; }
//         public string CommentBody { get; set; } = string.Empty;
//         public string? SuggestedFix { get; set; }

//         public AnalysisResult? AnalysisResult { get; set; }
//     }
// }

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubIntegrationBackend.Models
{
    public class ReviewerFeedback
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("AnalysisResult")]
        public int AnalysisId { get; set; }

        [ForeignKey("Repository")]
        public int RepoId { get; set; }   

        public int AuthorId { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public int LineNum { get; set; }
        public string CommentBody { get; set; } = string.Empty;
        public string? SuggestedFix { get; set; }

        // Scheduler fields
        public bool Processed { get; set; } = false;
        public DateTime? ProcessedAt { get; set; }

        public AnalysisResult? AnalysisResult { get; set; }
        public Repository? Repository { get; set; }
    }
}
