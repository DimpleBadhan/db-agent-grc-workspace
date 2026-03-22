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
      {
        name: "vendor_description",
        label: "What does this vendor do?",
        type: "textarea",
        full: true,
        rows: 3,
        placeholder: "Describe the vendor service in plain language."
      },
      {
        name: "purpose",
        label: "How does this client use the vendor?",
        type: "textarea",
        full: true,
        rows: 3,
        placeholder: "Describe the client-specific purpose or use case."
      }
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
      {
        name: "purpose",
        label: "How does this client use the vendor?",
        type: "textarea",
        full: true,
        rows: 3,
        placeholder: "Describe the client-specific purpose or use case."
      }
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
      { name: "executive_summary", label: "Executive summary", type: "textarea", full: true },
      { name: "table_of_contents", label: "Table of contents", type: "textarea", full: true },
      { name: "body", label: "Policy body", type: "textarea", full: true, rows: 18 },
      { name: "approval_history_text", label: "Approval history", type: "textarea", full: true, rows: 6, readonly: true }
    ]
  },
  {
    key: "policy-qa",
    label: "Policy QA",
    phase: "Phase 1.5",
    title: "Policy QA",
    description: "QA agent step: check generated policies for hallucinations, completeness, enforceable language, placeholders, and framework alignment.",
    property: "policyQa",
    metaFields: [
      { name: "qa_owner", label: "QA owner", type: "text" },
      { name: "cleaned_policies_ref", label: "Cleaned policies reference", type: "text" },
      { name: "qa_notes", label: "QA notes", type: "textarea", full: true }
    ],
    itemCollection: "findings",
    itemLabel: "Validation finding",
    itemFields: [
      { name: "finding_id", label: "Finding ID", type: "text" },
      { name: "policy_id", label: "Policy ID", type: "text" },
      { name: "severity", label: "Severity", type: "select", options: ["", "Low", "Medium", "High", "Critical"] },
      { name: "category", label: "Category", type: "text" },
      { name: "details", label: "Details", type: "textarea", full: true },
      { name: "resolution_status", label: "Resolution status", type: "text" }
    ]
  },
  {
    key: "policy-summary",
    label: "Policy Summary",
    phase: "Phase 1.6",
    title: "Policy summary",
    description: "Summarize the generated policy set before moving into detailed risk assessment.",
    property: "policySummary",
    metaFields: [
      { name: "summary_owner", label: "Summary owner", type: "text" },
      { name: "summary_notes", label: "Summary notes", type: "textarea", full: true }
    ],
    itemCollection: "summaries",
    itemLabel: "Policy summary",
    itemFields: [
      { name: "summary_id", label: "Summary ID", type: "text" },
      { name: "policy_id", label: "Policy ID", type: "text" },
      { name: "key_controls", label: "Key controls", type: "textarea", full: true },
      { name: "covered_domains", label: "Covered domains", type: "textarea", full: true },
      { name: "gaps", label: "Gaps", type: "textarea", full: true }
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
      { name: "asset", label: "Asset", type: "text" },
      { name: "threat", label: "Threat", type: "text" },
      { name: "vulnerability", label: "Vulnerability", type: "text" },
      { name: "impact_description", label: "Impact description", type: "textarea", full: true },
      { name: "likelihood", label: "Likelihood", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "impact", label: "Impact", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "inherent_score", label: "Inherent score", type: "text", readonly: true },
      { name: "inherent_rating", label: "Inherent rating", type: "text", readonly: true },
      { name: "residual_likelihood", label: "Residual likelihood", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "residual_impact", label: "Residual impact", type: "select", options: ["", "1", "2", "3", "4", "5"] },
      { name: "residual_score", label: "Residual score", type: "text", readonly: true },
      { name: "residual_rating", label: "Residual rating", type: "text", readonly: true },
      { name: "treatment_plan", label: "Treatment plan", type: "textarea", full: true },
      { name: "linked_policies", label: "Linked policies", type: "text" },
      { name: "linked_controls", label: "Linked controls", type: "text" }
    ]
  },
  {
    key: "risk-qa",
    label: "Risk QA",
    phase: "Phase 2.5",
    title: "Risk QA",
    description: "QA agent step: check risk scoring, completeness, treatment logic, and hallucination risk before the risk register is accepted.",
    property: "riskQa",
    metaFields: [
      { name: "qa_owner", label: "QA owner", type: "text" },
      { name: "risk_register_ref", label: "Risk register reference", type: "text" },
      { name: "qa_notes", label: "QA notes", type: "textarea", full: true }
    ],
    itemCollection: "findings",
    itemLabel: "Risk QA finding",
    itemFields: [
      { name: "finding_id", label: "Finding ID", type: "text" },
      { name: "risk_id", label: "Risk ID", type: "text" },
      { name: "severity", label: "Severity", type: "select", options: ["", "Low", "Medium", "High", "Critical"] },
      { name: "category", label: "Category", type: "text" },
      { name: "details", label: "Details", type: "textarea", full: true },
      { name: "resolution_status", label: "Resolution status", type: "text" }
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
      { name: "linked_controls", label: "Linked controls", type: "text" }
    ]
  },
  {
    key: "vendor-qa",
    label: "Vendor QA",
    phase: "Phase 3.5",
    title: "Vendor QA",
    description: "QA agent step: check vendor criticality, evidence completeness, data exposure, and hallucination risk before vendor assessments are accepted.",
    property: "vendorQa",
    metaFields: [
      { name: "qa_owner", label: "QA owner", type: "text" },
      { name: "vendor_register_ref", label: "Vendor register reference", type: "text" },
      { name: "qa_notes", label: "QA notes", type: "textarea", full: true }
    ],
    itemCollection: "findings",
    itemLabel: "Vendor QA finding",
    itemFields: [
      { name: "finding_id", label: "Finding ID", type: "text" },
      { name: "vendor_id", label: "Vendor ID", type: "text" },
      { name: "severity", label: "Severity", type: "select", options: ["", "Low", "Medium", "High", "Critical"] },
      { name: "category", label: "Category", type: "text" },
      { name: "details", label: "Details", type: "textarea", full: true },
      { name: "resolution_status", label: "Resolution status", type: "text" }
    ]
  }
];

phaseConfigs.push(
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
    key: "audit-qa",
    label: "Audit QA",
    phase: "Phase 5",
    title: "Audit QA",
    description: "Validate the full linked chain before output.",
    property: "auditQa",
    metaFields: [
      { name: "audit_owner", label: "Audit owner", type: "text" },
      { name: "audit_notes", label: "Audit notes", type: "textarea", full: true }
    ],
    itemCollection: "findings",
    itemLabel: "Audit finding",
    itemFields: [
      { name: "finding_id", label: "Finding ID", type: "text" },
      { name: "affected_item_type", label: "Affected item type", type: "text" },
      { name: "affected_item_id", label: "Affected item ID", type: "text" },
      { name: "severity", label: "Severity", type: "select", options: ["", "Low", "Medium", "High", "Critical"] },
      { name: "reason", label: "Reason", type: "textarea", full: true },
      { name: "audit_impact", label: "Audit impact", type: "textarea", full: true },
      { name: "remediation", label: "Remediation", type: "textarea", full: true }
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
  }
);

const state = {
  clients: [],
  vendorCatalog: [],
  selectedClientId: null,
  selectedClientData: null,
  activePhaseKey: "onboarding",
  validation: {},
  processing: {
    active: false,
    kind: "",
    startedAt: "",
    error: ""
  }
};

const hiddenUiPhaseKeys = new Set(["policy-qa", "policy-summary", "risk-qa", "vendor-qa", "audit-qa"]);
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
  saveStatus.textContent = message;
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
    const current = cells.get(key) || 0;
    cells.set(key, current + 1);
  });
  return cells;
}

function renderHeatmapCard(title, records, likelihoodAccessor, impactAccessor) {
  const card = document.createElement("section");
  card.className = "info-card status-panel tone-default";

  const head = document.createElement("div");
  head.className = "panel-head compact";
  const titleNode = document.createElement("h4");
  titleNode.textContent = title;
  head.appendChild(titleNode);
  card.appendChild(head);

  const note = document.createElement("p");
  note.className = "record-note";
  note.textContent = "Impact is shown vertically and likelihood horizontally. Cell values show record counts.";
  card.appendChild(note);

  const cells = buildMatrixCells(records, likelihoodAccessor, impactAccessor);
  const matrix = document.createElement("div");
  matrix.className = "matrix-card";

  const xLabel = document.createElement("div");
  xLabel.className = "matrix-axis-label matrix-axis-x";
  xLabel.textContent = "Likelihood";
  matrix.appendChild(xLabel);

  const yLabel = document.createElement("div");
  yLabel.className = "matrix-axis-label matrix-axis-y";
  yLabel.textContent = "Impact";
  matrix.appendChild(yLabel);

  const grid = document.createElement("div");
  grid.className = "matrix-grid";

  for (let impact = 5; impact >= 1; impact -= 1) {
    for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
      const score = impact * likelihood;
      const band = getScoreBand(score);
      const cell = document.createElement("div");
      cell.className = `matrix-cell matrix-${band.label.toLowerCase()}`;
      const count = cells.get(`${impact}-${likelihood}`) || 0;
      cell.innerHTML = `<strong>${count}</strong><span>${likelihood}×${impact}</span>`;
      grid.appendChild(cell);
    }
  }

  matrix.appendChild(grid);
  card.appendChild(matrix);
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

function renderArtifactLinks(paths) {
  const wrapper = document.createElement("div");
  wrapper.className = "artifact-links";
  paths.forEach((path) => {
    const link = document.createElement("a");
    link.className = "artifact-link";
    link.href = "#";
    link.textContent = path.split(/[/\\]/).pop() || path;
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

  buttons
    .filter((button) => button.path)
    .forEach((button) => {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = `action-button${button.ghost ? " ghost" : ""}`;
      trigger.textContent = button.label;
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

  if (field.type === "vendor-autocomplete") {
    const datalistId = `${id}-catalog`;
    const datalist = document.createElement("datalist");
    datalist.id = datalistId;
    getVendorCatalogEntries().forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.vendor_name || "";
      datalist.appendChild(option);
    });
    control.setAttribute("list", datalistId);
    control.addEventListener("change", () => {
      const card = control.closest(".repeatable-card");
      if (card) {
        applyVendorCatalogSelection(card, control.value);
      }
    });
    wrapper.appendChild(datalist);
  }

  return wrapper;
}

function renderFieldGrid(fields, values, prefix, fieldErrors = {}) {
  const grid = document.createElement("div");
  grid.className = "field-grid";
  fields.forEach((field) => grid.appendChild(createField(field, values[field.name], prefix, fieldErrors[field.name] || "")));
  return grid;
}

function collectValues(container, fields) {
  const data = {};
  fields.forEach((field) => {
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
  const catalogMatch = getVendorCatalogMatch(vendor.vendor_name);
  return {
    vendor_name: catalogMatch?.vendor_name || vendor.vendor_name || "",
    vendor_description: vendor.vendor_description || catalogMatch?.vendor_description || "",
    purpose: vendor.purpose || "",
    service_category: vendor.service_category || catalogMatch?.service_category || "",
    known_services: vendor.known_services || catalogMatch?.known_services || "",
    website: vendor.website || catalogMatch?.website || ""
  };
}

function applyVendorCatalogSelection(container, vendorName) {
  const match = getVendorCatalogMatch(vendorName);
  if (!container || !match) {
    return;
  }

  const fieldMap = {
    vendor_name: match.vendor_name || "",
    vendor_description: match.vendor_description || "",
    service_category: match.service_category || "",
    known_services: match.known_services || "",
    website: match.website || ""
  };

  Object.entries(fieldMap).forEach(([fieldName, value]) => {
    const control = container.querySelector(`[data-field="${fieldName}"]`);
    if (!control || !String(value || "").trim()) {
      return;
    }
    control.value = value;
  });
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

  return {
    inProgress: normalizedStatus === "in progress",
    completed: normalizedStatus === "completed",
    failed: normalizedStatus === "failed",
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
  const vendorDirectoryConfig = getPhaseConfig("vendor-management");
  const policyQaConfig = getPhaseConfig("policy-qa");
  const policySummaryConfig = getPhaseConfig("policy-summary");
  const riskAssessmentConfig = getPhaseConfig("risk-assessment");
  const riskQaConfig = getPhaseConfig("risk-qa");
  const vendorRiskConfig = getPhaseConfig("vendor-risk");
  const vendorQaConfig = getPhaseConfig("vendor-qa");
  const controlMappingConfig = getPhaseConfig("control-mapping");
  const auditQaConfig = getPhaseConfig("audit-qa");
  const outputConfig = getPhaseConfig("output");
  const vendorDirectoryRecords = nonBlankItems(clientData.onboarding?.vendors || [], vendorDirectoryConfig.itemFields);
  const vendorDirectoryCount = vendorDirectoryRecords.length;
  const qaCount = nonBlankItems(clientData.policyQa?.findings || [], policyQaConfig.itemFields).length;
  const summaryCount = nonBlankItems(clientData.policySummary?.summaries || [], policySummaryConfig.itemFields).length;
  const riskCount = nonBlankItems(clientData.riskAssessment?.risks || [], riskAssessmentConfig.itemFields).length;
  const riskQaCount = nonBlankItems(clientData.riskQa?.findings || [], riskQaConfig.itemFields).length;
  const vendorRecords = nonBlankItems(clientData.vendorRisk?.vendors || [], vendorRiskConfig.itemFields);
  const vendorCount = countCompletedVendorAssessments(vendorRecords);
  const vendorQaCount = nonBlankItems(clientData.vendorQa?.findings || [], vendorQaConfig.itemFields).length;
  const controlCount = nonBlankItems(clientData.controlMapping?.controls || [], controlMappingConfig.itemFields).length;
  const auditCount = nonBlankItems(clientData.auditQa?.findings || [], auditQaConfig.itemFields).length;
  const outputCount = nonBlankItems(clientData.output?.outputs || [], outputConfig.itemFields).length;
  const vendorTargetCount = onboardingSnapshot.vendorCount;
  const vendorPhaseComplete = vendorTargetCount > 0 ? vendorCount >= vendorTargetCount : true;
  const policyQaRan = isFilled(clientData.policyQa?.qa_owner) || isFilled(clientData.policyQa?.cleaned_policies_ref) || qaCount > 0;
  const riskQaRan = isFilled(clientData.riskQa?.qa_owner) || isFilled(clientData.riskQa?.risk_register_ref) || riskQaCount > 0;
  const vendorQaRan = isFilled(clientData.vendorQa?.qa_owner) || isFilled(clientData.vendorQa?.vendor_register_ref) || vendorQaCount > 0;
  const auditQaRan = isFilled(clientData.auditQa?.audit_owner) || auditCount > 0;
  const policiesReadyForDownstream = policyApproval.allApproved;
  const riskQaComplete = policiesReadyForDownstream && riskCount > 0 && riskQaRan;
  const vendorQaComplete = vendorTargetCount === 0 ? true : vendorPhaseComplete && vendorQaRan;

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
      key: "policy-qa",
      unlocked: policyCount > 0,
      complete: policyQaRan,
      status: policyCount === 0 ? "blocked" : policyQaRan ? "complete" : "ready",
      detail: `${qaCount} policy QA findings`,
      blockers: policyCount > 0 ? [] : ["Generate policies first."]
    },
    {
      key: "policy-summary",
      unlocked: policyQaRan,
      complete: summaryCount > 0,
      status: !policyQaRan ? "blocked" : summaryCount > 0 ? "complete" : "ready",
      detail: `${summaryCount} policy summaries`,
      blockers: policyQaRan ? [] : ["Complete policy QA first."]
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
      key: "risk-qa",
      unlocked: policiesReadyForDownstream && riskCount >= 5,
      complete: riskQaComplete,
      status:
        !policiesReadyForDownstream || riskCount < 5
          ? "blocked"
          : riskQaComplete
            ? "complete"
            : "ready",
      detail:
        !policiesReadyForDownstream
          ? "Waiting for all policies to be published and signed off"
          : `${riskQaCount} risk QA findings`,
      blockers:
        !policiesReadyForDownstream
          ? ["Publish and sign off every policy first."]
          : riskCount >= 5
            ? []
            : ["Complete risk assessment first."]
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
      key: "vendor-qa",
      unlocked: riskQaComplete && vendorPhaseComplete,
      complete: vendorQaComplete,
      status: !(riskQaComplete && vendorPhaseComplete) ? "blocked" : vendorQaComplete ? "complete" : "ready",
      detail: vendorTargetCount > 0 ? `${vendorQaCount} vendor QA findings` : "No vendor QA required",
      blockers:
        !riskQaComplete
          ? ["Complete risk QA first."]
          : vendorPhaseComplete
            ? []
            : ["Complete vendor assessments first."]
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
      key: "audit-qa",
      unlocked: controlCount > 0,
      complete: auditQaRan,
      status: controlCount === 0 ? "blocked" : auditQaRan ? "complete" : "ready",
      detail: `${auditCount} audit QA findings`,
      blockers: controlCount > 0 ? [] : ["Complete control mapping first."]
    },
    {
      key: "output",
      unlocked: controlCount > 0,
      complete: outputCount > 0,
      status: controlCount === 0 ? "blocked" : outputCount > 0 ? "complete" : "ready",
      detail: `${outputCount} output records`,
      blockers: controlCount > 0 ? [] : ["Complete control mapping first."]
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

  workflow.states.forEach((entry) => {
    const config = phaseConfigs.find((phase) => phase.key === entry.key);
    const card = document.createElement("div");
    card.className = `workflow-step workflow-step-${entry.status}`;
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
}

function renderTabs() {
  const workflowStates = getVisibleWorkflow(getWorkflowState(state.selectedClientData)).states;
  tabNav.innerHTML = "";

  phaseConfigs.filter((config) => isUiVisiblePhase(config.key)).forEach((config) => {
    const phaseState = workflowStates.find((entry) => entry.key === config.key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tab-button tab-${phaseState.status}${config.key === state.activePhaseKey ? " active" : ""}`;
    button.textContent = `${config.phase} | ${config.label}`;
    button.disabled = !phaseState.unlocked;
    if (phaseState.blockers.length) {
      button.title = phaseState.blockers.join(" | ");
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

  if (!isFilled(sectionData.framework_selection)) {
    wrapper.appendChild(renderListSection("Start here", ["Choose the framework first."], "Framework required.", "warning"));
    return wrapper;
  }

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
    <div class="metric-row"><span>Selected framework</span><strong>${sectionData.framework_selection}</strong></div>
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

function renderPolicyGenerationStages(progress) {
  const section = document.createElement("section");
  section.className = "info-card status-panel tone-default";

  const head = document.createElement("div");
  head.className = "panel-head compact";
  const title = document.createElement("h4");
  title.textContent = "Generation workflow";
  head.appendChild(title);
  head.appendChild(
    renderBadge(
      progress.inProgress ? "Running" : progress.completed ? "Complete" : progress.failed ? "Failed" : "Queued",
      progress.failed ? "danger" : progress.completed ? "success" : progress.inProgress ? "warning" : "default"
    )
  );
  section.appendChild(head);

  if (progress.stageNote) {
    const note = document.createElement("p");
    note.className = "record-note";
    note.textContent = progress.stageNote;
    section.appendChild(note);
  }

  const list = document.createElement("div");
  list.className = "policy-stage-list";
  progress.stages.forEach((stage, index) => {
    const item = document.createElement("div");
    const normalizedStatus = String(stage.status || "pending").toLowerCase();
    item.className = `policy-stage-card stage-${normalizedStatus}`;
    item.innerHTML = `
      <span class="policy-stage-step">${index + 1}</span>
      <div class="policy-stage-copy">
        <strong>${stage.label || `Stage ${index + 1}`}</strong>
        <span>${stage.note || (normalizedStatus === "complete" ? "Completed." : normalizedStatus === "in-progress" ? "In progress." : normalizedStatus === "failed" ? "Failed." : "Waiting to start.")}</span>
      </div>
    `;
    list.appendChild(item);
  });
  section.appendChild(list);

  return section;
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
    const topRisks = getOnboardingSnapshot(onboarding).derivedTopRisks;
    wrapper.appendChild(renderPolicyGenerationStages(policyProgress));
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
      ...topRisks.map((risk) => `Top risk: ${risk.title}`)
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
    wrapper.appendChild(
      renderScoreSummaryCard("Risk scoring overview", [
        { label: "Total risks", value: risks.length || 0 },
        { label: "Average inherent score", value: inherentScores.length ? (inherentScores.reduce((sum, score) => sum + score, 0) / inherentScores.length).toFixed(1) : "0.0" },
        { label: "Average residual score", value: residualScores.length ? (residualScores.reduce((sum, score) => sum + score, 0) / residualScores.length).toFixed(1) : "0.0" },
        { label: "Critical or high risks", value: inherentScores.filter((score) => score >= 10).length }
      ])
    );
    wrapper.appendChild(renderHeatmapCard("Risk matrix (Inherent)", risks, (risk) => risk.likelihood, (risk) => risk.impact));
    wrapper.appendChild(
      renderHeatmapCard("Risk matrix (Residual)", risks, (risk) => risk.residual_likelihood, (risk) => risk.residual_impact)
    );
    wrapper.appendChild(
      renderScoreSummaryCard("Risk score bands", [
        { label: "Critical", value: inherentScores.filter((score) => score >= 16).length },
        { label: "High", value: inherentScores.filter((score) => score >= 10 && score < 16).length },
        { label: "Medium", value: inherentScores.filter((score) => score >= 5 && score < 10).length },
        { label: "Low", value: inherentScores.filter((score) => score >= 1 && score < 5).length }
      ])
    );
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
    wrapper.appendChild(
      renderScoreSummaryCard("Vendor scoring overview", [
        { label: "Total vendors", value: vendors.length || 0 },
        { label: "Average inherent score", value: inherentVendorScores.length ? (inherentVendorScores.reduce((sum, score) => sum + score, 0) / inherentVendorScores.length).toFixed(1) : "0.0" },
        { label: "Average residual score", value: residualVendorScores.length ? (residualVendorScores.reduce((sum, score) => sum + score, 0) / residualVendorScores.length).toFixed(1) : "0.0" },
        { label: "High-risk vendors", value: inherentVendorScores.filter((score) => score >= 10).length }
      ])
    );
    wrapper.appendChild(renderHeatmapCard("Vendor risk matrix (Inherent)", vendors, (vendor) => vendor.vendor_likelihood, (vendor) => vendor.vendor_impact));
    wrapper.appendChild(renderHeatmapCard("Vendor risk matrix (Residual)", vendors, (vendor) => vendor.residual_likelihood, (vendor) => vendor.residual_impact));
  }

  if (config.key === "output") {
    const policyArtifacts = getOutputArtifactPaths("Policy pack");
    const riskArtifacts = getOutputArtifactPaths("Risk register");
    const vendorArtifacts = getOutputArtifactPaths("Vendor register");

    wrapper.appendChild(
      renderDownloadButtons("Policy downloads", [
        { label: "Download Policy Pack PDF", path: findArtifactBySuffix(policyArtifacts, ".pdf") },
        { label: "Download Policy PDFs ZIP", path: findArtifactBySuffix(policyArtifacts, ".zip"), ghost: true }
      ])
    );
    wrapper.appendChild(
      renderDownloadButtons("Risk register downloads", [
        { label: "Download Risk CSV", path: findArtifactBySuffix(riskArtifacts, ".csv") },
        { label: "Download Risk Excel", path: findArtifactBySuffix(riskArtifacts, ".xlsx"), ghost: true }
      ])
    );
    wrapper.appendChild(
      renderDownloadButtons("Vendor register downloads", [
        { label: "Download Vendor CSV", path: findArtifactBySuffix(vendorArtifacts, ".csv") },
        { label: "Download Vendor Excel", path: findArtifactBySuffix(vendorArtifacts, ".xlsx"), ghost: true }
      ])
    );
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
  const blockerTitle = document.createElement("h4");
  blockerTitle.textContent = "Phase blocked";
  const blockerText = document.createElement("p");
  blockerText.className = "record-note";
  blockerText.textContent = "Complete the previous phase before continuing.";
  blockerCard.appendChild(blockerTitle);
  blockerCard.appendChild(blockerText);
  shell.appendChild(blockerCard);
  shell.appendChild(renderPhaseStatusSummary(config, phaseState));

  activeTabPanel.innerHTML = "";
  activeTabPanel.appendChild(shell);
}

function collectPhasePayload(config, form) {
  const payload = cloneData(state.selectedClientData[config.property]);

  if (config.key === "onboarding") {
    Object.assign(payload, collectValues(form, [config.frameworkField]));
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
      : [];
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

  const users = getStructuredClientUsers(sectionData);
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
  let sectionData = cloneData(state.selectedClientData[config.property] || {});
  if (config.key === "risk-assessment") {
    sectionData.risks = (sectionData.risks || []).map(decorateRiskRecord);
  }
  if (config.key === "vendor-risk") {
    sectionData.vendors = (sectionData.vendors || []).map(decorateVendorRecord);
  }
  if (config.key === "onboarding") {
    sectionData.client_user_records = getStructuredClientUsers(sectionData);
  }

  if (!phaseState.unlocked && config.key !== "onboarding") {
    renderBlockedPhase(config, phaseState);
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
    savePhase(config, form).catch((error) => setStatus(error.message, "error"));
  });

  if (config.key === "onboarding") {
    form.appendChild(renderOnboardingOverview(sectionData));
    const validationSummary = renderOnboardingValidationSummary(state.validation.onboarding);
    if (validationSummary) {
      form.appendChild(validationSummary);
    }

    const frameworkBlock = document.createElement("section");
    frameworkBlock.className = "form-section";
    const frameworkTitle = document.createElement("h4");
    frameworkTitle.textContent = "Step 1: Choose framework";
    const frameworkNote = document.createElement("p");
    frameworkNote.className = "section-note";
    frameworkNote.textContent = "Pick the framework first. The rest of the onboarding form is built around that selection.";
    frameworkBlock.appendChild(frameworkTitle);
    frameworkBlock.appendChild(frameworkNote);
    frameworkBlock.appendChild(
      renderFieldGrid(
        [config.frameworkField],
        sectionData,
        "framework",
        state.validation.onboarding?.errors?.framework_selection
          ? { framework_selection: state.validation.onboarding.errors.framework_selection }
          : {}
      )
    );
    form.appendChild(frameworkBlock);
  } else {
    form.appendChild(renderPhaseStatusSummary(config, phaseState));
  }

  const onboardingReadyToExpand = config.key !== "onboarding" || isFilled(sectionData.framework_selection);
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

  if (config.metaFields) {
    const metaSection = document.createElement("section");
    metaSection.className = "form-section";
    const title = document.createElement("h4");
    title.textContent = `${config.label} details`;
    metaSection.appendChild(title);
    metaSection.appendChild(renderFieldGrid(config.metaFields, sectionData, `${config.key}-meta`));
    form.appendChild(metaSection);
  }

  if (config.itemCollection) {
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
    if (config.itemLabel === "Vendor" && (config.key === "onboarding" || config.key === "vendor-management")) {
      const footerActions = document.createElement("div");
      footerActions.className = "repeatable-footer-actions";
      const addAnotherButton = document.createElement("button");
      addAnotherButton.type = "button";
      addAnotherButton.className = "action-button ghost";
      addAnotherButton.textContent = "Add another vendor";
      addAnotherButton.addEventListener("click", () => {
        syncDraftStateFromForm(config, form);
        const nextItem = {};
        config.itemFields.forEach((field) => {
          nextItem[field.name] = "";
        });
        state.selectedClientData[config.property][config.itemCollection].push(nextItem);
        renderActivePhase();
      });
      footerActions.appendChild(addAnotherButton);
      itemSection.appendChild(footerActions);
    }
    form.appendChild(itemSection);
  }

  if (trailingGroups.length && onboardingReadyToExpand) {
    appendGroupSections(trailingGroups, "tail");
  }

  const actions = document.createElement("div");
  actions.className = "form-actions";
  const policyProgress = config.key === "policy-generation" ? getPolicyGenerationProgress(state.selectedClientData) : null;
  if (config.key === "onboarding") {
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
    config.key === "onboarding" && !isFilled(sectionData.framework_selection)
      ? "Finish Onboarding"
      : config.key === "onboarding" && getOnboardingSnapshot(sectionData).ready
        ? "Finish Onboarding"
      : config.key === "onboarding"
        ? "Finish Onboarding"
      : config.key === "vendor-management"
        ? "Save Vendor Management"
        : `Save ${config.label}`;
  if (policyProgress?.inProgress) {
    submitButton.disabled = true;
  }
  actions.appendChild(submitButton);
  if (config.key === "policy-generation") {
    const policyApproval = getPolicyApprovalStatus(state.selectedClientData);
    if (policyProgress?.inProgress) {
      const runningButton = document.createElement("button");
      runningButton.type = "button";
      runningButton.className = "action-button ghost";
      runningButton.textContent = "Policy generation in progress";
      runningButton.disabled = true;
      actions.appendChild(runningButton);
    } else if (policyApproval.policyCount === 0) {
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
      bulkApproveButton.textContent = "Publish and Sign Off All Policies";
      bulkApproveButton.addEventListener("click", () => {
        publishAndSignOffAllPolicies(form).catch((error) => setStatus(error.message, "error"));
      });
      actions.appendChild(bulkApproveButton);
    }
    const continueButton = document.createElement("button");
    continueButton.type = "button";
    continueButton.className = "action-button ghost";
    continueButton.textContent = "Save policies and continue processing";
    if (policyProgress?.inProgress) {
      continueButton.disabled = true;
    }
    continueButton.addEventListener("click", () => {
      continueProcessingFromPolicies(form).catch((error) => setStatus(error.message, "error"));
    });
    actions.appendChild(continueButton);
  }
  form.appendChild(actions);

  shell.appendChild(head);
  shell.appendChild(note);
  shell.appendChild(form);
  activeTabPanel.appendChild(shell);
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

async function waitForPolicyGenerationCompletion() {
  const maxAttempts = 360;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await sleep(1000);
    await refreshSelectedClientSnapshot();
    const progress = getPolicyGenerationProgress(state.selectedClientData);
    if (progress.failed) {
      state.processing = { active: false, kind: "", startedAt: "", error: progress.lastError || "Policy generation failed." };
      renderTabs();
      renderActivePhase();
      throw new Error(progress.lastError || "Policy generation failed.");
    }
    if (!progress.inProgress) {
      state.processing = { active: false, kind: "", startedAt: "", error: "" };
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

  setStatus(`Saving ${config.label.toLowerCase()}...`);
  state.selectedClientData[config.property] = await api(
    `/api/clients/${encodeURIComponent(state.selectedClientId)}/${sectionKey}`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    }
  );
  if (config.key === "onboarding" || config.key === "vendor-management" || config.key === "vendor-risk") {
    await loadVendorCatalog();
  }
  syncDerivedVendors(state.selectedClientData);
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
    if (snapshot.ready && !options.suppressAdvance) {
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

  const actor = getClientUsernames()[0] || "the assigned approver";
  setStatus(`Publishing and signing off all ${policyApproval.policyCount} policies...`);
  state.selectedClientData = await api(
    `/api/clients/${encodeURIComponent(state.selectedClientId)}/policies/publish-all`,
    { method: "POST" }
  );
  syncDerivedVendors(state.selectedClientData);
  state.activePhaseKey = "risk-assessment";
  await loadClients();
  renderWorkspaceHeader(state.selectedClientData.client);
  renderTabs();
  renderActivePhase();
  setStatus(
    `All ${policyApproval.policyCount} policies were published and signed off as ${actor}. Risk and vendor processing complete.`,
    "success"
  );
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
  if (!window.confirm(`Delete client workspace for ${state.selectedClientData.client.companyName}?`)) {
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

async function initializeApp() {
  await Promise.all([loadVendorCatalog(), loadClients()]);
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
