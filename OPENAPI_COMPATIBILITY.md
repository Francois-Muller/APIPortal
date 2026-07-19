# OpenAPI compatibility correction

## Cause

The solution targets `net10.0` and references `Microsoft.AspNetCore.OpenApi` 10.0.10. ASP.NET Core 10 generates OpenAPI documents against the Microsoft.OpenApi **2.x object model**. A direct upgrade to Microsoft.OpenApi 3.9.0 overrides that compatible transitive dependency. The generated ASP.NET Core code then attempts assignments that are valid in 2.x but read-only in 3.x, producing errors such as:

```text
Property or indexer 'IOpenApiMediaType.Example' cannot be assigned to -- it is read only
```

## Correct package set for .NET 10

```xml
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.10" />
<PackageReference Include="Microsoft.OpenApi" Version="2.11.0" />
```

Version 2.11.0 is deliberately pinned. This prevents NuGet from resolving the vulnerable/deprecated 2.0.0 release while retaining the API surface required by ASP.NET Core 10.

## Why 3.9.0 is not retained

Microsoft.OpenApi 3.x is a major object-model change. First-party ASP.NET Core integration moves to the 3.x model in ASP.NET Core 11. Adopting it now would require moving the solution to a .NET 11 preview or replacing the .NET 10 first-party generator, neither of which is appropriate for this baseline.

## Local verification

Delete stale generated output before rebuilding:

```powershell
dotnet clean APIPortal_bi.slnx
Get-ChildItem -Recurse -Directory -Filter bin | Remove-Item -Recurse -Force
Get-ChildItem -Recurse -Directory -Filter obj | Remove-Item -Recurse -Force
dotnet restore APIPortal_bi.slnx
dotnet build APIPortal_bi.slnx --no-restore
dotnet list APIPortal_bi.slnx package --vulnerable --include-transitive
```

Visual Studio users can instead close Visual Studio, delete both projects' `bin` and `obj` folders, reopen the solution, then choose **Build > Rebuild Solution**.
