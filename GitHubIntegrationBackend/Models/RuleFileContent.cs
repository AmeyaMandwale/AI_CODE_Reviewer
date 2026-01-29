using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GitHubIntegrationBackend.Models
{
    public class RuleFileContent
    {
        public string? FileName { get; set; }
        public string? Content { get; set; }
        public string? UploadedAt { get; set; }
    }
}