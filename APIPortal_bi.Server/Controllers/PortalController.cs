using APIPortal_bi.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace APIPortal_bi.Server.Controllers;

[ApiController]
[Route("api")]
public sealed class PortalController(PortalDataService data) : ControllerBase
{
    [HttpGet("config")]
    public IActionResult GetConfig() => Ok(new
    {
        portalVersion = "0.2.0",
        frameworkVersion = "0.4.0",
        reportSchemaVersion = "1.0.0",
        backend = ".NET 10 / ASP.NET Core",
        features = new
        {
            frameworkGuide = true,
            guideRenderedNativelyInReact = true,
            standaloneGuide = false,
            separateFrameworkDashboard = false,
            swaggerReference = false,
            reportingBaseline = false,
            qaDbUtilityIntegration = false,
            brunoRunner = false,
            dockerManager = false
        }
    });

    [HttpGet("change-requests")]
    public async Task<IActionResult> GetChangeRequests(CancellationToken cancellationToken) => Ok(await data.ReadAsync("change-requests.json", cancellationToken));

    [HttpGet("review/findings")]
    public IActionResult GetReviewFindings() => Ok(new
    {
        reviewedAt = "2026-07-19",
        findings = new[]
        {
            new { severity = "High", title = "The former Portal server could not be copied unchanged", detail = "Node/Express and SQL-specific endpoints were replaced by a focused ASP.NET Core read-only Portal API." },
            new { severity = "High", title = "QA DB Utility must remain a separate boundary", detail = "The QADBUtility project is retained in the solution but no Portal code calls or modifies it in this baseline." },
            new { severity = "Medium", title = "The full framework guide should remain available during migration", detail = "The v0.4.0 Guide is now the React application itself; no iframe or standalone document route is used." },
            new { severity = "Medium", title = "Source state must be visually truthful", detail = "Pass, fail and breach states have distinct green, red and amber treatments instead of a single decorative pill." }
        }
    });
}
