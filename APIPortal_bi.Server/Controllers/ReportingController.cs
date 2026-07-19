using APIPortal_bi.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace APIPortal_bi.Server.Controllers;

[ApiController]
[Route("api/reporting")]
public sealed class ReportingController(PortalDataService data) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var report = await data.ReadAsync("framework-build-report.json", cancellationToken);
        return Ok(new
        {
            frameworkBuildReports = 1,
            runtimeLogFiles = 0,
            latestRun = report["run"],
            latestSummary = report["summary"],
            evidenceRoots = new
            {
                frameworkReports = "Packaged framework build report",
                frameworkLogs = "Not connected",
                runtimeLogs = "Not connected"
            },
            ingestionState = "Historical ingestion deferred until the baseline is accepted."
        });
    }
}
