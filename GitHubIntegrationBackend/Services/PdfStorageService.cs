using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;

namespace GitHubIntegrationBackend.Services
{
    public class PdfStorageService
    {
        private readonly IWebHostEnvironment _env;
        private readonly AppDbContext _db;

      private readonly IHttpContextAccessor _http;

public PdfStorageService(IWebHostEnvironment env, AppDbContext db, IHttpContextAccessor http)
{
    _env = env;
    _db = db;
    _http = http;
}

        public async Task<string> SavePdfAsync(string projectKey, byte[] pdfBytes)
        {
            // Use UTC timestamp folder or same folder per project
            string folderPath = Path.Combine(_env.ContentRootPath, "Reports", projectKey);

            // Create folder if needed
            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            string fileName = $"SonarReport_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf";
            string fullPath = Path.Combine(folderPath, fileName);

            // Write file
            await File.WriteAllBytesAsync(fullPath, pdfBytes);

            // Public URL (served via UseStaticFiles RequestPath = "/reports")
            //string fileUrl = $"/reports/{projectKey}/{fileName}";
                var request = _http.HttpContext.Request;

                string baseUrl = $"{request.Scheme}://{request.Host}";

                string fileUrl = $"{baseUrl}/reports/{projectKey}/{fileName}";

            // Save to DB
            // Save or Update in DB
try
{
    var existingRecord = await _db.ReportFiles
        .FirstOrDefaultAsync(r => r.ProjectKey == projectKey);

                if (existingRecord != null)
                {
                    // Update existing record
                    existingRecord.FileName = fileName;
                    existingRecord.FileUrl = fileUrl;
                    existingRecord.CreatedAt = DateTime.UtcNow;

                    _db.ReportFiles.Update(existingRecord);
                }
                else
                {
                    // Create new
                    var newRecord = new ReportFile
                    {
                        ProjectKey = projectKey,
                        FileName = fileName,
                        FileUrl = fileUrl,
                        CreatedAt = DateTime.UtcNow
                    };

                    _db.ReportFiles.Add(newRecord);
                }

                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new Exception("Failed to save/update report entry: " + ex.Message, ex);
            }


            return fileUrl;
        }
    }
}
