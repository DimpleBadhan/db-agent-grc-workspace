const phaseConfigs = [
  {
    key: "onboarding",
    label: "Onboarding",
    phase: "Phase 0",
    title: "Client onboarding",
    description:
      "Choose the framework, add the core company and security details, capture the client’s initial vendor list, and add client approvers.",
    property: "onboarding",
    requiredFields: [
      "framework_selection",
      "legal_entity",
      "public_website",
      "business_model",
      "employee_headcount",
      "work_type",
      "company_type",
      "industry",
      "cloud_providers",
      "storage_regions",
      "devices_used",
      "operating_systems",
      "identity_provider",
      "mfa_enabled",
      "access_model",
      "data_types",
      "classification",
      "encryption",
      "backup",
      "monitoring"
    ],
    frameworkField: {
      name: "framework_selection",
      label: "Framework selection",
      type: "select",
      options: ["", "SOC2", "ISO", "Both"]
    },
    groups: [
      {
        title: "Step 2: Company basics",
        note: "Capture the company profile and operating model that policies and assessments should reflect.",
        fields: [
          { name: "legal_entity", label: "Company name / legal entity", type: "text", placeholder: "JJ Beans Inc." },
          { name: "public_website", label: "Company website", type: "text", placeholder: "https://example.com" },
          {
            name: "company_type",
            label: "Company type",
            type: "text",
            placeholder: "Startup, private company, public company, nonprofit"
          },
          { name: "industry", label: "Industry", type: "text", placeholder: "SaaS, Fintech, Healthcare, E-commerce" },
          { name: "employee_headcount", label: "Employee headcount", type: "text", placeholder: "25" },
          {
            name: "work_type",
            label: "Work type",
            type: "select",
            options: ["", "Remote", "Hybrid", "In-person"],
            placeholder: "Remote, Hybrid, In-person"
          },
          {
            name: "business_model",
            label: "What does the company or product do?",
            type: "textarea",
            full: true,
            rows: 4,
            placeholder: "Briefly describe the product, customers, and how the business operates."
          }
        ]
      },
      {
        title: "Step 3: Hosting and access",
        note: "Capture the primary environment, devices, and access model here. Vendor-specific detail should stay in the vendor list.",
        fields: [
          { name: "cloud_providers", label: "Primary hosting provider(s)", type: "text", placeholder: "AWS, Azure, GCP" },
          {
            name: "storage_regions",
            label: "Storage regions",
            type: "text",
            placeholder: "US, EU, APAC, or specific cloud regions"
          },
          {
            name: "devices_used",
            label: "Devices used by the team",
            type: "text",
            placeholder: "Managed laptops, employee laptops, mobile devices"
          },
          {
            name: "operating_systems",
            label: "Operating systems used",
            type: "text",
            placeholder: "macOS, Windows, Linux, iOS, Android"
          },
          { name: "identity_provider", label: "Primary identity provider", type: "text", placeholder: "Okta, Google Workspace, Microsoft Entra" },
          { name: "mfa_enabled", label: "Is MFA enabled?", type: "select", options: ["", "Yes", "No", "Partial"] },
          {
            name: "access_model",
            label: "How is access managed?",
            type: "textarea",
            full: true,
            rows: 3,
            placeholder: "Describe how access is granted, reviewed, and removed."
          }
        ]
      },
      {
        title: "Step 4: Data and security",
        note: "Answer these at a business level. DB Agent uses them to tailor policies and derive risks.",
        fields: [
          {
            name: "data_types",
            label: "What data does the company or product handle?",
            type: "textarea",
            full: true,
            rows: 4,
            placeholder: "Customer account data, employee data, logs, support tickets, payment data, etc."
          },
          {
            name: "classification",
            label: "What sensitive or regulated data is included?",
            type: "textarea",
            full: true,
            rows: 3,
            placeholder: "PII, PHI, payment data, credentials, internal-only information."
          },
          {
            name: "encryption",
            label: "How is data protected?",
            type: "textarea",
            full: true,
            rows: 3,
            placeholder: "Explain encryption, secrets handling, and other protections at a high level."
          },
          {
            name: "backup",
            label: "How do you recover if systems or data fail?",
            type: "textarea",
            full: true,
            rows: 3,
            placeholder: "Describe backups, recovery steps, or disaster recovery arrangements."
          },
          {
            name: "rto_rpo_targets",
            label: "Please provide your documented RTO and RPO targets for critical customer-facing systems, important business systems, and low-criticality or back-office systems, and describe how these targets are validated.",
            type: "textarea",
            full: true,
            rows: 4,
            placeholder: "e.g. Critical systems: RTO 4h / RPO 1h. Important systems: RTO 24h / RPO 4h. Back-office: RTO 72h / RPO 24h. Targets validated via annual DR tests and tabletop exercises."
          },
          {
            name: "monitoring",
            label: "How do you detect issues or security events?",
            type: "textarea",
            full: true,
            rows: 3,
            placeholder: "Explain monitoring, alerting, logging, or incident detection at a high level."
          }
        ]
      },
      {
        title: "Step 5: Security posture",
        note: "Quick yes/no questions that help DB Agent tailor risk assessments and policies without duplicating answers already given above.",
        fields: [
          { name: "publicly_accessible", label: "Is any part of your system publicly accessible from the internet?", type: "select", options: ["", "Yes", "No", "Not sure"] },
          { name: "prod_test_separation", label: "Do you separate production from test or development access?", type: "select", options: ["", "Yes", "No", "Not sure"] },
          { name: "data_leak_impact", label: "Would a data leak significantly impact your customers or business?", type: "select", options: ["", "Yes", "No", "Not sure"] },
          { name: "incident_response_process", label: "If a security incident happened, do you have a defined response process?", type: "select", options: ["", "Yes", "No", "Not sure"] },
          { name: "security_logs_reviewed", label: "Are security logs or alerts reviewed regularly?", type: "select", options: ["", "Yes", "No", "Not sure"] },
          { name: "backups_tested", label: "Are backups tested to confirm recovery works?", type: "select", options: ["", "Yes", "No", "Not sure"] },
          { name: "critical_access_many", label: "Do more than a few people have access to critical systems or sensitive data?", type: "select", options: ["", "Yes", "No", "Not sure"] },
          { name: "prod_changes_reviewed", label: "Can production changes happen without review or approval?", type: "select", options: ["", "Yes", "No", "Not sure"] },
          { name: "compliance_proof_requested", label: "Have customers or partners asked you for security or compliance proof?", type: "select", options: ["", "Yes", "No"] },
          { name: "security_owner", label: "Who is responsible for security or compliance?", type: "text", full: true, placeholder: "e.g. Jane Smith — Head of Engineering" }
        ]
      },
      {
        title: "Step 6: Client approvers",
        note: "Add the people who can own policies or sign them off.",
        custom: "client-users",
        fields: []
      }
    ],
    itemCollection: "vendors",
    itemLabel: "Vendor",
    itemFields: [
      { name: "vendor_name", label: "Vendor name", type: "vendor-autocomplete", placeholder: "AWS, GitHub, Okta, Stripe" },
      { name: "vendor_description", label: "What does this vendor do?", type: "textarea", full: true, rows: 3, placeholder: "Describe the vendor service in plain language." },
      { name: "purpose", label: "How does this client use the vendor?", type: "textarea", full: true, rows: 3, placeholder: "Describe the client-specific purpose or use case.", clientSpecific: true },
      { type: "heading", label: "Data & Access", name: "_h_data" },
      { name: "stores_processes_data", label: "Does this vendor store or process company or customer data?", type: "select", options: ["", "Yes", "No", "Not sure"], clientSpecific: true },
      { name: "data_types_handled", label: "What type of data does this vendor handle?", type: "text", placeholder: "e.g. PII, Financial, Source code, Credentials, Internal", clientSpecific: true },
      { name: "access_level_detail", label: "What level of access does this vendor have to company systems?", type: "select", options: ["", "No access", "Limited", "Admin", "Infrastructure", "Not sure"], clientSpecific: true },
      { type: "heading", label: "Business Criticality", name: "_h_crit" },
      { name: "business_impact", label: "If this vendor became unavailable, how much would it impact the business?", type: "select", full: true, options: ["", "No impact", "Some impact", "Major impact", "Critical"], clientSpecific: true },
      { type: "heading", label: "Legal & Compliance", name: "_h_legal" },
      { name: "has_contract", label: "Is there a signed contract or agreement with this vendor?", type: "select", options: ["", "Yes", "No", "Not sure"], clientSpecific: true },
      { name: "has_dpa", label: "Is there a DPA or data-processing agreement with this vendor?", type: "select", options: ["", "Yes", "No", "Not sure"], clientSpecific: true },
      { name: "vendor_certifications_confirmed", label: "Does this vendor hold SOC 2, ISO 27001, or similar certifications?", type: "select", options: ["", "Yes", "No", "Not sure"], clientSpecific: true }
    ]
  },
  {
    key: "vendor-management",
    label: "Vendor Management",
    phase: "Central section",
    title: "Vendor management",
    description:
      "Maintain the centralized vendor list for this client here. Add, update, or remove vendors as the client stack changes. Changes here feed vendor assessments and trigger downstream updates when needed.",
    property: "onboarding",
    itemCollection: "vendors",
    itemLabel: "Vendor",
    itemFields: [
      { name: "vendor_name", label: "Vendor name", type: "vendor-autocomplete", placeholder: "AWS, GitHub, Okta, Stripe" },
      {
        name: "vendor_description",
        label: "What does this vendor do?",
        type: "textarea",
        full: true,
        rows: 3,
        placeholder: "Describe the vendor service in plain language."
      },
      { name: "purpose", label: "How does this client use the vendor?", type: "textarea", full: true, rows: 3, placeholder: "Describe the client-specific purpose or use case.", clientSpecific: true },
      { type: "heading", label: "Data & Access", name: "_h_data" },
      { name: "stores_processes_data", label: "Does this vendor store or process company or customer data?", type: "select", options: ["", "Yes", "No", "Not sure"], clientSpecific: true },
      { name: "data_types_handled", label: "What type of data does this vendor handle?", type: "text", placeholder: "e.g. PII, Financial, Source code, Credentials, Internal", clientSpecific: true },
      { name: "access_level_detail", label: "What level of access does this vendor have to company systems?", type: "select", options: ["", "No access", "Limited", "Admin", "Infrastructure", "Not sure"], clientSpecific: true },
      { type: "heading", label: "Business Criticality", name: "_h_crit" },
      { name: "business_impact", label: "If this vendor became unavailable, how much would it impact the business?", type: "select", full: true, options: ["", "No impact", "Some impact", "Major impact", "Critical"], clientSpecific: true },
      { type: "heading", label: "Legal & Compliance", name: "_h_legal" },
      { name: "has_contract", label: "Is there a signed contract or agreement with this vendor?", type: "select", options: ["", "Yes", "No", "Not sure"], clientSpecific: true },
      { name: "has_dpa", label: "Is there a DPA or data-processing agreement with this vendor?", type: "select", options: ["", "Yes", "No", "Not sure"], clientSpecific: true },
      { name: "vendor_certifications_confirmed", label: "Does this vendor hold SOC 2, ISO 27001, or similar certifications?", type: "select", options: ["", "Yes", "No", "Not sure"], clientSpecific: true }
    ]
  },
  {
    key: "policy-generation",
    label: "Policy Generation",
    phase: "Phase 1",
    title: "Policy generation",
    description:
      "Policies are generated from the stored templates, selected framework, onboarding details, and DB Agent-derived top risks.",
    property: "policyGeneration",
    metaFields: [
      { name: "template_status", label: "Template status", type: "text" },
      { name: "framework_basis", label: "Framework basis", type: "textarea", full: true }
    ],
    itemCollection: "policies",
    itemLabel: "Policy",
    itemFields: [
      { name: "policy_id", label: "Policy ID", type: "text" },
      { name: "name", label: "Policy name", type: "text" },
      { name: "policy_owner", label: "Policy owner", type: "select", options: () => getClientUserOptions() },
      { name: "sign_off_by", label: "Sign off by", type: "select", options: () => getClientUserOptions() },
      { name: "policy_version", label: "Policy version", type: "text", readonly: true },
      { name: "published", label: "Published", type: "toggle", toggleLabel: "Mark as published" },
      { name: "published_by", label: "Published by", type: "text", readonly: true },
      { name: "published_at", label: "Published at", type: "text", readonly: true },
      { name: "sign_off_complete", label: "Signed off", type: "toggle", toggleLabel: "Mark as signed off" },
      { name: "sign_off_completed_by", label: "Signed off by", type: "text", readonly: true },
      { name: "sign_off_completed_at", label: "Signed off at", type: "text", readonly: true },
      { name: "framework_mapping", label: "Framework mapping", type: "textarea", full: true },
      { name: "linked_risks", label: "Linked risks", type: "text" },
      { name: "linked_controls", label: "Linked controls", type: "text" },
      { name: "metadata_block", label: "Policy metadata", type: "textarea", full: true, rows: 7, readonly: true },
      { name: "executive_summary", label: "Executive summary", type: "textarea", full: true },
      { name: "table_of_contents", label: "Table of contents", type: "textarea", full: true },
      { name: "body", label: "Policy body", type: "textarea", full: true, rows: 18 },
      { name: "approval_history_text", label: "Approval history", type: "textarea", full: true, rows: 6, readonly: true }
    ]
  },
  {
    key: "risk-assessment",
    label: "Risk Assessment",
    phase: "Phase 2",
    title: "Risk assessment",
    description: "Create detailed risks from the onboarding profile and generated policy set.",
    property: "riskAssessment",
    metaFields: [
      { name: "risk_methodology", label: "Risk methodology", type: "text" },
      { name: "policy_summary_ref", label: "Policy summary reference", type: "text" },
      { name: "risk_notes", label: "Risk notes", type: "textarea", full: true }
    ],
    itemCollection: "risks",
    itemLabel: "Risk",
    itemFields: [
      { name: "risk_id", label: "Risk ID", type: "text" },
      { name: "category", label: "Category", type: "text" },
      { name: "asset", label: "Asset", type: "text" },
      { name: "threat", label: "Threat", type: "text" },
      { name: "threat_source", label: "Threat source", type: "text" },
      { name: "vulnerability", label: "Vulnerability", type: "text" },
      { name: "why_this_company", label: "Why this risk applies", type: "textarea", full: true },
      { name: "existing_controls", label: "Existing controls", type: "textarea", full: true },
      { name: "control_gaps", label: "Control gaps", type: "textarea", full: true },
      { name: "impact_description", label: "Impact description", type: "textarea", full: true },
      { name: "likelihood", label: "Likelihood", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "impact", label: "Impact", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "inherent_score", label: "Inherent score", type: "text", readonly: true },
      { name: "inherent_rating", label: "Inherent rating", type: "text", readonly: true },
      { name: "likelihood_justification", label: "Likelihood justification", type: "textarea", full: true },
      { name: "impact_justification", label: "Impact justification", type: "textarea", full: true },
      { name: "residual_likelihood", label: "Residual likelihood", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "residual_impact", label: "Residual impact", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "residual_score", label: "Residual score", type: "text", readonly: true },
      { name: "residual_rating", label: "Residual rating", type: "text", readonly: true },
      { name: "treatment_plan", label: "Treatment plan", type: "textarea", full: true },
      { name: "treatment_action", label: "Treatment action", type: "text" },
      { name: "treatment_owner", label: "Treatment owner", type: "text" },
      { name: "treatment_due", label: "Treatment due", type: "text" },
      { name: "review_date", label: "Review date", type: "text" },
      { name: "linked_policies", label: "Linked policies", type: "text" },
      { name: "linked_controls", label: "Linked controls", type: "text" }
    ]
  },
  {
    key: "vendor-risk",
    label: "Vendor Assessment",
    phase: "Phase 3",
    title: "Vendor assessment",
    description: "Assess vendors after policy approval and risk generation are complete.",
    property: "vendorRisk",
    metaFields: [
      { name: "vendor_methodology", label: "Vendor methodology", type: "text" },
      { name: "risk_register_ref", label: "Risk register reference", type: "text" },
      { name: "vendor_notes", label: "Vendor notes", type: "textarea", full: true }
    ],
    itemCollection: "vendors",
    itemLabel: "Vendor",
    itemFields: [
      { name: "vendor_id", label: "Vendor ID", type: "text" },
      { name: "vendor_name", label: "Vendor name", type: "vendor-autocomplete" },
      { name: "vendor_description", label: "Vendor description", type: "textarea", full: true, rows: 4 },
      { name: "purpose", label: "Purpose", type: "text" },
      { name: "business_function", label: "Business function", type: "text" },
      { name: "service_category", label: "Service category", type: "text" },
      { name: "known_services", label: "Known services / subservices", type: "textarea", full: true, rows: 3 },
      { name: "website", label: "Website", type: "text" },
      { name: "access_level", label: "Access level", type: "text" },
      { name: "data_accessed", label: "Data accessed", type: "textarea", full: true },
      { name: "criticality", label: "Criticality", type: "select", options: ["", "Low", "Medium", "High", "Critical"] },
      { name: "certifications", label: "Certifications", type: "text" },
      { name: "location", label: "Location", type: "text" },
      { name: "inherent_risk", label: "Inherent risk", type: "text", readonly: true },
      { name: "vendor_likelihood", label: "Inherent likelihood", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "vendor_impact", label: "Inherent impact", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "inherent_score", label: "Inherent score", type: "text", readonly: true },
      { name: "residual_risk", label: "Residual risk", type: "text", readonly: true },
      { name: "residual_likelihood", label: "Residual likelihood", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "residual_impact", label: "Residual impact", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "residual_score", label: "Residual score", type: "text", readonly: true },
      { name: "treatment_plan", label: "Treatment plan", type: "textarea", full: true },
      { name: "linked_risks", label: "Linked risks", type: "text" },
      { name: "linked_controls", label: "Linked controls", type: "text" },
      { name: "notes", label: "Risk narrative", type: "textarea", full: true, rows: 4 }
    ]
  }
];

phaseConfigs.push(
  {
    key: "evidence-tracker",
    label: "Evidence Tracker",
    phase: "Audit Readiness",
    title: "Evidence Tracker",
    description: "Track, filter, and validate evidence for every compliance task. Frameworks filter automatically. Overlapping controls are merged. Evidence is scaled to your company size and maturity.",
    property: "evidenceTracker",
    customRender: true
  },
  {
    key: "control-mapping",
    label: "Control Mapping",
    phase: "Phase 4",
    title: "Control mapping",
    description: "Map policies, risks, and vendor outcomes into a unified control library.",
    property: "controlMapping",
    metaFields: [
      { name: "mapping_basis", label: "Mapping basis", type: "textarea", full: true },
      { name: "evidence_standard", label: "Evidence standard", type: "textarea", full: true }
    ],
    itemCollection: "controls",
    itemLabel: "Control",
    itemFields: [
      { name: "control_id", label: "Control ID", type: "text" },
      { name: "description", label: "Description", type: "textarea", full: true },
      { name: "owner", label: "Owner", type: "text" },
      { name: "frequency", label: "Frequency", type: "text" },
      { name: "evidence", label: "Evidence", type: "textarea", full: true },
      { name: "linked_policies", label: "Linked policies", type: "text" },
      { name: "linked_risks", label: "Linked risks", type: "text" },
      { name: "linked_vendors", label: "Linked vendors", type: "text" },
      { name: "framework_mapping", label: "Framework mapping", type: "textarea", full: true }
    ]
  },
  {
    key: "output",
    label: "Output",
    phase: "Phase 6",
    title: "Output",
    description: "Prepare the final dashboard-ready output set.",
    property: "output",
    metaFields: [
      { name: "validation_status", label: "Validation status", type: "text" },
      { name: "output_notes", label: "Output notes", type: "textarea", full: true }
    ],
    itemCollection: "outputs",
    itemLabel: "Output record",
    itemFields: [
      { name: "output_id", label: "Output ID", type: "text" },
      { name: "output_type", label: "Output type", type: "text" },
      { name: "status", label: "Status", type: "text" },
      { name: "linked_policies", label: "Linked policies", type: "text" },
      { name: "linked_risks", label: "Linked risks", type: "text" },
      { name: "linked_vendors", label: "Linked vendors", type: "text" },
      { name: "linked_controls", label: "Linked controls", type: "text" },
      { name: "notes", label: "Notes", type: "textarea", full: true },
      { name: "file_artifacts", label: "Export artifacts", type: "textarea", full: true, rows: 5, readonly: true }
    ]
  },
  {
    key: "intelligence",
    label: "Intelligence",
    phase: "Intelligence",
    title: "Intelligence Centre",
    description: "Real-time quality monitoring, improvement engine, and change detection for all generated outputs.",
    property: null,
    customRender: true
  }
);

const state = {
  clients: [],
  vendorCatalog: [],
  selectedClientId: null,
  selectedClientData: null,
  activePhaseKey: "onboarding",
  evidenceActiveTaskId: null,
  validation: {},
  processing: {
    active: false,
    kind: "",
    startedAt: "",
    error: ""
  },
  aiEnabled: false,
  onboardingEditMode: false,
  selectedPolicyIndex: -1,
  policySearch: "",
  policyFilter: "all",
  policyDetailTab: "overview",
  selectedRiskIndex: -1,
  riskSearch: "",
  riskFilter: "all",
  riskDetailTab: "overview",
  selectedVendorIndex: -1,
  vendorSearch: "",
  vendorFilter: "all",
  vendorDetailTab: "overview",
  selectedControlIndex: -1,
  controlSearch: "",
  controlFilter: "all",
  controlDetailTab: "overview"
};

const hiddenUiPhaseKeys = new Set([]);
const utilitySectionKeys = new Set(["vendor-management"]);
const clientUserRecordFields = [
  { name: "name", label: "Name", type: "text", placeholder: "Jane Doe" },
  { name: "email", label: "Email", type: "text", placeholder: "jane@company.com" },
  { name: "designation", label: "Designation", type: "text", placeholder: "CTO" }
];

function getPhaseConfig(phaseKey) {
  return phaseConfigs.find((entry) => entry.key === phaseKey);
}

const clientCount = document.getElementById("client-count");
const existingClientForm = document.getElementById("existing-client-form");
const existingClientNameInput = document.getElementById("existing-client-name");
const existingClientAction = document.getElementById("existing-client-action");
const existingClientSuggestions = document.getElementById("existing-client-suggestions");
const existingClientHelp = document.getElementById("existing-client-help");
const existingClientStatus = document.getElementById("existing-client-status");
const launcherFeedback = document.getElementById("launcher-feedback");
const createClientForm = document.getElementById("create-client-form");
const newClientNameInput = document.getElementById("new-client-name");
const createClientHelp = document.getElementById("create-client-help");
const emptyState = document.getElementById("empty-state");
const workspaceView = document.getElementById("workspace-view");
const workspaceCompany = document.getElementById("workspace-company");
const workspaceActions = document.getElementById("workspace-actions");
const workspaceStats = document.getElementById("workspace-stats");
const saveStatus = document.getElementById("save-status");
const workflowStatusGrid = document.getElementById("workflow-status-grid");
const tabNav = document.getElementById("tab-nav");
const activeTabPanel = document.getElementById("active-tab-panel");

function setStatus(message, tone = "default") {
  const ts = tone === "success" && message
    ? ` · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "";
  saveStatus.textContent = message + ts;
  saveStatus.dataset.tone = tone;
  if (!workspaceView.classList.contains("hidden")) {
    launcherFeedback.classList.add("hidden");
    launcherFeedback.textContent = "";
    launcherFeedback.dataset.tone = "default";
    return;
  }
  launcherFeedback.textContent = message;
  launcherFeedback.dataset.tone = tone;
  launcherFeedback.classList.toggle("hidden", !isFilled(message));
}

function normalizeClientName(value) {
  return String(value || "").trim().toLowerCase();
}

function findClientByName(name) {
  const normalized = normalizeClientName(name);
  return state.clients.find((client) => normalizeClientName(client.companyName) === normalized) || null;
}

function buildClientUrl(clientId) {
  const url = new URL(window.location.href);
  url.searchParams.set("client", clientId);
  return url.toString();
}

function openUrlInNewTab(url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "hidden";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function renderExistingClientStatus(client) {
  existingClientStatus.innerHTML = "";
  if (!client) {
    existingClientStatus.classList.add("hidden");
    return;
  }

  const stats = client.stats || {};
  existingClientStatus.classList.remove("hidden");
  existingClientStatus.innerHTML = `
    <div class="launcher-status-grid">
      <span class="small-chip">Policies: ${stats.policyCount || 0}</span>
      <span class="small-chip">Risks: ${stats.riskCount || 0}</span>
      <span class="small-chip">Vendors: ${stats.vendorCount || 0}</span>
      <span class="small-chip">Outputs: ${stats.outputCount || 0}</span>
    </div>
  `;
}

function refreshExistingClientUi() {
  const value = existingClientNameInput.value.trim();
  const existingClient = findClientByName(value);
  existingClientAction.textContent = "Open";
  existingClientAction.disabled = !existingClient;

  if (!value) {
    existingClientHelp.textContent = state.clients.length
      ? "Search stored clients and open the selected workspace in a new tab."
      : "No stored clients yet. Create the first client workspace.";
    renderExistingClientStatus(null);
    return;
  }

  existingClientHelp.textContent = existingClient
    ? `${existingClient.companyName} is available. Opening it will create a new browser tab for that client.`
    : `No exact match for "${value}". Use the Create workspace dialog to create a new client.`;
  renderExistingClientStatus(existingClient);
}

function refreshCreateClientUi() {
  const value = newClientNameInput.value.trim();
  const existingClient = findClientByName(value);
  createClientHelp.textContent = !value
    ? "Create a new client workspace in this tab."
    : existingClient
      ? `"${existingClient.companyName}" already exists. Use Open existing client instead of creating a duplicate.`
      : `Create "${value}" as a new client workspace in this tab.`;
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function isFilled(value) {
  return String(value || "").trim().length > 0;
}

function humanizeFieldName(name) {
  return String(name || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getOnboardingFieldLabelMap() {
  const config = getPhaseConfig("onboarding");
  const map = {};
  [config.frameworkField, ...(config.groups || []).flatMap((group) => group.fields || [])].forEach((field) => {
    if (field?.name) {
      map[field.name] = field.label;
    }
  });
  return map;
}

function getCollectionItemErrors(validation, collectionName, index) {
  const fieldErrors = {};
  if (!validation?.errors) {
    return fieldErrors;
  }
  const prefix = `${collectionName}.${index}.`;
  Object.entries(validation.errors).forEach(([key, message]) => {
    if (key.startsWith(prefix)) {
      fieldErrors[key.slice(prefix.length)] = message;
    }
  });
  return fieldErrors;
}

function getOnboardingValidation(onboarding) {
  const config = getPhaseConfig("onboarding");
  const labelMap = getOnboardingFieldLabelMap();
  const errors = {};
  const summary = [];

  const addError = (key, label, message) => {
    if (!errors[key]) {
      errors[key] = message;
      summary.push({ key, label, message });
    }
  };

  config.requiredFields.forEach((fieldName) => {
    if (!isFilled(onboarding?.[fieldName])) {
      addError(fieldName, labelMap[fieldName] || humanizeFieldName(fieldName), "This field is required to finish onboarding.");
    }
  });

  const vendors = Array.isArray(onboarding?.vendors) ? onboarding.vendors : [];
  vendors.forEach((vendor, index) => {
    const hasAnyVendorData = ["vendor_name", "vendor_description", "purpose"].some((field) => isFilled(vendor?.[field]));
    if (!hasAnyVendorData) {
      return;
    }
    if (!isFilled(vendor?.vendor_name)) {
      addError(`vendors.${index}.vendor_name`, `Vendor ${index + 1}: name`, "Enter the vendor name.");
    }
    if (!isFilled(vendor?.vendor_description)) {
      addError(`vendors.${index}.vendor_description`, `Vendor ${index + 1}: description`, "Describe what this vendor does.");
    }
    if (!isFilled(vendor?.purpose)) {
      addError(`vendors.${index}.purpose`, `Vendor ${index + 1}: purpose`, "Explain how this client uses the vendor.");
    }
  });

  const users = getStructuredClientUsers(onboarding || {});
  const completedUsers = users.filter(
    (user) => isFilled(user?.name) && isFilled(user?.email) && isFilled(user?.designation)
  );
  if (!completedUsers.length) {
    addError(
      "client_user_records",
      "Client approvers",
      "Add at least one approver with name, email, and designation."
    );
  }
  users.forEach((user, index) => {
    const hasAnyUserData = ["name", "email", "designation"].some((field) => isFilled(user?.[field]));
    if (!hasAnyUserData) {
      return;
    }
    if (!isFilled(user?.name)) {
      addError(`client_user_records.${index}.name`, `Approver ${index + 1}: name`, "Enter the approver's name.");
    }
    if (!isFilled(user?.email)) {
      addError(`client_user_records.${index}.email`, `Approver ${index + 1}: email`, "Enter the approver's email.");
    }
    if (!isFilled(user?.designation)) {
      addError(
        `client_user_records.${index}.designation`,
        `Approver ${index + 1}: designation`,
        "Enter the approver's designation."
      );
    }
  });

  return {
    valid: summary.length === 0,
    errors,
    summary
  };
}

function toList(value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function countPopulatedFields(data, fields) {
  return fields.filter((name) => isFilled(data?.[name])).length;
}

function parseClientUsers(value) {
  if (Array.isArray(value)) {
    return value
      .map((user, index) => ({
        id: user.id || `client-user-${index + 1}`,
        name: String(user.name || "").trim(),
        email: String(user.email || "").trim(),
        designation: String(user.designation || "").trim()
      }))
      .filter((user) => user.name);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split("|").map((entry) => entry.trim());
      return {
        id: `client-user-${index + 1}`,
        name: parts[0] || "",
        email: parts[1] || "",
        designation: parts[2] || ""
      };
    })
    .filter((user) => user.name);
}

function getStructuredClientUsers(onboarding) {
  if (Array.isArray(onboarding?.client_user_records) && onboarding.client_user_records.length) {
    return parseClientUsers(onboarding.client_user_records);
  }
  return parseClientUsers(onboarding?.client_users || onboarding?.client_usernames || "");
}

function serializeClientUsers(users) {
  return parseClientUsers(users)
    .map((user) => [user.name, user.email, user.designation].join(" | "))
    .join("\n");
}

function getClientUsers() {
  const onboarding = state.selectedClientData?.onboarding || {};
  const users = getStructuredClientUsers(onboarding);
  return Array.from(new Map(users.map((user) => [user.name.toLowerCase(), user])).values());
}

function getClientUsernames() {
  return getClientUsers().map((user) => user.name);
}

function getClientUserOptions() {
  return ["", ...getClientUsernames()];
}

function nonBlankItems(items, fields) {
  return (items || []).filter((item) =>
    fields.some((field) => isFilled(item?.[field.name]))
  );
}

function isToggleEnabled(value) {
  return ["yes", "true", "1", "signed", "signed off", "published"].includes(String(value || "").toLowerCase());
}

function parseScore(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function getScoreBand(score) {
  if (!Number.isInteger(score)) {
    return { label: "Unscored", tone: "default" };
  }
  if (score >= 16) {
    return { label: "Critical", tone: "danger" };
  }
  if (score >= 10) {
    return { label: "High", tone: "warning" };
  }
  if (score >= 5) {
    return { label: "Medium", tone: "default" };
  }
  return { label: "Low", tone: "success" };
}

function getScoreBandLabel(score) {
  return getScoreBand(score).label;
}

function buildVendorRiskLabel(likelihood, impact) {
  if (!Number.isInteger(likelihood) || !Number.isInteger(impact)) {
    return "";
  }
  const score = likelihood * impact;
  return `${getScoreBandLabel(score)} (L${likelihood} x I${impact})`;
}

function getFieldControl(container, fieldName) {
  return container?.querySelector(`[data-field="${fieldName}"]`) || null;
}

function getFieldValue(container, fieldName) {
  const control = getFieldControl(container, fieldName);
  if (!control) {
    return "";
  }
  return control.type === "checkbox" ? (control.checked ? "Yes" : "No") : String(control.value || "").trim();
}

function setFieldValue(container, fieldName, value) {
  const control = getFieldControl(container, fieldName);
  if (!control) {
    return;
  }
  const nextValue = value == null ? "" : String(value);
  if (control.type === "checkbox") {
    control.checked = isToggleEnabled(nextValue);
    return;
  }
  control.value = nextValue;
}

function parseVendorRiskMetric(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(.*?)\s*\(L\s*(\d+)\s*x\s*I\s*(\d+)\s*\)$/i);
  if (!match) {
    return {
      label: text,
      likelihood: null,
      impact: null,
      score: null
    };
  }

  const likelihood = parseScore(match[2]);
  const impact = parseScore(match[3]);
  return {
    label: match[1].trim(),
    likelihood,
    impact,
    score: Number.isInteger(likelihood) && Number.isInteger(impact) ? likelihood * impact : null
  };
}

function decorateVendorRecord(vendor) {
  const inherent = parseVendorRiskMetric(vendor.inherent_risk);
  const residual = parseVendorRiskMetric(vendor.residual_risk);
  const inherentLikelihood = parseScore(vendor.vendor_likelihood) || inherent.likelihood;
  const inherentImpact = parseScore(vendor.vendor_impact) || inherent.impact;
  const residualLikelihood = parseScore(vendor.residual_likelihood) || residual.likelihood;
  const residualImpact = parseScore(vendor.residual_impact) || residual.impact;
  const inherentScore =
    Number.isInteger(inherentLikelihood) && Number.isInteger(inherentImpact)
      ? inherentLikelihood * inherentImpact
      : inherent.score;
  const residualScore =
    Number.isInteger(residualLikelihood) && Number.isInteger(residualImpact)
      ? residualLikelihood * residualImpact
      : residual.score;
  return {
    ...vendor,
    vendor_likelihood: inherentLikelihood ? String(inherentLikelihood) : "",
    vendor_impact: inherentImpact ? String(inherentImpact) : "",
    inherent_score: inherentScore ? String(inherentScore) : "",
    inherent_risk: Number.isInteger(inherentScore) ? buildVendorRiskLabel(inherentLikelihood, inherentImpact) : vendor.inherent_risk || "",
    residual_likelihood: residualLikelihood ? String(residualLikelihood) : "",
    residual_impact: residualImpact ? String(residualImpact) : "",
    residual_score: residualScore ? String(residualScore) : "",
    residual_risk: Number.isInteger(residualScore) ? buildVendorRiskLabel(residualLikelihood, residualImpact) : vendor.residual_risk || ""
  };
}

function inferMatrixPositionFromScore(score) {
  const parsedScore = parseScore(score);
  if (!Number.isInteger(parsedScore) || parsedScore < 1) {
    return { likelihood: null, impact: null };
  }

  const matches = [];
  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    for (let impact = 1; impact <= 5; impact += 1) {
      if (likelihood * impact === parsedScore) {
        matches.push({ likelihood, impact });
      }
    }
  }

  if (!matches.length) {
    return { likelihood: Math.min(parsedScore, 5), impact: 1 };
  }

  matches.sort((left, right) => {
    if (right.impact !== left.impact) {
      return right.impact - left.impact;
    }
    return left.likelihood - right.likelihood;
  });

  return matches[0];
}

function decorateRiskRecord(risk) {
  const inherentLikelihood = parseScore(risk.likelihood);
  const inherentImpact = parseScore(risk.impact);
  const residualLikelihood = parseScore(risk.residual_likelihood);
  const residualImpact = parseScore(risk.residual_impact);
  const inferredResidual = inferMatrixPositionFromScore(risk.residual_score);
  const effectiveResidualLikelihood = residualLikelihood || inferredResidual.likelihood;
  const effectiveResidualImpact = residualImpact || inferredResidual.impact;
  const inherentScore =
    Number.isInteger(inherentLikelihood) && Number.isInteger(inherentImpact)
      ? inherentLikelihood * inherentImpact
      : parseScore(risk.inherent_score);
  const residualScore =
    Number.isInteger(effectiveResidualLikelihood) && Number.isInteger(effectiveResidualImpact)
      ? effectiveResidualLikelihood * effectiveResidualImpact
      : parseScore(risk.residual_score);

  return {
    ...risk,
    likelihood: inherentLikelihood ? String(inherentLikelihood) : risk.likelihood || "",
    impact: inherentImpact ? String(inherentImpact) : risk.impact || "",
    inherent_score: inherentScore ? String(inherentScore) : "",
    inherent_rating: Number.isInteger(inherentScore) ? getScoreBandLabel(inherentScore) : risk.inherent_rating || "",
    residual_likelihood:
      effectiveResidualLikelihood
        ? String(effectiveResidualLikelihood)
        : "",
    residual_impact:
      effectiveResidualImpact
        ? String(effectiveResidualImpact)
          : "",
    residual_score: residualScore ? String(residualScore) : "",
    residual_rating: Number.isInteger(residualScore) ? getScoreBandLabel(residualScore) : risk.residual_rating || ""
  };
}

function buildMatrixCells(records, likelihoodAccessor, impactAccessor) {
  const cells = new Map();
  records.forEach((record) => {
    const likelihood = parseScore(likelihoodAccessor(record));
    const impact = parseScore(impactAccessor(record));
    if (!Number.isInteger(likelihood) || !Number.isInteger(impact)) {
      return;
    }
    const key = `${impact}-${likelihood}`;
    const arr = cells.get(key) || [];
    arr.push(record);
    cells.set(key, arr);
  });
  return cells;
}

function renderRiskSummaryPanel(records, inherentScores, residualScores, kind) {
  const isVendor = kind === "vendor";
  const total = records.length;
  const avgINum = inherentScores.length
    ? inherentScores.reduce((s, v) => s + v, 0) / inherentScores.length : null;
  const avgRNum = residualScores.length
    ? residualScores.reduce((s, v) => s + v, 0) / residualScores.length : null;
  const avgI = avgINum !== null ? avgINum.toFixed(1) : "—";
  const avgR = avgRNum !== null ? avgRNum.toFixed(1) : "—";
  const avgIBand = avgINum !== null ? getScoreBandLabel(Math.round(avgINum)) : "";
  const avgRBand = avgRNum !== null ? getScoreBandLabel(Math.round(avgRNum)) : "";
  const critical = inherentScores.filter(s => s >= 16).length;
  const high     = inherentScores.filter(s => s >= 10 && s < 16).length;
  const medium   = inherentScores.filter(s => s >= 5  && s < 10).length;
  const low      = inherentScores.filter(s => s >= 1  && s < 5).length;

  const card = document.createElement("section");
  card.className = "info-card status-panel tone-default cmat-stats-panel";

  const avgIHtml = avgIBand
    ? `${avgI}<span class="cmat-stat-band cmat-stat-band-${avgIBand.toLowerCase()}">${avgIBand}</span>` : "—";
  const avgRHtml = avgRBand
    ? `${avgR}<span class="cmat-stat-band cmat-stat-band-${avgRBand.toLowerCase()}">${avgRBand}</span>` : "—";

  const stats = [
    { label: isVendor ? "Vendors" : "Risks", value: total,    cls: "",                   raw: true },
    { label: "Avg Inherent",                  value: avgIHtml, cls: "",                   raw: true },
    { label: "Avg Residual",                  value: avgRHtml, cls: "",                   raw: true },
    { label: "Critical", value: critical, cls: "cmat-stat-critical", raw: false },
    { label: "High",     value: high,     cls: "cmat-stat-high",     raw: false },
    { label: "Medium",   value: medium,   cls: "cmat-stat-medium",   raw: false },
    { label: "Low",      value: low,      cls: "cmat-stat-low",      raw: false }
  ];

  const row = document.createElement("div");
  row.className = "cmat-stats-row";
  stats.forEach(s => {
    const item = document.createElement("div");
    item.className = "cmat-stat-item";
    const valSpan = document.createElement("span");
    valSpan.className = `cmat-stat-val ${s.cls}`;
    if (s.raw) valSpan.innerHTML = s.value; else valSpan.textContent = s.value;
    const lblSpan = document.createElement("span");
    lblSpan.className = "cmat-stat-label";
    lblSpan.textContent = s.label;
    item.appendChild(valSpan);
    item.appendChild(lblSpan);
    row.appendChild(item);
  });
  card.appendChild(row);

  // Movement summary (inherent → residual per record)
  const movements = records.map(r => {
    const iS = parseScore(r.inherent_score);
    const rS = parseScore(r.residual_score);
    if (!Number.isInteger(iS) || !Number.isInteger(rS)) return null;
    return rS < iS ? "improved" : rS > iS ? "worsened" : "unchanged";
  }).filter(Boolean);
  const improved  = movements.filter(m => m === "improved").length;
  const unchanged = movements.filter(m => m === "unchanged").length;
  const worsened  = movements.filter(m => m === "worsened").length;
  if (movements.length > 0) {
    const moveRow = document.createElement("div");
    moveRow.className = "cmat-movement-row";
    moveRow.title = "Change from inherent to residual score after controls";
    const label = document.createElement("span");
    label.className = "cmat-move-label";
    label.textContent = "After controls:";
    moveRow.appendChild(label);
    [
      { count: improved,  cls: "cmat-move-improved",  icon: "↓", text: "improved"  },
      { count: unchanged, cls: "cmat-move-unchanged",  icon: "→", text: "unchanged" },
      { count: worsened,  cls: "cmat-move-worsened",   icon: "↑", text: "worsened"  }
    ].filter(s => s.count > 0).forEach(s => {
      const item = document.createElement("span");
      item.className = `cmat-move-item ${s.cls}`;
      item.innerHTML = `${s.icon} <strong>${s.count}</strong> ${s.text}`;
      moveRow.appendChild(item);
    });
    card.appendChild(moveRow);
  }

  // Stacked severity bar
  const scored = critical + high + medium + low;
  if (scored > 0) {
    const barWrap = document.createElement("div");
    barWrap.className = "cmat-severity-bar";
    barWrap.title = `Critical: ${critical} · High: ${high} · Medium: ${medium} · Low: ${low}`;
    [
      { count: critical, cls: "sev-critical", label: `Critical: ${critical}` },
      { count: high,     cls: "sev-high",     label: `High: ${high}` },
      { count: medium,   cls: "sev-medium",   label: `Medium: ${medium}` },
      { count: low,      cls: "sev-low",      label: `Low: ${low}` }
    ].filter(s => s.count > 0).forEach(s => {
      const seg = document.createElement("div");
      seg.className = `cmat-sev-seg ${s.cls}`;
      seg.style.width = `${(s.count / scored * 100).toFixed(1)}%`;
      seg.title = s.label;
      barWrap.appendChild(seg);
    });
    card.appendChild(barWrap);
  }

  return card;
}

function renderHeatmapCard(title, records, likelihoodAccessor, impactAccessor) {
  // Legacy — kept for backward compatibility; use renderDualRiskMatrix for new panels
  return renderDualRiskMatrix(title, records, likelihoodAccessor, impactAccessor, null, null);
}

function renderSingleCompactMatrix(records, likelihoodAccessor, impactAccessor, nameAccessor) {
  const impactFullLabels    = ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"];
  const likelihoodFullLabels = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];
  const impactShortLabels    = ["NEG", "MIN", "MOD", "MAJ", "CAT"]; // index 0=I1 … 4=I5
  const likelihoodShortLabels = ["RARE", "UNLIK", "POSS", "LIKE", "A.C."]; // index 0=L1 … 4=L5

  const cells = buildMatrixCells(records, likelihoodAccessor, impactAccessor);
  const wrap = document.createElement("div");
  wrap.className = "cmat-wrap";

  // Y-axis label
  const yLabel = document.createElement("div");
  yLabel.className = "cmat-y-label";
  yLabel.textContent = "IMPACT";
  wrap.appendChild(yLabel);

  const inner = document.createElement("div");
  inner.className = "cmat-inner";
  wrap.appendChild(inner);

  // Y-axis labels (Catastrophic → Negligible)
  const yNums = document.createElement("div");
  yNums.className = "cmat-y-nums";
  for (let i = 5; i >= 1; i--) {
    const n = document.createElement("span");
    n.textContent = impactShortLabels[i - 1]; // CAT at i=5, NEG at i=1
    n.title = impactFullLabels[i - 1];
    yNums.appendChild(n);
  }
  inner.appendChild(yNums);

  const gridCol = document.createElement("div");
  gridCol.className = "cmat-grid-col";
  inner.appendChild(gridCol);

  // Grid
  const grid = document.createElement("div");
  grid.className = "cmat-grid";
  for (let impact = 5; impact >= 1; impact--) {
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      const score = impact * likelihood;
      const band = getScoreBand(score);
      const recs = cells.get(`${impact}-${likelihood}`) || [];
      const count = recs.length;
      const cell = document.createElement("div");
      cell.className = `cmat-cell cmat-${band.label.toLowerCase()}`;
      const iLabel = impactFullLabels[impact - 1];
      const lLabel = likelihoodFullLabels[likelihood - 1];
      const names = nameAccessor && recs.length > 0
        ? "\n" + recs.map(r => "• " + (nameAccessor(r) || "Unknown")).join("\n")
        : "";
      cell.title = `${lLabel} × ${iLabel} = ${score} (${band.label})${names}`;
      if (count > 0) {
        const badge = document.createElement("span");
        badge.className = "cmat-badge";
        badge.textContent = count;
        cell.appendChild(badge);
      }
      grid.appendChild(cell);
    }
  }
  gridCol.appendChild(grid);

  // X-axis labels (Rare → Almost Certain)
  const xNums = document.createElement("div");
  xNums.className = "cmat-x-nums";
  for (let i = 1; i <= 5; i++) {
    const n = document.createElement("span");
    n.textContent = likelihoodShortLabels[i - 1];
    n.title = likelihoodFullLabels[i - 1];
    xNums.appendChild(n);
  }
  gridCol.appendChild(xNums);

  // X-axis label
  const xLabel = document.createElement("div");
  xLabel.className = "cmat-x-label";
  xLabel.textContent = "LIKELIHOOD";
  gridCol.appendChild(xLabel);

  return wrap;
}

function renderDualRiskMatrix(title, records, iLAccessor, iIAccessor, rLAccessor, rIAccessor, nameAccessor) {
  const card = document.createElement("section");
  card.className = "info-card status-panel tone-default cmat-panel";

  // Header
  const head = document.createElement("div");
  head.className = "panel-head compact";
  const titleNode = document.createElement("h4");
  titleNode.textContent = title || "Risk Matrix";
  head.appendChild(titleNode);
  // Legend chips
  const legend = document.createElement("div");
  legend.className = "cmat-legend";
  [
    { key: "critical", label: "Critical ≥16" },
    { key: "high",     label: "High 10–15" },
    { key: "medium",   label: "Medium 5–9" },
    { key: "low",      label: "Low 1–4" }
  ].forEach(b => {
    const chip = document.createElement("span");
    chip.className = `cmat-legend-chip cmat-legend-${b.key}`;
    chip.textContent = b.label;
    legend.appendChild(chip);
  });
  head.appendChild(legend);
  card.appendChild(head);

  const body = document.createElement("div");
  body.className = rLAccessor ? "cmat-dual-body" : "cmat-solo-body";
  card.appendChild(body);

  // Inherent matrix
  const iWrap = document.createElement("div");
  iWrap.className = "cmat-half";
  const iTitle = document.createElement("p");
  iTitle.className = "cmat-half-title";
  iTitle.textContent = rLAccessor ? "Inherent Risk" : title;
  iWrap.appendChild(iTitle);
  iWrap.appendChild(renderSingleCompactMatrix(records, iLAccessor, iIAccessor, nameAccessor));
  body.appendChild(iWrap);

  if (rLAccessor) {
    // Arrow — styled with accent color to draw the eye
    const arrow = document.createElement("div");
    arrow.className = "cmat-arrow";
    arrow.innerHTML = `<svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>After<br>Controls</span>`;
    body.appendChild(arrow);

    // Residual matrix
    const rWrap = document.createElement("div");
    rWrap.className = "cmat-half";
    const rTitle = document.createElement("p");
    rTitle.className = "cmat-half-title cmat-residual-title";
    rTitle.textContent = "Residual Risk";
    rWrap.appendChild(rTitle);
    rWrap.appendChild(renderSingleCompactMatrix(records, rLAccessor, rIAccessor, nameAccessor));
    body.appendChild(rWrap);
  }

  return card;
}

function renderScoreSummaryCard(title, rows) {
  const card = document.createElement("section");
  card.className = "info-card status-panel tone-default";
  const head = document.createElement("div");
  head.className = "panel-head compact";
  const titleNode = document.createElement("h4");
  titleNode.textContent = title;
  head.appendChild(titleNode);
  card.appendChild(head);

  const stack = document.createElement("div");
  stack.className = "metric-stack";
  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "metric-row";
    item.innerHTML = `<span>${row.label}</span><strong>${row.value}</strong>`;
    stack.appendChild(item);
  });
  card.appendChild(stack);
  return card;
}

function buildDownloadApiUrl(path) {
  return `/api/download?mode=blob&path=${encodeURIComponent(path)}`;
}

function base64ToBlob(base64, contentType = "application/octet-stream") {
  const binary = atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: contentType });
}

function getDownloadFilenameFromDisposition(disposition, fallbackName) {
  if (!disposition) {
    return fallbackName;
  }

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallbackName;
}

async function downloadArtifact(path) {
  if (!path) {
    setStatus("No export file is available for download yet.", "error");
    return;
  }

  setStatus("Preparing download...");
  const response = await fetch(buildDownloadApiUrl(path));
  if (!response.ok) {
    throw new Error((await response.text()) || "Download request failed");
  }

  const fallbackFileName = path.split(/[/\\]/).pop() || "download";
  const contentType = response.headers.get("content-type") || "";
  const disposition = response.headers.get("content-disposition") || "";
  let fileName = getDownloadFilenameFromDisposition(disposition, fallbackFileName);
  let blob;

  if (contentType.includes("application/json")) {
    const payload = await response.json();
    fileName = payload.file_name || fileName;
    blob = base64ToBlob(payload.base64, payload.content_type);
  } else {
    blob = await response.blob();
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  setStatus(`${fileName} downloaded.`, "success");
}

// ── Browser-side export helpers ──────────────────────────────────────────────

function triggerBrowserDownload(content, filename, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(value) {
  const str = String(value == null ? "" : value).replace(/\r?\n/g, " ").replace(/"/g, '""');
  return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
}

function arrayToCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

function exportRisksCsv(clientData) {
  const risks = clientData?.riskAssessment?.risks || [];
  if (!risks.length) { setStatus("No risk data available to export.", "error"); return; }
  const company = clientData?.onboarding?.legal_entity || "Client";
  const header = ["Risk ID","Threat","Category","Likelihood","Impact","Inherent Score","Inherent Rating","Residual Score","Residual Rating","Treatment","Control Gaps","Linked Policies","Why This Company","Treatment Plan"];
  const rows = [header, ...risks.map((r) => [
    r.risk_id, r.threat, r.category, r.likelihood, r.impact,
    r.inherent_score, r.inherent_risk, r.residual_score, r.residual_risk,
    r.treatment, r.control_gaps, r.linked_policies, r.why_this_company, r.treatment_plan
  ])];
  triggerBrowserDownload(arrayToCsv(rows), `${company} - Risk Register.csv`, "text/csv;charset=utf-8");
  setStatus("Risk register downloaded.", "success");
}

function exportVendorsCsv(clientData) {
  const vendors = clientData?.vendorRisk?.vendors || [];
  if (!vendors.length) { setStatus("No vendor data available to export.", "error"); return; }
  const company = clientData?.onboarding?.legal_entity || "Client";
  const header = ["Vendor ID","Vendor Name","Purpose","Business Function","Service Category","Criticality","Access Level","Data Accessed","Certifications","Location","Inherent Risk","Inherent Score","Residual Risk","Residual Score","Has Contract","Has DPA","Treatment Plan","Linked Risks","Notes"];
  const rows = [header, ...vendors.map((v) => [
    v.vendor_id, v.vendor_name, v.purpose, v.business_function, v.service_category,
    v.criticality, v.access_level, v.data_accessed, v.certifications, v.location,
    v.inherent_risk, v.inherent_score, v.residual_risk, v.residual_score,
    v.has_contract, v.has_dpa, v.treatment_plan, v.linked_risks, v.notes
  ])];
  triggerBrowserDownload(arrayToCsv(rows), `${company} - Vendor Register.csv`, "text/csv;charset=utf-8");
  setStatus("Vendor register downloaded.", "success");
}

function exportControlsCsv(clientData) {
  const controls = clientData?.controlMapping?.controls || [];
  if (!controls.length) { setStatus("No control mapping data available to export.", "error"); return; }
  const company = clientData?.onboarding?.legal_entity || "Client";
  const header = ["Control ID","Description","Owner","Frequency","Evidence","Linked Policies","Linked Risks","Linked Vendors","Framework Mapping"];
  const rows = [header, ...controls.map((c) => [
    c.control_id, c.description, c.owner, c.frequency, c.evidence,
    c.linked_policies, c.linked_risks, c.linked_vendors, c.framework_mapping
  ])];
  triggerBrowserDownload(arrayToCsv(rows), `${company} - Control Mapping.csv`, "text/csv;charset=utf-8");
  setStatus("Control mapping downloaded.", "success");
}

async function exportPoliciesZip(clientData) {
  const policies = (clientData?.policyGeneration?.policies || []).filter(p => isFilled(p.body));
  if (!policies.length) { setStatus("No policy data available to export.", "error"); return; }

  const company   = clientData?.onboarding?.legal_entity || "Client";
  const framework = clientData?.onboarding?.framework_selection || "";
  const exportDate = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  if (typeof JSZip === "undefined" || typeof window.jspdf === "undefined") {
    setStatus("PDF libraries not loaded — check internet connection and reload.", "error");
    return;
  }

  setStatus(`Building PDF pack for ${policies.length} policies...`);
  const { jsPDF } = window.jspdf;
  const zip = new JSZip();

  // ── Page geometry ────────────────────────────────────────────────────────
  const PW = 210, PH = 297;
  const ML = 20, MR = 20, MT = 20, MB = 16;
  const TW = PW - ML - MR;

  // ── Colors ───────────────────────────────────────────────────────────────
  const C = {
    headerBg:   [18, 24, 42],
    headerText: [255, 255, 255],
    coName:     [140, 160, 210],
    accent:     [64, 120, 220],
    h1:         [18, 30, 70],
    h2:         [32, 52, 110],
    h3:         [55, 75, 130],
    body:       [35, 42, 58],
    meta:       [100, 116, 150],
    metaVal:    [35, 42, 58],
    bullet:     [64, 120, 220],
    rule:       [210, 218, 232],
    footer:     [150, 160, 180],
    fwBg:       [240, 244, 252]
  };

  function setColor(doc, rgb, kind = "text") {
    if (kind === "fill") doc.setFillColor(...rgb);
    else if (kind === "draw") doc.setDrawColor(...rgb);
    else doc.setTextColor(...rgb);
  }

  // ── Line classifier ──────────────────────────────────────────────────────
  function classifyLine(line) {
    const t = line.trimEnd();
    if (!t.trim()) return { type: "blank" };
    // Markdown headings
    if (/^###\s+/.test(t)) return { type: "h3", text: t.replace(/^###\s+/, "").trim() };
    if (/^##\s+/.test(t))  return { type: "h2", text: t.replace(/^##\s+/, "").trim() };
    if (/^#\s+/.test(t))   return { type: "h1", text: t.replace(/^#\s+/, "").trim() };
    // Numbered sections: "1. Title", "12. Title"  (top-level section)
    // Only a heading if short (≤55 chars of body text) and doesn't end with sentence punctuation
    const h1m = t.match(/^(\d+)\.\s+(.+)$/);
    if (h1m && !/^\d+\.\d/.test(t)) {
      const bodyText = h1m[2];
      const isHeading = bodyText.length <= 55 && !/[.!?]$/.test(bodyText.trimEnd());
      return isHeading ? { type: "h1", text: t.trim() } : { type: "para", text: t.trim() };
    }
    // Sub-sections: "1.1 Title", "1.1.1 Title"
    const h2m = t.match(/^(\d+\.\d+)\s+(.+)$/);
    if (h2m && !/^\d+\.\d+\.\d/.test(t)) return { type: "h2", text: t.trim() };
    const h3m = t.match(/^(\d+\.\d+\.\d+)\s+(.+)$/);
    if (h3m) return { type: "h3", text: t.trim() };
    // Real bullets only: lines starting with - or •
    if (/^[-•]\s+/.test(t)) return { type: "bullet", text: t.replace(/^[-•]\s+/, "").trim() };
    // Everything else is a paragraph
    return { type: "para", text: t.trim() };
  }

  // ── Page-break guard ─────────────────────────────────────────────────────
  function checkPage(doc, y, needed) {
    if (y + needed > PH - MB - 6) { doc.addPage(); return MT; }
    return y;
  }

  // ── Main PDF builder ─────────────────────────────────────────────────────
  function buildPolicyPdf(policy, policyIndex) {
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const name   = policy.name || policy.policy_id || `Policy ${policyIndex + 1}`;
    const polId  = policy.policy_id || `POL-${String(policyIndex + 1).padStart(3, "0")}`;
    const owner  = policy.policy_owner || "Unassigned";
    const ver    = policy.version || "1.0";
    const status = policy.published ? "Published" : "Draft";
    const fwMap  = (policy.framework_mapping || "").trim();

    // ── COVER HEADER ────────────────────────────────────────────────────────
    const HEADER_H = 52;
    setColor(doc, C.headerBg, "fill");
    doc.rect(0, 0, PW, HEADER_H, "F");

    // Thin accent stripe at top
    setColor(doc, C.accent, "fill");
    doc.rect(0, 0, PW, 2.5, "F");

    // CONFIDENTIAL label top-right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(doc, C.coName);
    doc.text("CONFIDENTIAL", PW - MR, 11, { align: "right" });

    // Company name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setColor(doc, C.coName);
    doc.text(company.toUpperCase(), ML, 11);

    // Policy title — large, white, wrapping
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    setColor(doc, C.headerText);
    const titleLines = doc.splitTextToSize(name, TW);
    // If title would overflow 2 lines, reduce size
    const titleFontSize = titleLines.length > 2 ? 13 : 16;
    doc.setFontSize(titleFontSize);
    const finalTitleLines = doc.splitTextToSize(name, TW);
    doc.text(finalTitleLines, ML, 25);

    // Bottom accent line inside header
    setColor(doc, [40, 60, 110], "draw");
    doc.setLineWidth(0.3);
    doc.line(0, HEADER_H, PW, HEADER_H);

    // ── METADATA BAND ───────────────────────────────────────────────────────
    setColor(doc, [246, 248, 253], "fill");
    doc.rect(0, HEADER_H, PW, 22, "F");

    const metaItems = [
      ["POLICY ID", polId],
      ["OWNER", owner],
      ["VERSION", ver],
      ["STATUS", status],
      ["DATE", exportDate]
    ];
    const colW = TW / metaItems.length;
    metaItems.forEach(([label, val], i) => {
      const x = ML + i * colW;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(doc, C.meta);
      doc.text(label, x, HEADER_H + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setColor(doc, C.metaVal);
      const valLines = doc.splitTextToSize(String(val), colW - 3);
      doc.text(valLines[0], x, HEADER_H + 14);
    });

    // Framework mapping strip
    let y = HEADER_H + 22;
    if (fwMap) {
      setColor(doc, C.fwBg, "fill");
      doc.rect(0, y, PW, 10, "F");
      setColor(doc, C.rule, "draw");
      doc.setLineWidth(0.15);
      doc.line(0, y, PW, y);
      doc.line(0, y + 10, PW, y + 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(doc, C.meta);
      doc.text("FRAMEWORK / STANDARD:  ", ML, y + 6.5);
      const fwLabelW = doc.getTextWidth("FRAMEWORK / STANDARD:  ");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setColor(doc, C.h2);
      const fwCapped = fwMap.length > 160 ? fwMap.substring(0, 157) + "…" : fwMap;
      doc.text(fwCapped, ML + fwLabelW, y + 6.5);
      y += 10;
    }

    // Divider before body
    setColor(doc, C.rule, "draw");
    doc.setLineWidth(0.2);
    doc.line(ML, y + 4, PW - MR, y + 4);
    y += 12;

    // ── BODY TEXT ───────────────────────────────────────────────────────────
    const lines = (policy.body || "").split(/\r?\n/);
    let prevType = "blank";

    for (const rawLine of lines) {
      const { type, text } = classifyLine(rawLine);

      if (type === "blank") {
        y += prevType === "blank" ? 0 : 2.5;
        y = checkPage(doc, y, 0);
        prevType = "blank";
        continue;
      }

      if (type === "h1") {
        // Spacing before section header
        if (prevType !== "blank" && prevType !== "h1") y += 6;
        y = checkPage(doc, y, 14);
        // Left accent bar
        const barH = 8;
        setColor(doc, C.accent, "fill");
        doc.rect(ML - 6, y - barH + 2, 2.5, barH, "F");
        // Heading text — helvetica bold, navy
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        setColor(doc, C.h1);
        const wrapped = doc.splitTextToSize(text, TW - 2);
        doc.text(wrapped, ML, y);
        // Subtle full-width rule below
        setColor(doc, C.rule, "draw");
        doc.setLineWidth(0.25);
        doc.line(ML, y + 2.5, ML + TW, y + 2.5);
        y += wrapped.length * 6 + 4;
        prevType = "h1";
        continue;
      }

      if (type === "h2") {
        if (prevType !== "blank") y += 4;
        y = checkPage(doc, y, 10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        setColor(doc, C.h2);
        const wrapped = doc.splitTextToSize(text, TW);
        doc.text(wrapped, ML, y);
        // Thin underline only on h2 subsections
        setColor(doc, [200, 212, 235], "draw");
        doc.setLineWidth(0.2);
        doc.line(ML, y + 1.5, ML + Math.min(doc.getTextWidth(wrapped[0]), TW * 0.6), y + 1.5);
        y += wrapped.length * 5.5 + 2;
        prevType = "h2";
        continue;
      }

      if (type === "h3") {
        if (prevType !== "blank") y += 2;
        y = checkPage(doc, y, 8);
        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(9);
        setColor(doc, C.h3);
        const wrapped = doc.splitTextToSize(text, TW);
        doc.text(wrapped, ML, y);
        y += wrapped.length * 5 + 1.5;
        prevType = "h3";
        continue;
      }

      if (type === "bullet") {
        y = checkPage(doc, y, 8);
        const bx = ML + 5;
        const btw = TW - 8;
        const wrapped = doc.splitTextToSize(text, btw);
        if (y + wrapped.length * 5.4 > PH - MB - 6) { doc.addPage(); y = MT; }
        // Bullet dot
        setColor(doc, C.accent);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("•", ML, y);
        // Bullet text — times for readability
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        setColor(doc, C.body);
        doc.text(wrapped, bx, y);
        y += wrapped.length * 5.4 + 1.5;
        prevType = "bullet";
        continue;
      }

      if (type === "para") {
        y = checkPage(doc, y, 8);
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        setColor(doc, C.body);
        const wrapped = doc.splitTextToSize(text, TW);
        if (y + wrapped.length * 5.4 > PH - MB - 6) { doc.addPage(); y = MT; }
        doc.text(wrapped, ML, y);
        y += wrapped.length * 5.4 + 1.5;
        prevType = "para";
      }
    }

    // ── FOOTER ON ALL PAGES ─────────────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let pg = 1; pg <= totalPages; pg++) {
      doc.setPage(pg);
      setColor(doc, C.rule, "draw");
      doc.setLineWidth(0.2);
      doc.line(ML, PH - MB, PW - MR, PH - MB);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setColor(doc, C.footer);
      doc.text(`${company}  ·  ${name}  ·  CONFIDENTIAL`, ML, PH - MB + 5);
      doc.text(`Page ${pg} of ${totalPages}`, PW - MR, PH - MB + 5, { align: "right" });
    }

    return doc.output("arraybuffer");
  }

  // ── ZIP all PDFs ─────────────────────────────────────────────────────────
  try {
    for (let i = 0; i < policies.length; i++) {
      setStatus(`Generating PDFs... (${i + 1} / ${policies.length})`);
      await new Promise(r => setTimeout(r, 0));
      const pdfBytes = buildPolicyPdf(policies[i], i);
      const safeName = (policies[i].name || policies[i].policy_id || `Policy-${i + 1}`)
        .replace(/[^a-zA-Z0-9 \-_]/g, "").trim().substring(0, 60) || `Policy-${i + 1}`;
      zip.file(`${String(i + 1).padStart(2, "0")} - ${safeName}.pdf`, pdfBytes);
    }

    setStatus("Compressing ZIP...");
    await new Promise(r => setTimeout(r, 0));
    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${company} - Policy Pack.zip`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setStatus(`Downloaded — ${policies.length} PDFs in ZIP.`, "success");
  } catch (err) {
    setStatus("PDF export failed: " + err.message, "error");
    console.error("PDF export error:", err);
  }
}

function renderBrowserDownloadCard(title, buttons) {
  const card = document.createElement("section");
  card.className = "info-card status-panel tone-default";
  const head = document.createElement("div");
  head.className = "panel-head compact";
  const titleNode = document.createElement("h4");
  titleNode.textContent = title;
  head.appendChild(titleNode);
  card.appendChild(head);
  const row = document.createElement("div");
  row.className = "download-button-row";
  buttons.forEach(({ label, onClick, ghost }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `action-button${ghost ? " ghost" : ""}`;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    row.appendChild(btn);
  });
  card.appendChild(row);
  return card;
}

// ── End browser-side export helpers ──────────────────────────────────────────

function renderArtifactLinks(paths) {
  const LINK_TYPE_COLORS = {
    PDF:  "color:#f04060", XLSX: "color:#00c5a7", CSV: "color:#00c5a7",
    DOCX: "color:#4fa3e0", JSON: "color:#f0a030", ZIP: "color:#8b5cf6"
  };
  const wrapper = document.createElement("div");
  wrapper.className = "artifact-links";
  paths.forEach((path) => {
    const fileName = path.split(/[/\\]/).pop() || path;
    const ext = (fileName.split(".").pop() || "").toUpperCase();
    const tc = LINK_TYPE_COLORS[ext] || "color:#8ba5c5";
    const link = document.createElement("a");
    link.className = "artifact-link";
    link.href = "#";
    link.innerHTML = `${fileName} <span class="dl-type-badge" style="background:rgba(255,255,255,0.06);${tc};border:1px solid rgba(255,255,255,0.1)">${ext}</span>`;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      downloadArtifact(path).catch((error) => setStatus(`Download failed: ${error.message}`, "error"));
    });
    wrapper.appendChild(link);
  });
  return wrapper;
}

function getOutputArtifactPaths(outputType) {
  const outputs = state.selectedClientData?.output?.outputs || [];
  const match = outputs.find((output) => String(output.output_type || "").toLowerCase() === String(outputType || "").toLowerCase());
  if (!match || !isFilled(match.file_artifacts)) {
    return [];
  }
  return String(match.file_artifacts)
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function findArtifactBySuffix(paths, suffix) {
  return paths.find((path) => path.toLowerCase().endsWith(suffix.toLowerCase())) || "";
}

function renderDownloadButtons(title, buttons) {
  const card = document.createElement("section");
  card.className = "info-card status-panel tone-default";
  const head = document.createElement("div");
  head.className = "panel-head compact";
  const titleNode = document.createElement("h4");
  titleNode.textContent = title;
  head.appendChild(titleNode);
  card.appendChild(head);

  const row = document.createElement("div");
  row.className = "download-button-row";

  const DL_TYPE_COLORS = {
    PDF:  { bg: "rgba(240,64,96,0.12)",   color: "#f04060", border: "rgba(240,64,96,0.30)" },
    XLSX: { bg: "rgba(0,197,167,0.12)",    color: "#00c5a7", border: "rgba(0,197,167,0.30)" },
    CSV:  { bg: "rgba(0,197,167,0.12)",    color: "#00c5a7", border: "rgba(0,197,167,0.30)" },
    DOCX: { bg: "rgba(79,163,224,0.12)",   color: "#4fa3e0", border: "rgba(79,163,224,0.30)" },
    JSON: { bg: "rgba(240,160,48,0.12)",   color: "#f0a030", border: "rgba(240,160,48,0.30)" },
    ZIP:  { bg: "rgba(139,92,246,0.12)",   color: "#8b5cf6", border: "rgba(139,92,246,0.30)" },
  };

  buttons
    .filter((button) => button.path)
    .forEach((button) => {
      const ext = (button.path.split(".").pop() || "").toUpperCase();
      const tc = DL_TYPE_COLORS[ext] || { bg: "rgba(107,132,160,0.12)", color: "#8ba5c5", border: "rgba(107,132,160,0.25)" };
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = `action-button${button.ghost ? " ghost" : ""}`;
      trigger.innerHTML = `${button.label} <span class="dl-type-badge" style="background:${tc.bg};color:${tc.color};border:1px solid ${tc.border}">${ext}</span>`;
      trigger.addEventListener("click", () => {
        downloadArtifact(button.path).catch((error) => setStatus(`Download failed: ${error.message}`, "error"));
      });
      row.appendChild(trigger);
    });

  if (!row.children.length) {
    const note = document.createElement("p");
    note.className = "record-note";
    note.textContent = "No export files are available yet.";
    card.appendChild(note);
    return card;
  }

  card.appendChild(row);
  return card;
}

function renderMiniMatrix(title, likelihoodValue, impactValue, options = {}) {
  const likelihood = parseScore(likelihoodValue);
  const impact = parseScore(impactValue);
  const isInteractive = typeof options.onSelect === "function";

  const wrapper = document.createElement("div");
  wrapper.className = `mini-matrix-wrap${options.compact ? " is-compact" : ""}${isInteractive ? " is-interactive" : ""}`;
  const titleNode = document.createElement("strong");
  titleNode.textContent = title;
  wrapper.appendChild(titleNode);

  const grid = document.createElement("div");
  grid.className = "mini-matrix-grid";
  for (let impactLevel = 5; impactLevel >= 1; impactLevel -= 1) {
    for (let likelihoodLevel = 1; likelihoodLevel <= 5; likelihoodLevel += 1) {
      const score = impactLevel * likelihoodLevel;
      const band = getScoreBand(score);
      const cell = document.createElement("div");
      cell.className = `mini-matrix-cell matrix-${band.label.toLowerCase()}${likelihoodLevel === likelihood && impactLevel === impact ? " is-active" : ""}`;
      if (likelihoodLevel === likelihood && impactLevel === impact) {
        cell.textContent = `${likelihoodLevel}×${impactLevel}`;
      }
      if (isInteractive) {
        cell.classList.add("is-clickable");
        cell.tabIndex = 0;
        cell.setAttribute("role", "button");
        cell.setAttribute("aria-label", `Set likelihood ${likelihoodLevel} and impact ${impactLevel}`);
        const applySelection = () => options.onSelect({ likelihood: likelihoodLevel, impact: impactLevel });
        cell.addEventListener("click", applySelection);
        cell.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            applySelection();
          }
        });
      }
      grid.appendChild(cell);
    }
  }
  wrapper.appendChild(grid);
  return wrapper;
}

function renderRiskRecordSummary(item, options = {}) {
  const risk = decorateRiskRecord(item);
  const rows = [
    { label: "Likelihood", value: risk.likelihood || "-" },
    { label: "Impact", value: risk.impact || "-" },
    { label: "Inherent", value: risk.inherent_score || "-" },
    { label: "Inherent rating", value: risk.inherent_rating || "-" },
    { label: "Residual", value: risk.residual_score || "-" },
    { label: "Residual rating", value: risk.residual_rating || "-" }
  ];
  const card = document.createElement("div");
  card.className = "record-summary";
  rows.forEach((row) => {
    const stat = document.createElement("div");
    stat.className = "record-summary-stat";
    stat.innerHTML = `<span>${row.label}</span><strong>${row.value}</strong>`;
    card.appendChild(stat);
  });
  const matrices = document.createElement("div");
  matrices.className = "record-summary-matrices";
  matrices.appendChild(
    renderMiniMatrix("Inherent matrix", risk.likelihood, risk.impact, {
      compact: true,
      onSelect: options.onSelectInherent
    })
  );
  matrices.appendChild(
    renderMiniMatrix("Residual matrix", risk.residual_likelihood, risk.residual_impact, {
      compact: true,
      onSelect: options.onSelectResidual
    })
  );
  card.appendChild(matrices);
  return card;
}

function renderVendorRecordSummary(item, options = {}) {
  const vendor = decorateVendorRecord(item);
  const card = document.createElement("div");
  card.className = "record-summary";
  [
    { label: "Criticality", value: vendor.criticality || "-" },
    { label: "Inherent", value: vendor.inherent_score || vendor.inherent_risk || "-" },
    { label: "Inherent rating", value: parseScore(vendor.inherent_score) ? getScoreBandLabel(parseScore(vendor.inherent_score)) : "-" },
    { label: "Residual", value: vendor.residual_score || vendor.residual_risk || "-" },
    { label: "Residual rating", value: parseScore(vendor.residual_score) ? getScoreBandLabel(parseScore(vendor.residual_score)) : "-" }
  ].forEach((row) => {
    const stat = document.createElement("div");
    stat.className = "record-summary-stat";
    stat.innerHTML = `<span>${row.label}</span><strong>${row.value}</strong>`;
    card.appendChild(stat);
  });
  const matrices = document.createElement("div");
  matrices.className = "record-summary-matrices";
  matrices.appendChild(
    renderMiniMatrix("Vendor inherent matrix", vendor.vendor_likelihood, vendor.vendor_impact, {
      compact: true,
      onSelect: options.onSelectInherent
    })
  );
  matrices.appendChild(
    renderMiniMatrix("Vendor residual matrix", vendor.residual_likelihood, vendor.residual_impact, {
      compact: true,
      onSelect: options.onSelectResidual
    })
  );
  card.appendChild(matrices);
  return card;
}

function mountRiskCardBehavior(card) {
  const fieldGrid = card.querySelector(".field-grid");
  if (!fieldGrid) {
    return;
  }

  const summaryHost = document.createElement("div");
  summaryHost.className = "record-summary-host";
  card.insertBefore(summaryHost, fieldGrid);

  const sync = () => {
    const likelihood = parseScore(getFieldValue(card, "likelihood"));
    const impact = parseScore(getFieldValue(card, "impact"));
    const residualLikelihood = parseScore(getFieldValue(card, "residual_likelihood"));
    const residualImpact = parseScore(getFieldValue(card, "residual_impact"));
    const inherentScore = Number.isInteger(likelihood) && Number.isInteger(impact) ? likelihood * impact : null;
    const residualScore = Number.isInteger(residualLikelihood) && Number.isInteger(residualImpact) ? residualLikelihood * residualImpact : null;

    setFieldValue(card, "inherent_score", inherentScore || "");
    setFieldValue(card, "inherent_rating", Number.isInteger(inherentScore) ? getScoreBandLabel(inherentScore) : "");
    setFieldValue(card, "residual_score", residualScore || "");
    setFieldValue(card, "residual_rating", Number.isInteger(residualScore) ? getScoreBandLabel(residualScore) : "");

    summaryHost.innerHTML = "";
    summaryHost.appendChild(
      renderRiskRecordSummary(collectValues(card, getPhaseConfig("risk-assessment").itemFields), {
        onSelectInherent: ({ likelihood: nextLikelihood, impact: nextImpact }) => {
          setFieldValue(card, "likelihood", nextLikelihood);
          setFieldValue(card, "impact", nextImpact);
          sync();
        },
        onSelectResidual: ({ likelihood: nextLikelihood, impact: nextImpact }) => {
          setFieldValue(card, "residual_likelihood", nextLikelihood);
          setFieldValue(card, "residual_impact", nextImpact);
          sync();
        }
      })
    );
  };

  ["likelihood", "impact", "residual_likelihood", "residual_impact"].forEach((fieldName) => {
    const control = getFieldControl(card, fieldName);
    if (control) {
      control.addEventListener("change", sync);
      control.addEventListener("input", sync);
    }
  });

  sync();
}

function mountVendorCardBehavior(card) {
  const fieldGrid = card.querySelector(".field-grid");
  if (!fieldGrid || !getFieldControl(card, "vendor_likelihood")) {
    return;
  }

  const summaryHost = document.createElement("div");
  summaryHost.className = "record-summary-host";
  card.insertBefore(summaryHost, fieldGrid);

  const sync = () => {
    const vendorLikelihood = parseScore(getFieldValue(card, "vendor_likelihood"));
    const vendorImpact = parseScore(getFieldValue(card, "vendor_impact"));
    const residualLikelihood = parseScore(getFieldValue(card, "residual_likelihood"));
    const residualImpact = parseScore(getFieldValue(card, "residual_impact"));
    const inherentScore = Number.isInteger(vendorLikelihood) && Number.isInteger(vendorImpact) ? vendorLikelihood * vendorImpact : null;
    const residualScore = Number.isInteger(residualLikelihood) && Number.isInteger(residualImpact) ? residualLikelihood * residualImpact : null;

    setFieldValue(card, "inherent_score", inherentScore || "");
    setFieldValue(card, "inherent_risk", Number.isInteger(inherentScore) ? buildVendorRiskLabel(vendorLikelihood, vendorImpact) : "");
    setFieldValue(card, "residual_score", residualScore || "");
    setFieldValue(card, "residual_risk", Number.isInteger(residualScore) ? buildVendorRiskLabel(residualLikelihood, residualImpact) : "");

    summaryHost.innerHTML = "";
    summaryHost.appendChild(
      renderVendorRecordSummary(collectValues(card, getPhaseConfig("vendor-risk").itemFields), {
        onSelectInherent: ({ likelihood: nextLikelihood, impact: nextImpact }) => {
          setFieldValue(card, "vendor_likelihood", nextLikelihood);
          setFieldValue(card, "vendor_impact", nextImpact);
          sync();
        },
        onSelectResidual: ({ likelihood: nextLikelihood, impact: nextImpact }) => {
          setFieldValue(card, "residual_likelihood", nextLikelihood);
          setFieldValue(card, "residual_impact", nextImpact);
          sync();
        }
      })
    );
  };

  ["vendor_likelihood", "vendor_impact", "residual_likelihood", "residual_impact"].forEach((fieldName) => {
    const control = getFieldControl(card, fieldName);
    if (control) {
      control.addEventListener("change", sync);
      control.addEventListener("input", sync);
    }
  });

  sync();
}

function createControl(field, value) {
  let control;
  if (field.type === "textarea") {
    control = document.createElement("textarea");
    if (field.rows) {
      control.rows = field.rows;
    }
  } else if (field.type === "vendor-autocomplete") {
    control = document.createElement("input");
    control.type = "text";
    control.autocomplete = "off";
  } else if (field.type === "toggle") {
    control = document.createElement("input");
    control.type = "checkbox";
    control.className = "toggle-input";
    control.checked = isToggleEnabled(value);
  } else if (field.type === "select") {
    control = document.createElement("select");
    const options = typeof field.options === "function" ? field.options() : field.options;
    (options || []).forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue || "Select";
      control.appendChild(option);
    });
  } else {
    control = document.createElement("input");
    control.type = field.type || "text";
  }
  if (field.type !== "toggle") {
    control.value = value || "";
  }
  if (field.placeholder && field.type !== "toggle") {
    control.placeholder = field.placeholder;
  }
  if (field.readonly) {
    if (field.type === "toggle" || field.type === "select") {
      control.disabled = true;
    } else {
      control.readOnly = true;
    }
    control.classList.add("is-readonly");
  }
  control.dataset.field = field.name;
  control.dataset.fieldType = field.type || "text";
  return control;
}

function createField(field, value, prefix, errorMessage = "") {
  const wrapper = document.createElement("div");
  wrapper.className = `field${field.full ? " full" : ""}${field.type === "toggle" ? " field-toggle" : ""}`;
  const label = document.createElement("label");
  const id = `${prefix}-${field.name}`;
  label.htmlFor = id;
  label.textContent = field.label;
  if (field.clientSpecific) {
    const badge = document.createElement("span");
    badge.className = "client-only-badge";
    badge.textContent = "CLIENT SPECIFIC";
    label.appendChild(badge);
  }
  const control = createControl(field, value);
  control.id = id;
  wrapper.appendChild(label);
  if (field.type === "toggle") {
    const toggleWrap = document.createElement("label");
    toggleWrap.className = "toggle-control";
    toggleWrap.htmlFor = id;
    toggleWrap.appendChild(control);
    const toggleText = document.createElement("span");
    toggleText.textContent = field.toggleLabel || `Mark as ${field.label.toLowerCase()}`;
    toggleWrap.appendChild(toggleText);
    wrapper.appendChild(toggleWrap);
  } else {
    wrapper.appendChild(control);
  }

  if (errorMessage) {
    wrapper.classList.add("field-invalid");
    control.classList.add("is-invalid");
    const error = document.createElement("p");
    error.className = "field-error";
    error.textContent = errorMessage;
    wrapper.appendChild(error);
  }

  // Policy body: add formatted preview toggle
  if (field.name === "body" && field.type === "textarea") {
    const previewDiv = document.createElement("div");
    previewDiv.className = "policy-preview hidden";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "policy-preview-toggle";
    toggleBtn.textContent = "Preview formatted";

    function renderPolicyPreview(text) {
      function esc(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }

      // Split a paragraph into bullet sentences at ". Capital" boundaries
      function toItems(para) {
        const parts = para.split(/\.\s+(?=[A-Z])/)
          .map(s => s.trim().replace(/\.+$/, "") + ".")
          .filter(s => s.length > 16);
        return parts.length >= 2 ? parts : null;
      }

      const rawLines = (text || "").split(/\r?\n/);
      let html = "";
      let prevWasH = false;

      for (const line of rawLines) {
        const t = line.trim();

        if (!t) {
          if (!prevWasH) html += '<div class="policy-preview-spacer"></div>';
          continue;
        }

        // Old inline format: "1.1 Heading. Content paragraph..."
        const inline = t.match(/^(\d+\.\d+(?:\.\d+)?\s+[A-Za-z][^.\r\n]{2,55})\.\s+([A-Z].{15,})$/);
        if (inline) {
          html += `<div class="policy-preview-h2">${esc(inline[1])}</div>`;
          const items = toItems(inline[2]);
          if (items) {
            html += '<ul class="policy-preview-list">' + items.map(s => `<li>${esc(s)}</li>`).join("") + '</ul>';
          } else {
            html += `<div class="policy-preview-p">${esc(inline[2])}</div>`;
          }
          prevWasH = false;
          continue;
        }

        // Main section heading "1. Title" (not "1.1")
        // Only a heading if short body text that doesn't end with sentence punctuation
        if (/^\d+\.\s+\S/.test(t) && !/^\d+\.\d+/.test(t)) {
          const bodyText = t.replace(/^\d+\.\s+/, "");
          const isHeading = bodyText.length <= 55 && !/[.!?]$/.test(bodyText.trimEnd());
          if (isHeading) {
            html += `<div class="policy-preview-h1">${esc(t)}</div>`;
            prevWasH = true;
            continue;
          }
        }

        // Subsection heading already on its own line "1.1 Title"
        if (/^\d+\.\d+(\.\d+)?\s+\S/.test(t) && t.length < 80) {
          html += `<div class="policy-preview-h2">${esc(t)}</div>`;
          prevWasH = true;
          continue;
        }

        // Content paragraph — bullet if multiple sentences
        const items = toItems(t);
        if (items) {
          html += '<ul class="policy-preview-list">' + items.map(s => `<li>${esc(s)}</li>`).join("") + '</ul>';
        } else {
          html += `<div class="policy-preview-p">${esc(t)}</div>`;
        }
        prevWasH = false;
      }

      previewDiv.innerHTML = html;
    }

    toggleBtn.addEventListener("click", () => {
      const showing = !previewDiv.classList.contains("hidden");
      if (showing) {
        previewDiv.classList.add("hidden");
        control.classList.remove("hidden");
        toggleBtn.textContent = "Preview formatted";
      } else {
        renderPolicyPreview(control.value);
        previewDiv.classList.remove("hidden");
        control.classList.add("hidden");
        toggleBtn.textContent = "Edit source";
      }
    });

    label.appendChild(toggleBtn);
    wrapper.appendChild(previewDiv);
  }

  if (field.type === "vendor-autocomplete") {
    // Wrap input + browse button in a flex group
    const group = document.createElement("div");
    group.className = "vendor-ac-group";
    wrapper.insertBefore(group, control);
    group.appendChild(control);

    const browseBtn = document.createElement("button");
    browseBtn.type = "button";
    browseBtn.className = "vendor-ac-browse-btn";
    browseBtn.textContent = "Browse library";
    browseBtn.title = `Search ${typeof vlCount === "function" ? vlCount() : 105} pre-built vendors`;
    group.appendChild(browseBtn);

    const openPicker = (initialQuery) => {
      const card = control.closest(".repeatable-card");
      if (typeof vpOpen === "function") {
        vpOpen(control, card, initialQuery || "", (vendor) => {
          const c = control.closest(".repeatable-card");
          applyVendorLibrarySelection(c, vendor);
        });
      }
    };

    browseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openPicker(control.value);
    });

    // Open picker when input is focused and empty
    control.addEventListener("focus", () => {
      if (!control.value.trim() && typeof vpOpen === "function") {
        openPicker("");
      }
    });

    // Open / update picker as user types (debounced)
    let _vpTimer;
    control.addEventListener("input", () => {
      clearTimeout(_vpTimer);
      if (control.value.length >= 2) {
        _vpTimer = setTimeout(() => openPicker(control.value), 280);
      }
    });

    // Backward-compat: catalog match on manual blur/change
    control.addEventListener("change", () => {
      const card = control.closest(".repeatable-card");
      if (card && control.value.trim()) {
        applyVendorCatalogSelection(card, control.value);
      }
    });
  }

  return wrapper;
}

function renderFieldGrid(fields, values, prefix, fieldErrors = {}) {
  const grid = document.createElement("div");
  grid.className = "field-grid";
  fields.forEach((field) => {
    if (field.type === "heading") {
      const heading = document.createElement("div");
      heading.className = "field-grid-heading full";
      heading.textContent = field.label;
      grid.appendChild(heading);
    } else {
      grid.appendChild(createField(field, values[field.name], prefix, fieldErrors[field.name] || ""));
    }
  });
  return grid;
}

function collectValues(container, fields) {
  const data = {};
  fields.forEach((field) => {
    if (field.type === "heading") return;
    const control = container.querySelector(`[data-field="${field.name}"]`);
    if (control) {
      data[field.name] = field.type === "toggle" ? (control.checked ? "Yes" : "No") : control.value.trim();
    }
  });
  return data;
}

function collectRepeatableValues(container, fields) {
  return Array.from(container.querySelectorAll(".repeatable-card[data-index]")).map((card) =>
    collectValues(card, fields)
  );
}

function renderBadge(text, tone) {
  const badge = document.createElement("span");
  badge.className = `status-badge status-${tone}`;
  badge.textContent = text;
  return badge;
}

function renderListSection(title, items, emptyMessage, tone = "default") {
  const wrapper = document.createElement("section");
  wrapper.className = `info-card status-panel tone-${tone}`;
  const head = document.createElement("div");
  head.className = "panel-head compact";
  const titleNode = document.createElement("h4");
  titleNode.textContent = title;
  head.appendChild(titleNode);
  wrapper.appendChild(head);

  const list = document.createElement("div");
  list.className = "status-list";
  if (!items.length) {
    const item = document.createElement("div");
    item.className = "status-item";
    item.textContent = emptyMessage;
    list.appendChild(item);
  } else {
    items.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "status-item";
      item.textContent = entry;
      list.appendChild(item);
    });
  }
  wrapper.appendChild(list);
  return wrapper;
}

function normalizeVendorKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getVendorCatalogEntries() {
  return Array.isArray(state.vendorCatalog?.vendors) ? state.vendorCatalog.vendors : [];
}

function getVendorCatalogMatch(vendorName) {
  const target = normalizeVendorKey(vendorName);
  if (!target) {
    return null;
  }

  return (
    getVendorCatalogEntries().find((entry) => {
      const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
      return [entry.vendor_name, ...aliases].some((candidate) => normalizeVendorKey(candidate) === target);
    }) || null
  );
}

function buildVendorSeed(vendor = {}) {
  const libMatch = typeof vlFindByName === "function" ? vlFindByName(vendor.vendor_name) : null;
  const catalogMatch = getVendorCatalogMatch(vendor.vendor_name);

  return {
    vendor_name:        libMatch?.name                                              || catalogMatch?.vendor_name      || vendor.vendor_name        || "",
    vendor_description: vendor.vendor_description                                  || libMatch?.description          || catalogMatch?.vendor_description || "",
    purpose:            vendor.purpose                                             || "",
    service_category:   vendor.service_category                                   || libMatch?.category             || catalogMatch?.service_category || "",
    known_services:     vendor.known_services                                      || (libMatch?.common_services_used || []).join(", ") || catalogMatch?.known_services || "",
    website:            vendor.website                                             || libMatch?.website              || catalogMatch?.website      || "",
    data_accessed:      vendor.data_accessed                                       || (libMatch?.typical_data_access || []).join(", ") || "",
    criticality:        vendor.criticality                                         || libMatch?.default_tier         || "",
    certifications:     vendor.certifications                                      || (libMatch?.certifications || []).join(", ") || "",
    _library_meta:      libMatch ? { id: libMatch.id, default_tier: libMatch.default_tier,
                          typical_data_access: libMatch.typical_data_access,
                          certifications: libMatch.certifications,
                          dpa_available: libMatch.dpa_available,
                          custom: libMatch.custom || false } : (vendor._library_meta || null)
  };
}

function applyVendorCatalogSelection(container, vendorName) {
  const match = getVendorCatalogMatch(vendorName);
  if (!container || !match) {
    return;
  }

  // Library fields — shared, auto-filled from catalog
  const libraryFieldMap = {
    vendor_name: match.vendor_name || "",
    vendor_description: match.vendor_description || "",
    service_category: match.service_category || "",
    known_services: match.known_services || "",
    website: match.website || ""
  };

  Object.entries(libraryFieldMap).forEach(([fieldName, value]) => {
    const control = container.querySelector(`[data-field="${fieldName}"]`);
    if (!control || !String(value || "").trim()) {
      return;
    }
    control.value = value;
    if (fieldName === "vendor_description") {
      control.setAttribute("data-from-library", "true");
    }
  });

  // Client-specific field — never auto-filled; move focus there so user types immediately
  const purposeControl = container.querySelector(`[data-field="purpose"]`);
  if (purposeControl) {
    purposeControl.focus();
  }
}

// Full library selection — called by the vendor picker on vendor select
function applyVendorLibrarySelection(container, vendor) {
  if (!container || !vendor) return;

  // All library-sourced fields (shared knowledge, safe to auto-fill)
  const fieldMap = {
    vendor_name:        vendor.name        || "",
    vendor_description: vendor.description || "",
    service_category:   vendor.category    || "",
    known_services:     (vendor.common_services_used || []).join(", "),
    website:            vendor.website     || "",
    data_accessed:      (vendor.typical_data_access  || []).join(", "),
    criticality:        vendor.default_tier || "",
    certifications:     (vendor.certifications || []).join(", ")
  };

  Object.entries(fieldMap).forEach(([fieldName, value]) => {
    const ctrl = container.querySelector(`[data-field="${fieldName}"]`);
    if (!ctrl || !String(value || "").trim()) return;
    ctrl.value = value;
    if (["vendor_description", "data_accessed", "certifications"].includes(fieldName)) {
      ctrl.setAttribute("data-from-library", "true");
    }
  });

  // Store library metadata on the card for downstream assessment use
  container.dataset.vendorLibraryMeta = JSON.stringify({
    id:                 vendor.id,
    default_tier:       vendor.default_tier,
    typical_data_access: vendor.typical_data_access,
    certifications:     vendor.certifications,
    dpa_available:      vendor.dpa_available,
    custom:             vendor.custom || false
  });

  // CLIENT SPECIFIC — never auto-filled; focus it so the user types immediately
  const purposeCtrl = container.querySelector(`[data-field="purpose"]`);
  if (purposeCtrl) purposeCtrl.focus();
}

function extractProviderNames(value) {
  const stopWords = new Set([
    "",
    "and",
    "or",
    "n a",
    "na",
    "none",
    "unknown",
    "internal",
    "self hosted",
    "self-hosted",
    "multiple",
    "various",
    "other"
  ]);

  return String(value || "")
    .replace(/\band\b/gi, ",")
    .split(/[,/;\n|]+/)
    .map((entry) => entry.replace(/\(.*?\)/g, "").trim())
    .filter((entry) => entry.length > 1)
    .filter((entry) => !stopWords.has(normalizeVendorKey(entry)));
}

function deriveVendorCandidates(onboarding) {
  const seeds = [
    {
      source: onboarding.cloud_providers,
      purpose: "Cloud hosting or infrastructure services",
      business_function: "Infrastructure",
      access_level: "Production infrastructure access",
      criticality: "High"
    },
    {
      source: onboarding.identity_provider,
      purpose: "Identity and authentication services",
      business_function: "Identity and access management",
      access_level: "Authentication and workforce access",
      criticality: "High"
    }
  ];

  const seen = new Set();
  const candidates = [];
  const dataAccessed = isFilled(onboarding.data_types) ? onboarding.data_types : "To be confirmed";
  const location = isFilled(onboarding.storage_regions) ? onboarding.storage_regions : "To be confirmed";

  const manualVendors = Array.isArray(onboarding.vendors) ? onboarding.vendors : [];

  manualVendors.forEach((vendor, index) => {
    const seed = buildVendorSeed(vendor);
    const key = normalizeVendorKey(seed.vendor_name);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    candidates.push({
      vendor_id: vendor.vendor_id || `ONB-${String(index + 1).padStart(3, "0")}`,
      vendor_name: seed.vendor_name,
      vendor_description: seed.vendor_description,
      purpose: seed.purpose,
      business_function: seed.service_category || "Third-party service",
      service_category: seed.service_category,
      known_services: seed.known_services,
      website: seed.website,
      access_level: vendor.access_level || "To be confirmed",
      data_accessed: vendor.data_accessed || dataAccessed,
      criticality: vendor.criticality || "Medium",
      certifications: vendor.certifications || "",
      location: vendor.location || location,
      inherent_risk: "",
      residual_risk: "",
      treatment_plan: "",
      linked_risks: "",
      linked_controls: ""
    });
  });

  if (candidates.length > 0) {
    return candidates;
  }

  seeds.forEach((seed, seedIndex) => {
    extractProviderNames(seed.source).forEach((vendorName, vendorIndex) => {
      const key = normalizeVendorKey(vendorName);
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      const profile = buildVendorSeed({ vendor_name: vendorName });
      candidates.push({
        vendor_id: `DRV-${String(seedIndex + 1)}${String(vendorIndex + 1).padStart(2, "0")}`,
        vendor_name: profile.vendor_name || vendorName,
        vendor_description: profile.vendor_description || "",
        purpose: seed.purpose,
        business_function: profile.service_category || seed.business_function,
        service_category: profile.service_category || "",
        known_services: profile.known_services || "",
        website: profile.website || "",
        access_level: seed.access_level,
        data_accessed: dataAccessed,
        criticality: seed.criticality,
        certifications: "",
        location,
        inherent_risk: "",
        residual_risk: "",
        treatment_plan: "",
        linked_risks: "",
        linked_controls: ""
      });
    });
  });

  return candidates;
}

function syncDerivedVendors(clientData) {
  if (!clientData) {
    return;
  }

  const candidates = deriveVendorCandidates(clientData.onboarding || {});
  clientData.vendorRisk = clientData.vendorRisk || {};
  const existing = Array.isArray(clientData.vendorRisk.vendors) ? clientData.vendorRisk.vendors : [];
  const merged = [...existing];

  candidates.forEach((candidate) => {
    const key = normalizeVendorKey(candidate.vendor_name);
    const match = merged.find((vendor) => normalizeVendorKey(vendor.vendor_name) === key);
    if (!match) {
      merged.push(candidate);
      return;
    }

    ["vendor_description", "service_category", "known_services", "website", "business_function"].forEach((fieldName) => {
      if (!isFilled(match[fieldName]) && isFilled(candidate[fieldName])) {
        match[fieldName] = candidate[fieldName];
      }
    });
    if (!isFilled(match.purpose) && isFilled(candidate.purpose)) {
      match.purpose = candidate.purpose;
    }
  });

  clientData.vendorRisk.vendors = merged;
}

function isVendorAssessmentComplete(vendor) {
  return [
    vendor?.vendor_name,
    vendor?.criticality,
    vendor?.inherent_risk,
    vendor?.residual_risk,
    vendor?.treatment_plan
  ].every((value) => isFilled(value));
}

function countCompletedVendorAssessments(vendors) {
  return (vendors || []).filter((vendor) => isVendorAssessmentComplete(vendor)).length;
}

function getPolicyApprovalStatus(clientData) {
  const policyFields = phaseConfigs.find((entry) => entry.key === "policy-generation").itemFields;
  const policies = nonBlankItems(clientData?.policyGeneration?.policies || [], policyFields);
  const publishedCount = policies.filter((policy) => isToggleEnabled(policy.published)).length;
  const signedOffCount = policies.filter((policy) => isToggleEnabled(policy.sign_off_complete)).length;
  const approvedCount = policies.filter(
    (policy) => isToggleEnabled(policy.published) && isToggleEnabled(policy.sign_off_complete)
  ).length;

  return {
    policies,
    policyCount: policies.length,
    publishedCount,
    signedOffCount,
    approvedCount,
    allApproved: policies.length > 0 && approvedCount === policies.length
  };
}

function deriveTopRisks(onboarding) {
  const risks = [];
  const textBlob = [
    onboarding.business_model,
    onboarding.cloud_providers,
    onboarding.access_model,
    onboarding.data_types,
    onboarding.classification,
    onboarding.encryption,
    onboarding.backup,
    onboarding.monitoring,
    onboarding.scope
  ]
    .join(" ")
    .toLowerCase();

  const addRisk = (title, reason) => {
    if (!risks.some((entry) => entry.title === title)) {
      risks.push({ title, reason });
    }
  };

  if (/(pii|personal|customer|employee|financial|payment|health|phi|sensitive)/.test(textBlob)) {
    addRisk("Sensitive data exposure", "The onboarding profile indicates regulated or sensitive data handling.");
  }
  if (deriveVendorCandidates(onboarding).length > 0) {
    addRisk("Third-party service dependency", "The operating model relies on vendors or subprocessors that require oversight.");
  }
  if (/(aws|azure|gcp|cloud|kubernetes|container|terraform|saas|api)/.test(textBlob)) {
    addRisk("Cloud or infrastructure misconfiguration", "The production stack indicates cloud-hosted or distributed systems.");
  }
  if (!/yes/.test(String(onboarding.mfa_enabled || "").toLowerCase())) {
    addRisk("Unauthorized account access", "MFA is not clearly enforced across the environment.");
  }
  if (!/(central|siem|24\/7|alert|edr|monitor)/.test(String(onboarding.monitoring || "").toLowerCase())) {
    addRisk("Delayed detection and response", "Monitoring details do not yet indicate strong detection coverage.");
  }
  if (!/(tested|restore|immutable|replicated|regular)/.test(String(onboarding.backup || "").toLowerCase())) {
    addRisk("Backup or recovery failure", "Backup and recovery details do not yet show mature recovery assurance.");
  }
  if (!/(encrypted|kms|key)/.test(String(onboarding.encryption || "").toLowerCase())) {
    addRisk("Weak data protection controls", "Encryption details do not clearly show end-to-end protection.");
  }

  addRisk("Access control drift", "Role changes, provisioning, and least-privilege controls can degrade over time.");
  addRisk("Change management gaps", "Policy and control execution depend on consistent operational change control.");

  return risks.slice(0, 5);
}

function getOnboardingSnapshot(onboarding) {
  const config = getPhaseConfig("onboarding");
  const missing = config.requiredFields.filter((field) => !isFilled(onboarding?.[field]));
  const vendorCandidates = deriveVendorCandidates(onboarding || {});
  return {
    ready: missing.length === 0,
    missing,
    completed: countPopulatedFields(onboarding, config.requiredFields),
    total: config.requiredFields.length,
    vendorCount: vendorCandidates.length,
    vendorCandidates,
    derivedTopRisks: deriveTopRisks(onboarding || {})
  };
}

function getPolicyGenerationProgress(clientData) {
  const section = clientData?.policyGeneration || {};
  const stages = Array.isArray(section.generation_stages) ? section.generation_stages : [];
  const normalizedStatus = String(section.generation_status || "").toLowerCase();
  const activeStage =
    stages.find((stage) => String(stage.status || "").toLowerCase() === "in-progress") ||
    stages.find((stage) => String(stage.key || "") === String(section.generation_stage || ""));

  const inProgress = normalizedStatus === "in progress";
  const completed  = normalizedStatus === "completed";
  const failed     = normalizedStatus === "failed";
  // "queued" = server has acknowledged the request but hasn't started writing yet
  const queued = normalizedStatus !== "" && normalizedStatus !== "not started" && !inProgress && !completed && !failed;
  return {
    inProgress,
    queued,
    active: inProgress || queued, // anything that means "don't save over this"
    completed,
    failed,
    stageKey: section.generation_stage || activeStage?.key || "",
    stageLabel: activeStage?.label || "",
    stageNote: section.generation_stage_note || activeStage?.note || "",
    startedAt: section.generation_started_at || "",
    completedAt: section.generation_completed_at || "",
    lastError: section.generation_last_error || "",
    stages
  };
}

function getWorkflowState(clientData) {
  const onboardingSnapshot = getOnboardingSnapshot(clientData.onboarding || {});
  const policyApproval = getPolicyApprovalStatus(clientData);
  const policyProgress = getPolicyGenerationProgress(clientData);
  const policyCount = policyApproval.policyCount;
  const riskAssessmentConfig = getPhaseConfig("risk-assessment");
  const vendorRiskConfig = getPhaseConfig("vendor-risk");
  const controlMappingConfig = getPhaseConfig("control-mapping");
  const riskCount = nonBlankItems(clientData.riskAssessment?.risks || [], riskAssessmentConfig.itemFields).length;
  const vendorRecords = nonBlankItems(clientData.vendorRisk?.vendors || [], vendorRiskConfig.itemFields);
  const vendorCount = countCompletedVendorAssessments(vendorRecords);
  const controlCount = nonBlankItems(clientData.controlMapping?.controls || [], controlMappingConfig.itemFields).length;
  const vendorTargetCount = onboardingSnapshot.vendorCount;
  const vendorPhaseComplete = vendorTargetCount > 0 ? vendorCount >= vendorTargetCount : true;
  const policiesReadyForDownstream = policyApproval.allApproved;

  const states = [
    {
      key: "onboarding",
      unlocked: true,
      complete: onboardingSnapshot.ready,
      status: onboardingSnapshot.ready ? "complete" : "in-progress",
      detail: `${onboardingSnapshot.completed}/${onboardingSnapshot.total} onboarding fields complete`,
      blockers: onboardingSnapshot.missing.map((field) => field.replace(/_/g, " "))
    },
    {
      key: "policy-generation",
      unlocked: onboardingSnapshot.ready,
      complete: policiesReadyForDownstream,
      status:
        !onboardingSnapshot.ready
          ? "blocked"
          : policyProgress.failed
            ? "blocked"
            : policyProgress.inProgress
            ? "in-progress"
            : policyCount === 0
              ? "ready"
              : policiesReadyForDownstream
                ? "complete"
                : "in-progress",
      detail:
        policyProgress.failed
          ? policyProgress.lastError || "Policy generation failed."
          : policyProgress.inProgress
            ? policyProgress.stageNote || "Policy generation is in progress."
            : policyCount === 0
              ? "Ready to generate policies."
              : `${policyApproval.approvedCount}/${policyCount} policies published and signed off`,
      blockers: onboardingSnapshot.ready ? [] : ["Finish onboarding first."]
    },
    {
      key: "risk-assessment",
      unlocked: policiesReadyForDownstream,
      complete: riskCount >= 5,
      status:
        !policiesReadyForDownstream
          ? "blocked"
          : riskCount >= 5
            ? "complete"
            : riskCount > 0
              ? "in-progress"
              : "ready",
      detail:
        !policiesReadyForDownstream
          ? "Waiting for all policies to be published and signed off"
          : `${riskCount}/5 minimum risks`,
      blockers:
        policiesReadyForDownstream
          ? []
          : ["Publish and sign off every policy first."]
    },
    {
      key: "vendor-risk",
      unlocked: policiesReadyForDownstream && riskCount >= 5,
      complete: vendorPhaseComplete,
      status:
        !policiesReadyForDownstream || riskCount < 5
          ? "blocked"
          : vendorPhaseComplete
            ? "complete"
            : vendorCount > 0
              ? "in-progress"
              : "ready",
      detail:
        vendorTargetCount > 0
          ? `${vendorCount}/${vendorTargetCount} vendor assessments complete`
          : "No vendor assessments required",
      blockers:
        !policiesReadyForDownstream
          ? ["Publish and sign off every policy first."]
          : riskCount >= 5
            ? []
            : ["Complete risk assessment first."]
    },
    {
      key: "control-mapping",
      unlocked: policiesReadyForDownstream && riskCount >= 5 && vendorPhaseComplete,
      complete: controlCount > 0,
      status: !(policiesReadyForDownstream && riskCount >= 5 && vendorPhaseComplete) ? "blocked" : controlCount > 0 ? "complete" : "ready",
      detail: `${controlCount} controls mapped`,
      blockers:
        !policiesReadyForDownstream
          ? ["Publish and sign off every policy first."]
          : riskCount < 5
            ? ["Complete risk assessment first."]
            : vendorPhaseComplete
              ? []
              : ["Complete vendor assessments first."]
    },
    {
      key: "output",
      unlocked: onboardingSnapshot.ready,
      complete: policyCount > 0,
      status: !onboardingSnapshot.ready ? "blocked" : policyCount > 0 ? "complete" : "ready",
      detail: policyCount > 0 ? "Outputs ready for download" : "Generate policies to unlock downloads",
      blockers: onboardingSnapshot.ready ? [] : ["Complete onboarding first."]
    },
    {
      key: "evidence-tracker",
      unlocked: onboardingSnapshot.ready,
      complete: (() => {
        const evItems = Array.isArray(clientData.evidenceTracker?.evidence_items) ? clientData.evidenceTracker.evidence_items : [];
        return evItems.length >= 5;
      })(),
      status: !onboardingSnapshot.ready ? "blocked" : (() => {
        const evItems = Array.isArray(clientData.evidenceTracker?.evidence_items) ? clientData.evidenceTracker.evidence_items : [];
        return evItems.length >= 5 ? "complete" : evItems.length > 0 ? "in-progress" : "ready";
      })(),
      detail: (() => {
        const evItems = Array.isArray(clientData.evidenceTracker?.evidence_items) ? clientData.evidenceTracker.evidence_items : [];
        return `${evItems.length} evidence item${evItems.length !== 1 ? "s" : ""} recorded`;
      })(),
      blockers: onboardingSnapshot.ready ? [] : ["Finish onboarding first."]
    },
    {
      key: "intelligence",
      unlocked: true,
      complete: false,
      status: "ready",
      detail: "Intelligence Centre — quality monitoring and improvement",
      blockers: []
    }
  ];

  return {
    onboardingSnapshot,
    states,
    completeCount: states.filter((entry) => entry.complete).length
  };
}

function getVendorManagementState(clientData) {
  const onboarding = clientData?.onboarding || {};
  const onboardingSnapshot = getOnboardingSnapshot(onboarding);
  const vendorFields = getPhaseConfig("vendor-management").itemFields;
  const vendorDirectoryRecords = nonBlankItems(onboarding.vendors || [], vendorFields);
  const vendorDirectoryCount = vendorDirectoryRecords.length;
  return {
    key: "vendor-management",
    unlocked: onboardingSnapshot.ready,
    complete: vendorDirectoryCount > 0,
    status: !onboardingSnapshot.ready ? "blocked" : vendorDirectoryCount > 0 ? "complete" : "ready",
    detail: `${vendorDirectoryCount} vendors in the client list`,
    blockers: onboardingSnapshot.ready ? [] : ["Finish onboarding first."]
  };
}

function getPhaseState(phaseKey) {
  if (utilitySectionKeys.has(phaseKey)) {
    return getVendorManagementState(state.selectedClientData);
  }
  return getWorkflowState(state.selectedClientData).states.find((entry) => entry.key === phaseKey);
}

function isUiVisiblePhase(phaseKey) {
  return !hiddenUiPhaseKeys.has(phaseKey) && !utilitySectionKeys.has(phaseKey);
}

function getVisibleWorkflow(workflow) {
  const sourceWorkflow = workflow || getWorkflowState(state.selectedClientData);
  const visibleStates = sourceWorkflow.states.filter((entry) => isUiVisiblePhase(entry.key));
  return {
    ...sourceWorkflow,
    states: visibleStates,
    completeCount: visibleStates.filter((entry) => entry.complete).length
  };
}

function ensureActivePhaseAvailable() {
  if (!state.selectedClientData) {
    state.activePhaseKey = "onboarding";
    return;
  }
  if (utilitySectionKeys.has(state.activePhaseKey)) {
    const utilityState = getPhaseState(state.activePhaseKey);
    if (utilityState?.unlocked) {
      return;
    }
  }
  const workflow = getVisibleWorkflow(getWorkflowState(state.selectedClientData)).states;
  const current = workflow.find((entry) => entry.key === state.activePhaseKey);
  if (current && current.unlocked) {
    return;
  }
  const next = workflow.find((entry) => entry.unlocked && !entry.complete);
  state.activePhaseKey = next ? next.key : "onboarding";
}

function renderClientList() {
  clientCount.textContent = String(state.clients.length);
  existingClientSuggestions.innerHTML = "";

  state.clients
    .slice()
    .sort((left, right) => left.companyName.localeCompare(right.companyName))
    .forEach((client) => {
      const option = document.createElement("option");
      option.value = client.companyName;
      existingClientSuggestions.appendChild(option);
    });

  refreshExistingClientUi();
  refreshCreateClientUi();
}

function renderWorkflowStatus() {
  workflowStatusGrid.innerHTML = "";
  const workflow = getVisibleWorkflow(getWorkflowState(state.selectedClientData));
  const pct = workflow.states.length > 0
    ? Math.round((workflow.completeCount / workflow.states.length) * 100) : 0;

  // Overall progress bar — insert before the grid inside the tracker card
  const trackerCard = workflowStatusGrid.parentElement;
  const oldBar = trackerCard.querySelector(".workflow-progress-wrap");
  if (oldBar) oldBar.remove();
  const progressWrap = document.createElement("div");
  progressWrap.className = "workflow-progress-wrap";
  progressWrap.innerHTML = `
    <div class="workflow-progress-header">
      <span class="workflow-progress-label">${workflow.completeCount} of ${workflow.states.length} phases complete</span>
      <span class="workflow-progress-pct">${pct}%</span>
    </div>
    <div class="workflow-progress-track">
      <div class="workflow-progress-fill" style="width: ${pct}%"></div>
    </div>`;
  trackerCard.insertBefore(progressWrap, workflowStatusGrid);

  workflow.states.forEach((entry) => {
    const config = phaseConfigs.find((phase) => phase.key === entry.key);
    const isActive = entry.key === state.activePhaseKey;
    const card = document.createElement("div");
    card.className = `workflow-step workflow-step-${entry.status}${entry.unlocked ? " workflow-step-clickable" : ""}${isActive ? " workflow-step-active" : ""}`;

    const title = document.createElement("strong");
    title.textContent = `${config.phase} | ${config.label}`;

    const detail = document.createElement("span");
    detail.textContent = entry.detail;

    card.appendChild(title);
    card.appendChild(detail);

    if (entry.blockers.length) {
      const blocker = document.createElement("small");
      blocker.textContent = entry.blockers[0];
      card.appendChild(blocker);
    }

    if (entry.unlocked) {
      const cta = document.createElement("span");
      cta.className = "workflow-step-cta";
      cta.textContent = isActive ? "Currently viewing" : "Open →";
      card.appendChild(cta);

      card.addEventListener("click", () => {
        state.activePhaseKey = entry.key;
        renderTabs();
        renderActivePhase();
        renderWorkflowStatus();
        const tabsEl = document.getElementById("tab-nav") || document.querySelector(".tab-nav");
        if (tabsEl) tabsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }

    workflowStatusGrid.appendChild(card);
  });
}

function renderWorkspaceHeader(client) {
  const workflow = getVisibleWorkflow(getWorkflowState(state.selectedClientData));
  const policyApproval = getPolicyApprovalStatus(state.selectedClientData);
  const vendorManagement = getVendorManagementState(state.selectedClientData);
  workspaceCompany.textContent = client.companyName;
  workspaceActions.innerHTML = "";

  const openLauncherButton = document.createElement("button");
  openLauncherButton.type = "button";
  openLauncherButton.className = "action-button ghost";
  openLauncherButton.textContent = "Open Client Launcher";
  openLauncherButton.addEventListener("click", () => {
    openUrlInNewTab(window.location.pathname);
  });
  workspaceActions.appendChild(openLauncherButton);

  const manageVendorsButton = document.createElement("button");
  manageVendorsButton.type = "button";
  manageVendorsButton.className = `action-button ghost${state.activePhaseKey === "vendor-management" ? " is-active" : ""}`;
  manageVendorsButton.textContent = "Vendor Management";
  manageVendorsButton.disabled = !vendorManagement.unlocked;
  manageVendorsButton.title = vendorManagement.unlocked ? "Open the centralized vendor list for this client." : vendorManagement.blockers[0];
  manageVendorsButton.addEventListener("click", () => {
    state.activePhaseKey = "vendor-management";
    renderWorkspaceHeader(state.selectedClientData.client);
    renderTabs();
    renderActivePhase();
  });
  workspaceActions.appendChild(manageVendorsButton);

  const downloadObButton = document.createElement("button");
  downloadObButton.type = "button";
  downloadObButton.className = "action-button ghost";
  downloadObButton.textContent = "Download Onboarding PDF";
  downloadObButton.title = "Export onboarding data, vendor list, and risk summary as a printable PDF.";
  downloadObButton.addEventListener("click", () => {
    if (typeof downloadOnboardingPDF === "function") downloadOnboardingPDF();
  });
  workspaceActions.appendChild(downloadObButton);

  const deleteClientButton = document.createElement("button");
  deleteClientButton.type = "button";
  deleteClientButton.className = "danger-button";
  deleteClientButton.textContent = "Delete Client";
  deleteClientButton.addEventListener("click", () => {
    deleteClientWorkspace().catch((error) => setStatus(error.message, "error"));
  });
  workspaceActions.appendChild(deleteClientButton);
  workspaceStats.innerHTML = `
    <span class="small-chip">${workflow.completeCount}/${workflow.states.length} phases complete</span>
    <span class="small-chip">${workflow.onboardingSnapshot.ready ? "Onboarding complete" : "Onboarding in progress"}</span>
    <span class="small-chip">${policyApproval.approvedCount}/${policyApproval.policyCount} policies approved</span>
    <span class="small-chip">${client.stats.policyCount} policies</span>
    <span class="small-chip">${vendorManagement.detail}</span>
    <span class="small-chip">${workflow.states.find((entry) => entry.key === "vendor-risk").detail}</span>
  `;
  renderWorkflowStatus();
  if (typeof updateTopbarBadge === "function") {
    updateTopbarBadge(state.selectedClientData);
  }
  if (typeof icInit === "function") {
    icInit(state.selectedClientData);
  }
  if (typeof ucEnsureBell === "function") {
    ucEnsureBell(workspaceActions);
  }
}

const PHASE_ICONS = {
  "onboarding":        `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 14c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  "policy-generation": `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M6 6h4M6 9h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  "risk-assessment":   `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13.5H1.5L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 7v2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.6" fill="currentColor"/></svg>`,
  "vendor-risk":       `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="7" width="12" height="7.5" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  "control-mapping":   `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>`,
  "output":            `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v7.5M5.5 7L8 9.5 10.5 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  "evidence-tracker":  `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M6 5.5l1.5 1.5 3-3M6 9.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  "intelligence":      `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 13v1.5M6 14.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

function renderTabs() {
  const workflowStates = getVisibleWorkflow(getWorkflowState(state.selectedClientData)).states;
  tabNav.innerHTML = "";

  phaseConfigs.filter((config) => isUiVisiblePhase(config.key)).forEach((config) => {
    const phaseState = workflowStates.find((entry) => entry.key === config.key);
    const iconHtml = PHASE_ICONS[config.key]
      ? `<span class="tab-btn-icon">${PHASE_ICONS[config.key]}</span>` : "";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tab-button tab-${phaseState.status}${config.key === state.activePhaseKey ? " active" : ""}`;
    const onboardingGated = !phaseState.unlocked && phaseState.blockers.some(b => /onboarding/i.test(b));
    if (onboardingGated) {
      button.disabled = false;
      button.innerHTML = `${iconHtml}${config.phase} | ${config.label} 🔒`;
      button.title = "Complete onboarding first to unlock this module.";
    } else {
      button.disabled = !phaseState.unlocked;
      button.innerHTML = `${iconHtml}${config.phase} | ${config.label}`;
      if (phaseState.blockers.length) {
        button.title = phaseState.blockers.join(" | ");
      }
    }
    button.addEventListener("click", () => {
      state.activePhaseKey = config.key;
      renderTabs();
      renderActivePhase();
    });
    tabNav.appendChild(button);
  });
}

function renderRepeatableCards(items, fields, label, onRemove, options = {}) {
  const list = document.createElement("div");
  list.className = "repeatable-list";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "repeatable-card";
    empty.textContent =
      label === "Vendor"
        ? "No vendors added yet."
        : label === "Policy"
          ? "Policy generation is in progress. Generated policy records will appear here."
          : `No ${label.toLowerCase()} records added yet.`;
    list.appendChild(empty);
    return list;
  }

  items.forEach((item, index) => {
    const itemErrors = typeof options.getItemErrors === "function" ? options.getItemErrors(index, item) : {};
    const hasContent = fields.some((field) => isFilled(item?.[field.name]));
    const titleText = item.name || item.policy_id || item.vendor_name || item.risk_id || `${label} ${index + 1}`;

    if (options.collapsible) {
      const card = document.createElement("details");
      card.className = "repeatable-card repeatable-card-collapsible";
      card.dataset.index = String(index);
      card.open = !hasContent;

      const summary = document.createElement("summary");
      summary.className = "repeatable-summary";
      const summaryTitle = document.createElement("strong");
      summaryTitle.textContent = titleText || `${label} ${index + 1}`;
      const summaryMeta = document.createElement("span");
      summaryMeta.textContent =
        item.vendor_description || item.purpose || "Click to add or edit vendor details.";
      summary.appendChild(summaryTitle);
      summary.appendChild(summaryMeta);
      card.appendChild(summary);

      const body = document.createElement("div");
      body.className = "repeatable-body";
      const head = document.createElement("div");
      head.className = "repeatable-head";
      const title = document.createElement("h4");
      title.textContent = `${label} details`;
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "danger-button";
      removeButton.textContent = `Delete ${label}`;
      removeButton.addEventListener("click", () => onRemove(index));
      head.appendChild(title);
      head.appendChild(removeButton);
      body.appendChild(head);
      body.appendChild(renderFieldGrid(fields, item, `${label}-${index}`, itemErrors));
      card.appendChild(body);
      list.appendChild(card);
      return;
    }

    const card = document.createElement("section");
    card.className = "repeatable-card";
    card.dataset.index = String(index);

    const head = document.createElement("div");
    head.className = "repeatable-head";
    const title = document.createElement("h4");
    title.textContent = titleText;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "danger-button";
    removeButton.textContent = `Delete ${label}`;
    removeButton.addEventListener("click", () => onRemove(index));
    head.appendChild(title);
    head.appendChild(removeButton);

    card.appendChild(head);
    if (label === "Output" && isFilled(item.file_artifacts)) {
      const artifactSection = document.createElement("div");
      artifactSection.className = "artifact-block";
      const artifactTitle = document.createElement("strong");
      artifactTitle.textContent = "Downloads";
      artifactSection.appendChild(artifactTitle);
      artifactSection.appendChild(
        renderArtifactLinks(
          String(item.file_artifacts)
            .split(/\r?\n/)
            .map((entry) => entry.trim())
            .filter(Boolean)
        )
      );
      card.appendChild(artifactSection);
    }
    card.appendChild(renderFieldGrid(fields, item, `${label}-${index}`, itemErrors));
    if (label === "Risk") {
      mountRiskCardBehavior(card);
    }
    if (label === "Vendor") {
      mountVendorCardBehavior(card);
      const questionsPanel = renderVendorAssessmentQuestions(item.assessment_questions);
      if (questionsPanel) card.appendChild(questionsPanel);
    }
    list.appendChild(card);
  });

  return list;
}

function renderOnboardingOverview(sectionData) {
  const snapshot = getOnboardingSnapshot(sectionData);
  const users = parseClientUsers(sectionData.client_users || sectionData.client_usernames || "");
  const vendorCount = Array.isArray(sectionData?.vendors) ? sectionData.vendors.filter((vendor) => isFilled(vendor?.vendor_name)).length : 0;
  const wrapper = document.createElement("div");
  wrapper.className = "status-grid";


  const metrics = document.createElement("section");
  metrics.className = `info-card status-panel tone-${snapshot.ready ? "success" : "warning"}`;
  const head = document.createElement("div");
  head.className = "panel-head compact";
  const title = document.createElement("h4");
  title.textContent = "Onboarding readiness";
  head.appendChild(title);
  head.appendChild(renderBadge(snapshot.ready ? "Ready" : "In progress", snapshot.ready ? "success" : "warning"));
  metrics.appendChild(head);

  const stack = document.createElement("div");
  stack.className = "metric-stack";
  stack.innerHTML = `
    <div class="metric-row"><span>Selected framework</span><strong>${typeof getFwDisplayForOverview === "function" ? getFwDisplayForOverview(sectionData) : (sectionData.framework_selection || "Not selected")}</strong></div>
    <div class="metric-row"><span>Completed fields</span><strong>${snapshot.completed}/${snapshot.total}</strong></div>
    <div class="metric-row"><span>Vendors added</span><strong>${vendorCount}</strong></div>
    <div class="metric-row"><span>Approvers added</span><strong>${users.length}</strong></div>
    <div class="metric-row"><span>Next step</span><strong>${snapshot.ready ? "Policy generation" : "Finish onboarding"}</strong></div>
  `;
  metrics.appendChild(stack);
  wrapper.appendChild(metrics);

  wrapper.appendChild(
    renderListSection(
      "Still needed",
      snapshot.missing.map((field) => field.replace(/_/g, " ")),
      "Onboarding is complete.",
      snapshot.ready ? "success" : "warning"
    )
  );

  if (isFilled(sectionData.change_notice)) {
    wrapper.appendChild(
      renderListSection(
        "Regeneration status",
        [sectionData.change_notice],
        "No downstream regeneration is pending.",
        String(sectionData.reprocessing_required || "").toLowerCase() === "yes" ? "warning" : "success"
      )
    );
  }

  if (!snapshot.ready) {
    wrapper.appendChild(
      renderListSection(
        "What happens next",
        [
          "Complete the core onboarding fields.",
          "Add the client’s initial vendor list.",
          "Add policy owners and approvers.",
          "Then review the client vendor list in Vendor Management.",
          "Finishing onboarding will automatically start policy generation."
        ],
        "Onboarding complete.",
        "default"
      )
    );
  }

  return wrapper;
}

function renderOnboardingPreview(sectionData, config) {
  const snapshot = getOnboardingSnapshot(sectionData);
  const users = getStructuredClientUsers(sectionData).filter(u => u.name);
  const vendors = (sectionData.vendors || []).filter(v => v.vendor_name);

  const shell = document.createElement("div");
  shell.className = "ob-preview-shell";

  // Header bar
  const header = document.createElement("div");
  header.className = "ob-preview-header";
  header.innerHTML = `
    <div class="ob-preview-header-left">
      <p class="section-label">Onboarding</p>
      <h3>${sectionData.legal_entity || "Client"}</h3>
      <p class="ob-preview-sub">Onboarding complete — ${snapshot.completed} fields configured</p>
    </div>
    <div class="ob-preview-header-right">
      <span class="ob-preview-badge">
        <span class="dot dot-live"></span>Locked
      </span>
    </div>`;
  shell.appendChild(header);

  // Edit banner
  const editBar = document.createElement("div");
  editBar.className = "ob-edit-bar";
  editBar.innerHTML = `<span>This onboarding is locked. To make changes, enter edit mode — only affected sections will be updated.</span>`;
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "action-button";
  editBtn.textContent = "Edit Onboarding";
  editBtn.addEventListener("click", () => {
    state.onboardingEditMode = true;
    renderActivePhase();
  });
  editBar.appendChild(editBtn);
  const pdfBtn = document.createElement("button");
  pdfBtn.type = "button";
  pdfBtn.className = "action-button ghost";
  pdfBtn.textContent = "Download PDF";
  pdfBtn.title = "Export this onboarding as a security questionnaire PDF";
  pdfBtn.addEventListener("click", () => {
    if (typeof downloadOnboardingPDF === "function") downloadOnboardingPDF();
  });
  editBar.appendChild(pdfBtn);
  shell.appendChild(editBar);

  // Build field sections from phaseConfig groups
  const isApproverGroup = g => g?.custom === "client-users";
  const fieldGroups = (config.groups || []).filter(g => !isApproverGroup(g));

  const grid = document.createElement("div");
  grid.className = "ob-preview-grid";

  fieldGroups.forEach(group => {
    const card = document.createElement("div");
    card.className = "ob-preview-card";
    const cardTitle = document.createElement("p");
    cardTitle.className = "ob-preview-card-title";
    cardTitle.textContent = group.title || group.label || "Details";
    card.appendChild(cardTitle);
    const rows = document.createElement("div");
    rows.className = "ob-preview-rows";
    (group.fields || []).forEach(field => {
      const val = sectionData[field.name];
      if (!val && val !== 0) return;
      const row = document.createElement("div");
      row.className = "ob-preview-row";
      row.innerHTML = `<span class="ob-preview-label">${field.label}</span><span class="ob-preview-value">${String(val)}</span>`;
      rows.appendChild(row);
    });

    if (!rows.children.length) return;
    card.appendChild(rows);
    grid.appendChild(card);
  });

  // Framework
  const fwCard = document.createElement("div");
  fwCard.className = "ob-preview-card";
  fwCard.innerHTML = `<p class="ob-preview-card-title">Compliance Frameworks</p>
    <div class="ob-preview-rows">
      <div class="ob-preview-row">
        <span class="ob-preview-label">Selected</span>
        <span class="ob-preview-value">${typeof getFwDisplayForOverview === "function" ? getFwDisplayForOverview(sectionData) : (sectionData.framework_selection || "—")}</span>
      </div>
    </div>`;
  grid.insertBefore(fwCard, grid.firstChild);

  shell.appendChild(grid);

  // Vendors
  if (vendors.length) {
    const vCard = document.createElement("div");
    vCard.className = "ob-preview-card ob-preview-card-full";
    vCard.innerHTML = `<p class="ob-preview-card-title">Vendors (${vendors.length})</p>`;
    const vGrid = document.createElement("div");
    vGrid.className = "ob-preview-item-grid";
    vendors.forEach(v => {
      const cell = document.createElement("div");
      cell.className = "ob-preview-item-cell";
      cell.innerHTML = `<span class="ob-preview-vendor-name">${v.vendor_name}</span><span class="ob-preview-vendor-desc">${v.vendor_description || v.vendor_purpose || ""}</span>`;
      vGrid.appendChild(cell);
    });
    vCard.appendChild(vGrid);
    shell.appendChild(vCard);
  }

  // Client users / approvers
  if (users.length) {
    const uCard = document.createElement("div");
    uCard.className = "ob-preview-card ob-preview-card-full";
    uCard.innerHTML = `<p class="ob-preview-card-title">Approvers & Client Users (${users.length})</p>`;
    const uGrid = document.createElement("div");
    uGrid.className = "ob-preview-item-grid";
    users.forEach(u => {
      const cell = document.createElement("div");
      cell.className = "ob-preview-item-cell";
      cell.innerHTML = `<span class="ob-preview-user-name">${u.name}</span><span class="ob-preview-user-meta">${u.email}${u.designation ? " · " + u.designation : ""}</span>`;
      uGrid.appendChild(cell);
    });
    uCard.appendChild(uGrid);
    shell.appendChild(uCard);
  }

  // Change notice
  if (sectionData.change_notice) {
    const notice = document.createElement("div");
    notice.className = "ob-change-notice";
    notice.innerHTML = `<strong>Pending update:</strong> ${sectionData.change_notice}`;
    shell.appendChild(notice);
  }

  return shell;
}

function renderOnboardingValidationSummary(validation) {
  if (!validation?.summary?.length) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "info-card status-panel tone-danger validation-summary";

  const head = document.createElement("div");
  head.className = "panel-head compact";
  const title = document.createElement("h4");
  title.textContent = "Finish onboarding errors";
  head.appendChild(title);
  head.appendChild(renderBadge(`${validation.summary.length} issue${validation.summary.length === 1 ? "" : "s"}`, "danger"));
  section.appendChild(head);

  const list = document.createElement("div");
  list.className = "status-list";
  validation.summary.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "status-item";
    item.innerHTML = `<strong>${entry.label}</strong><span>${entry.message}</span>`;
    list.appendChild(item);
  });
  section.appendChild(list);
  return section;
}

function renderScoreMeter(label, score) {
  const row = document.createElement("div");
  row.className = "impr-score-row";
  const labelEl = document.createElement("span");
  labelEl.className = "impr-score-label";
  labelEl.textContent = label;
  const trackWrap = document.createElement("div");
  trackWrap.className = "impr-score-track-wrap";
  const track = document.createElement("div");
  track.className = "impr-score-track";
  const fill = document.createElement("div");
  fill.className = "impr-score-fill";
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  fill.style.width = pct + "%";
  if (pct >= 70) fill.classList.add("impr-fill-good");
  else if (pct >= 40) fill.classList.add("impr-fill-mid");
  else fill.classList.add("impr-fill-low");
  track.appendChild(fill);
  trackWrap.appendChild(track);
  const scoreEl = document.createElement("span");
  scoreEl.className = "impr-score-value";
  scoreEl.textContent = pct;
  row.appendChild(labelEl);
  row.appendChild(trackWrap);
  row.appendChild(scoreEl);
  return row;
}

function renderImprovementReport(improvementLog) {
  if (!improvementLog) return null;
  const section = document.createElement("section");
  section.className = "info-card impr-panel";
  const head = document.createElement("div");
  head.className = "panel-head compact";
  const title = document.createElement("h4");
  title.textContent = "Output improvement report";
  head.appendChild(title);
  head.appendChild(renderBadge("AI-enhanced", "success"));
  section.appendChild(head);

  const scores = document.createElement("div");
  scores.className = "impr-scores";
  scores.appendChild(renderScoreMeter("Overall score", improvementLog.overall_score));
  scores.appendChild(renderScoreMeter("Company specificity", improvementLog.specificity_score));
  scores.appendChild(renderScoreMeter("Content depth", improvementLog.depth_score));
  scores.appendChild(renderScoreMeter("Formatting", improvementLog.formatting_score));
  section.appendChild(scores);

  const improvements = Array.isArray(improvementLog.improvements) ? improvementLog.improvements : [];
  if (improvements.length > 0) {
    const listTitle = document.createElement("p");
    listTitle.className = "impr-list-title";
    listTitle.textContent = "What was improved";
    section.appendChild(listTitle);
    const list = document.createElement("ul");
    list.className = "impr-list";
    improvements.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = String(item);
      list.appendChild(li);
    });
    section.appendChild(list);
  }

  if (improvementLog.total_specificity_improvements > 0) {
    const stat = document.createElement("p");
    stat.className = "impr-stat";
    stat.textContent = `${improvementLog.total_specificity_improvements} generic references replaced with company-specific language across ${improvementLog.policy_count} policies.`;
    section.appendChild(stat);
  }

  return section;
}

function renderVendorAssessmentQuestions(questions) {
  if (!questions || typeof questions !== "object") return null;
  const categoryLabels = {
    security_posture: "Security posture",
    data_handling: "Data handling",
    access_controls: "Access controls",
    business_continuity: "Business continuity",
    contractual_compliance: "Contractual compliance",
    incident_response: "Incident response",
    ongoing_assurance: "Ongoing assurance"
  };

  const section = document.createElement("div");
  section.className = "vendor-questions-panel";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "vendor-questions-toggle";
  toggle.textContent = "Show assessment questions";
  toggle.setAttribute("aria-expanded", "false");

  const body = document.createElement("div");
  body.className = "vendor-questions-body hidden";

  const heading = document.createElement("p");
  heading.className = "vendor-questions-heading";
  heading.textContent = "Assessment questions — use during vendor review";
  body.appendChild(heading);

  Object.entries(categoryLabels).forEach(([key, catLabel]) => {
    const qs = Array.isArray(questions[key]) ? questions[key] : [];
    if (qs.length === 0) return;
    const catTitle = document.createElement("strong");
    catTitle.className = "vendor-questions-category";
    catTitle.textContent = catLabel;
    body.appendChild(catTitle);
    const list = document.createElement("ol");
    list.className = "vendor-questions-list";
    qs.forEach((q) => {
      const li = document.createElement("li");
      li.textContent = String(q);
      list.appendChild(li);
    });
    body.appendChild(list);
  });

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.textContent = expanded ? "Show assessment questions" : "Hide assessment questions";
    body.classList.toggle("hidden", expanded);
  });

  section.appendChild(toggle);
  section.appendChild(body);
  return section;
}

function pgCalcStats(progress) {
  const totalStages = progress.stages.length || 5;
  const completedCount = progress.stages.filter(s => String(s.status || "").toLowerCase() === "complete").length;
  const hasActive = progress.stages.some(s => String(s.status || "").toLowerCase() === "in-progress");
  const pct = Math.min(100, Math.round((completedCount + (hasActive ? 0.5 : 0)) * 100 / totalStages));
  const currentStageNum = completedCount + (hasActive ? 1 : 0);
  return { totalStages, completedCount, hasActive, pct, currentStageNum };
}

function pgElapsedText(progress) {
  if (!progress.startedAt) return "";
  try {
    const diffSec = Math.floor((Date.now() - new Date(progress.startedAt).getTime()) / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return progress.completed
      ? `Completed in ${mins}m ${secs}s`
      : `Running for ${mins > 0 ? mins + "m " : ""}${secs}s`;
  } catch (_) { return ""; }
}

// ── Policy Manager (List + Detail) ───────────────────────────

function pmGetStatus(policy) {
  const pub = isToggleEnabled(policy.published);
  const sig = isToggleEnabled(policy.sign_off_complete);
  if (pub && sig) return "approved";
  if (pub) return "published";
  if (sig) return "signed";
  return "pending";
}

function pmStatusLabel(status) {
  if (status === "approved") return "✓ Approved";
  if (status === "published") return "Published";
  if (status === "signed") return "Signed off";
  return "Pending";
}

function renderPolicyManager(sectionData) {
  const policies = (sectionData.policies || []).filter(p => p && (p.policy_id || p.name));
  const container = document.createElement("div");
  container.className = "pm-shell";
  if (state.selectedPolicyIndex >= 0 && state.selectedPolicyIndex < policies.length) {
    container.appendChild(renderPolicyDetail(policies, state.selectedPolicyIndex));
  } else {
    state.selectedPolicyIndex = -1;
    container.appendChild(renderPolicyListView(policies));
  }
  return container;
}

function renderPolicyListView(policies) {
  const shell = document.createElement("div");
  shell.className = "pm-list-shell";

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "pm-toolbar";

  const searchWrap = document.createElement("div");
  searchWrap.className = "pm-search-wrap";
  searchWrap.innerHTML = `<svg class="pm-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "pm-search-input";
  searchInput.placeholder = `Search ${policies.length} policies...`;
  searchInput.value = state.policySearch || "";
  searchInput.autocomplete = "new-password";
  searchInput.addEventListener("input", e => { state.policySearch = e.target.value; rebuildList(); });
  searchWrap.appendChild(searchInput);
  toolbar.appendChild(searchWrap);

  const filterRow = document.createElement("div");
  filterRow.className = "pm-filter-row";
  [
    { key: "all", label: "All" },
    { key: "approved", label: "Approved" },
    { key: "published", label: "Published" },
    { key: "pending", label: "Pending" }
  ].forEach(f => {
    const cnt = f.key === "all" ? policies.length : policies.filter(p => pmGetStatus(p) === f.key).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pm-filter-chip" + (state.policyFilter === f.key ? " pm-filter-active" : "");
    btn.innerHTML = `${f.label}<span class="pm-filter-cnt">${cnt}</span>`;
    btn.addEventListener("click", () => {
      state.policyFilter = f.key;
      filterRow.querySelectorAll(".pm-filter-chip").forEach(c => c.classList.remove("pm-filter-active"));
      btn.classList.add("pm-filter-active");
      rebuildList();
    });
    filterRow.appendChild(btn);
  });
  toolbar.appendChild(filterRow);
  shell.appendChild(toolbar);

  // Policy approval progress bar
  if (policies.length > 0) {
    const approvedCount = policies.filter(p => pmGetStatus(p) === "approved").length;
    const approvalPct = Math.round((approvedCount / policies.length) * 100);
    const approvalWrap = document.createElement("div");
    approvalWrap.className = "pm-approval-wrap";
    approvalWrap.innerHTML = `
      <div class="pm-approval-header">
        <span>Policy approvals</span>
        <span class="pm-approval-pct">${approvedCount} / ${policies.length} approved (${approvalPct}%)</span>
      </div>
      <div class="pm-approval-track">
        <div class="pm-approval-fill${approvedCount === policies.length ? " all-done" : ""}" style="width: ${approvalPct}%"></div>
      </div>`;
    shell.appendChild(approvalWrap);
  }

  const listEl = document.createElement("div");
  listEl.className = "pm-policy-list";
  shell.appendChild(listEl);

  function rebuildList() {
    const search = (state.policySearch || "").toLowerCase();
    const filter = state.policyFilter || "all";
    listEl.innerHTML = "";

    const visible = policies.filter(p => {
      const matchSearch = !search || (p.name || "").toLowerCase().includes(search) || (p.policy_id || "").toLowerCase().includes(search);
      const matchFilter = filter === "all" || pmGetStatus(p) === filter;
      return matchSearch && matchFilter;
    });

    if (!visible.length) {
      listEl.innerHTML = `<div class="pm-empty">No policies match your filter.</div>`;
      return;
    }

    visible.forEach(policy => {
      const idx = policies.indexOf(policy);
      const status = pmGetStatus(policy);
      const fwTags = (policy.framework_mapping || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3);
      const row = document.createElement("div");
      row.className = "pm-policy-row";
      row.innerHTML = `
        <div class="pm-row-left">
          <span class="pm-policy-id-badge">${policy.policy_id || `POL-${String(idx+1).padStart(3,"0")}`}</span>
          <div class="pm-row-meta">
            <span class="pm-policy-name">${policy.name || "Unnamed Policy"}</span>
            ${fwTags.length ? `<div class="pm-fw-tags">${fwTags.map(t => `<span class="pm-fw-tag">${t}</span>`).join("")}</div>` : ""}
          </div>
        </div>
        <div class="pm-row-right">
          <span class="pm-ai-badge">AI</span>
          <span class="pm-status-badge pm-status-${status}">${pmStatusLabel(status)}</span>
          <span class="pm-row-arrow">›</span>
        </div>`;
      row.addEventListener("click", () => { state.selectedPolicyIndex = idx; state.policyDetailTab = "overview"; renderActivePhase(); });
      listEl.appendChild(row);
    });
  }

  rebuildList();
  return shell;
}

function renderPolicyDetail(policies, index) {
  const policy = policies[index];
  const shell = document.createElement("div");
  shell.className = "pm-detail-shell";

  // Back bar
  const backBar = document.createElement("div");
  backBar.className = "pm-back-bar";
  const status = pmGetStatus(policy);
  backBar.innerHTML = `
    <button type="button" class="pm-back-btn">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All policies
    </button>
    <div class="pm-detail-breadcrumb">
      <span class="pm-policy-id-badge">${policy.policy_id || `POL-${String(index+1).padStart(3,"0")}`}</span>
      <span class="pm-detail-name">${policy.name || "Unnamed Policy"}</span>
      <span class="pm-status-badge pm-status-${status}" id="pm-breadcrumb-status">${pmStatusLabel(status)}</span>
    </div>
    <div class="pm-detail-nav">
      ${index > 0 ? `<button type="button" class="pm-nav-btn" id="pm-prev">‹ Prev</button>` : ""}
      <span class="pm-nav-counter">${index + 1} / ${policies.length}</span>
      ${index < policies.length - 1 ? `<button type="button" class="pm-nav-btn" id="pm-next">Next ›</button>` : ""}
    </div>`;
  backBar.querySelector(".pm-back-btn").addEventListener("click", () => { state.selectedPolicyIndex = -1; renderActivePhase(); });
  if (backBar.querySelector("#pm-prev")) backBar.querySelector("#pm-prev").addEventListener("click", () => { state.selectedPolicyIndex = index - 1; state.policyDetailTab = "overview"; renderActivePhase(); });
  if (backBar.querySelector("#pm-next")) backBar.querySelector("#pm-next").addEventListener("click", () => { state.selectedPolicyIndex = index + 1; state.policyDetailTab = "overview"; renderActivePhase(); });
  shell.appendChild(backBar);

  // Tabs
  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "body", label: "Policy Body" },
    { key: "controls", label: "Controls & Risks" },
    { key: "metadata", label: "Metadata" }
  ];
  const tabBar = document.createElement("div");
  tabBar.className = "pm-detail-tabs";
  TABS.forEach(t => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pm-detail-tab" + (state.policyDetailTab === t.key ? " pm-detail-tab-active" : "");
    btn.textContent = t.label;
    btn.addEventListener("click", () => {
      state.policyDetailTab = t.key;
      tabBar.querySelectorAll(".pm-detail-tab").forEach(b => b.classList.remove("pm-detail-tab-active"));
      btn.classList.add("pm-detail-tab-active");
      drawTab();
    });
    tabBar.appendChild(btn);
  });
  shell.appendChild(tabBar);

  const contentArea = document.createElement("div");
  contentArea.className = "pm-detail-content";
  shell.appendChild(contentArea);

  // Local mutable copy
  const local = Object.assign({}, policy);

  function field(lbl, name, type, opts = {}) {
    const wrap = document.createElement("div");
    wrap.className = "pm-field" + (opts.full ? " pm-field-full" : "");
    const label = document.createElement("label");
    label.className = "pm-field-label";
    label.textContent = lbl;
    wrap.appendChild(label);

    if (type === "toggle") {
      const ctrl = document.createElement("label");
      ctrl.className = "toggle-control";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "toggle-input";
      cb.checked = isToggleEnabled(local[name]);
      cb.addEventListener("change", () => { local[name] = cb.checked ? "Yes" : "No"; });
      const span = document.createElement("span");
      span.style.cssText = "font-size:13px;color:var(--text-2)";
      span.textContent = opts.toggleLabel || lbl;
      ctrl.appendChild(cb);
      ctrl.appendChild(span);
      wrap.appendChild(ctrl);
      return wrap;
    }

    let el;
    if (type === "textarea") {
      el = document.createElement("textarea");
      el.className = "pm-field-textarea";
      el.rows = opts.rows || 5;
      el.value = local[name] || "";
      if (opts.readonly) { el.readOnly = true; el.style.opacity = "0.65"; }
    } else if (type === "select") {
      el = document.createElement("select");
      el.className = "pm-field-select";
      const opts2 = typeof getClientUserOptions === "function" ? getClientUserOptions() : [];
      [{ value: "", label: "— Select —" }, ...opts2].forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.value !== undefined ? o.value : o;
        opt.textContent = o.label !== undefined ? o.label : o;
        opt.selected = opt.value === (local[name] || "");
        el.appendChild(opt);
      });
    } else {
      el = document.createElement("input");
      el.type = "text";
      el.className = "pm-field-input";
      el.value = local[name] || "";
      if (opts.readonly) { el.readOnly = true; el.style.opacity = "0.65"; }
    }

    if (!opts.readonly) {
      el.addEventListener("input", () => { local[name] = el.value; });
      el.addEventListener("change", () => { local[name] = el.value; });
    }
    wrap.appendChild(el);
    return wrap;
  }

  function group(title, fields) {
    const g = document.createElement("div");
    g.className = "pm-field-group";
    if (title) {
      const h = document.createElement("p");
      h.className = "pm-field-group-title";
      h.textContent = title;
      g.appendChild(h);
    }
    const grid = document.createElement("div");
    grid.className = "pm-field-grid";
    fields.forEach(f => grid.appendChild(field(f.label, f.name, f.type || "text", f)));
    g.appendChild(grid);
    return g;
  }

  async function savePolicy() {
    const pgData = state.selectedClientData.policyGeneration || {};
    const all = Array.isArray(pgData.policies) ? [...pgData.policies] : [];
    all[index] = Object.assign({}, all[index], local);
    state.selectedClientData.policyGeneration.policies = all;
    state.selectedClientData = await api(
      `/api/clients/${encodeURIComponent(state.selectedClientId)}/policy-generation`,
      { method: "POST", body: JSON.stringify(state.selectedClientData.policyGeneration) }
    );
    syncDerivedVendors(state.selectedClientData);
  }

  function drawTab() {
    contentArea.innerHTML = "";
    const tab = state.policyDetailTab;

    if (tab === "overview") {
      contentArea.appendChild(group("Policy details", [
        { name: "policy_id", label: "Policy ID", readonly: true },
        { name: "name", label: "Policy name" },
        { name: "policy_owner", label: "Policy owner", type: "select" },
        { name: "sign_off_by", label: "Sign off by", type: "select" },
        { name: "policy_version", label: "Version", readonly: true }
      ]));
      contentArea.appendChild(group("Approval status", [
        { name: "published", label: "Published", type: "toggle", toggleLabel: "Mark as published" },
        { name: "sign_off_complete", label: "Signed off", type: "toggle", toggleLabel: "Mark as signed off" }
      ]));
      contentArea.appendChild(group("Executive summary", [
        { name: "executive_summary", label: "Executive summary", type: "textarea", full: true, rows: 6 }
      ]));
    } else if (tab === "body") {
      contentArea.appendChild(group(null, [
        { name: "table_of_contents", label: "Table of contents", type: "textarea", full: true, rows: 4 }
      ]));
      // Policy body with expand/collapse
      const bodyGroup = group(null, [
        { name: "body", label: "Policy body", type: "textarea", full: true, rows: 6 }
      ]);
      const bodyTextarea = bodyGroup.querySelector("textarea");
      const wordCount = ((local.body || "").split(/\s+/).filter(Boolean).length);
      let bodyExpanded = false;
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "pm-body-toggle-btn";
      toggleBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Show full policy · ~${wordCount.toLocaleString()} words`;
      toggleBtn.addEventListener("click", () => {
        bodyExpanded = !bodyExpanded;
        bodyTextarea.rows = bodyExpanded ? 30 : 6;
        toggleBtn.innerHTML = bodyExpanded
          ? `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Collapse policy text`
          : `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Show full policy · ~${wordCount.toLocaleString()} words`;
      });
      bodyGroup.appendChild(toggleBtn);
      contentArea.appendChild(bodyGroup);
    } else if (tab === "controls") {
      contentArea.appendChild(group("Framework & controls", [
        { name: "framework_mapping", label: "Framework mapping", type: "textarea", full: true, rows: 3 },
        { name: "linked_risks", label: "Linked risks" },
        { name: "linked_controls", label: "Linked controls" }
      ]));
    } else if (tab === "metadata") {
      contentArea.appendChild(group("Policy metadata", [
        { name: "metadata_block", label: "Metadata block", type: "textarea", full: true, rows: 8, readonly: true },
        { name: "approval_history_text", label: "Approval history", type: "textarea", full: true, rows: 5, readonly: true }
      ]));
    }

    const saveBar = document.createElement("div");
    saveBar.className = "pm-save-bar";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "action-button";
    saveBtn.textContent = "Save Changes";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      try {
        await savePolicy();
        const newStatus = pmGetStatus(local);
        const crumb = shell.querySelector("#pm-breadcrumb-status");
        if (crumb) { crumb.className = `pm-status-badge pm-status-${newStatus}`; crumb.textContent = pmStatusLabel(newStatus); }
        setStatus("Policy saved.", "success");
      } catch (e) { setStatus("Save failed: " + e.message, "error"); }
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    });
    saveBar.appendChild(saveBtn);
    contentArea.appendChild(saveBar);
  }

  drawTab();
  return shell;
}

function renderPolicyGenerationStages(progress) {
  const { totalStages, pct, currentStageNum } = pgCalcStats(progress);

  const section = document.createElement("section");
  section.className = "pg-panel";
  section.dataset.pgPanel = "1";

  // Header
  const head = document.createElement("div");
  head.className = "pg-head";
  const headLeft = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "section-label";
  kicker.textContent = "Generation workflow";
  const titleEl = document.createElement("h4");
  titleEl.className = "pg-title";
  titleEl.dataset.pgTitle = "1";
  titleEl.textContent = progress.failed
    ? "Generation failed"
    : progress.completed
    ? "All policies generated"
    : progress.inProgress
    ? (progress.stageNote || "Generating policies...")
    : "Queued — will start shortly";
  headLeft.appendChild(kicker);
  headLeft.appendChild(titleEl);
  const badge = renderBadge(
    progress.inProgress ? "Running" : progress.completed ? "Complete" : progress.failed ? "Failed" : "Queued",
    progress.failed ? "danger" : progress.completed ? "success" : progress.inProgress ? "warning" : "default"
  );
  badge.dataset.pgBadge = "1";
  head.appendChild(headLeft);
  head.appendChild(badge);
  section.appendChild(head);

  // Progress bar
  if (progress.inProgress || progress.completed || progress.failed) {
    const barWrap = document.createElement("div");
    barWrap.className = "pg-bar-wrap";
    const barInfo = document.createElement("div");
    barInfo.className = "pg-bar-info";
    const stageLabel = document.createElement("span");
    stageLabel.dataset.pgStageLabel = "1";
    stageLabel.textContent = progress.completed
      ? `All ${totalStages} stages complete`
      : `Stage ${currentStageNum} of ${totalStages}`;
    const pctLabel = document.createElement("span");
    pctLabel.className = "pg-pct";
    pctLabel.dataset.pgPct = "1";
    pctLabel.textContent = pct + "%";
    barInfo.appendChild(stageLabel);
    barInfo.appendChild(pctLabel);
    barWrap.appendChild(barInfo);
    const track = document.createElement("div");
    track.className = "pg-bar-track";
    const fill = document.createElement("div");
    fill.className = "pg-bar-fill" + (progress.failed ? " pg-bar-failed" : progress.completed ? " pg-bar-done" : "");
    fill.style.width = pct + "%";
    fill.dataset.pgFill = "1";
    track.appendChild(fill);
    barWrap.appendChild(track);
    section.appendChild(barWrap);
  }

  // Stage steps
  const stageList = document.createElement("div");
  stageList.className = "pg-stage-list";
  progress.stages.forEach((stage, index) => {
    const norm = String(stage.status || "pending").toLowerCase();
    const item = document.createElement("div");
    item.className = `pg-stage pg-stage-${norm}`;
    item.dataset.pgStageIdx = index;
    let iconHtml;
    if (norm === "complete")         iconHtml = `<span class="pg-stage-icon pg-icon-done">&#10003;</span>`;
    else if (norm === "in-progress") iconHtml = `<span class="pg-stage-icon pg-icon-active"><span class="pg-spinner"></span></span>`;
    else if (norm === "failed")      iconHtml = `<span class="pg-stage-icon pg-icon-fail">&#10005;</span>`;
    else                             iconHtml = `<span class="pg-stage-icon pg-icon-pending">${index + 1}</span>`;
    const noteText = stage.note || (norm === "complete" ? "Done" : norm === "in-progress" ? "Running..." : norm === "failed" ? "Failed" : "Waiting to start");
    item.innerHTML = `${iconHtml}<div class="pg-stage-copy"><strong class="pg-stage-label">${stage.label || `Stage ${index + 1}`}</strong><span class="pg-stage-note">${noteText}</span></div>`;
    stageList.appendChild(item);
  });
  section.appendChild(stageList);

  // Elapsed time
  if (progress.startedAt) {
    const elapsed = document.createElement("p");
    elapsed.className = "pg-elapsed";
    elapsed.dataset.pgElapsed = "1";
    elapsed.textContent = pgElapsedText(progress);
    section.appendChild(elapsed);
  }

  return section;
}

// In-place update — zero DOM replacement, zero blink
function patchPolicyGenerationStages(progress) {
  const panel = document.querySelector("[data-pg-panel]");
  if (!panel) return false;

  const { totalStages, pct, currentStageNum } = pgCalcStats(progress);

  const titleEl = panel.querySelector("[data-pg-title]");
  if (titleEl) {
    const newTitle = progress.failed ? "Generation failed"
      : progress.completed ? "All policies generated"
      : progress.inProgress ? (progress.stageNote || "Generating policies...")
      : "Queued — will start shortly";
    if (titleEl.textContent !== newTitle) titleEl.textContent = newTitle;
  }

  const stageLabelEl = panel.querySelector("[data-pg-stage-label]");
  if (stageLabelEl) {
    const newLabel = progress.completed ? `All ${totalStages} stages complete` : `Stage ${currentStageNum} of ${totalStages}`;
    if (stageLabelEl.textContent !== newLabel) stageLabelEl.textContent = newLabel;
  }

  const pctEl = panel.querySelector("[data-pg-pct]");
  if (pctEl && pctEl.textContent !== pct + "%") pctEl.textContent = pct + "%";

  const fillEl = panel.querySelector("[data-pg-fill]");
  if (fillEl && fillEl.style.width !== pct + "%") fillEl.style.width = pct + "%";

  const elapsedEl = panel.querySelector("[data-pg-elapsed]");
  if (elapsedEl) elapsedEl.textContent = pgElapsedText(progress);

  // Update stage rows in-place
  progress.stages.forEach((stage, index) => {
    const row = panel.querySelector(`[data-pg-stage-idx="${index}"]`);
    if (!row) return;
    const norm = String(stage.status || "pending").toLowerCase();
    const newClass = `pg-stage pg-stage-${norm}`;
    if (row.className !== newClass) {
      row.className = newClass;
      let iconHtml;
      if (norm === "complete")         iconHtml = `<span class="pg-stage-icon pg-icon-done">&#10003;</span>`;
      else if (norm === "in-progress") iconHtml = `<span class="pg-stage-icon pg-icon-active"><span class="pg-spinner"></span></span>`;
      else if (norm === "failed")      iconHtml = `<span class="pg-stage-icon pg-icon-fail">&#10005;</span>`;
      else                             iconHtml = `<span class="pg-stage-icon pg-icon-pending">${index + 1}</span>`;
      const noteText = stage.note || (norm === "complete" ? "Done" : norm === "in-progress" ? "Running..." : norm === "failed" ? "Failed" : "Waiting to start");
      row.innerHTML = `${iconHtml}<div class="pg-stage-copy"><strong class="pg-stage-label">${stage.label || `Stage ${index + 1}`}</strong><span class="pg-stage-note">${noteText}</span></div>`;
    }
  });

  return true;
}

function renderPhaseStatusSummary(config, phaseState) {
  const wrapper = document.createElement("div");
  wrapper.className = "status-grid";

  const statusCard = document.createElement("section");
  statusCard.className = `info-card status-panel tone-${phaseState.status === "blocked" ? "danger" : phaseState.complete ? "success" : "default"}`;
  const head = document.createElement("div");
  head.className = "panel-head compact";
  const title = document.createElement("h4");
  title.textContent = config.key === "vendor-management" ? "Section status" : "Phase status";
  head.appendChild(title);
  head.appendChild(
    renderBadge(
      phaseState.status === "blocked" ? "Blocked" : phaseState.complete ? "Complete" : phaseState.status === "in-progress" ? "In progress" : "Ready",
      phaseState.status === "blocked" ? "danger" : phaseState.complete ? "success" : phaseState.status === "in-progress" ? "warning" : "default"
    )
  );
  statusCard.appendChild(head);

  const detail = document.createElement("p");
  detail.className = "record-note";
  detail.textContent = phaseState.detail;
  statusCard.appendChild(detail);
  wrapper.appendChild(statusCard);

  if (config.key === "policy-generation") {
    const onboarding = state.selectedClientData.onboarding || {};
    const policyProgress = getPolicyGenerationProgress(state.selectedClientData);
    // Use AI-discovered risks from risk assessment if available, otherwise fall back to derived
    const aiDiscoveredRisks = (state.selectedClientData.riskAssessment?.risks || []).filter(r => r && r.threat);
    const topRisks = aiDiscoveredRisks.length > 0
      ? aiDiscoveredRisks.map(r => ({ title: r.threat }))
      : getOnboardingSnapshot(onboarding).derivedTopRisks;
    const risksAreAiDiscovered = aiDiscoveredRisks.length > 0;
    wrapper.appendChild(renderPolicyGenerationStages(policyProgress));
    const improvementLog = state.selectedClientData?.policyGeneration?.improvement_log;
    if (improvementLog && policyProgress.completed) {
      const impPanel = renderImprovementReport(improvementLog);
      if (impPanel) wrapper.appendChild(impPanel);
    }
    const riskCard = document.createElement("section");
    riskCard.className = "info-card status-panel tone-default";
    const riskHead = document.createElement("div");
    riskHead.className = "panel-head compact";
    const riskTitle = document.createElement("h4");
    riskTitle.textContent = "Inputs used for policy generation";
    riskHead.appendChild(riskTitle);
    riskCard.appendChild(riskHead);
    const list = document.createElement("div");
    list.className = "status-list";
    [
      `Framework: ${onboarding.framework_selection || "Not selected"}`,
      "Policy templates: stored",
      "Framework materials: stored",
      ...topRisks.map((risk) => `${risksAreAiDiscovered ? "AI-discovered risk" : "Top risk"}: ${risk.title}`)
    ].forEach((entry) => {
      const item = document.createElement("div");
      item.className = "status-item";
      item.textContent = entry;
      list.appendChild(item);
    });
    riskCard.appendChild(list);
    wrapper.appendChild(riskCard);
  }

  if (config.key === "risk-assessment") {
    const risks = nonBlankItems((state.selectedClientData.riskAssessment?.risks || []).map(decorateRiskRecord), getPhaseConfig("risk-assessment").itemFields);
    const inherentScores = risks.map((risk) => parseScore(risk.inherent_score)).filter(Number.isInteger);
    const residualScores = risks.map((risk) => parseScore(risk.residual_score)).filter(Number.isInteger);
    wrapper.appendChild(renderRiskSummaryPanel(risks, inherentScores, residualScores));
    wrapper.appendChild(renderDualRiskMatrix(
      "Risk Matrix",
      risks,
      r => r.likelihood, r => r.impact,
      r => r.residual_likelihood, r => r.residual_impact,
      r => r.threat || r.risk_title || "Unknown risk"
    ));
  }

  if (config.key === "vendor-risk") {
    const onboardingSnapshot = getOnboardingSnapshot(state.selectedClientData.onboarding || {});
    const vendors = nonBlankItems((state.selectedClientData.vendorRisk?.vendors || []).map(decorateVendorRecord), getPhaseConfig("vendor-risk").itemFields);
    const vendorCard = document.createElement("section");
    vendorCard.className = "info-card status-panel tone-default";
    const vendorHead = document.createElement("div");
    vendorHead.className = "panel-head compact";
    const vendorTitle = document.createElement("h4");
    vendorTitle.textContent = "Vendors selected for this client";
    vendorHead.appendChild(vendorTitle);
    vendorCard.appendChild(vendorHead);
    const list = document.createElement("div");
    list.className = "status-list";
    onboardingSnapshot.vendorCandidates.forEach((vendor) => {
      const item = document.createElement("div");
      item.className = "status-item";
      item.textContent = `${vendor.vendor_name || "Unnamed vendor"} | ${vendor.criticality || "Unclassified"} | ${vendor.purpose || "No client-specific purpose yet"}`;
      list.appendChild(item);
    });
    if (!onboardingSnapshot.vendorCandidates.length) {
      const item = document.createElement("div");
      item.className = "status-item";
      item.textContent = "No vendors have been added to the client vendor list yet.";
      list.appendChild(item);
    }
    vendorCard.appendChild(list);
    wrapper.appendChild(vendorCard);
    const inherentVendorScores = vendors.map((vendor) => parseScore(vendor.inherent_score)).filter(Number.isInteger);
    const residualVendorScores = vendors.map((vendor) => parseScore(vendor.residual_score)).filter(Number.isInteger);
    wrapper.appendChild(renderRiskSummaryPanel(vendors, inherentVendorScores, residualVendorScores, "vendor"));
    wrapper.appendChild(renderDualRiskMatrix(
      "Vendor Risk Matrix",
      vendors,
      v => v.vendor_likelihood, v => v.vendor_impact,
      v => v.residual_likelihood, v => v.residual_impact,
      v => v.vendor_name || "Unknown vendor"
    ));
  }

  if (config.key === "output") {
    const cd = state.selectedClientData;
    const policyCount = (cd?.policyGeneration?.policies || []).filter((p) => isFilled(p.body)).length;
    const riskCount = (cd?.riskAssessment?.risks || []).length;
    const vendorCount = (cd?.vendorRisk?.vendors || []).length;
    const controlCount = (cd?.controlMapping?.controls || []).length;

    // Policy downloads
    if (policyCount > 0) {
      wrapper.appendChild(renderBrowserDownloadCard("Policy downloads", [
        { label: `Download Policy Pack (.zip — ${policyCount} PDFs)`, onClick: () => exportPoliciesZip(cd) }
      ]));
    }

    // Risk register
    if (riskCount > 0) {
      wrapper.appendChild(renderBrowserDownloadCard("Risk register downloads", [
        { label: `Download Risk Register (.csv) — ${riskCount} risks`, onClick: () => exportRisksCsv(cd) }
      ]));
    }

    // Vendor register
    if (vendorCount > 0) {
      wrapper.appendChild(renderBrowserDownloadCard("Vendor register downloads", [
        { label: `Download Vendor Register (.csv) — ${vendorCount} vendors`, onClick: () => exportVendorsCsv(cd) }
      ]));
    }

    // Control mapping — auto-generate if missing
    if (controlCount > 0) {
      wrapper.appendChild(renderBrowserDownloadCard("Control mapping downloads", [
        { label: `Download Control Mapping (.csv) — ${controlCount} controls`, onClick: () => exportControlsCsv(cd) }
      ]));
    } else if (policyCount > 0) {
      // Controls missing — offer to generate now
      const ctrlCard = document.createElement("section");
      ctrlCard.className = "info-card status-panel tone-default";
      const ctrlHead = document.createElement("div");
      ctrlHead.className = "panel-head compact";
      const ctrlTitle = document.createElement("h4");
      ctrlTitle.textContent = "Control mapping downloads";
      ctrlHead.appendChild(ctrlTitle);
      ctrlCard.appendChild(ctrlHead);
      const ctrlRow = document.createElement("div");
      ctrlRow.className = "download-button-row";
      const genBtn = document.createElement("button");
      genBtn.type = "button";
      genBtn.className = "action-button";
      genBtn.textContent = "Generate & Download Control Mapping";
      genBtn.addEventListener("click", async () => {
        genBtn.disabled = true;
        genBtn.textContent = "Generating...";
        setStatus("Generating control mapping...");
        try {
          await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process-controls`, { method: "POST" });
          await loadClient(state.selectedClientId);
          setStatus("Control mapping generated — downloading now.", "success");
          exportControlsCsv(state.selectedClientData);
        } catch (err) {
          setStatus("Control mapping failed: " + err.message, "error");
          genBtn.disabled = false;
          genBtn.textContent = "Generate & Download Control Mapping";
        }
      });
      ctrlRow.appendChild(genBtn);
      ctrlCard.appendChild(ctrlRow);
      wrapper.appendChild(ctrlCard);
    }

    // Show summary if nothing ready yet
    if (policyCount === 0 && riskCount === 0 && vendorCount === 0) {
      const note = document.createElement("p");
      note.className = "record-note";
      note.textContent = "Complete onboarding, generate policies, risks, and vendor assessments to unlock downloads.";
      wrapper.appendChild(note);
    }
  }

  wrapper.appendChild(
    renderListSection(
      "What is still needed",
      phaseState.blockers,
      config.key === "policy-generation" && getPolicyGenerationProgress(state.selectedClientData).inProgress
        ? "Policy generation is in progress."
        : "This phase is ready to work on.",
      phaseState.blockers.length
        ? "danger"
        : config.key === "policy-generation" && getPolicyGenerationProgress(state.selectedClientData).inProgress
          ? "warning"
          : "success"
    )
  );

  return wrapper;
}

function renderBlockedPhase(config, phaseState) {
  const shell = document.createElement("section");
  shell.className = "tab-panel active";

  const head = document.createElement("div");
  head.className = "panel-head";
  const titleWrap = document.createElement("div");
  titleWrap.innerHTML = `<p class="section-label">${config.phase}</p><h3>${config.title}</h3>`;
  head.appendChild(titleWrap);
  shell.appendChild(head);

  const note = document.createElement("p");
  note.className = "tab-copy";
  note.textContent = config.description;
  shell.appendChild(note);

  const blockerCard = document.createElement("section");
  blockerCard.className = "blocked-panel";
  const isOnboardingGate = phaseState.blockers.some(b => /onboarding/i.test(b));
  const blockerTitle = document.createElement("h4");
  blockerTitle.textContent = isOnboardingGate ? "Complete onboarding first" : "Phase blocked";
  const blockerText = document.createElement("p");
  blockerText.className = "record-note";
  blockerText.textContent = isOnboardingGate
    ? "Select your compliance framework(s) and fill in your company context to unlock this module."
    : "Complete the previous phase before continuing.";
  blockerCard.appendChild(blockerTitle);
  blockerCard.appendChild(blockerText);
  if (isOnboardingGate) {
    const goBtn = document.createElement("button");
    goBtn.type = "button";
    goBtn.className = "action-button";
    goBtn.textContent = "Go to Onboarding";
    goBtn.style.marginTop = "0.75rem";
    goBtn.addEventListener("click", () => {
      state.activePhaseKey = "onboarding";
      renderTabs();
      renderActivePhase();
    });
    blockerCard.appendChild(goBtn);
  }
  shell.appendChild(blockerCard);
  shell.appendChild(renderPhaseStatusSummary(config, phaseState));

  activeTabPanel.innerHTML = "";
  activeTabPanel.appendChild(shell);
}

function collectPhasePayload(config, form) {
  const payload = cloneData(state.selectedClientData[config.property]);

  if (config.key === "onboarding") {
    Object.assign(payload, collectValues(form, [config.frameworkField]));
    // Also collect the v2 framework selection (JSON array — distinguishes Type I vs Type II)
    const v2Input = form.querySelector('[data-field="framework_selection_v2"]');
    if (v2Input) payload.framework_selection_v2 = v2Input.value;
  }

  if (config.groups) {
    config.groups.forEach((group) => Object.assign(payload, collectValues(form, group.fields)));
  }

  if (config.metaFields) {
    Object.assign(payload, collectValues(form, config.metaFields));
  }

  if (config.itemCollection) {
    const collectionContainer = form.querySelector(`[data-collection="${config.itemCollection}"]`);
    payload[config.itemCollection] = collectionContainer
      ? nonBlankItems(collectRepeatableValues(collectionContainer, config.itemFields), config.itemFields)
      : (payload[config.itemCollection] || []);
  }

  if (config.key === "onboarding") {
    const userContainer = form.querySelector('[data-collection="client_user_records"]');
    const userRecords = userContainer
      ? nonBlankItems(collectRepeatableValues(userContainer, clientUserRecordFields), clientUserRecordFields)
      : getStructuredClientUsers(payload);
    payload.client_user_records = parseClientUsers(userRecords);
    payload.client_users = serializeClientUsers(payload.client_user_records);
    payload.client_usernames = payload.client_user_records.map((user) => user.name).join("\n");
  }

  if (config.key === "policy-generation") {
    payload.top_risks_input = getOnboardingSnapshot(state.selectedClientData.onboarding || {})
      .derivedTopRisks.map((risk) => risk.title)
      .join(", ");
  }

  if (config.key === "risk-assessment") {
    payload.risks = (payload.risks || []).map((risk) => decorateRiskRecord(risk));
  }

  if (config.key === "vendor-risk") {
    payload.vendors = (payload.vendors || []).map((vendor) => decorateVendorRecord(vendor));
  }

  return payload;
}

function getSaveSectionKey(config) {
  return config.key === "vendor-management" ? "onboarding" : config.key;
}

function syncDraftStateFromForm(config, form) {
  if (!config || !form || !state.selectedClientData) {
    return;
  }
  state.selectedClientData[config.property] = collectPhasePayload(config, form);
}

function renderClientUsersSection(group, sectionData, config, form) {
  const validation = config.key === "onboarding" ? state.validation.onboarding : null;
  const section = document.createElement("section");
  section.className = "form-section";

  const title = document.createElement("h4");
  title.textContent = group.title;
  const noteNode = document.createElement("p");
  noteNode.className = "section-note";
  noteNode.textContent = group.note;
  section.appendChild(title);
  section.appendChild(noteNode);

  const actions = document.createElement("div");
  actions.className = "section-head-row";
  const helper = document.createElement("p");
  helper.className = "section-note";
  helper.textContent = "Add each approver as a separate record with name, email, and designation.";
  actions.appendChild(helper);
  const addUserButton = document.createElement("button");
  addUserButton.type = "button";
  addUserButton.className = "action-button ghost";
  addUserButton.textContent = "Add user";
  addUserButton.addEventListener("click", () => {
    syncDraftStateFromForm(config, form);
    state.selectedClientData.onboarding.client_user_records = [
      ...getStructuredClientUsers(state.selectedClientData.onboarding || {}),
      { name: "", email: "", designation: "" }
    ];
    renderActivePhase();
  });
  actions.appendChild(addUserButton);
  section.appendChild(actions);

  if (validation?.errors?.client_user_records) {
    const error = document.createElement("p");
    error.className = "section-error";
    error.textContent = validation.errors.client_user_records;
    section.appendChild(error);
  }

  // Use pre-normalised records (includes blank new records); fall back to getStructuredClientUsers
  const users = Array.isArray(sectionData.client_user_records)
    ? sectionData.client_user_records
    : getStructuredClientUsers(sectionData);
  const list = renderRepeatableCards(
    users,
    clientUserRecordFields,
    "Approver",
    (index) => {
      syncDraftStateFromForm(config, form);
      state.selectedClientData.onboarding.client_user_records = getStructuredClientUsers(state.selectedClientData.onboarding || {}).filter(
        (_, userIndex) => userIndex !== index
      );
      renderActivePhase();
    },
    {
      getItemErrors: (index) => getCollectionItemErrors(validation, "client_user_records", index)
    }
  );
  list.dataset.collection = "client_user_records";
  section.appendChild(list);
  return section;
}

function renderActivePhase() {
  ensureActivePhaseAvailable();
  const config = phaseConfigs.find((entry) => entry.key === state.activePhaseKey);
  const phaseState = getPhaseState(config.key);
  if (config.key === "vendor-risk") {
    syncDerivedVendors(state.selectedClientData);
  }
  let sectionData = config.property ? cloneData(state.selectedClientData[config.property] || {}) : {};
  if (config.key === "risk-assessment") {
    sectionData.risks = (sectionData.risks || []).map(decorateRiskRecord);
  }
  if (config.key === "vendor-risk") {
    sectionData.vendors = (sectionData.vendors || []).map(decorateVendorRecord);
  }
  if (config.key === "onboarding") {
    // For rendering: normalise records but keep blanks so newly-added empty cards appear.
    // parseClientUsers / getStructuredClientUsers filter out blank names — don't use them here.
    if (Array.isArray(sectionData.client_user_records) && sectionData.client_user_records.length) {
      sectionData.client_user_records = sectionData.client_user_records.map((user, index) => ({
        id:          user.id || `client-user-${index + 1}`,
        name:        String(user.name        || "").trim(),
        email:       String(user.email       || "").trim(),
        designation: String(user.designation || "").trim()
      }));
    } else {
      sectionData.client_user_records = getStructuredClientUsers(sectionData);
    }
  }

  if (!phaseState.unlocked && config.key !== "onboarding") {
    renderBlockedPhase(config, phaseState);
    return;
  }

  if (config.customRender && config.key === "intelligence") {
    activeTabPanel.innerHTML = "";
    if (typeof icRenderTab === "function") {
      activeTabPanel.appendChild(icRenderTab(state.selectedClientData));
    }
    return;
  }

  if (config.customRender && config.key === "evidence-tracker") {
    renderEvidenceTracker();
    if (typeof ucInjectStalenessChips === "function") ucInjectStalenessChips();
    return;
  }

  activeTabPanel.innerHTML = "";
  const shell = document.createElement("section");
  shell.className = "tab-panel active";

  const head = document.createElement("div");
  head.className = "panel-head";
  const titleWrap = document.createElement("div");
  titleWrap.innerHTML = `<p class="section-label">${config.phase}</p><h3>${config.title}</h3>`;
  head.appendChild(titleWrap);

  if (config.itemCollection && config.key !== "onboarding" && config.key !== "vendor-management") {
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "action-button ghost";
    addButton.textContent = `Add ${config.itemLabel}`;
    addButton.addEventListener("click", () => {
      syncDraftStateFromForm(config, form);
      const nextItem = {};
      config.itemFields.forEach((field) => {
        nextItem[field.name] = "";
      });
      state.selectedClientData[config.property][config.itemCollection].push(nextItem);
      renderActivePhase();
    });
    head.appendChild(addButton);
  }

  const note = document.createElement("p");
  note.className = "tab-copy";
  note.textContent = config.description;

  const form = document.createElement("form");
  form.className = "record-shell";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (config.key === "onboarding") {
      const payload = collectPhasePayload(config, form);
      fwInterceptOnboardingSave(state.selectedClientId, payload, () => {
        savePhase(config, form).catch((error) => setStatus(error.message, "error"));
      });
    } else {
      savePhase(config, form).catch((error) => setStatus(error.message, "error"));
    }
  });

  if (config.key === "onboarding") {
    const obSnapshot = getOnboardingSnapshot(sectionData);
    // Show preview when complete and not in edit mode
    if (obSnapshot.ready && !state.onboardingEditMode) {
      activeTabPanel.innerHTML = "";
      const previewShell = document.createElement("section");
      previewShell.className = "tab-panel active";
      previewShell.appendChild(renderOnboardingPreview(sectionData, config));
      activeTabPanel.appendChild(previewShell);
      return;
    }
    form.appendChild(renderOnboardingOverview(sectionData));
    const validationSummary = renderOnboardingValidationSummary(state.validation.onboarding);
    if (validationSummary) {
      form.appendChild(validationSummary);
    }
    // Edit mode banner
    if (state.onboardingEditMode) {
      const editBanner = document.createElement("div");
      editBanner.className = "ob-editing-banner";
      editBanner.innerHTML = `<span><strong>Edit mode</strong> — changes will only update affected policies, risks, and vendors. Unrelated sections are untouched.</span>`;
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "action-button ghost";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => {
        state.onboardingEditMode = false;
        renderActivePhase();
      });
      editBanner.appendChild(cancelBtn);
      form.appendChild(editBanner);
    }
    form.appendChild(renderFwCardSection(sectionData, form));
  } else {
    form.appendChild(renderPhaseStatusSummary(config, phaseState));
  }

  const onboardingReadyToExpand = true; // Always show all sections; framework validation is handled on save
  const isApproverGroup = (group) => group?.custom === "client-users";
  const leadingGroups =
    config.key === "onboarding" ? (config.groups || []).filter((group) => !isApproverGroup(group)) : config.groups || [];
  const trailingGroups =
    config.key === "onboarding" ? (config.groups || []).filter((group) => isApproverGroup(group)) : [];

  const appendGroupSections = (groups, prefixSeed) => {
    groups.forEach((group, index) => {
      if (group.custom === "client-users") {
        form.appendChild(renderClientUsersSection(group, sectionData, config, form));
        return;
      }
      const section = document.createElement("section");
      section.className = "form-section";
      const title = document.createElement("h4");
      title.textContent = group.title;
      const noteNode = document.createElement("p");
      noteNode.className = "section-note";
      noteNode.textContent = group.note;
      section.appendChild(title);
      section.appendChild(noteNode);
      const groupErrors =
        config.key === "onboarding"
          ? Object.fromEntries(
              group.fields
                .filter((field) => state.validation.onboarding?.errors?.[field.name])
                .map((field) => [field.name, state.validation.onboarding.errors[field.name]])
            )
          : {};
      section.appendChild(renderFieldGrid(group.fields, sectionData, `${config.key}-${prefixSeed}-${index}`, groupErrors));
      form.appendChild(section);
    });
  };

  if (leadingGroups.length && onboardingReadyToExpand) {
    appendGroupSections(leadingGroups, "primary");
  }

  if (config.metaFields && config.key !== "output") {
    const metaSection = document.createElement("section");
    metaSection.className = "form-section";
    const title = document.createElement("h4");
    title.textContent = `${config.label} details`;
    metaSection.appendChild(title);
    metaSection.appendChild(renderFieldGrid(config.metaFields, sectionData, `${config.key}-meta`));
    form.appendChild(metaSection);
  }

  if (config.itemCollection && config.key !== "output") {
    const itemSection = document.createElement("section");
    itemSection.className = "form-section";
    const itemHead = document.createElement("div");
    itemHead.className = "section-head-row";
    const itemTitle = document.createElement("h4");
    itemTitle.textContent =
      config.key === "vendor-management"
        ? "Central vendor list"
        : config.key === "onboarding"
          ? "Step 5: Initial vendor list"
          : `${config.itemLabel} records`;
    itemHead.appendChild(itemTitle);
    if (config.key === "onboarding" || config.key === "vendor-management") {
      const addVendorButton = document.createElement("button");
      addVendorButton.type = "button";
      addVendorButton.className = "action-button ghost";
      addVendorButton.textContent = "Add vendor";
      addVendorButton.addEventListener("click", () => {
        syncDraftStateFromForm(config, form);
        const nextItem = {};
        config.itemFields.forEach((field) => {
          nextItem[field.name] = "";
        });
        state.selectedClientData[config.property][config.itemCollection].push(nextItem);
        renderActivePhase();
      });
      itemHead.appendChild(addVendorButton);
    }
    const itemNote = document.createElement("p");
    itemNote.className = "section-note";
    itemNote.textContent =
      config.key === "vendor-management"
        ? "Maintain one clean vendor list per client here. Add, update, or remove vendors as the client stack changes. Changes here feed vendor assessments and reset downstream outputs when needed."
        : config.key === "onboarding"
        ? "Capture the vendors this client already uses during onboarding. Saved vendor names appear as you type; confirm the description and enter this client’s purpose."
        : config.key === "policy-generation"
        ? "Edit each policy, then mark it published and signed off. Once every policy is approved and saved, DB Agent automatically starts risk and vendor assessment."
        : config.key === "vendor-risk"
          ? "DB Agent prefilled vendor candidates from the onboarding profile. Review and complete the vendor assessments here."
          : `Add the ${config.itemLabel.toLowerCase()} records for this phase.`;
    if (config.key === "onboarding") {
      itemNote.textContent =
        "Capture the vendors this client already uses during onboarding. These entries are written to reusable storage when you click Save onboarding to storage and continue.";
    }
    itemSection.appendChild(itemHead);
    itemSection.appendChild(itemNote);

    const items = sectionData[config.itemCollection] || [];

    if (config.key === "risk-assessment" && items.filter(r => r && (r.risk_id || r.threat)).length > 0) {
      itemSection.appendChild(renderRiskManager(sectionData));
    } else if (config.key === "vendor-risk" && items.filter(v => v && (v.vendor_id || v.vendor_name)).length > 0) {
      itemSection.appendChild(renderVendorManager(sectionData));
    } else if (config.key === "policy-generation" && items.filter(p => p && (p.policy_id || p.name)).length > 0) {
      itemSection.appendChild(renderPolicyManager(sectionData));
    } else if (config.key === "control-mapping" && items.filter(c => c && (c.control_id || c.description)).length > 0) {
      itemSection.appendChild(renderControlManager(sectionData));
    } else {
      const list = renderRepeatableCards(
        items,
        config.itemFields,
        config.itemLabel,
        (index) => {
          syncDraftStateFromForm(config, form);
          state.selectedClientData[config.property][config.itemCollection].splice(index, 1);
          renderActivePhase();
        },
        {
          collapsible: config.itemLabel === "Vendor" && (config.key === "onboarding" || config.key === "vendor-management"),
          getItemErrors:
            config.key === "onboarding"
              ? (index) => getCollectionItemErrors(state.validation.onboarding, config.itemCollection, index)
              : undefined
        }
      );
      list.dataset.collection = config.itemCollection;
      itemSection.appendChild(list);
    }
    // "Add another vendor" footer button removed — duplicate of "Add vendor" in section header
    form.appendChild(itemSection);
  }

  if (trailingGroups.length && onboardingReadyToExpand) {
    appendGroupSections(trailingGroups, "tail");
  }

  const actions = document.createElement("div");
  actions.className = "form-actions";
  const policyProgress = config.key === "policy-generation" ? getPolicyGenerationProgress(state.selectedClientData) : null;
  if (config.key === "onboarding" && !state.onboardingEditMode) {
    const saveHint = document.createElement("p");
    saveHint.className = "save-hint";
    saveHint.textContent =
      "What you typed here becomes reusable vendor data only after you save onboarding. Until then it is still just the current on-screen draft.";
    actions.appendChild(saveHint);

    const draftButton = document.createElement("button");
    draftButton.type = "button";
    draftButton.className = "action-button ghost";
    draftButton.textContent = "Save Draft";
    draftButton.addEventListener("click", () => {
      savePhase(config, form, { skipValidation: true, draftOnly: true, suppressAdvance: true }).catch((error) =>
        setStatus(error.message, "error")
      );
    });
    actions.appendChild(draftButton);
  }
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "action-button";
  submitButton.textContent =
    config.key === "onboarding" && state.onboardingEditMode
      ? "Save Changes"
      : config.key === "onboarding"
        ? "Finish Onboarding"
      : config.key === "vendor-management"
        ? "Save Vendor Management"
      : config.key === "policy-generation"
        ? "Save Approvals"
        : `Save ${config.label}`;
  if (policyProgress?.active) {
    submitButton.disabled = true;
    submitButton.title = policyProgress.inProgress
      ? "Policy generation is running — please wait until it completes."
      : "Policy generation is queued — saving is locked until generation finishes.";
  }
  if (config.key !== "output") {
    actions.appendChild(submitButton);
  }
  if (config.key === "risk-assessment") {
    const riskItems = nonBlankItems(
      (state.selectedClientData.riskAssessment?.risks || []).map(decorateRiskRecord),
      getPhaseConfig("risk-assessment").itemFields
    );
    const policyApproval = getPolicyApprovalStatus(state.selectedClientData);
    if (riskItems.length === 0 && policyApproval.allApproved) {
      const generateRisksBtn = document.createElement("button");
      generateRisksBtn.type = "button";
      generateRisksBtn.className = "action-button";
      generateRisksBtn.textContent = "Generate Risk Assessment";
      generateRisksBtn.addEventListener("click", async () => {
        generateRisksBtn.disabled = true;
        generateRisksBtn.textContent = "Generating risks...";
        setStatus("Generating risk assessment from published policies...");
        try {
          state.selectedClientData = await api(
            `/api/clients/${encodeURIComponent(state.selectedClientId)}/process-risks`,
            { method: "POST" }
          );
          syncDerivedVendors(state.selectedClientData);
          renderWorkspaceHeader(state.selectedClientData.client);
          renderTabs();
          renderActivePhase();
          const newRiskCount = nonBlankItems(
            (state.selectedClientData.riskAssessment?.risks || []).map(decorateRiskRecord),
            getPhaseConfig("risk-assessment").itemFields
          ).length;
          setStatus(`Risk assessment generated — ${newRiskCount} risk${newRiskCount !== 1 ? "s" : ""} identified.`, "success");
        } catch (err) {
          setStatus("Risk generation failed: " + err.message, "error");
          generateRisksBtn.disabled = false;
          generateRisksBtn.textContent = "Generate Risk Assessment";
        }
      });
      actions.appendChild(generateRisksBtn);
    } else if (riskItems.length === 0 && !policyApproval.allApproved) {
      const hint = document.createElement("p");
      hint.className = "save-hint";
      hint.textContent = `Publish and sign off all ${policyApproval.policyCount} policies first, then return here to generate the risk assessment.`;
      actions.appendChild(hint);
    } else if (riskItems.length > 0) {
      const regenBtn = document.createElement("button");
      regenBtn.type = "button";
      regenBtn.className = "action-button ghost";
      regenBtn.textContent = "Regenerate Risks";
      regenBtn.addEventListener("click", async () => {
        if (!window.confirm("This will replace all existing risks with a fresh generation. Continue?")) return;
        regenBtn.disabled = true;
        regenBtn.textContent = "Regenerating...";
        setStatus("Regenerating risk assessment...");
        try {
          state.selectedClientData = await api(
            `/api/clients/${encodeURIComponent(state.selectedClientId)}/process-risks`,
            { method: "POST" }
          );
          syncDerivedVendors(state.selectedClientData);
          renderWorkspaceHeader(state.selectedClientData.client);
          renderTabs();
          renderActivePhase();
          setStatus("Risk assessment regenerated.", "success");
        } catch (err) {
          setStatus("Regeneration failed: " + err.message, "error");
          regenBtn.disabled = false;
          regenBtn.textContent = "Regenerate Risks";
        }
      });
      actions.appendChild(regenBtn);

      // AI treatment plan regeneration button (only shown when risks exist)
      if (state.aiEnabled) {
        const regenPlansBtn = document.createElement("button");
        regenPlansBtn.type = "button";
        regenPlansBtn.className = "action-button ghost";
        regenPlansBtn.textContent = "Regenerate Treatment Plans";
        regenPlansBtn.title = "Use AI to rewrite all treatment plans with company-specific, non-repetitive actions.";
        regenPlansBtn.addEventListener("click", async () => {
          regenPlansBtn.disabled = true;
          regenPlansBtn.textContent = "Generating...";
          setStatus("Generating AI treatment plans for all risks...");
          try {
            state.selectedClientData = await api(
              `/api/clients/${encodeURIComponent(state.selectedClientId)}/regenerate-treatment-plans`,
              { method: "POST" }
            );
            syncDerivedVendors(state.selectedClientData);
            renderWorkspaceHeader(state.selectedClientData.client);
            renderTabs();
            renderActivePhase();
            setStatus("Treatment plans regenerated with AI-driven, company-specific content.", "success");
          } catch (err) {
            setStatus("Treatment plan regeneration failed: " + err.message, "error");
            regenPlansBtn.disabled = false;
            regenPlansBtn.textContent = "Regenerate Treatment Plans";
          }
        });
        actions.appendChild(regenPlansBtn);
      }
    }
  }
  if (config.key === "control-mapping") {
    const controlItems = state.selectedClientData?.controlMapping?.controls || [];
    const hasPolicies = (state.selectedClientData?.policyGeneration?.policies || []).filter((p) => isFilled(p.body)).length > 0;

    if (controlItems.length === 0 && hasPolicies) {
      if (!state._controlAutoTriggered) {
        state._controlAutoTriggered = true;
        setStatus("Auto-generating control mapping from policies, risks, and vendors...", "success");
        api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process-controls`, { method: "POST" })
          .then(() => loadClient(state.selectedClientId))
          .catch(() => {});
      }
      const genControlsBtn = document.createElement("button");
      genControlsBtn.type = "button";
      genControlsBtn.className = "action-button";
      genControlsBtn.textContent = state._controlAutoTriggered ? "Generating..." : "Generate Control Mapping";
      if (state._controlAutoTriggered) genControlsBtn.disabled = true;
      genControlsBtn.addEventListener("click", async () => {
        genControlsBtn.disabled = true;
        genControlsBtn.textContent = "Generating...";
        setStatus("Generating control mapping...");
        try {
          await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process-controls`, { method: "POST" });
          await loadClient(state.selectedClientId);
          setStatus("Control mapping generated.", "success");
        } catch (err) {
          setStatus("Control mapping failed: " + err.message, "error");
          genControlsBtn.disabled = false;
          genControlsBtn.textContent = "Generate Control Mapping";
        }
      });
      actions.appendChild(genControlsBtn);
    }
    if (controlItems.length > 0) {
      const regenControlsBtn = document.createElement("button");
      regenControlsBtn.type = "button";
      regenControlsBtn.className = "action-button ghost";
      regenControlsBtn.textContent = "Regenerate Control Mapping";
      regenControlsBtn.addEventListener("click", async () => {
        regenControlsBtn.disabled = true;
        regenControlsBtn.textContent = "Regenerating...";
        try {
          await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process-controls`, { method: "POST" });
          await loadClient(state.selectedClientId);
          setStatus("Control mapping regenerated.", "success");
        } catch (err) {
          setStatus("Control mapping failed: " + err.message, "error");
        } finally {
          regenControlsBtn.disabled = false;
          regenControlsBtn.textContent = "Regenerate Control Mapping";
        }
      });
      actions.appendChild(regenControlsBtn);
    }
  }
  if (config.key === "vendor-risk") {
    const vendorItems = nonBlankItems(
      (state.selectedClientData.vendorRisk?.vendors || []).map(decorateVendorRecord),
      getPhaseConfig("vendor-risk").itemFields
    );
    const riskCount = nonBlankItems(
      (state.selectedClientData.riskAssessment?.risks || []).map(decorateRiskRecord),
      getPhaseConfig("risk-assessment").itemFields
    ).length;

    if (vendorItems.length === 0 && riskCount >= 5) {
      // Auto-trigger vendor generation when landing on this tab with risks ready but no vendors
      if (state.aiEnabled && !state._vendorAutoTriggered) {
        state._vendorAutoTriggered = true;
        setStatus("Risks ready — auto-generating vendor assessments...", "success");
        api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process-vendors`, { method: "POST" })
          .catch(() => {});
        pollDownstreamCompletion(state.selectedClientId);
      }

      // Manual fallback button
      const generateVendorsBtn = document.createElement("button");
      generateVendorsBtn.type = "button";
      generateVendorsBtn.className = "action-button";
      generateVendorsBtn.textContent = state._vendorAutoTriggered ? "Generating..." : "Generate Vendor Assessments";
      if (state._vendorAutoTriggered) generateVendorsBtn.disabled = true;
      generateVendorsBtn.addEventListener("click", async () => {
        generateVendorsBtn.disabled = true;
        generateVendorsBtn.textContent = "Generating...";
        setStatus("Generating vendor assessments...");
        try {
          api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process-vendors`, { method: "POST" }).catch(() => {});
          pollDownstreamCompletion(state.selectedClientId);
        } catch (err) {
          setStatus("Vendor generation failed: " + err.message, "error");
          generateVendorsBtn.disabled = false;
          generateVendorsBtn.textContent = "Generate Vendor Assessments";
        }
      });
      actions.appendChild(generateVendorsBtn);
    }

    // Regenerate button when vendors already exist
    if (vendorItems.length > 0) {
      const regenVendorsBtn = document.createElement("button");
      regenVendorsBtn.type = "button";
      regenVendorsBtn.className = "action-button ghost";
      regenVendorsBtn.textContent = "Regenerate Vendor Assessments";
      regenVendorsBtn.addEventListener("click", async () => {
        regenVendorsBtn.disabled = true;
        regenVendorsBtn.textContent = "Regenerating...";
        setStatus("Regenerating vendor assessments...");
        api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process-vendors`, { method: "POST" }).catch(() => {});
        pollDownstreamCompletion(state.selectedClientId);
      });
      actions.appendChild(regenVendorsBtn);
    }
  }
  if (config.key === "policy-generation") {
    const policyApproval = getPolicyApprovalStatus(state.selectedClientData);
    if (policyProgress?.active) {
      const runningButton = document.createElement("button");
      runningButton.type = "button";
      runningButton.className = "action-button ghost";
      runningButton.textContent = policyProgress.queued ? "Generation queued — starting soon…" : "Policy generation in progress";
      runningButton.disabled = true;
      actions.appendChild(runningButton);

      // Show Reset button if stuck for more than 3 minutes
      const startedAt = policyProgress?.startedAt ? new Date(policyProgress.startedAt) : null;
      const stuckMins = startedAt ? (Date.now() - startedAt.getTime()) / 60000 : 0;
      if (stuckMins > 10) {
        const resetButton = document.createElement("button");
        resetButton.type = "button";
        resetButton.className = "danger-button";
        resetButton.textContent = "Reset Stuck Processing";
        resetButton.title = "Processing has been running for over 3 minutes. Click to reset and try again.";
        resetButton.addEventListener("click", async () => {
          resetButton.disabled = true;
          resetButton.textContent = "Resetting...";
          try {
            state.selectedClientData = await api(
              `/api/clients/${encodeURIComponent(state.selectedClientId)}/reset-processing`,
              { method: "POST" }
            );
            syncDerivedVendors(state.selectedClientData);
            renderWorkspaceHeader(state.selectedClientData.client);
            renderTabs();
            renderActivePhase();
            setStatus("Processing reset. You can now start generation again.", "success");
          } catch (err) {
            setStatus("Reset failed: " + err.message, "error");
          }
        });
        actions.appendChild(resetButton);
      }
    } else if (policyApproval.policyCount === 0 && !policyProgress?.queued) {
      const generateButton = document.createElement("button");
      generateButton.type = "button";
      generateButton.className = "action-button";
      generateButton.textContent = "Generate Policies";
      generateButton.addEventListener("click", () => {
        generatePolicies().catch((error) => setStatus(error.message, "error"));
      });
      actions.appendChild(generateButton);
    }
    if (policyApproval.policyCount > 0) {
      const bulkApproveButton = document.createElement("button");
      bulkApproveButton.type = "button";
      bulkApproveButton.className = "action-button";
      bulkApproveButton.textContent = "Publish and Sign Off All";
      bulkApproveButton.addEventListener("click", () => {
        publishAndSignOffAllPolicies(form).catch((error) => setStatus(error.message, "error"));
      });
      actions.appendChild(bulkApproveButton);

      if (!policyProgress?.active) {
        // Unsign All — removes sign-off but keeps published
        if (policyApproval.signedOffCount > 0) {
          const unsignBtn = document.createElement("button");
          unsignBtn.type = "button";
          unsignBtn.className = "action-button ghost";
          unsignBtn.textContent = "Unsign All (keep published)";
          unsignBtn.title = "Remove sign-off from all policies. Published status is preserved.";
          unsignBtn.addEventListener("click", () => {
            unsignBtn.disabled = true;
            unsignBtn.textContent = "Unsigning...";
            bulkPolicyAction("unsign-all", `All ${policyApproval.policyCount} policies unsigned.`)
              .catch(e => setStatus(e.message, "error"))
              .finally(() => { unsignBtn.disabled = false; unsignBtn.textContent = "Unsign All (keep published)"; });
          });
          actions.appendChild(unsignBtn);
        }

        // Unpublish All — clears both published and sign-off
        if (policyApproval.publishedCount > 0) {
          const unpublishBtn = document.createElement("button");
          unpublishBtn.type = "button";
          unpublishBtn.className = "action-button ghost";
          unpublishBtn.textContent = "Unpublish All";
          unpublishBtn.title = "Unpublish all policies and remove sign-off. Downstream phases will be re-gated.";
          unpublishBtn.addEventListener("click", () => {
            unpublishBtn.disabled = true;
            unpublishBtn.textContent = "Unpublishing...";
            bulkPolicyAction("unpublish-all", `All ${policyApproval.policyCount} policies unpublished.`)
              .catch(e => setStatus(e.message, "error"))
              .finally(() => { unpublishBtn.disabled = false; unpublishBtn.textContent = "Unpublish All"; });
          });
          actions.appendChild(unpublishBtn);
        }

        // Regenerate Policies
        const regenButton = document.createElement("button");
        regenButton.type = "button";
        regenButton.className = "action-button ghost";
        regenButton.textContent = "Regenerate Policies";
        regenButton.title = "Discard current policies and regenerate from scratch using the latest onboarding data and AI.";
        regenButton.addEventListener("click", () => {
          regenButton.disabled = true;
          regenButton.textContent = "Regenerating...";
          startPolicyGenerationWorkflow({ forcePolicies: true })
            .catch((error) => setStatus(error.message, "error"))
            .finally(() => { regenButton.disabled = false; regenButton.textContent = "Regenerate Policies"; });
        });
        actions.appendChild(regenButton);
      }
    }
    // "Save policies and continue processing" removed — savePhase auto-triggers /process when all policies are approved
  }
  form.appendChild(actions);

  shell.appendChild(head);
  shell.appendChild(note);
  shell.appendChild(form);
  activeTabPanel.appendChild(shell);
  if (typeof ucInjectStalenessChips === "function") {
    ucInjectStalenessChips();
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Request failed");
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

async function loadVendorCatalog() {
  state.vendorCatalog = await api("/api/vendor-catalog");
}

async function loadClients() {
  const payload = await api("/api/clients");
  state.clients = Array.isArray(payload) ? payload : payload ? [payload] : [];
  renderClientList();
}

async function loadClient(clientId) {
  state.selectedClientId = clientId;
  state.onboardingEditMode = false;
  state.selectedPolicyIndex = -1;
  state.policySearch = "";
  state.policyFilter = "all";
  state.policyDetailTab = "overview";
  state.selectedRiskIndex = -1;
  state.riskSearch = "";
  state.riskFilter = "all";
  state.riskDetailTab = "overview";
  state.selectedVendorIndex = -1;
  state.vendorSearch = "";
  state.vendorFilter = "all";
  state.vendorDetailTab = "overview";
  state.selectedControlIndex = -1;
  state.controlSearch = "";
  state.controlFilter = "all";
  state.controlDetailTab = "overview";
  await loadVendorCatalog();
  state.selectedClientData = await api(`/api/clients/${encodeURIComponent(clientId)}`);
  state.validation = {};
  existingClientNameInput.value = state.selectedClientData.client.companyName || "";
  newClientNameInput.value = "";
  window.history.replaceState({}, "", buildClientUrl(clientId));
  syncDerivedVendors(state.selectedClientData);
  ensureActivePhaseAvailable();
  emptyState.classList.add("hidden");
  workspaceView.classList.remove("hidden");
  renderClientList();
  renderWorkspaceHeader(state.selectedClientData.client);
  renderTabs();
  renderActivePhase();
  setStatus("Client workspace loaded.", "success");
  // If policy generation was in progress when the page was refreshed, resume polling
  if (getPolicyGenerationProgress(state.selectedClientData).inProgress) {
    state.processing = { active: true, kind: "policy-generation", startedAt: new Date().toISOString(), error: "" };
    waitForPolicyGenerationCompletion().catch(() => {});
  }
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function refreshSelectedClientSnapshot({ reloadClients = false } = {}) {
  if (!state.selectedClientId) {
    return;
  }
  state.selectedClientData = await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}`);
  syncDerivedVendors(state.selectedClientData);
  if (reloadClients) {
    await loadClients();
  }
  renderWorkspaceHeader(state.selectedClientData.client);
  renderTabs();
  renderActivePhase();
}

function refreshProgressSection() {
  if (!state.selectedClientData) return;
  const progress = getPolicyGenerationProgress(state.selectedClientData);
  // Patch values in-place — no DOM swap, no blink
  const patched = patchPolicyGenerationStages(progress);
  // Only fall back to full replace if panel doesn't exist yet
  if (!patched) {
    const panel = document.querySelector("[data-pg-panel]");
    if (panel) { panel.replaceWith(renderPolicyGenerationStages(progress)); }
  }
}

async function waitForPolicyGenerationCompletion() {
  const maxAttempts = 600;
  let attempts = 0;
  let fullRenderPending = false;

  while (attempts < maxAttempts) {
    await sleep(1500);

    // Lightweight poll — only fetch generation status, not the full client aggregate
    let statusData;
    try {
      statusData = await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/policy-generation-status`);
    } catch (_) {
      attempts += 1;
      continue;
    }

    // Patch status into state without replacing the full client object
    if (state.selectedClientData?.policyGeneration) {
      state.selectedClientData.policyGeneration.generation_status       = statusData.generation_status;
      state.selectedClientData.policyGeneration.generation_stage        = statusData.generation_stage;
      state.selectedClientData.policyGeneration.generation_stage_note   = statusData.generation_stage_note;
      state.selectedClientData.policyGeneration.generation_started_at   = statusData.generation_started_at;
      state.selectedClientData.policyGeneration.generation_completed_at = statusData.generation_completed_at;
      state.selectedClientData.policyGeneration.generation_last_error   = statusData.generation_last_error;
      state.selectedClientData.policyGeneration.generation_stages       = statusData.generation_stages;
    }

    const progress = getPolicyGenerationProgress(state.selectedClientData);

    // Only update the progress widget — no tab or header re-render
    refreshProgressSection();

    if (progress.failed) {
      state.processing = { active: false, kind: "", startedAt: "", error: progress.lastError || "Policy generation failed." };
      // Do a full refresh so the error state shows correctly
      const fresh = await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}`);
      state.selectedClientData = fresh;
      syncDerivedVendors(state.selectedClientData);
      renderTabs();
      renderActivePhase();
      throw new Error(progress.lastError || "Policy generation failed.");
    }
    if (!progress.inProgress) {
      state.processing = { active: false, kind: "", startedAt: "", error: "" };
      // Full refresh only once at completion
      const fresh = await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}`);
      state.selectedClientData = fresh;
      syncDerivedVendors(state.selectedClientData);
      await loadClients();
      renderWorkspaceHeader(state.selectedClientData.client);
      renderTabs();
      renderActivePhase();
      return progress;
    }
    attempts += 1;
  }

  state.processing = { active: false, kind: "", startedAt: "", error: "Timed out waiting for policy generation." };
  throw new Error("Policy generation is taking longer than expected. Wait a moment and reload the client workspace.");
}

async function startPolicyGenerationWorkflow({ forcePolicies = false } = {}) {
  if (!state.selectedClientId || !state.selectedClientData) {
    throw new Error("Select a client first.");
  }

  state.processing = {
    active: true,
    kind: "policy-generation",
    startedAt: new Date().toISOString(),
    error: ""
  };
  state.activePhaseKey = "policy-generation";
  renderTabs();
  renderActivePhase();
  setStatus("Policy generation is in progress...");

  const params = new URLSearchParams({ background: "yes" });
  if (forcePolicies) {
    params.set("forcePolicies", "yes");
  }

  // Optimistically clear approval state so header chips reflect reality immediately
  if (forcePolicies && state.selectedClientData?.policyGeneration?.policies) {
    state.selectedClientData.policyGeneration.policies = (state.selectedClientData.policyGeneration.policies || []).map(p => ({
      ...p, published: "No", sign_off_complete: "No"
    }));
    renderWorkspaceHeader(state.selectedClientData.client);
    renderTabs();
  }

  state.selectedClientData = await api(
    `/api/clients/${encodeURIComponent(state.selectedClientId)}/process?${params.toString()}`,
    { method: "POST" }
  );
  syncDerivedVendors(state.selectedClientData);
  renderWorkspaceHeader(state.selectedClientData.client);
  renderTabs();
  renderActivePhase();

  await waitForPolicyGenerationCompletion();
  const policyApproval = getPolicyApprovalStatus(state.selectedClientData);
  if (policyApproval.policyCount > 0) {
    setStatus(
      "Policies generated after draft, rewrite, formatting, and QA passes. Publish and sign off every policy before risk and vendor assessment can start.",
      "success"
    );
    return;
  }

  setStatus("Policy generation completed, but no policy records were returned.", "error");
}

async function createClient(event) {
  event.preventDefault();
  const companyName = newClientNameInput.value.trim();
  if (!companyName) {
    setStatus("Enter a client name to create a new workspace.", "error");
    return;
  }

  const existingClient = findClientByName(companyName);
  if (existingClient) {
    setStatus(`"${existingClient.companyName}" already exists. Use Open existing client.`, "error");
    return;
  }

  setStatus("Creating client workspace...");
  const created = await api("/api/clients", {
    method: "POST",
    body: JSON.stringify({ companyName })
  });
  newClientNameInput.value = "";
  await loadClients();
  state.activePhaseKey = "onboarding";
  await loadClient(created.id);
  setStatus("Client workspace created.", "success");
}

async function openExistingClient(event) {
  event.preventDefault();
  const companyName = existingClientNameInput.value.trim();
  if (!companyName) {
    setStatus("Search for an existing client first.", "error");
    return;
  }
  const existingClient = findClientByName(companyName);
  if (!existingClient) {
    setStatus(`No stored client matches "${companyName}".`, "error");
    return;
  }
  openUrlInNewTab(buildClientUrl(existingClient.id));
  setStatus(`Opened ${existingClient.companyName} in a new tab.`, "success");
}

async function savePhase(config, form, options = {}) {
  const payload = options.payloadOverride ? cloneData(options.payloadOverride) : collectPhasePayload(config, form);
  const sectionKey = getSaveSectionKey(config);
  if (config.key === "onboarding" && !options.skipValidation) {
    const validation = getOnboardingValidation(payload);
    state.validation.onboarding = validation;
    if (!validation.valid) {
      renderActivePhase();
      setStatus("Finish onboarding by completing the highlighted fields.", "error");
      return { validationFailed: true };
    }
  }
  if (config.key === "onboarding" && isFilled(payload.legal_entity)) {
    state.selectedClientData.client.companyName = payload.legal_entity;
  }
  if (config.key === "onboarding") {
    state.validation.onboarding = null;
  }

  const _chPrevSnapshot = (typeof chCaptureSnapshot === "function") ? chCaptureSnapshot(config.key) : null;

  // Capture pre-save vendor intel snapshot for selective regen detection
  const _vendorIntelFields = ["stores_processes_data","data_types_handled","access_level_detail","business_impact","has_contract","has_dpa","vendor_certifications_confirmed"];
  const _vendorIntelSnapshot = config.key === "vendor-management"
    ? JSON.stringify((state.selectedClientData.onboarding?.vendors || []).map(v => _vendorIntelFields.reduce((o, f) => { o[f] = v[f] || ""; return o; }, { vendor_name: v.vendor_name || "" })))
    : null;

  setStatus(`Saving ${config.label.toLowerCase()}...`);
  state.selectedClientData = await api(
    `/api/clients/${encodeURIComponent(state.selectedClientId)}/${sectionKey}`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    }
  );
  if (_chPrevSnapshot && typeof chProcessSaveChanges === "function") {
    chProcessSaveChanges(config.key, _chPrevSnapshot);
  }
  if (config.key === "onboarding" || config.key === "vendor-management" || config.key === "vendor-risk") {
    await loadVendorCatalog();
  }
  syncDerivedVendors(state.selectedClientData);

  // Auto-trigger vendor processing when intel fields change and AI is active
  if (config.key === "vendor-management" && _vendorIntelSnapshot && state.aiEnabled) {
    const _newSnap = JSON.stringify((state.selectedClientData.onboarding?.vendors || []).map(v => _vendorIntelFields.reduce((o, f) => { o[f] = v[f] || ""; return o; }, { vendor_name: v.vendor_name || "" })));
    if (_newSnap !== _vendorIntelSnapshot) {
      setStatus("Vendor answers updated — refreshing risk assessments...");
      api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process-vendors`, { method: "POST" })
        .then(() => {
          return api(`/api/clients/${encodeURIComponent(state.selectedClientId)}`);
        })
        .then(refreshed => {
          state.selectedClientData = refreshed;
          syncDerivedVendors(state.selectedClientData);
          renderActivePhase();
          setStatus("Vendor risk assessments updated.");
        })
        .catch(() => {/* silent — vendor regen is best-effort */});
    }
  }
  let autoProcessed = false;
  let autoGeneratedPolicies = false;
  let autoAdvanced = false;

  if (config.key === "policy-generation" && options.autoProcessOnApproval !== false) {
    const policyApproval = getPolicyApprovalStatus(state.selectedClientData);
    if (policyApproval.allApproved) {
      setStatus("All policies approved. Starting risk and vendor processing...");
      await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process`, { method: "POST" });
      state.selectedClientData = await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}`);
      syncDerivedVendors(state.selectedClientData);
      state.activePhaseKey = "risk-assessment";
      autoProcessed = true;
    }
  }

  if (config.key === "onboarding") {
    const snapshot = getOnboardingSnapshot(state.selectedClientData.onboarding || {});
    if (state.onboardingEditMode) {
      state.onboardingEditMode = false;
      // Check if any policy-affecting fields changed — if so, trigger policy regen
      if (_chPrevSnapshot && state.aiEnabled && snapshot.ready) {
        const policyFields = (typeof CH_WATCHED_FIELDS !== "undefined" ? CH_WATCHED_FIELDS : [])
          .filter(f => (f.affects || []).includes("policies"))
          .map(f => f.field);
        const prevOb = _chPrevSnapshot.onboarding || {};
        const newOb = state.selectedClientData.onboarding || {};
        const policyFieldChanged = policyFields.some(f => JSON.stringify(prevOb[f]) !== JSON.stringify(newOb[f]));
        if (policyFieldChanged) {
          setStatus("Policy-relevant fields changed — regenerating policies...");
          try {
            await startPolicyGenerationWorkflow({ forcePolicies: true });
            autoGeneratedPolicies = getPolicyApprovalStatus(state.selectedClientData).policyCount > 0;
          } catch (e) {
            setStatus("Policy regeneration failed: " + (e.message || e), "error");
          }
        }
      }
    } else if (snapshot.ready && !options.suppressAdvance) {
      state.activePhaseKey = "policy-generation";
      await startPolicyGenerationWorkflow();
      autoGeneratedPolicies = getPolicyApprovalStatus(state.selectedClientData).policyCount > 0;
      autoAdvanced = true;
    }
  }

  if (config.key === "vendor-management") {
    const snapshot = getOnboardingSnapshot(state.selectedClientData.onboarding || {});
    if (snapshot.ready && !options.suppressAdvance) {
      state.activePhaseKey = "policy-generation";
      await startPolicyGenerationWorkflow({ forcePolicies: true });
      autoGeneratedPolicies = getPolicyApprovalStatus(state.selectedClientData).policyCount > 0;
      autoAdvanced = true;
    }
  }

  await loadClients();
  renderWorkspaceHeader(state.selectedClientData.client);
  renderTabs();
  renderActivePhase();
  if (
    (config.key === "onboarding" || config.key === "vendor-management") &&
    isFilled(state.selectedClientData.onboarding?.change_notice) &&
    !autoGeneratedPolicies
  ) {
    setStatus(state.selectedClientData.onboarding.change_notice, "warning");
    return { autoProcessed };
  }

  const statusMessage = autoProcessed
    ? "All policies approved. Risk and vendor processing complete."
    : autoGeneratedPolicies
      ? config.key === "vendor-management"
        ? "Vendor changes saved. Policies regenerated successfully."
        : "Onboarding finished. Policies generated successfully."
      : (config.key === "onboarding" || config.key === "vendor-management") && autoAdvanced
        ? config.key === "vendor-management"
          ? "Vendor changes were saved, but no regenerated policy records were returned."
          : "Onboarding finished, but no policy records were returned."
        : options.draftOnly
          ? "Onboarding draft saved."
          : autoAdvanced
            ? config.key === "vendor-management"
              ? "Vendor changes saved. Policy generation is now unlocked."
              : "Onboarding saved. Policy generation is now unlocked."
            : `${config.label} saved.`;
  const statusTone =
    (config.key === "onboarding" || config.key === "vendor-management") && autoAdvanced && !autoGeneratedPolicies && !autoProcessed
      ? "error"
      : "success";
  setStatus(statusMessage, statusTone);
  return { autoProcessed, autoGeneratedPolicies, autoAdvanced };
}

async function startProcessing(form, sourceConfig = getPhaseConfig("onboarding")) {
  await savePhase(sourceConfig, form);
  const snapshot = getOnboardingSnapshot(state.selectedClientData.onboarding || {});
  if (!snapshot.ready) {
    setStatus("Finish onboarding before starting processing.", "error");
    return;
  }
  state.activePhaseKey = "policy-generation";
  setStatus("Starting policy generation...");
  await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process`, { method: "POST" });
  await loadClient(state.selectedClientId);
  const policyApproval = getPolicyApprovalStatus(state.selectedClientData);
  if (policyApproval.allApproved) {
    setStatus("Processing complete.", "success");
    return;
  }
  setStatus("Policies generated. Publish and sign off every policy before risk and vendor assessment can start.", "success");
}

async function generatePolicies() {
  if (!state.selectedClientId || !state.selectedClientData) {
    setStatus("Select a client first.", "error");
    return;
  }
  const snapshot = getOnboardingSnapshot(state.selectedClientData.onboarding || {});
  if (!snapshot.ready) {
    setStatus("Finish onboarding before generating policies.", "error");
    return;
  }

  await startPolicyGenerationWorkflow({ forcePolicies: true });
}

async function bulkPolicyAction(action, successMsg) {
  if (!state.selectedClientId || !state.selectedClientData) return;
  setStatus(`${action === "unpublish-all" ? "Unpublishing" : "Unsigning"} all policies...`);
  state.selectedClientData = await api(
    `/api/clients/${encodeURIComponent(state.selectedClientId)}/policies/${action}`,
    { method: "POST" }
  );
  syncDerivedVendors(state.selectedClientData);
  await loadClients();
  renderWorkspaceHeader(state.selectedClientData.client);
  renderTabs();
  renderActivePhase();
  setStatus(successMsg, "success");
}

async function publishAndSignOffAllPolicies(form) {
  if (!state.selectedClientId || !state.selectedClientData) {
    setStatus("Select a client first.", "error");
    return;
  }

  const policyApproval = getPolicyApprovalStatus(state.selectedClientData);

  if (policyApproval.policyCount === 0) {
    setStatus("Generate policies first.", "error");
    return;
  }

  setStatus(`Publishing and signing off all ${policyApproval.policyCount} policies...`);
  state.selectedClientData = await api(
    `/api/clients/${encodeURIComponent(state.selectedClientId)}/policies/publish-all`,
    { method: "POST" }
  );
  syncDerivedVendors(state.selectedClientData);

  // Navigate to risk assessment immediately
  state.activePhaseKey = "risk-assessment";
  await loadClients();
  renderWorkspaceHeader(state.selectedClientData.client);
  renderTabs();
  renderActivePhase();
  setStatus(`All ${policyApproval.policyCount} policies published. Generating risk and vendor assessments...`, "success");

  // Trigger risk generation (server auto-chains into vendor generation after risks complete)
  api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process-risks`, { method: "POST" }).catch(() => {});

  // Poll for downstream completion and update UI as each stage finishes
  pollDownstreamCompletion(state.selectedClientId);
}

async function pollDownstreamCompletion(clientId) {
  let lastRiskCount = 0;
  let lastVendorCount = 0;
  const maxAttempts = 120; // 10 minutes max
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5000);
    if (state.selectedClientId !== clientId) return; // user switched client
    let status;
    try {
      status = await api(`/api/clients/${encodeURIComponent(clientId)}/downstream-status`);
    } catch (_) { continue; }

    // Risks just appeared
    if (status.risk_count > 0 && lastRiskCount === 0) {
      lastRiskCount = status.risk_count;
      const fresh = await api(`/api/clients/${encodeURIComponent(clientId)}`);
      state.selectedClientData = fresh;
      syncDerivedVendors(state.selectedClientData);
      renderWorkspaceHeader(state.selectedClientData.client);
      renderTabs();
      if (state.activePhaseKey === "risk-assessment") renderActivePhase();
      setStatus(`Risk assessment complete — ${status.risk_count} risks generated. Generating vendor assessments...`, "success");
    }

    // Vendors just appeared
    if (status.vendor_count > 0 && lastVendorCount === 0) {
      lastVendorCount = status.vendor_count;
      const fresh = await api(`/api/clients/${encodeURIComponent(clientId)}`);
      state.selectedClientData = fresh;
      syncDerivedVendors(state.selectedClientData);
      renderWorkspaceHeader(state.selectedClientData.client);
      renderTabs();
      renderActivePhase();
      setStatus(`Vendor assessments complete — ${status.vendor_count} vendors assessed. All downstream generation finished.`, "success");
      return;
    }

    if (status.risk_count > 0 && status.vendor_count > 0) return; // already done
  }
}

async function continueProcessingFromPolicies(form) {
  const policyConfig = phaseConfigs.find((entry) => entry.key === "policy-generation");
  const saveResult = await savePhase(policyConfig, form);
  const policyApproval = getPolicyApprovalStatus(state.selectedClientData);
  if (!policyApproval.allApproved) {
    setStatus(
      `Publish and sign off all ${policyApproval.policyCount} policies before risk and vendor assessment can start.`,
      "error"
    );
    return;
  }
  if (saveResult.autoProcessed) {
    setStatus("Risk and vendor processing complete.", "success");
    return;
  }

  state.activePhaseKey = "risk-assessment";
  setStatus("Starting risk and vendor processing...");
  await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}/process`, { method: "POST" });
  await loadClient(state.selectedClientId);
  setStatus("Risk and vendor processing complete.", "success");
}

async function deleteClientWorkspace() {
  if (!state.selectedClientId) {
    return;
  }
  const companyName = state.selectedClientData.client.companyName;
  const typed = window.prompt(`This will permanently delete all data for "${companyName}".\n\nType the client name exactly to confirm:`);
  if (typed === null) return;
  if (typed !== companyName) {
    setStatus(`Deletion cancelled — name did not match. Expected: "${companyName}"`, "error");
    return;
  }

  setStatus("Deleting client workspace...");
  await api(`/api/clients/${encodeURIComponent(state.selectedClientId)}`, { method: "DELETE" });
  state.selectedClientId = null;
  state.selectedClientData = null;
  state.validation = {};
  existingClientNameInput.value = "";
  newClientNameInput.value = "";
  window.history.replaceState({}, "", window.location.pathname);
  activeTabPanel.innerHTML = "";
  tabNav.innerHTML = "";
  workflowStatusGrid.innerHTML = "";
  workspaceActions.innerHTML = "";
  workspaceStats.innerHTML = "";
  workspaceView.classList.add("hidden");
  emptyState.classList.remove("hidden");
  await loadClients();
  setStatus("Client workspace deleted.", "success");
}

createClientForm.addEventListener("submit", (event) => {
  createClient(event).catch((error) => setStatus(error.message, "error"));
});

existingClientForm.addEventListener("submit", (event) => {
  openExistingClient(event).catch((error) => setStatus(error.message, "error"));
});

existingClientNameInput.addEventListener("input", () => {
  refreshExistingClientUi();
});

existingClientNameInput.addEventListener("change", () => {
  refreshExistingClientUi();
});

newClientNameInput.addEventListener("input", () => {
  refreshCreateClientUi();
});

// ── AI Settings ──────────────────────────────────────────────

async function checkAiStatus() {
  try {
    const data = await api("/api/settings");
    state.aiEnabled = !!data.ai_enabled;
    state.aiHasKey  = !!data.has_api_key;
    state.aiKeyValid = !!data.key_valid;
    renderAiStatusBadge();
  } catch (_) {}
}

function renderAiStatusBadge() {
  const existing = document.getElementById("ai-status-badge");
  if (existing) existing.remove();

  const topbarStatus = document.querySelector(".topbar-status");
  if (!topbarStatus) return;

  const badge = document.createElement("div");
  badge.id = "ai-status-badge";
  badge.className = `status-chip ai-status-chip ${state.aiEnabled ? "ai-active" : "ai-inactive"}`;
  const badgeLabel = state.aiEnabled ? "AI Active" : (state.aiHasKey && !state.aiKeyValid ? "Key Invalid" : "AI Inactive");
  const badgeTitle = state.aiEnabled ? "AI agents active — click to manage" : (state.aiHasKey && !state.aiKeyValid ? "API key is invalid or expired — click to update" : "AI agents inactive — click to add API key");
  badge.title = badgeTitle;
  badge.innerHTML = `<span class="dot ${state.aiEnabled ? "dot-live" : "dot-warn"}"></span>${badgeLabel}`;
  badge.style.cursor = "pointer";
  badge.addEventListener("click", openAiSettingsModal);
  topbarStatus.appendChild(badge);
}

function openAiSettingsModal() {
  const existing = document.getElementById("ai-settings-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "ai-settings-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <div>
          <p class="section-label">Configuration</p>
          <h3>AI Engine Settings</h3>
        </div>
        <button class="modal-close" id="ai-modal-close" type="button" aria-label="Close">&#x2715;</button>
      </div>
      <div class="modal-body">
        <div class="ai-status-banner ${state.aiEnabled ? "ai-banner-active" : "ai-banner-inactive"}">
          <span class="dot ${state.aiEnabled ? "dot-live" : "dot-warn"}"></span>
          <strong>${state.aiEnabled ? "AI agents are active" : (state.aiHasKey && !state.aiKeyValid ? "API key is invalid or expired" : "AI agents are inactive")}</strong>
          <p>${state.aiEnabled
            ? "Multi-agent pipeline is running. Policies, risks, and vendors are AI-generated."
            : (state.aiHasKey && !state.aiKeyValid
                ? "The key in your .env file returned 401 from Anthropic. Paste a fresh key below to restore AI generation."
                : "No API key configured. The app is using template-based generation. Paste your key below to activate AI.")
          }</p>
        </div>
        <div class="modal-field-group">
          <label for="ai-key-input">Anthropic API Key</label>
          <p class="field-help">Get your key from <strong>console.anthropic.com</strong> → API Keys → Create Key</p>
          <div class="modal-input-row">
            <input id="ai-key-input" type="password" placeholder="sk-ant-..." autocomplete="off" spellcheck="false" />
            <button id="ai-key-save" type="button" class="action-button">Save & Activate</button>
          </div>
          <p id="ai-key-feedback" class="field-help hidden"></p>
        </div>
        <div class="modal-info">
          <p class="section-label">What happens when active</p>
          <ul>
            <li>Orchestrator reads onboarding and builds a shared company brief</li>
            <li>Policy Writer generates company-specific policy content</li>
            <li>Policy Critic scores every policy — Rewriter fixes failures</li>
            <li>Risk Analyst links risks to real policy IDs</li>
            <li>Vendor Analyst references real risk IDs in assessments</li>
            <li>QA Cross-Check verifies consistency across all outputs</li>
          </ul>
          <p style="margin-top:10px; font-size:12px; color:var(--text-muted)">The key is saved to a local <code>.env</code> file and loaded automatically each time the server starts.</p>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById("ai-modal-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  const saveBtn = document.getElementById("ai-key-save");
  const keyInput = document.getElementById("ai-key-input");
  const feedback = document.getElementById("ai-key-feedback");

  saveBtn.addEventListener("click", async () => {
    const key = keyInput.value.trim();
    if (!key.startsWith("sk-ant-")) {
      feedback.textContent = "Key must start with sk-ant-";
      feedback.className = "field-help error-text";
      return;
    }
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    try {
      saveBtn.textContent = "Validating...";
      const result = await api("/api/settings/api-key", { method: "POST", body: JSON.stringify({ api_key: key }) });
      state.aiEnabled  = !!result.key_valid;
      state.aiHasKey   = true;
      state.aiKeyValid = !!result.key_valid;
      renderAiStatusBadge();
      if (result.key_valid) {
        feedback.textContent = "Key validated. AI agents are now active — no restart required.";
        feedback.className = "field-help success-text";
        setTimeout(() => overlay.remove(), 1800);
      } else {
        feedback.textContent = "Key saved but Anthropic returned 401 — the key appears invalid. Double-check it at console.anthropic.com.";
        feedback.className = "field-help error-text";
        saveBtn.disabled = false;
        saveBtn.textContent = "Save & Activate";
      }
    } catch (err) {
      feedback.textContent = "Failed to save: " + err.message;
      feedback.className = "field-help error-text";
      saveBtn.disabled = false;
      saveBtn.textContent = "Save & Activate";
    }
  });
}

// ── App Init ─────────────────────────────────────────────────

async function initializeApp() {
  await Promise.all([loadVendorCatalog(), loadClients(), checkAiStatus()]);
  const clientFromQuery = new URLSearchParams(window.location.search).get("client");
  if (clientFromQuery) {
    const matchingClient = state.clients.find((client) => client.id === clientFromQuery);
    if (matchingClient) {
      await loadClient(clientFromQuery);
      return;
    }
    window.history.replaceState({}, "", window.location.pathname);
    setStatus("The requested client was not found. Open another client from the launcher.", "error");
  }
  refreshExistingClientUi();
  refreshCreateClientUi();
}

initializeApp().catch((error) => setStatus(error.message, "error"));
