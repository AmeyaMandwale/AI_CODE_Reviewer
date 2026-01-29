using Microsoft.AspNetCore.Mvc;
//authentication for extension (Eclipse and VS code )
namespace GitHubIntegrationBackend.Controllers{

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private static readonly Dictionary<string, string> Users = new()
    {
        { "admin@example.com", "123456" },
        { "tester@example.com", "test123" }
    };

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest req)
    {
        if (Users.TryGetValue(req.Email, out var pwd) && pwd == req.Password)
            return Ok(new { token = Guid.NewGuid().ToString("N") });

        return Unauthorized(new { message = "Invalid email or password" });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
}
