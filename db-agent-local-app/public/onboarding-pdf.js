"use strict";

// ─── Onboarding PDF Export ─────────────────────────────────────────────────

function downloadOnboardingPDF() {
  const clientData = state.selectedClientData;
  if (!clientData) { setStatus("No client loaded.", "error"); return; }

  const onboarding     = clientData.onboarding       || {};
  const riskData       = clientData.riskAssessment    || {};
  const vendors        = (onboarding.vendors || []).filter(v => v && v.vendor_name);
  const users          = getStructuredClientUsers(onboarding).filter(u => u.name);
  const risks          = (riskData.risks || []).filter(r => r && r.threat);
  const companyName    = onboarding.legal_entity || clientData.client?.companyName || "Client";
  const generatedAt    = new Date().toLocaleString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  const fwDisplay      = typeof getFwDisplayForOverview === "function" ? getFwDisplayForOverview(onboarding) : (onboarding.framework_selection || "—");

  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const v   = (x, fb="—") => x ? esc(String(x)) : fb;

  // ── counter ──────────────────────────────────────────────────────────────
  let _n = 0;
  const sn = () => ++_n;

  // ── risk matrix builder ───────────────────────────────────────────────────
  function buildMatrix(items, getLikelihood, getImpact, title) {
    // 5×5 grid: likelihood rows (5→1 top-to-bottom), impact cols (1→5 left-to-right)
    const grid = Array.from({length:5}, () => Array(5).fill([]));
    items.forEach(item => {
      const l = Math.min(5, Math.max(1, parseInt(getLikelihood(item), 10) || 0));
      const im = Math.min(5, Math.max(1, parseInt(getImpact(item), 10) || 0));
      if (l && im) {
        const r = 5 - l; // row: likelihood 5 = row 0
        const c = im - 1; // col: impact 1 = col 0
        grid[r][c] = [...grid[r][c], item];
      }
    });

    // Cell colour by inherent score
    const cellColour = (l_val, i_val) => {
      const score = l_val * i_val;
      if (score >= 16) return "m-crit";
      if (score >= 10) return "m-high";
      if (score >= 5)  return "m-med";
      return "m-low";
    };

    const rows = Array.from({length:5}, (_, rowIdx) => {
      const l_val = 5 - rowIdx;
      return `<tr>
        <td class="m-axis-label">${l_val}</td>
        ${Array.from({length:5}, (__, colIdx) => {
          const i_val = colIdx + 1;
          const cls   = cellColour(l_val, i_val);
          const cell  = grid[rowIdx][colIdx];
          const count = cell.length;
          const dots  = count > 0
            ? `<span class="m-dot-wrap">${cell.map(r => `<span class="m-dot ${cls}-dot" title="${esc(r.threat||r.vendor_name||"")}">${esc((r.risk_id||r.vendor_id||"").replace(/[A-Z]+-/,"").replace(/^0+/,""))}</span>`).join("")}</span>`
            : "";
          return `<td class="m-cell ${cls}">${dots || `<span class="m-empty-cell"></span>`}</td>`;
        }).join("")}
      </tr>`;
    }).join("");

    return `
    <div class="matrix-wrap">
      <p class="matrix-title">${esc(title)}</p>
      <div class="matrix-outer">
        <div class="m-y-label-wrap"><span class="m-axis-title y-title">LIKELIHOOD</span></div>
        <div class="matrix-inner">
          <table class="m-table">
            <tbody>${rows}</tbody>
          </table>
          <div class="m-x-labels">
            <span class="m-axis-corner"></span>
            ${[1,2,3,4,5].map(i => `<span class="m-x-num">${i}</span>`).join("")}
          </div>
          <div class="m-x-title-wrap"><span class="m-axis-title x-title">IMPACT</span></div>
        </div>
      </div>
      <div class="m-legend">
        <span class="m-leg m-low-dot">Low</span>
        <span class="m-leg m-med-dot">Medium</span>
        <span class="m-leg m-high-dot">High</span>
        <span class="m-leg m-crit-dot">Critical</span>
      </div>
    </div>`;
  }

  // ── section builder ───────────────────────────────────────────────────────
  const sec = (title, content, cls="") =>
    `<section class="pdf-sec ${cls}">
      <h2 class="sec-head"><span class="sec-num">${sn()}</span>${esc(title)}</h2>
      ${content}
    </section>`;

  // ── field rows ────────────────────────────────────────────────────────────
  const fieldRow = (label, value) =>
    value ? `<div class="fr"><span class="fl">${esc(label)}</span><span class="fv">${esc(String(value))}</span></div>` : "";

  // ── tier badge ────────────────────────────────────────────────────────────
  const tierBadge = tier => {
    const t = String(tier||"").trim();
    const cls = {Critical:"b-crit", High:"b-high", Medium:"b-med", Low:"b-low"}[t] || "b-low";
    return t ? `<span class="badge ${cls}">${esc(t)}</span>` : `<span class="badge b-low">—</span>`;
  };

  const riskBadge = score => {
    const s = parseInt(score, 10) || 0;
    if (s >= 16) return `<span class="badge b-crit">${s} Critical</span>`;
    if (s >= 10) return `<span class="badge b-high">${s} High</span>`;
    if (s >= 5)  return `<span class="badge b-med">${s} Medium</span>`;
    return `<span class="badge b-low">${s} Low</span>`;
  };

  // ── vendor table ──────────────────────────────────────────────────────────
  const vendorTable = vendors.length
    ? `<table class="dt">
        <thead><tr><th style="width:28px">#</th><th>Vendor</th><th>Service description</th><th>Client-specific use</th><th>Data handled</th><th>Access level</th><th>Business impact</th><th>Contract</th><th>DPA</th></tr></thead>
        <tbody>${vendors.map((v2, i) => `
          <tr>
            <td class="mono muted">${i+1}</td>
            <td class="fw6">${v(v2.vendor_name)}</td>
            <td>${v(v2.vendor_description)}</td>
            <td>${v(v2.purpose || v2.vendor_purpose)}</td>
            <td class="muted">${v(v2.data_types_handled)}</td>
            <td class="muted">${v(v2.access_level_detail)}</td>
            <td class="muted">${v(v2.business_impact)}</td>
            <td class="muted">${v(v2.has_contract)}</td>
            <td class="muted">${v(v2.has_dpa)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`
    : `<p class="empty-note">No vendors were added during onboarding.</p>`;

  // ── risk summary table (name, description, criticality only) ──────────────
  const riskTable = risks.length
    ? `<table class="dt">
        <thead><tr><th style="width:28px">#</th><th>Risk name</th><th>Description</th><th>Criticality</th></tr></thead>
        <tbody>${risks.map((r, i) => `
          <tr>
            <td class="mono muted">${i+1}</td>
            <td class="fw6">${v(r.threat)}</td>
            <td class="muted">${v(r.description || r.risk_description || r.category)}</td>
            <td>${riskBadge(r.inherent_score)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`
    : `<p class="empty-note">Risk assessment has not been generated yet.</p>`;

  // ── approvers table ───────────────────────────────────────────────────────
  const usersTable = users.length
    ? `<table class="dt">
        <thead><tr><th>Name</th><th>Email</th><th>Designation / role</th></tr></thead>
        <tbody>${users.map(u => `
          <tr>
            <td class="fw6">${v(u.name)}</td>
            <td class="mono muted">${v(u.email)}</td>
            <td>${v(u.designation)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`
    : `<p class="empty-note">No approvers have been added.</p>`;

  // ── summary stats ─────────────────────────────────────────────────────────
  const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  risks.forEach(r => {
    const s = parseInt(r.inherent_score,10)||0;
    if (s >= 16) riskCounts.critical++;
    else if (s >= 10) riskCounts.high++;
    else if (s >= 5) riskCounts.medium++;
    else riskCounts.low++;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Onboarding Report — ${esc(companyName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;800&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
/* ── Reset ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:10.5pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Inter',system-ui,sans-serif;color:#1c2740;background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased}

/* ── Toolbar (screen only) ── */
.toolbar{position:fixed;top:0;left:0;right:0;z-index:999;background:#0d1728;color:#dce8f8;display:flex;align-items:center;gap:12px;padding:10px 28px;font-size:10pt;border-bottom:1px solid #1c2c44}
.toolbar strong{font-family:'Space Grotesk',sans-serif;font-size:11pt;color:#fff}
.toolbar-spacer{flex:1}
.btn-print{background:#00c5a7;color:#051018;border:none;border-radius:8px;padding:8px 20px;font-size:10pt;font-weight:700;font-family:'Inter',sans-serif;cursor:pointer;letter-spacing:.01em}
.btn-print:hover{background:#00d9b8}
.btn-close{background:transparent;color:#6b84a0;border:1px solid #1c2c44;border-radius:8px;padding:7px 16px;font-size:10pt;font-family:'Inter',sans-serif;cursor:pointer}
.btn-close:hover{color:#dce8f8;border-color:#283f60}
@media screen{body{padding-top:50px}}

/* ── Cover ── */
.cover{padding:56px 60px 48px;border-bottom:3px solid #00c5a7;page-break-after:always;position:relative;overflow:hidden}
.cover::before{content:'';position:absolute;top:-60px;right:-80px;width:320px;height:320px;background:radial-gradient(circle,rgba(0,197,167,.07) 0%,transparent 70%);pointer-events:none}
.cover-eyebrow{font-family:'Space Grotesk',sans-serif;font-size:8.5pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#00c5a7;margin-bottom:18px}
.cover-company{font-family:'Space Grotesk',sans-serif;font-size:30pt;font-weight:800;color:#0d1728;line-height:1.1;margin-bottom:6px;letter-spacing:-.02em}
.cover-doc-type{font-size:12pt;color:#6b84a0;font-weight:400;margin-bottom:40px}
.cover-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid #e3e8f0;border-radius:12px;overflow:hidden}
.cover-meta-cell{padding:16px 20px;border-right:1px solid #e3e8f0}
.cover-meta-cell:last-child{border-right:none}
.cover-meta-cell:nth-child(n+4){border-top:1px solid #e3e8f0}
.cml{font-size:7.5pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00c5a7;margin-bottom:4px}
.cmv{font-size:10pt;color:#1c2740;font-weight:600}
.cover-footer{margin-top:36px;display:flex;align-items:center;justify-content:space-between;font-size:8pt;color:#aab4c8}
.cover-tag{background:#f0fdf9;color:#00a98e;border:1px solid #b6f0e5;border-radius:6px;padding:3px 10px;font-size:7.5pt;font-weight:700;letter-spacing:.08em}

/* ── Page body ── */
.body{padding:40px 60px}

/* ── Summary stat band ── */
.stat-band{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid #e3e8f0;border-radius:10px;overflow:hidden;margin-bottom:32px}
.stat-cell{padding:16px 20px;border-right:1px solid #e3e8f0;text-align:center}
.stat-cell:last-child{border-right:none}
.stat-num{font-family:'Space Grotesk',sans-serif;font-size:22pt;font-weight:800;line-height:1;margin-bottom:4px}
.stat-lbl{font-size:8pt;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6b84a0}
.sc-risk{color:#0d1728}
.sc-crit{color:#dc2626}
.sc-high{color:#ea580c}
.sc-med{color:#d97706}
.sc-low{color:#059669}

/* ── Section ── */
.pdf-sec{margin-bottom:36px}
.pdf-sec.no-break{page-break-inside:avoid}
.sec-head{font-family:'Space Grotesk',sans-serif;font-size:12pt;font-weight:700;color:#0d1728;display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:1.5px solid #e3e8f0}
.sec-num{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#0d1728;color:#00c5a7;font-size:8pt;font-weight:800;flex-shrink:0;font-family:'Space Grotesk',sans-serif}

/* ── Field rows ── */
.fields{display:flex;flex-direction:column;gap:0;border:1px solid #e3e8f0;border-radius:10px;overflow:hidden}
.fr{display:grid;grid-template-columns:200px 1fr;gap:0;border-bottom:1px solid #f0f3f8;min-height:36px}
.fr:last-child{border-bottom:none}
.fl{padding:9px 16px;font-size:9pt;font-weight:600;color:#6b84a0;background:#f8fafc;white-space:nowrap;border-right:1px solid #f0f3f8;display:flex;align-items:flex-start;padding-top:10px}
.fv{padding:9px 16px;font-size:9.5pt;color:#1c2740;white-space:pre-wrap;word-break:break-word}

/* ── Data table ── */
.dt{width:100%;border-collapse:collapse;font-size:9pt}
.dt thead tr{background:#f8fafc;border-bottom:2px solid #e3e8f0}
.dt th{padding:9px 12px;text-align:left;font-size:8pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b84a0;white-space:nowrap}
.dt td{padding:9px 12px;border-bottom:1px solid #f0f3f8;color:#1c2740;vertical-align:top}
.dt tr:last-child td{border-bottom:none}
.dt tr:hover td{background:#fafbff}
.fw6{font-weight:600}
.mono{font-family:'JetBrains Mono',monospace;font-size:8.5pt}
.muted{color:#6b84a0}
.empty-note{font-size:9.5pt;color:#aab4c8;font-style:italic;padding:16px 0}

/* ── Badges ── */
.badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;font-size:8pt;font-weight:700;letter-spacing:.03em;white-space:nowrap}
.b-crit{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.b-high{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
.b-med{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
.b-low{background:#f0fdf9;color:#059669;border:1px solid #bbf7d0}

/* ── Framework pills ── */
.fw-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.fw-pill{background:#f0fdf9;color:#00a98e;border:1px solid #b6f0e5;border-radius:8px;padding:5px 14px;font-size:10pt;font-weight:700;font-family:'Space Grotesk',sans-serif}

/* ── Risk matrix ── */
.matrices-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:8px}
.matrices-row.three-col{grid-template-columns:repeat(3,1fr)}
.matrix-wrap{background:#f8fafc;border:1px solid #e3e8f0;border-radius:10px;padding:16px}
.matrix-title{font-size:8.5pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6b84a0;margin-bottom:12px}
.matrix-outer{display:flex;align-items:flex-start;gap:6px}
.m-y-label-wrap{display:flex;align-items:center;justify-content:center;padding-bottom:28px}
.m-axis-title{font-family:'JetBrains Mono',monospace;font-size:7pt;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#aab4c8}
.y-title{writing-mode:vertical-rl;transform:rotate(180deg)}
.matrix-inner{display:flex;flex-direction:column;flex:1}
.m-table{border-collapse:separate;border-spacing:3px;flex:1}
.m-table td{width:36px;height:32px;border-radius:5px;text-align:center;vertical-align:middle}
.m-axis-label{font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:#aab4c8;text-align:right;padding-right:6px!important;width:16px;background:transparent!important}
.m-crit{background:#fef2f2;border:1px solid #fecaca}
.m-high{background:#fff7ed;border:1px solid #fed7aa}
.m-med{background:#fffbeb;border:1px solid #fde68a}
.m-low{background:#f0fdf9;border:1px solid #d1fae5}
.m-empty-cell{display:block;width:6px;height:6px;border-radius:50%;background:#e3e8f0;margin:auto}
.m-dot-wrap{display:flex;flex-wrap:wrap;gap:2px;justify-content:center;align-items:center;padding:2px}
.m-dot{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;font-size:7pt;font-weight:700;font-family:'JetBrains Mono',monospace;cursor:default}
.m-crit-dot{background:#dc2626;color:#fff}
.m-high-dot{background:#ea580c;color:#fff}
.m-med-dot{background:#d97706;color:#fff}
.m-low-dot{background:#059669;color:#fff}
.m-x-labels{display:flex;gap:3px;padding-left:22px;margin-top:3px}
.m-axis-corner{width:16px;flex-shrink:0}
.m-x-num{width:36px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:#aab4c8}
.m-x-title-wrap{text-align:center;padding-top:6px}
.x-title{display:inline}
.m-legend{display:flex;align-items:center;gap:14px;margin-top:12px;padding-top:10px;border-top:1px solid #e3e8f0}
.m-leg{display:inline-flex;align-items:center;gap:5px;font-size:7.5pt;font-weight:600;color:#6b84a0}
.m-leg::before{content:'';display:inline-block;width:10px;height:10px;border-radius:3px}
.m-leg.m-crit-dot::before{background:#dc2626}
.m-leg.m-high-dot::before{background:#ea580c}
.m-leg.m-med-dot::before{background:#d97706}
.m-leg.m-low-dot::before{background:#059669}

/* ── Sign-off ── */
.sig-section{margin-top:48px;page-break-inside:avoid}
.sig-title{font-family:'Space Grotesk',sans-serif;font-size:11pt;font-weight:700;color:#0d1728;margin-bottom:6px}
.sig-sub{font-size:9pt;color:#6b84a0;margin-bottom:20px}
.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.sig-block{}
.sig-line{border-bottom:1.5px solid #1c2740;height:44px;margin-bottom:5px}
.sig-lbl{font-size:8pt;color:#aab4c8;font-weight:500}

/* ── Divider ── */
.divider{border:none;border-top:1px solid #e3e8f0;margin:28px 0}

/* ── Print ── */
@media print{
  @page{size:A4 portrait;margin:18mm 16mm 16mm 16mm}
  body{padding-top:0;font-size:9.5pt}
  .toolbar{display:none!important}
  .cover{padding:36px 0 32px;border-bottom:2px solid #00c5a7}
  .body{padding:28px 0 0}
  .pdf-sec{page-break-inside:avoid}
  a{color:inherit;text-decoration:none}
  .dt tr:hover td{background:none}
}
</style>
</head>
<body>

<div class="toolbar no-print">
  <strong>${esc(companyName)}</strong>
  <span style="color:#3a4f68;font-size:9pt;margin-left:4px">— Onboarding &amp; Security Questionnaire</span>
  <span class="toolbar-spacer"></span>
  <span style="font-size:9pt;color:#3a4f68;margin-right:4px">Generated ${esc(generatedAt)}</span>
  <button class="btn-print" onclick="window.print()">Save as PDF</button>
  <button class="btn-close" onclick="window.close()">Close</button>
</div>

<!-- COVER -->
<div class="cover">
  <p class="cover-eyebrow">DB Agent &mdash; Compliance Intelligence</p>
  <h1 class="cover-company">${esc(companyName)}</h1>
  <p class="cover-doc-type">Onboarding Report &amp; Security Questionnaire</p>
  <div class="cover-meta-grid">
    <div class="cover-meta-cell"><p class="cml">Generated</p><p class="cmv">${esc(generatedAt)}</p></div>
    <div class="cover-meta-cell"><p class="cml">Framework</p><p class="cmv">${fwDisplay}</p></div>
    <div class="cover-meta-cell"><p class="cml">Industry</p><p class="cmv">${v(onboarding.industry)}</p></div>
    <div class="cover-meta-cell"><p class="cml">Headcount</p><p class="cmv">${v(onboarding.employee_headcount)}</p></div>
    <div class="cover-meta-cell"><p class="cml">Vendors</p><p class="cmv">${vendors.length} onboarded</p></div>
    <div class="cover-meta-cell"><p class="cml">Risks identified</p><p class="cmv">${risks.length > 0 ? `${risks.length} risks (${riskCounts.critical} critical, ${riskCounts.high} high)` : "Pending generation"}</p></div>
  </div>
  <div class="cover-footer">
    <span>Confidential &mdash; for internal, audit, and compliance use only. Not for external distribution without authorisation.</span>
    <span class="cover-tag">DB AGENT</span>
  </div>
</div>

<!-- BODY -->
<div class="body">

<!-- Summary band (only if risks exist) -->
${risks.length > 0 ? `
<div class="stat-band">
  <div class="stat-cell"><div class="stat-num sc-risk">${risks.length}</div><div class="stat-lbl">Total risks</div></div>
  <div class="stat-cell"><div class="stat-num sc-crit">${riskCounts.critical}</div><div class="stat-lbl">Critical</div></div>
  <div class="stat-cell"><div class="stat-num sc-high">${riskCounts.high}</div><div class="stat-lbl">High</div></div>
  <div class="stat-cell"><div class="stat-num sc-med">${riskCounts.medium}</div><div class="stat-lbl">Medium</div></div>
</div>` : ""}

${sec("Company Profile", `
  <div class="fields">
    ${fieldRow("Legal entity name", onboarding.legal_entity)}
    ${fieldRow("Website", onboarding.public_website)}
    ${fieldRow("Company type", onboarding.company_type)}
    ${fieldRow("Industry", onboarding.industry)}
    ${fieldRow("Employee headcount", onboarding.employee_headcount)}
    ${fieldRow("Work arrangement", onboarding.work_type)}
    ${onboarding.business_model ? fieldRow("What the company does", onboarding.business_model) : ""}
  </div>
`, "no-break")}

${sec("Compliance Frameworks", `
  <div class="fw-pills">${(fwDisplay||"").split(",").map(f=>f.trim()).filter(Boolean).map(f=>`<span class="fw-pill">${esc(f)}</span>`).join("")||`<span class="fw-pill">${fwDisplay}</span>`}</div>
  <div class="fields">
    ${fieldRow("Framework selection", onboarding.framework_selection)}
    ${onboarding.scope ? fieldRow("Scope statement", onboarding.scope) : ""}
  </div>
`, "no-break")}

${sec("Hosting &amp; Access Controls", `
  <div class="fields">
    ${fieldRow("Primary hosting provider(s)", onboarding.cloud_providers)}
    ${fieldRow("Storage regions", onboarding.storage_regions)}
    ${fieldRow("Devices used by team", onboarding.devices_used)}
    ${fieldRow("Operating systems", onboarding.operating_systems)}
    ${fieldRow("Identity provider", onboarding.identity_provider)}
    ${fieldRow("MFA status", onboarding.mfa_enabled)}
    ${onboarding.access_model ? fieldRow("Access management model", onboarding.access_model) : ""}
  </div>
`)}

${sec("Data &amp; Security Controls", `
  <div class="fields">
    ${fieldRow("Data types handled", onboarding.data_types)}
    ${fieldRow("Sensitive / regulated data", onboarding.classification)}
    ${fieldRow("Data protection &amp; encryption", onboarding.encryption)}
    ${fieldRow("Backup &amp; recovery", onboarding.backup)}
    ${fieldRow("Monitoring &amp; detection", onboarding.monitoring)}
  </div>
`)}

${sec(`Vendor List — ${vendors.length} vendor${vendors.length!==1?"s":""}`, vendorTable)}

${sec(`Risks — ${risks.length} risk${risks.length!==1?"s":""}`, riskTable)}

${sec(`Approvers &amp; Client Users — ${users.length}`, usersTable, "no-break")}

<!-- Sign-off block -->
<div class="sig-section">
  <hr class="divider">
  <p class="sig-title">Sign-off &amp; Acknowledgement</p>
  <p class="sig-sub">By signing below, the named individuals confirm that the information in this report is accurate and complete to the best of their knowledge as of ${esc(generatedAt)}.</p>
  <div class="sig-grid">
    <div class="sig-block"><div class="sig-line"></div><p class="sig-lbl">Authorised signatory — name &amp; title</p></div>
    <div class="sig-block"><div class="sig-line"></div><p class="sig-lbl">Date</p></div>
    <div class="sig-block"><div class="sig-line"></div><p class="sig-lbl">Security / Compliance owner — name &amp; title</p></div>
    <div class="sig-block"><div class="sig-line"></div><p class="sig-lbl">Date</p></div>
  </div>
</div>

</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=960,height=860,scrollbars=yes");
  if (!win) { setStatus("Pop-up blocked — please allow pop-ups and try again.", "error"); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
