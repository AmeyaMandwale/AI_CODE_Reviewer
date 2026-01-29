using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using System.Threading;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace GitHubIntegrationBackend.Services
{
    /// <summary>
    /// PRFileScheduler triggers ONLY PRFileSyncService.
    /// This means:
    ///  - Jira validation runs here (inside PRFileSyncService)
    ///  - Gemini runs here
    ///  - SAST button is added here
    ///  - Comments are posted here
    ///  - Analysis is saved here
    /// 
    /// NOTHING else should run AI review except PRFileSyncService.
    /// </summary>
    public class PRFileScheduler : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _interval = TimeSpan.FromMinutes(30); 

        public PRFileScheduler(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                Console.WriteLine($"🔄 PR File Scheduler started at {DateTime.UtcNow}");

                try
                {
                    using var scope = _serviceProvider.CreateScope();

                    var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var prFileSync = scope.ServiceProvider.GetRequiredService<PRFileSyncService>();

                    // only process OPEN PRs
                    var prs = await ctx.PullRequests
                        .Include(x => x.Repository)
                        .Where(x => x.Status == "open" || x.Status == "opened")
                        .ToListAsync(stoppingToken);

                    foreach (var pr in prs)
                    {
                        Console.WriteLine($"🔍 Running FULL AI review pipeline for PR {pr.Id}");

                        try
                        {
                            await prFileSync.SyncPRFiles(pr.Id);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"⚠ Error syncing & reviewing PR {pr.Id}: {ex.Message}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ PR File Scheduler ERROR: {ex.Message}");
                }

                Console.WriteLine($"⏳ Sleeping 30 minutes before next run…");
                await Task.Delay(_interval, stoppingToken);
            }
        }
    }
}
