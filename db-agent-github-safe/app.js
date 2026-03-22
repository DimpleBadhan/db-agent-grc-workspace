const phases = [
  {
    id: "phase0",
    title: "Phase 0: Onboarding",
    status: "In progress",
    summary: "Templates and frameworks stored. Core operating context is still missing.",
    required: [
      "Company and product context",
      "Assets, data, and systems inventory",
      "Vendor list or vendor categories",
      "Audit scope, timeline, and operating context"
    ],
    output: [
      "Onboarding checklist with received template and framework inputs",
      "Missing inputs list for company, asset, and vendor onboarding",
      "Readiness status showing downstream phases blocked",
      "Assumptions register for SOC 2 working basis"
    ],
    validation: [
      "Policy templates received and stored",
      "ISO 27001 workbook received and stored",
      "SOC 2 basis recorded without local source file",
      "No company-specific policy generation permitted yet"
    ],
    gaps: [
      "No company name, product scope, or data model",
      "No asset inventory or business process map",
      "No vendor inventory",
      "No Type I or Type II timeline supplied"
    ]
  },
  {
    id: "phase1",
    title: "Phase 1: Policy Generation",
    status: "Blocked",
    summary: "Templates exist, but company-specific fields and ownership are missing.",
    required: [
      "Completed onboarding context",
      "Policy owners and approvers",
      "Review cycle expectations",
      "Decision on preserving or rewriting template wording"
    ],
    output: [
      "Policy inventory",
      "Generated policy drafts from user templates",
      "Policy-to-control map",
      "Policy-to-risk map"
    ],
    validation: [
      "No owner means error",
      "No review frequency means error",
      "No linked controls means error",
      "Unresolved placeholders mean error"
    ],
    gaps: [
      "Company-specific language cannot be injected yet",
      "No ownership model supplied",
      "No approver list supplied",
      "No preferred policy formatting instructions"
    ]
  },
  {
    id: "phase2",
    title: "Phase 2: Risk Assessment",
    status: "Blocked",
    summary: "Risk register cannot be generated until assets, data, threats, and owners are onboarded.",
    required: [
      "Critical assets or asset categories",
      "Business processes",
      "Known threats and vulnerabilities",
      "Incident history and recovery requirements"
    ],
    output: [
      "Risk methodology",
      "Risk register",
      "Treatment plan register",
      "Risk-to-control and risk-to-policy maps"
    ],
    validation: [
      "Risk without owner means error",
      "Risk without treatment decision means error",
      "High risk without review date means error",
      "Residual score must be justified by controls"
    ],
    gaps: [
      "No asset inventory available",
      "No business impact data available",
      "No existing control set provided",
      "No accepted-risk register provided"
    ]
  },
  {
    id: "phase3",
    title: "Phase 3: Vendor Assessment",
    status: "Blocked",
    summary: "Third-party risk is blocked until vendor inventory and data access context are provided.",
    required: [
      "Vendor list or categories",
      "Critical vendors and subprocessors",
      "Data access level and service purpose",
      "Available evidence, certifications, and DPA status"
    ],
    output: [
      "Vendor inventory",
      "Vendor assessment records",
      "Vendor risk ratings",
      "Reassessment schedule"
    ],
    validation: [
      "Sensitive data access without assessment means error",
      "No owner means error",
      "No review date means error",
      "Regulated data with no DPA means error"
    ],
    gaps: [
      "No vendor list provided",
      "No contract or DPA status provided",
      "No production integration list",
      "No prior vendor evidence inventory"
    ]
  },
  {
    id: "phase4",
    title: "Phase 4: Control + Framework Mapping",
    status: "Blocked",
    summary: "Mapping cannot finalize before policy, risk, and vendor outputs exist.",
    required: [
      "Approved policy statements",
      "Risk treatment needs",
      "Vendor oversight requirements",
      "Control owners and evidence requirements"
    ],
    output: [
      "Control library",
      "SOC 2 and ISO mapping matrix",
      "Reusable evidence map",
      "Control ownership model"
    ],
    validation: [
      "No mapping means error",
      "No owner means error",
      "No evidence requirement means error",
      "No execution method means error"
    ],
    gaps: [
      "Upstream artifacts not generated yet",
      "No control owner matrix",
      "No test methods defined",
      "SOC 2 will rely on standard structure until audited against final scope"
    ]
  },
  {
    id: "phase5",
    title: "Phase 5: Execution + Evidence Design",
    status: "Blocked",
    summary: "Execution logic is gated on finalized controls and real operating tools.",
    required: [
      "Control library",
      "System and tool ownership",
      "Evidence repository preference",
      "Audit retention expectations"
    ],
    output: [
      "Execution tracker design",
      "Evidence repository structure",
      "Evidence validation rules",
      "Control testing inputs"
    ],
    validation: [
      "Evidence must be time-bound",
      "Evidence must be attributable",
      "Evidence must support the control objective",
      "Weak versus valid evidence must be distinguishable"
    ],
    gaps: [
      "No control execution schedule",
      "No evidence storage pattern",
      "No sample logic defined",
      "No audit retention period supplied"
    ]
  },
  {
    id: "phase6",
    title: "Phase 6: Audit + QA Validation",
    status: "Blocked",
    summary: "Audit simulation depends on the full upstream chain being complete and evidenced.",
    required: [
      "Policies, risks, vendor reviews, controls, and evidence",
      "Testing records",
      "Readiness review criteria",
      "Remediation tracking"
    ],
    output: [
      "Readiness findings",
      "Broken chain report",
      "Audit failure risks",
      "Remediation plan"
    ],
    validation: [
      "Hallucination check",
      "Mapping validator",
      "Evidence validator",
      "Practicality checker"
    ],
    gaps: [
      "No audit evidence exists yet",
      "No remediation tracker exists yet",
      "No formal test samples exist yet",
      "No auditor timeline supplied"
    ]
  },
  {
    id: "phase7",
    title: "Phase 7: Exports + Reporting",
    status: "Blocked",
    summary: "Audit-ready exports depend on validated upstream records.",
    required: [
      "Approved policy set",
      "Risk register",
      "Vendor assessment records",
      "Export branding and scope rules"
    ],
    output: [
      "Policy PDF pack",
      "Risk register export",
      "Vendor assessment export",
      "Clean audit-ready reporting"
    ],
    validation: [
      "Exports need timestamps",
      "Exports need scope labeling",
      "Exports must include DB agent attribution",
      "Formatting must be audit-ready"
    ],
    gaps: [
      "No finalized datasets exist yet",
      "No export engine wired yet",
      "No reporting approvals exist yet",
      "No branding approval beyond DB agent label"
    ]
  }
];

const onboardingSections = [
  {
    key: "company_product_context",
    title: "A. Company / Product Context",
    note: "Core business context that policies, ownership, scope, and control language depend on.",
    requiredFields: [
      "company_name",
      "product_name",
      "product_description",
      "customer_type",
      "industry",
      "deployment_model",
      "hosting_environment",
      "data_handled",
      "sensitive_data_types",
      "key_internal_teams"
    ],
    fields: [
      { id: "company_name", label: "Company name", type: "text" },
      { id: "product_name", label: "Product name", type: "text" },
      { id: "customer_type", label: "Customer type", type: "select", options: ["", "B2B", "Enterprise", "SMB", "Regulated"] },
      { id: "industry", label: "Industry", type: "text" },
      { id: "deployment_model", label: "Deployment model", type: "text", full: true },
      { id: "hosting_environment", label: "Hosting environment", type: "select", options: ["", "AWS", "Azure", "GCP", "On-prem", "Hybrid"] },
      { id: "product_description", label: "Product description", type: "textarea", full: true },
      { id: "data_handled", label: "Data handled", type: "textarea", full: true },
      { id: "sensitive_data_types", label: "Sensitive data types", type: "textarea", full: true },
      { id: "key_internal_teams", label: "Key internal teams", type: "textarea", full: true }
    ]
  },
  {
    key: "compliance_inputs",
    title: "B. Compliance Inputs",
    note: "Source material and current-state artifacts already available for the compliance program.",
    requiredFields: [],
    fields: [
      { id: "existing_controls", label: "Existing controls", type: "textarea", full: true, help: "Describe control spreadsheets, systems, or current control narratives." },
      { id: "existing_risk_register", label: "Existing risk register", type: "textarea", full: true },
      { id: "existing_vendor_list", label: "Existing vendor list", type: "textarea", full: true },
      { id: "existing_evidence_sources", label: "Existing evidence sources", type: "textarea", full: true }
    ],
    staticNote: "Policy templates and ISO 27001 materials are already loaded locally. SOC 2 will use the standard structure as the working basis unless a client-specific source is later provided."
  },
  {
    key: "technical_context",
    title: "C. Technical Context",
    note: "Operational systems and tooling needed for control design, evidence collection, and audit scoping.",
    requiredFields: [
      "cloud_stack",
      "identity_provider",
      "code_repository",
      "ticketing_tool",
      "logging_siem",
      "vulnerability_scanner",
      "backup_dr_tooling"
    ],
    fields: [
      { id: "cloud_stack", label: "Cloud stack", type: "text" },
      { id: "identity_provider", label: "Identity provider", type: "text" },
      { id: "code_repository", label: "Code repository", type: "text" },
      { id: "ticketing_tool", label: "Ticketing tool", type: "text" },
      { id: "hr_system", label: "HR system", type: "text" },
      { id: "logging_siem", label: "Logging / SIEM", type: "text" },
      { id: "vulnerability_scanner", label: "Vulnerability scanner", type: "text" },
      { id: "backup_dr_tooling", label: "Backup / DR tooling", type: "text" }
    ]
  },
  {
    key: "audit_operating_context",
    title: "D. Audit / Operating Context",
    note: "Target audit path and operating maturity drive depth, timing, and evidence expectations.",
    requiredFields: [
      "target_frameworks",
      "desired_audit_timeline",
      "audit_target",
      "countries_regulations_in_scope",
      "maturity_level"
    ],
    fields: [
      { id: "target_frameworks", label: "Target frameworks", type: "select", options: ["", "SOC 2", "ISO 27001", "Both"] },
      { id: "desired_audit_timeline", label: "Desired audit timeline", type: "text" },
      { id: "audit_target", label: "Audit target", type: "select", options: ["", "Type I", "Type II"] },
      { id: "countries_regulations_in_scope", label: "Countries / regulations in scope", type: "textarea", full: true },
      { id: "maturity_level", label: "Maturity level", type: "select", options: ["", "Starting", "Partial", "Mature"] }
    ]
  },
  {
    key: "assets_data_systems",
    title: "E. Assets / Data / Systems",
    note: "Risk assessment and control mapping depend on real assets, real data, and real threat context.",
    requiredFields: [
      "critical_assets_or_asset_categories",
      "business_processes",
      "customer_data_processed",
      "known_threats",
      "known_vulnerabilities",
      "recovery_requirements"
    ],
    fields: [
      { id: "critical_assets_or_asset_categories", label: "Critical assets or asset categories", type: "textarea", full: true },
      { id: "business_processes", label: "Business processes", type: "textarea", full: true },
      { id: "customer_data_processed", label: "Customer data processed", type: "textarea", full: true },
      { id: "employee_data_processed", label: "Employee data processed", type: "textarea", full: true },
      { id: "known_threats", label: "Known threats", type: "textarea", full: true },
      { id: "known_vulnerabilities", label: "Known vulnerabilities", type: "textarea", full: true },
      { id: "incident_history", label: "Incident history", type: "textarea", full: true },
      { id: "recovery_requirements", label: "Recovery requirements", type: "textarea", full: true }
    ]
  },
  {
    key: "vendors",
    title: "F. Vendors",
    note: "Vendor assessment depends on service purpose, data access, and production integration context.",
    requiredFields: [
      "vendor_list_or_categories",
      "critical_vendors",
      "vendors_processing_customer_or_employee_data",
      "subprocessors",
      "vendors_with_production_integration"
    ],
    fields: [
      { id: "vendor_list_or_categories", label: "Vendor list or categories", type: "textarea", full: true },
      { id: "critical_vendors", label: "Critical vendors", type: "textarea", full: true },
      { id: "vendors_processing_customer_or_employee_data", label: "Vendors processing customer or employee data", type: "textarea", full: true },
      { id: "subprocessors", label: "Subprocessors", type: "textarea", full: true },
      { id: "vendors_with_production_integration", label: "Vendors with production integration", type: "textarea", full: true },
      { id: "evidence_already_collected", label: "Evidence already collected", type: "textarea", full: true }
    ]
  }
];

const storageKey = "db-agent-onboarding-v1";

const nav = document.getElementById("phase-nav");
const phaseTitle = document.getElementById("phase-title");
const phaseStatusBadge = document.getElementById("phase-status-badge");
const phaseRequired = document.getElementById("phase-required");
const phaseOutput = document.getElementById("phase-output");
const phaseValidation = document.getElementById("phase-validation");
const phaseGaps = document.getElementById("phase-gaps");
const onboardingForm = document.getElementById("onboarding-form");
const sectionStatusList = document.getElementById("section-status-list");
const readinessTitle = document.getElementById("readiness-title");
const readinessSummary = document.getElementById("readiness-summary");
const readinessBar = document.getElementById("readiness-bar");
const intakePreview = document.getElementById("intake-preview");
const missingGroupsCount = document.getElementById("missing-groups-count");
const copyIntakeButton = document.getElementById("copy-intake");
const downloadIntakeButton = document.getElementById("download-intake");
const resetIntakeButton = document.getElementById("reset-intake");

function renderList(target, items) {
  target.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function selectPhase(phaseId) {
  const phase = phases.find((entry) => entry.id === phaseId) || phases[0];

  phaseTitle.textContent = phase.title;
  phaseStatusBadge.textContent = phase.status;
  renderList(phaseRequired, phase.required);
  renderList(phaseOutput, phase.output);
  renderList(phaseValidation, phase.validation);
  renderList(phaseGaps, phase.gaps);

  document.querySelectorAll(".phase-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.phaseId === phase.id);
  });
}

function createField(field, values) {
  const wrapper = document.createElement("div");
  wrapper.className = `field${field.full ? " full" : ""}`;

  const label = document.createElement("label");
  label.htmlFor = field.id;
  label.textContent = field.label;
  wrapper.appendChild(label);

  let control;

  if (field.type === "textarea") {
    control = document.createElement("textarea");
  } else if (field.type === "select") {
    control = document.createElement("select");
    field.options.forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue || "Select";
      control.appendChild(option);
    });
  } else {
    control = document.createElement("input");
    control.type = "text";
  }

  control.id = field.id;
  control.name = field.id;
  control.value = values[field.id] || "";
  wrapper.appendChild(control);

  if (field.help) {
    const meta = document.createElement("div");
    meta.className = "field-meta";
    meta.textContent = field.help;
    wrapper.appendChild(meta);
  }

  return wrapper;
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

function getFormValues() {
  const data = {};

  onboardingSections.forEach((section) => {
    section.fields.forEach((field) => {
      const control = document.getElementById(field.id);
      data[field.id] = control ? control.value.trim() : "";
    });
  });

  return data;
}

function getSectionCompletion(section, values) {
  if (!section.requiredFields.length) {
    const captured = section.fields.some((field) => values[field.id]);
    return {
      complete: captured,
      completeCount: captured ? section.fields.length : 0,
      totalCount: section.fields.length,
      stateLabel: captured ? "Captured" : "Optional"
    };
  }

  const completeCount = section.requiredFields.filter((fieldId) => values[fieldId]).length;
  const complete = completeCount === section.requiredFields.length;
  const partial = completeCount > 0 && !complete;

  return {
    complete,
    completeCount,
    totalCount: section.requiredFields.length,
    stateLabel: complete ? "Ready" : partial ? "Partial" : "Missing"
  };
}

function getReadiness(values) {
  const sectionStates = onboardingSections.map((section) => ({
    section,
    completion: getSectionCompletion(section, values)
  }));
  const requiredStates = sectionStates.filter((entry) => entry.section.requiredFields.length > 0);
  const completedGroups = requiredStates.filter((entry) => entry.completion.complete).length;
  const missingGroups = requiredStates.filter((entry) => !entry.completion.complete);
  const progress = requiredStates.length ? Math.round((completedGroups / requiredStates.length) * 100) : 0;

  let status = "In progress";
  if (completedGroups === 0) {
    status = "Not started";
  } else if (missingGroups.length === 0) {
    status = "Ready";
  }

  return {
    status,
    progress,
    completedGroups,
    totalGroups: requiredStates.length,
    missingGroupTitles: missingGroups.map((entry) => entry.section.title),
    sectionStates
  };
}

function buildExport(values, readiness) {
  return {
    generated_by: "DB agent",
    export_timestamp: new Date().toISOString(),
    phase: "Phase 0 - Onboarding",
    readiness_status: readiness.status,
    completed_groups: readiness.completedGroups,
    total_groups: readiness.totalGroups,
    missing_groups: readiness.missingGroupTitles,
    assumptions_register: [
      "Policy templates received and retained locally.",
      "ISO 27001 framework material received and retained locally.",
      "SOC 2 mapping basis uses the standard structure until a client-specific source is provided."
    ],
    company_product_context: {
      company_name: values.company_name,
      product_name: values.product_name,
      product_description: values.product_description,
      customer_type: values.customer_type,
      industry: values.industry,
      deployment_model: values.deployment_model,
      hosting_environment: values.hosting_environment,
      data_handled: values.data_handled,
      sensitive_data_types: values.sensitive_data_types,
      key_internal_teams: values.key_internal_teams
    },
    compliance_inputs: {
      policy_templates: "received locally",
      iso_27001_framework_materials: "received locally",
      soc2_basis: "standard structure working basis",
      existing_controls: values.existing_controls,
      existing_risk_register: values.existing_risk_register,
      existing_vendor_list: values.existing_vendor_list,
      existing_evidence_sources: values.existing_evidence_sources
    },
    technical_context: {
      cloud_stack: values.cloud_stack,
      identity_provider: values.identity_provider,
      code_repository: values.code_repository,
      ticketing_tool: values.ticketing_tool,
      hr_system: values.hr_system,
      logging_siem: values.logging_siem,
      vulnerability_scanner: values.vulnerability_scanner,
      backup_dr_tooling: values.backup_dr_tooling
    },
    audit_operating_context: {
      target_frameworks: values.target_frameworks,
      desired_audit_timeline: values.desired_audit_timeline,
      audit_target: values.audit_target,
      countries_regulations_in_scope: values.countries_regulations_in_scope,
      maturity_level: values.maturity_level
    },
    assets_data_systems: {
      critical_assets_or_asset_categories: values.critical_assets_or_asset_categories,
      business_processes: values.business_processes,
      customer_data_processed: values.customer_data_processed,
      employee_data_processed: values.employee_data_processed,
      known_threats: values.known_threats,
      known_vulnerabilities: values.known_vulnerabilities,
      incident_history: values.incident_history,
      recovery_requirements: values.recovery_requirements
    },
    vendors: {
      vendor_list_or_categories: values.vendor_list_or_categories,
      critical_vendors: values.critical_vendors,
      vendors_processing_customer_or_employee_data: values.vendors_processing_customer_or_employee_data,
      subprocessors: values.subprocessors,
      vendors_with_production_integration: values.vendors_with_production_integration,
      evidence_already_collected: values.evidence_already_collected
    }
  };
}

function saveDraft(values) {
  localStorage.setItem(storageKey, JSON.stringify(values));
}

function renderForm() {
  const values = loadDraft();

  onboardingSections.forEach((section) => {
    const block = document.createElement("section");
    block.className = "form-section";
    block.dataset.sectionKey = section.key;

    const head = document.createElement("div");
    head.className = "form-section-head";

    const titleWrap = document.createElement("div");
    const heading = document.createElement("h4");
    heading.textContent = section.title;
    const note = document.createElement("p");
    note.className = "section-note";
    note.textContent = section.note;
    titleWrap.appendChild(heading);
    titleWrap.appendChild(note);

    const chip = document.createElement("div");
    chip.className = "completion-chip";
    chip.id = `chip-${section.key}`;

    head.appendChild(titleWrap);
    head.appendChild(chip);
    block.appendChild(head);

    const fieldGrid = document.createElement("div");
    fieldGrid.className = "field-grid";
    section.fields.forEach((field) => {
      fieldGrid.appendChild(createField(field, values));
    });
    block.appendChild(fieldGrid);

    if (section.staticNote) {
      const staticNote = document.createElement("div");
      staticNote.className = "static-note";
      staticNote.innerHTML = `<strong>Stored status</strong>${section.staticNote}`;
      block.appendChild(staticNote);
    }

    onboardingForm.appendChild(block);
  });
}

function updateDynamicState() {
  const values = getFormValues();
  saveDraft(values);

  const readiness = getReadiness(values);
  const exportData = buildExport(values, readiness);
  const missingCount = readiness.totalGroups - readiness.completedGroups;

  missingGroupsCount.textContent = String(missingCount).padStart(2, "0");
  readinessTitle.textContent = `Phase 0 ${readiness.status.toLowerCase()}`;
  readinessSummary.textContent =
    readiness.status === "Ready"
      ? "Required onboarding groups are complete enough to unblock policy generation."
      : `${readiness.completedGroups} of ${readiness.totalGroups} required onboarding groups are complete. Fill the missing sections before generating policies or controls.`;
  readinessBar.style.width = `${readiness.progress}%`;
  intakePreview.textContent = JSON.stringify(exportData, null, 2);

  sectionStatusList.innerHTML = "";
  readiness.sectionStates.forEach(({ section, completion }) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span>${section.title}</span>
      <span class="status-state">${completion.stateLabel} ${completion.completeCount}/${completion.totalCount}</span>
    `;
    sectionStatusList.appendChild(item);

    const chip = document.getElementById(`chip-${section.key}`);
    if (chip) {
      chip.textContent = `${completion.stateLabel} ${completion.completeCount}/${completion.totalCount}`;
    }
  });

  phases[0].status = readiness.status;
  phases[0].summary =
    readiness.status === "Ready"
      ? "Required onboarding groups are complete. Phase 1 can use the captured context."
      : `${missingCount} onboarding group${missingCount === 1 ? "" : "s"} still missing required data.`;
  phases[0].gaps =
    readiness.missingGroupTitles.length > 0
      ? readiness.missingGroupTitles.map((title) => `${title} is still incomplete.`)
      : ["Required onboarding groups are complete enough to proceed to policy generation."];

  if (document.querySelector(".phase-button.active")?.dataset.phaseId === "phase0") {
    selectPhase("phase0");
  }
}

async function copyIntake() {
  const payload = intakePreview.textContent;

  try {
    await navigator.clipboard.writeText(payload);
    copyIntakeButton.textContent = "Copied";
  } catch {
    copyIntakeButton.textContent = "Copy failed";
  }

  window.setTimeout(() => {
    copyIntakeButton.textContent = "Copy intake JSON";
  }, 1600);
}

function downloadIntake() {
  const blob = new Blob([intakePreview.textContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeCompany = (getFormValues().company_name || "client")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  link.href = url;
  link.download = `db-agent-onboarding-${safeCompany || "client"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function resetIntake() {
  localStorage.removeItem(storageKey);
  onboardingForm.reset();
  updateDynamicState();
}

phases.forEach((phase) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "phase-button";
  button.dataset.phaseId = phase.id;
  button.innerHTML = `
    <strong>${phase.title}</strong>
    <span>${phase.summary}</span>
  `;
  button.addEventListener("click", () => selectPhase(phase.id));
  nav.appendChild(button);
});

renderForm();
onboardingForm.addEventListener("input", updateDynamicState);
copyIntakeButton.addEventListener("click", copyIntake);
downloadIntakeButton.addEventListener("click", downloadIntake);
resetIntakeButton.addEventListener("click", resetIntake);

selectPhase("phase0");
updateDynamicState();
