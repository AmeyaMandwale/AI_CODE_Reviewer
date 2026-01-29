using System;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IConfiguration config,
        ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendPrHealthMail(string aiReviewText)
    {
        try
        {
            // -----------------------------
            // READ CONFIG
            // -----------------------------
            var smtpHost = _config["Email:SmtpHost"];
            var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
            var smtpUser = _config["Email:Username"];
            var smtpPass = _config["Email:Password"];

            var fromEmail = _config["Email:From"];
            var managerEmail = _config["Email:Manager"];

            if (string.IsNullOrWhiteSpace(managerEmail))
            {
                _logger.LogWarning("Manager email not configured. Skipping email.");
                return;
            }

            // -----------------------------
            // BUILD EMAIL
            // -----------------------------
            var subject = "📊 AI Code Review – Pull Request Health Report";
            var body = BuildEmailBody(aiReviewText);

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            message.To.Add(managerEmail);

            // -----------------------------
            // SEND EMAIL
            // -----------------------------
            using var smtpClient = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            await smtpClient.SendMailAsync(message);

            _logger.LogInformation("PR health email sent successfully to manager.");
        }
        catch (Exception ex)
        {
            // ❗ Email failure must NOT break PR processing
            _logger.LogError(ex, "Failed to send PR health email.");
        }
    }

    // -----------------------------
    // EMAIL BODY FORMATTER
    // -----------------------------
    private string BuildEmailBody(string aiReviewText)
    {
        var escapedText = WebUtility.HtmlEncode(aiReviewText)
            .Replace("\n", "<br/>");

        var sb = new StringBuilder();

        sb.Append(@"
            <html>
            <body style='font-family:Segoe UI, Arial, sans-serif;'>
                <h2>🤖 AI Code Review – PR Health</h2>

                <p>
                    An automated AI code review has been completed for a pull request.
                    Below is the summarized review generated during PR analysis.
                </p>

                <hr/>

                <div style='background-color:#f8f9fa;padding:12px;border-radius:6px;font-size:14px;'>
        ");

        sb.Append(escapedText);

        sb.Append(@"
                </div>

                <hr/>

                <p style='font-size:12px;color:gray;'>
                    This email was auto-generated at pull request review time by the AI Code Reviewer system.
                </p>
            </body>
            </html>
        ");

        return sb.ToString();
    }
}
