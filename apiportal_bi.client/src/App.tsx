import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { GUIDE_FUNCTIONS, GUIDE_GROUPS, GUIDE_SECTIONS } from './guideData';

const DEFAULT_SECTION_ID = 'overview';
const GROUP_STORAGE_KEY = 'fastdraft-portal-guide-groups-v1';
const SIDEBAR_STORAGE_KEY = 'fastdraft-portal-sidebar-v1';

const GROUP_ICONS: Readonly<Record<string, string>> = {
  'Start here': 'fa-solid fa-route',
  'Development guides': 'fa-solid fa-book-open-reader',
  'API Automation development': 'fa-solid fa-code',
  'Build and use': 'fa-solid fa-person-digging',
  'Evidence and quality': 'fa-solid fa-clipboard-check',
  'Coverage and integration': 'fa-solid fa-diagram-project',
};

type TransitionState = 'idle' | 'depart' | 'return';
type TransitionDirection = 'previous' | 'next' | null;

interface SidebarPreferences {
  collapsed: boolean;
}

function getInitialSectionId(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return GUIDE_SECTIONS.some((section) => section.id === hash) ? hash : DEFAULT_SECTION_ID;
}

function getInitialGroups(): Record<string, boolean> {
  const activeId = getInitialSectionId();
  try {
    const saved = JSON.parse(sessionStorage.getItem(GROUP_STORAGE_KEY) ?? '{}') as Record<string, boolean>;
    return Object.fromEntries(
      GUIDE_GROUPS.map((group) => [
        group.title,
        group.sectionIds.includes(activeId) ? true : (saved[group.title] ?? false),
      ]),
    );
  } catch {
    return Object.fromEntries(
      GUIDE_GROUPS.map((group) => [group.title, group.sectionIds.includes(activeId)]),
    );
  }
}

function getInitialSidebarPreferences(): SidebarPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? '{}') as Partial<SidebarPreferences>;
    return { collapsed: saved.collapsed === true };
  } catch {
    return { collapsed: false };
  }
}

function App() {
  const [activeSectionId, setActiveSectionId] = useState(getInitialSectionId);
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialGroups);
  const [sidebarPreferences, setSidebarPreferences] = useState<SidebarPreferences>(getInitialSidebarPreferences);
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const transitionTimersRef = useRef<number[]>([]);

  const activeIndex = GUIDE_SECTIONS.findIndex((section) => section.id === activeSectionId);
  const activeSection = GUIDE_SECTIONS[activeIndex] ?? GUIDE_SECTIONS[0];
  const progress = ((activeIndex + 1) / GUIDE_SECTIONS.length) * 100;
  const previousSection = GUIDE_SECTIONS[(activeIndex - 1 + GUIDE_SECTIONS.length) % GUIDE_SECTIONS.length];
  const nextSection = GUIDE_SECTIONS[(activeIndex + 1) % GUIDE_SECTIONS.length];

  const matchingSectionIds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return new Set(GUIDE_SECTIONS.map((section) => section.id));
    return new Set(
      GUIDE_SECTIONS
        .filter((section) =>
          `${section.title} ${section.group} ${section.html.replace(/<[^>]+>/g, ' ')}`
            .toLowerCase()
            .includes(query),
        )
        .map((section) => section.id),
    );
  }, [searchQuery]);

  const clearTransitionTimers = () => {
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current = [];
  };

  const navigateToSection = (
    sectionId: string,
    direction: TransitionDirection = null,
  ) => {
    if (
      sectionId === activeSection.id ||
      !GUIDE_SECTIONS.some((section) => section.id === sectionId)
    ) return;

    clearTransitionTimers();

    // Sidebar navigation is immediate. Only the top-bar previous/next controls animate.
    if (!direction) {
      setTransitionState('idle');
      setTransitionDirection(null);
      setActiveSectionId(sectionId);
      return;
    }

    if (transitionState !== 'idle') return;

    setTransitionDirection(direction);
    setTransitionState('depart');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const departDuration = reducedMotion ? 0 : 460;
    const returnDuration = reducedMotion ? 0 : 340;

    transitionTimersRef.current.push(window.setTimeout(() => {
      setActiveSectionId(sectionId);
      setTransitionState('return');
      transitionTimersRef.current.push(window.setTimeout(() => {
        setTransitionState('idle');
        setTransitionDirection(null);
      }, returnDuration));
    }, departDuration));
  };

  useEffect(() => {
    const handleHashChange = () => {
      const sectionId = getInitialSectionId();
      if (sectionId !== activeSectionId) setActiveSectionId(sectionId);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeSectionId]);

  useEffect(() => () => clearTransitionTimers(), []);

  useEffect(() => {
    const activeGroup = GUIDE_GROUPS.find((group) => group.sectionIds.includes(activeSection.id));
    if (activeGroup) {
      setOpenGroups((current) => ({ ...current, [activeGroup.title]: true }));
    }

    window.history.replaceState(null, '', `#${activeSection.id}`);
    document.title = `${activeSection.title} | FastDraft API Portal`;
    viewportRef.current?.scrollTo({ top: 0, behavior: 'auto' });

    window.requestAnimationFrame(() => {
      const heading = viewportRef.current?.querySelector<HTMLElement>('.hero h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    });
  }, [activeSection]);

  useEffect(() => {
    sessionStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarPreferences));
  }, [sidebarPreferences]);

  useEffect(() => {
    const root = viewportRef.current;
    if (!root) return;

    const toggleCard = (card: HTMLElement) => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
    };

    const clickHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, textarea, select')) return;
      const card = target.closest<HTMLElement>('[data-flip-card]');
      if (card && root.contains(card)) toggleCard(card);
    };

    const keyHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, textarea, select')) return;
      const card = target.closest<HTMLElement>('[data-flip-card]');
      if (!card || !root.contains(card)) return;
      event.preventDefault();
      toggleCard(card);
    };

    root.addEventListener('click', clickHandler);
    root.addEventListener('keydown', keyHandler);
    return () => {
      root.removeEventListener('click', clickHandler);
      root.removeEventListener('keydown', keyHandler);
    };
  }, [activeSection.id]);

  useEffect(() => {
    const root = viewportRef.current;
    if (!root) return;

    const timers: number[] = [];
    const cleanups: Array<() => void> = [];

    const copyText = async (text: string) => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    };

    root.querySelectorAll<HTMLElement>('.terminal-block').forEach((block) => {
      const header = block.querySelector<HTMLElement>('.terminal-head');
      const code = block.querySelector<HTMLElement>('pre code');
      if (!header || !code) return;

      let button = header.querySelector<HTMLButtonElement>('.copy-code-button');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-code-button';
        button.setAttribute('aria-label', 'Copy code');
        button.title = 'Copy code';
        button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i><span>Copy</span>';
        header.appendChild(button);
      }

      const clickHandler = async (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!button || button.classList.contains('is-copied')) return;

        try {
          await copyText(code.textContent ?? '');
          button.classList.add('is-copied', 'copy-pop');
          button.setAttribute('aria-label', 'Code copied');
          button.title = 'Copied';
          button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i><span>Copied</span>';
          timers.push(window.setTimeout(() => button?.classList.remove('copy-pop'), 320));
          timers.push(window.setTimeout(() => {
            if (!button) return;
            button.classList.remove('is-copied');
            button.setAttribute('aria-label', 'Copy code');
            button.title = 'Copy code';
            button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i><span>Copy</span>';
          }, 1450));
        } catch {
          button.classList.add('copy-error', 'copy-pop');
          button.setAttribute('aria-label', 'Copy failed');
          button.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><span>Retry</span>';
          timers.push(window.setTimeout(() => {
            if (!button) return;
            button.classList.remove('copy-error', 'copy-pop');
            button.setAttribute('aria-label', 'Copy code');
            button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i><span>Copy</span>';
          }, 1450));
        }
      };

      button.addEventListener('click', clickHandler);
      cleanups.push(() => button?.removeEventListener('click', clickHandler));
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [activeSection.id]);

  useEffect(() => {
    if (activeSection.id !== 'functions') return;

    const root = viewportRef.current;
    const input = root?.querySelector<HTMLInputElement>('#function-search');
    const count = root?.querySelector<HTMLElement>('#function-count');
    const list = root?.querySelector<HTMLElement>('#function-list');
    if (!input || !count || !list) return;

    const renderFunctions = () => {
      const query = input.value.trim().toLowerCase();
      const filtered = GUIDE_FUNCTIONS.filter((item) =>
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query),
      );

      count.textContent = `${filtered.length} functions`;
      list.replaceChildren(
        ...filtered.map((item) => {
          const article = document.createElement('article');
          article.className = 'function-item';
          const strong = document.createElement('strong');
          strong.textContent = item.name;
          const span = document.createElement('span');
          span.textContent = `${item.category} · ${item.source}`;
          article.append(strong, span);
          return article;
        }),
      );
    };

    input.addEventListener('input', renderFunctions);
    renderFunctions();
    return () => input.removeEventListener('input', renderFunctions);
  }, [activeSection.id]);

  const sidebarCollapsed = sidebarPreferences.collapsed;

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Framework guide navigation">
        <div className="brand">
          <div className="brand-toolbar">
            <div className="brand-line">Built Intelligence | Quality Assurance</div>
            <div className="sidebar-actions" aria-label="Navigation display controls">
              <button
                type="button"
                className="sidebar-control collapse-control"
                aria-expanded={!sidebarCollapsed}
                aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                onClick={() => setSidebarPreferences((current) => ({
                  collapsed: !current.collapsed,
                }))}
              >
                <i
                  className={`fa-solid ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <h1 title="FastDraft API Automation Framework Portal">
            <i className="fa-brands fa-algolia guide-brand-icon" aria-hidden="true" />
            <span>FastDraft API Automation Framework Portal</span>
          </h1>
        </div>

        {!sidebarCollapsed && (
          <div className="search">
            <label className="search-field" htmlFor="nav-search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                id="nav-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search guide sections"
                aria-label="Search guide sections"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear guide search"
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              )}
            </label>
          </div>
        )}

        <nav>
          {GUIDE_GROUPS.map((group) => {
            const visibleIds = group.sectionIds.filter((id) => matchingSectionIds.has(id));
            if (visibleIds.length === 0) return null;
            const expanded = sidebarCollapsed || searchQuery ? true : openGroups[group.title] === true;
            const groupIcon = GROUP_ICONS[group.title] ?? 'fa-solid fa-folder-tree';
            return (
              <div className={`nav-group ${expanded ? 'expanded' : 'collapsed'}`} key={group.title}>
                <button
                  className="nav-title-toggle"
                  type="button"
                  aria-expanded={expanded}
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} ${group.title}`}
                  title={group.title}
                  onClick={() => {
                    if (sidebarCollapsed) return;
                    setOpenGroups((current) => ({
                      ...current,
                      [group.title]: !expanded,
                    }));
                  }}
                >
                  <i className={`${groupIcon} nav-group-icon`} aria-hidden="true" />
                  <span className="nav-group-title-text">{group.title}</span>
                  <i className="fa-solid fa-chevron-down nav-group-chevron" aria-hidden="true" />
                </button>
                <div className="nav-group-items" aria-hidden={!expanded}>
                  {visibleIds.map((sectionId) => {
                    const section = GUIDE_SECTIONS.find((item) => item.id === sectionId)!;
                    const active = section.id === activeSection.id;
                    return (
                      <button
                        className={`nav-item ${active ? 'active' : ''}`}
                        type="button"
                        data-panel={section.id}
                        aria-current={active ? 'page' : undefined}
                        aria-label={section.title}
                        title={section.title}
                        tabIndex={expanded ? 0 : -1}
                        onClick={() => navigateToSection(section.id)}
                        key={section.id}
                      >
                        <i className={section.icon} aria-hidden="true" />
                        <span>{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="footer-note" aria-label="Portal and framework versions">
            <span>Source validated</span>
            <span className="footer-separator" aria-hidden="true">|</span>
            <span>Framework v0.4.0</span>
            <span className="footer-separator" aria-hidden="true">|</span>
            <span>Portal v0.3.12</span>
          </div>
        )}
      </aside>

      <main className={`main transition-${transitionState}`}>
        <header className="topbar">
          <div className="topbar-copy">
            <div className="breadcrumb">
              Framework guide · Section {activeIndex + 1} of {GUIDE_SECTIONS.length}
            </div>
            <div className="topbar-title-track">
              <h2>{activeSection.title}</h2>
              <div className="title-navigation" aria-label="Framework guide section navigation">
                <button
                  type="button"
                  className={`title-chevron title-chevron-back ${
                    transitionDirection === 'previous' ? `transition-${transitionState}` : ''
                  }`}
                  aria-label={`Open previous section: ${previousSection.title}`}
                  title={`Previous: ${previousSection.title}`}
                  onClick={() => navigateToSection(previousSection.id, 'previous')}
                  disabled={transitionState !== 'idle'}
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`title-chevron title-chevron-next ${
                    transitionDirection === 'next' ? `transition-${transitionState}` : ''
                  }`}
                  aria-label={`Open next section: ${nextSection.title}`}
                  title={`Next: ${nextSection.title}`}
                  onClick={() => navigateToSection(nextSection.id, 'next')}
                  disabled={transitionState !== 'idle'}
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="viewport" ref={viewportRef} id="portal-content" tabIndex={-1}>
          <section
            className="panel"
            id={`panel-${activeSection.id}`}
            key={activeSection.id}
          >
            <div
              className="inner"
              dangerouslySetInnerHTML={{ __html: activeSection.html }}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
