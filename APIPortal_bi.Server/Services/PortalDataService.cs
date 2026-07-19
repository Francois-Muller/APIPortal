using System.Text.Json;
using System.Text.Json.Nodes;

namespace APIPortal_bi.Server.Services;

public sealed class PortalDataService(IWebHostEnvironment environment)
{
    private readonly string _dataRoot = Path.Combine(environment.ContentRootPath, "Data");
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<JsonNode> ReadAsync(string fileName, CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_dataRoot, fileName);
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"Portal data file '{fileName}' is not available.");
        }
        await using var stream = File.OpenRead(filePath);
        return await JsonNode.ParseAsync(stream, cancellationToken: cancellationToken)
            ?? throw new InvalidDataException($"Portal data file '{fileName}' is empty.");
    }

    public JsonSerializerOptions JsonOptions => _jsonOptions;
}
