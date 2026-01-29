using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;

namespace GitHubIntegrationBackend.Services
{
    // ========================================================================
    //  FEEDBACK SERVICE  (CRUD for ReviewerFeedback)
    // ========================================================================
    public class FeedbackService
    {
        private readonly AppDbContext _db;

        public FeedbackService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<ReviewerFeedback>> GetUnprocessedFeedbackAsync(int repoId, int limit = 100)
        {
            return await _db.Feedbacks
                .Where(f => !f.Processed && f.RepoId == repoId)
                .OrderBy(f => f.Id)
                .Take(limit)
                .ToListAsync();
        }

        public async Task MarkProcessedAsync(int id)
        {
            var fb = await _db.Feedbacks.FindAsync(id);
            if (fb == null) return;

            fb.Processed = true;
            fb.ProcessedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }
}