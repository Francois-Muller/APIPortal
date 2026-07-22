import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { GUIDE_FUNCTIONS, GUIDE_GROUPS, GUIDE_SECTIONS } from './guideData';

const DEFAULT_SECTION_ID = 'overview';
const GROUP_STORAGE_KEY = 'fastdraft-portal-guide-groups-v1';
const SIDEBAR_STORAGE_KEY = 'fastdraft-portal-sidebar-v1';

const GROUP_ICONS: Readonly<Record<string, string>> = {
  'Start here': 'fa-solid fa-route',
  'Applications Guides': 'fa-solid fa-book-open-reader',
  'API Automation development': 'fa-solid fa-code',
  'Build and use': 'fa-solid fa-person-digging',
  'Evidence and quality': 'fa-solid fa-clipboard-check',
  'Coverage and integration': 'fa-solid fa-diagram-project',
  'Operate and support': 'fa-solid fa-screwdriver-wrench',
};

type TransitionState = 'idle' | 'depart' | 'return';
type TransitionDirection = 'previous' | 'next' | null;

interface SidebarPreferences {
  collapsed: boolean;
}

interface FunctionGuidance {
  phase: string;
  purpose: string;
  signature: string;
  state: string;
  returns: string;
  failures: string;
  example: string;
  relationships: readonly [icon: string, title: string, description: string][];
}

const FUNCTION_GUIDANCE: Readonly<Record<string, FunctionGuidance>> = {
  prepareRequestExecution: {
    phase: 'Automation folder pre-request',
    purpose: 'Create fresh request audit, run and trace context before an Automation request begins.',
    signature: 'await prepareRequestExecution(options = {})',
    state: 'Initialises request lifecycle and audit state.',
    returns: 'A request-preparation summary for the active execution.',
    failures: 'Fails clearly when lifecycle preparation cannot establish a safe request context.',
    example: 'await prepareRequestExecution();',
    relationships: [
      ['fa-solid fa-route', 'Request lifecycle', 'Starts the governed request sandwich.'],
      ['fa-solid fa-file-shield', 'Audit', 'Creates the main request audit context and trace identity.'],
      ['fa-solid fa-vials', 'Framework tests', 'Protected by isolated lifecycle and collection-quality tests.'],
    ],
  },
  applyFoundationTestData: {
    phase: 'Foundation folder pre-request',
    purpose: 'Load approved common Foundation defaults and request-level overrides for the controller family.',
    signature: 'applyFoundationTestData(options = {})',
    state: 'Creates or refreshes Foundation fixture variables.',
    returns: 'A summary of resolved Foundation values and sources.',
    failures: 'Reports invalid configuration or unsafe variable resolution without exposing secrets.',
    example: 'applyFoundationTestData({\n  context: req.getName()\n});',
    relationships: [
      ['fa-solid fa-database', 'Foundation fixtures', 'Provides common controller test data.'],
      ['fa-solid fa-sliders', 'Request overrides', 'Honours approved request-level underscore values.'],
      ['fa-solid fa-shield-halved', 'Preconditions', 'Supports clear missing-data failures.'],
    ],
  },
  requireFoundationTestData: {
    phase: 'Request pre-request',
    purpose: 'Require every Foundation variable referenced by the current scenario before transport.',
    signature: 'requireFoundationTestData(variableNames, options = {})',
    state: 'Reads fixture state and throws on missing required values.',
    returns: 'The resolved required values when all preconditions are met.',
    failures: 'Raises a readable pre-request failure identifying the missing variable and context.',
    example: 'requireFoundationTestData([\n  "_foundationContractId"\n], { context: req.getName() });',
    relationships: [
      ['fa-solid fa-list-check', 'Scenario contract', 'Makes data dependencies explicit.'],
      ['fa-solid fa-ban', 'Fail closed', 'Missing required data does not silently skip.'],
      ['fa-solid fa-database', 'QA data', 'Connects request scenarios to approved fixtures.'],
    ],
  },
  requireFoundationAccount: {
    phase: 'Request pre-request',
    purpose: 'Resolve an approved username variable reference for the current Foundation scenario.',
    signature: 'requireFoundationAccount(variableName, options = {})',
    state: 'Reads configured account references without returning literal credentials.',
    returns: 'A validated account reference including the username variable name.',
    failures: 'Raises a pre-request error when the account variable is missing or invalid.',
    example: 'const account = requireFoundationAccount(\n  "_foundationPayloadUsernameVar",\n  { context: req.getName() }\n);',
    relationships: [
      ['fa-solid fa-user-shield', 'Authentication', 'Feeds an approved account reference into switchAccount().'],
      ['fa-solid fa-key', 'Credential safety', 'Uses variable names rather than secret values.'],
      ['fa-solid fa-database', 'Foundation data', 'Supports controller-owned account defaults.'],
    ],
  },
  switchAccount: {
    phase: 'Request pre-request',
    purpose: 'Prepare bearer and optional CSRF state for one selected account without relying on request order.',
    signature: 'await switchAccount(options)',
    state: 'Creates or clears user-scoped auto_<scope>_* authentication variables.',
    returns: 'An account-preparation summary containing update and failure state.',
    failures: 'Clears stale selected-user state and raises readable failures unless the scenario explicitly allows the expected authentication or CSRF failure.',
    example: 'await switchAccount({\n  usernameVar: "usr_SiteSup",\n  updateBearer: true,\n  updateCsrf: true,\n  forceBearerRefresh: true,\n  forceCsrfRefresh: true\n});',
    relationships: [
      ['fa-solid fa-right-to-bracket', 'Bearer retrieval', 'Calls the token endpoint for the selected account.'],
      ['fa-solid fa-fingerprint', 'CSRF preparation', 'Optionally calls the generic endpoint and stores selected-user CSRF.'],
      ['fa-solid fa-broom', 'Stale-state clearing', 'Prevents older valid state from causing a false pass.'],
    ],
  },
  rotateAccounts: {
    phase: 'Controlled proof requests',
    purpose: 'Create deliberate cross-account bearer and CSRF mismatch scenarios for authentication-boundary testing.',
    signature: 'await rotateAccounts(options)',
    state: 'Prepares two account scopes and applies the requested mismatch arrangement.',
    returns: 'A rotation summary identifying the selected bearer and CSRF account scopes.',
    failures: 'Fails when either required account cannot be prepared safely.',
    example: 'await rotateAccounts({\n  bearerUsernameVar: "usr_CompAdmin",\n  csrfUsernameVar: "usr_SiteSup"\n});',
    relationships: [
      ['fa-solid fa-people-arrows-left-right', 'Multi-account proof', 'Exercises token and CSRF isolation.'],
      ['fa-solid fa-shield-halved', 'Security contracts', 'Used only for deliberate negative scenarios.'],
      ['fa-solid fa-vials', 'Regression tests', 'Protected by inverse and concurrency coverage.'],
    ],
  },
  skipTest: {
    phase: 'First request pre-request call',
    purpose: 'Deliberately mark a blocked request as skipped with a reviewed human-readable reason.',
    signature: 'await skipTest({ skipReason })',
    state: 'Stops transport and records the skipped result.',
    returns: 'A controlled skip result when the runner supports native request skip.',
    failures: 'Rejects missing or invalid skip configuration and must never be invoked after response.',
    example: 'await skipTest({\n  skipReason: "Blocked by defect FD-1234"\n});',
    relationships: [
      ['fa-solid fa-ban', 'Transport control', 'Stops the request before network execution.'],
      ['fa-solid fa-file-lines', 'Reporting', 'Preserves a readable skipped result and reason.'],
      ['fa-solid fa-scale-balanced', 'Governance', 'Requires deliberate contributor ownership.'],
    ],
  },
  PrimaryReadResponseValidation: {
    phase: 'Request after-response',
    purpose: 'Validate successful READ status, payload mode, content, quality and performance expectations.',
    signature: 'await PrimaryReadResponseValidation(options = {})',
    state: 'Emits Bruno test results and audit evidence; does not prepare request state.',
    returns: 'A rendered validation summary for the successful response.',
    failures: 'Records clear failed checks for status, payload, structure, response size, timing or unsafe content.',
    example: 'await PrimaryReadResponseValidation({\n  expectedStatusCode: 200,\n  payloadMode: "required"\n});',
    relationships: [
      ['fa-solid fa-list-check', 'Response contract', 'Owns the primary successful READ validation.'],
      ['fa-solid fa-gauge-high', 'Quality', 'Checks performance and response-size boundaries.'],
      ['fa-solid fa-file-shield', 'Evidence', 'Writes readable audit and report outcomes.'],
    ],
  },
  ErrorResponseValidation: {
    phase: 'Request after-response',
    purpose: 'Validate expected non-2xx responses across JSON, text, HTML, empty and Problem Details payloads.',
    signature: 'await ErrorResponseValidation(options = {})',
    state: 'Emits failed or passed Bruno checks without changing authentication state.',
    returns: 'A rendered validation summary for the expected error response.',
    failures: 'Reports status, payload type, message, schema, performance or token-exposure mismatches.',
    example: 'await ErrorResponseValidation({\n  expectedStatusCode: 400,\n  allowEmptyBody: false,\n  requireErrorMessage: true\n});',
    relationships: [
      ['fa-solid fa-circle-exclamation', 'Error contracts', 'Supports varied API and gateway response bodies.'],
      ['fa-solid fa-mask-face', 'Secret safety', 'Checks that token material is not exposed.'],
      ['fa-solid fa-bug', 'Defect honesty', 'Does not change expectations merely to clear a known defect.'],
    ],
  },
  AuthenticationValidation: {
    phase: 'Token request after-response',
    purpose: 'Validate a successful token payload, identity, token fields, schema, lifetime, size and performance without persisting the response.',
    signature: 'await AuthenticationValidation(options = {})',
    state: 'Produces validation evidence only.',
    returns: 'A complete successful-token validation result.',
    failures: 'Records schema, identity, token, timing or response-size contract failures.',
    example: 'await AuthenticationValidation({\n  expectedUserVar: "usr_CompAdmin",\n  requireExactSchema: true\n});',
    relationships: [
      ['fa-solid fa-key', 'Token contract', 'Validates the direct /Token response.'],
      ['fa-solid fa-user-check', 'Identity', 'Confirms the returned identity matches the expected account.'],
      ['fa-solid fa-clock', 'Lifetime', 'Checks issue, expiry and duration tolerances.'],
    ],
  },
  AuthenticationErrorValidation: {
    phase: 'Token request after-response',
    purpose: 'Validate an unsuccessful token response and confirm that token data is absent.',
    signature: 'await AuthenticationErrorValidation(options = {})',
    state: 'Produces validation evidence only.',
    returns: 'A failed-authentication validation result.',
    failures: 'Records status, error payload, message or unexpected token-field failures.',
    example: 'await AuthenticationErrorValidation({\n  expectedStatusCode: 400,\n  validateTokenAbsence: true\n});',
    relationships: [
      ['fa-solid fa-user-xmark', 'Negative authentication', 'Validates controlled invalid-credential outcomes.'],
      ['fa-solid fa-ban', 'Token absence', 'Ensures failed authentication does not return usable tokens.'],
      ['fa-solid fa-file-lines', 'Readable errors', 'Preserves the expected error contract.'],
    ],
  },
  CsrfTokenValidation: {
    phase: 'Generic request after-response',
    purpose: 'Validate, normalise and store the selected account CSRF token from the generic endpoint response.',
    signature: 'await CsrfTokenValidation(options = {})',
    state: 'Updates selected-user and compatibility CSRF variables when valid.',
    returns: 'A validation and storage summary for the CSRF response.',
    failures: 'Clears stale selected-user CSRF state and reports invalid status, prefix, type, length or characters.',
    example: 'await CsrfTokenValidation({\n  usernameVar: "usr_SiteSup"\n});',
    relationships: [
      ['fa-solid fa-fingerprint', 'CSRF contract', 'Normalises the recognised response prefix.'],
      ['fa-solid fa-user-lock', 'Account scope', 'Stores CSRF under the selected account scope.'],
      ['fa-solid fa-broom', 'Failure safety', 'Clears stale state when validation fails.'],
    ],
  },
  finaliseRequestExecution: {
    phase: 'Collection after-response',
    purpose: 'Complete the active request audit and reporting lifecycle without changing validated environment state.',
    signature: 'await finaliseRequestExecution(options = {})',
    state: 'Finalises audit and report state idempotently.',
    returns: 'A lifecycle completion summary.',
    failures: 'Reports finalisation problems without overwriting the primary request validation outcome.',
    example: 'await finaliseRequestExecution();',
    relationships: [
      ['fa-solid fa-flag-checkered', 'Lifecycle completion', 'Closes the request sandwich.'],
      ['fa-solid fa-file-export', 'Reporting', 'Completes evidence after the primary validator.'],
      ['fa-solid fa-repeat', 'Idempotency', 'Safe when completion is reached through recovery paths.'],
    ],
  },
};

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

    const targetGroup = GUIDE_GROUPS.find((group) => group.sectionIds.includes(sectionId));
    if (targetGroup) {
      setOpenGroups((current) => ({ ...current, [targetGroup.title]: true }));
    }

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
      if (sectionId !== activeSectionId) {
        const targetGroup = GUIDE_GROUPS.find((group) => group.sectionIds.includes(sectionId));
        if (targetGroup) {
          setOpenGroups((current) => ({ ...current, [targetGroup.title]: true }));
        }
        setActiveSectionId(sectionId);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeSectionId]);

  useEffect(() => () => clearTransitionTimers(), []);

  useEffect(() => {
    window.history.replaceState(null, '', `#${activeSection.id}`);
    document.title = `${activeSection.title} | FastDraft API Automation Portal`;
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

    const copyText = async (value: string) => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    };

    const ensureCopyButtons = () => {
      root.querySelectorAll<HTMLElement>('.terminal-block').forEach((block) => {
        const header = block.querySelector<HTMLElement>('.terminal-head');
        const code = block.querySelector<HTMLElement>('pre code');
        if (!header || !code || header.querySelector('.copy-code-button')) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-code-button';
        button.setAttribute('aria-label', 'Copy code');
        button.title = 'Copy code';
        button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i>';
        header.appendChild(button);
      });
    };

    const clickHandler = async (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLButtonElement>('.copy-code-button');
      if (!button || !root.contains(button) || button.classList.contains('is-copied')) return;

      event.preventDefault();
      event.stopPropagation();
      const code = button.closest('.terminal-block')?.querySelector<HTMLElement>('pre code');
      if (!code) return;

      try {
        await copyText(code.textContent ?? '');
        button.classList.add('is-copied', 'copy-pop');
        button.setAttribute('aria-label', 'Code copied');
        button.title = 'Copied';
        button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
        timers.push(window.setTimeout(() => button.classList.remove('copy-pop'), 320));
        timers.push(window.setTimeout(() => {
          button.classList.remove('is-copied');
          button.setAttribute('aria-label', 'Copy code');
          button.title = 'Copy code';
          button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i>';
        }, 1450));
      } catch {
        button.classList.add('copy-error', 'copy-pop');
        button.setAttribute('aria-label', 'Copy failed');
        button.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';
        timers.push(window.setTimeout(() => {
          button.classList.remove('copy-error', 'copy-pop');
          button.setAttribute('aria-label', 'Copy code');
          button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i>';
        }, 1450));
      }
    };

    ensureCopyButtons();
    const observer = new MutationObserver(ensureCopyButtons);
    observer.observe(root, { childList: true, subtree: true });
    root.addEventListener('click', clickHandler);

    return () => {
      observer.disconnect();
      root.removeEventListener('click', clickHandler);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [activeSection.id]);

  useEffect(() => {
    if (activeSection.id !== 'functions') return;

    const root = viewportRef.current;
    const input = root?.querySelector<HTMLInputElement>('#function-search');
    const count = root?.querySelector<HTMLElement>('#function-count');
    const list = root?.querySelector<HTMLElement>('#function-list');
    const workspace = root?.querySelector<HTMLElement>('#function-workspace');
    if (!input || !count || !list || !workspace) return;

    let selectedName = GUIDE_FUNCTIONS.some((item) => item.name === 'switchAccount')
      ? 'switchAccount'
      : GUIDE_FUNCTIONS[0]?.name ?? '';

    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character] ?? character);

    const fallbackGuidance = (item: (typeof GUIDE_FUNCTIONS)[number]): FunctionGuidance => ({
      phase: item.category.includes('Validation') ? 'After response or framework test' : 'Framework or request utility',
      purpose: `Public ${item.category.toLowerCase()} function exposed through the supported SystemLogic gateway.`,
      signature: `${item.name}(...)`,
      state: 'Review the current source and owning tests before direct collection use.',
      returns: 'Returns the framework-specific value defined by the current implementation.',
      failures: 'Uses the owning framework contract and approved masked diagnostics.',
      example: `const result = ${item.name}(...);`,
      relationships: [
        ['fa-solid fa-code', 'Public API', 'Exposed through Scripts/SystemLogic/index.js.'],
        ['fa-solid fa-file-code', 'Source module', item.source],
        ['fa-solid fa-vials', 'Verification', 'Review the owning unit, contract or quality coverage.'],
      ],
    });

    const renderWorkspace = () => {
      const item = GUIDE_FUNCTIONS.find((candidate) => candidate.name === selectedName) ?? GUIDE_FUNCTIONS[0];
      if (!item) return;
      const guidance = FUNCTION_GUIDANCE[item.name] ?? fallbackGuidance(item);
      const relationships = guidance.relationships.map(([icon, title, description]) => `
        <article class="function-relationship">
          <i class="${escapeHtml(icon)}" aria-hidden="true"></i>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(description)}</span>
        </article>`).join('');

      workspace.innerHTML = `
        <header class="function-workspace-header">
          <div class="function-workspace-kicker"><i class="fa-solid fa-code" aria-hidden="true"></i>${escapeHtml(item.category)}</div>
          <h2>${escapeHtml(item.name)}</h2>
          <p>${escapeHtml(guidance.purpose)}</p>
          <div class="function-workspace-meta">
            <span>${escapeHtml(guidance.phase)}</span>
            <span>${escapeHtml(item.source)}</span>
          </div>
        </header>
        <div class="function-workspace-body">
          <div class="function-signature">${escapeHtml(guidance.signature)}</div>
          <div class="function-summary-grid">
            <article><i class="fa-solid fa-database" aria-hidden="true"></i><strong>State and ownership</strong><p>${escapeHtml(guidance.state)}</p></article>
            <article><i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i><strong>Returns</strong><p>${escapeHtml(guidance.returns)}</p></article>
            <article><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><strong>Failure behaviour</strong><p>${escapeHtml(guidance.failures)}</p></article>
          </div>
          <h3>Governed example</h3>
          <div class="terminal-block function-terminal"><div class="terminal-head"><span></span><span></span><span></span><strong>JavaScript</strong></div><pre><code>${escapeHtml(guidance.example)}</code></pre></div>
          <h3>Framework relationships</h3>
          <div class="function-relationship-grid">${relationships}</div>
        </div>`;
    };

    const renderFunctions = () => {
      const query = input.value.trim().toLowerCase();
      const filtered = GUIDE_FUNCTIONS.filter((item) =>
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query),
      );

      if (!filtered.some((item) => item.name === selectedName) && filtered[0]) {
        selectedName = filtered[0].name;
      }

      count.textContent = `${filtered.length} functions`;
      list.replaceChildren(
        ...filtered.map((item) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = `function-choice ${item.name === selectedName ? 'active' : ''}`;
          button.dataset.functionName = item.name;
          button.setAttribute('aria-pressed', String(item.name === selectedName));
          const strong = document.createElement('strong');
          strong.textContent = item.name;
          const span = document.createElement('span');
          span.textContent = `${item.category} · ${item.source}`;
          button.append(strong, span);
          return button;
        }),
      );
      renderWorkspace();
    };

    const inputHandler = () => renderFunctions();
    const listHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLButtonElement>('.function-choice');
      if (!button?.dataset.functionName) return;
      selectedName = button.dataset.functionName;
      renderFunctions();
    };

    input.addEventListener('input', inputHandler);
    list.addEventListener('click', listHandler);
    renderFunctions();
    return () => {
      input.removeEventListener('input', inputHandler);
      list.removeEventListener('click', listHandler);
    };
  }, [activeSection.id]);

  useEffect(() => {
    if (activeSection.id !== 'troubleshooting') return;

    const root = viewportRef.current;
    const input = root?.querySelector<HTMLInputElement>('#troubleshooting-search');
    const count = root?.querySelector<HTMLElement>('#troubleshooting-count');
    const empty = root?.querySelector<HTMLElement>('#troubleshooting-empty');
    const items = root ? Array.from(root.querySelectorAll<HTMLElement>('.troubleshooting-item')) : [];
    if (!input || !count || !empty) return;

    const filterItems = () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const searchable = `${item.dataset.troubleshooting ?? ''} ${item.textContent ?? ''}`.toLowerCase();
        const matches = !query || searchable.includes(query);
        item.hidden = !matches;
        if (matches) visible += 1;
      });
      count.textContent = `${visible} known ${visible === 1 ? 'issue' : 'issues'}`;
      empty.hidden = visible !== 0;
    };

    input.addEventListener('input', filterItems);
    filterItems();
    return () => input.removeEventListener('input', filterItems);
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
          <h1 title="FastDraft API Automation Portal">
            <i className="fa-brands fa-algolia guide-brand-icon" aria-hidden="true" />
            <span>FastDraft API Automation Portal</span>
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
            <span>Portal v0.3.14</span>
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
