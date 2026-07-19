using System.Text.Json.Nodes;
using APIPortal_bi.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace APIPortal_bi.Server.Controllers;

[ApiController]
[Route("api/framework")]
public sealed class FrameworkController(PortalDataService data) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var report = await data.ReadAsync("framework-build-report.json", cancellationToken);
        var publicApi = await data.ReadAsync("public-api.json", cancellationToken);
        var inventory = await data.ReadAsync("automation-inventory.json", cancellationToken);
        return Ok(new
        {
            connected = true,
            sourceState = "pass",
            reportInfo = new { exists = true, mode = "packaged-baseline" },
            report,
            publicFunctionCount = publicApi["total"]?.GetValue<int>() ?? 0,
            foundationControllers = inventory["foundationControllers"]?.AsArray() ?? new JsonArray(),
            sourceMode = "packaged baseline snapshot"
        });
    }

    [HttpGet("public-api")]
    public async Task<IActionResult> GetPublicApi(CancellationToken cancellationToken) => Ok(await data.ReadAsync("public-api.json", cancellationToken));

    [HttpGet("inventory")]
    public async Task<IActionResult> GetInventory(CancellationToken cancellationToken) => Ok(await data.ReadAsync("automation-inventory.json", cancellationToken));
}
