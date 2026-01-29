using System.Text.RegularExpressions;


namespace GitHubIntegrationBackend.Services
{
public static class DiffExtractor
{
    public static string GetMeaningfulChanges(string diff)
    {
        var lines = diff.Split('\n');

        var relevant = lines
            .Where(l => l.StartsWith("+") && !l.StartsWith("+++"))
            .Select(l => l.Substring(1).Trim())
            .Where(l =>
                l.Contains("class") ||
                l.Contains("public") ||
                l.Contains("private") ||
                l.Contains("rule") ||
                l.Contains("config") ||
                l.Contains("endpoint") ||
                l.Contains("function") ||
                l.Contains("async") ||
                l.Contains("IService") ||
                Regex.IsMatch(l, @"\b[A-Z][A-Za-z0-9]*\(") // method name
            );

        return string.Join("\n", relevant);
    }
}
}
