using Microsoft.AspNetCore.Mvc;

namespace APIPortal_bi.Server.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        status = "healthy",
        service = "FastDraft API Portal",
        version = "0.3.1",
        runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
        time = DateTimeOffset.UtcNow
    });
}
