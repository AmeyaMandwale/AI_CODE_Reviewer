using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GitHubIntegrationBackend.Data;
using GitHubIntegrationBackend.Models;

namespace GitHubIntegrationBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ UPDATED SIGN IN - Now uses Email + OrganizationId
        [HttpPost("signin")]
public async Task<IActionResult> SignIn([FromBody] UserLoginRequest loginRequest)
{
    if (loginRequest == null || string.IsNullOrEmpty(loginRequest.Email) || loginRequest.OrganizationId <= 0)
    {
        return BadRequest(new { message = "Email and valid Organization ID are required." });
    }

    var user = await _context.Users
        .FirstOrDefaultAsync(u => u.Email == loginRequest.Email && u.OrgId == loginRequest.OrganizationId);

    if (user == null)
        return Unauthorized(new { message = "Invalid credentials or organization access" });

    // Check for superadmin (optional - keep your existing logic)
    if (user.Email.Equals("ctpl@gmail.com", StringComparison.OrdinalIgnoreCase))
    {
        return Ok(new
        {
            message = "Login successful (superadmin)",
            redirectPath = "/superadmin",
            user = new { user.Id, user.Email, user.OrgId, user.Role }
        });
    }

    return Ok(new
    {
        message = "Login successful",
        redirectPath = "/",
        user = new { user.Id, user.Email, user.OrgId, user.Role }
    });
}

        // ✅ ADDED: Verification endpoint for frontend auth check
        [HttpPost("verify")]
        public async Task<IActionResult> VerifyUser([FromBody] UserVerificationRequest verifyRequest)
        {
            if (verifyRequest == null || string.IsNullOrEmpty(verifyRequest.Email) || verifyRequest.OrgId <= 0)
            {
                return BadRequest(new { message = "Email and valid Organization ID are required." });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == verifyRequest.Email && u.OrgId == verifyRequest.OrgId);

            if (user == null)
                return Unauthorized(new { message = "User not found or invalid organization access" });

            return Ok(new
            {
                message = "User verified successfully",
                user = new { user.Id, user.Email, user.OrgId, user.Role }
            });
        }

        // ✅ SIGN UP (UPDATED - Now uses OrgId instead of Provider)
        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] User registerRequest)
        {
            if (registerRequest == null || string.IsNullOrEmpty(registerRequest.Email) || registerRequest.OrgId <= 0)
                return BadRequest(new { message = "Email and valid Organization ID are required" });

            // Check if user already exists with same email and organization
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == registerRequest.Email && u.OrgId == registerRequest.OrgId);

            if (existingUser != null)
                return Conflict(new { message = "User already exists with this email in the selected organization." });

            // Set default values
            if (string.IsNullOrEmpty(registerRequest.Role))
                registerRequest.Role = "user";

            if (string.IsNullOrEmpty(registerRequest.Provider))
                registerRequest.Provider = "email"; // Default provider

            if (string.IsNullOrEmpty(registerRequest.Preferences))
                registerRequest.Preferences = "{\"theme\":\"light\",\"notifications\":true}";

            // Save user
            _context.Users.Add(registerRequest);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User registered successfully",
                user = new { registerRequest.Id, registerRequest.Email, registerRequest.OrgId, registerRequest.Role }
            });
        }

        // ✅ GET all users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return Ok(await _context.Users.ToListAsync());
        }

        // ✅ GET user by Id
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }

        // ✅ GET users by Organization ID
        [HttpGet("organization/{orgId}")]
        public async Task<ActionResult<IEnumerable<User>>> GetUsersByOrganization(int orgId)
        {
            var users = await _context.Users
                .Where(u => u.OrgId == orgId)
                .ToListAsync();

            return Ok(users);
        }

        // ✅ UPDATE user
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, User updatedUser)
        {
            if (id != updatedUser.Id)
                return BadRequest(new { message = "User ID mismatch" });

            _context.Entry(updatedUser).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(new { message = "User updated successfully" });
        }

        // ✅ DELETE user
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User deleted successfully" });
        }
    }

    // ✅ ADDED: Request models for better type safety
    public class UserLoginRequest
{
    public string Email { get; set; }
    public int OrganizationId { get; set; }
}

    public class UserVerificationRequest
    {
        public string Email { get; set; }
        public int OrgId { get; set; }
    }
}