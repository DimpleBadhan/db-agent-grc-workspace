// ── Risk Manager & Vendor Manager (List + Detail) ─────────────────────────
// Vanta/Drata-style list + detail experience for risk-assessment and vendor-risk phases.

// ── Detail-view matrix ────────────────────────────────────────────────────
// Self-contained 5×5 matrix for use inside risk/vendor detail panels.
// getScoreBand / parseScore are defined in client-app.js (loaded after this file)
// but are only called at interaction time, so the reference resolves correctly.

function rmRenderDetailMatrix(label, likelihoodValue, impactValue) {
  const activeLikelihood = parseInt(likelihoodValue, 10);
  const activeImpact     = parseInt(impactValue, 10);
  const hasActive = Number.isInteger(activeLikelihood) && Number.isInteger(activeImpact);

  const wrap = document.createElement("div");
  wrap.className = "rmm-wrap";

  // Title
  const title = document.createElement("p");
  title.className = "rmm-title";
  title.textContent = label;
  wrap.appendChild(title);

  const inner = document.createElement("div");
  inner.className = "rmm-inner";
  wrap.appendChild(inner);

  // Y-axis numbers (5 → 1)
  const yNums = document.createElement("div");
  yNums.className = "rmm-y-nums";
  for (let i = 5; i >= 1; i--) {
    const n = document.createElement("span");
    n.textContent = i;
    yNums.appendChild(n);
  }
  inner.appendChild(yNums);

  const col = document.createElement("div");
  col.className = "rmm-col";
  inner.appendChild(col);

  // Grid
  const grid = document.createElement("div");
  grid.className = "rmm-grid";
  for (let impact = 5; impact >= 1; impact--) {
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      const score = impact * likelihood;
      const band  = getScoreBand(score);
      const isActive = hasActive && likelihood === activeLikelihood && impact === activeImpact;
      const cell = document.createElement("div");
      cell.className = `rmm-cell rmm-${band.label.toLowerCase()}${isActive ? " rmm-active" : ""}`;
      cell.title = `L${likelihood} × I${impact} = ${score} (${band.label})`;
      if (isActive) {
        const dot = document.createElement("span");
        dot.className = "rmm-dot";
        cell.appendChild(dot);
      }
      grid.appendChild(cell);
    }
  }
  col.appendChild(grid);

  // X-axis numbers
  const xNums = document.createElement("div");
  xNums.className = "rmm-x-nums";
  for (let i = 1; i <= 5; i++) {
    const n = document.createElement("span");
    n.textContent = i;
    xNums.appendChild(n);
  }
  col.appendChild(xNums);

  // Axis labels
  const xLabel = document.createElement("p");
  xLabel.className = "rmm-x-label";
  xLabel.textContent = "LIKELIHOOD";
  col.appendChild(xLabel);

  return wrap;
}

// ── Severity helpers ──────────────────────────────────────────────────────

function rmScoreSeverity(score) {
  const s = parseInt(score, 10);
  if (!Number.isInteger(s) || s < 1) return "unscored";
  if (s >= 16) return "critical";
  if (s >= 10) return "high";
  if (s >= 5)  return "medium";
  return "low";
}

function rmSeverityLabel(sev) {
  if (sev === "critical") return "Critical";
  if (sev === "high")     return "High";
  if (sev === "medium")   return "Medium";
  if (sev === "low")      return "Low";
  return "Unscored";
}

// ── Risk Manager ──────────────────────────────────────────────────────────

function renderRiskManager(sectionData) {
  const risks = (sectionData.risks || []).filter(r => r && (r.risk_id || r.threat));
  const container = document.createElement("div");
  container.className = "rm-shell";
  if (state.selectedRiskIndex >= 0 && state.selectedRiskIndex < risks.length) {
    container.appendChild(renderRiskDetail(risks, state.selectedRiskIndex));
  } else {
    state.selectedRiskIndex = -1;
    container.appendChild(renderRiskListView(risks));
  }
  return container;
}

function renderRiskListView(risks) {
  const shell = document.createElement("div");
  shell.className = "rm-list-shell";

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "rm-toolbar";

  const searchWrap = document.createElement("div");
  searchWrap.className = "rm-search-wrap";
  searchWrap.innerHTML = `<svg class="rm-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "rm-search-input";
  searchInput.placeholder = `Search ${risks.length} risk${risks.length !== 1 ? "s" : ""}...`;
  searchInput.value = state.riskSearch || "";
  searchInput.autocomplete = "new-password";
  searchInput.addEventListener("input", e => { state.riskSearch = e.target.value; rebuildRiskList(); });
  searchWrap.appendChild(searchInput);
  toolbar.appendChild(searchWrap);

  const filterRow = document.createElement("div");
  filterRow.className = "rm-filter-row";
  [
    { key: "all",      label: "All" },
    { key: "critical", label: "Critical" },
    { key: "high",     label: "High" },
    { key: "medium",   label: "Medium" },
    { key: "low",      label: "Low" },
    { key: "unscored", label: "Unscored" }
  ].forEach(f => {
    const cnt = f.key === "all"
      ? risks.length
      : risks.filter(r => rmScoreSeverity(r.inherent_score) === f.key).length;
    if (f.key !== "all" && cnt === 0) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rm-filter-chip" + ((state.riskFilter || "all") === f.key ? " rm-filter-active" : "");
    btn.innerHTML = `${f.label}<span class="rm-filter-cnt">${cnt}</span>`;
    btn.addEventListener("click", () => {
      state.riskFilter = f.key;
      filterRow.querySelectorAll(".rm-filter-chip").forEach(c => c.classList.remove("rm-filter-active"));
      btn.classList.add("rm-filter-active");
      rebuildRiskList();
    });
    filterRow.appendChild(btn);
  });
  toolbar.appendChild(filterRow);
  shell.appendChild(toolbar);

  const listEl = document.createElement("div");
  listEl.className = "rm-risk-list";
  shell.appendChild(listEl);

  function rebuildRiskList() {
    const search = (state.riskSearch || "").toLowerCase();
    const filter = state.riskFilter || "all";
    listEl.innerHTML = "";

    const sorted = [...risks].sort(
      (a, b) => (parseInt(b.inherent_score, 10) || 0) - (parseInt(a.inherent_score, 10) || 0)
    );

    const visible = sorted.filter(r => {
      const matchSearch = !search ||
        (r.risk_id        || "").toLowerCase().includes(search) ||
        (r.category       || "").toLowerCase().includes(search) ||
        (r.threat         || "").toLowerCase().includes(search) ||
        (r.threat_source  || "").toLowerCase().includes(search) ||
        (r.treatment_action || "").toLowerCase().includes(search);
      const matchFilter = filter === "all" || rmScoreSeverity(r.inherent_score) === filter;
      return matchSearch && matchFilter;
    });

    if (!visible.length) {
      listEl.innerHTML = `<div class="rm-empty">No risks match your filter.</div>`;
      return;
    }

    visible.forEach(risk => {
      const idx = risks.indexOf(risk);
      const sev = rmScoreSeverity(risk.inherent_score);
      const resSev = rmScoreSeverity(risk.residual_score);
      const row = document.createElement("div");
      row.className = "rm-risk-row";
      row.innerHTML = `
        <div class="rm-row-left">
          <span class="rm-sev-badge rm-sev-${sev}">${rmSeverityLabel(sev)}</span>
          <div class="rm-row-meta">
            <div class="rm-row-header">
              <span class="rm-risk-id">${risk.risk_id || `RSK-${String(idx + 1).padStart(3, "0")}`}</span>
              ${risk.category ? `<span class="rm-risk-category">${risk.category}</span>` : ""}
            </div>
            <span class="rm-risk-threat">${risk.threat || "Unnamed risk"}</span>
            ${risk.treatment_action ? `<span class="rm-risk-action">${risk.treatment_action}</span>` : ""}
          </div>
        </div>
        <div class="rm-row-right">
          <div class="rm-score-pair">
            <span class="rm-score-label">Inherent</span>
            <span class="rm-score-val rm-score-${sev}">${risk.inherent_score || "—"}</span>
          </div>
          <div class="rm-score-pair">
            <span class="rm-score-label">Residual</span>
            <span class="rm-score-val rm-score-${resSev}">${risk.residual_score || "—"}</span>
          </div>
          <span class="rm-row-arrow">›</span>
        </div>`;
      row.addEventListener("click", () => {
        state.selectedRiskIndex = idx;
        state.riskDetailTab = "overview";
        renderActivePhase();
      });
      listEl.appendChild(row);
    });
  }

  rebuildRiskList();
  return shell;
}

function renderRiskDetail(risks, index) {
  const risk = risks[index];
  const shell = document.createElement("div");
  shell.className = "rm-detail-shell";

  const sev = rmScoreSeverity(risk.inherent_score);

  // Back bar
  const backBar = document.createElement("div");
  backBar.className = "rm-back-bar";
  backBar.innerHTML = `
    <button type="button" class="rm-back-btn">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All risks
    </button>
    <div class="rm-detail-breadcrumb">
      <span class="rm-risk-id">${risk.risk_id || `RSK-${String(index + 1).padStart(3, "0")}`}</span>
      <span class="rm-detail-name">${risk.threat || "Unnamed risk"}</span>
      <span class="rm-sev-badge rm-sev-${sev}">${rmSeverityLabel(sev)}</span>
    </div>
    <div class="rm-detail-nav">
      ${index > 0 ? `<button type="button" class="rm-nav-btn" id="rm-prev">‹ Prev</button>` : ""}
      <span class="rm-nav-counter">${index + 1} / ${risks.length}</span>
      ${index < risks.length - 1 ? `<button type="button" class="rm-nav-btn" id="rm-next">Next ›</button>` : ""}
    </div>`;
  backBar.querySelector(".rm-back-btn").addEventListener("click", () => { state.selectedRiskIndex = -1; renderActivePhase(); });
  if (backBar.querySelector("#rm-prev")) backBar.querySelector("#rm-prev").addEventListener("click", () => { state.selectedRiskIndex = index - 1; state.riskDetailTab = "overview"; renderActivePhase(); });
  if (backBar.querySelector("#rm-next")) backBar.querySelector("#rm-next").addEventListener("click", () => { state.selectedRiskIndex = index + 1; state.riskDetailTab = "overview"; renderActivePhase(); });
  shell.appendChild(backBar);

  // Tabs
  const TABS = [
    { key: "overview",   label: "Overview" },
    { key: "treatment",  label: "Treatment Plan" },
    { key: "controls",   label: "Controls & Policies" }
  ];
  const tabBar = document.createElement("div");
  tabBar.className = "rm-detail-tabs";
  TABS.forEach(t => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rm-detail-tab" + ((state.riskDetailTab || "overview") === t.key ? " rm-detail-tab-active" : "");
    btn.textContent = t.label;
    btn.addEventListener("click", () => {
      state.riskDetailTab = t.key;
      tabBar.querySelectorAll(".rm-detail-tab").forEach(b => b.classList.remove("rm-detail-tab-active"));
      btn.classList.add("rm-detail-tab-active");
      drawRiskTab();
    });
    tabBar.appendChild(btn);
  });
  shell.appendChild(tabBar);

  const contentArea = document.createElement("div");
  contentArea.className = "rm-detail-content";
  shell.appendChild(contentArea);

  const local = Object.assign({}, risk);

  function rmField(lbl, name, type, opts = {}) {
    const wrap = document.createElement("div");
    wrap.className = "rm-field" + (opts.full ? " rm-field-full" : "");
    const label = document.createElement("label");
    label.className = "rm-field-label";
    label.textContent = lbl;
    wrap.appendChild(label);
    let el;
    if (type === "textarea") {
      el = document.createElement("textarea");
      el.className = "rm-field-textarea";
      el.rows = opts.rows || 5;
      el.value = local[name] || "";
      if (opts.readonly) { el.readOnly = true; el.style.opacity = "0.65"; }
    } else if (type === "select") {
      el = document.createElement("select");
      el.className = "rm-field-select";
      (opts.options || []).forEach(o => {
        const opt = document.createElement("option");
        opt.value = o;
        opt.textContent = o || "— Select —";
        opt.selected = opt.value === (local[name] || "");
        el.appendChild(opt);
      });
    } else {
      el = document.createElement("input");
      el.type = "text";
      el.className = "rm-field-input";
      el.value = local[name] || "";
      if (opts.readonly) { el.readOnly = true; el.style.opacity = "0.65"; }
    }
    if (!opts.readonly) {
      el.addEventListener("input",  () => { local[name] = el.value; });
      el.addEventListener("change", () => { local[name] = el.value; });
    }
    wrap.appendChild(el);
    return wrap;
  }

  function rmGroup(title, fields) {
    const g = document.createElement("div");
    g.className = "rm-field-group";
    if (title) {
      const h = document.createElement("p");
      h.className = "rm-field-group-title";
      h.textContent = title;
      g.appendChild(h);
    }
    const grid = document.createElement("div");
    grid.className = "rm-field-grid";
    fields.forEach(f => grid.appendChild(rmField(f.label, f.name, f.type || "text", f)));
    g.appendChild(grid);
    return g;
  }

  async function saveRisk() {
    const all = Array.isArray(state.selectedClientData.riskAssessment?.risks)
      ? [...state.selectedClientData.riskAssessment.risks]
      : [];
    all[index] = Object.assign({}, all[index], local);
    const payload = Object.assign({}, state.selectedClientData.riskAssessment, { risks: all });
    state.selectedClientData.riskAssessment = await api(
      `/api/clients/${encodeURIComponent(state.selectedClientId)}/risk-assessment`,
      { method: "PUT", body: JSON.stringify(payload) }
    );
  }

  function drawRiskTab() {
    contentArea.innerHTML = "";
    const tab = state.riskDetailTab || "overview";

    if (tab === "overview") {
      contentArea.appendChild(rmGroup("Risk identification", [
        { name: "risk_id",          label: "Risk ID",              readonly: true },
        { name: "category",         label: "Category" },
        { name: "asset",            label: "Asset" },
        { name: "threat",           label: "Threat" },
        { name: "threat_source",    label: "Threat source" },
        { name: "vulnerability",    label: "Vulnerability" },
        { name: "why_this_company", label: "Why this risk applies", type: "textarea", full: true, rows: 3 }
      ]));

      const scoreGroup = document.createElement("div");
      scoreGroup.className = "rm-field-group";
      const scoreTitle = document.createElement("p");
      scoreTitle.className = "rm-field-group-title";
      scoreTitle.textContent = "Risk scoring";
      scoreGroup.appendChild(scoreTitle);

      const scoreLayout = document.createElement("div");
      scoreLayout.className = "rm-score-layout";

      const fieldsCol = document.createElement("div");
      fieldsCol.className = "rm-field-grid";
      [
        { name: "likelihood",         label: "Likelihood",         type: "select", options: ["", "1", "2", "3", "4", "5"] },
        { name: "impact",             label: "Impact",             type: "select", options: ["", "1", "2", "3", "4", "5"] },
        { name: "inherent_score",     label: "Inherent score",     readonly: true },
        { name: "inherent_rating",    label: "Inherent rating",    readonly: true },
        { name: "residual_likelihood",label: "Residual likelihood",type: "select", options: ["", "1", "2", "3", "4", "5"] },
        { name: "residual_impact",    label: "Residual impact",    type: "select", options: ["", "1", "2", "3", "4", "5"] },
        { name: "residual_score",     label: "Residual score",     readonly: true },
        { name: "residual_rating",    label: "Residual rating",    readonly: true }
      ].forEach(f => fieldsCol.appendChild(rmField(f.label, f.name, f.type || "text", f)));
      scoreLayout.appendChild(fieldsCol);

      const matrices = document.createElement("div");
      matrices.className = "rm-matrices";
      matrices.appendChild(rmRenderDetailMatrix("Inherent", local.likelihood, local.impact));
      matrices.appendChild(rmRenderDetailMatrix("Residual", local.residual_likelihood, local.residual_impact));
      scoreLayout.appendChild(matrices);
      scoreGroup.appendChild(scoreLayout);
      contentArea.appendChild(scoreGroup);

      contentArea.appendChild(rmGroup("Context", [
        { name: "existing_controls",   label: "Existing controls",   type: "textarea", full: true, rows: 3 },
        { name: "control_gaps",        label: "Control gaps",        type: "textarea", full: true, rows: 3 },
        { name: "impact_description",  label: "Impact description",  type: "textarea", full: true, rows: 3 }
      ]));

    } else if (tab === "treatment") {
      contentArea.appendChild(rmGroup("Treatment plan", [
        { name: "treatment_plan",  label: "Treatment plan",   type: "textarea", full: true, rows: 14 },
        { name: "treatment_action",label: "Treatment action" },
        { name: "treatment_owner", label: "Treatment owner" },
        { name: "treatment_due",   label: "Target due date" },
        { name: "review_date",     label: "Review date" }
      ]));
      contentArea.appendChild(rmGroup("Justification", [
        { name: "likelihood_justification", label: "Likelihood justification", type: "textarea", full: true, rows: 3 },
        { name: "impact_justification",     label: "Impact justification",     type: "textarea", full: true, rows: 3 }
      ]));

    } else if (tab === "controls") {
      contentArea.appendChild(rmGroup("Linked controls & policies", [
        { name: "linked_policies", label: "Linked policies", full: true },
        { name: "linked_controls", label: "Linked controls", full: true }
      ]));
    }

    const saveBar = document.createElement("div");
    saveBar.className = "rm-save-bar";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "action-button";
    saveBtn.textContent = "Save Changes";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      try {
        await saveRisk();
        setStatus("Risk saved.", "success");
      } catch (e) {
        setStatus("Save failed: " + e.message, "error");
      }
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    });
    saveBar.appendChild(saveBtn);
    contentArea.appendChild(saveBar);
  }

  drawRiskTab();
  return shell;
}

// ── Vendor Manager ────────────────────────────────────────────────────────

function renderVendorManager(sectionData) {
  const vendors = (sectionData.vendors || []).filter(v => v && (v.vendor_id || v.vendor_name));
  const container = document.createElement("div");
  container.className = "vm-shell";
  if (state.selectedVendorIndex >= 0 && state.selectedVendorIndex < vendors.length) {
    container.appendChild(renderVendorDetail(vendors, state.selectedVendorIndex));
  } else {
    state.selectedVendorIndex = -1;
    container.appendChild(renderVendorListView(vendors));
  }
  return container;
}

function renderVendorListView(vendors) {
  const shell = document.createElement("div");
  shell.className = "vm-list-shell";

  const toolbar = document.createElement("div");
  toolbar.className = "vm-toolbar";

  const searchWrap = document.createElement("div");
  searchWrap.className = "vm-search-wrap";
  searchWrap.innerHTML = `<svg class="vm-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "vm-search-input";
  searchInput.placeholder = `Search ${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}...`;
  searchInput.value = state.vendorSearch || "";
  searchInput.autocomplete = "new-password";
  searchInput.addEventListener("input", e => { state.vendorSearch = e.target.value; rebuildVendorList(); });
  searchWrap.appendChild(searchInput);
  toolbar.appendChild(searchWrap);

  const filterRow = document.createElement("div");
  filterRow.className = "vm-filter-row";
  ["all", "critical", "high", "medium", "low"].forEach(key => {
    const label = key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1);
    const cnt = key === "all"
      ? vendors.length
      : vendors.filter(v => (v.criticality || "").toLowerCase() === key).length;
    if (key !== "all" && cnt === 0) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vm-filter-chip" + ((state.vendorFilter || "all") === key ? " vm-filter-active" : "");
    btn.innerHTML = `${label}<span class="vm-filter-cnt">${cnt}</span>`;
    btn.addEventListener("click", () => {
      state.vendorFilter = key;
      filterRow.querySelectorAll(".vm-filter-chip").forEach(c => c.classList.remove("vm-filter-active"));
      btn.classList.add("vm-filter-active");
      rebuildVendorList();
    });
    filterRow.appendChild(btn);
  });
  toolbar.appendChild(filterRow);
  shell.appendChild(toolbar);

  const listEl = document.createElement("div");
  listEl.className = "vm-vendor-list";
  shell.appendChild(listEl);

  function rebuildVendorList() {
    const search = (state.vendorSearch || "").toLowerCase();
    const filter = state.vendorFilter || "all";
    listEl.innerHTML = "";

    const sorted = [...vendors].sort(
      (a, b) => (parseInt(b.inherent_score, 10) || 0) - (parseInt(a.inherent_score, 10) || 0)
    );

    const visible = sorted.filter(v => {
      const matchSearch = !search ||
        (v.vendor_name     || "").toLowerCase().includes(search) ||
        (v.service_category || "").toLowerCase().includes(search) ||
        (v.purpose         || "").toLowerCase().includes(search) ||
        (v.vendor_id       || "").toLowerCase().includes(search);
      const matchFilter = filter === "all" || (v.criticality || "").toLowerCase() === filter;
      return matchSearch && matchFilter;
    });

    if (!visible.length) {
      listEl.innerHTML = `<div class="vm-empty">No vendors match your filter.</div>`;
      return;
    }

    visible.forEach(vendor => {
      const idx = vendors.indexOf(vendor);
      const crit = (vendor.criticality || "").toLowerCase();
      const critKey = ["critical", "high", "medium", "low"].includes(crit) ? crit : "unscored";
      const iSev = rmScoreSeverity(vendor.inherent_score);
      const rSev = rmScoreSeverity(vendor.residual_score);
      const row = document.createElement("div");
      row.className = "vm-vendor-row";
      row.innerHTML = `
        <div class="vm-row-left">
          <span class="vm-crit-badge vm-crit-${critKey}">${vendor.criticality || "Unknown"}</span>
          <div class="vm-row-meta">
            <div class="vm-row-header">
              <span class="vm-vendor-name">${vendor.vendor_name || "Unnamed vendor"}</span>
              ${vendor.vendor_id ? `<span class="vm-vendor-id">${vendor.vendor_id}</span>` : ""}
            </div>
            <span class="vm-vendor-cat">${vendor.service_category || vendor.purpose || ""}</span>
            ${vendor.certifications ? `<span class="vm-vendor-certs">${vendor.certifications}</span>` : ""}
          </div>
        </div>
        <div class="vm-row-right">
          <div class="vm-score-pair">
            <span class="vm-score-label">Inherent</span>
            <span class="vm-score-val vm-score-${iSev}">${vendor.inherent_score || "—"}</span>
          </div>
          <div class="vm-score-pair">
            <span class="vm-score-label">Residual</span>
            <span class="vm-score-val vm-score-${rSev}">${vendor.residual_score || "—"}</span>
          </div>
          <span class="vm-row-arrow">›</span>
        </div>`;
      row.addEventListener("click", () => {
        state.selectedVendorIndex = idx;
        state.vendorDetailTab = "overview";
        renderActivePhase();
      });
      listEl.appendChild(row);
    });
  }

  rebuildVendorList();
  return shell;
}

function renderVendorDetail(vendors, index) {
  const vendor = vendors[index];
  const shell = document.createElement("div");
  shell.className = "vm-detail-shell";

  const crit = (vendor.criticality || "").toLowerCase();
  const critKey = ["critical", "high", "medium", "low"].includes(crit) ? crit : "unscored";

  const backBar = document.createElement("div");
  backBar.className = "vm-back-bar";
  backBar.innerHTML = `
    <button type="button" class="vm-back-btn">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All vendors
    </button>
    <div class="vm-detail-breadcrumb">
      <span class="vm-detail-name">${vendor.vendor_name || "Unnamed vendor"}</span>
      <span class="vm-crit-badge vm-crit-${critKey}">${vendor.criticality || "Unknown"}</span>
    </div>
    <div class="vm-detail-nav">
      ${index > 0 ? `<button type="button" class="vm-nav-btn" id="vm-prev">‹ Prev</button>` : ""}
      <span class="vm-nav-counter">${index + 1} / ${vendors.length}</span>
      ${index < vendors.length - 1 ? `<button type="button" class="vm-nav-btn" id="vm-next">Next ›</button>` : ""}
    </div>`;
  backBar.querySelector(".vm-back-btn").addEventListener("click", () => { state.selectedVendorIndex = -1; renderActivePhase(); });
  if (backBar.querySelector("#vm-prev")) backBar.querySelector("#vm-prev").addEventListener("click", () => { state.selectedVendorIndex = index - 1; state.vendorDetailTab = "overview"; renderActivePhase(); });
  if (backBar.querySelector("#vm-next")) backBar.querySelector("#vm-next").addEventListener("click", () => { state.selectedVendorIndex = index + 1; state.vendorDetailTab = "overview"; renderActivePhase(); });
  shell.appendChild(backBar);

  const TABS = [
    { key: "overview",   label: "Overview" },
    { key: "risk",       label: "Risk Assessment" },
    { key: "treatment",  label: "Treatment Plan" },
    { key: "linked",     label: "Linked Risks" }
  ];
  const tabBar = document.createElement("div");
  tabBar.className = "vm-detail-tabs";
  TABS.forEach(t => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vm-detail-tab" + ((state.vendorDetailTab || "overview") === t.key ? " vm-detail-tab-active" : "");
    btn.textContent = t.label;
    btn.addEventListener("click", () => {
      state.vendorDetailTab = t.key;
      tabBar.querySelectorAll(".vm-detail-tab").forEach(b => b.classList.remove("vm-detail-tab-active"));
      btn.classList.add("vm-detail-tab-active");
      drawVendorTab();
    });
    tabBar.appendChild(btn);
  });
  shell.appendChild(tabBar);

  const contentArea = document.createElement("div");
  contentArea.className = "vm-detail-content";
  shell.appendChild(contentArea);

  const local = Object.assign({}, vendor);

  function vmField(lbl, name, type, opts = {}) {
    const wrap = document.createElement("div");
    wrap.className = "vm-field" + (opts.full ? " vm-field-full" : "");
    const label = document.createElement("label");
    label.className = "vm-field-label";
    label.textContent = lbl;
    wrap.appendChild(label);
    let el;
    if (type === "textarea") {
      el = document.createElement("textarea");
      el.className = "vm-field-textarea";
      el.rows = opts.rows || 4;
      el.value = local[name] || "";
      if (opts.readonly) { el.readOnly = true; el.style.opacity = "0.65"; }
    } else if (type === "select") {
      el = document.createElement("select");
      el.className = "vm-field-select";
      (opts.options || []).forEach(o => {
        const opt = document.createElement("option");
        opt.value = o;
        opt.textContent = o || "— Select —";
        opt.selected = opt.value === (local[name] || "");
        el.appendChild(opt);
      });
    } else {
      el = document.createElement("input");
      el.type = "text";
      el.className = "vm-field-input";
      el.value = local[name] || "";
      if (opts.readonly) { el.readOnly = true; el.style.opacity = "0.65"; }
    }
    if (!opts.readonly) {
      el.addEventListener("input",  () => { local[name] = el.value; });
      el.addEventListener("change", () => { local[name] = el.value; });
    }
    wrap.appendChild(el);
    return wrap;
  }

  function vmGroup(title, fields) {
    const g = document.createElement("div");
    g.className = "vm-field-group";
    if (title) {
      const h = document.createElement("p");
      h.className = "vm-field-group-title";
      h.textContent = title;
      g.appendChild(h);
    }
    const grid = document.createElement("div");
    grid.className = "vm-field-grid";
    fields.forEach(f => grid.appendChild(vmField(f.label, f.name, f.type || "text", f)));
    g.appendChild(grid);
    return g;
  }

  async function saveVendor() {
    const all = Array.isArray(state.selectedClientData.vendorRisk?.vendors)
      ? [...state.selectedClientData.vendorRisk.vendors]
      : [];
    all[index] = Object.assign({}, all[index], local);
    const payload = Object.assign({}, state.selectedClientData.vendorRisk, { vendors: all });
    state.selectedClientData.vendorRisk = await api(
      `/api/clients/${encodeURIComponent(state.selectedClientId)}/vendor-risk`,
      { method: "PUT", body: JSON.stringify(payload) }
    );
  }

  function drawVendorTab() {
    contentArea.innerHTML = "";
    const tab = state.vendorDetailTab || "overview";

    if (tab === "overview") {
      contentArea.appendChild(vmGroup("Vendor profile", [
        { name: "vendor_id",          label: "Vendor ID",                  readonly: true },
        { name: "vendor_name",        label: "Vendor name" },
        { name: "website",            label: "Website" },
        { name: "location",           label: "Location" },
        { name: "service_category",   label: "Service category" },
        { name: "business_function",  label: "Business function" },
        { name: "criticality",        label: "Criticality", type: "select", options: ["", "Low", "Medium", "High", "Critical"] },
        { name: "certifications",     label: "Certifications" },
        { name: "vendor_description", label: "Description",                type: "textarea", full: true, rows: 4 },
        { name: "purpose",            label: "Purpose for this client",    full: true },
        { name: "access_level",       label: "Access level" },
        { name: "data_accessed",      label: "Data accessed",              type: "textarea", full: true },
        { name: "known_services",     label: "Known services / subservices", type: "textarea", full: true, rows: 3 }
      ]));

    } else if (tab === "risk") {
      const scoreGroup = document.createElement("div");
      scoreGroup.className = "vm-field-group";
      const scoreTitle = document.createElement("p");
      scoreTitle.className = "vm-field-group-title";
      scoreTitle.textContent = "Risk scoring";
      scoreGroup.appendChild(scoreTitle);

      const scoreLayout = document.createElement("div");
      scoreLayout.className = "vm-score-layout";

      const fieldsCol = document.createElement("div");
      fieldsCol.className = "vm-field-grid";
      [
        { name: "vendor_likelihood",   label: "Inherent likelihood",  type: "select", options: ["", "1", "2", "3", "4", "5"] },
        { name: "vendor_impact",       label: "Inherent impact",      type: "select", options: ["", "1", "2", "3", "4", "5"] },
        { name: "inherent_score",      label: "Inherent score",       readonly: true },
        { name: "inherent_risk",       label: "Inherent risk label",  readonly: true },
        { name: "residual_likelihood", label: "Residual likelihood",  type: "select", options: ["", "1", "2", "3", "4", "5"] },
        { name: "residual_impact",     label: "Residual impact",      type: "select", options: ["", "1", "2", "3", "4", "5"] },
        { name: "residual_score",      label: "Residual score",       readonly: true },
        { name: "residual_risk",       label: "Residual risk label",  readonly: true }
      ].forEach(f => fieldsCol.appendChild(vmField(f.label, f.name, f.type || "text", f)));
      scoreLayout.appendChild(fieldsCol);

      const matrices = document.createElement("div");
      matrices.className = "vm-matrices";
      matrices.appendChild(rmRenderDetailMatrix("Inherent", local.vendor_likelihood, local.vendor_impact));
      matrices.appendChild(rmRenderDetailMatrix("Residual", local.residual_likelihood, local.residual_impact));
      scoreLayout.appendChild(matrices);
      scoreGroup.appendChild(scoreLayout);
      contentArea.appendChild(scoreGroup);

      contentArea.appendChild(vmGroup("Risk narrative", [
        { name: "notes", label: "Risk narrative", type: "textarea", full: true, rows: 6 }
      ]));

    } else if (tab === "treatment") {
      contentArea.appendChild(vmGroup("Treatment plan", [
        { name: "treatment_plan", label: "Treatment plan", type: "textarea", full: true, rows: 14 }
      ]));

    } else if (tab === "linked") {
      contentArea.appendChild(vmGroup("Linked risks & controls", [
        { name: "linked_risks",    label: "Linked risks",    full: true },
        { name: "linked_controls", label: "Linked controls", full: true }
      ]));
    }

    const saveBar = document.createElement("div");
    saveBar.className = "vm-save-bar";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "action-button";
    saveBtn.textContent = "Save Changes";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      try {
        await saveVendor();
        setStatus("Vendor saved.", "success");
      } catch (e) {
        setStatus("Save failed: " + e.message, "error");
      }
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    });
    saveBar.appendChild(saveBtn);
    contentArea.appendChild(saveBar);
  }

  drawVendorTab();
  return shell;
}

// ── Control Manager ────────────────────────────────────────────────────────

function renderControlManager(sectionData) {
  const controls = (sectionData.controls || []).filter(c => c && (c.control_id || c.description));
  const container = document.createElement("div");
  container.className = "cm-shell";
  if (state.selectedControlIndex >= 0 && state.selectedControlIndex < controls.length) {
    container.appendChild(renderControlDetail(controls, state.selectedControlIndex));
  } else {
    state.selectedControlIndex = -1;
    container.appendChild(renderControlListView(controls));
  }
  return container;
}

function renderControlListView(controls) {
  const shell = document.createElement("div");
  shell.className = "cm-list-shell";

  const toolbar = document.createElement("div");
  toolbar.className = "cm-toolbar";

  const searchWrap = document.createElement("div");
  searchWrap.className = "cm-search-wrap";
  searchWrap.innerHTML = `<svg class="cm-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "cm-search-input";
  searchInput.placeholder = `Search ${controls.length} control${controls.length !== 1 ? "s" : ""}...`;
  searchInput.value = state.controlSearch || "";
  searchInput.autocomplete = "new-password";
  searchInput.addEventListener("input", e => { state.controlSearch = e.target.value; rebuildControlList(); });
  searchWrap.appendChild(searchInput);
  toolbar.appendChild(searchWrap);

  // Type filters: Policy controls vs Vendor controls
  const filterRow = document.createElement("div");
  filterRow.className = "cm-filter-row";
  const filterDefs = [
    { key: "all",    label: "All" },
    { key: "policy", label: "Policy Controls" },
    { key: "vendor", label: "Vendor Controls" }
  ];
  filterDefs.forEach(f => {
    const cnt = f.key === "all" ? controls.length
      : f.key === "policy" ? controls.filter(c => !(c.control_id || "").startsWith("CTRL-VDR")).length
      : controls.filter(c => (c.control_id || "").startsWith("CTRL-VDR")).length;
    if (f.key !== "all" && cnt === 0) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cm-filter-chip" + ((state.controlFilter || "all") === f.key ? " cm-filter-active" : "");
    btn.innerHTML = `${f.label}<span class="cm-filter-cnt">${cnt}</span>`;
    btn.addEventListener("click", () => {
      state.controlFilter = f.key;
      filterRow.querySelectorAll(".cm-filter-chip").forEach(c => c.classList.remove("cm-filter-active"));
      btn.classList.add("cm-filter-active");
      rebuildControlList();
    });
    filterRow.appendChild(btn);
  });
  toolbar.appendChild(filterRow);
  shell.appendChild(toolbar);

  const listEl = document.createElement("div");
  listEl.className = "cm-control-list";
  shell.appendChild(listEl);

  function rebuildControlList() {
    const search = (state.controlSearch || "").toLowerCase();
    const filter = state.controlFilter || "all";
    listEl.innerHTML = "";

    const visible = controls.filter(c => {
      const matchSearch = !search ||
        (c.control_id   || "").toLowerCase().includes(search) ||
        (c.description  || "").toLowerCase().includes(search) ||
        (c.owner || c.ownership || "").toLowerCase().includes(search) ||
        (c.framework_mapping || c.framework_identifier || "").toLowerCase().includes(search) ||
        (c.linked_policies   || "").toLowerCase().includes(search);
      const isVendor = (c.control_id || "").startsWith("CTRL-VDR");
      const matchFilter = filter === "all"
        || (filter === "vendor" && isVendor)
        || (filter === "policy" && !isVendor);
      return matchSearch && matchFilter;
    });

    if (!visible.length) {
      listEl.innerHTML = `<div class="cm-empty">No controls match your search.</div>`;
      return;
    }

    visible.forEach(ctrl => {
      const idx = controls.indexOf(ctrl);
      const isVendor = (ctrl.control_id || "").startsWith("CTRL-VDR");
      const typeLabel = isVendor ? "Vendor" : "Policy";
      const typeClass = isVendor ? "cm-type-vendor" : "cm-type-policy";
      const descPreview = (ctrl.description || "").substring(0, 90) + ((ctrl.description || "").length > 90 ? "…" : "");
      const linkedCount = [ctrl.linked_policies, ctrl.linked_risks, ctrl.linked_vendors]
        .filter(v => v && v.trim()).length;

      const row = document.createElement("div");
      row.className = "cm-control-row";
      row.innerHTML = `
        <div class="cm-row-left">
          <span class="cm-type-badge ${typeClass}">${typeLabel}</span>
          <div class="cm-row-meta">
            <div class="cm-row-header">
              <span class="cm-control-id">${ctrl.control_id || `CTRL-${String(idx + 1).padStart(3, "0")}`}</span>
              ${(ctrl.owner || ctrl.ownership) && (ctrl.owner || ctrl.ownership) !== "Owner pending assignment" && (ctrl.owner || ctrl.ownership) !== "Vendor owner pending assignment"
                ? `<span class="cm-control-owner">${ctrl.owner || ctrl.ownership}</span>` : ""}
            </div>
            <span class="cm-control-desc">${descPreview}</span>
            ${(ctrl.framework_mapping || ctrl.framework_identifier) ? `<span class="cm-control-framework">${(ctrl.framework_mapping || ctrl.framework_identifier).substring(0, 60)}${(ctrl.framework_mapping || ctrl.framework_identifier).length > 60 ? "…" : ""}</span>` : ""}
          </div>
        </div>
        <div class="cm-row-right">
          ${linkedCount > 0 ? `<span class="cm-link-count">${linkedCount} link${linkedCount !== 1 ? "s" : ""}</span>` : ""}
          <span class="cm-row-arrow">›</span>
        </div>`;
      row.addEventListener("click", () => {
        state.selectedControlIndex = idx;
        state.controlDetailTab = "overview";
        renderActivePhase();
      });
      listEl.appendChild(row);
    });
  }

  rebuildControlList();
  return shell;
}

function renderControlDetail(controls, index) {
  const ctrl = controls[index];
  const shell = document.createElement("div");
  shell.className = "cm-detail-shell";

  const isVendor = (ctrl.control_id || "").startsWith("CTRL-VDR");

  // Back bar
  const backBar = document.createElement("div");
  backBar.className = "cm-back-bar";
  backBar.innerHTML = `
    <button type="button" class="cm-back-btn">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All controls
    </button>
    <div class="cm-detail-breadcrumb">
      <span class="cm-control-id">${ctrl.control_id || `CTRL-${String(index + 1).padStart(3, "0")}`}</span>
      <span class="cm-type-badge ${isVendor ? "cm-type-vendor" : "cm-type-policy"}">${isVendor ? "Vendor" : "Policy"}</span>
    </div>
    <div class="cm-detail-nav">
      ${index > 0 ? `<button type="button" class="cm-nav-btn" id="cm-prev">‹ Prev</button>` : ""}
      <span class="cm-nav-counter">${index + 1} / ${controls.length}</span>
      ${index < controls.length - 1 ? `<button type="button" class="cm-nav-btn" id="cm-next">Next ›</button>` : ""}
    </div>`;
  backBar.querySelector(".cm-back-btn").addEventListener("click", () => { state.selectedControlIndex = -1; renderActivePhase(); });
  if (backBar.querySelector("#cm-prev")) backBar.querySelector("#cm-prev").addEventListener("click", () => { state.selectedControlIndex = index - 1; state.controlDetailTab = "overview"; renderActivePhase(); });
  if (backBar.querySelector("#cm-next")) backBar.querySelector("#cm-next").addEventListener("click", () => { state.selectedControlIndex = index + 1; state.controlDetailTab = "overview"; renderActivePhase(); });
  shell.appendChild(backBar);

  // Tabs
  const TABS = [
    { key: "overview",  label: "Overview" },
    { key: "linkages",  label: "Linkages" },
    { key: "evidence",  label: "Evidence & Frequency" }
  ];
  const tabBar = document.createElement("div");
  tabBar.className = "cm-detail-tabs";
  TABS.forEach(t => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cm-detail-tab" + ((state.controlDetailTab || "overview") === t.key ? " cm-detail-tab-active" : "");
    btn.textContent = t.label;
    btn.addEventListener("click", () => {
      state.controlDetailTab = t.key;
      tabBar.querySelectorAll(".cm-detail-tab").forEach(b => b.classList.remove("cm-detail-tab-active"));
      btn.classList.add("cm-detail-tab-active");
      drawControlTab();
    });
    tabBar.appendChild(btn);
  });
  shell.appendChild(tabBar);

  const contentArea = document.createElement("div");
  contentArea.className = "cm-detail-content";
  shell.appendChild(contentArea);

  function cmField(label, value) {
    if (!value || !String(value).trim()) return null;
    const wrap = document.createElement("div");
    wrap.className = "cm-field cm-field-full";
    const lbl = document.createElement("label");
    lbl.className = "cm-field-label";
    lbl.textContent = label;
    const val = document.createElement("div");
    val.className = "cm-field-value";
    val.textContent = value;
    wrap.appendChild(lbl);
    wrap.appendChild(val);
    return wrap;
  }

  function cmTag(text) {
    const span = document.createElement("span");
    span.className = "cm-link-tag";
    span.textContent = text;
    return span;
  }

  function cmTagRow(label, value) {
    if (!value || !String(value).trim()) return null;
    const wrap = document.createElement("div");
    wrap.className = "cm-field cm-field-full";
    const lbl = document.createElement("label");
    lbl.className = "cm-field-label";
    lbl.textContent = label;
    wrap.appendChild(lbl);
    const tagWrap = document.createElement("div");
    tagWrap.className = "cm-tag-row";
    String(value).split(/[,\s]+/).filter(Boolean).forEach(id => tagWrap.appendChild(cmTag(id)));
    wrap.appendChild(tagWrap);
    return wrap;
  }

  function drawControlTab() {
    contentArea.innerHTML = "";
    const tab = state.controlDetailTab || "overview";
    const grid = document.createElement("div");
    grid.className = "cm-detail-grid";

    if (tab === "overview") {
      // Control ID + type header
      const header = document.createElement("div");
      header.className = "cm-detail-header";
      header.innerHTML = `
        <div class="cm-detail-title">
          <h3>${ctrl.control_id || "Control"}</h3>
          <span class="cm-type-badge ${isVendor ? "cm-type-vendor" : "cm-type-policy"} cm-type-lg">${isVendor ? "Vendor Oversight Control" : "Policy Control"}</span>
        </div>`;
      grid.appendChild(header);
      [
        cmField("Description", ctrl.description),
        cmField("Control owner", ctrl.owner || ctrl.ownership),
        cmField("Framework mapping", ctrl.framework_mapping || ctrl.framework_identifier)
      ].forEach(el => { if (el) grid.appendChild(el); });
    }

    if (tab === "linkages") {
      [
        cmTagRow("Linked policies", ctrl.linked_policies),
        cmTagRow("Linked risks", ctrl.linked_risks),
        cmTagRow("Linked vendors", ctrl.linked_vendors)
      ].forEach(el => { if (el) grid.appendChild(el); });
      if (!ctrl.linked_policies && !ctrl.linked_risks && !ctrl.linked_vendors) {
        const empty = document.createElement("p");
        empty.className = "cm-empty";
        empty.textContent = "No linkages recorded for this control.";
        grid.appendChild(empty);
      }
    }

    if (tab === "evidence") {
      [
        cmField("Review frequency", ctrl.frequency || ctrl.review_frequency),
        cmField("Evidence requirements", ctrl.evidence || ctrl.evidence_requirements)
      ].forEach(el => { if (el) grid.appendChild(el); });
    }

    contentArea.appendChild(grid);
  }

  drawControlTab();
  return shell;
}
