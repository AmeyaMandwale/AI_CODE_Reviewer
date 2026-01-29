using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using GitHubIntegrationBackend.Data;
using Microsoft.EntityFrameworkCore;

namespace GitHubIntegrationBackend.Services
{
public class GitLabPRFileService
{
    private readonly AppDbContext _ctx;
    private readonly IHttpClientFactory _factory;

    public GitLabPRFileService(AppDbContext ctx, IHttpClientFactory factory)
    {
        _ctx = ctx;
        _factory = factory;
    }

    public async Task<List<GitLabFileDto>> GetPRFilesAsync(string projectIdStr, string iidStr)
{
    if (!int.TryParse(projectIdStr, out int projectId))
        throw new Exception($"Invalid GitLab Project ID: {projectIdStr}");

    if (!int.TryParse(iidStr, out int iid))
        throw new Exception($"Invalid GitLab Merge Request IID: {iidStr}");

    var integration = await _ctx.Integrations.FirstOrDefaultAsync(i => i.Provider == "gitlab");
    if (integration == null)
        throw new Exception("❌ GitLab integration not found");

    var token = JsonDocument.Parse(integration.Config)
        .RootElement.GetProperty("access_token").GetString();

    var http = _factory.CreateClient();
    http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    var url = $"https://gitlab.com/api/v4/projects/{projectId}/merge_requests/{iid}/changes?per_page=100";
    var res = await http.GetAsync(url);

    if (!res.IsSuccessStatusCode)
    {
        var content = await res.Content.ReadAsStringAsync();
        throw new Exception($"GitLab API error: {res.StatusCode}, {content}");
    }

    var json = await res.Content.ReadAsStringAsync();
    var data = JsonSerializer.Deserialize<GitLabChangesDto>(json);

    return data?.changes ?? new List<GitLabFileDto>();
}

   public async Task<DateTime?> GetLastCommitTimeAsync(HttpClient http, string projectId, string iid)
{
    var url = $"https://gitlab.com/api/v4/projects/{projectId}/merge_requests/{iid}";
    var res = await http.GetStringAsync(url);

    var dto = JsonSerializer.Deserialize<GitLabMRDetailDto>(res);

    return dto?.updated_at;
}

public class GitLabMRDetailDto
{
    public DateTime updated_at { get; set; }
}



}
 public class GitLabNoteDto
{
    public string body { get; set; }
}

public class GitLabChangesDto
{
    public List<GitLabFileDto> changes { get; set; } = new();
}

public class GitLabFileDto
{
    public string old_path { get; set; } = "";
    public string new_path { get; set; } = "";
    public string diff { get; set; } = "";
}
}