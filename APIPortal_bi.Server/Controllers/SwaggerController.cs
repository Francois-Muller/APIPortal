using System.Text.Json.Nodes;
using APIPortal_bi.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace APIPortal_bi.Server.Controllers;

[ApiController]
[Route("api/swagger")]
public sealed class SwaggerController(PortalDataService data) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var inventory = await data.ReadAsync("swagger-inventory.json", cancellationToken);
        var operations = inventory["operations"]?.AsArray() ?? new JsonArray();
        var byMethod = operations
            .Where(node => node is JsonObject)
            .GroupBy(node => node!["method"]?.GetValue<string>() ?? "UNKNOWN")
            .ToDictionary(group => group.Key, group => group.Count());
        var controllers = operations
            .SelectMany(node => node?["tags"]?.AsArray().Select(tag => tag?.GetValue<string>() ?? string.Empty) ?? [])
            .Where(tag => !string.IsNullOrWhiteSpace(tag)).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(tag => tag).ToArray();
        var getControllers = operations
            .Where(node => string.Equals(node?["method"]?.GetValue<string>(), "GET", StringComparison.OrdinalIgnoreCase))
            .SelectMany(node => node?["tags"]?.AsArray().Select(tag => tag?.GetValue<string>() ?? string.Empty) ?? [])
            .Where(tag => !string.IsNullOrWhiteSpace(tag)).Distinct(StringComparer.OrdinalIgnoreCase).Count();
        return Ok(new
        {
            operationCount = operations.Count,
            getOperationCount = operations.Count(node => string.Equals(node?["method"]?.GetValue<string>(), "GET", StringComparison.OrdinalIgnoreCase)),
            controllerCount = controllers.Length,
            getControllerCount = getControllers,
            byMethod,
            sourceState = "pass"
        });
    }

    [HttpGet("operations")]
    public async Task<IActionResult> GetOperations([FromQuery] string? method, [FromQuery] string? controller, [FromQuery(Name = "q")] string? query, CancellationToken cancellationToken)
    {
        var inventory = await data.ReadAsync("swagger-inventory.json", cancellationToken);
        var operations = inventory["operations"]?.AsArray() ?? new JsonArray();
        var filtered = operations.Where(node =>
        {
            var currentMethod = node?["method"]?.GetValue<string>() ?? string.Empty;
            var path = node?["path"]?.GetValue<string>() ?? string.Empty;
            var summary = node?["summary"]?.GetValue<string>() ?? string.Empty;
            var tags = node?["tags"]?.AsArray().Select(tag => tag?.GetValue<string>() ?? string.Empty).ToArray() ?? [];
            return (string.IsNullOrWhiteSpace(method) || currentMethod.Equals(method, StringComparison.OrdinalIgnoreCase))
                && (string.IsNullOrWhiteSpace(controller) || tags.Any(tag => tag.Equals(controller, StringComparison.OrdinalIgnoreCase)))
                && (string.IsNullOrWhiteSpace(query) || $"{currentMethod} {path} {summary} {string.Join(' ', tags)}".Contains(query, StringComparison.OrdinalIgnoreCase));
        }).Take(1000).Select(node => new
        {
            method = node?["method"]?.GetValue<string>() ?? string.Empty,
            route = node?["path"]?.GetValue<string>() ?? string.Empty,
            summary = node?["summary"]?.GetValue<string>() ?? string.Empty,
            tags = node?["tags"]?.AsArray().Select(tag => tag?.GetValue<string>() ?? string.Empty).ToArray() ?? [],
            responses = node?["responses"]?.AsArray().Select(response => response?.GetValue<string>() ?? string.Empty).ToArray() ?? []
        }).ToArray();
        return Ok(new { total = filtered.Length, operations = filtered });
    }
}
