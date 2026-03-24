// ============================================================
// Evidence Engine — Framework-Aware Evidence Optimization
// DB Agent GRC Workspace
// ============================================================

const COMPLIANCE_TASKS = [
  {
    id: "T-001", title: "Endpoint and Device Security", category: "Access Control",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.8", iso_clause: "A.8.1",
    evidence_required: ["screenshot", "config_export"],
    description: "Devices used by the team are protected with encryption, screen lock, and antivirus/EDR."
  },
  {
    id: "T-002", title: "Security Awareness Training", category: "HR Security",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC1.4", iso_clause: "A.6.3",
    evidence_required: ["log", "screenshot"],
    description: "All staff complete security awareness training at least annually with documented completion records."
  },
  {
    id: "T-003", title: "HR Security — Role Definitions", category: "HR Security",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC1.4", iso_clause: "A.6.1",
    evidence_required: ["policy", "log"],
    description: "Role descriptions, responsibilities, and security obligations are defined for all positions."
  },
  {
    id: "T-004", title: "Asset and System Inventory", category: "Asset Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.8", iso_clause: "A.8.1",
    evidence_required: ["config_export", "screenshot"],
    description: "A current inventory of hardware, software, and data assets in scope is maintained and reviewed."
  },
  {
    id: "T-005", title: "Monitoring and Alerting", category: "Operations",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC7.2", iso_clause: "A.8.15",
    evidence_required: ["screenshot", "log"],
    description: "Monitoring tools are configured to detect anomalies and generate alerts for security events."
  },
  {
    id: "T-006", title: "Incident Response Plan", category: "Incident Response",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC7.3", iso_clause: "A.5.24",
    evidence_required: ["policy", "log"],
    description: "A documented incident response plan is approved, tested, and covers detection through recovery."
  },
  {
    id: "T-007", title: "Access Control Policy", category: "Access Control",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.1", iso_clause: "A.8.5",
    evidence_required: ["policy", "screenshot"],
    description: "An access control policy defines how access is granted, reviewed, and revoked."
  },
  {
    id: "T-008", title: "MFA Enforcement", category: "Access Control",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.1", iso_clause: "A.8.5",
    evidence_required: ["screenshot"],
    description: "Multi-factor authentication is enforced across all systems holding in-scope data."
  },
  {
    id: "T-009", title: "Privileged Access Review", category: "Access Control",
    frameworks: ["SOC2"], soc2_criteria: "CC6.3", iso_clause: null,
    evidence_required: ["log", "screenshot"],
    description: "Privileged accounts are reviewed quarterly and entitlements reduced to minimum necessary."
  },
  {
    id: "T-010", title: "Change Management — Branch Protection", category: "Change Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC8.1", iso_clause: "A.8.32",
    evidence_required: ["screenshot", "config_export"],
    description: "Branch protection rules, PR review requirements, and deployment gating are configured and enforced."
  },
  {
    id: "T-011", title: "Vulnerability Management Program", category: "Vulnerability Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC7.1", iso_clause: "A.8.8",
    evidence_required: ["policy", "report"],
    description: "A vulnerability management program defines scan cadence, severity SLAs, and remediation tracking."
  },
  {
    id: "T-012", title: "Backup and Recovery Testing", category: "Availability",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "A1.2", iso_clause: "A.8.13",
    evidence_required: ["log", "report"],
    description: "Backups are tested for recoverability at least annually with documented results."
  },
  {
    id: "T-013", title: "Business Continuity Plan", category: "Availability",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "A1.2", iso_clause: "A.5.29",
    evidence_required: ["policy", "log"],
    description: "A business continuity plan covers critical system recovery, decision authority, and communication."
  },
  {
    id: "T-014", title: "Encryption in Transit", category: "Cryptography",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.7", iso_clause: "A.8.24",
    evidence_required: ["screenshot", "config_export"],
    description: "All data in transit over public networks uses TLS 1.2 or later. SSL Labs or equivalent evidence required."
  },
  {
    id: "T-015", title: "Information Security Policy", category: "Policy Governance",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC1.3", iso_clause: "A.5.1",
    evidence_required: ["policy", "log"],
    description: "An information security policy is approved by management and reviewed at least annually."
  },
  {
    id: "T-016", title: "Acceptable Use Policy", category: "Policy Governance",
    frameworks: ["ISO"], soc2_criteria: null, iso_clause: "A.5.10",
    evidence_required: ["policy", "log"],
    description: "An acceptable use policy covers appropriate use of company assets, systems, and information."
  },
  {
    id: "T-017", title: "Device Hardening Evidence", category: "Access Control",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.8", iso_clause: "A.8.1",
    evidence_required: ["screenshot", "config_export"],
    description: "Device hardening is validated — encryption enabled, screen lock set, AV running, OS patched."
  },
  {
    id: "T-018", title: "Network Security Controls", category: "Network Security",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.6", iso_clause: "A.8.20",
    evidence_required: ["screenshot", "config_export"],
    description: "Network segmentation, firewall rules, and access controls protect the production environment."
  },
  {
    id: "T-019", title: "Privacy and Data Handling Policy", category: "Policy Governance",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC1.3", iso_clause: "A.5.34",
    evidence_required: ["policy", "log"],
    description: "A privacy policy covers data collection, retention, and subject rights obligations."
  },
  {
    id: "T-020", title: "Risk Assessment Register", category: "Risk Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC3.1", iso_clause: "A.8.2",
    evidence_required: ["report", "log"],
    description: "A risk register documents identified risks, likelihood/impact scores, and treatment plans."
  },
  {
    id: "T-021", title: "Penetration Test Report", category: "Vulnerability Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC7.1", iso_clause: "A.8.8",
    evidence_required: ["report"],
    description: "An annual penetration test is conducted by a qualified third party with findings and remediation tracked."
  },
  {
    id: "T-022", title: "Security Architecture Review", category: "Network Security",
    frameworks: ["SOC2"], soc2_criteria: "CC6.6", iso_clause: null,
    evidence_required: ["report", "screenshot"],
    description: "Security architecture is reviewed to validate segmentation, trust boundaries, and least-privilege network access."
  },
  {
    id: "T-023", title: "Third-Party Security Policy", category: "Vendor Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC9.2", iso_clause: "A.5.19",
    evidence_required: ["policy"],
    description: "A third-party security policy defines obligations, approval process, and review cadence for vendors."
  },
  {
    id: "T-024", title: "Vulnerability Scan Reports", category: "Vulnerability Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC7.1", iso_clause: "A.8.8",
    evidence_required: ["report", "screenshot"],
    description: "Automated vulnerability scans run on a defined schedule with results reviewed and tracked."
  },
  {
    id: "T-025", title: "Remediation Tracking Evidence", category: "Vulnerability Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC7.1", iso_clause: "A.8.8",
    evidence_required: ["log", "screenshot"],
    description: "Vulnerability findings are tracked to closure with evidence of remediation or accepted exceptions."
  },
  {
    id: "T-026", title: "Background Check Records", category: "HR Security",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC1.4", iso_clause: "A.6.1",
    evidence_required: ["log"],
    description: "Background checks are conducted for all employees and contractors with access to sensitive systems."
  },
  {
    id: "T-027", title: "Vendor Risk Assessment Records", category: "Vendor Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC9.2", iso_clause: "A.5.19",
    evidence_required: ["report", "log"],
    description: "Critical vendors are assessed for security risk with documented findings and treatment."
  },
  {
    id: "T-028", title: "Data Processing Agreements", category: "Vendor Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC9.2", iso_clause: "A.5.20",
    evidence_required: ["policy", "log"],
    description: "DPAs or data security addenda are signed with all vendors that process personal or sensitive data."
  },
  {
    id: "T-029", title: "Offboarding Procedures", category: "Access Control",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.2", iso_clause: "A.6.5",
    evidence_required: ["log", "screenshot"],
    description: "Access is revoked promptly on employee departure with a documented offboarding checklist per person."
  },
  {
    id: "T-030", title: "Encryption at Rest", category: "Cryptography",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.7", iso_clause: "A.8.24",
    evidence_required: ["screenshot", "config_export"],
    description: "Storage encryption is enabled for all systems and databases holding in-scope data."
  },
  {
    id: "T-031", title: "Log Retention Configuration", category: "Operations",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC7.2", iso_clause: "A.8.15",
    evidence_required: ["screenshot", "config_export"],
    description: "Log retention is configured to meet audit period requirements (typically 12+ months) with immutability where possible."
  },
  {
    id: "T-032", title: "Audit Log Review Process", category: "Operations",
    frameworks: ["SOC2"], soc2_criteria: "CC7.2", iso_clause: null,
    evidence_required: ["log", "screenshot"],
    description: "Audit logs are reviewed on a defined cadence with evidence of the review activity retained."
  },
  {
    id: "T-033", title: "Incident Response Records", category: "Incident Response",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC7.3", iso_clause: "A.5.26",
    evidence_required: ["log", "report"],
    description: "Incident tickets, communications, containment decisions, and lessons learned are documented and retained."
  },
  {
    id: "T-034", title: "Security Review Cadence Evidence", category: "Risk Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC4.1", iso_clause: "A.9.1",
    evidence_required: ["log", "screenshot"],
    description: "Management reviews of security controls, metrics, and risks are conducted and documented regularly."
  },
  {
    id: "T-035", title: "Physical Security Controls", category: "Physical Security",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC6.4", iso_clause: "A.7.1",
    evidence_required: ["screenshot", "log"],
    description: "Physical access to office and server environments is controlled and monitored."
  },
  {
    id: "T-036", title: "Release Management Process", category: "Change Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC8.1", iso_clause: "A.8.32",
    evidence_required: ["screenshot", "log"],
    description: "Release approvals, deployment records, and post-release validations are retained for production changes."
  },
  {
    id: "T-037", title: "Policy Acknowledgement Log", category: "Policy Governance",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC1.3", iso_clause: "A.5.1",
    evidence_required: ["log"],
    description: "All employees have acknowledged the policy set with name, date, and policy version recorded."
  },
  {
    id: "T-038", title: "Data Classification Policy", category: "Data Management",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "C1.1", iso_clause: "A.5.12",
    evidence_required: ["policy"],
    description: "A data classification policy defines sensitivity tiers and handling requirements for each."
  },
  {
    id: "T-039", title: "ISMS Scope Document", category: "ISMS Management",
    frameworks: ["ISO"], soc2_criteria: null, iso_clause: "A.4.3",
    evidence_required: ["policy"],
    description: "The ISMS scope document defines the boundaries, systems, and locations in scope for ISO 27001 certification."
  },
  {
    id: "T-040", title: "Statement of Applicability", category: "ISMS Management",
    frameworks: ["ISO"], soc2_criteria: null, iso_clause: "A.4.3",
    evidence_required: ["policy"],
    description: "The SoA lists all ISO 27001 Annex A controls with justifications for inclusion or exclusion."
  },
  {
    id: "T-041", title: "Internal Audit Program", category: "ISMS Management",
    frameworks: ["ISO"], soc2_criteria: null, iso_clause: "A.9.2",
    evidence_required: ["report", "log"],
    description: "An internal audit program is in place with scheduled audits, findings, and management sign-off."
  },
  {
    id: "T-042", title: "Management Review Records", category: "ISMS Management",
    frameworks: ["ISO"], soc2_criteria: null, iso_clause: "A.9.3",
    evidence_required: ["log", "report"],
    description: "Top management reviews the ISMS performance at planned intervals with documented outcomes."
  },
  {
    id: "T-043", title: "System / Architecture Diagram", category: "Infrastructure",
    frameworks: ["SOC2", "ISO"], soc2_criteria: "CC2.1", iso_clause: "A.5.37",
    evidence_required: ["other", "report"],
    description: "A current system or architecture diagram showing all in-scope components, data flows, trust boundaries, and external integrations. Required as a baseline audit-readiness artifact across all frameworks — supports infrastructure understanding, control mapping, and risk accuracy."
  }
];

const CONTROL_OVERLAP_MAP = [
  {
    overlap_id: "OV-001", soc2_criteria: "CC6.1", iso_clause: "A.8.1 / A.8.5",
    unified_name: "Access Control — Policy and MFA",
    unified_evidence: "Single screenshot of MFA enforcement in identity provider satisfies both",
    tasks_affected: ["T-007", "T-008"],
    dedup_note: "One access control screenshot serves both SOC 2 CC6.1 and ISO A.8.5"
  },
  {
    overlap_id: "OV-002", soc2_criteria: "CC7.2", iso_clause: "A.8.15",
    unified_name: "Logging and Monitoring",
    unified_evidence: "Single monitoring dashboard screenshot satisfies both frameworks",
    tasks_affected: ["T-005", "T-031"],
    dedup_note: "CloudTrail or equivalent log screenshot with retention config serves both"
  },
  {
    overlap_id: "OV-003", soc2_criteria: "CC7.1", iso_clause: "A.8.8",
    unified_name: "Vulnerability Management",
    unified_evidence: "Single vulnerability scan report and pen test report serve both",
    tasks_affected: ["T-011", "T-024", "T-025"],
    dedup_note: "One pen test report and one scan export satisfies both frameworks"
  },
  {
    overlap_id: "OV-004", soc2_criteria: "CC8.1", iso_clause: "A.8.32",
    unified_name: "Change Management",
    unified_evidence: "Single branch protection screenshot and PR policy serves both",
    tasks_affected: ["T-010", "T-036"],
    dedup_note: "GitHub branch protection screenshot satisfies SOC 2 CC8.1 and ISO A.8.32"
  },
  {
    overlap_id: "OV-005", soc2_criteria: "CC1.4", iso_clause: "A.6.1 / A.6.3",
    unified_name: "HR Security — Hiring and Training",
    unified_evidence: "Single HR onboarding record and training completion log serve both",
    tasks_affected: ["T-002", "T-003", "T-026"],
    dedup_note: "One training log with completion dates and one background check record cover both frameworks"
  },
  {
    overlap_id: "OV-006", soc2_criteria: "CC6.2", iso_clause: "A.6.5",
    unified_name: "Offboarding and Access Revocation",
    unified_evidence: "Single offboarding checklist per employee serves both frameworks",
    tasks_affected: ["T-007", "T-029"],
    dedup_note: "One offboarding record with access revocation timestamp satisfies both"
  },
  {
    overlap_id: "OV-007", soc2_criteria: "CC6.7", iso_clause: "A.8.24",
    unified_name: "Encryption in Transit and at Rest",
    unified_evidence: "SSL Labs screenshot plus cloud encryption config screenshot serve both",
    tasks_affected: ["T-014", "T-030"],
    dedup_note: "Two screenshots total — one for TLS, one for storage encryption — cover all encryption requirements"
  },
  {
    overlap_id: "OV-008", soc2_criteria: "CC7.3", iso_clause: "A.5.24 / A.5.26",
    unified_name: "Incident Response",
    unified_evidence: "Signed IR plan plus incident log export serves both frameworks",
    tasks_affected: ["T-006", "T-033"],
    dedup_note: "One IR plan and one incident log satisfies both SOC 2 and ISO requirements"
  },
  {
    overlap_id: "OV-009", soc2_criteria: "CC9.2", iso_clause: "A.5.19 / A.5.20",
    unified_name: "Vendor Management",
    unified_evidence: "Vendor assessment records and DPA register serve both frameworks",
    tasks_affected: ["T-027", "T-028"],
    dedup_note: "One vendor assessment record per critical vendor covers both SOC 2 and ISO obligations"
  },
  {
    overlap_id: "OV-010", soc2_criteria: "A1.2", iso_clause: "A.8.13",
    unified_name: "Backup and Recovery",
    unified_evidence: "Single recovery test document with screenshots serves both",
    tasks_affected: ["T-012"],
    dedup_note: "One documented recovery test satisfies both SOC 2 availability and ISO continuity requirements"
  },
  {
    overlap_id: "OV-011", soc2_criteria: "CC1.3", iso_clause: "A.5.1",
    unified_name: "Policy Approval and Sign-off",
    unified_evidence: "Single policy acknowledgement log per employee covers all policies across both frameworks",
    tasks_affected: ["T-015", "T-019", "T-037"],
    dedup_note: "One consolidated sign-off log eliminates per-policy evidence where the same employees sign the same set"
  },
  {
    overlap_id: "OV-012", soc2_criteria: "CC6.8", iso_clause: "A.8.1",
    unified_name: "Endpoint and Device Security",
    unified_evidence: "Device security screenshot per device covers both frameworks",
    tasks_affected: ["T-001", "T-017"],
    dedup_note: "One MDM or device screenshot showing encryption, screen lock, and AV covers both asset inventory and endpoint security"
  },
  {
    overlap_id: "OV-013", soc2_criteria: "CC2.1 / CC6.6", iso_clause: "A.5.37 / A.8.20",
    unified_name: "System Architecture and Infrastructure Documentation",
    unified_evidence: "A single up-to-date architecture diagram satisfies multiple controls across both frameworks",
    tasks_affected: ["T-043", "T-022", "T-018", "T-004"],
    dedup_note: "One architecture diagram uploaded to T-043 can be linked to T-022 (Security Architecture Review), T-018 (Network Security Controls), and T-004 (Asset and System Inventory) — eliminating the need for separate network diagrams across tasks"
  }
];

// ============================================================
// Core Logic
// ============================================================

function evGetCompanyContext() {
  const onboarding = state.selectedClientData?.onboarding || {};
  const headcount = parseInt(String(onboarding.employee_headcount || "0").replace(/\D/g, ""), 10) || 0;
  let companySize = "unknown";
  if (headcount <= 10) companySize = "1-10";
  else if (headcount <= 50) companySize = "11-50";
  else if (headcount <= 200) companySize = "51-200";
  else if (headcount <= 1000) companySize = "201-1000";
  else companySize = "1000+";

  const evidenceData = state.selectedClientData?.evidenceTracker || {};
  const storedMaturity = parseInt(String(evidenceData.security_maturity || "0"), 10);
  let securityMaturity = storedMaturity || 2;
  if (!storedMaturity) {
    if (headcount <= 10) securityMaturity = 1;
    else if (headcount <= 50) securityMaturity = 2;
    else if (headcount <= 200) securityMaturity = 3;
    else if (headcount <= 1000) securityMaturity = 4;
    else securityMaturity = 5;
  }

  return {
    company_name: onboarding.legal_entity || "Company",
    company_size: companySize,
    employee_headcount: headcount,
    security_maturity: securityMaturity,
    industry: onboarding.industry || "",
    cloud_providers: onboarding.cloud_providers || "",
    identity_provider: onboarding.identity_provider || "",
    mfa_enabled: onboarding.mfa_enabled || "",
    framework_selection: onboarding.framework_selection || ""
  };
}

function evGetSelectedFrameworks() {
  const onboarding = state.selectedClientData?.onboarding || {};

  // Prefer new multi-framework v2 format
  if (onboarding.framework_selection_v2) {
    try {
      const names = typeof onboarding.framework_selection_v2 === "string"
        ? JSON.parse(onboarding.framework_selection_v2)
        : onboarding.framework_selection_v2;
      if (Array.isArray(names) && names.length > 0) {
        const keyMap = { "SOC 2 Type I": "SOC2", "SOC 2 Type II": "SOC2", "ISO 27001": "ISO", "HIPAA": "HIPAA", "GDPR": "GDPR", "PCI DSS": "PCI DSS" };
        return [...new Set(names.map(n => keyMap[n] || n))];
      }
    } catch (_) { /* fall through to legacy */ }
  }

  // Legacy single-value format
  const sel = String(onboarding.framework_selection || "").trim();
  if (sel === "SOC2") return ["SOC2"];
  if (sel === "ISO") return ["ISO"];
  if (sel === "Both") return ["SOC2", "ISO"];
  return []; // show all if none selected
}

function evGetApplicableTasks(selectedFrameworks) {
  if (!selectedFrameworks || selectedFrameworks.length === 0) return COMPLIANCE_TASKS;
  return COMPLIANCE_TASKS.filter(task =>
    task.frameworks.some(f => selectedFrameworks.includes(f))
  );
}

function evScaleEvidenceToMaturity(task, companyContext) {
  const maturity = companyContext.security_maturity;
  const headcount = companyContext.employee_headcount;
  const isStartup = headcount <= 50;
  const isEnterprise = headcount >= 201;

  if (maturity <= 2 || isStartup) {
    return {
      level: "lightweight",
      label: "LIGHTWEIGHT",
      description: "A screenshot or brief document is sufficient. Auditors understand early-stage companies operate leaner.",
      guidance: "Focus on proving intent and basic implementation. Formal documented procedures are not expected at this stage.",
      minimum_acceptable: task.evidence_required[0]
    };
  }
  if (maturity === 3) {
    return {
      level: "standard",
      label: "STANDARD",
      description: "Documented evidence showing the control is implemented and followed consistently.",
      guidance: "Show that the process exists and has been followed at least once in the audit period.",
      minimum_acceptable: task.evidence_required.join(" + ")
    };
  }
  return {
    level: "comprehensive",
    label: "COMPREHENSIVE",
    description: "Formal evidence with timestamps, ownership, and review records.",
    guidance: "Evidence must show not just that it was done, but that it is done consistently by a defined process with assigned ownership.",
    minimum_acceptable: [...task.evidence_required, "policy_signoff", "review_log"].join(" + ")
  };
}

function evCheckEvidenceSufficiency(evidenceItems, task) {
  if (!evidenceItems || evidenceItems.length === 0) {
    return { verdict: "missing", issues: ["No evidence uploaded for this task."] };
  }

  const allExpired = evidenceItems.every(item => {
    if (!item.effective_date) return false;
    const d = new Date(item.effective_date);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    return d < cutoff;
  });
  if (allExpired) {
    return { verdict: "expired", issues: ["All evidence is older than 12 months. Refresh before the audit."] };
  }

  const issues = [];
  evidenceItems.forEach(item => {
    if (String(item.description || "").length < 30) {
      issues.push(`"${item.title || "Item"}" — description too vague. Auditors need context about what the evidence proves.`);
    }
    if (item.evidence_type === "other" && task.evidence_required.includes("log")) {
      issues.push(`"${item.title || "Item"}" — a log is expected but type is set to "other". Clarify the evidence type.`);
    }
    if (!item.effective_date) {
      issues.push(`"${item.title || "Item"}" — no effective date. Auditors need to confirm evidence falls within the audit period.`);
    }
    const titleLower = String(item.title || "").toLowerCase();
    const descLower = String(item.description || "").toLowerCase();
    if (titleLower.includes("screenshot") && descLower.includes("screenshot") && descLower.length < 60) {
      issues.push(`"${item.title || "Item"}" — title and description are redundant. Add detail about what the screenshot proves.`);
    }
  });

  return {
    verdict: issues.length === 0 ? "sufficient" : "weak",
    issues
  };
}

function evFindReuseOpportunities(taskId) {
  const overlaps = CONTROL_OVERLAP_MAP.filter(ov => ov.tasks_affected.includes(taskId));
  if (!overlaps.length) return [];
  const reusable = [];
  overlaps.forEach(overlap => {
    overlap.tasks_affected.filter(t => t !== taskId).forEach(otherTaskId => {
      if (!reusable.find(r => r.task_id === otherTaskId)) {
        const otherTask = COMPLIANCE_TASKS.find(t => t.id === otherTaskId);
        if (otherTask) {
          reusable.push({
            task_id: otherTaskId,
            task_title: otherTask.title,
            overlap_id: overlap.overlap_id,
            reason: overlap.dedup_note
          });
        }
      }
    });
  });
  return reusable;
}

function evGetOverlapsForTask(taskId) {
  return CONTROL_OVERLAP_MAP.filter(ov => ov.tasks_affected.includes(taskId));
}

function evGetEvidenceData() {
  return state.selectedClientData?.evidenceTracker || {
    security_maturity: "",
    tasks: [],
    evidence_items: [],
    updatedAt: null
  };
}

function evGetEvidenceItemsForTask(taskId) {
  const data = evGetEvidenceData();
  const items = Array.isArray(data.evidence_items) ? data.evidence_items : [];
  return items.filter(item =>
    item.task_id === taskId || (Array.isArray(item.linked_tasks) && item.linked_tasks.includes(taskId))
  );
}

function evBuildSummary(selectedFrameworks) {
  const applicableTasks = evGetApplicableTasks(selectedFrameworks);
  const allTasks = COMPLIANCE_TASKS;
  const hiddenCount = allTasks.length - applicableTasks.length;
  const data = evGetEvidenceData();
  const evidenceItems = Array.isArray(data.evidence_items) ? data.evidence_items : [];

  let completeCount = 0;
  let weakCount = 0;
  let missingCount = 0;

  applicableTasks.forEach(task => {
    const items = evGetEvidenceItemsForTask(task.id);
    const suf = evCheckEvidenceSufficiency(items, task);
    if (suf.verdict === "sufficient") completeCount++;
    else if (suf.verdict === "weak") weakCount++;
    else missingCount++;
  });

  const overlapCount = CONTROL_OVERLAP_MAP.filter(ov =>
    ov.tasks_affected.some(t => {
      const task = COMPLIANCE_TASKS.find(ct => ct.id === t);
      return task && (selectedFrameworks.length === 0 || task.frameworks.some(f => selectedFrameworks.includes(f)));
    })
  ).length;

  // Count deduplicated evidence needed
  const applicableOverlaps = CONTROL_OVERLAP_MAP.filter(ov => {
    const both = selectedFrameworks.includes("SOC2") && selectedFrameworks.includes("ISO");
    if (!both) return false;
    return ov.tasks_affected.some(t => applicableTasks.find(at => at.id === t));
  });
  const tasksInOverlap = new Set(applicableOverlaps.flatMap(ov => ov.tasks_affected));
  const evidenceBeforeDedup = applicableTasks.length;
  const evidenceAfterDedup = applicableTasks.length - Math.max(0, tasksInOverlap.size - applicableOverlaps.length);

  const readinessPct = applicableTasks.length > 0
    ? Math.round((completeCount / applicableTasks.length) * 100) : 0;

  return {
    applicableCount: applicableTasks.length,
    hiddenCount,
    overlapCount: applicableOverlaps.length,
    evidenceBeforeDedup,
    evidenceAfterDedup,
    completeCount,
    weakCount,
    missingCount,
    readinessPct
  };
}

function evGenerateAIPrompt(selectedFrameworks, companyContext) {
  const applicableTasks = evGetApplicableTasks(selectedFrameworks);
  const data = evGetEvidenceData();
  const evidenceItems = Array.isArray(data.evidence_items) ? data.evidence_items : [];

  const taskSummary = applicableTasks.map(task => {
    const items = evGetEvidenceItemsForTask(task.id);
    const suf = evCheckEvidenceSufficiency(items, task);
    return { task_id: task.id, title: task.title, frameworks: task.frameworks, verdict: suf.verdict, evidence_count: items.length };
  });

  const incompleteTasks = taskSummary.filter(t => t.verdict !== "sufficient").map(t => {
    const task = COMPLIANCE_TASKS.find(ct => ct.id === t.task_id);
    return { ...t, evidence_required: task?.evidence_required, soc2_criteria: task?.soc2_criteria, iso_clause: task?.iso_clause };
  });

  const applicableOverlaps = selectedFrameworks.includes("SOC2") && selectedFrameworks.includes("ISO")
    ? CONTROL_OVERLAP_MAP.filter(ov => ov.tasks_affected.some(t => applicableTasks.find(at => at.id === t)))
    : [];

  return `You are a senior SOC 2 and ISO 27001 auditor and GRC consultant.
You are reviewing a company's evidence collection plan before their audit.
Your job is to eliminate unnecessary evidence requests and ensure what remains is sufficient, non-redundant, and audit-ready.

COMPANY CONTEXT:
${JSON.stringify(companyContext, null, 2)}

SELECTED FRAMEWORKS:
${selectedFrameworks.join(", ") || "None selected — showing all"}

CURRENT TASK COMPLETION:
${JSON.stringify(taskSummary, null, 2)}

INCOMPLETE OR MISSING EVIDENCE:
${JSON.stringify(incompleteTasks, null, 2)}

DETECTED CONTROL OVERLAPS:
${JSON.stringify(applicableOverlaps, null, 2)}

TASK 1 — EVIDENCE AUDIT:
For each incomplete task tell me:
- Is this task required for the selected frameworks?
- Is the evidence requested the minimum sufficient evidence?
- Is there a simpler or multi-purpose piece of evidence that satisfies this control?
- Would an auditor accept a lighter-weight version given this company's size and maturity?

TASK 2 — DEDUPLICATION:
Identify tasks where the same evidence upload satisfies multiple controls.
List these explicitly so the company only uploads once.

TASK 3 — PRIORITY SEQUENCE:
Given the current state, what order should they tackle evidence collection?
Prioritize by: audit impact first, then effort (quick wins early to build momentum).

TASK 4 — AUDITOR REALISM CHECK:
For each piece of evidence currently marked weak, would a real auditor accept it?
Flag anything that looks superficial, too vague, or unlikely to survive scrutiny.

Return a JSON object:
{
  "unnecessary_tasks": [{ "task_id": "...", "reason": "..." }],
  "deduplication_opportunities": [{ "evidence_description": "...", "satisfies_tasks": [...], "upload_once_instruction": "..." }],
  "evidence_simplifications": [{ "task_id": "...", "current_requirement": "...", "simplified_for_this_company": "...", "auditor_rationale": "..." }],
  "priority_sequence": [{ "task_id": "...", "priority_rank": 1, "reason": "...", "estimated_effort": "..." }],
  "auditor_concerns": [{ "task_id": "...", "concern": "..." }],
  "overall_verdict": "..."
}

Rules:
- Be brutally honest — do not soften findings
- Proportionality is correct — a 10-person startup should not be held to enterprise evidence standards
- Every simplification must still satisfy the actual control objective
- Every deduplication must be legitimate — do not merge evidence that needs to be separate
- Return only valid JSON`;
}

// ============================================================
// State
// ============================================================

state.evidenceActiveTaskId = null;
state.evidenceFrameworkOverride = null; // null = use onboarding value

async function evSaveData(newData) {
  if (!state.selectedClientId) return;
  const payload = { ...newData, updatedAt: new Date().toISOString() };
  state.selectedClientData.evidenceTracker = await api(
    `/api/clients/${encodeURIComponent(state.selectedClientId)}/evidence-tracker`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  renderWorkspaceHeader(state.selectedClientData.client);
  renderTabs();
  // Trigger targeted regen — pass task IDs so dependency graph can resolve
  // which specific risks/vendors are impacted by this evidence change
  if (typeof chTriggerAuditRegen === "function") {
    const taskIds = [
      ...(newData.evidence_items || []).flatMap(item =>
        [item.task_id, ...(item.linked_tasks || [])].filter(Boolean)
      )
    ];
    chTriggerAuditRegen(state.selectedClientId, [...new Set(taskIds)]);
  }
}

// ============================================================
// Render — Main Entry Point
// ============================================================

function renderEvidenceTracker() {
  activeTabPanel.innerHTML = "";
  const selectedFrameworks = evGetSelectedFrameworks();
  const companyContext = evGetCompanyContext();
  const applicableTasks = evGetApplicableTasks(selectedFrameworks);
  const summary = evBuildSummary(selectedFrameworks);

  const shell = document.createElement("section");
  shell.className = "tab-panel active";
  shell.id = "evidence-tracker-panel";

  // Header
  const head = document.createElement("div");
  head.className = "panel-head";
  const titleWrap = document.createElement("div");
  titleWrap.innerHTML = `<p class="section-label">Evidence & Audit Readiness</p><h3>Evidence Tracker</h3>`;
  head.appendChild(titleWrap);
  const headActions = document.createElement("div");
  headActions.className = "ev-head-actions";
  const dlZipBtn = document.createElement("button");
  dlZipBtn.type = "button";
  dlZipBtn.className = "action-button ghost ev-download-zip-btn";
  dlZipBtn.textContent = "Download All Evidence";
  dlZipBtn.title = "Export all evidence items as a structured ZIP archive (one folder per task/evidence item)";
  dlZipBtn.addEventListener("click", () => downloadAllEvidenceZip());
  headActions.appendChild(dlZipBtn);
  head.appendChild(headActions);
  shell.appendChild(head);

  const copy = document.createElement("p");
  copy.className = "tab-copy";
  copy.textContent = "Track evidence for every compliance task. The engine filters tasks to your selected frameworks, merges overlapping requirements, and scales expectations to your company size and maturity.";
  shell.appendChild(copy);

  // Summary Panel
  shell.appendChild(renderEvSummaryPanel(summary, selectedFrameworks));

  // Maturity & Framework Controls
  shell.appendChild(renderEvControls(selectedFrameworks, companyContext));

  if (state.evidenceActiveTaskId) {
    const task = COMPLIANCE_TASKS.find(t => t.id === state.evidenceActiveTaskId);
    if (task) {
      const isApplicable = applicableTasks.find(t => t.id === task.id);
      if (isApplicable) {
        shell.appendChild(renderEvTaskDetail(task, companyContext));
      }
    }
  }

  // Task List (compact)
  if (!("evSearch" in state)) state.evSearch = "";
  if (!("evStatusFilter" in state)) state.evStatusFilter = "all";
  if (!("evCategoryFilter" in state)) state.evCategoryFilter = "all";
  shell.appendChild(renderEvTaskList(applicableTasks, selectedFrameworks, companyContext));

  // AI Advisor
  shell.appendChild(renderEvAIAdvisor(selectedFrameworks, companyContext));

  activeTabPanel.appendChild(shell);
}

// ============================================================
// Render — Summary Panel
// ============================================================

function renderEvSummaryPanel(summary, selectedFrameworks) {
  const panel = document.createElement("div");
  panel.className = "ev-summary-panel";

  const header = document.createElement("button");
  header.className = "ev-summary-toggle";
  header.type = "button";
  header.innerHTML = `
    <span class="ev-summary-title">
      <span class="ev-readiness-pct ev-readiness-${summary.readinessPct >= 80 ? "high" : summary.readinessPct >= 50 ? "mid" : "low"}">${summary.readinessPct}%</span>
      Audit Readiness
      <span class="ev-fw-labels">${selectedFrameworks.length ? selectedFrameworks.join(" · ") : "All Frameworks"}</span>
    </span>
    <span class="ev-chevron" id="ev-chevron">▼</span>
  `;

  const body = document.createElement("div");
  body.className = "ev-summary-body";
  body.id = "ev-summary-body";

  body.innerHTML = `
    <div class="ev-summary-grid">
      <div class="ev-summary-metric">
        <span class="ev-metric-value">${summary.applicableCount}<span class="ev-metric-sub"> of ${summary.applicableCount + summary.hiddenCount}</span></span>
        <span class="ev-metric-label">Tasks in scope</span>
      </div>
      <div class="ev-summary-metric">
        <span class="ev-metric-value ev-col-hidden">${summary.hiddenCount}</span>
        <span class="ev-metric-label">Hidden (out of scope)</span>
      </div>
      <div class="ev-summary-metric">
        <span class="ev-metric-value ev-col-overlap">${summary.overlapCount}</span>
        <span class="ev-metric-label">Overlap opportunities</span>
      </div>
      <div class="ev-summary-metric">
        <span class="ev-metric-value">${summary.evidenceAfterDedup}<span class="ev-metric-sub"> of ${summary.evidenceBeforeDedup}</span></span>
        <span class="ev-metric-label">Evidence items after dedup</span>
      </div>
      <div class="ev-summary-metric">
        <span class="ev-metric-value ev-col-sufficient">${summary.completeCount}</span>
        <span class="ev-metric-label">Sufficient</span>
      </div>
      <div class="ev-summary-metric">
        <span class="ev-metric-value ev-col-weak">${summary.weakCount}</span>
        <span class="ev-metric-label">Weak / needs attention</span>
      </div>
      <div class="ev-summary-metric">
        <span class="ev-metric-value ev-col-missing">${summary.missingCount}</span>
        <span class="ev-metric-label">Missing</span>
      </div>
    </div>
  `;

  header.addEventListener("click", () => {
    const isOpen = body.classList.toggle("ev-summary-open");
    header.querySelector("#ev-chevron").textContent = isOpen ? "▲" : "▼";
  });

  // Start expanded
  body.classList.add("ev-summary-open");
  header.querySelector("#ev-chevron").textContent = "▲";

  panel.appendChild(header);
  panel.appendChild(body);
  return panel;
}

// ============================================================
// Render — Controls (Maturity + Framework Status)
// ============================================================

function renderEvControls(selectedFrameworks, companyContext) {
  const wrap = document.createElement("div");
  wrap.className = "ev-controls-row";

  // Framework status chips (read-only — driven by onboarding)
  const fwWrap = document.createElement("div");
  fwWrap.className = "ev-fw-chips";
  const fwLabel = document.createElement("span");
  fwLabel.className = "ev-control-label";
  fwLabel.textContent = "Active frameworks:";
  fwWrap.appendChild(fwLabel);

  ["SOC2", "ISO"].forEach(fw => {
    const chip = document.createElement("span");
    chip.className = `ev-fw-chip${selectedFrameworks.includes(fw) ? " ev-fw-chip-active" : " ev-fw-chip-inactive"}`;
    chip.textContent = fw === "SOC2" ? "SOC 2 Type II" : "ISO 27001";
    fwWrap.appendChild(chip);
  });

  if (selectedFrameworks.length === 0) {
    const allChip = document.createElement("span");
    allChip.className = "ev-fw-chip ev-fw-chip-all";
    allChip.textContent = "All (no framework selected)";
    fwWrap.appendChild(allChip);
  }

  const fwNote = document.createElement("span");
  fwNote.className = "ev-control-note";
  fwNote.textContent = "Change in Onboarding → Framework selection";
  fwWrap.appendChild(fwNote);

  // Maturity selector
  const matWrap = document.createElement("div");
  matWrap.className = "ev-maturity-wrap";
  const matLabel = document.createElement("label");
  matLabel.className = "ev-control-label";
  matLabel.textContent = "Security maturity:";
  matLabel.htmlFor = "ev-maturity-select";

  const matSelect = document.createElement("select");
  matSelect.id = "ev-maturity-select";
  matSelect.className = "ev-maturity-select";
  [["", "Auto-detect from company size"],["1","1 — Ad hoc"],["2","2 — Developing"],["3","3 — Defined"],["4","4 — Managed"],["5","5 — Optimising"]].forEach(([val, lbl]) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = lbl;
    opt.selected = String(evGetEvidenceData().security_maturity || "") === val;
    matSelect.appendChild(opt);
  });

  matSelect.addEventListener("change", async () => {
    const data = evGetEvidenceData();
    data.security_maturity = matSelect.value;
    await evSaveData(data);
    renderEvidenceTracker();
  });

  const matBadge = document.createElement("span");
  const matLevel = companyContext.security_maturity;
  const matLevelLabel = matLevel <= 2 ? "LIGHTWEIGHT" : matLevel === 3 ? "STANDARD" : "COMPREHENSIVE";
  matBadge.className = `ev-maturity-badge ev-mat-${matLevelLabel.toLowerCase()}`;
  matBadge.textContent = matLevelLabel;

  matWrap.appendChild(matLabel);
  matWrap.appendChild(matSelect);
  matWrap.appendChild(matBadge);

  wrap.appendChild(fwWrap);
  wrap.appendChild(matWrap);
  return wrap;
}

// ============================================================
// Render — Compact Task List (Vanta/Drata-style)
// ============================================================

function evFilteredTasks(tasks) {
  const search = (state.evSearch || "").toLowerCase().trim();
  const statusFilter = state.evStatusFilter || "all";
  const catFilter = state.evCategoryFilter || "all";
  return tasks.filter(task => {
    if (search && !task.title.toLowerCase().includes(search) && !task.id.toLowerCase().includes(search) && !task.category.toLowerCase().includes(search)) return false;
    if (catFilter !== "all" && task.category !== catFilter) return false;
    if (statusFilter !== "all") {
      const verdict = evCheckEvidenceSufficiency(evGetEvidenceItemsForTask(task.id), task).verdict;
      if (verdict !== statusFilter) return false;
    }
    return true;
  });
}

function renderEvTaskList(applicableTasks, selectedFrameworks, companyContext) {
  const section = document.createElement("section");
  section.className = "ev-task-section";

  const sectionHead = document.createElement("div");
  sectionHead.className = "ev-list-head";

  const titleEl = document.createElement("h4");
  titleEl.textContent = `Compliance Tasks`;
  sectionHead.appendChild(titleEl);

  const countBadge = document.createElement("span");
  countBadge.className = "ev-list-count-badge";
  countBadge.textContent = `${applicableTasks.length} in scope`;
  sectionHead.appendChild(countBadge);
  section.appendChild(sectionHead);

  if (applicableTasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "ev-empty";
    empty.textContent = "No tasks match the selected frameworks. Update framework selection in Onboarding.";
    section.appendChild(empty);
    return section;
  }

  // Filter bar
  const filterBar = document.createElement("div");
  filterBar.className = "ev-filter-bar";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "ev-search-input";
  searchInput.placeholder = "Search tasks...";
  searchInput.value = state.evSearch || "";
  searchInput.addEventListener("input", () => { state.evSearch = searchInput.value; renderEvidenceTracker(); });

  const statusSel = document.createElement("select");
  statusSel.className = "ev-filter-select";
  [["all","All statuses"],["missing","Missing"],["weak","Needs Review"],["sufficient","Completed"],["expired","Expired"]].forEach(([val, lbl]) => {
    const o = document.createElement("option");
    o.value = val; o.textContent = lbl;
    o.selected = (state.evStatusFilter || "all") === val;
    statusSel.appendChild(o);
  });
  statusSel.addEventListener("change", () => { state.evStatusFilter = statusSel.value; renderEvidenceTracker(); });

  const cats = [...new Set(applicableTasks.map(t => t.category))].sort();
  const catSel = document.createElement("select");
  catSel.className = "ev-filter-select";
  [["all","All categories"], ...cats.map(c => [c, c])].forEach(([val, lbl]) => {
    const o = document.createElement("option");
    o.value = val; o.textContent = lbl;
    o.selected = (state.evCategoryFilter || "all") === val;
    catSel.appendChild(o);
  });
  catSel.addEventListener("change", () => { state.evCategoryFilter = catSel.value; renderEvidenceTracker(); });

  filterBar.appendChild(searchInput);
  filterBar.appendChild(statusSel);
  filterBar.appendChild(catSel);
  section.appendChild(filterBar);

  const filtered = evFilteredTasks(applicableTasks);

  // Results count
  if (filtered.length !== applicableTasks.length) {
    const resultNote = document.createElement("p");
    resultNote.className = "ev-filter-result-note";
    resultNote.textContent = `Showing ${filtered.length} of ${applicableTasks.length} tasks`;
    section.appendChild(resultNote);
  }

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "ev-empty";
    empty.textContent = "No tasks match the current filters.";
    section.appendChild(empty);
    return section;
  }

  // Column headers
  const table = document.createElement("div");
  table.className = "ev-task-list-wrap";

  const colHeaders = document.createElement("div");
  colHeaders.className = "ev-list-col-headers";
  colHeaders.innerHTML = `
    <span class="ev-lh ev-lh-status">Status</span>
    <span class="ev-lh ev-lh-id">ID</span>
    <span class="ev-lh ev-lh-title">Task</span>
    <span class="ev-lh ev-lh-cat">Category</span>
    <span class="ev-lh ev-lh-fw">Framework</span>
    <span class="ev-lh ev-lh-ev">Evidence</span>
    <span class="ev-lh ev-lh-chev"></span>
  `;
  table.appendChild(colHeaders);

  filtered.forEach(task => {
    const row = renderEvTaskRow(task, selectedFrameworks, companyContext);
    table.appendChild(row);
    // If this task is active, inject detail panel right after its row
    if (state.evidenceActiveTaskId === task.id) {
      const detailWrap = document.createElement("div");
      detailWrap.className = "ev-inline-detail-wrap";
      detailWrap.appendChild(renderEvTaskDetail(task, companyContext));
      table.appendChild(detailWrap);
    }
  });

  section.appendChild(table);
  return section;
}

function renderEvTaskRow(task, selectedFrameworks, companyContext) {
  const evidenceItems = evGetEvidenceItemsForTask(task.id);
  const sufficiency = evCheckEvidenceSufficiency(evidenceItems, task);
  const overlaps = evGetOverlapsForTask(task.id);
  const isActive = state.evidenceActiveTaskId === task.id;

  const row = document.createElement("div");
  row.className = `ev-task-row${isActive ? " ev-task-row-active" : ""}`;
  row.dataset.taskId = task.id;

  const sufLabels = { sufficient: "Completed", weak: "Needs Review", missing: "Missing", expired: "Expired" };
  const verdict = sufficiency.verdict || "missing";

  const showFw = selectedFrameworks.length ? selectedFrameworks : (task.soc2_criteria ? ["SOC2"] : []).concat(task.iso_clause ? ["ISO"] : []);
  const fwChips = [];
  if (task.soc2_criteria && (showFw.includes("SOC2") || !selectedFrameworks.length)) fwChips.push(`<span class="ev-criteria-chip ev-criteria-soc2 ev-chip-xs">SOC2 ${task.soc2_criteria}</span>`);
  if (task.iso_clause && (showFw.includes("ISO") || !selectedFrameworks.length)) fwChips.push(`<span class="ev-criteria-chip ev-criteria-iso ev-chip-xs">ISO ${task.iso_clause}</span>`);

  const evCount = evidenceItems.length;
  const hasOverlap = overlaps.length > 0;
  const issueTitle = sufficiency.issues?.join("\n") || "";

  row.innerHTML = `
    <span class="ev-row-status-cell">
      <span class="ev-row-dot ev-dot-${verdict}" title="${issueTitle}"></span>
      <span class="ev-badge ev-suf-${verdict} ev-badge-sm">${sufLabels[verdict]}</span>
    </span>
    <span class="ev-row-id">${task.id}</span>
    <span class="ev-row-title-cell">
      <span class="ev-row-title">${task.title}</span>
      ${hasOverlap ? `<span class="ev-badge ev-badge-overlap ev-badge-xs" title="${overlaps.map(o=>o.dedup_note).join('\n')}">OVERLAP</span>` : ""}
    </span>
    <span class="ev-row-cat">${task.category}</span>
    <span class="ev-row-fw">${fwChips.join("") || '<span class="ev-row-fw-dash">—</span>'}</span>
    <span class="ev-row-ev ${evCount ? "" : "ev-row-ev-none"}">${evCount ? `${evCount} item${evCount!==1?"s":""}` : "No evidence"}</span>
    <span class="ev-row-chev">${isActive ? "▲" : "▼"}</span>
  `;

  row.addEventListener("click", () => {
    state.evidenceActiveTaskId = state.evidenceActiveTaskId === task.id ? null : task.id;
    renderEvidenceTracker();
    if (state.evidenceActiveTaskId) {
      setTimeout(() => {
        const wrap = document.querySelector(".ev-inline-detail-wrap");
        if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  });

  return row;
}

// ============================================================
// Render — Task Detail Panel
// ============================================================

function renderEvTaskDetail(task, companyContext) {
  const evidenceItems = evGetEvidenceItemsForTask(task.id);
  const maturity = evScaleEvidenceToMaturity(task, companyContext);
  const overlaps = evGetOverlapsForTask(task.id);
  const sufficiency = evCheckEvidenceSufficiency(evidenceItems, task);

  const panel = document.createElement("div");
  panel.className = "ev-detail-panel";
  panel.id = "ev-task-detail";

  // Header
  const head = document.createElement("div");
  head.className = "ev-detail-head";
  head.innerHTML = `
    <div>
      <span class="ev-task-id">${task.id}</span>
      <strong class="ev-detail-title">${task.title}</strong>
      <span class="ev-detail-category">${task.category}</span>
    </div>
    <button type="button" class="action-button ghost" id="ev-close-detail">Close</button>
  `;
  head.querySelector("#ev-close-detail").addEventListener("click", () => {
    state.evidenceActiveTaskId = null;
    renderEvidenceTracker();
  });
  panel.appendChild(head);

  // Description
  const desc = document.createElement("p");
  desc.className = "ev-detail-desc";
  desc.textContent = task.description;
  panel.appendChild(desc);

  // Maturity guidance box
  const guidanceBox = document.createElement("div");
  guidanceBox.className = `ev-guidance-box ev-mat-box-${maturity.level}`;
  guidanceBox.innerHTML = `
    <div class="ev-guidance-header">
      <span class="ev-badge ev-mat-${maturity.level}">${maturity.label}</span>
      <span class="ev-guidance-title">Evidence expectation for your company</span>
    </div>
    <p class="ev-guidance-desc">${maturity.description}</p>
    <p class="ev-guidance-text"><strong>What to upload:</strong> ${maturity.guidance}</p>
    <p class="ev-guidance-min"><strong>Minimum accepted:</strong> ${maturity.minimum_acceptable}</p>
  `;
  panel.appendChild(guidanceBox);

  // Overlap dedup notes
  if (overlaps.length > 0) {
    const overlapBox = document.createElement("div");
    overlapBox.className = "ev-overlap-box";
    const overlapTitle = document.createElement("p");
    overlapTitle.className = "ev-overlap-title";
    overlapTitle.innerHTML = `<span class="ev-badge ev-badge-overlap">OVERLAP DETECTED</span> This task shares evidence with other tasks`;
    overlapBox.appendChild(overlapTitle);
    overlaps.forEach(ov => {
      const ovRow = document.createElement("div");
      ovRow.className = "ev-overlap-row";
      const affectedTitles = ov.tasks_affected.filter(t => t !== task.id).map(t => {
        const ct = COMPLIANCE_TASKS.find(ct => ct.id === t);
        return ct ? `${t} — ${ct.title}` : t;
      }).join(", ");
      ovRow.innerHTML = `
        <span class="ev-overlap-id">${ov.overlap_id}</span>
        <div>
          <strong>${ov.unified_name}</strong>
          <p class="ev-overlap-dedup">${ov.dedup_note}</p>
          <p class="ev-overlap-also">Also satisfies: ${affectedTitles}</p>
        </div>
      `;
      overlapBox.appendChild(ovRow);
    });
    panel.appendChild(overlapBox);
  }

  // Sufficiency issues
  if (sufficiency.verdict === "weak" || sufficiency.verdict === "expired") {
    const issueBox = document.createElement("div");
    issueBox.className = "ev-issue-box";
    const issueTitle = document.createElement("p");
    issueTitle.className = "ev-issue-box-title";
    issueTitle.innerHTML = `<span class="ev-badge ev-suf-${sufficiency.verdict}">${sufficiency.verdict.toUpperCase()}</span> Auditor concerns with current evidence`;
    issueBox.appendChild(issueTitle);
    sufficiency.issues.forEach(issue => {
      const issueItem = document.createElement("p");
      issueItem.className = "ev-issue-detail";
      issueItem.textContent = issue;
      issueBox.appendChild(issueItem);
    });
    panel.appendChild(issueBox);
  }

  // Evidence items list
  if (evidenceItems.length > 0) {
    const evSection = document.createElement("div");
    evSection.className = "ev-evidence-section";
    const evTitle = document.createElement("h5");
    evTitle.textContent = "Uploaded evidence";
    evSection.appendChild(evTitle);
    evidenceItems.forEach(item => {
      evSection.appendChild(renderEvEvidenceItem(item, task.id));
    });
    panel.appendChild(evSection);
  }

  // Add evidence form
  panel.appendChild(renderEvAddEvidenceForm(task));

  return panel;
}

function renderEvEvidenceItem(item, primaryTaskId) {
  const row = document.createElement("div");
  row.className = "ev-evidence-item";

  const isLinked = item.task_id !== primaryTaskId;

  const typeLabels = {
    screenshot: "Screenshot", policy: "Policy / Document", log: "Log Export",
    config_export: "Config Export", report: "Report", other: "Other"
  };

  row.innerHTML = `
    <div class="ev-ev-top">
      <span class="ev-ev-type">${typeLabels[item.evidence_type] || item.evidence_type}</span>
      <strong class="ev-ev-title">${item.title || "Untitled"}</strong>
      ${isLinked ? `<span class="ev-ev-linked-badge">LINKED FROM ${item.task_id}</span>` : ""}
    </div>
    <p class="ev-ev-desc">${item.description || ""}</p>
    ${item.file_name ? `<div class="ev-ev-file-badge"><span class="ev-file-icon">&#128206;</span>${item.file_name}</div>` : ""}
    <div class="ev-ev-meta">
      ${item.effective_date ? `<span>Effective: ${item.effective_date}</span>` : ""}
      <span>Added: ${item.uploaded_at ? item.uploaded_at.split("T")[0] : "unknown"}</span>
      ${item.file_name ? `<span class="ev-meta-file-tag">File attached</span>` : ""}
    </div>
  `;

  if (!isLinked) {
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger-button";
    deleteBtn.textContent = "Remove";
    deleteBtn.addEventListener("click", async () => {
      const data = evGetEvidenceData();
      data.evidence_items = (data.evidence_items || []).filter(ev => ev.id !== item.id);
      await evSaveData(data);
      renderEvidenceTracker();
    });
    row.querySelector(".ev-ev-top").appendChild(deleteBtn);
  }

  return row;
}

function renderEvAddEvidenceForm(task) {
  const formWrap = document.createElement("div");
  formWrap.className = "ev-add-evidence-wrap";

  const formTitle = document.createElement("h5");
  formTitle.textContent = "Add evidence";
  formWrap.appendChild(formTitle);

  const form = document.createElement("form");
  form.className = "ev-evidence-form";
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = form.querySelector("[name=ev-title]").value.trim();
    const description = form.querySelector("[name=ev-desc]").value.trim();
    const evidenceType = form.querySelector("[name=ev-type]").value;
    const effectiveDate = form.querySelector("[name=ev-date]").value;
    const fileInput = form.querySelector("[name=ev-file]");
    const file = fileInput?.files?.[0];

    if (!title || !evidenceType) {
      setStatus("Title and evidence type are required.", "error");
      return;
    }

    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = file ? "Uploading..." : "Saving..."; }

    const newItem = {
      id: `EVD-${Date.now()}`,
      task_id: task.id,
      title,
      description,
      evidence_type: evidenceType,
      effective_date: effectiveDate,
      uploaded_at: new Date().toISOString(),
      linked_tasks: []
    };

    // Upload attached file if provided
    if (file && state.selectedClientId) {
      try {
        const base64 = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result.split(",")[1]);
          fr.onerror = reject;
          fr.readAsDataURL(file);
        });
        const uploadResult = await api(
          `/api/clients/${encodeURIComponent(state.selectedClientId)}/evidence-upload`,
          { method: "POST", body: JSON.stringify({ evidence_id: newItem.id, file_name: file.name, content_type: file.type || "application/octet-stream", base64 }) }
        );
        if (uploadResult?.file_name) {
          newItem.file_name = uploadResult.file_name;
          newItem.file_path = uploadResult.file_path;
        }
      } catch (uploadErr) {
        console.warn("Evidence file upload failed:", uploadErr);
        setStatus("Evidence saved but file upload failed: " + (uploadErr.message || "unknown error"), "error");
      }
    }

    const data = evGetEvidenceData();
    if (!Array.isArray(data.evidence_items)) data.evidence_items = [];
    data.evidence_items.push(newItem);
    await evSaveData(data);

    // Check reuse opportunities
    const reuseOps = evFindReuseOpportunities(task.id);
    renderEvidenceTracker();

    if (reuseOps.length > 0) {
      showEvReuseNotification(newItem, reuseOps);
    } else {
      setStatus("Evidence saved.", "success");
    }
  });

  form.innerHTML = `
    <div class="ev-form-grid">
      <div class="ev-form-field ev-form-wide">
        <label>Title <span class="ev-required">*</span></label>
        <input name="ev-title" type="text" placeholder="MFA enforcement screenshot — Okta admin panel" autocomplete="off" />
      </div>
      <div class="ev-form-field">
        <label>Evidence type <span class="ev-required">*</span></label>
        <select name="ev-type">
          <option value="">Select type</option>
          <option value="screenshot">Screenshot</option>
          <option value="policy">Policy / Document</option>
          <option value="log">Log Export</option>
          <option value="config_export">Config Export</option>
          <option value="report">Report</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="ev-form-field">
        <label>Effective date</label>
        <input name="ev-date" type="date" />
      </div>
      <div class="ev-form-field ev-form-wide">
        <label>Description — what does this prove? (30+ chars recommended)</label>
        <textarea name="ev-desc" rows="3" placeholder="Describe exactly what this evidence proves and where it was captured. E.g. Okta admin panel showing MFA required for all users on 2026-03-10."></textarea>
      </div>
      <div class="ev-form-field ev-form-wide">
        <label>Attach file <span class="ev-optional">(optional)</span></label>
        <input name="ev-file" type="file" class="ev-file-input" />
        <p class="ev-file-hint">Screenshots, PDFs, config exports, reports — any format. Stored securely for ZIP export.</p>
      </div>
    </div>
    <div class="ev-form-actions">
      <button type="submit" class="action-button">Save Evidence</button>
    </div>
  `;

  formWrap.appendChild(form);
  return formWrap;
}

// ============================================================
// Render — Reuse Notification Toast
// ============================================================

function showEvReuseNotification(evidenceItem, reuseOps) {
  const existing = document.getElementById("ev-reuse-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "ev-reuse-toast";
  toast.id = "ev-reuse-toast";

  const title = document.createElement("p");
  title.className = "ev-toast-title";
  title.textContent = "This evidence may also satisfy:";
  toast.appendChild(title);

  const list = document.createElement("ul");
  list.className = "ev-toast-list";
  reuseOps.forEach(op => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${op.task_id}</strong> — ${op.task_title} <span class="ev-toast-overlap-id">(${op.overlap_id})</span>`;
    list.appendChild(li);
  });
  toast.appendChild(list);

  const actions = document.createElement("div");
  actions.className = "ev-toast-actions";

  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.className = "action-button";
  applyBtn.textContent = "Apply to these tasks";
  applyBtn.addEventListener("click", async () => {
    const data = evGetEvidenceData();
    const idx = data.evidence_items.findIndex(ev => ev.id === evidenceItem.id);
    if (idx !== -1) {
      const linkedIds = reuseOps.map(op => op.task_id);
      data.evidence_items[idx].linked_tasks = [
        ...new Set([...(data.evidence_items[idx].linked_tasks || []), ...linkedIds])
      ];
      await evSaveData(data);
    }
    toast.remove();
    setStatus("Evidence linked to related tasks.", "success");
    renderEvidenceTracker();
  });

  const dismissBtn = document.createElement("button");
  dismissBtn.type = "button";
  dismissBtn.className = "action-button ghost";
  dismissBtn.textContent = "Dismiss";
  dismissBtn.addEventListener("click", () => {
    toast.remove();
    setStatus("Evidence saved.", "success");
  });

  actions.appendChild(applyBtn);
  actions.appendChild(dismissBtn);
  toast.appendChild(actions);

  document.getElementById("evidence-tracker-panel")?.appendChild(toast) ||
    activeTabPanel.appendChild(toast);
}

// ============================================================
// Render — AI Advisor
// ============================================================

function renderEvAIAdvisor(selectedFrameworks, companyContext) {
  const section = document.createElement("section");
  section.className = "ev-ai-section";

  const head = document.createElement("div");
  head.className = "section-head-row";
  const title = document.createElement("h4");
  title.textContent = "AI Evidence Gap Analysis";
  head.appendChild(title);
  section.appendChild(head);

  const desc = document.createElement("p");
  desc.className = "section-note";
  desc.textContent = "Copy this prompt and run it in your Claude session. It returns a structured JSON analysis of your evidence gaps, deduplication opportunities, and priority sequence.";
  section.appendChild(desc);

  const promptContainer = document.createElement("div");
  promptContainer.className = "ev-prompt-container";

  const promptText = document.createElement("pre");
  promptText.className = "ev-prompt-text";
  promptText.id = "ev-ai-prompt-text";

  const generateBtn = document.createElement("button");
  generateBtn.type = "button";
  generateBtn.className = "action-button ghost";
  generateBtn.textContent = "Generate Prompt";
  generateBtn.addEventListener("click", () => {
    const prompt = evGenerateAIPrompt(selectedFrameworks, companyContext);
    promptText.textContent = prompt;
    promptContainer.classList.add("ev-prompt-visible");
    generateBtn.textContent = "Regenerate Prompt";
  });

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "action-button ghost";
  copyBtn.textContent = "Copy to Clipboard";
  copyBtn.addEventListener("click", () => {
    const text = promptText.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => setStatus("Prompt copied.", "success"));
  });

  const btnRow = document.createElement("div");
  btnRow.className = "ev-ai-btn-row";
  btnRow.appendChild(generateBtn);
  btnRow.appendChild(copyBtn);
  section.appendChild(btnRow);

  promptContainer.appendChild(promptText);
  section.appendChild(promptContainer);
  return section;
}

// ============================================================
// Download All Evidence ZIP
// ============================================================

async function downloadAllEvidenceZip() {
  if (!state.selectedClientId) { setStatus("No client loaded.", "error"); return; }
  const data = evGetEvidenceData();
  const items = Array.isArray(data.evidence_items) ? data.evidence_items : [];
  if (items.length === 0) { setStatus("No evidence items to export.", "error"); return; }

  const btn = document.querySelector(".ev-download-zip-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Building ZIP…"; }

  try {
    const resp = await fetch(`/api/clients/${encodeURIComponent(state.selectedClientId)}/evidence-zip`);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      throw new Error(err.error || resp.statusText);
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeCompany = ((state.selectedClientData?.client?.companyName || state.selectedClientId) + "").replace(/[^a-zA-Z0-9\-_ ]/g, "").trim();
    anchor.href = url;
    anchor.download = `Evidence-${safeCompany}-${new Date().toISOString().slice(0, 10)}.zip`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus(`Evidence ZIP downloaded — ${items.length} item${items.length !== 1 ? "s" : ""} included.`, "success");
  } catch (err) {
    setStatus("ZIP export failed: " + (err.message || "unknown error"), "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Download All Evidence"; }
  }
}
