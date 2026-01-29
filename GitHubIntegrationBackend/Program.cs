using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using DinkToPdf;               
using DinkToPdf.Contracts;     
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Services;
using Microsoft.Extensions.FileProviders;
using GitHubIntegrationBackend.Utils;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddHttpClient();
builder.Services.AddScoped<GitHubService>();
builder.Services.AddScoped<SonarQubeService>();
builder.Services.AddScoped<GeminiService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<PullRequestService>();
builder.Services.AddHostedService<PullRequestScheduler>();
builder.Services.AddScoped<PRReviewService>();
builder.Services.AddScoped<ContributorService>();
builder.Services.AddScoped<GitHubPRCommentService>();
builder.Services.AddScoped<GitHubCommentService>();
builder.Services.AddScoped<GitLabCommentService>();
builder.Services.AddScoped<GitHubPRFileService>();
builder.Services.AddScoped<GitLabPRFileService>();
builder.Services.AddScoped<PRFileSyncService>();
builder.Services.AddScoped<GitLabService>();
builder.Services.AddHostedService<PRFileScheduler>();
builder.Services.AddScoped<RulePackService>();
builder.Services.AddScoped<AnalysisResultService>();
builder.Services.AddScoped<PdfStorageService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AiService>();
builder.Services.AddScoped<logService>();
builder.Services.AddScoped<DocumentationService>();
builder.Services.AddScoped<FeedbackService>();
builder.Services.AddScoped<LearningService>();
builder.Services.AddScoped<LLMExtractorService>();
builder.Services.AddScoped<PromptBuilder>();
builder.Services.AddScoped<ReviewEngine>();
builder.Services.AddHostedService<FeedbackLearningScheduler>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<SastService>();

builder.Services.AddScoped<EmailService>();


var context = new CustomAssemblyLoadContext();
var wkLibPath = Path.Combine(builder.Environment.ContentRootPath, "Native", "libwkhtmltox.dll");
if (File.Exists(wkLibPath))
{
    context.LoadUnmanagedLibrary(wkLibPath);
}

builder.Configuration.AddEnvironmentVariables();
builder.Services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
builder.Services.AddScoped<PdfService>();
builder.Services.AddSingleton<GitHubAppAuthService>();

builder.Services.Configure<JiraOptions>(builder.Configuration.GetSection("Jira"));

builder.Services.AddHttpClient("jira", client =>
{
    // don't set BaseAddress here; the JiraService composes full URLs
    client.DefaultRequestHeaders.UserAgent.ParseAdd("CTPL-Code-Reviewer");
});

builder.Services.AddScoped<JiraService>();
builder.Services.AddScoped<JiraValidator>();

var app = builder.Build();
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var json = System.Text.Json.JsonSerializer.Serialize(new
        {
            message = "Internal server error",
            error = ex.Message
        });

        await context.Response.WriteAsync(json);
    }
});

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Serve reports folder as static URL
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "Reports")
    ),
    RequestPath = "/reports"
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.WebRootPath, "sast-reports")
    ),
    RequestPath = "/sast-reports"
});
// ✅ FORCE CORS FIX
app.Use(async (context, next) =>
{
    if (context.Request.Method == "OPTIONS")
    {
        context.Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:5173");
        context.Response.Headers.Add("Access-Control-Allow-Headers", "*");
        context.Response.Headers.Add("Access-Control-Allow-Methods", "*");
        context.Response.Headers.Add("Access-Control-Allow-Credentials", "true");
        context.Response.StatusCode = 200;
        return;
    }

    await next();
});


app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

internal class CustomAssemblyLoadContext : System.Runtime.Loader.AssemblyLoadContext
{
    public IntPtr LoadUnmanagedLibrary(string absolutePath)
    {
        return LoadUnmanagedDll(absolutePath);
    }

    protected override IntPtr LoadUnmanagedDll(string unmanagedDllName)
    {
        return LoadUnmanagedDllFromPath(unmanagedDllName);
    }

    protected override System.Reflection.Assembly? Load(System.Reflection.AssemblyName assemblyName) => null;
}