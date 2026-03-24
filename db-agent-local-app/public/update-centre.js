// ============================================================
// Update Centre — Notification UI & Staleness Indicators
// DB Agent GRC Workspace
// ============================================================

let _ucPanelOpen = false;
let _ucView = "centre"; // "centre" | "history"

// ── Bell ─────────────────────────────────────────────────────

function ucEnsureBell(containerEl) {
  if (!containerEl) return;
  let bell = document.getElementById("uc-bell-btn");
  if (!bell) {
    bell = document.createElement("button");
    bell.type = "button";
    bell.id = "uc-bell-btn";
    bell.className = "uc-bell-btn";
    bell.title = "View pending compliance updates";
    bell.innerHTML = `<span class="uc-bell-icon">⚠</span><span class="uc-bell-badge" style="display:none">0</span>`;
    bell.addEventListener("click", ucToggleUpdateCentre);
    containerEl.appendChild(bell);
  }
  ucUpdateBell();
}

function ucUpdateBell() {
  const bell = document.getElementById("uc-bell-btn");
  if (!bell) return;
  const count = (typeof chGetPendingCount === "function") ? chGetPendingCount() : 0;
  const badge = bell.querySelector(".uc-bell-badge");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }
  bell.classList.toggle("uc-bell-active", count > 0);
  bell.title = count > 0 ? `${count} pending compliance update${count === 1 ? "" : "s"}` : "No pending updates";
}

// ── Toggle / open ────────────────────────────────────────────

function ucToggleUpdateCentre() {
  const existing = document.getElementById("uc-overlay");
  if (existing) {
    existing.remove();
    _ucPanelOpen = false;
  } else {
    _ucPanelOpen = true;
    _ucView = "centre";
    ucOpenUpdateCentre();
  }
}

function ucOpenUpdateCentre() {
  document.getElementById("uc-overlay")?.remove();
  document.body.appendChild(ucBuildPanel());
}

// ── Panel shell ──────────────────────────────────────────────

function ucBuildPanel() {
  const overlay = document.createElement("div");
  overlay.id = "uc-overlay";
  overlay.className = "uc-overlay";
  overlay.addEventListener("click", e => {
    if (e.target === overlay) { overlay.remove(); _ucPanelOpen = false; }
  });

  const panel = document.createElement("div");
  panel.className = "uc-panel";

  // Header row
  const head = document.createElement("div");
  head.className = "uc-panel-head";

  const navWrap = document.createElement("div");
  navWrap.className = "uc-nav-wrap";

  const pending = (typeof chGetPendingCount === "function") ? chGetPendingCount() : 0;

  [
    { label: "Update Centre",  view: "centre",  badge: pending > 0 ? String(pending) : null },
    { label: "Change History", view: "history", badge: null }
  ].forEach(({ label, view, badge }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `uc-nav-btn${_ucView === view ? " active" : ""}`;
    btn.textContent = label;
    if (badge) {
      const b = document.createElement("span");
      b.className = "uc-nav-badge";
      b.textContent = badge;
      btn.appendChild(b);
    }
    btn.addEventListener("click", () => {
      _ucView = view;
      overlay.remove();
      ucOpenUpdateCentre();
    });
    navWrap.appendChild(btn);
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "uc-close-btn";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => { overlay.remove(); _ucPanelOpen = false; });

  head.appendChild(navWrap);
  head.appendChild(closeBtn);
  panel.appendChild(head);

  const body = document.createElement("div");
  body.className = "uc-panel-body";

  if (_ucView === "history") {
    body.appendChild(ucBuildHistory());
  } else {
    body.appendChild(ucBuildChangeList());
  }

  panel.appendChild(body);
  overlay.appendChild(panel);
  return overlay;
}

// ── Change list ───────────────────────────────────────────────

function ucBuildChangeList() {
  const wrap = document.createElement("div");
  wrap.className = "uc-change-list";

  if (typeof chLoadChangeLog !== "function") return wrap;
  const log = (typeof chLoadChangeLog === "function") ? chLoadChangeLog() : [];
  const pending = log.filter(c => c.status === "pending_review");

  if (pending.length === 0) {
    const empty = document.createElement("div");
    empty.className = "uc-empty";
    empty.innerHTML = `<p class="uc-empty-icon">✓</p><p><strong>All clear.</strong> No pending updates. Changes will appear here whenever onboarding context or vendors change.</p>`;
    wrap.appendChild(empty);
    return wrap;
  }

  // Top bar
  const topBar = document.createElement("div");
  topBar.className = "uc-topbar";

  const summary = document.createElement("p");
  summary.className = "uc-topbar-summary";
  summary.textContent = `${pending.length} pending update${pending.length === 1 ? "" : "s"} across your compliance program`;
  topBar.appendChild(summary);

  const dismissAll = document.createElement("button");
  dismissAll.type = "button";
  dismissAll.className = "action-button ghost small";
  dismissAll.textContent = "Dismiss all";
  dismissAll.addEventListener("click", () => {
    if (typeof chResolveAll === "function") chResolveAll();
    document.getElementById("uc-overlay")?.remove();
    _ucPanelOpen = false;
  });
  topBar.appendChild(dismissAll);
  wrap.appendChild(topBar);

  // Group by impact priority
  const impactGroups = [
    { impact: "critical", heading: "Critical — Immediate action required" },
    { impact: "high",     heading: "High — Review recommended" },
    { impact: "medium",   heading: "Medium — Review when convenient" },
    { impact: "info",     heading: "Information" }
  ];

  impactGroups.forEach(({ impact, heading }) => {
    const group = pending.filter(c => c.impact === impact);
    if (group.length === 0) return;

    const section = document.createElement("div");
    section.className = `uc-group uc-group-${impact}`;

    const secHead = document.createElement("div");
    secHead.className = "uc-group-head";
    secHead.textContent = heading;
    section.appendChild(secHead);

    group.forEach(change => section.appendChild(ucBuildChangeCard(change)));
    wrap.appendChild(section);
  });

  return wrap;
}

// ── Change card ───────────────────────────────────────────────

function ucBuildChangeCard(change) {
  const card = document.createElement("div");
  card.className = `uc-change-card uc-card-${change.impact}`;

  // Card header
  const header = document.createElement("div");
  header.className = "uc-card-head";

  const source = document.createElement("span");
  source.className = "uc-card-source";
  source.textContent = change.source === "vendors" ? "Vendor change" : "Onboarding change";

  const ts = document.createElement("span");
  ts.className = "uc-card-ts";
  ts.textContent = change.timestamp
    ? new Date(change.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

  header.appendChild(source);
  header.appendChild(ts);
  card.appendChild(header);

  // Title
  const title = document.createElement("p");
  title.className = "uc-card-title";
  title.textContent = change.label || change.type?.replace(/_/g, " ") || change.field;
  card.appendChild(title);

  // Value diff (if meaningful)
  if (change.change_type && change.field && !change.type?.startsWith("vendor_")) {
    const diff = document.createElement("p");
    diff.className = "uc-card-diff";
    const prev = ucTruncate(String(change.previous_value || "—"), 60);
    const curr = ucTruncate(String(change.new_value      || "—"), 60);
    diff.innerHTML = `<span class="uc-diff-prev">${ucEsc(prev)}</span><span class="uc-diff-arrow">→</span><span class="uc-diff-curr">${ucEsc(curr)}</span>`;
    card.appendChild(diff);
  }

  // Action rows from impact rules
  if (change.actions && change.actions.length > 0) {
    change.actions.forEach(action => {
      card.appendChild(ucBuildActionRow(change, action));
    });
  } else {
    // Fallback: dismiss row only
    const row = document.createElement("div");
    row.className = "uc-action-row";
    row.appendChild(ucMakeDismissBtn(change.id));
    card.appendChild(row);
  }

  return card;
}

function ucBuildActionRow(change, action) {
  const row = document.createElement("div");
  row.className = "uc-action-row";

  const left = document.createElement("div");
  left.className = "uc-action-left";

  if (action.artifact) {
    const art = document.createElement("strong");
    art.className = "uc-action-artifact";
    art.textContent = action.artifact;
    left.appendChild(art);
  }

  const reason = document.createElement("p");
  reason.className = "uc-action-reason";
  reason.textContent = action.reason;
  left.appendChild(reason);

  const btns = document.createElement("div");
  btns.className = "uc-action-btns";

  const navBtn = ucMakeNavBtn(change, action);
  if (navBtn) btns.appendChild(navBtn);
  btns.appendChild(ucMakeDismissBtn(change.id));

  row.appendChild(left);
  row.appendChild(btns);
  return row;
}

// ── Action buttons ────────────────────────────────────────────

function ucMakeNavBtn(change, action) {
  if (!action.nav) return null;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "action-button ghost small";

  const labels = {
    "policy-generation": "Go to Policies",
    "risk-assessment":   "Go to Risk Register",
    "vendor-risk":       "Go to Vendor Assessments",
    "evidence-tracker":  "Go to Evidence Tracker",
    "onboarding":        action.framework ? `Add ${action.framework} scope` : "Go to Onboarding"
  };
  btn.textContent = labels[action.nav] || "Review";

  btn.addEventListener("click", () => {
    if (typeof chResolveChange === "function") chResolveChange(change.id, "navigated");
    document.getElementById("uc-overlay")?.remove();
    _ucPanelOpen = false;
    if (typeof state !== "undefined" && action.nav) state.activePhaseKey = action.nav;
    if (typeof renderTabs === "function") renderTabs();
    if (typeof renderActivePhase === "function") renderActivePhase();
    ucUpdateBell();
  });

  return btn;
}

function ucMakeDismissBtn(changeId) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "action-button ghost small uc-dismiss";
  btn.textContent = "Dismiss";
  btn.addEventListener("click", () => {
    if (typeof chResolveChange === "function") chResolveChange(changeId, "dismissed");
    ucUpdateBell();
    // Refresh in place
    document.getElementById("uc-overlay")?.remove();
    if (_ucPanelOpen) ucOpenUpdateCentre();
  });
  return btn;
}

// ── Change History ────────────────────────────────────────────

function ucBuildHistory() {
  const wrap = document.createElement("div");
  wrap.className = "uc-history";

  const log = (typeof chLoadChangeLog === "function") ? chLoadChangeLog() : [];

  if (log.length === 0) {
    const empty = document.createElement("div");
    empty.className = "uc-empty";
    empty.innerHTML = `<p class="uc-empty-icon">📋</p><p>No change history yet. Changes will appear here after the first onboarding save.</p>`;
    wrap.appendChild(empty);
    return wrap;
  }

  const titleEl = document.createElement("h4");
  titleEl.className = "uc-history-head";
  titleEl.textContent = "All detected changes — audit trail";
  wrap.appendChild(titleEl);

  // Group by calendar day
  const grouped = {};
  log.forEach(c => {
    const day = c.timestamp ? c.timestamp.slice(0, 10) : "unknown";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(c);
  });

  Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([day, changes]) => {
      const dayWrap = document.createElement("div");
      dayWrap.className = "uc-history-day";

      const dayLabel = document.createElement("div");
      dayLabel.className = "uc-history-day-label";
      try {
        dayLabel.textContent = new Date(day + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      } catch (_) {
        dayLabel.textContent = day;
      }
      dayWrap.appendChild(dayLabel);

      changes.forEach(c => {
        const row = document.createElement("div");
        row.className = "uc-history-row";

        const statusChip = document.createElement("span");
        statusChip.className = `uc-status-chip uc-status-${c.status === "pending_review" ? "pending" : c.status || "pending"}`;
        statusChip.textContent = c.status === "pending_review" ? "Pending" : c.status === "resolved" ? "Resolved" : "Dismissed";

        const impactChip = document.createElement("span");
        impactChip.className = `uc-impact-mini uc-impact-mini-${c.impact || "medium"}`;
        impactChip.textContent = c.impact || "";

        const desc = document.createElement("span");
        desc.className = "uc-history-desc";
        desc.textContent = c.label || c.type?.replace(/_/g, " ") || c.field || "";

        const ts = document.createElement("span");
        ts.className = "uc-history-ts";
        ts.textContent = c.timestamp
          ? new Date(c.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
          : "";

        row.appendChild(statusChip);
        row.appendChild(impactChip);
        row.appendChild(desc);
        row.appendChild(ts);
        dayWrap.appendChild(row);
      });

      wrap.appendChild(dayWrap);
    });

  // Clear history button
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "action-button ghost small";
  clearBtn.style.marginTop = "16px";
  clearBtn.textContent = "Clear dismissed changes";
  clearBtn.addEventListener("click", () => {
    if (typeof chSaveChangeLog === "function") {
      const log = (typeof chLoadChangeLog === "function") ? chLoadChangeLog() : [];
      chSaveChangeLog(log.filter(c => c.status === "pending_review"));
    }
    document.getElementById("uc-overlay")?.remove();
    ucOpenUpdateCentre();
  });
  wrap.appendChild(clearBtn);

  return wrap;
}

// ── Staleness chip ────────────────────────────────────────────

// artifactKey: "policies" | "risks" | "vendor_assessments" | "evidence"
// generatedAt: ISO string from the artifact's updatedAt field
function ucRenderStalenessChip(artifactKey, generatedAt) {
  if (!generatedAt || typeof chComputeStaleness !== "function") return null;

  const level = chComputeStaleness(artifactKey, generatedAt);
  if (!level || level === "current") return null;

  const info = CH_STALENESS?.[level];
  const chip = document.createElement("span");
  chip.className = `uc-staleness-chip uc-staleness-${level}`;
  chip.textContent = info?.label || level.replace(/_/g, " ");
  chip.title = "Context changed since this artifact was last generated. Click to review.";
  chip.style.cursor = "pointer";
  chip.addEventListener("click", () => {
    _ucView = "centre";
    _ucPanelOpen = true;
    ucOpenUpdateCentre();
  });
  return chip;
}

// ── Inject staleness chips into active tab panel ──────────────

function ucInjectStalenessChips() {
  if (!state?.selectedClientData || typeof chComputeStaleness !== "function") return;

  const phaseKey   = state.activePhaseKey;
  const clientData = state.selectedClientData;

  // Artifact key and timestamp per phase
  const phaseArtifactMap = {
    "policy-generation": { key: "policies",          ts: clientData.policyGeneration?.updatedAt },
    "risk-assessment":   { key: "risks",              ts: clientData.riskAssessment?.updatedAt },
    "vendor-risk":       { key: "vendor_assessments", ts: clientData.vendorRisk?.updatedAt },
    "evidence-tracker":  { key: "evidence",           ts: clientData.evidenceTracker?.updatedAt }
  };

  const mapping = phaseArtifactMap[phaseKey];
  if (!mapping || !mapping.ts) return;

  const chip = ucRenderStalenessChip(mapping.key, mapping.ts);
  if (!chip) return;

  // Inject after the first h3 inside the active tab panel
  const panel = document.getElementById("active-tab-panel");
  if (!panel) return;
  const heading = panel.querySelector("h3");
  if (heading && !panel.querySelector(".uc-staleness-chip")) {
    heading.parentNode.insertBefore(chip, heading.nextSibling);
  }
}

// ── Utilities ─────────────────────────────────────────────────

function ucTruncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function ucEsc(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
