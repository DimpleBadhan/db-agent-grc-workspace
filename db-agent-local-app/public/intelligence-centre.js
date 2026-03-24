// ============================================================
// Intelligence Centre — Quality, Improvement & Monitoring
// DB Agent GRC Workspace
// ============================================================

// ── Broadcast log (in-memory pipeline event stream) ──────────

const icState = {
  broadcastLog: [],
  improving:    false
};

function icBroadcast(event) {
  icState.broadcastLog.push({ ...event, ts: new Date().toISOString() });
  if (icState.broadcastLog.length > 300) icState.broadcastLog.shift();
  if (typeof state !== "undefined" && state.activePhaseKey === "intelligence") {
    const feed = document.getElementById("ic-live-feed");
    if (feed) icRefreshLiveFeed(feed);
  }
}

// Hook into pipeline events from change-engine if available
if (typeof window !== "undefined") {
  window.icBroadcast = icBroadcast;
}

// ── Server proxy (LLM calls) ──────────────────────────────────

async function icCallLLM(endpoint, payload) {
  const res = await fetch(`/api/intelligence/${endpoint}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload)
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(msg || `LLM call failed (${res.status})`);
  }
  return res.json();
}

async function icCheckApiStatus() {
  try {
    const res = await fetch("/api/intelligence/status");
    const d   = await res.json();
    return !!d.api_key_configured;
  } catch (_) { return false; }
}

// ── Automated Quality Gate ────────────────────────────────────

function icRunAutomatedCheck(outputText, context, outputType) {
  const text      = String(outputText || "");
  const textLower = text.toLowerCase();
  const failures  = [];
  const warnings  = [];

  // QF-001  Company name
  const co = context?.company_name || context?.legal_entity;
  if (co && !text.includes(co)) {
    failures.push({ code: "QF-001", message: `Company name "${co}" not found` });
  }

  // QF-002  Tech stack
  const stack = context?.cloud_providers || context?.tech_stack || "";
  if (stack) {
    const terms = String(stack).split(/[,\n]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (terms.length > 0 && !terms.some(t => t && textLower.includes(t))) {
      failures.push({ code: "QF-002", message: "No technology stack references found" });
    }
  }

  // QF-003  Placeholders
  ["[INSERT", "TBD", "PLACEHOLDER", "[DATE]", "[COMPANY NAME]"].forEach(p => {
    if (text.toUpperCase().includes(p)) {
      failures.push({ code: "QF-003", message: `Placeholder found: "${p}"` });
    }
  });

  // QW-001  Generic phrases
  [
    "the organization shall ensure",
    "appropriate measures must be taken",
    "as required by applicable regulations",
    "in accordance with best practices",
    "suitable controls should be applied",
    "where applicable",
    "as deemed appropriate",
    "relevant stakeholders",
    "all necessary steps"
  ].forEach(phrase => {
    if (textLower.includes(phrase)) {
      warnings.push({ code: "QW-001", message: `Generic phrase: "${phrase}"` });
    }
  });

  if (outputType === "policy") {
    // QF-004  Vendor references
    const vendors = context?.vendors || [];
    if (vendors.length > 0 && !vendors.some(v => {
      const n = v.vendor_name || v.name || "";
      return n && text.includes(n);
    })) {
      failures.push({ code: "QF-004", message: "No vendor references found in policy" });
    }
    // QF-005  Regulated data types
    const dt = String(context?.data_types || "").toLowerCase();
    const regulated = ["phi", "pci", "pii", "financial data"];
    if (regulated.some(d => dt.includes(d)) && !regulated.some(d => textLower.includes(d))) {
      failures.push({ code: "QF-005", message: "Regulated data types not referenced in document" });
    }
  }

  if (outputType === "risk") {
    ["data breach", "unauthorized access", "security incident", "human error"].forEach(t => {
      if (new RegExp(`(risk|threat).*${t}`, "i").test(text)) {
        warnings.push({ code: "QW-006", message: `Generic risk term: "${t}" — consider making specific` });
      }
    });
  }

  if (outputType === "vendor") {
    const yesNoQ = (text.match(/do you have.*\?/gi) || []).length;
    const totalQ = (text.match(/\?/g) || []).length;
    if (totalQ > 0 && yesNoQ / totalQ > 0.3) {
      warnings.push({ code: "QW-007", message: `${yesNoQ} yes/no questions — rewrite as open-ended` });
    }
  }

  const score = Math.max(0, 100 - failures.length * 15 - warnings.length * 5);
  return { passed: failures.length === 0, failures, warnings, quality_score: score };
}

// ── Quality score computation ─────────────────────────────────

function icComputeQualityScores(clientData) {
  if (!clientData) return null;
  const log      = clientData.policyGeneration?.improvement_log;
  const policies = clientData.policyGeneration?.policies || [];
  const hasData  = policies.length > 0;

  const onboarding = clientData.onboarding || {};
  const context    = {
    company_name:   onboarding.legal_entity,
    cloud_providers: onboarding.cloud_providers,
    data_types:     onboarding.data_types,
    vendors:        (onboarding.vendors || []).filter(v => v?.vendor_name)
  };

  // Run automated check on up to 5 policy bodies
  const autoScores = policies.slice(0, 5).flatMap(p => p.body
    ? [icRunAutomatedCheck(p.body, context, "policy").quality_score]
    : []
  );
  const autoAvg = autoScores.length
    ? Math.round(autoScores.reduce((a, b) => a + b, 0) / autoScores.length)
    : null;

  let overall      = log?.overall_score      ?? null;
  let specificity  = log?.specificity_score  ?? null;
  let depth        = log?.depth_score        ?? null;
  let formatting   = log?.formatting_score   ?? null;

  if (overall !== null && autoAvg !== null) {
    overall = Math.round(overall * 0.6 + autoAvg * 0.4);
  } else if (autoAvg !== null) {
    overall = autoAvg; specificity = autoAvg; depth = 70; formatting = 85;
  }

  const pendingChanges = typeof chGetPendingCount === "function" ? chGetPendingCount() : 0;

  return {
    overall:      overall      ?? 0,
    specificity:  specificity  ?? 0,
    depth:        depth        ?? 0,
    formatting:   formatting   ?? 0,
    policyCount:  log?.policy_count ?? policies.length,
    totalImprovements: log?.total_specificity_improvements ?? 0,
    pendingChanges,
    hasData,
    improvements: log?.improvements || []
  };
}

// ── Topbar indicator ──────────────────────────────────────────

function icInjectTopbarIndicator(clientData) {
  let chip = document.getElementById("ic-topbar-indicator");
  if (!chip) {
    chip = document.createElement("div");
    chip.id = "ic-topbar-indicator";
    chip.className = "ic-topbar-chip";
    chip.title = "Open Intelligence Centre";
    chip.style.cursor = "pointer";
    chip.addEventListener("click", () => {
      if (typeof state === "undefined") return;
      state.activePhaseKey = "intelligence";
      if (typeof renderTabs === "function") renderTabs();
      if (typeof renderActivePhase === "function") renderActivePhase();
    });
    const topbarStatus = document.querySelector(".topbar-status");
    if (topbarStatus) topbarStatus.appendChild(chip);
  }

  const scores  = icComputeQualityScores(clientData);
  const pending = typeof chGetPendingCount === "function" ? chGetPendingCount() : 0;

  if (!scores?.hasData) {
    chip.className = "ic-topbar-chip ic-chip-default";
    chip.innerHTML = `<span class="ic-dot ic-dot-dim"></span>&nbsp;Intelligence`;
    return;
  }

  const q    = scores.overall;
  const tone = q >= 75 ? "good" : q >= 50 ? "mid" : "low";
  chip.className = `ic-topbar-chip ic-chip-${tone}`;
  chip.innerHTML = `<span class="ic-dot ic-dot-live"></span>&nbsp;Quality: <strong>${q}/100</strong>${pending > 0 ? `&nbsp;<span class="ic-chip-warn">⚠&nbsp;${pending}</span>` : ""}`;
}

// ── Main tab renderer ─────────────────────────────────────────

function icRenderTab(clientData) {
  const container = document.createElement("div");
  container.className = "ic-container";
  container.id = "ic-container";

  // ── Header
  const header = document.createElement("div");
  header.className = "ic-header";
  const kicker = document.createElement("p");
  kicker.className = "section-label";
  kicker.textContent = "07 / Intelligence Centre";
  const title = document.createElement("h3");
  title.textContent = "Intelligence & Quality Engine";
  const subtitle = document.createElement("p");
  subtitle.className = "ic-subtitle";
  subtitle.textContent = "Real-time quality checks, improvement tracking, change detection, and smart regeneration across every compliance output.";
  header.appendChild(kicker);
  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);

  // ── Two-column grid
  const grid = document.createElement("div");
  grid.className = "ic-grid";

  const col1 = document.createElement("div");
  col1.className = "ic-col";
  col1.appendChild(icBuildQualityPanel(clientData));
  col1.appendChild(icBuildPipelinePanel(clientData));
  col1.appendChild(icBuildImprovementPanel(clientData));
  grid.appendChild(col1);

  const col2 = document.createElement("div");
  col2.className = "ic-col";
  col2.appendChild(icBuildUpdatesPanel());
  col2.appendChild(icBuildAutoCheckPanel(clientData));
  col2.appendChild(icBuildAuditTrailPanel());
  grid.appendChild(col2);

  container.appendChild(grid);

  // ── Live feed strip
  const liveCard = document.createElement("section");
  liveCard.className = "info-card ic-panel ic-live-card";
  const lh = document.createElement("div");
  lh.className = "panel-head compact";
  const lt = document.createElement("h4");
  lt.textContent = "Live pipeline feed";
  lh.appendChild(lt);
  lh.appendChild(icMakeBadge("Live", "ic-badge-live"));
  liveCard.appendChild(lh);
  const feed = document.createElement("div");
  feed.id = "ic-live-feed";
  feed.className = "ic-live-feed";
  icRefreshLiveFeed(feed);
  liveCard.appendChild(feed);
  container.appendChild(liveCard);

  return container;
}

// ── Quality panel ─────────────────────────────────────────────

function icBuildQualityPanel(clientData) {
  const scores  = icComputeQualityScores(clientData);
  const section = icMakePanel("Output quality scores");

  if (!scores?.hasData) {
    section.appendChild(icNote("Quality scores appear after the first policy generation completes."));
    return section;
  }

  const verdict = scores.overall >= 75 ? "Excellent" : scores.overall >= 50 ? "Good" : "Needs improvement";
  const tone    = scores.overall >= 75 ? "ic-badge-success" : scores.overall >= 50 ? "ic-badge-warn" : "ic-badge-danger";
  section.querySelector(".panel-head").appendChild(icMakeBadge(verdict, tone));

  // Big overall number
  const hero = document.createElement("div");
  hero.className = "ic-score-hero";
  const num = document.createElement("span");
  num.className = `ic-score-num ic-score-${scores.overall >= 75 ? "good" : scores.overall >= 50 ? "mid" : "low"}`;
  num.textContent = scores.overall;
  const denom = document.createElement("span");
  denom.className = "ic-score-denom";
  denom.textContent = "/100 overall";
  hero.appendChild(num);
  hero.appendChild(denom);
  section.appendChild(hero);

  // Sub-score meters
  [
    { label: "Company specificity", value: scores.specificity },
    { label: "Content depth",       value: scores.depth       },
    { label: "Formatting",          value: scores.formatting  }
  ].forEach(({ label, value }) => section.appendChild(icMakeMeter(label, value)));

  // Stats strip
  const stats = document.createElement("div");
  stats.className = "ic-stats-strip";
  [
    { label: "Policies",          value: scores.policyCount         },
    { label: "Generic refs fixed",value: scores.totalImprovements   },
    { label: "Pending updates",   value: scores.pendingChanges      }
  ].forEach(({ label, value }) => {
    const s = document.createElement("div");
    s.className = "ic-stat-item";
    s.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
    stats.appendChild(s);
  });
  section.appendChild(stats);

  // What was improved
  if (scores.improvements.length > 0) {
    const lt = document.createElement("p");
    lt.className = "ic-list-title";
    lt.textContent = "What the last generation improved";
    section.appendChild(lt);
    const ul = document.createElement("ul");
    ul.className = "ic-impr-list";
    scores.improvements.forEach(item => {
      const li = document.createElement("li");
      li.textContent = String(item);
      ul.appendChild(li);
    });
    section.appendChild(ul);
  }

  return section;
}

// ── Automated check panel ─────────────────────────────────────

function icBuildAutoCheckPanel(clientData) {
  const section = icMakePanel("Automated quality checks");

  const desc = icNote("Click to run instant quality checks across all generated policy bodies. No AI call required.");
  section.appendChild(desc);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "action-button ghost small";
  btn.textContent = "Run checks now";

  const resultsEl = document.createElement("div");
  resultsEl.className = "ic-check-results";

  btn.addEventListener("click", () => {
    resultsEl.innerHTML = "";
    const policies = clientData?.policyGeneration?.policies || [];
    const onboarding = clientData?.onboarding || {};
    const context = {
      company_name:    onboarding.legal_entity,
      cloud_providers: onboarding.cloud_providers,
      data_types:      onboarding.data_types,
      vendors:         (onboarding.vendors || []).filter(v => v?.vendor_name)
    };

    if (policies.length === 0) {
      resultsEl.appendChild(icNote("No policies to check yet."));
      return;
    }

    let allF = [], allW = [], scores = [];
    policies.forEach(p => {
      if (!p.body) return;
      const r = icRunAutomatedCheck(p.body, context, "policy");
      allF.push(...r.failures.map(f => ({ ...f, policy: p.name })));
      allW.push(...r.warnings.map(w => ({ ...w, policy: p.name })));
      scores.push(r.quality_score);
    });

    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const summary = document.createElement("div");
    summary.className = "ic-check-summary";
    const passedAll = allF.length === 0;
    summary.innerHTML = `<strong>${passedAll ? "✓ All checks passed" : `${allF.length} failure${allF.length !== 1 ? "s" : ""}, ${allW.length} warning${allW.length !== 1 ? "s" : ""}`}</strong><span class="ic-check-score-chip${passedAll ? " ic-check-pass" : avg < 60 ? " ic-check-fail" : " ic-check-warn"}">${avg}/100</span>`;
    resultsEl.appendChild(summary);

    if (passedAll && allW.length === 0) {
      resultsEl.appendChild(icNote(`All automated checks passed across ${policies.length} policies.`));
    }

    [...allF.map(f => ({ ...f, sev: "fail" })), ...allW.map(w => ({ ...w, sev: "warning" }))].forEach(item => {
      const row = document.createElement("div");
      row.className = `ic-check-row ic-check-${item.sev}`;
      row.innerHTML = `<span class="ic-chk-code">${icEsc(item.code)}</span><span class="ic-chk-msg">${icEsc(item.message)}</span>${item.policy ? `<span class="ic-chk-ctx">${icEsc(item.policy)}</span>` : ""}`;
      resultsEl.appendChild(row);
    });

    icBroadcast({ event: "automated_check_complete", label: "Auto Check", score: avg, failures: allF.length, warnings: allW.length });
  });

  section.appendChild(btn);
  section.appendChild(resultsEl);
  return section;
}

// ── Pipeline panel ────────────────────────────────────────────

function icBuildPipelinePanel(clientData) {
  const section   = icMakePanel("Generation pipeline");
  const pg        = clientData?.policyGeneration || {};
  const stages    = Array.isArray(pg.generation_stages) ? pg.generation_stages : [];
  const status    = String(pg.generation_status || "Not started");
  const startedAt = pg.generation_started_at;
  const doneAt    = pg.generation_completed_at;

  if (stages.length === 0) {
    section.appendChild(icNote("Pipeline data appears after the first generation run."));
    return section;
  }

  // Status + timing
  const statusLine = document.createElement("div");
  statusLine.className = "ic-pipeline-status-line";
  const sb = document.createElement("span");
  sb.className = `ic-pipeline-badge ic-pipeline-${status.toLowerCase().replace(/\s+/g, "-")}`;
  sb.textContent = status;
  statusLine.appendChild(sb);
  if (startedAt && doneAt) {
    const elapsed = Math.round((new Date(doneAt) - new Date(startedAt)) / 1000);
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    const timing = document.createElement("span");
    timing.className = "ic-pipeline-timing";
    timing.textContent = `Completed in ${m > 0 ? m + "m " : ""}${s}s`;
    statusLine.appendChild(timing);
  }
  section.appendChild(statusLine);

  // Stage list
  const list = document.createElement("div");
  list.className = "ic-stage-list";
  stages.forEach((stage, i) => {
    const norm = String(stage.status || "pending").toLowerCase();
    const item = document.createElement("div");
    item.className = `ic-stage ic-stage-${norm}`;
    const icon = document.createElement("span");
    icon.className = "ic-stage-dot";
    if (norm === "complete")     icon.textContent = "✓";
    else if (norm === "in-progress") icon.innerHTML = `<span class="pg-spinner"></span>`;
    else if (norm === "failed")  icon.textContent = "✗";
    else icon.textContent = String(i + 1);
    const copy = document.createElement("div");
    copy.className = "ic-stage-copy";
    const lbl = document.createElement("span");
    lbl.className = "ic-stage-lbl";
    lbl.textContent = stage.label || `Stage ${i + 1}`;
    copy.appendChild(lbl);
    if (stage.note && norm !== "pending") {
      const note = document.createElement("span");
      note.className = "ic-stage-note";
      note.textContent = stage.note;
      copy.appendChild(note);
    }
    item.appendChild(icon);
    item.appendChild(copy);
    list.appendChild(item);
  });
  section.appendChild(list);

  // Summary from improvement log
  const il = clientData?.policyGeneration?.improvement_log;
  if (il) {
    const note = document.createElement("p");
    note.className = "ic-pipeline-note";
    note.textContent = `Last run: ${il.policy_count} policies · ${il.total_specificity_improvements} generic refs replaced · Score ${il.overall_score}/100`;
    section.appendChild(note);
  }

  return section;
}

// ── Improvement panel ─────────────────────────────────────────

function icBuildImprovementPanel(clientData) {
  const section = icMakePanel("AI improvement actions");

  section.appendChild(icNote("AI-powered passes deepen content, inject company-specific language, and enforce professional formatting."));

  // Action cards
  const policyCount = (clientData?.policyGeneration?.policies || []).length;
  const riskCount   = (clientData?.riskAssessment?.risks      || []).length;
  const vendorCount = (clientData?.vendorRisk?.vendors         || []).length;

  const actionGrid = document.createElement("div");
  actionGrid.className = "ic-action-grid";

  [
    { label: "Improve all policies",     sub: `${policyCount} policies — specificity + depth + formatting`, type: "policies", n: policyCount },
    { label: "Improve risk register",    sub: `${riskCount} risks — deepen justifications and treatments`,   type: "risks",    n: riskCount },
    { label: "Improve vendor questions", sub: `${vendorCount} vendors — open-ended assessment questions`,    type: "vendors",  n: vendorCount }
  ].forEach(({ label, sub, type, n }) => {
    const card = document.createElement("div");
    card.className = "ic-action-card";
    const cardTitle = document.createElement("strong");
    cardTitle.textContent = label;
    const cardSub = document.createElement("p");
    cardSub.className = "ic-action-sub";
    cardSub.textContent = sub;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "action-button ghost small";
    btn.disabled = n === 0;
    btn.textContent = n === 0 ? "No data yet" : "Start";
    btn.addEventListener("click", () => icStartImprovement(type, clientData));
    card.appendChild(cardTitle);
    card.appendChild(cardSub);
    card.appendChild(btn);
    actionGrid.appendChild(card);
  });

  section.appendChild(actionGrid);

  // Progress placeholder
  const prog = document.createElement("div");
  prog.id = "ic-improve-progress";
  prog.className = "ic-improve-progress hidden";
  section.appendChild(prog);

  return section;
}

async function icStartImprovement(type, clientData) {
  if (icState.improving) { icShowToast("Improvement already running.", "warn"); return; }
  icState.improving = true;

  const prog = document.getElementById("ic-improve-progress");
  if (prog) { prog.classList.remove("hidden"); prog.textContent = `Running ${type} improvement…`; }

  icBroadcast({ event: "improvement_started", label: "Improvement", type, message: `${type} improvement pass started.` });

  try {
    const onboarding = clientData?.onboarding || {};
    const context = {
      company_name: onboarding.legal_entity,
      industry:     onboarding.industry,
      company_size: onboarding.employee_headcount,
      tech_stack:   onboarding.cloud_providers,
      data_types:   String(onboarding.data_types || "").split(/[,\n]/).map(s => s.trim()).filter(Boolean),
      compliance_scope: (() => {
        try { return JSON.parse(onboarding.framework_selection_v2 || "[]").map(f => f.label || f.id || f); }
        catch (_) { return [onboarding.framework_selection || "SOC 2"]; }
      })(),
      vendors: (onboarding.vendors || []).filter(v => v?.vendor_name).map(v => ({
        name: v.vendor_name, description: v.vendor_description || ""
      }))
    };

    let payload;
    if (type === "policies") {
      payload = { type: "specificity_pass", policies: (clientData?.policyGeneration?.policies || []).slice(0, 3), context };
    } else if (type === "risks") {
      payload = { type: "risk_depth_pass", risks: (clientData?.riskAssessment?.risks || []).slice(0, 5), context };
    } else {
      payload = { type: "vendor_question_pass", vendors: (clientData?.vendorRisk?.vendors || []).slice(0, 3), context };
    }

    const result = await icCallLLM("improve", payload);
    icBroadcast({ event: "improvement_complete", label: "Improvement", type, score: result.score, count: result.improvements_count });

    if (prog) prog.textContent = `✓ Done — ${result.improvements_count || 0} changes · Score: ${result.score || "—"}/100`;
    icShowToast(`${type} improvement complete.`, "success");
  } catch (err) {
    icBroadcast({ event: "improvement_failed", label: "Error", type, message: err.message });
    if (prog) prog.textContent = `Error: ${err.message}`;
    icShowToast(`Improvement failed: ${err.message}`, "error");
  } finally {
    icState.improving = false;
  }
}

// ── Pending updates panel ─────────────────────────────────────

function icBuildUpdatesPanel() {
  const section = icMakePanel("Pending compliance updates");
  const pending = typeof chGetPendingCount === "function" ? chGetPendingCount() : 0;

  if (pending > 0) {
    section.querySelector(".panel-head").appendChild(icMakeBadge(String(pending), "ic-badge-warn"));
  }

  if (pending === 0) {
    section.appendChild(icNote("✓ All clear. No pending updates. Changes to onboarding or vendor data will surface here automatically."));
    return section;
  }

  const log          = typeof chLoadChangeLog === "function" ? chLoadChangeLog() : [];
  const pendingItems = log.filter(c => c.status === "pending_review").slice(0, 12);
  const impactOrder  = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const groups       = {};
  pendingItems.forEach(c => {
    const g = c.impact || "medium";
    if (!groups[g]) groups[g] = [];
    groups[g].push(c);
  });

  Object.entries(groups)
    .sort(([a], [b]) => (impactOrder[a] ?? 9) - (impactOrder[b] ?? 9))
    .forEach(([impact, items]) => {
      const grpEl = document.createElement("div");
      grpEl.className = `ic-upd-group ic-upd-${impact}`;
      const grpHead = document.createElement("div");
      grpHead.className = "ic-upd-group-head";
      grpHead.textContent = impact.charAt(0).toUpperCase() + impact.slice(1);
      grpEl.appendChild(grpHead);

      items.forEach(change => {
        const row = document.createElement("div");
        row.className = "ic-upd-row";

        const lbl = document.createElement("span");
        lbl.className = "ic-upd-label";
        lbl.textContent = change.label || change.type?.replace(/_/g, " ") || change.field || "";

        const affects = document.createElement("span");
        affects.className = "ic-upd-affects";
        affects.textContent = (change.affects || []).join(", ");

        const btns = document.createElement("div");
        btns.className = "ic-upd-btns";

        const firstAction = (change.actions || [])[0];
        if (firstAction?.nav) {
          const nb = document.createElement("button");
          nb.type = "button"; nb.className = "action-button ghost small";
          nb.textContent = "Review";
          nb.addEventListener("click", () => {
            if (typeof chResolveChange === "function") chResolveChange(change.id, "navigated");
            if (typeof state !== "undefined") state.activePhaseKey = firstAction.nav;
            if (typeof renderTabs === "function") renderTabs();
            if (typeof renderActivePhase === "function") renderActivePhase();
          });
          btns.appendChild(nb);
        }

        const db = document.createElement("button");
        db.type = "button"; db.className = "action-button ghost small";
        db.textContent = "Dismiss";
        db.addEventListener("click", () => {
          if (typeof chResolveChange === "function") chResolveChange(change.id, "dismissed");
          if (typeof state !== "undefined" && state.activePhaseKey === "intelligence") {
            if (typeof renderActivePhase === "function") renderActivePhase();
          }
        });
        btns.appendChild(db);

        row.appendChild(lbl);
        row.appendChild(affects);
        row.appendChild(btns);
        grpEl.appendChild(row);
      });

      section.appendChild(grpEl);
    });

  const openBtn = document.createElement("button");
  openBtn.type = "button"; openBtn.className = "action-button ghost small";
  openBtn.style.marginTop = "10px";
  openBtn.textContent = "Open Update Centre";
  openBtn.addEventListener("click", () => { if (typeof ucToggleUpdateCentre === "function") ucToggleUpdateCentre(); });
  section.appendChild(openBtn);

  return section;
}

// ── Audit trail panel ─────────────────────────────────────────

function icBuildAuditTrailPanel() {
  const section = icMakePanel("Audit trail");
  const trail   = typeof chLoadAuditTrail === "function" ? chLoadAuditTrail().slice(0, 15) : [];

  if (trail.length === 0) {
    section.appendChild(icNote("Audit trail populates as onboarding and vendor data is saved."));
    return section;
  }

  const list = document.createElement("div");
  list.className = "ic-audit-list";

  trail.forEach(entry => {
    const row = document.createElement("div");
    row.className = "ic-audit-row";

    const ts = document.createElement("span");
    ts.className = "ic-audit-ts";
    try {
      ts.textContent = new Date(entry.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (_) { ts.textContent = entry.timestamp || ""; }

    const desc = document.createElement("span");
    desc.className = "ic-audit-desc";
    desc.textContent = entry.summary || entry.trigger?.replace(/_/g, " ") || "Context update";

    const detail = document.createElement("span");
    detail.className = "ic-audit-detail";
    detail.textContent = entry.changes_detected > 0
      ? `${entry.changes_detected} change${entry.changes_detected !== 1 ? "s" : ""} · ${(entry.artifacts_affected || []).join(", ")}`
      : "";

    row.appendChild(ts);
    row.appendChild(desc);
    if (detail.textContent) row.appendChild(detail);
    list.appendChild(row);
  });

  section.appendChild(list);
  return section;
}

// ── Live feed ─────────────────────────────────────────────────

function icRefreshLiveFeed(feed) {
  if (!feed) return;
  feed.innerHTML = "";

  const events = icState.broadcastLog.slice(-25).reverse();
  if (events.length === 0) {
    const empty = document.createElement("p");
    empty.className = "ic-feed-empty";
    empty.textContent = "No pipeline events yet. Events appear here in real time during generation and improvement runs.";
    feed.appendChild(empty);
    return;
  }

  events.forEach(ev => {
    const row = document.createElement("div");
    row.className = "ic-feed-row";

    const ts = document.createElement("span");
    ts.className = "ic-feed-ts";
    try { ts.textContent = new Date(ev.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch (_) {}

    const lbl = document.createElement("span");
    lbl.className = "ic-feed-lbl";
    lbl.textContent = String(ev.label || ev.event || "").replace(/_/g, " ");

    const detail = document.createElement("span");
    detail.className = "ic-feed-detail" + (ev.error || ev.event?.includes("fail") ? " ic-feed-err" : "");
    if (ev.final_score !== undefined)  detail.textContent = `Score: ${ev.final_score}/100`;
    else if (ev.score !== undefined)   detail.textContent = `Score: ${ev.score}/100`;
    else if (ev.message)               detail.textContent = ev.message;
    else if (ev.error)                 detail.textContent = ev.error;

    row.appendChild(ts);
    row.appendChild(lbl);
    if (detail.textContent) row.appendChild(detail);
    feed.appendChild(row);
  });
}

// ── Shared UI helpers ─────────────────────────────────────────

function icMakePanel(heading) {
  const section = document.createElement("section");
  section.className = "info-card ic-panel";
  const head = document.createElement("div");
  head.className = "panel-head compact";
  const title = document.createElement("h4");
  title.textContent = heading;
  head.appendChild(title);
  section.appendChild(head);
  return section;
}

function icMakeBadge(text, cls = "ic-badge-default") {
  const b = document.createElement("span");
  b.className = `ic-badge ${cls}`;
  b.textContent = text;
  return b;
}

function icMakeMeter(label, score) {
  const row = document.createElement("div");
  row.className = "ic-meter-row";
  const lbl = document.createElement("span");
  lbl.className = "ic-meter-lbl";
  lbl.textContent = label;
  const track = document.createElement("div");
  track.className = "ic-meter-track";
  const fill = document.createElement("div");
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  fill.className = `ic-meter-fill ${pct >= 70 ? "ic-fill-good" : pct >= 45 ? "ic-fill-mid" : "ic-fill-low"}`;
  fill.style.width = pct + "%";
  track.appendChild(fill);
  const val = document.createElement("span");
  val.className = "ic-meter-val";
  val.textContent = pct;
  row.appendChild(lbl);
  row.appendChild(track);
  row.appendChild(val);
  return row;
}

function icNote(text) {
  const p = document.createElement("p");
  p.className = "ic-note";
  p.textContent = text;
  return p;
}

function icShowToast(message, type = "info") {
  let toast = document.getElementById("ic-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "ic-toast";
    toast.className = "ic-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `ic-toast ic-toast-${type} ic-toast-show`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("ic-toast-show"), 3200);
}

function icEsc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Init ──────────────────────────────────────────────────────

function icInit(clientData) {
  icInjectTopbarIndicator(clientData);
}
