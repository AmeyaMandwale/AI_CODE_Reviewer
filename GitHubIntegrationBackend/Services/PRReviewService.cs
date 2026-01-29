

using GitHubIntegrationBackend.Data;
using System.Threading.Tasks;
using System;
using System.Threading;

namespace GitHubIntegrationBackend.Services
{
    /// <summary>
    /// Thin wrapper service kept for backward compatibility.
    /// All real review logic is delegated to ReviewEngine.
    /// </summary>
    public class PRReviewService
    {
        private readonly ReviewEngine _reviewEngine;

        public PRReviewService(ReviewEngine reviewEngine)
        {
            _reviewEngine = reviewEngine;
        }

        /// <summary>
        /// Existing method signature preserved.
        /// Delegates the full PR review process to ReviewEngine.
        /// </summary>
        public async Task ReviewPR(int prId)
        {
            await _reviewEngine.ReviewPullRequestAsync(prId);
        }
    }
}
