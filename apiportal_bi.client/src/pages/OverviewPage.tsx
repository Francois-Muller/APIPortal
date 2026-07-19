// @ts-nocheck
import { useEffect, useState } from "react";
import SectionHero from "../components/SectionHero";
import MetricCard from "../components/MetricCard";
import StatusBadge from "../components/StatusBadge";
import Icon from "../components/Icon";
import { ErrorPanel, LoadingPanel } from "../components/StatePanel";
import { formatNumber, getJson } from "../api";

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    Promise.all([getJson("/api/framework/summary"), getJson("/api/swagger/summary"), getJson("/api/review/findings")])
      .then(([framework, swagger, review]) => setData({ framework, swagger, review })).catch(setError);
  }, []);
  if (error) return <ErrorPanel error={error} />;
  if (!data) return <LoadingPanel />;
  const report = data.framework.report;
  return <section className="page-panel">
    <SectionHero icon="fa-solid fa-house" kicker="New Visual Studio baseline" title="FastDraft API QA Automation Portal" description="The existing Portal content has been migrated into the new React and ASP.NET Core solution. This baseline concentrates on the guide, framework evidence, Swagger inventory and governance while QA DB Utility work remains deferred.">
      <div className="hero-metrics">
        <MetricCard icon="fa-solid fa-vials" value={report ? `${report.summary.passed}/${report.summary.total}` : "—"} label="Framework tests" hint={report?.run?.status ?? "No report"} />
        <MetricCard icon="fa-solid fa-route" value={formatNumber(data.swagger.getOperationCount)} label="Swagger GET operations" hint={`${data.swagger.getControllerCount} controllers`} />
        <MetricCard icon="fa-solid fa-circle-check" value={report?.inventory?.automationRequests ?? "—"} label="Automation requests" hint={data.framework.sourceMode} />
        <MetricCard icon="fa-solid fa-code-branch" value=".NET 10" label="Portal backend" hint="ASP.NET Core read-only API" />
      </div>
    </SectionHero>

    <article className="content-card">
      <div className="card-heading"><div><h2>Baseline application flow</h2><p>The new solution keeps the frontend and Portal API together without coupling the Portal to the future QA DB Utility.</p></div><StatusBadge tone="success">Migrated</StatusBadge></div>
      <div className="process-flow">
        <article><Icon name="fa-brands fa-react" /><strong>React + TypeScript</strong><p>Portal navigation, dashboard views and the embedded framework guide.</p></article>
        <Icon className="flow-arrow" name="fa-solid fa-arrow-right" />
        <article><Icon name="fa-solid fa-server" /><strong>ASP.NET Core Portal API</strong><p>Safe read-only endpoints for framework evidence, Swagger inventory and governance data.</p></article>
        <Icon className="flow-arrow" name="fa-solid fa-arrow-right" />
        <article><Icon name="fa-solid fa-folder-open" /><strong>Packaged baseline data</strong><p>Versioned JSON evidence is included without secrets, BACPACs or local framework source.</p></article>
      </div>
    </article>

    <article className="content-card">
      <div className="card-heading"><div><h2>Migration findings</h2><p>Key decisions applied before this solution becomes the new Portal baseline.</p></div><StatusBadge tone="warning">Reviewed</StatusBadge></div>
      <div className="finding-grid">{data.review.findings.map((finding) => <article key={finding.title} className={`finding-card ${finding.severity.toLowerCase()}`}><Icon name={finding.severity === "Critical" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-shield-halved"} /><div><span>{finding.severity}</span><strong>{finding.title}</strong><p>{finding.detail}</p></div></article>)}</div>
    </article>

    <article className="content-card">
      <h2>Intentionally deferred</h2>
      <div className="feature-grid">
        <article><Icon name="fa-solid fa-database" /><strong>QA DB Utility integration</strong><p>The separate QADBUtility project is unchanged and is not called by this Portal baseline.</p></article>
        <article><Icon name="fa-solid fa-terminal" /><strong>Bruno execution</strong><p>Runner and host-agent operations remain outside this migration.</p></article>
        <article><Icon name="fa-brands fa-docker" /><strong>Docker management</strong><p>Restricted management operations remain a later controlled feature.</p></article>
      </div>
    </article>
  </section>;
}
