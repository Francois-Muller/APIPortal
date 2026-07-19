// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import SectionHero from "../components/SectionHero";
import StatusBadge from "../components/StatusBadge";
import Icon from "../components/Icon";
import { ErrorPanel, LoadingPanel } from "../components/StatePanel";
import { getJson } from "../api";

const LIFECYCLE = [
  ["Automation folder", "prepareRequestExecution()", "Fresh audit, run and trace state."],
  ["Foundation folder", "applyFoundationTestData()", "Common Foundation fixture defaults."],
  ["Request before", "requireFoundationTestData() + switchAccount()", "Scenario data and account preparation."],
  ["Request after", "One primary validator", "Status, payload, timing and contract evidence."],
  ["Collection after", "finaliseRequestExecution()", "Idempotent audit completion fallback."]
];

export default function FrameworkPage() {
  const [summary, setSummary] = useState(null); const [api, setApi] = useState(null); const [query, setQuery] = useState(""); const [error, setError] = useState(null);
  useEffect(() => { Promise.all([getJson("/api/framework/summary"), getJson("/api/framework/public-api")]).then(([s, a]) => { setSummary(s); setApi(a); }).catch(setError); }, []);
  const functions = useMemo(() => (api?.functions ?? []).filter((item) => !query || `${item.name} ${item.category} ${item.source}`.toLowerCase().includes(query.toLowerCase())), [api, query]);
  if (error) return <ErrorPanel error={error} />; if (!summary || !api) return <LoadingPanel />;
  const report = summary.report;
  return <section className="page-panel">
    <SectionHero icon="fa-solid fa-shield-halved" kicker="Source-validated dashboard" title="FastDraft API Automation Framework" description="The Portal reads a packaged, versioned framework report and inventory. The active framework repository can be connected later through a restricted read-only source provider.">
      <div className="hero-metrics compact"><div><strong>v{report.frameworkVersion}</strong><span>Framework</span></div><div><strong>{report.inventory.automationRequests}</strong><span>Automation requests</span></div><div><strong>{api.total}</strong><span>Public functions</span></div><div><strong>{report.summary.passed}/{report.summary.total}</strong><span>Tests passed</span></div></div>
    </SectionHero>
    <article className="content-card"><div className="card-heading"><div><h2>Validated baseline</h2><p>Build {report.run.id} completed with zero failed tests, standards violations or source-secret findings.</p></div><StatusBadge tone="success">{report.run.status}</StatusBadge></div><div className="quality-grid">{Object.entries(report.qualityGates).map(([name, value]) => <article key={name}><Icon name="fa-solid fa-circle-check" /><strong>{name}</strong><span>{value}</span></article>)}</div></article>
    <article className="content-card"><h2>Request lifecycle</h2><div className="lifecycle-list">{LIFECYCLE.map(([phase, call, detail], index) => <article key={phase}><span>{index + 1}</span><div><strong>{phase}</strong><code>{call}</code><p>{detail}</p></div></article>)}</div></article>
    <article className="content-card"><h2>Core capability boundaries</h2><div className="feature-grid four"><article><Icon name="fa-solid fa-user-shield" /><strong>Authentication</strong><p>User-scoped bearer and optional CSRF preparation with stale-state clearing.</p></article><article><Icon name="fa-solid fa-database" /><strong>Foundation data</strong><p>Folder defaults plus explicit request-level prerequisite declarations.</p></article><article><Icon name="fa-solid fa-list-check" /><strong>Validation</strong><p>Successful READ, error, token and CSRF validators with 2000/30000 ms defaults.</p></article><article><Icon name="fa-solid fa-file-lines" /><strong>Evidence</strong><p>Runtime audit text streams and machine-readable framework build reports.</p></article></div></article>
    <article className="content-card"><div className="card-heading"><div><h2>Public API inventory</h2><p>Generated from the validated framework baseline.</p></div><a className="button-link" href="/docs/FastDraft_API_Automation_Framework_Guide_v0.4.0.html" target="_blank" rel="noreferrer"><Icon name="fa-solid fa-arrow-up-right-from-square" /> Full guide</a></div><div className="filter-field"><Icon name="fa-solid fa-magnifying-glass" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search function, category or source" /><span>{functions.length} / {api.total}</span></div><div className="function-grid">{functions.map((item) => <article key={item.name}><Icon name="fa-solid fa-code" /><div><strong>{item.name}</strong><span>{item.category}</span><small>{item.source}</small></div></article>)}</div></article>
  </section>;
}
