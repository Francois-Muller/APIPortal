import SectionHero from "../components/SectionHero";
import Icon from "../components/Icon";
export default function GuidePage() {
  return <section className="page-panel guide-page"><SectionHero icon="fa-solid fa-book-open" kicker="Migrated content" title="FastDraft API Automation Framework Guide" description="The v0.4.0 guide is hosted inside the new Portal solution as the current content baseline. Its original document layout and interactions remain available while future sections are migrated into native React routes." />
    <article className="content-card guide-frame-card"><div className="card-heading"><div><h2>Interactive guide</h2><p>Use the internal navigation below or open the document in a separate browser tab.</p></div><a className="button-link" href="/docs/FastDraft_API_Automation_Framework_Guide_v0.4.0.html" target="_blank" rel="noreferrer"><Icon name="fa-solid fa-arrow-up-right-from-square" /> Open guide</a></div><iframe className="guide-frame" src="/docs/FastDraft_API_Automation_Framework_Guide_v0.4.0.html" title="FastDraft API Automation Framework Guide" /></article>
  </section>;
}
