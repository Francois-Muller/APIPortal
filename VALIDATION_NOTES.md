# Validation Notes — Portal v0.3.1

## Completed checks

- `npm ci --no-audit --no-fund` passed.
- `npm run lint` passed with no ESLint findings.
- `npm run build` passed with TypeScript and Vite production output.
- The Guide remains a native React application with nineteen sections and ninety-four searchable public functions.
- Sidebar group headers use icon-backed, borderless white labels.
- Collapsed navigation retains group and page icons while hiding text labels.
- Portal/framework/source metadata is rendered as plain footer text separated by navy pipes.
- The top-bar shield was removed and replaced with a stable-position animated navigation chevron.
- QADBUtility source remains unchanged.

## Environment limitation

The .NET SDK and Docker runtime were not available for an end-to-end ASP.NET/Docker execution in this environment. Rebuild the solution or Docker image in Visual Studio before replacing the running container.
