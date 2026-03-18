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

const nav = document.getElementById("phase-nav");
const phaseTitle = document.getElementById("phase-title");
const phaseStatusBadge = document.getElementById("phase-status-badge");
const phaseRequired = document.getElementById("phase-required");
const phaseOutput = document.getElementById("phase-output");
const phaseValidation = document.getElementById("phase-validation");
const phaseGaps = document.getElementById("phase-gaps");

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

selectPhase("phase0");
