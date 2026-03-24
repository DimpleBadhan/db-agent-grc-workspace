// ============================================================
// Change Detection & Auto-Trigger Engine
// DB Agent GRC Workspace
// ============================================================

// ── Storage helpers ──────────────────────────────────────────

function chClientKey(suffix) {
  const id = (typeof state !== "undefined" && state.selectedClientId) ? state.selectedClientId : "_global";
  return `db_agent_${suffix}_${id}`;
}

function chLoad(key) {
  try { return JSON.parse(localStorage.getItem(chClientKey(key)) || "null"); }
  catch (_) { return null; }
}

function chPersist(key, value) {
  try { localStorage.setItem(chClientKey(key), JSON.stringify(value)); }
  catch (_) {}
}

function chLoadChangeLog()    { return chLoad("change_log")    || []; }
function chSaveChangeLog(v)   { chPersist("change_log", v); }
function chLoadAuditTrail()   { return chLoad("audit_trail")   || []; }
function chSaveAuditTrail(v)  { chPersist("audit_trail", v); }
function chLoadStalenessMap() { return chLoad("staleness_map") || {}; }
function chSaveStalenessMap(v){ chPersist("staleness_map", v); }

function chLoadArtifactVersions(artifactKey) {
  const all = chLoad("artifact_versions") || {};
  return all[artifactKey] || [];
}

function chSaveArtifactVersion(artifactKey, content, meta = {}) {
  const all = chLoad("artifact_versions") || {};
  if (!all[artifactKey]) all[artifactKey] = [];
  all[artifactKey].unshift({ content, ...meta, saved_at: new Date().toISOString() });
  if (all[artifactKey].length > 5) all[artifactKey] = all[artifactKey].slice(0, 5);
  chPersist("artifact_versions", all);
}

// ── Watched onboarding fields ────────────────────────────────

const CH_WATCHED_FIELDS = [
  { field: "framework_selection",    label: "Compliance framework",       impact: "critical", affects: ["policies", "risks", "vendor_assessments", "evidence"] },
  { field: "framework_selection_v2", label: "Compliance framework",       impact: "critical", affects: ["policies", "risks", "vendor_assessments", "evidence"] },
  { field: "industry",               label: "Industry",                   impact: "high",     affects: ["policies", "risks", "vendor_assessments"] },
  { field: "employee_headcount",     label: "Employee headcount",         impact: "medium",   affects: ["policies", "risks"] },
  { field: "cloud_providers",        label: "Cloud providers",            impact: "high",     affects: ["risks", "vendor_assessments"] },
  { field: "storage_regions",        label: "Storage regions",            impact: "high",     affects: ["policies", "risks", "vendor_assessments"] },
  { field: "data_types",             label: "Data types handled",         impact: "critical", affects: ["policies", "risks", "vendor_assessments", "evidence"] },
  { field: "classification",         label: "Sensitive data",             impact: "critical", affects: ["policies", "risks", "vendor_assessments", "evidence"] },
  { field: "business_model",         label: "Business model",             impact: "medium",   affects: ["policies", "risks"] },
  { field: "encryption",             label: "Data protection",            impact: "high",     affects: ["policies", "risks", "evidence"] },
  { field: "monitoring",             label: "Monitoring / detection",     impact: "high",     affects: ["policies", "risks", "evidence"] },
  { field: "backup",                 label: "Backup / recovery",          impact: "medium",   affects: ["policies", "risks"] },
  { field: "identity_provider",      label: "Identity provider",          impact: "medium",   affects: ["policies", "risks"] },
  { field: "mfa_enabled",            label: "MFA status",                 impact: "high",     affects: ["policies", "risks"] },
  { field: "access_model",           label: "Access control model",       impact: "high",     affects: ["policies", "risks"] },
  { field: "devices_used",           label: "Devices used",               impact: "medium",   affects: ["policies", "risks"] }
];

// ── Change type detection ────────────────────────────────────

function chDetectChangeType(prev, curr) {
  const empty = v => v === null || v === undefined || v === "";
  if (empty(prev) && !empty(curr)) return "added";
  if (!empty(prev) && empty(curr)) return "removed";
  const toArr = v => Array.isArray(v) ? v : (typeof v === "string" ? v.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : null);
  const pa = toArr(prev);
  const ca = toArr(curr);
  if (pa && ca && pa.length > 0 && ca.length > 0) {
    const added   = ca.filter(i => !pa.includes(i));
    const removed = pa.filter(i => !ca.includes(i));
    if (added.length > 0 && removed.length === 0) return "expanded";
    if (removed.length > 0 && added.length === 0) return "reduced";
  }
  return "modified";
}

// ── Onboarding change detection ──────────────────────────────

function chDetectChanges(prev, curr) {
  if (!prev || !curr) return [];
  const changes = [];
  CH_WATCHED_FIELDS.forEach(({ field, label, impact, affects }) => {
    const p = prev[field];
    const c = curr[field];
    if (JSON.stringify(p) === JSON.stringify(c)) return;
    if (!p && !c) return;
    changes.push({
      id: `CHG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      source: "onboarding",
      field,
      label,
      change_type: chDetectChangeType(p, c),
      previous_value: p,
      new_value: c,
      impact,
      affects,
      status: "pending_review",
      resolved_at: null
    });
  });
  return changes;
}

// ── Vendor change detection ──────────────────────────────────

function chDetectVendorChanges(prevVendors, newVendors) {
  const changes = [];
  const prev = (prevVendors || []).filter(v => v?.vendor_name?.trim());
  const curr = (newVendors  || []).filter(v => v?.vendor_name?.trim());
  const findVendor = (list, name) => list.find(v => v.vendor_name?.toLowerCase() === name?.toLowerCase());

  // Added
  curr.forEach(vendor => {
    if (!findVendor(prev, vendor.vendor_name)) {
      changes.push({
        id: `CHG-V-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        source: "vendors",
        type: "vendor_added",
        label: `Vendor added: ${vendor.vendor_name}`,
        vendor_name: vendor.vendor_name,
        impact: chAssessVendorImpact(vendor),
        affects: ["vendor_assessments", "risks"],
        status: "pending_review",
        resolved_at: null
      });
    }
  });

  // Removed
  prev.forEach(vendor => {
    if (!findVendor(curr, vendor.vendor_name)) {
      changes.push({
        id: `CHG-V-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        source: "vendors",
        type: "vendor_removed",
        label: `Vendor removed: ${vendor.vendor_name}`,
        vendor_name: vendor.vendor_name,
        impact: "high",
        affects: ["vendor_assessments", "risks"],
        status: "pending_review",
        resolved_at: null
      });
    }
  });

  // Updated — watched fields include basic info AND client-specific intel fields
  const VENDOR_WATCHED_FIELDS = [
    { field: "vendor_description",           impact: "medium", affects: ["vendor_assessments"] },
    { field: "purpose",                      impact: "high",   affects: ["vendor_assessments"] },
    { field: "data_types_handled",           impact: "high",   affects: ["vendor_assessments", "risks"] },
    { field: "access_level_detail",          impact: "high",   affects: ["vendor_assessments", "risks"] },
    { field: "stores_processes_data",        impact: "high",   affects: ["vendor_assessments", "risks"] },
    { field: "business_impact",              impact: "high",   affects: ["vendor_assessments", "risks"] },
    { field: "has_contract",                 impact: "medium", affects: ["vendor_assessments"] },
    { field: "has_dpa",                      impact: "high",   affects: ["vendor_assessments", "risks"] },
    { field: "vendor_certifications_confirmed", impact: "medium", affects: ["vendor_assessments"] },
    { field: "service_category",             impact: "medium", affects: ["vendor_assessments"] },
  ];

  curr.forEach(vendor => {
    const p = findVendor(prev, vendor.vendor_name);
    if (!p) return;

    // Detect first-time intel fill (was empty, now filled) as a meaningful update
    const wasEmpty = !p.data_types_handled && !p.access_level_detail && !p.stores_processes_data;
    const nowFilled = vendor.data_types_handled || vendor.access_level_detail || vendor.stores_processes_data;
    if (wasEmpty && nowFilled) {
      changes.push({
        id: `CHG-V-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        source: "vendors",
        type: "vendor_intel_filled",
        label: `${vendor.vendor_name} — security intel completed`,
        vendor_name: vendor.vendor_name,
        impact: "high",
        affects: ["vendor_assessments", "risks"],
        status: "pending_review",
        resolved_at: null
      });
      return; // one change per vendor for first-time fill is enough
    }

    VENDOR_WATCHED_FIELDS.forEach(({ field, impact, affects }) => {
      const prev_val = p[field];
      const new_val  = vendor[field];
      if (JSON.stringify(prev_val) === JSON.stringify(new_val)) return;
      if (!prev_val && !new_val) return;
      changes.push({
        id: `CHG-V-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        source: "vendors",
        type: "vendor_updated",
        label: `${vendor.vendor_name} — ${field.replace(/_/g, " ")} updated`,
        vendor_name: vendor.vendor_name,
        field_changed: field,
        previous_value: prev_val,
        new_value: new_val,
        impact,
        affects,
        status: "pending_review",
        resolved_at: null
      });
    });
  });

  return changes;
}

function chAssessVendorImpact(vendor) {
  const desc = `${vendor.vendor_description || ""} ${vendor.purpose || ""} ${vendor.data_types_handled || ""} ${vendor.business_impact || ""}`.toLowerCase();
  const access = (vendor.access_level_detail || "").toLowerCase();
  if (/phi|health|hipaa|medical/.test(desc))                   return "critical";
  if (/pci|payment|card|billing/.test(desc))                   return "critical";
  if (/pii|personal data|gdpr/.test(desc))                     return "high";
  if (/admin|infrastructure|full/.test(access))                return "high";
  if (vendor.has_dpa === "No" || vendor.has_contract === "No") return "high";
  return "medium";
}

// ── Impact action computation ────────────────────────────────

function chComputeImpactActions(changes) {
  const actions = [];

  changes.forEach(change => {
    const newStr  = String(change.new_value      || "").toLowerCase();
    const prevStr = String(change.previous_value || "").toLowerCase();
    const ct      = change.change_type;
    const f       = change.field;

    // Data types / classification changes
    if (["data_types", "classification"].includes(f)) {
      if (/phi|health|hipaa|medical/.test(newStr) && !/phi|health|hipaa|medical/.test(prevStr)) {
        actions.push(
          { changeId: change.id, type: "flag_policies",    reason: "PHI added — policies must include HIPAA handling requirements",          impact: "critical", artifact: "Policies",           nav: "policy-generation" },
          { changeId: change.id, type: "flag_risks",       reason: "PHI exposure creates new HIPAA breach risk — risk register is incomplete", impact: "critical", artifact: "Risk Register",      nav: "risk-assessment" },
          { changeId: change.id, type: "flag_vendors",     reason: "Vendors with PHI access may need re-tiering to Critical",               impact: "high",     artifact: "Vendor Assessments",  nav: "vendor-risk" },
          { changeId: change.id, type: "suggest_framework",reason: "PHI detected — consider adding HIPAA to compliance scope",             impact: "info",     artifact: "Compliance Scope",    nav: "onboarding", framework: "HIPAA" }
        );
      }
      if (/pci|payment card|cardholder/.test(newStr) && !/pci|payment card|cardholder/.test(prevStr)) {
        actions.push(
          { changeId: change.id, type: "flag_policies", reason: "PCI data detected — security policy must reflect cardholder data requirements", impact: "critical", artifact: "Policies",          nav: "policy-generation" },
          { changeId: change.id, type: "flag_risks",    reason: "Cardholder data environment risks must be added to risk register",            impact: "critical", artifact: "Risk Register",     nav: "risk-assessment" },
          { changeId: change.id, type: "suggest_framework", reason: "PCI data detected — consider adding PCI DSS to compliance scope",        impact: "info",     artifact: "Compliance Scope",  nav: "onboarding", framework: "PCI DSS" }
        );
      }
      if (/gdpr|eu personal|eu resident/.test(newStr) && !/gdpr|eu personal|eu resident/.test(prevStr)) {
        actions.push(
          { changeId: change.id, type: "suggest_framework", reason: "EU personal data detected — consider adding GDPR to compliance scope", impact: "info", artifact: "Compliance Scope", nav: "onboarding", framework: "GDPR" }
        );
      }
      if (ct !== "added") {
        actions.push(
          { changeId: change.id, type: "flag_policies", reason: `${change.label} changed — data classification sections in policies may need review`, impact: "high", artifact: "Policies",      nav: "policy-generation" },
          { changeId: change.id, type: "flag_risks",    reason: `${change.label} changed — risk register may not reflect current data handling`,       impact: "high", artifact: "Risk Register", nav: "risk-assessment" }
        );
      }
    }

    // Framework / compliance scope
    if (["framework_selection", "framework_selection_v2"].includes(f)) {
      if (ct === "expanded" || ct === "added" || ct === "modified") {
        actions.push(
          { changeId: change.id, type: "flag_policies",  reason: "Framework changed — all policies must be reviewed to reflect the updated compliance scope", impact: "critical", artifact: "Policies",       nav: "policy-generation" },
          { changeId: change.id, type: "flag_risks",     reason: "New framework adds control requirements — risk register should be reviewed",               impact: "critical", artifact: "Risk Register",  nav: "risk-assessment" },
          { changeId: change.id, type: "flag_evidence",  reason: "Framework change may add or remove required evidence tasks",                               impact: "high",     artifact: "Evidence Tasks",  nav: "evidence-tracker" }
        );
      } else if (ct === "reduced") {
        actions.push(
          { changeId: change.id, type: "flag_policies", reason: "Framework removed — policies referencing the removed framework should be reviewed", impact: "high", artifact: "Policies", nav: "policy-generation" }
        );
      }
    }

    // Industry
    if (f === "industry" && ct !== "added") {
      actions.push(
        { changeId: change.id, type: "flag_policies", reason: `Industry changed to "${change.new_value}" — industry-specific policy language may need updating`, impact: "high", artifact: "Policies",      nav: "policy-generation" },
        { changeId: change.id, type: "flag_risks",    reason: "Industry change affects the threat landscape — risk register should be reviewed",               impact: "high", artifact: "Risk Register", nav: "risk-assessment" }
      );
    }

    // Headcount
    if (f === "employee_headcount") {
      actions.push(
        { changeId: change.id, type: "rescale_policies",  reason: `Headcount changed (${change.previous_value} → ${change.new_value}) — policy ownership model may need updating`, impact: "medium", artifact: "Policies",       nav: "policy-generation" },
        { changeId: change.id, type: "rescale_evidence",  reason: "Evidence standards adjust to company size — review evidence task requirements",                                  impact: "medium", artifact: "Evidence Tasks",  nav: "evidence-tracker" }
      );
    }

    // Cloud / infra
    if (["cloud_providers", "devices_used", "storage_regions"].includes(f) && ct !== "added") {
      actions.push(
        { changeId: change.id, type: "flag_risks",   reason: `${change.label} changed — architecture-specific risks may be outdated`,              impact: "high",   artifact: "Risk Register",     nav: "risk-assessment" },
        { changeId: change.id, type: "flag_vendors", reason: `${change.label} changed — new platforms may introduce vendors requiring assessment`,  impact: "medium", artifact: "Vendor Assessments", nav: "vendor-risk" }
      );
    }

    // Security controls
    if (["encryption", "monitoring", "backup"].includes(f) && ct !== "added") {
      actions.push(
        { changeId: change.id, type: "flag_policies", reason: `${change.label} changed — control policies covering this area should be reviewed`,       impact: "high",   artifact: "Policies",      nav: "policy-generation" },
        { changeId: change.id, type: "flag_evidence", reason: `${change.label} changed — evidence requirements for this control area may have changed`, impact: "medium", artifact: "Evidence Tasks", nav: "evidence-tracker" }
      );
    }

    // Access
    if (["mfa_enabled", "access_model", "identity_provider"].includes(f) && ct !== "added") {
      actions.push(
        { changeId: change.id, type: "flag_policies", reason: `${change.label} changed — access control policy must reflect the updated configuration`, impact: "high",   artifact: "Policies",      nav: "policy-generation" },
        { changeId: change.id, type: "flag_risks",    reason: `${change.label} changed — access control risks should be re-evaluated`,                  impact: "medium", artifact: "Risk Register", nav: "risk-assessment" }
      );
    }

    // Vendor events
    if (change.type === "vendor_added") {
      actions.push(
        { changeId: change.id, type: "vendor_assessment_required", reason: `${change.vendor_name} added — a vendor risk assessment is required before use`, impact: "high",   artifact: `Vendor: ${change.vendor_name}`, nav: "vendor-risk" },
        { changeId: change.id, type: "flag_risks",                 reason: `New vendor ${change.vendor_name} may introduce supply-chain risks`,             impact: "medium", artifact: "Risk Register",                nav: "risk-assessment" }
      );
    }
    if (change.type === "vendor_removed") {
      actions.push(
        { changeId: change.id, type: "archive_vendor", reason: `${change.vendor_name} removed — verify dependent risks and policies no longer reference it`, impact: "high",   artifact: `Vendor: ${change.vendor_name}`, nav: "vendor-risk" },
        { changeId: change.id, type: "flag_risks",     reason: `Risks referencing ${change.vendor_name} should be reviewed or removed`,                      impact: "medium", artifact: "Risk Register",                nav: "risk-assessment" }
      );
    }
    if (change.type === "vendor_updated") {
      actions.push(
        { changeId: change.id, type: "vendor_assessment_update", reason: `${change.vendor_name} — ${change.field_changed?.replace(/_/g, " ")} updated, assessment should be reviewed`, impact: change.impact, artifact: `Vendor: ${change.vendor_name}`, nav: "vendor-risk" }
      );
    }
  });

  return actions;
}

// ── Context changed timestamp ────────────────────────────────

function chGetContextChangedAt() {
  return chLoad("context_changed_at");
}

function chUpdateContextChangedAt(impact) {
  if (["critical", "high"].includes(impact)) {
    chPersist("context_changed_at", new Date().toISOString());
  }
}

// ── Staleness ────────────────────────────────────────────────

const CH_STALENESS = {
  current:            { label: "Current",                  tone: "success" },
  review_recommended: { label: "Review recommended",       tone: "warning" },
  stale:              { label: "Stale",                    tone: "warning" },
  critical:           { label: "Critical update required", tone: "error" }
};

// artifactKey: "policies" | "risks" | "vendor_assessments" | "evidence"
function chComputeStaleness(artifactKey, generatedAt) {
  const contextChangedAt = chGetContextChangedAt();
  if (!contextChangedAt || !generatedAt) return null;
  const genDate     = new Date(generatedAt);
  const changeDate  = new Date(contextChangedAt);
  if (genDate >= changeDate) return "current";

  const log = chLoadChangeLog();
  const relevant = log.filter(c => {
    if (new Date(c.timestamp) <= genDate) return false;
    const affectsThis = (c.affects || []).some(a => {
      if (a === artifactKey) return true;
      // Fuzzy match: "risks" matches "risk_register"
      if (artifactKey.startsWith(a.replace("_assessments","").replace("_register",""))) return true;
      return false;
    });
    return affectsThis;
  });

  if (relevant.length === 0) return "review_recommended";
  if (relevant.some(c => c.impact === "critical")) return "critical";
  if (relevant.some(c => c.impact === "high"))     return "stale";
  return "review_recommended";
}

function chMarkArtifactGenerated(artifactKey) {
  const map = chLoadStalenessMap();
  map[artifactKey] = { generated_at: new Date().toISOString() };
  chSaveStalenessMap(map);
}

// ── Snapshot before save ─────────────────────────────────────

function chCaptureSnapshot(configKey) {
  if (!state?.selectedClientData) return null;
  if (configKey !== "onboarding" && configKey !== "vendor-management") return null;
  const onboarding = state.selectedClientData.onboarding || {};
  return {
    configKey,
    onboarding: JSON.parse(JSON.stringify(onboarding)),
    vendors:    JSON.parse(JSON.stringify(onboarding.vendors || []))
  };
}

// ── Process changes after save ───────────────────────────────

function chProcessSaveChanges(configKey, prevSnapshot) {
  if (!prevSnapshot || !state?.selectedClientData) return;

  const newOnboarding = state.selectedClientData.onboarding || {};
  const allChanges = [];

  if (configKey === "onboarding") {
    allChanges.push(...chDetectChanges(prevSnapshot.onboarding, newOnboarding));
  }
  if (configKey === "onboarding" || configKey === "vendor-management") {
    allChanges.push(...chDetectVendorChanges(prevSnapshot.vendors, newOnboarding.vendors || []));
  }

  if (allChanges.length === 0) return;

  // Attach computed actions to each change
  const actions = chComputeImpactActions(allChanges);
  allChanges.forEach(change => {
    change.actions = actions.filter(a => a.changeId === change.id);
  });

  // Persist — prepend to log, cap at 200
  const log = chLoadChangeLog();
  log.unshift(...allChanges);
  chSaveChangeLog(log.slice(0, 200));

  // Update context timestamp for high/critical changes
  const maxImpact = allChanges.reduce((best, c) => {
    const rank = { critical: 3, high: 2, medium: 1, low: 0 };
    return (rank[c.impact] || 0) > (rank[best] || 0) ? c.impact : best;
  }, "low");
  chUpdateContextChangedAt(maxImpact);

  // Audit trail entry
  const trail = chLoadAuditTrail();
  trail.unshift({
    id: `TRAIL-${Date.now()}`,
    timestamp: new Date().toISOString(),
    trigger: configKey === "vendor-management" ? "vendor_update" : "onboarding_update",
    changes_detected: allChanges.length,
    summary: allChanges.map(c => c.label || c.type || c.field).join(", "),
    artifacts_affected: [...new Set(allChanges.flatMap(c => c.affects || []))],
    actions: []
  });
  chSaveAuditTrail(trail.slice(0, 200));

  // Update bell badge
  if (typeof ucUpdateBell === "function") ucUpdateBell();

  // Auto-trigger targeted regeneration — only impacted entities, not full sections
  const clientId = state?.selectedClientId;
  if (clientId) {
    // Accumulate targeted impact across all changes
    const mergedImpact = { policyIds: [], riskIds: [], vendorIds: [] };
    let needsFullRisk = false;
    let needsFullVendor = false;

    allChanges.forEach(change => {
      const field = change.field;
      const affects = change.affects || [];

      if (field && (affects.includes("risks") || affects.includes("vendor_assessments"))) {
        // Resolve specifically which risks/vendors this field change impacts
        const targeted = chResolveImpactFromFieldChange(field);
        if (targeted.riskIds.length > 0) {
          mergedImpact.riskIds.push(...targeted.riskIds);
        } else if (affects.includes("risks")) {
          // Field affects risks but no targeted IDs found → full risk regen
          needsFullRisk = true;
        }
        if (targeted.vendorIds.length > 0) {
          mergedImpact.vendorIds.push(...targeted.vendorIds);
        } else if (affects.includes("vendor_assessments")) {
          needsFullVendor = true;
        }
      }

      // Vendor record changes (vendor added/removed/changed)
      if (change.vendor_id) {
        mergedImpact.vendorIds.push(change.vendor_id);
      }

      // Vendor intel filled or updated — trigger vendor regen for that specific vendor
      if (change.type === "vendor_intel_filled" || change.type === "vendor_updated") {
        const vid = (state?.selectedClientData?.vendorRisk?.vendors || [])
          .find(v => v.vendor_name === change.vendor_name)?.vendor_id;
        if (vid) mergedImpact.vendorIds.push(vid);
        else needsFullVendor = true;
      }
      // Vendor added — always needs full vendor regen (new vendor has no id yet)
      if (change.type === "vendor_added") {
        needsFullVendor = true;
      }
    });

    // Deduplicate
    mergedImpact.riskIds   = [...new Set(mergedImpact.riskIds)];
    mergedImpact.vendorIds = [...new Set(mergedImpact.vendorIds)];
    mergedImpact.policyIds = [...new Set(mergedImpact.policyIds)];

    const hasTargeted = mergedImpact.riskIds.length > 0 || mergedImpact.vendorIds.length > 0;

    if (hasTargeted) chScheduleTargetedRegen(clientId, mergedImpact);
    if (needsFullRisk   && !hasTargeted) chScheduleSelectiveRegen(clientId, "risks");
    if (needsFullVendor && !hasTargeted) chScheduleSelectiveRegen(clientId, "vendors");

    // Policy regen — trigger for critical/high onboarding field changes
    // Only if policies already exist (don't trigger on fresh setup)
    const hasPolicies = (state?.selectedClientData?.policyGeneration?.policies || []).length > 0;
    const policyAffectingChanges = allChanges.filter(c =>
      (c.affects || []).includes("policies") &&
      ["critical", "high"].includes(c.impact) &&
      c.source === "onboarding"
    );
    if (hasPolicies && policyAffectingChanges.length > 0 && state?.aiEnabled) {
      // Use targeted policy regen for specific policies, or flag for manual regen
      // We don't auto-regenerate all policies — too destructive. Instead schedule targeted.
      const policyIds = (state?.selectedClientData?.policyGeneration?.policies || [])
        .filter(p => {
          // Find policies whose category matches the changed fields
          const affectedCategories = policyAffectingChanges.flatMap(c => {
            const f = c.field;
            if (["data_types","classification","encryption"].includes(f)) return ["Data Protection","Privacy"];
            if (["mfa_enabled","access_model","identity_provider"].includes(f)) return ["Access Control","Identity"];
            if (["monitoring","backup"].includes(f)) return ["Incident Response","Business Continuity"];
            if (["cloud_providers","storage_regions","devices_used"].includes(f)) return ["Infrastructure","Endpoint"];
            if (["framework_selection","framework_selection_v2"].includes(f)) return []; // affects all — skip targeted
            return [];
          });
          return affectedCategories.some(cat =>
            (p.category || "").toLowerCase().includes(cat.toLowerCase()) ||
            (p.name || "").toLowerCase().includes(cat.toLowerCase())
          );
        })
        .map(p => p.policy_id);
      if (policyIds.length > 0) {
        chScheduleTargetedRegen(clientId, { policyIds, riskIds: [], vendorIds: [] });
      }
    }
  }
}

// ── Pending count ────────────────────────────────────────────

function chGetPendingCount() {
  return chLoadChangeLog().filter(c => c.status === "pending_review").length;
}

// ── Resolve ──────────────────────────────────────────────────

function chResolveChange(changeId, action = "dismissed") {
  const log = chLoadChangeLog();
  const entry = log.find(c => c.id === changeId);
  if (entry) {
    entry.status = action === "regenerated" ? "resolved" : "dismissed";
    entry.resolved_at = new Date().toISOString();
    entry.resolution_action = action;
  }
  chSaveChangeLog(log);

  // Append to most recent audit trail entry
  const trail = chLoadAuditTrail();
  if (trail.length > 0) {
    trail[0].actions = trail[0].actions || [];
    trail[0].actions.push({ action, change_id: changeId, at: new Date().toISOString() });
    chSaveAuditTrail(trail);
  }
}

function chResolveAll() {
  const log = chLoadChangeLog();
  log.forEach(c => {
    if (c.status === "pending_review") {
      c.status = "dismissed";
      c.resolved_at = new Date().toISOString();
      c.resolution_action = "bulk_dismissed";
    }
  });
  chSaveChangeLog(log);
  if (typeof ucUpdateBell === "function") ucUpdateBell();
}

// ── Dependency Graph ─────────────────────────────────────────
// Maps which specific risks/vendors/policies are impacted by a change
// rather than re-running everything.

// Onboarding field → which risk categories it affects
const CH_FIELD_RISK_CATEGORY = {
  mfa_enabled:       ["Identity and Access"],
  access_model:      ["Identity and Access"],
  devices_used:      ["Identity and Access"],
  identity_provider: ["Identity and Access", "Third-Party Risk"],
  cloud_providers:   ["Infrastructure", "Third-Party Risk"],
  monitoring:        ["Security Operations"],
  backup:            ["Business Continuity"],
  data_types:        ["Data Protection"],
  classification:    ["Data Protection"],
  encryption:        ["Data Protection"],
  storage_regions:   ["Data Protection", "Infrastructure"],
  employee_headcount:["Operational"],
  industry:          ["Operational", "Data Protection"],
};

// Onboarding field → which vendor service categories it affects
const CH_FIELD_VENDOR_CATEGORY = {
  cloud_providers:   ["cloud", "infrastructure", "hosting"],
  identity_provider: ["iam", "identity", "sso", "authentication"],
  monitoring:        ["monitoring", "siem", "observability", "logging"],
  backup:            ["backup", "recovery", "storage"],
  data_types:        ["data", "analytics", "database"],
};

function chBuildDependencyGraph() {
  const data = state?.selectedClientData;
  if (!data) return null;

  const controls = data?.controlMapping?.controls || [];
  const risks    = data?.riskAssessment?.risks    || [];
  const vendors  = data?.vendorRisk?.vendors       || [];

  // framework criteria code (e.g. "CC6.8") → control_ids[]
  const criteriaToControls = {};
  // control_id → policy_ids[]
  const controlToPolicies = {};
  // control_id → vendor_ids[]
  const controlToVendors = {};

  controls.forEach(c => {
    const cid = c.control_id;

    // Build criteria → controls map
    const fwRaw = c.framework_mapping || "";
    fwRaw.split(",").map(s => s.trim()).filter(Boolean).forEach(ref => {
      const m = ref.match(/([A-Z]+[\d.]+)/);
      if (m) {
        const key = m[1];
        if (!criteriaToControls[key]) criteriaToControls[key] = [];
        if (!criteriaToControls[key].includes(cid)) criteriaToControls[key].push(cid);
      }
    });

    // Build control → policies map
    controlToPolicies[cid] = (c.linked_policies || "")
      .split(",").map(s => s.trim()).filter(Boolean);
  });

  // Build control → vendors map (via vendor.linked_controls)
  vendors.forEach(v => {
    (v.linked_controls || "").split(",").map(s => s.trim()).filter(Boolean).forEach(cid => {
      if (!controlToVendors[cid]) controlToVendors[cid] = [];
      if (!controlToVendors[cid].includes(v.vendor_id)) controlToVendors[cid].push(v.vendor_id);
    });
  });

  // policy_id → risk_ids[] (from risk.linked_policies)
  const policyToRisks = {};
  risks.forEach(r => {
    (r.linked_policies || "").split(",").map(s => s.trim()).filter(Boolean).forEach(pid => {
      if (!policyToRisks[pid]) policyToRisks[pid] = [];
      if (!policyToRisks[pid].includes(r.risk_id)) policyToRisks[pid].push(r.risk_id);
    });
  });

  // policy_id → vendor_ids[] (via control chain)
  const policyToVendors = {};
  controls.forEach(c => {
    const pids = controlToPolicies[c.control_id] || [];
    const vids = controlToVendors[c.control_id]  || [];
    pids.forEach(pid => {
      if (!policyToVendors[pid]) policyToVendors[pid] = [];
      vids.forEach(vid => {
        if (!policyToVendors[pid].includes(vid)) policyToVendors[pid].push(vid);
      });
    });
  });

  return { criteriaToControls, controlToPolicies, controlToVendors, policyToRisks, policyToVendors };
}

// Resolve which specific entities are impacted given sets of changed IDs
function chResolveImpact({ taskIds = [], controlIds = [], policyIds = [], vendorIds = [], riskIds = [] }) {
  const graph = chBuildDependencyGraph();
  if (!graph) return { policyIds: [], riskIds: [], vendorIds: [] };

  const affectedPolicies = new Set(policyIds);
  const affectedRisks    = new Set(riskIds);
  const affectedVendors  = new Set(vendorIds);
  const allControlIds    = new Set(controlIds);

  // Tasks → criteria → controls
  taskIds.forEach(tid => {
    const task = (typeof COMPLIANCE_TASKS !== "undefined" ? COMPLIANCE_TASKS : [])
      .find(t => t.id === tid);
    if (!task) return;
    const criteria = task.soc2_criteria;
    (graph.criteriaToControls[criteria] || []).forEach(cid => allControlIds.add(cid));
  });

  // Controls → policies + vendors
  allControlIds.forEach(cid => {
    (graph.controlToPolicies[cid] || []).forEach(pid => affectedPolicies.add(pid));
    (graph.controlToVendors[cid]  || []).forEach(vid => affectedVendors.add(vid));
  });

  // Policies → risks + vendors
  affectedPolicies.forEach(pid => {
    (graph.policyToRisks[pid]   || []).forEach(rid => affectedRisks.add(rid));
    (graph.policyToVendors[pid] || []).forEach(vid => affectedVendors.add(vid));
  });

  return {
    policyIds: [...affectedPolicies],
    riskIds:   [...affectedRisks],
    vendorIds: [...affectedVendors],
  };
}

// Resolve impact from a changed onboarding field using category mapping
function chResolveImpactFromFieldChange(fieldName) {
  const data = state?.selectedClientData;
  if (!data) return { riskIds: [], vendorIds: [] };

  const risks   = data?.riskAssessment?.risks  || [];
  const vendors = data?.vendorRisk?.vendors     || [];

  const riskCats   = CH_FIELD_RISK_CATEGORY[fieldName]   || [];
  const vendorCats = CH_FIELD_VENDOR_CATEGORY[fieldName]  || [];

  const affectedRisks = risks
    .filter(r => riskCats.some(cat =>
      (r.category || "").toLowerCase().includes(cat.toLowerCase())
    ))
    .map(r => r.risk_id);

  const affectedVendors = vendors
    .filter(v => vendorCats.some(cat =>
      (v.service_category || "").toLowerCase().includes(cat.toLowerCase()) ||
      (v.business_function || "").toLowerCase().includes(cat.toLowerCase()) ||
      (v.vendor_description || "").toLowerCase().includes(cat.toLowerCase())
    ))
    .map(v => v.vendor_id);

  return { riskIds: affectedRisks, vendorIds: affectedVendors };
}

// ── Targeted regeneration engine ─────────────────────────────

const _chRegenTimers  = {};
const _chRegenInFlight = {};

// Schedule a targeted regen with debounce (collapses rapid changes)
function chScheduleTargetedRegen(clientId, impact) {
  const key = `${clientId}__targeted`;
  // Merge pending impact with any already-queued impact
  _chRegenTimers[key] = _chRegenTimers[key] || {};
  const pending = _chRegenTimers[key];
  pending.riskIds   = [...new Set([...(pending.riskIds   || []), ...(impact.riskIds   || [])])];
  pending.vendorIds = [...new Set([...(pending.vendorIds || []), ...(impact.vendorIds || [])])];
  pending.policyIds = [...new Set([...(pending.policyIds || []), ...(impact.policyIds || [])])];

  clearTimeout(pending._timer);
  pending._timer = setTimeout(() => {
    const merged = { ...pending };
    delete merged._timer;
    _chRegenTimers[key] = {};
    chTriggerTargetedRegen(clientId, merged);
  }, 4000);
}

async function chTriggerTargetedRegen(clientId, impact) {
  const hasWork =
    (impact.riskIds   || []).length > 0 ||
    (impact.vendorIds || []).length > 0 ||
    (impact.policyIds || []).length > 0;
  if (!hasWork) return;

  const key = `${clientId}__targeted__running`;
  if (_chRegenInFlight[key]) return;
  _chRegenInFlight[key] = true;

  try {
    const resp = await fetch(
      `/api/clients/${encodeURIComponent(clientId)}/process-targeted`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(impact) }
    );
    if (!resp.ok) return;
    const data = await resp.json();
    if (data && !data.error && state?.selectedClientId === clientId) {
      Object.assign(state.selectedClientData, data);
      if (typeof renderWorkspaceHeader === "function") renderWorkspaceHeader(state.selectedClientData.client);
      if (typeof renderActivePhase === "function") renderActivePhase();
      if (typeof renderTabs === "function") renderTabs();
    }
  } catch (_) {
  } finally {
    _chRegenInFlight[key] = false;
  }
}

// Legacy: section-level regen (still used for broad section triggers)
function chScheduleSelectiveRegen(clientId, section) {
  const key = `${clientId}__${section}`;
  clearTimeout(_chRegenTimers[key]);
  _chRegenTimers[key] = setTimeout(() => chTriggerSelectiveRegen(clientId, section), 4000);
}

async function chTriggerSelectiveRegen(clientId, section) {
  const key = `${clientId}__${section}`;
  if (_chRegenInFlight[key]) return;
  _chRegenInFlight[key] = true;
  try {
    const resp = await fetch(`/api/clients/${encodeURIComponent(clientId)}/process-${section}`, { method: "POST" });
    if (!resp.ok) return;
    const data = await resp.json();
    if (data && !data.error && state?.selectedClientId === clientId) {
      Object.assign(state.selectedClientData, data);
      if (typeof renderWorkspaceHeader === "function") renderWorkspaceHeader(state.selectedClientData.client);
      if (typeof renderActivePhase === "function") renderActivePhase();
      if (typeof renderTabs === "function") renderTabs();
    }
  } catch (_) {
  } finally {
    _chRegenInFlight[key] = false;
  }
}

// Called by evidence-engine after an evidence item is saved/deleted
// taskIds: the task IDs the evidence was linked to
async function chTriggerAuditRegen(clientId, taskIds = []) {
  // Always run audit QA re-score (fast, no AI)
  chTriggerSelectiveRegen(clientId, "audit");

  // Additionally, resolve which risks/vendors the changed tasks affect
  // and schedule targeted AI enhancement for those items
  if (taskIds.length > 0) {
    const impact = chResolveImpact({ taskIds });
    if (impact.riskIds.length > 0 || impact.vendorIds.length > 0) {
      chScheduleTargetedRegen(clientId, impact);
    }
  }
}

// Public: trigger a single policy AI enhancement
async function chTriggerPolicyRegen(clientId, policyId) {
  return chTriggerTargetedRegen(clientId, { policyIds: [policyId], riskIds: [], vendorIds: [] });
}
