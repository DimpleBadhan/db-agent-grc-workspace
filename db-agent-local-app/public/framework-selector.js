// ============================================================
// Framework Selector — Master Compliance Scope Engine
// DB Agent GRC Workspace
// ============================================================

const FRAMEWORK_CONFIG = {
  "SOC 2 Type I": {
    id: "SOC 2 Type I",
    label: "SOC 2 Type I",
    short: "SOC 2 I",
    description: "Point-in-time snapshot of your controls. Faster to achieve. Suitable for early-stage companies needing to close their first enterprise deals.",
    typical_company: "Seed to Series A startups",
    audit_period: "Point-in-time",
    task_count: 28,
    evidence_style: "Lightweight to standard",
    color_class: "fw-soc2",
    legacy_key: "SOC2",
    internal_key: "SOC2"
  },
  "SOC 2 Type II": {
    id: "SOC 2 Type II",
    label: "SOC 2 Type II",
    short: "SOC 2 II",
    description: "Operating effectiveness over 6–12 months. Required by most enterprise customers and the gold standard for SaaS security.",
    typical_company: "Growth-stage with enterprise customers",
    audit_period: "6–12 months",
    task_count: 28,
    evidence_style: "Standard to comprehensive",
    color_class: "fw-soc2",
    legacy_key: "SOC2",
    internal_key: "SOC2"
  },
  "ISO 27001": {
    id: "ISO 27001",
    label: "ISO 27001:2022",
    short: "ISO 27001",
    description: "International certification for information security management. Requires a formal ISMS, internal audit program, and annual management review.",
    typical_company: "UK / EU / government markets, enterprise B2B",
    audit_period: "Ongoing — annual surveillance audits",
    task_count: 35,
    evidence_style: "Comprehensive",
    color_class: "fw-iso",
    legacy_key: "ISO",
    internal_key: "ISO"
  },
  "HIPAA": {
    id: "HIPAA",
    label: "HIPAA",
    short: "HIPAA",
    description: "Required for any company handling US patient health data (PHI). Non-negotiable if you operate in US healthcare.",
    typical_company: "US healthcare SaaS, digital health, health data platforms",
    audit_period: "Ongoing — no formal cert, documented compliance required",
    task_count: 22,
    evidence_style: "Standard",
    color_class: "fw-hipaa",
    legacy_key: "SOC2",
    internal_key: "HIPAA"
  },
  "GDPR": {
    id: "GDPR",
    label: "GDPR",
    short: "GDPR",
    description: "Required for any company processing personal data of EU residents, regardless of where the company is based.",
    typical_company: "Any company with EU customers or employees",
    audit_period: "Ongoing",
    task_count: 18,
    evidence_style: "Standard",
    color_class: "fw-gdpr",
    legacy_key: "ISO",
    internal_key: "GDPR"
  },
  "PCI DSS": {
    id: "PCI DSS",
    label: "PCI DSS v4.0",
    short: "PCI DSS",
    description: "Required for any company that stores, processes, or transmits payment card data.",
    typical_company: "Fintech, e-commerce, companies taking card payments",
    audit_period: "Annual assessment",
    task_count: 31,
    evidence_style: "Comprehensive",
    color_class: "fw-pci",
    legacy_key: "SOC2",
    internal_key: "PCI"
  }
};

// ============================================================
// Framework Parsing and Normalization
// ============================================================

function parseFwSelection(value) {
  if (!value) return [];
  const str = String(value).trim();

  // New format: JSON array
  if (str.startsWith("[")) {
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) return arr.filter(Boolean);
    } catch (e) { /* fall through */ }
  }

  // Old legacy format
  if (str === "Both") return ["SOC 2 Type II", "ISO 27001"];
  if (str === "SOC2") return ["SOC 2 Type II"];
  if (str === "ISO") return ["ISO 27001"];

  return [];
}

function fwNamesToLegacy(names) {
  const hasSoc2 = names.some(n => n.startsWith("SOC 2") || n === "SOC2" || n === "HIPAA" || n === "PCI DSS");
  const hasIso = names.some(n => n === "ISO 27001" || n === "ISO" || n === "GDPR");
  if (hasSoc2 && hasIso) return "Both";
  if (hasIso) return "ISO";
  if (hasSoc2) return "SOC2";
  return "";
}

function fwNamesToInternalKeys(names) {
  const result = [];
  names.forEach(n => {
    const cfg = FRAMEWORK_CONFIG[n];
    if (cfg && !result.includes(cfg.internal_key)) result.push(cfg.internal_key);
  });
  return result;
}

function getFwDisplayString(names) {
  if (!names || names.length === 0) return "No framework selected";
  return names.map(n => FRAMEWORK_CONFIG[n]?.short || n).join(" · ");
}

// ============================================================
// Active Context
// ============================================================

let activeContext = null;

function buildActiveContext(clientData) {
  const onboarding = clientData?.onboarding || {};
  const fwNames = parseFwSelection(onboarding.framework_selection_v2 || onboarding.framework_selection);
  const internalKeys = fwNamesToInternalKeys(fwNames);

  const totalTasks = fwNames.reduce((sum, n) => sum + (FRAMEWORK_CONFIG[n]?.task_count || 0), 0);
  const uniqueTasks = Math.round(totalTasks * 0.85); // rough dedup estimate
  const evidenceStyle = fwNames.length > 0
    ? fwNames.map(n => FRAMEWORK_CONFIG[n]?.evidence_style || "").filter(Boolean).join(" / ")
    : "";

  activeContext = {
    frameworks: fwNames,
    internalKeys,
    company: {
      name: onboarding.legal_entity || "Company",
      headcount: parseInt(String(onboarding.employee_headcount || "0").replace(/\D/g, ""), 10) || 0,
      industry: onboarding.industry || ""
    },
    task_scope_count: uniqueTasks,
    evidence_style: evidenceStyle,
    legacy_key: fwNamesToLegacy(fwNames),
    audit_period: fwNames.length > 0
      ? fwNames.map(n => FRAMEWORK_CONFIG[n]?.audit_period || "").filter(Boolean).join(" + ")
      : ""
  };

  return activeContext;
}

function getActiveContext() {
  return activeContext;
}

// ============================================================
// LocalStorage Helpers
// ============================================================

function getFwLsKey(clientId) {
  return `db_agent_fw_ctx_${clientId}`;
}

function getScopeLsKey(clientId) {
  return `db_agent_fw_scope_${clientId}`;
}

function getChecklistLsKey(clientId) {
  return `db_agent_fw_checklist_${clientId}`;
}

function isFwConfirmed(clientId, fwNames) {
  try {
    const stored = JSON.parse(localStorage.getItem(getFwLsKey(clientId)) || "null");
    if (!stored) return false;
    const storedSorted = [...(stored.selected || [])].sort().join(",");
    const currentSorted = [...(fwNames || [])].sort().join(",");
    return storedSorted === currentSorted;
  } catch (e) { return false; }
}

function persistFwConfirmation(clientId, fwNames) {
  try {
    localStorage.setItem(getFwLsKey(clientId), JSON.stringify({
      selected: fwNames,
      confirmed_at: new Date().toISOString(),
      last_changed: null
    }));
  } catch (e) { /* ignore */ }
}

function isChecklistDismissed(clientId) {
  return localStorage.getItem(getChecklistLsKey(clientId)) === "dismissed";
}

function dismissChecklist(clientId) {
  localStorage.setItem(getChecklistLsKey(clientId), "dismissed");
}

// ============================================================
// Onboarding Framework Cards Render
// ============================================================

function renderFwCardSection(sectionData, form) {
  const currentSelection = parseFwSelection(sectionData.framework_selection_v2 || sectionData.framework_selection);
  let selectedFws = [...currentSelection];

  const section = document.createElement("section");
  section.className = "form-section fw-selector-section";

  const title = document.createElement("h4");
  title.textContent = "Step 1: Choose your compliance framework(s)";
  const note = document.createElement("p");
  note.className = "section-note";
  note.textContent = "Select every framework that applies. Multiple selections are supported. The framework you choose here controls everything — tasks, evidence, policies, and AI analysis.";
  section.appendChild(title);
  section.appendChild(note);

  // Hidden inputs (read by collectPhasePayload)
  const hiddenLegacy = document.createElement("input");
  hiddenLegacy.type = "hidden";
  hiddenLegacy.dataset.field = "framework_selection";
  hiddenLegacy.value = fwNamesToLegacy(selectedFws);
  section.appendChild(hiddenLegacy);

  const hiddenV2 = document.createElement("input");
  hiddenV2.type = "hidden";
  hiddenV2.dataset.field = "framework_selection_v2";
  hiddenV2.value = JSON.stringify(selectedFws);
  section.appendChild(hiddenV2);

  // TSC scope hidden input
  let selectedTsc = (() => {
    try {
      const raw = sectionData.soc2_tsc_scope;
      if (Array.isArray(raw)) return raw.includes("Security") ? raw : ["Security", ...raw];
      if (typeof raw === "string" && raw.startsWith("[")) {
        const parsed = JSON.parse(raw);
        return parsed.includes("Security") ? parsed : ["Security", ...parsed];
      }
    } catch (e) {}
    return ["Security"];
  })();

  const hiddenTsc = document.createElement("input");
  hiddenTsc.type = "hidden";
  hiddenTsc.dataset.field = "soc2_tsc_scope";
  hiddenTsc.value = JSON.stringify(selectedTsc);
  section.appendChild(hiddenTsc);

  // TSC scope section — visible only when SOC 2 is selected
  const tscDescriptions = {
    "Security": "Mandatory. Protects against unauthorized access, use, and modification — covers all CC1–CC9 controls (34 controls).",
    "Availability": "Systems are available for operation as committed. Select if you make uptime or SLA commitments — A1 controls (4 controls).",
    "Processing Integrity": "System processing is complete, valid, accurate, timely, and authorized — PI1 controls (5 controls).",
    "Confidentiality": "Information designated as confidential is protected — covers client data, IP, and trade secrets — C1 controls (2 controls).",
    "Privacy": "Personal information is collected, used, retained, and disposed of per your privacy commitments — P1–P8 controls (18 controls)."
  };

  const tscSection = document.createElement("div");
  tscSection.className = "tsc-scope-section";
  tscSection.style.display = selectedFws.some(f => f.startsWith("SOC 2")) ? "" : "none";

  const tscTitle = document.createElement("h4");
  tscTitle.textContent = "Step 2: Select your Trust Services Categories (TSC)";
  const tscNote = document.createElement("p");
  tscNote.className = "section-note";
  tscNote.textContent = "Security is mandatory for all SOC 2 engagements. Add additional categories based on your service commitments to customers.";
  tscSection.appendChild(tscTitle);
  tscSection.appendChild(tscNote);

  const tscGrid = document.createElement("div");
  tscGrid.className = "tsc-checkbox-grid";

  ["Security", "Availability", "Processing Integrity", "Confidentiality", "Privacy"].forEach(tsc => {
    const isMandatory = tsc === "Security";
    const isChecked = selectedTsc.includes(tsc);

    const row = document.createElement("label");
    row.className = `tsc-checkbox-row${isMandatory ? " tsc-mandatory" : ""}${isChecked ? " tsc-checked" : ""}`;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "tsc-checkbox";
    cb.checked = isChecked;
    cb.disabled = isMandatory;
    cb.dataset.tsc = tsc;

    const labelDiv = document.createElement("div");
    labelDiv.className = "tsc-label-block";

    const labelName = document.createElement("span");
    labelName.className = "tsc-name";
    labelName.textContent = tsc + (isMandatory ? " (mandatory)" : "");

    const labelDesc = document.createElement("span");
    labelDesc.className = "tsc-desc";
    labelDesc.textContent = tscDescriptions[tsc];

    labelDiv.appendChild(labelName);
    labelDiv.appendChild(labelDesc);
    row.appendChild(cb);
    row.appendChild(labelDiv);

    cb.addEventListener("change", () => {
      if (cb.checked && !selectedTsc.includes(tsc)) {
        selectedTsc.push(tsc);
      } else if (!cb.checked) {
        const idx = selectedTsc.indexOf(tsc);
        if (idx !== -1) selectedTsc.splice(idx, 1);
      }
      row.classList.toggle("tsc-checked", cb.checked);
      hiddenTsc.value = JSON.stringify(selectedTsc);
    });

    tscGrid.appendChild(row);
  });

  tscSection.appendChild(tscGrid);

  // Card grid
  const grid = document.createElement("div");
  grid.className = "fw-card-grid";

  const previewArea = document.createElement("div");
  previewArea.className = "fw-preview-area";

  const updatePreview = () => {
    previewArea.innerHTML = "";
    if (selectedFws.length === 0) {
      const empty = document.createElement("p");
      empty.className = "fw-preview-empty";
      empty.textContent = "Select one or more frameworks above to see your compliance scope.";
      previewArea.appendChild(empty);
      return;
    }
    previewArea.appendChild(renderFwSelectionPreview(selectedFws));
  };

  Object.values(FRAMEWORK_CONFIG).forEach(cfg => {
    const card = document.createElement("div");
    const isSelected = selectedFws.includes(cfg.id);
    card.className = `fw-card ${cfg.color_class}${isSelected ? " fw-card-selected" : ""}`;
    card.dataset.fwId = cfg.id;

    card.innerHTML = `
      <div class="fw-card-check${isSelected ? " fw-card-check-visible" : ""}">✓</div>
      <div class="fw-card-header">
        <span class="fw-card-label">${cfg.label}</span>
        <span class="fw-card-tasks">${cfg.task_count} tasks</span>
      </div>
      <p class="fw-card-desc">${cfg.description}</p>
      <div class="fw-card-meta">
        <span class="fw-card-meta-item">
          <span class="fw-meta-label">Typical company</span>
          <span>${cfg.typical_company}</span>
        </span>
        <span class="fw-card-meta-item">
          <span class="fw-meta-label">Audit period</span>
          <span>${cfg.audit_period}</span>
        </span>
        <span class="fw-card-meta-item">
          <span class="fw-meta-label">Evidence style</span>
          <span>${cfg.evidence_style}</span>
        </span>
      </div>
    `;

    card.addEventListener("click", () => {
      const idx = selectedFws.indexOf(cfg.id);
      if (idx === -1) {
        selectedFws.push(cfg.id);
      } else {
        selectedFws.splice(idx, 1);
      }
      // Mutually exclusive SOC 2 Type I / Type II
      if (cfg.id === "SOC 2 Type II" && selectedFws.includes("SOC 2 Type I")) {
        selectedFws.splice(selectedFws.indexOf("SOC 2 Type I"), 1);
      } else if (cfg.id === "SOC 2 Type I" && selectedFws.includes("SOC 2 Type II")) {
        selectedFws.splice(selectedFws.indexOf("SOC 2 Type II"), 1);
      }

      hiddenLegacy.value = fwNamesToLegacy(selectedFws);
      hiddenV2.value = JSON.stringify(selectedFws);

      // Show/hide TSC section based on SOC 2 selection
      tscSection.style.display = selectedFws.some(f => f.startsWith("SOC 2")) ? "" : "none";

      // Re-render cards
      grid.querySelectorAll(".fw-card").forEach(c => {
        const id = c.dataset.fwId;
        const sel = selectedFws.includes(id);
        c.classList.toggle("fw-card-selected", sel);
        c.querySelector(".fw-card-check").classList.toggle("fw-card-check-visible", sel);
      });

      updatePreview();
    });

    grid.appendChild(card);
  });

  section.appendChild(grid);
  section.appendChild(tscSection);
  section.appendChild(previewArea);
  updatePreview();

  return section;
}

function renderFwSelectionPreview(selectedFws) {
  const wrap = document.createElement("div");
  wrap.className = "fw-preview-wrap";

  const hasBothSocIso = selectedFws.some(f => f.startsWith("SOC 2")) && selectedFws.includes("ISO 27001");

  const totalTasks = selectedFws.reduce((sum, n) => {
    return sum + (FRAMEWORK_CONFIG[n]?.task_count || 0);
  }, 0);
  const overlapCount = hasBothSocIso ? 12 : 0;
  const uniqueTasks = hasBothSocIso ? Math.max(totalTasks - 5, 1) : totalTasks;
  const evidenceBeforeDedup = uniqueTasks + 16;
  const evidenceAfterDedup = hasBothSocIso ? evidenceBeforeDedup - 12 : evidenceBeforeDedup;

  const fwDisplay = selectedFws.map(n => FRAMEWORK_CONFIG[n]?.label || n).join(" + ");
  const evidenceStyle = [...new Set(selectedFws.map(n => FRAMEWORK_CONFIG[n]?.evidence_style || "").filter(Boolean))].join(" / ");
  const auditPeriod = [...new Set(selectedFws.map(n => FRAMEWORK_CONFIG[n]?.audit_period || "").filter(Boolean))].join(" · ");

  wrap.innerHTML = `
    <div class="fw-preview-header">
      <span class="fw-preview-badge">${fwDisplay}</span>
      <span class="fw-preview-label">selected</span>
    </div>
    <div class="fw-preview-stats">
      <div class="fw-preview-stat">
        <span class="fw-stat-value">${uniqueTasks}</span>
        <span class="fw-stat-label">${hasBothSocIso ? `unique tasks (${totalTasks - uniqueTasks} overlap — counted once)` : "tasks activated"}</span>
      </div>
      ${overlapCount > 0 ? `
      <div class="fw-preview-stat">
        <span class="fw-stat-value">${overlapCount}</span>
        <span class="fw-stat-label">deduplication opportunities detected</span>
      </div>` : ""}
      <div class="fw-preview-stat">
        <span class="fw-stat-value">${evidenceAfterDedup}${overlapCount > 0 ? ` <small>of ${evidenceBeforeDedup}</small>` : ""}</span>
        <span class="fw-stat-label">estimated evidence items${overlapCount > 0 ? " after merging" : ""}</span>
      </div>
    </div>
    <div class="fw-preview-detail">
      <span><strong>Evidence style:</strong> ${evidenceStyle}</span>
      <span><strong>Audit period:</strong> ${auditPeriod}</span>
    </div>
  `;

  return wrap;
}

// ============================================================
// Confirmation Modal
// ============================================================

function showFwConfirmModal(fwNames, onConfirm, onCancel) {
  const existing = document.getElementById("fw-confirm-overlay");
  if (existing) existing.remove();

  const hasBothSocIso = fwNames.some(f => f.startsWith("SOC 2")) && fwNames.includes("ISO 27001");
  const totalTasks = fwNames.reduce((sum, n) => sum + (FRAMEWORK_CONFIG[n]?.task_count || 0), 0);
  const uniqueTasks = hasBothSocIso ? Math.max(totalTasks - 5, 1) : totalTasks;
  const evidenceItems = hasBothSocIso ? uniqueTasks - 10 : uniqueTasks - 6;

  const unlocks = [...new Set(fwNames.flatMap(n => {
    const cfg = FRAMEWORK_CONFIG[n];
    if (!cfg) return [];
    const base = ["Policy generation", "Risk assessment", "Vendor assessment", "Task tracker", "Evidence collection"];
    if (n === "ISO 27001") return [...base, "ISMS scope document", "Statement of Applicability", "Internal audit program"];
    return base;
  }))];

  const overlay = document.createElement("div");
  overlay.className = "fw-confirm-overlay";
  overlay.id = "fw-confirm-overlay";

  const modal = document.createElement("div");
  modal.className = "fw-confirm-modal";

  modal.innerHTML = `
    <div class="fw-confirm-head">
      <p class="section-label">Confirm compliance scope</p>
      <h3>You are about to set your compliance scope</h3>
    </div>
    <div class="fw-confirm-frameworks">
      ${fwNames.map(n => `<div class="fw-confirm-fw-row"><span class="fw-confirm-check">✓</span> ${FRAMEWORK_CONFIG[n]?.label || n}</div>`).join("")}
    </div>
    <p class="fw-confirm-section-label">This will activate:</p>
    <ul class="fw-confirm-list">
      <li>${uniqueTasks} compliance tasks</li>
      <li>${evidenceItems} deduplicated evidence requirements</li>
      ${unlocks.map(u => `<li>${u}</li>`).join("")}
    </ul>
    <p class="fw-confirm-note">You can change this later from the framework settings, but existing evidence and task records will be preserved.</p>
    <div class="fw-confirm-actions">
      <button type="button" class="action-button" id="fw-confirm-yes">Confirm and activate</button>
      <button type="button" class="action-button ghost" id="fw-confirm-no">Go back and change</button>
    </div>
  `;

  modal.querySelector("#fw-confirm-yes").addEventListener("click", () => {
    overlay.remove();
    onConfirm();
  });

  modal.querySelector("#fw-confirm-no").addEventListener("click", () => {
    overlay.remove();
    if (onCancel) onCancel();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (onCancel) onCancel();
    }
  });

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function showFwChangeWarning(onConfirm, onCancel) {
  const overlay = document.createElement("div");
  overlay.className = "fw-confirm-overlay";
  overlay.id = "fw-change-overlay";

  const modal = document.createElement("div");
  modal.className = "fw-confirm-modal";

  modal.innerHTML = `
    <div class="fw-confirm-head">
      <p class="section-label">Framework change</p>
      <h3>Warning: Changing your framework selection</h3>
    </div>
    <ul class="fw-confirm-list fw-warn-list">
      <li>Tasks outside the new scope will be hidden (not deleted)</li>
      <li>Existing evidence and task records will be preserved</li>
      <li>Your audit pack will be regenerated for the new scope</li>
      <li>AI generators will use the new framework context</li>
    </ul>
    <div class="fw-confirm-actions">
      <button type="button" class="action-button" id="fw-change-yes">Confirm change</button>
      <button type="button" class="action-button ghost" id="fw-change-no">Cancel</button>
    </div>
  `;

  modal.querySelector("#fw-change-yes").addEventListener("click", () => {
    overlay.remove();
    onConfirm();
  });

  modal.querySelector("#fw-change-no").addEventListener("click", () => {
    overlay.remove();
    if (onCancel) onCancel();
  });

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// ============================================================
// Save Intercept
// ============================================================

function fwInterceptOnboardingSave(clientId, payload, doSave) {
  const fwNames = parseFwSelection(payload.framework_selection_v2 || payload.framework_selection);

  if (fwNames.length === 0) {
    doSave();
    return;
  }

  const alreadyConfirmed = isFwConfirmed(clientId, fwNames);

  if (alreadyConfirmed) {
    // Check if it's a change from previously confirmed selection
    try {
      const stored = JSON.parse(localStorage.getItem(getFwLsKey(clientId)) || "null");
      const storedSorted = [...(stored?.selected || [])].sort().join(",");
      const currentSorted = [...fwNames].sort().join(",");
      if (storedSorted !== currentSorted && stored?.confirmed_at) {
        showFwChangeWarning(
          () => { persistFwConfirmation(clientId, fwNames); doSave(); },
          () => setStatus("Framework change cancelled.", "default")
        );
        return;
      }
    } catch (e) { /* ignore */ }
    doSave();
    return;
  }

  showFwConfirmModal(fwNames, () => {
    persistFwConfirmation(clientId, fwNames);
    doSave();
  });
}

// ============================================================
// Topbar Badge
// ============================================================

function updateTopbarBadge(clientData) {
  const slot = document.getElementById("topbar-framework-badge");
  if (!slot) return;

  if (!clientData) {
    slot.innerHTML = "";
    slot.className = "hidden";
    return;
  }

  const onboarding = clientData.onboarding || {};
  const fwNames = parseFwSelection(onboarding.framework_selection_v2 || onboarding.framework_selection);

  if (fwNames.length === 0) {
    slot.innerHTML = "";
    slot.className = "hidden";
    return;
  }

  buildActiveContext(clientData);

  const evData = clientData.evidenceTracker || {};
  const evItems = Array.isArray(evData.evidence_items) ? evData.evidence_items : [];
  const ctx = getActiveContext();

  const evLabel = evItems.length > 0 ? `${evItems.length} evidence item${evItems.length !== 1 ? "s" : ""}` : null;
  const tscLabel = getTscScopeDisplay(onboarding);

  slot.className = "fw-topbar-badge";
  slot.innerHTML = `
    <button type="button" class="fw-topbar-btn" id="fw-topbar-trigger" title="Click to review framework settings">
      <span class="fw-topbar-fw">${fwNames.map(n => FRAMEWORK_CONFIG[n]?.short || n).join(", ")}</span>
      ${tscLabel ? `<span class="fw-topbar-pill fw-topbar-pill-tsc" title="SOC 2 Trust Services Categories in scope">${tscLabel}</span>` : ""}
      <span class="fw-topbar-pill">${ctx.task_scope_count} tasks</span>
      ${evLabel ? `<span class="fw-topbar-pill fw-topbar-pill-ev">${evLabel}</span>` : ""}
    </button>
  `;

  slot.querySelector("#fw-topbar-trigger").addEventListener("click", () => {
    state.activePhaseKey = "onboarding";
    renderTabs();
    renderActivePhase();
  });
}

// ============================================================
// Setup Checklist (shown once after first confirmation)
// ============================================================

function renderFwSetupChecklist(clientData) {
  const onboarding = clientData?.onboarding || {};
  const fwNames = parseFwSelection(onboarding.framework_selection_v2 || onboarding.framework_selection);
  const clientId = state.selectedClientId;

  if (!clientId || fwNames.length === 0) return null;
  if (isChecklistDismissed(clientId)) return null;

  const hasSoc2 = fwNames.some(n => n.startsWith("SOC 2"));
  const hasIso = fwNames.includes("ISO 27001");
  const hasHipaa = fwNames.includes("HIPAA");
  const hasGdpr = fwNames.includes("GDPR");
  const hasPci = fwNames.includes("PCI DSS");

  const wrap = document.createElement("div");
  wrap.className = "fw-checklist-wrap";

  const head = document.createElement("div");
  head.className = "fw-checklist-head";
  head.innerHTML = `
    <div>
      <p class="section-label">One-time setup</p>
      <h4 class="fw-checklist-title">Framework Setup Checklist — ${fwNames.map(n => FRAMEWORK_CONFIG[n]?.label || n).join(" + ")}</h4>
    </div>
  `;
  const dismissBtn = document.createElement("button");
  dismissBtn.type = "button";
  dismissBtn.className = "action-button ghost";
  dismissBtn.textContent = "Dismiss";
  dismissBtn.addEventListener("click", () => {
    dismissChecklist(clientId);
    wrap.remove();
  });
  head.appendChild(dismissBtn);
  wrap.appendChild(head);

  const body = document.createElement("div");
  body.className = "fw-checklist-body";

  if (hasSoc2) {
    const section = buildChecklistSection(`SOC 2 ${fwNames.find(n => n.startsWith("SOC 2")) || "Type II"} Setup`, [
      "Define your audit period start date",
      "Identify your service auditor (or confirm you are preparing for one)",
      "Confirm your system description scope — what products and services are in scope",
      "List your subservice organisations (vendors that process data on your behalf)",
      "Confirm your Trust Services Categories — Security is mandatory; add Availability, Confidentiality, Processing Integrity, Privacy if applicable"
    ]);
    body.appendChild(section);
  }

  if (hasIso) {
    const section = buildChecklistSection("ISO 27001:2022 Setup", [
      "Define your ISMS scope — systems, locations, and processes in scope",
      "Identify your certification body (or confirm timeline)",
      "Set your Stage 1 audit target date",
      "Confirm internal audit owner and schedule",
      "Schedule first management review meeting"
    ]);
    body.appendChild(section);
  }

  if (hasHipaa) {
    const section = buildChecklistSection("HIPAA Setup", [
      "Identify all systems that store, process, or transmit PHI",
      "Confirm your Business Associate Agreements (BAAs) are in place with all relevant vendors",
      "Confirm you have a designated Privacy Officer",
      "Identify your Security Officer responsible for HIPAA compliance"
    ]);
    body.appendChild(section);
  }

  if (hasGdpr) {
    const section = buildChecklistSection("GDPR Setup", [
      "Confirm your lawful basis for each category of personal data processing",
      "Identify your Data Protection Officer (required for some organisations)",
      "List all vendors that process EU personal data — DPAs required for each",
      "Confirm your data subject rights process (access, erasure, portability)"
    ]);
    body.appendChild(section);
  }

  if (hasPci) {
    const section = buildChecklistSection("PCI DSS v4.0 Setup", [
      "Define your Cardholder Data Environment (CDE) scope",
      "Determine your applicable SAQ type (A, B, C, D)",
      "Confirm your Qualified Security Assessor (QSA) if applicable",
      "Identify all systems that store, process, or transmit cardholder data"
    ]);
    body.appendChild(section);
  }

  if (hasSoc2 && hasIso) {
    const section = buildChecklistSection("Combined Setup — SOC 2 + ISO 27001", [
      "Complete both checklists above",
      "Review the 12 overlap opportunities — these save the most time",
      "Confirm which controls are handled by your cloud provider under shared responsibility",
      "Upload shared evidence once — the system will link it to both framework requirements"
    ], true);
    body.appendChild(section);
  }

  wrap.appendChild(body);
  return wrap;
}

function buildChecklistSection(title, items, highlight = false) {
  const section = document.createElement("div");
  section.className = `fw-checklist-section${highlight ? " fw-checklist-highlight" : ""}`;

  const sectionTitle = document.createElement("h5");
  sectionTitle.className = "fw-checklist-section-title";
  sectionTitle.textContent = title;
  section.appendChild(sectionTitle);

  items.forEach(item => {
    const row = document.createElement("label");
    row.className = "fw-checklist-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "fw-checklist-checkbox";
    checkbox.addEventListener("change", () => {
      row.classList.toggle("fw-checklist-done", checkbox.checked);
    });

    const text = document.createElement("span");
    text.textContent = item;

    row.appendChild(checkbox);
    row.appendChild(text);
    section.appendChild(row);
  });

  return section;
}

// ============================================================
// Onboarding Overview — Framework Display Update
// ============================================================

function getFwDisplayForOverview(sectionData) {
  const fwNames = parseFwSelection(sectionData.framework_selection_v2 || sectionData.framework_selection);
  if (fwNames.length === 0) return sectionData.framework_selection || "Not selected";
  return fwNames.map(n => FRAMEWORK_CONFIG[n]?.label || n).join(", ");
}

function getTscScopeDisplay(sectionData) {
  const hasSoc2 = parseFwSelection(sectionData.framework_selection_v2 || sectionData.framework_selection)
    .some(n => n.startsWith("SOC 2"));
  if (!hasSoc2) return null;
  try {
    const raw = sectionData.soc2_tsc_scope;
    let scope = [];
    if (Array.isArray(raw)) scope = raw;
    else if (typeof raw === "string" && raw.startsWith("[")) scope = JSON.parse(raw);
    else if (typeof raw === "string" && raw.trim()) scope = raw.split(",").map(s => s.trim()).filter(Boolean);
    if (scope.length === 0) scope = ["Security"];
    return scope.join(", ");
  } catch (e) {
    return "Security";
  }
}
