# FastDraft API Portal — Guide Review Baseline v0.3.1

The React client is the FastDraft API Automation Framework Guide. It renders nineteen detailed sections without requiring a database or initial API request.

## Start in Visual Studio

1. Run `npm ci` in `apiportal_bi.client`.
2. Set `APIPortal_bi.Server` as the only startup project.
3. Select HTTPS for local development or rebuild the Docker image for container execution.
4. Start the server. The SPA proxy starts Vite in development; publish builds React into `wwwroot`.

## Current boundaries

- QADBUtility remains unchanged and disconnected.
- No SQL connection is required.
- Framework content is based on bundled framework v0.4.0 machine-readable evidence and established source contracts.
- Rebuild Docker images after client changes; restarting an old container does not update published assets.
