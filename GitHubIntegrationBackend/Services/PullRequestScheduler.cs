using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Services;
using System.Threading;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace GitHubIntegrationBackend.Services
{
public class PullRequestScheduler : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(60);

    public PullRequestScheduler(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            Console.WriteLine($"✅ PR Scheduler started at {DateTime.UtcNow}");

            try
            {
                using var scope = _serviceProvider.CreateScope();

                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var prService = scope.ServiceProvider.GetRequiredService<PullRequestService>();
                var prFileSync = scope.ServiceProvider.GetRequiredService<PRFileSyncService>();
                 var reviewEngine = scope.ServiceProvider.GetRequiredService<ReviewEngine>();
                 
                var repos = await context.Repositories.ToListAsync(stoppingToken);

                foreach (var repo in repos)
                {
                    try
                    {
                        var integration = await context.Integrations
                            .Where(i => i.OrgId == repo.OrgId && i.Provider == repo.Provider)
                            .FirstOrDefaultAsync(stoppingToken);

                        if (integration == null)
                        {
                            Console.WriteLine($"⚠ No integration token found for repo {repo.Name}");
                            continue;
                        }

                        string token = ExtractAccessToken(integration.Config);

                        // 1️⃣ Sync Pull Requests
                        if (repo.Provider == "gitlab")
                        {
                            await prService.SyncPullRequestsFromGitLab(repo.Id, token);
                        }
                        else
                        {
                            await prService.SyncPullRequestsFromGitHub(repo.Id, token);
                        }

                        Console.WriteLine($"✔ PR sync done for repo {repo.Name}");

                        // 2️⃣ Fetch latest PRs for this repo
                       var prs = await context.PullRequests
                       .Where(x => x.RepoId == repo.Id && 
           (x.Status == "open" || x.Status == "opened"))

                        .ToListAsync(stoppingToken);

                        // 3️⃣ Sync PR Files + Gemini comments
                        // foreach (var pr in prs)
                        // {
                        //     try
                        //     {
                        //         await prFileSync.SyncPRFiles(pr.Id);
                        //         Console.WriteLine($"✨ PR files synced & Gemini posted for PR {pr.Id}");
                        //     }
                        //     catch (Exception ex)
                        //     {
                        //         Console.WriteLine($"⚠ Error syncing PR files for PR {pr.Id}: {ex.Message}");
                        //     }
                        // }
                       

foreach (var pr in prs)
{
    try
    {
        Console.WriteLine($"🚀 Running full ReviewEngine for PR {pr.Id}");
        await reviewEngine.ReviewPullRequestAsync(pr.Id, stoppingToken);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠ Error running ReviewEngine for PR {pr.Id}: {ex.Message}");
    }
}


                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠ Scheduler repo-level error: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Scheduler fatal error: {ex.Message}");
            }

            Console.WriteLine($"⏳ Sleeping for 60 minutes...");
            await Task.Delay(_interval, stoppingToken);
        }
    }

    private string ExtractAccessToken(string raw)
    {
        try
        {
            var doc = System.Text.Json.JsonDocument.Parse(raw);
            return doc.RootElement.GetProperty("access_token").GetString()!;
        }
        catch
        {
            return raw;
        }
    }
}
}