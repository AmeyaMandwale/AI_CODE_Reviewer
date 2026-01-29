using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Models;



namespace GitHubIntegrationBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // Entities
        public DbSet<Organization> Organizations { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Integration> Integrations { get; set; }
        public DbSet<Repository> Repositories { get; set; }
        public DbSet<PullRequest> PullRequests { get; set; }
        public DbSet<PRFile> PRFiles { get; set; }
        public DbSet<RulePack> RulePacks { get; set; }
        public DbSet<AnalysisResult> AnalysisResults { get; set; }
        public DbSet<ReviewerFeedback> Feedbacks { get; set; }
        public DbSet<LearningJournal> LearningJournals { get; set; }
        public DbSet<ReportFile> ReportFiles { get; set; }
        public DbSet<GitHubAppInstallation> GitHubAppInstallations { get; set; }
    public DbSet<DeploymentRequest> DeploymentRequests { get; set; }
    public DbSet<DeploymentLog> DeploymentLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --- Relationships ---
            modelBuilder.Entity<User>()
                .HasOne(u => u.Organization)
                .WithMany()
                .HasForeignKey(u => u.OrgId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Integration>()
                .HasOne(i => i.Organization)
                .WithMany()
                .HasForeignKey(i => i.OrgId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Repository>()
                .HasOne(r => r.Organization)
                .WithMany()
                .HasForeignKey(r => r.OrgId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PullRequest>()
                .HasOne(p => p.Repository)
                .WithMany()
                .HasForeignKey(p => p.RepoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PRFile>()
                .HasOne(f => f.PullRequest)
                .WithMany()
                .HasForeignKey(f => f.PrId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RulePack>()
                .HasOne(rp => rp.Organization)
                .WithMany()
                .HasForeignKey(rp => rp.OrgId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AnalysisResult>()
                .HasOne(a => a.PullRequest)
                .WithMany()
                .HasForeignKey(a => a.PrId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReviewerFeedback>()
                .HasOne(f => f.AnalysisResult)
                .WithMany()
                .HasForeignKey(f => f.AnalysisId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<ReviewerFeedback>()
    .HasOne(f => f.Repository)
    .WithMany()
    .HasForeignKey(f => f.RepoId)
    .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LearningJournal>()
                .HasOne(l => l.Organization)
                .WithMany()
                .HasForeignKey(l => l.OrgId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LearningJournal>()
                .HasOne(l => l.Repository)
                .WithMany()
                .HasForeignKey(l => l.RepoId)
                .OnDelete(DeleteBehavior.Cascade);

                 // ✅ Default Organization
            modelBuilder.Entity<Organization>().HasData(new Organization
            {
                Id = 1,
                Name = "CTPL",
                Settings = "{}"
            });

            // ✅ Default Super Admin User
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                OrgId = 1,
                Email = "ctpl@gmail.com",
                Provider = "GitHub",
                Role = "superadmin",
                Preferences = "{\"theme\":\"dark\",\"notifications\":true}"
            });
        }
        
    }
}
