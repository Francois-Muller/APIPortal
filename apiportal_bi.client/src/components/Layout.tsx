import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Icon from "./Icon";

type RouteId = "overview" | "framework" | "guide" | "swagger" | "reporting" | "changes";
interface NavigationItem { id: RouteId; label: string; icon: string; }
interface NavigationGroup { group: string; items: NavigationItem[]; }
interface LayoutProps { active: RouteId; setActive: (id: RouteId) => void; titles: Record<RouteId, string>; children: ReactNode; }

const NAVIGATION: NavigationGroup[] = [
  { group: "Start here", items: [
    { id: "overview", label: "Portal overview", icon: "fa-solid fa-house" },
    { id: "framework", label: "Framework dashboard", icon: "fa-solid fa-shield-halved" }
  ]},
  { group: "Use the framework", items: [
    { id: "guide", label: "Framework guide", icon: "fa-solid fa-book-open" },
    { id: "swagger", label: "Swagger reference", icon: "fa-solid fa-code" },
    { id: "reporting", label: "Reporting baseline", icon: "fa-solid fa-chart-column" }
  ]},
  { group: "Governance", items: [
    { id: "changes", label: "Change request log", icon: "fa-solid fa-clock-rotate-left" }
  ]}
];

export default function Layout({ active, setActive, titles, children }: LayoutProps) {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeGroup = NAVIGATION.find((group) => group.items.some((item) => item.id === active))?.group ?? "Start here";
  const [expanded, setExpanded] = useState<Set<string>>(new Set([activeGroup]));
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExpanded((current) => new Set([...current, activeGroup]));
    document.title = `${titles[active]} | FastDraft API Portal`;
  }, [active, activeGroup, titles]);

  useEffect(() => { if (searchOpen) searchInput.current?.focus(); }, [searchOpen]);

  const visible = useMemo(() => NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => !search || item.label.toLowerCase().includes(search.toLowerCase()))
  })).filter((group) => group.items.length), [search]);

  const select = (id: RouteId) => {
    setActive(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  };

  const toggleGroup = (name: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(name) && name !== activeGroup) next.delete(name); else next.add(name);
    return next;
  });

  return <div className="portal-shell">
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`} aria-label="Portal navigation">
      <div className="brand-block">
        <div className="brand-line">Built Intelligence | Quality Assurance</div>
        <div className="brand-title-row"><Icon name="fa-brands fa-algolia" className="brand-title-icon" /><h1>FastDraft API Portal</h1></div>
        <div className="brand-chips"><span>Portal v0.1.1</span><span className="source-pill pass"><Icon name="fa-solid fa-circle-check" /> Source validated</span></div>
      </div>

      <div className={`sidebar-search ${searchOpen ? "expanded" : ""}`}>
        <input ref={searchInput} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Portal sections" aria-label="Search Portal sections" tabIndex={searchOpen ? 0 : -1} />
        <button type="button" onClick={() => { setSearchOpen((value) => !value); if (searchOpen) setSearch(""); }} aria-label={searchOpen ? "Close navigation search" : "Open navigation search"} aria-expanded={searchOpen}>
          <Icon name={searchOpen ? "fa-solid fa-xmark" : "fa-solid fa-magnifying-glass"} />
        </button>
      </div>

      <nav>
        {visible.map((group) => {
          const open = expanded.has(group.group) || Boolean(search);
          return <div className={`nav-group ${open ? "expanded" : "collapsed"}`} key={group.group}>
            <button className="nav-group-toggle" type="button" onClick={() => toggleGroup(group.group)} aria-expanded={open}>
              <span>{group.group}</span><Icon name="fa-solid fa-chevron-down" />
            </button>
            <div className="nav-group-items">
              {group.items.map((item) => <button key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => select(item.id)} aria-current={active === item.id ? "page" : undefined}>
                <Icon name={item.icon} className="nav-icon" /><span>{item.label}</span>
              </button>)}
            </div>
          </div>;
        })}
      </nav>
      <div className="sidebar-footer"><Icon name="fa-solid fa-shield-halved" /> React + ASP.NET Core baseline</div>
    </aside>

    {mobileOpen ? <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /> : null}

    <main className="main-shell">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation"><Icon name={mobileOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"} /></button>
        <div><span>FastDraft QA Automation Portal</span><h2>{titles[active]}</h2></div>
        <a className="guide-link" href="/docs/FastDraft_API_Automation_Framework_Guide_v0.4.0.html" target="_blank" rel="noreferrer"><Icon name="fa-solid fa-arrow-up-right-from-square" /> Standalone guide</a>
      </header>
      <div className="top-progress"><span style={{ width: `${((Object.keys(titles).indexOf(active) + 1) / Object.keys(titles).length) * 100}%` }} /></div>
      <div className="content-viewport" id="portal-content" tabIndex={-1}>{children}</div>
    </main>
  </div>;
}
