'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// DB Agent — Node.js server (replaces server.ps1)
// Non-blocking async server: AI calls never freeze status polling
// ─────────────────────────────────────────────────────────────────────────────

const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ── Anthropic client (lazy — only created when API key present) ────────────
let _anthropic = null;
function getAnthropic() {
  if (!_anthropic && process.env.ANTHROPIC_API_KEY) {
    const Anthropic = require('@anthropic-ai/sdk');
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

// ── Paths ──────────────────────────────────────────────────────────────────
const scriptRoot        = __dirname;
const workspaceRoot     = path.dirname(scriptRoot);
const publicRoot        = path.join(scriptRoot, 'public');
const processingRoot    = path.join(scriptRoot, 'local-processing-store');
const catalogRoot       = path.join(processingRoot, 'catalogs');
const dataRoot          = path.join(processingRoot, 'clients');
const exportsRoot       = path.join(processingRoot, 'exports');
const auditLogsRoot     = path.join(processingRoot, 'audit-logs');
const frameworkCacheRoot = path.join(scriptRoot, 'framework-cache');
const templateCacheRoot = path.join(scriptRoot, 'template-cache', 'policy-templates');
const policyTemplateRoot = path.join(workspaceRoot, 'compliance_inputs', 'policy_templates', 'anthony_new_batch_policies_all_frameworks_combined');
const configRoot        = path.join(scriptRoot, 'config');
const promptRoot        = path.join(scriptRoot, 'prompts');
const vendorCatalogPath   = path.join(catalogRoot, 'vendor-catalog.json');
const soc2ControlsPath    = path.join(workspaceRoot, 'compliance_inputs', 'frameworks', 'soc2', 'soc2-controls.json');
const iso27001ControlsPath = path.join(workspaceRoot, 'compliance_inputs', 'frameworks', 'iso27001', 'iso27001-controls.json');

// Ensure directories exist
for (const dir of [processingRoot, catalogRoot, dataRoot, exportsRoot, auditLogsRoot, frameworkCacheRoot]) {
  fs.mkdirSync(dir, { recursive: true });
}

// ── SOC 2 controls reference data ─────────────────────────────────────────
let soc2Controls = { controls: [], tsc_categories: {} };
try {
  if (fs.existsSync(soc2ControlsPath)) {
    soc2Controls = JSON.parse(fs.readFileSync(soc2ControlsPath, 'utf8'));
    console.log(`[SOC2] Loaded ${soc2Controls.controls.length} controls from soc2-controls.json`);
  }
} catch (e) {
  console.warn('[SOC2] Could not load soc2-controls.json:', e.message);
}

function getSoc2ControlsForScope(tscScope) {
  const scope = Array.isArray(tscScope) && tscScope.length > 0 ? tscScope : ['Security'];
  return (soc2Controls.controls || []).filter(c => scope.includes(c.tsc));
}

function parseTscScope(onboarding) {
  const raw = onboarding.soc2_tsc_scope;
  if (Array.isArray(raw) && raw.length > 0) return raw;
  if (typeof raw === 'string') {
    if (raw.startsWith('[')) {
      try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch (e) {}
    }
    if (raw.trim()) return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return ['Security'];
}

// ── ISO 27001:2022 controls reference data ────────────────────────────────
let iso27001Controls = { controls: [], themes: {} };
try {
  if (fs.existsSync(iso27001ControlsPath)) {
    iso27001Controls = JSON.parse(fs.readFileSync(iso27001ControlsPath, 'utf8'));
    console.log(`[ISO27001] Loaded ${iso27001Controls.controls.length} controls from iso27001-controls.json`);
  }
} catch (e) {
  console.warn('[ISO27001] Could not load iso27001-controls.json:', e.message);
}

function getIso27001ControlsForTheme(theme) {
  if (!theme || theme === 'all') return iso27001Controls.controls || [];
  return (iso27001Controls.controls || []).filter(c => c.theme === theme);
}

function getIso27001ControlIdsByCategory(policyCategory) {
  const ISO_CATEGORY_MAP = {
    'Access Control':       ['A.5.15','A.5.16','A.5.17','A.5.18','A.8.2','A.8.3','A.8.5'],
    'Change Management':    ['A.8.32'],
    'Incident Response':    ['A.5.24','A.5.25','A.5.26','A.5.27','A.5.28'],
    'Business Continuity':  ['A.5.29','A.5.30','A.8.13','A.8.14'],
    'Data Protection':      ['A.5.12','A.5.13','A.5.14','A.8.10','A.8.11','A.8.12'],
    'Privacy':              ['A.5.34'],
    'Vendor Risk':          ['A.5.19','A.5.20','A.5.21','A.5.22','A.5.23'],
    'Monitoring':           ['A.8.15','A.8.16','A.8.17'],
    'Risk Management':      ['A.5.7','A.5.8'],
    'Logical Access':       ['A.5.15','A.5.16','A.5.17','A.5.18','A.8.2','A.8.3'],
    'Physical Security':    ['A.7.1','A.7.2','A.7.3','A.7.4'],
    'HR Security':          ['A.6.1','A.6.2','A.6.3','A.6.4','A.6.5'],
    'Cryptography':         ['A.8.24'],
    'Network Security':     ['A.8.20','A.8.21','A.8.22','A.8.23'],
    'Audit Logging':        ['A.8.15','A.8.16'],
    'Processing Integrity': ['A.8.9','A.8.25','A.8.26','A.8.28','A.8.29'],
    'Secure Development':   ['A.8.25','A.8.26','A.8.27','A.8.28','A.8.29','A.8.31','A.8.32'],
    'Asset Management':     ['A.5.9','A.5.10','A.5.11','A.5.12'],
    'Compliance':           ['A.5.31','A.5.32','A.5.35','A.5.36'],
  };
  const key = Object.keys(ISO_CATEGORY_MAP).find(k =>
    (policyCategory || '').toLowerCase().includes(k.toLowerCase())
  );
  return key ? ISO_CATEGORY_MAP[key] : [];
}

// ── Section metadata ───────────────────────────────────────────────────────
const SECTION_META = {
  'onboarding':       { folder: 'Client Details',           file: 'onboarding.json',          property: 'onboarding',       countKey: null,                   collection: 'vendors' },
  'policy-generation':{ folder: 'Policies and Procedures',  file: 'policies.json',             property: 'policyGeneration', countKey: 'policyCount',          collection: 'policies' },
  'policy-qa':        { folder: 'Policy QA',                file: 'policy-qa.json',            property: 'policyQa',         countKey: 'policyQaFindingCount', collection: 'findings' },
  'policy-summary':   { folder: 'Policy Summary',           file: 'policy-summary.json',       property: 'policySummary',    countKey: 'policySummaryCount',   collection: 'summaries' },
  'risk-assessment':  { folder: 'Risk Assessments',         file: 'risk-assessments.json',     property: 'riskAssessment',   countKey: 'riskCount',            collection: 'risks' },
  'risk-qa':          { folder: 'Risk QA',                  file: 'risk-qa.json',              property: 'riskQa',           countKey: 'riskQaFindingCount',   collection: 'findings' },
  'vendor-risk':      { folder: 'Vendor Assessments',       file: 'vendor-assessments.json',   property: 'vendorRisk',       countKey: 'vendorCount',          collection: 'vendors' },
  'vendor-qa':        { folder: 'Vendor QA',                file: 'vendor-qa.json',            property: 'vendorQa',         countKey: 'vendorQaFindingCount', collection: 'findings' },
  'control-mapping':  { folder: 'Control Mapping',          file: 'controls.json',             property: 'controlMapping',   countKey: 'controlCount',         collection: 'controls' },
  'audit-qa':         { folder: 'Audit QA',                 file: 'audit-qa.json',             property: 'auditQa',          countKey: 'auditFindingCount',    collection: 'findings' },
  'output':           { folder: 'Output',                   file: 'dashboard-output.json',     property: 'output',           countKey: 'outputCount',          collection: 'outputs' },
  'evidence-tracker': { folder: 'Evidence Tracker',         file: 'evidence-tracker.json',     property: 'evidenceTracker',  countKey: null,                   collection: 'evidence_items' },
};

// ── File I/O helpers ───────────────────────────────────────────────────────
function readJson(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''); // strip BOM
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveJson(filePath, value) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (value && typeof value === 'object') value.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
  } catch (e) {
    console.error('[saveJson] Error:', e.message, filePath);
  }
}

// ── Path helpers ───────────────────────────────────────────────────────────
function getSectionPaths(clientId) {
  const root = path.join(dataRoot, clientId);
  const paths = {};
  for (const [key, meta] of Object.entries(SECTION_META)) {
    const folder = path.join(root, meta.folder);
    paths[key] = { root, folder, file: path.join(folder, meta.file) };
  }
  return paths;
}

function safeFolder(name) {
  if (!name || !name.trim()) throw new Error('Company name is required.');
  return name.trim().replace(/[<>:"/\\|?*]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\.+$/, '');
}

// ── Audit log ──────────────────────────────────────────────────────────────
function writeAuditLog(clientId, eventType, payload = {}) {
  try {
    const dir = path.join(auditLogsRoot, clientId);
    fs.mkdirSync(dir, { recursive: true });
    const entry = JSON.stringify({ timestamp: new Date().toISOString(), event_type: eventType, ...payload }) + '\n';
    fs.appendFileSync(path.join(dir, 'activity.log'), entry, 'utf8');
  } catch {}
}

// ── Workspace creation ─────────────────────────────────────────────────────
function ensureClientWorkspace(companyName) {
  const clientId = safeFolder(companyName);
  const root = path.join(dataRoot, clientId);
  fs.mkdirSync(root, { recursive: true });
  const paths = getSectionPaths(clientId);
  for (const [key, p] of Object.entries(paths)) {
    fs.mkdirSync(p.folder, { recursive: true });
    if (!fs.existsSync(p.file)) {
      saveJson(p.file, newDefaultSection(key, clientId, companyName));
    }
  }
  return clientId;
}

// ── Default sections ───────────────────────────────────────────────────────
function newDefaultSection(sectionKey, clientId, companyName) {
  const base = { updatedAt: null };
  switch (sectionKey) {
    case 'onboarding': return {
      legal_entity: companyName, public_website: '', business_model: '', employee_headcount: '',
      work_type: '', company_type: '', industry: '', tech_stack: '', cloud_providers: '',
      storage_regions: '', devices_used: '', operating_systems: '', identity_provider: '',
      mfa_enabled: '', access_model: '', data_types: '', classification: '', encryption: '',
      backup: '', rto_rpo_targets: '', monitoring: '', top_risks: '', vulnerabilities: '', incidents: '',
      framework_selection: '', framework_selection_v2: '', soc2_tsc_scope: '["Security"]',
      audit_timeline: '', scope: '', client_users: '', client_usernames: '',
      client_user_records: [], policy_templates: '', iso_27001_framework: '', soc2_framework: '',
      vendors: [], reprocessing_required: '', change_notice: '', downstream_reset_at: '',
      last_processed_at: '', ...base
    };
    case 'policy-generation': return {
      template_status: '', framework_basis: '', top_risks_input: '',
      generation_status: 'Not started', generation_stage: '', generation_stage_note: '',
      generation_started_at: '', generation_completed_at: '', generation_last_error: '',
      generation_stages: newPolicyGenerationStages(), policies: [], ...base
    };
    case 'policy-qa':       return { qa_owner: '', cleaned_policies_ref: '', qa_notes: '', findings: [], ...base };
    case 'policy-summary':  return { summary_owner: '', summary_notes: '', summaries: [], ...base };
    case 'risk-assessment': return { risk_methodology: '', policy_summary_ref: '', risk_notes: '', risks: [], ...base };
    case 'risk-qa':         return { qa_owner: '', risk_register_ref: '', qa_notes: '', findings: [], ...base };
    case 'vendor-risk':     return { vendor_methodology: '', policy_summary_ref: '', vendor_notes: '', vendors: [], ...base };
    case 'vendor-qa':       return { qa_owner: '', vendor_register_ref: '', qa_notes: '', findings: [], ...base };
    case 'control-mapping': return { mapping_basis: '', evidence_standard: '', controls: [], ...base };
    case 'audit-qa':        return { audit_owner: '', audit_notes: '', findings: [], ...base };
    case 'output':          return { validation_status: '', output_notes: '', outputs: [], ...base };
    case 'evidence-tracker':return { security_maturity: '', tasks: [], evidence_items: [], ...base };
    default: throw new Error(`Unsupported section key: ${sectionKey}`);
  }
}

function newPolicyGenerationStages() {
  const stageKeys = [
    ['prepare',      'Load templates and company context'],
    ['draft',        'Build policy drafts'],
    ['rewrite',      'Rewrite narrative and tailor content'],
    ['format',       'Format and normalize policy bodies'],
    ['specificity',  'Apply company-specific language and metadata'],
    ['orchestrator',    'AI — Build company brief'],
    ['risk-discovery',  'AI — Discover company-specific risks'],
    ['writer',          'AI — Write company-specific policies'],
    ['critic',       'AI — Score and review all policies'],
    ['rewriter',     'AI — Fix flagged policies'],
    ['qa',           'Run QA and finalize policy pack'],
  ];
  return stageKeys.map(([key, label]) => ({ key, label, status: 'pending', note: '', started_at: '', completed_at: '' }));
}

// ── Policy generation stage helpers ───────────────────────────────────────
function startStage(section, stageKey, note = '') {
  const stage = (section.generation_stages || []).find(s => s.key === stageKey);
  if (stage) { stage.status = 'in-progress'; stage.note = note; stage.started_at = new Date().toISOString(); }
  section.generation_stage = stageKey;
  section.generation_stage_note = note;
  section.generation_status = 'In progress';
  return section;
}

function completeStage(section, stageKey) {
  const stage = (section.generation_stages || []).find(s => s.key === stageKey);
  if (stage) { stage.status = 'complete'; stage.completed_at = new Date().toISOString(); }
  return section;
}

function failSection(section, error) {
  section.generation_status = 'Failed';
  section.generation_last_error = error;
  section.generation_completed_at = new Date().toISOString();
  (section.generation_stages || []).forEach(s => { if (s.status === 'in-progress') { s.status = 'failed'; } });
  return section;
}

function isPolicyGenerationInProgress(section) {
  if (section.generation_status !== 'In progress') return false;
  const started = new Date(section.generation_started_at);
  const ageMinutes = (Date.now() - started.getTime()) / 60000;
  return ageMinutes < 20;
}

// ── Client aggregate ───────────────────────────────────────────────────────
function getClientAggregate(clientId) {
  const paths = getSectionPaths(clientId);
  const agg = {};
  for (const [key, meta] of Object.entries(SECTION_META)) {
    const data = readJson(paths[key].file, newDefaultSection(key, clientId, clientId));
    agg[meta.property] = data;
  }
  // Backfill linked_controls on existing policies that were saved before this was wired up
  if (Array.isArray(agg.policyGeneration?.policies) && agg.onboarding) {
    const fw = getFrameworkLabels(agg.onboarding).join(', ');
    let changed = false;
    agg.policyGeneration.policies = agg.policyGeneration.policies.map(p => {
      if (!p || p.linked_controls) return p;
      const ids = resolveControlIds(p.category, fw, agg.onboarding);
      if (!ids) return p;
      changed = true;
      return { ...p, linked_controls: ids };
    });
    if (changed) saveJson(paths['policy-generation'].file, agg.policyGeneration);
  }

  // stats
  const pg  = agg.policyGeneration || {};
  const ra  = agg.riskAssessment   || {};
  const vr  = agg.vendorRisk       || {};
  const cm  = agg.controlMapping   || {};
  const aq  = agg.auditQa          || {};
  agg.client = {
    id: clientId,
    companyName: (agg.onboarding && agg.onboarding.legal_entity) || clientId,
    folderPath: path.join(dataRoot, clientId),
    stats: {
      policyCount:       Array.isArray(pg.policies)  ? pg.policies.filter(Boolean).length  : 0,
      riskCount:         Array.isArray(ra.risks)      ? ra.risks.filter(Boolean).length      : 0,
      vendorCount:       Array.isArray(vr.vendors)    ? vr.vendors.filter(Boolean).length    : 0,
      controlCount:      Array.isArray(cm.controls)   ? cm.controls.filter(Boolean).length   : 0,
      auditFindingCount: Array.isArray(aq.findings)   ? aq.findings.filter(Boolean).length   : 0,
    },
    updatedAt: (agg.onboarding && agg.onboarding.updatedAt) || null,
  };
  return agg;
}

function getClients() {
  if (!fs.existsSync(dataRoot)) return [];
  return fs.readdirSync(dataRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const clientId = d.name;
      const paths = getSectionPaths(clientId);
      const ob = readJson(paths.onboarding.file, {});
      const pg = readJson(paths['policy-generation'].file, { policies: [] });
      const ra = readJson(paths['risk-assessment'].file,   { risks: [] });
      const vr = readJson(paths['vendor-risk'].file,       { vendors: [] });
      return {
        id: clientId,
        companyName: ob.legal_entity || clientId,
        folderPath: path.join(dataRoot, clientId),
        stats: {
          policyCount:  Array.isArray(pg.policies) ? pg.policies.filter(Boolean).length : 0,
          riskCount:    Array.isArray(ra.risks)     ? ra.risks.filter(Boolean).length    : 0,
          vendorCount:  Array.isArray(vr.vendors)   ? vr.vendors.filter(Boolean).length  : 0,
        },
        updatedAt: ob.updatedAt || null,
      };
    });
}

// ── Onboarding helpers ─────────────────────────────────────────────────────
const MATERIAL_FIELDS = ['industry','cloud_providers','identity_provider','data_types','classification',
  'encryption','backup','monitoring','framework_selection','business_model','employee_headcount',
  'mfa_enabled','access_model','tech_stack','storage_regions'];

function onboardingMateriallyChanged(before, after) {
  return MATERIAL_FIELDS.some(f => String(before[f]||'').trim() !== String(after[f]||'').trim());
}

function resetDownstreamWorkflow(clientId) {
  const paths = getSectionPaths(clientId);
  for (const key of ['policy-generation','policy-qa','policy-summary','risk-assessment','risk-qa','vendor-risk','vendor-qa','control-mapping','audit-qa','output']) {
    saveJson(paths[key].file, newDefaultSection(key, clientId, clientId));
  }
}

function getClientUsernames(onboarding) {
  const records = Array.isArray(onboarding.client_user_records) ? onboarding.client_user_records : [];
  if (records.length > 0) return records.map(r => String(r.name||'')).filter(Boolean);
  const raw = String(onboarding.client_usernames || onboarding.client_users || '');
  return raw.split(/[,|;\n]/).map(s => s.split('|')[0].trim()).filter(Boolean);
}

// ── Vendor governance (preserve AI-generated assessment fields) ─────────────
function applyVendorGovernance(currentVendors, incomingVendors) {
  if (!Array.isArray(incomingVendors) || incomingVendors.length === 0) return currentVendors || [];
  const currentMap = {};
  for (const v of (currentVendors || [])) { if (v && v.vendor_id) currentMap[v.vendor_id] = v; }
  const AI_FIELDS = ['treatment_plan','inherent_risk','residual_risk','vendor_likelihood','vendor_impact',
    'inherent_score','residual_likelihood','residual_impact','residual_score','linked_risks','linked_controls'];
  return incomingVendors.filter(Boolean).map(incoming => {
    const existing = currentMap[incoming.vendor_id] || {};
    const merged = { ...incoming };
    for (const f of AI_FIELDS) {
      if (!merged[f] && existing[f]) merged[f] = existing[f];
    }
    return merged;
  });
}

// ── Risk governance (preserve AI-generated treatment fields) ─────────────────
function applyRiskGovernance(currentRisks, incomingRisks) {
  if (!Array.isArray(incomingRisks) || incomingRisks.length === 0) return currentRisks || [];
  const currentMap = {};
  for (const r of (currentRisks || [])) { if (r && r.risk_id) currentMap[r.risk_id] = r; }
  const AI_FIELDS = ['treatment_plan','control_recommendations','inherent_score','residual_score',
    'likelihood','impact','residual_likelihood','residual_impact','linked_controls','linked_vendors'];
  return incomingRisks.filter(Boolean).map(incoming => {
    const existing = currentMap[incoming.risk_id] || {};
    const merged = { ...incoming };
    for (const f of AI_FIELDS) {
      if (!merged[f] && existing[f]) merged[f] = existing[f];
    }
    return merged;
  });
}

// ── Policy governance (preserve approval history) ──────────────────────────
function applyPolicyGovernance(currentPolicies, incomingPolicies, onboarding) {
  const currentMap = {};
  for (const p of (currentPolicies || [])) { if (p && p.policy_id) currentMap[p.policy_id] = p; }
  return (incomingPolicies || []).filter(Boolean).map(incoming => {
    const existing = currentMap[incoming.policy_id] || {};
    return {
      ...incoming,
      published:            existing.published            || incoming.published            || 'No',
      published_by:         existing.published_by         || incoming.published_by         || '',
      published_at:         existing.published_at         || incoming.published_at         || '',
      sign_off_complete:    existing.sign_off_complete    || incoming.sign_off_complete    || 'No',
      sign_off_completed_by:existing.sign_off_completed_by|| incoming.sign_off_completed_by|| '',
      sign_off_completed_at:existing.sign_off_completed_at|| incoming.sign_off_completed_at|| '',
      approval_history_text:existing.approval_history_text|| incoming.approval_history_text|| '',
    };
  });
}

function toggleEnabled(val) {
  return ['yes','true','1','signed','published'].includes(String(val||'').toLowerCase().trim());
}

function policiesApproved(policies) {
  return Array.isArray(policies) && policies.length > 0 &&
    policies.every(p => p && toggleEnabled(p.published) && toggleEnabled(p.sign_off_complete));
}

// ── Framework helpers ──────────────────────────────────────────────────────
function getFrameworkLabels(onboarding) {
  const fw = String(onboarding.framework_selection_v2 || onboarding.framework_selection || '').toLowerCase();
  const labels = [];
  if (fw.includes('soc') || fw.includes('soc2')) labels.push('SOC 2 Trust Services Criteria');
  if (fw.includes('iso')) labels.push('ISO 27001 clauses and Annex A');
  if (labels.length === 0) labels.push('SOC 2 Trust Services Criteria');
  return labels;
}

function getFrameworkBasisText(onboarding) {
  return getFrameworkLabels(onboarding).join(' and ');
}

// ── Template inventory ─────────────────────────────────────────────────────
function getTemplateInventory() {
  try {
    const roots = [policyTemplateRoot, templateCacheRoot].filter(d => fs.existsSync(d));
    const names = new Set();
    for (const root of roots) {
      for (const f of fs.readdirSync(root)) {
        if (f.endsWith('.txt') || f.endsWith('.json')) names.add(f.replace(/\.[^.]+$/, ''));
      }
    }
    return Array.from(names);
  } catch { return []; }
}

// ── Derived top risks ──────────────────────────────────────────────────────
function getDerivedTopRisks(onboarding) {
  const risks = [
    { title: 'Sensitive data exposure',             category: 'Data Protection',    threat_source: 'Internal misconfiguration, external attacker' },
    { title: 'Third-party service dependency',       category: 'Vendor Risk',        threat_source: 'Vendor failure, supply chain weakness' },
    { title: 'Cloud or infrastructure misconfiguration', category: 'Infrastructure', threat_source: 'Internal error, configuration drift' },
    { title: 'Unauthorized account access',          category: 'Access Control',     threat_source: 'Credential theft, privilege misuse' },
    { title: 'Delayed detection and response',       category: 'Incident Response',  threat_source: 'Monitoring gap, alert fatigue' },
    { title: 'Backup or recovery failure',           category: 'Business Continuity',threat_source: 'System failure, ransomware' },
    { title: 'Weak data protection controls',        category: 'Data Protection',    threat_source: 'Misconfiguration, policy gap' },
    { title: 'Access control drift',                 category: 'Access Control',     threat_source: 'Joiner/mover/leaver process failure' },
    { title: 'Change management gaps',               category: 'Change Management',  threat_source: 'Unreviewed deployment, process bypass' },
  ];
  return risks;
}

// ── Score helpers ──────────────────────────────────────────────────────────
function scoreBandLabel(score) {
  if (score >= 16) return 'Critical';
  if (score >= 10) return 'High';
  if (score >= 5)  return 'Medium';
  return 'Low';
}

function getRiskScoreProfile(title) {
  const profiles = {
    'Sensitive data exposure':              { l: 4, i: 5, rl: 3, ri: 4 },
    'Third-party service dependency':       { l: 4, i: 4, rl: 3, ri: 3 },
    'Cloud or infrastructure misconfiguration': { l: 4, i: 5, rl: 3, ri: 4 },
    'Unauthorized account access':          { l: 4, i: 5, rl: 2, ri: 4 },
    'Delayed detection and response':       { l: 3, i: 4, rl: 2, ri: 3 },
    'Backup or recovery failure':           { l: 3, i: 5, rl: 2, ri: 3 },
    'Weak data protection controls':        { l: 4, i: 4, rl: 2, ri: 3 },
    'Access control drift':                 { l: 3, i: 4, rl: 2, ri: 3 },
    'Change management gaps':               { l: 3, i: 4, rl: 2, ri: 3 },
  };
  return profiles[title] || { l: 3, i: 4, rl: 2, ri: 3 };
}

// ── Policy draft records ───────────────────────────────────────────────────
const POLICY_NAMES = [
  ['POL-001','Acceptable Use & Workstation Security','Endpoint Security'],
  ['POL-002','Access Control & Least Privilege','Access Management'],
  ['POL-003','Authentication & Password','Identity & Authentication'],
  ['POL-004','Background Check & Personnel Screening','Human Resources'],
  ['POL-005','Backup & Recovery','Business Continuity'],
  ['POL-006','Change Management','Change Control'],
  ['POL-007','Cloud & Infrastructure Security','Infrastructure'],
  ['POL-008','Data Classification & Handling','Data Management'],
  ['POL-009','Data Retention & Disposal','Data Management'],
  ['POL-010','Encryption & Key Management','Cryptography'],
  ['POL-011','Incident Response','Security Operations'],
  ['POL-012','Information Security Policy','Governance'],
  ['POL-013','Logging & Monitoring','Security Operations'],
  ['POL-014','Network Security','Infrastructure'],
  ['POL-015','Physical & Environmental Security','Physical Security'],
  ['POL-016','Privacy & Data Protection','Privacy'],
  ['POL-017','Risk Management','Governance'],
  ['POL-018','Secure Development','Engineering'],
  ['POL-019','Security Awareness & Training','Human Resources'],
  ['POL-020','Third-Party & Vendor Management','Vendor Risk'],
  ['POL-021','Vulnerability Management','Security Operations'],
  ['POL-022','Business Continuity & Disaster Recovery','Business Continuity'],
  ['POL-023','Asset Management','Asset Management'],
  ['POL-024','Capacity Management','Infrastructure'],
  ['POL-025','Supplier Relationships','Vendor Risk'],
];

function newPolicyDraftRecords(onboarding, topRisks) {
  const fw = getFrameworkLabels(onboarding).join(', ');
  const co = onboarding.legal_entity || 'The Organization';
  const today = new Date().toISOString().split('T')[0];
  const usernames = getClientUsernames(onboarding);
  const owner = usernames[0] || '';

  return POLICY_NAMES.map(([policy_id, name, category]) => ({
    policy_id,
    name,
    category,
    policy_owner: owner,
    sign_off_by: owner,
    policy_version: '1.0',
    version: '1.0',
    effective_date: today,
    review_cycle: 'Annual',
    published: 'No',
    published_by: '',
    published_at: '',
    sign_off_complete: 'No',
    sign_off_completed_by: '',
    sign_off_completed_at: '',
    framework_mapping: fw,
    linked_risks: topRisks.slice(0, 2).map(r => r.title).join(', '),
    linked_controls: resolveControlIds(category, fw, onboarding),
    executive_summary: `${co} has established this ${name} to govern ${category.toLowerCase()} activities and ensure compliance with ${fw} requirements.`,
    table_of_contents: `1. Purpose and Scope\n2. Policy Statement\n3. Roles and Responsibilities\n4. Controls and Requirements\n5. Exceptions\n6. Review and Compliance`,
    body: `1. Purpose and Scope\n\n${co} requires this policy to govern ${name.toLowerCase()} across all systems, personnel, and third parties within scope.\n\n2. Policy Statement\n\nAll personnel must comply with the requirements defined in this policy. Non-compliance may result in disciplinary action.\n\n3. Roles and Responsibilities\n\nThe Security Owner is responsible for maintaining and enforcing this policy.\n\n4. Controls and Requirements\n\n- All workforce members must adhere to the requirements in this policy\n- The Security Owner must review compliance quarterly\n- Exceptions must be approved in writing\n\n5. Exceptions\n\nAll exceptions require written approval from the Security Owner.\n\n6. Review and Compliance\n\nThis policy is reviewed annually or following a material change.`,
    approval_history_text: '',
  }));
}

// ── Risk assessment section ────────────────────────────────────────────────
function buildRiskAssessmentSection(onboarding, topRisks, policies) {
  const co      = onboarding.legal_entity || 'The Organization';
  const cloud   = onboarding.cloud_providers   || 'cloud infrastructure';
  const idp     = onboarding.identity_provider || 'the identity provider';
  const data    = onboarding.data_types        || 'company data';
  const classif = onboarding.classification    || 'regulated data';
  const backup  = onboarding.backup            || 'backup procedures';
  const monitor = onboarding.monitoring        || 'monitoring tooling';
  const enc     = onboarding.encryption        || 'encryption controls';

  const policyIds = (policies || []).filter(Boolean).map(p => p.policy_id).join(', ');

  const risks = topRisks.map((risk, i) => {
    const prof = getRiskScoreProfile(risk.title);
    const inherent = prof.l * prof.i;
    const residual = prof.rl * prof.ri;
    return {
      risk_id:    `RISK-${String(i + 1).padStart(3, '0')}`,
      category:   risk.category,
      asset:      `${co} data and systems`,
      threat:     risk.title,
      threat_source: risk.threat_source,
      why_this_company: `${co} is exposed to this risk due to its use of ${cloud} and handling of ${data}.`,
      existing_controls: policyIds ? `Linked policies: ${policyIds.split(', ').slice(0, 3).join(', ')}` : 'Controls documented in policy pack.',
      control_gaps: `Formal review cadence and ownership not yet fully established for this risk domain at ${co}.`,
      impact_description: `If this risk materialises, ${co}'s ${classif} and service delivery could be materially affected.`,
      likelihood: prof.l, impact: prof.i,
      inherent_score: inherent, inherent_rating: scoreBandLabel(inherent),
      likelihood_justification: `Given ${co}'s use of ${cloud} and ${idp}, this risk carries a likelihood of ${prof.l}/5.`,
      impact_justification: `Given ${co}'s handling of ${classif} and reliance on ${backup}, impact is rated ${prof.i}/5.`,
      residual_likelihood: prof.rl, residual_impact: prof.ri,
      residual_score: residual, residual_rating: scoreBandLabel(residual),
      treatment_plan: `Treat — implement controls to reduce likelihood and impact. Review quarterly.`,
      treatment_action: 'Mitigate',
      treatment_owner: getClientUsernames(onboarding)[0] || 'Security Owner',
      treatment_due: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      review_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      linked_policies: policyIds.split(', ').slice(0, 3).join(', '),
      linked_controls: '',
    };
  });

  return {
    risk_methodology: 'Likelihood × Impact scoring (1–5 scale). Inherent and residual scores calculated from onboarding-derived risk profile.',
    policy_summary_ref: 'Policies and Procedures/policies.json',
    risk_notes: `Risk register created from onboarding-derived risks for ${co}.`,
    risks,
    updatedAt: null,
  };
}

// ── Risk QA section ────────────────────────────────────────────────────────
function buildRiskQaSection(risks) {
  const findings = [];
  let c = 1;
  for (const risk of (risks || [])) {
    if (!risk) continue;
    if (!risk.treatment_owner) {
      findings.push({ finding_id: `RQA-${String(c++).padStart(3,'0')}`, risk_id: risk.risk_id, severity: 'Medium', category: 'Ownership', details: 'Treatment owner is not assigned.', resolution_status: 'Open' });
    }
    if (!risk.linked_policies) {
      findings.push({ finding_id: `RQA-${String(c++).padStart(3,'0')}`, risk_id: risk.risk_id, severity: 'Medium', category: 'Traceability', details: 'No linked policies assigned.', resolution_status: 'Open' });
    }
  }
  return { qa_owner: 'DB Agent Risk QA', risk_register_ref: 'Risk Assessments/risk-assessments.json', qa_notes: 'Automated QA checks on risk register completeness.', findings, updatedAt: null };
}

// ── Vendor risk section ────────────────────────────────────────────────────
function getDerivedVendors(onboarding) {
  const vendors = Array.isArray(onboarding.vendors) ? onboarding.vendors.filter(v => v && v.vendor_name) : [];
  const derived = new Set(vendors.map(v => String(v.vendor_name).toLowerCase()));

  // Auto-detect from other fields
  const cloud = String(onboarding.cloud_providers || '');
  const idp   = String(onboarding.identity_provider || '');
  const mon   = String(onboarding.monitoring || '');

  const autoVendors = [];
  if (cloud && !derived.has(cloud.toLowerCase())) {
    autoVendors.push({ vendor_name: cloud, service_category: 'Cloud Infrastructure', purpose: 'Cloud hosting and infrastructure', business_function: 'Infrastructure' });
  }
  if (idp && !derived.has(idp.toLowerCase())) {
    autoVendors.push({ vendor_name: idp, service_category: 'Identity Provider', purpose: 'Identity and access management', business_function: 'Security' });
  }
  if (mon && !derived.has(mon.toLowerCase())) {
    const parts = mon.split(/[,/&]+/).map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (!derived.has(p.toLowerCase())) {
        autoVendors.push({ vendor_name: p, service_category: 'Security Monitoring', purpose: 'SIEM and security monitoring', business_function: 'Security' });
      }
    }
  }
  return [...vendors, ...autoVendors];
}

function buildVendorRiskSection(onboarding, risks, policies) {
  const co        = onboarding.legal_entity || 'The Organization';
  const data      = onboarding.data_types   || 'company data';
  const classif   = onboarding.classification || 'regulated data';
  const riskIds   = (risks || []).filter(Boolean).map(r => r.risk_id);
  const policyIds = (policies || []).filter(Boolean).map(p => p.policy_id);

  const rawVendors = getDerivedVendors(onboarding);
  const vendors = rawVendors.map((v, i) => {
    const lh = 3, imp = 4, rl = 2, ri = 3;
    return {
      vendor_id: v.vendor_id || `VDR-${String(i + 1).padStart(3, '0')}`,
      vendor_name: v.vendor_name,
      vendor_description: `${v.vendor_name} provides ${v.purpose || v.service_category || 'services'} for ${co}.`,
      purpose: v.purpose || '',
      business_function: v.business_function || '',
      service_category: v.service_category || '',
      known_services: v.known_services || '',
      website: v.website || '',
      access_level: v.access_level || 'Moderate',
      data_accessed: v.data_types_handled || data,
      criticality: v.criticality || 'High',
      certifications: v.certifications || '',
      location: v.location || '',
      stores_processes_data: v.stores_processes_data || 'Yes',
      data_types_handled: v.data_types_handled || data,
      access_level_detail: v.access_level_detail || '',
      business_impact: v.business_impact || 'Major impact',
      has_contract: v.has_contract || 'Not sure',
      has_dpa: v.has_dpa || 'Not sure',
      vendor_certifications_confirmed: v.vendor_certifications_confirmed || 'Not sure',
      vendor_likelihood: lh, vendor_impact: imp,
      inherent_score: lh * imp, inherent_risk: `${scoreBandLabel(lh * imp)} (L${lh} x I${imp})`,
      residual_likelihood: rl, residual_impact: ri,
      residual_score: rl * ri, residual_risk: `${scoreBandLabel(rl * ri)} (L${rl} x I${ri})`,
      treatment_plan: `Treatment plan (Mitigate)\nPrimary objective: Govern ${co}'s use of ${v.vendor_name} and reduce third-party risk.\nKey actions:\n- Obtain and review ${v.vendor_name}'s latest security certifications\n- Confirm data processing agreement is in place\n- Review access levels annually\n- Include in quarterly vendor risk review\nReview requirement: Annual formal review with quarterly check-ins.`,
      linked_risks: riskIds.slice(0, 2).join(', '),
      linked_controls: '',
      notes: `${v.vendor_name} provides ${v.service_category || 'services'} to ${co}. Access to ${data} makes this vendor material to ${co}'s ${classif} obligations.`,
      assessment_questions: {
        security_posture: [`Does ${v.vendor_name} hold current SOC 2 Type II or ISO 27001 certification?`, `How does ${v.vendor_name} manage security incidents affecting ${co}'s data?`],
        data_handling: [`Where does ${v.vendor_name} store ${co}'s data, and does it align with ${co}'s regional requirements?`, `What encryption standards does ${v.vendor_name} apply to ${co}'s data at rest and in transit?`],
        access_controls: [`How does ${v.vendor_name} manage privileged access to ${co}'s environment?`, `How quickly does ${v.vendor_name} revoke access for departed ${co} staff?`],
        business_continuity: [`What is ${v.vendor_name}'s documented RTO/RPO for services used by ${co}?`],
        contractual_compliance: [`Does ${co} have a current DPA in place with ${v.vendor_name}?`],
        incident_response: [`How does ${v.vendor_name} notify ${co} of security incidents affecting ${co}'s data?`],
        ongoing_assurance: [`How frequently does ${v.vendor_name} provide updated assurance evidence to ${co}?`],
      },
    };
  });

  return {
    vendor_methodology: 'Criticality, access level, data exposure, integration depth, and policy-linked treatment planning.',
    policy_summary_ref: 'Policies and Procedures/policies.json',
    vendor_notes: `Vendor assessments generated for ${co}.`,
    vendors,
    updatedAt: null,
  };
}

// ── Vendor QA section ──────────────────────────────────────────────────────
function buildVendorQaSection(vendors) {
  const findings = [];
  let c = 1;
  for (const v of (vendors || [])) {
    if (!v) continue;
    if (!v.has_contract || v.has_contract === 'Not sure') {
      findings.push({ finding_id: `VQA-${String(c++).padStart(3,'0')}`, vendor_id: v.vendor_id, severity: 'High', category: 'Contract', details: `No confirmed contract for ${v.vendor_name}.`, resolution_status: 'Open' });
    }
    if (!v.has_dpa || v.has_dpa === 'Not sure') {
      findings.push({ finding_id: `VQA-${String(c++).padStart(3,'0')}`, vendor_id: v.vendor_id, severity: 'High', category: 'DPA', details: `No confirmed DPA for ${v.vendor_name}.`, resolution_status: 'Open' });
    }
  }
  return { qa_owner: 'DB Agent Vendor QA', vendor_register_ref: 'Vendor Assessments/vendor-assessments.json', qa_notes: 'Automated QA checks on vendor register completeness.', findings, updatedAt: null };
}

// ── Control mapping section ────────────────────────────────────────────────
// Category → SOC 2 control IDs lookup (used when SOC 2 is in scope)
const POLICY_CATEGORY_TO_SOC2 = {
  // Exact matches for categories used in POLICY_NAMES
  'Endpoint Security':        ['CC6.8','CC7.1'],
  'Access Management':        ['CC6.1','CC6.2','CC6.3'],
  'Identity & Authentication':['CC6.1','CC6.2','CC6.6'],
  'Human Resources':          ['CC1.4','CC1.5'],
  'Business Continuity':      ['A1.2','A1.3','CC9.1'],
  'Change Control':           ['CC8.1'],
  'Infrastructure':           ['CC6.6','CC6.8','CC7.1'],
  'Data Management':          ['CC6.7','C1.1','C1.2'],
  'Cryptography':             ['CC6.7'],
  'Security Operations':      ['CC7.1','CC7.2','CC7.3','CC7.4','CC7.5'],
  'Governance':               ['CC1.1','CC1.2','CC2.1','CC3.1'],
  'Physical Security':        ['CC6.4'],
  'Privacy':                  ['P1.1','P2.1','P3.1','P4.1','P5.1','P6.1','P7.1','P8.1'],
  'Vendor Risk':              ['CC9.2'],
  'Engineering':              ['CC8.1','CC7.1'],
  'Asset Management':         ['CC6.1','CC6.3'],
  'Risk Management':          ['CC3.1','CC3.2','CC3.3','CC3.4'],
  'Processing Integrity':     ['PI1.1','PI1.2','PI1.3','PI1.4','PI1.5'],
};

function resolveControlIds(policyCategory, fw, onboarding) {
  const parts = [];

  const isSoc2 = fw.toLowerCase().includes('soc');
  if (isSoc2 && onboarding) {
    const tscScope = parseTscScope(onboarding);
    const scopeControls = getSoc2ControlsForScope(tscScope).map(c => c.control_id);
    const categoryKey = Object.keys(POLICY_CATEGORY_TO_SOC2).find(k =>
      (policyCategory || '').toLowerCase().includes(k.toLowerCase())
    );
    if (categoryKey) {
      const ids = POLICY_CATEGORY_TO_SOC2[categoryKey].filter(id => scopeControls.includes(id));
      if (ids.length > 0) parts.push(`SOC 2: ${ids.join(', ')}`);
    }
  }

  const isIso = fw.toLowerCase().includes('iso');
  if (isIso) {
    const isoIds = getIso27001ControlIdsByCategory(policyCategory);
    if (isoIds.length > 0) parts.push(`ISO 27001: ${isoIds.slice(0, 5).join(', ')}`);
  }

  return parts.join(' | ');
}

function resolveFrameworkMapping(policyCategory, fw, onboarding) {
  const ids = resolveControlIds(policyCategory, fw, onboarding);
  if (!ids) return fw;
  return `${fw} — ${ids}`;
}

function buildControlMappingSection(policies, risks, vendors, frameworkLabels, onboarding) {
  const controls = [];
  let ctrlPol = 1, ctrlVdr = 1;
  const fw = (frameworkLabels || ['SOC 2 Trust Services Criteria']).join(', ');

  for (const policy of (policies || []).filter(Boolean)) {
    const fwMapping = resolveFrameworkMapping(policy.category, fw, onboarding);
    const ctrl = {
      control_id: `CTRL-POL-${String(ctrlPol++).padStart(3,'0')}`,
      control_category: policy.category || 'Policy Control',
      framework_mapping: fwMapping,
      control_title: `${policy.name} Control`,
      description: `${policy.name} policy requirements are implemented and evidenced per ${fw}.`,
      linked_policies: policy.policy_id,
      linked_risks: policy.linked_risks || '',
      linked_vendors: '',
      owner: policy.policy_owner || '',
      frequency: policy.review_cycle || 'Annual',
      evidence: `Policy document, review records, exception log, training completion evidence.`,
    };
    controls.push(ctrl);
  }

  for (const vendor of (vendors || []).filter(Boolean)) {
    const ctrl = {
      control_id: `CTRL-VDR-${String(ctrlVdr++).padStart(3,'0')}`,
      control_category: 'Vendor Risk Control',
      framework_mapping: fw,
      control_title: `${vendor.vendor_name} Vendor Oversight`,
      description: `Third-party oversight controls for ${vendor.vendor_name} — covers assurance, contract, and access reviews.`,
      linked_policies: '',
      linked_risks: vendor.linked_risks || '',
      linked_vendors: vendor.vendor_id,
      owner: '',
      frequency: 'Annual',
      evidence: `Vendor assurance evidence (SOC 2/ISO cert), DPA, contract, annual review record.`,
    };
    controls.push(ctrl);
  }

  // Fraud-specific controls — always include per framework requirements
  const fraudRisks = (risks || []).filter(r => r && String(r.category || '').toLowerCase().includes('fraud'));
  let ctrlFrd = 1;
  for (const fr of fraudRisks) {
    controls.push({
      control_id: `CTRL-FRD-${String(ctrlFrd++).padStart(3,'0')}`,
      control_category: 'Fraud Prevention',
      framework_mapping: fw,
      control_title: `Fraud Risk Control — ${fr.threat || 'Fraud'}`,
      description: `Controls to detect, prevent, and respond to fraud risk: ${fr.threat || 'fraud exposure'}. Includes segregation of duties, transaction monitoring, and escalation procedures.`,
      linked_policies: fr.linked_policies || '',
      linked_risks: fr.risk_id || '',
      linked_vendors: '',
      owner: fr.treatment_owner || '',
      frequency: 'Quarterly',
      evidence: `Fraud risk assessment record, transaction monitoring logs, segregation of duties matrix, incident reports, annual fraud awareness training completion.`,
    });
  }

  return { mapping_basis: fw, evidence_standard: 'Control evidence mapped to policy, risk, and vendor register.', controls, updatedAt: null };
}

// ── Audit QA section ───────────────────────────────────────────────────────
function buildAuditQaSection(policies, risks, vendors, controls, onboarding) {
  const findings = [];
  let c = 1;

  // Check unpublished policies
  for (const p of (policies || []).filter(Boolean)) {
    if (!toggleEnabled(p.published)) {
      findings.push({ finding_id: `AQA-${String(c++).padStart(3,'0')}`, entity_id: p.policy_id, entity_type: 'Policy', severity: 'High', category: 'Policy Approval', details: `${p.name} has not been published and signed off.`, resolution_status: 'Open' });
    }
  }
  // Check unlinked risks
  for (const r of (risks || []).filter(Boolean)) {
    if (!r.linked_policies) {
      findings.push({ finding_id: `AQA-${String(c++).padStart(3,'0')}`, entity_id: r.risk_id, entity_type: 'Risk', severity: 'Medium', category: 'Traceability', details: `${r.threat} has no linked policies.`, resolution_status: 'Open' });
    }
  }
  // Check vendors without DPA
  for (const v of (vendors || []).filter(Boolean)) {
    if (!v.has_dpa || v.has_dpa === 'Not sure') {
      findings.push({ finding_id: `AQA-${String(c++).padStart(3,'0')}`, entity_id: v.vendor_id, entity_type: 'Vendor', severity: 'High', category: 'Contractual', details: `${v.vendor_name} — DPA status unconfirmed.`, resolution_status: 'Open' });
    }
  }
  // Check RTO/RPO targets are documented
  if (onboarding && !String(onboarding.rto_rpo_targets || '').trim()) {
    findings.push({ finding_id: `AQA-${String(c++).padStart(3,'0')}`, entity_id: 'ONBOARDING-RTORPO', entity_type: 'Onboarding', severity: 'Medium', category: 'Business Continuity', details: 'RTO and RPO targets have not been documented. Applicable frameworks require defined and validated recovery time and recovery point objectives.', resolution_status: 'Open' });
  }
  // Check SOC 2 TSC scope is defined when SOC 2 is selected
  if (onboarding) {
    const fwRaw = String(onboarding.framework_selection_v2 || onboarding.framework_selection || '').toLowerCase();
    const isSoc2Selected = fwRaw.includes('soc');
    if (isSoc2Selected) {
      const tscScope = parseTscScope(onboarding);
      if (!tscScope || tscScope.length === 0) {
        findings.push({ finding_id: `AQA-${String(c++).padStart(3,'0')}`, entity_id: 'ONBOARDING-TSC', entity_type: 'Onboarding', severity: 'High', category: 'SOC 2 Scope', details: 'SOC 2 is selected but no Trust Services Categories (TSC) have been defined. Security is mandatory; return to onboarding to confirm your TSC scope.', resolution_status: 'Open' });
      }
    }
  }

  // Check fraud risk is documented (framework requirement)
  const hasFraudRisk = (risks || []).some(r => r && String(r.category || '').toLowerCase().includes('fraud'));
  if (!hasFraudRisk) {
    findings.push({ finding_id: `AQA-${String(c++).padStart(3,'0')}`, entity_id: 'RISK-FRAUD', entity_type: 'Risk', severity: 'High', category: 'Fraud Assessment', details: 'No fraud risk has been documented in the risk register. Applicable frameworks require at least one fraud risk to be assessed and recorded.', resolution_status: 'Open' });
  }
  // Check fraud risk has a mapped control
  const hasFraudControl = (controls || []).some(ctrl => String(ctrl.control_category || '').toLowerCase().includes('fraud'));
  if (hasFraudRisk && !hasFraudControl) {
    findings.push({ finding_id: `AQA-${String(c++).padStart(3,'0')}`, entity_id: 'CTRL-FRAUD', entity_type: 'Control', severity: 'Medium', category: 'Fraud Assessment', details: 'Fraud risk is documented but no fraud prevention control has been mapped. A fraud-specific control should be added to the control register.', resolution_status: 'Open' });
  }

  return {
    audit_owner: 'DB Agent Audit QA',
    audit_notes: 'Automated audit readiness checks across policies, risks, vendors, and controls.',
    findings,
    updatedAt: null,
  };
}

// ── Policy QA section ──────────────────────────────────────────────────────
function buildPolicyQaSection(policies, onboarding) {
  const findings = [];
  let c = 1;
  const co = onboarding.legal_entity || '';
  for (const policy of (policies || []).filter(Boolean)) {
    if (!policy.policy_owner) findings.push({ finding_id: `PQA-${String(c++).padStart(3,'0')}`, policy_id: policy.policy_id, severity: 'High', category: 'Ownership', details: 'Policy owner is not assigned.', resolution_status: 'Open' });
    if (!policy.sign_off_by)  findings.push({ finding_id: `PQA-${String(c++).padStart(3,'0')}`, policy_id: policy.policy_id, severity: 'Medium', category: 'Approval', details: 'Sign-off user is not assigned.', resolution_status: 'Open' });
    if (!policy.executive_summary) findings.push({ finding_id: `PQA-${String(c++).padStart(3,'0')}`, policy_id: policy.policy_id, severity: 'Medium', category: 'Executive Summary', details: 'Executive summary is missing.', resolution_status: 'Open' });
    if (co && !((policy.executive_summary || '') + '\n' + (policy.body || '')).includes(co)) {
      findings.push({ finding_id: `PQA-${String(c++).padStart(3,'0')}`, policy_id: policy.policy_id, severity: 'Medium', category: 'Specificity', details: `Policy does not embed the client name "${co}".`, resolution_status: 'Open' });
    }
    if (!/(must|shall)/i.test(policy.body || '')) {
      findings.push({ finding_id: `PQA-${String(c++).padStart(3,'0')}`, policy_id: policy.policy_id, severity: 'High', category: 'Enforceability', details: 'Policy lacks enforceable language (must/shall).', resolution_status: 'Open' });
    }
  }
  return { qa_owner: 'DB Agent Policy QA', cleaned_policies_ref: 'Policies and Procedures/policies.json', qa_notes: 'Automated QA checks on policy completeness.', findings, updatedAt: null };
}

// ── Policy summary section ─────────────────────────────────────────────────
function buildPolicySummarySection(policies, qaFindings) {
  const summaries = (policies || []).filter(Boolean).map(p => {
    const pFindings = (qaFindings || []).filter(f => f.policy_id === p.policy_id);
    const keyControls = (p.body || '').split('\n').filter(l => l.trim().startsWith('- ')).slice(0, 3).map(l => l.trim().replace(/^-\s*/, ''));
    return {
      summary_id: `SUM-${p.policy_id}`,
      policy_id: p.policy_id,
      key_controls: keyControls.join(' | ') || p.linked_controls || '',
      covered_domains: p.framework_mapping || '',
      gaps: pFindings.length > 0 ? pFindings.map(f => f.details).join(' | ') : 'No QA gaps identified.',
    };
  });
  return { summary_owner: 'DB Agent', summary_notes: 'Policy summaries generated from policy set and QA results.', summaries, updatedAt: null };
}

// ── Output section ─────────────────────────────────────────────────────────
function buildOutputSection(policies, risks, vendors, controls, auditFindings) {
  const pIds = (policies||[]).filter(Boolean).map(p=>p.policy_id);
  const rIds = (risks||[]).filter(Boolean).map(r=>r.risk_id);
  const vIds = (vendors||[]).filter(Boolean).map(v=>v.vendor_id);
  const cIds = (controls||[]).filter(Boolean).map(c=>c.control_id);
  const fCount = (auditFindings||[]).length;
  return {
    validation_status: fCount > 0 ? `Action required (${fCount} audit findings)` : 'Ready for review',
    output_notes: 'Dashboard-ready output generated from DB Agent lifecycle.',
    outputs: [
      { output_id:'OUT-001', output_type:'Policy pack',            status:'Generated', linked_policies:pIds.join(', '), linked_risks:rIds.slice(0,3).join(', '), linked_vendors:'',         linked_controls:cIds.slice(0,3).join(', '), notes:'Policies available in platform.', file_artifacts:'' },
      { output_id:'OUT-002', output_type:'Risk register',          status:'Generated', linked_policies:pIds.slice(0,3).join(', '), linked_risks:rIds.join(', '), linked_vendors:'',         linked_controls:cIds.slice(0,4).join(', '), notes:'Risk register from onboarding-derived risks.', file_artifacts:'' },
      { output_id:'OUT-003', output_type:'Vendor register',        status:'Generated', linked_policies:pIds.slice(0,3).join(', '), linked_risks:rIds.slice(0,2).join(', '), linked_vendors:vIds.join(', '), linked_controls:cIds.filter(id=>id.startsWith('CTRL-VDR')).join(', '), notes:'Vendor assessments from inferred providers.', file_artifacts:'' },
      { output_id:'OUT-004', output_type:'Control library',        status:'Generated', linked_policies:pIds.join(', '), linked_risks:rIds.join(', '), linked_vendors:vIds.join(', '), linked_controls:cIds.join(', '), notes:'Unified control library.', file_artifacts:'' },
      { output_id:'OUT-005', output_type:'Audit readiness report', status: fCount > 0 ? 'Action required' : 'Ready', linked_policies:pIds.join(', '), linked_risks:rIds.join(', '), linked_vendors:vIds.join(', '), linked_controls:cIds.join(', '), notes: fCount > 0 ? `${fCount} audit QA findings require remediation.` : 'No audit QA findings.', file_artifacts:'' },
    ],
    updatedAt: null,
  };
}

// ── Vendor catalog ─────────────────────────────────────────────────────────
function updateVendorCatalog(vendorRecords) {
  let catalog = readJson(vendorCatalogPath, { version: '1.0', vendors: [] });
  const byName = {};
  for (const v of (catalog.vendors || [])) { if (v && v.vendor_name) byName[v.vendor_name.toLowerCase()] = v; }
  for (const v of (vendorRecords || []).filter(v => v && v.vendor_name)) {
    const key = v.vendor_name.toLowerCase();
    if (byName[key]) { byName[key].usage_count = (byName[key].usage_count || 0) + 1; byName[key].last_used_at = new Date().toISOString(); }
    else { byName[key] = { vendor_name: v.vendor_name, service_category: v.service_category || '', usage_count: 1, last_used_at: new Date().toISOString() }; }
  }
  catalog.vendors = Object.values(byName).sort((a,b) => (b.usage_count||0) - (a.usage_count||0));
  saveJson(vendorCatalogPath, catalog);
}

// ═══════════════════════════════════════════════════════════════════════════
// AI AGENTS
// ═══════════════════════════════════════════════════════════════════════════
async function invokeClaudeApi(systemPrompt, userPrompt, maxTokens = 8000) {
  const ai = getAnthropic();
  if (!ai) return null;
  try {
    const msg = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return msg.content[0]?.text || null;
  } catch (e) {
    console.error('[Claude API] Error:', e.message);
    return null;
  }
}

function extractJsonArray(text) {
  if (!text) return null;
  const s = text.indexOf('['), e = text.lastIndexOf(']');
  if (s >= 0 && e > s) { try { return JSON.parse(text.substring(s, e + 1)); } catch {} }
  const s2 = text.indexOf('{'), e2 = text.lastIndexOf('}');
  if (s2 >= 0 && e2 > s2) { try { const r = JSON.parse(text.substring(s2, e2 + 1)); return Array.isArray(r) ? r : [r]; } catch {} }
  return null;
}

function extractJsonObject(text) {
  if (!text) return null;
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s >= 0 && e > s) { try { return JSON.parse(text.substring(s, e + 1)); } catch {} }
  return null;
}

async function buildCompanyBrief(onboarding) {
  const base = {
    company: onboarding.legal_entity || '',
    industry: onboarding.industry || '',
    tech_stack: onboarding.tech_stack || onboarding.cloud_providers || '',
    data_handled: onboarding.data_types || '',
    frameworks: onboarding.framework_selection || '',
    headcount: onboarding.employee_headcount || '',
    scope: onboarding.scope || '',
    tone: 'professional',
    key_risks: [],
  };
  const ai = getAnthropic();
  if (!ai) return base;
  const system = 'You are a senior GRC consultant. Read client onboarding data and produce a structured company brief used by downstream AI agents. Be precise and factual. Return ONLY valid JSON — no markdown, no explanation.';
  const user = `Produce a company brief from this onboarding data. Include: company name, industry, full tech stack, data types handled, compliance frameworks, headcount band, scope, top 3-5 implied key risks (always include a fraud risk), RTO/RPO targets if provided, and recommended documentation tone. Onboarding: ${JSON.stringify(onboarding)}`;
  const raw = await invokeClaudeApi(system, user, 2000);
  const result = extractJsonObject(raw);
  return result || base;
}

function ensureFraudRisk(risks, onboarding) {
  const hasFraud = (risks || []).some(r => r && String(r.category || '').toLowerCase().includes('fraud'));
  if (hasFraud) return risks;
  const co   = onboarding.legal_entity || 'The Organization';
  const data = onboarding.data_types   || 'company and client data';
  const fw   = Array.isArray(onboarding.framework_selection_v2)
    ? onboarding.framework_selection_v2.join(', ')
    : (onboarding.framework_selection_v2 || onboarding.framework_selection || 'applicable framework');
  console.log(`[RiskDiscovery] No fraud risk found — injecting mandatory fraud risk for ${co}`);
  return [...(risks || []), {
    title: `Fraud risk — misappropriation, invoice fraud, or identity fraud affecting ${co}`,
    category: 'Fraud',
    threat_source: 'Internal personnel, compromised accounts, or external fraudsters targeting ${co} operations',
    why_this_company: `${co} handles ${data} and conducts financial and operational activity that could be exploited through fraudulent transactions, social engineering, or insider misuse. ${fw} requires fraud risk to be assessed and documented.`,
    likelihood: 2,
    impact: 4,
    likelihood_justification: `Controls and oversight reduce likelihood, but fraud risk exists in any organisation handling sensitive data and financial transactions.`,
    impact_justification: `Fraud incidents can result in direct financial loss, regulatory sanction, reputational damage, and loss of client trust for ${co}.`,
  }];
}

async function runRiskDiscoveryAgent(onboarding, brief) {
  const co       = onboarding.legal_entity || brief.company || 'The Organization';
  const cloud    = onboarding.cloud_providers   || '';
  const idp      = onboarding.identity_provider || '';
  const data     = onboarding.data_types        || '';
  const classif  = onboarding.classification    || '';
  const monitor  = onboarding.monitoring        || '';
  const enc      = onboarding.encryption        || '';
  const backup   = onboarding.backup            || '';
  const devices  = onboarding.devices_used      || '';
  const opSys    = onboarding.operating_systems  || '';
  const workType = onboarding.work_type          || '';
  const fwV2     = Array.isArray(onboarding.framework_selection_v2)
    ? onboarding.framework_selection_v2.join(', ')
    : (onboarding.framework_selection_v2 || onboarding.framework_selection || '');
  const tscScope    = parseTscScope(onboarding);
  const pubAccess   = onboarding.publicly_accessible        || '';
  const irProcess   = onboarding.incident_response_process  || '';
  const critAccess  = onboarding.critical_access_many       || '';
  const prodChanges = onboarding.prod_changes_reviewed       || '';
  const secOwner    = onboarding.security_owner             || '';
  const vendorList  = (Array.isArray(onboarding.vendors) ? onboarding.vendors : [])
    .filter(v => v && v.vendor_name)
    .map(v => `${v.vendor_name} (data: ${v.data_types_handled||'unspecified'}; access: ${v.access_level_detail||'unspecified'})`)
    .join(', ') || 'none';

  const isSoc2 = fwV2.toLowerCase().includes('soc');
  const isIso  = fwV2.toLowerCase().includes('iso');
  const tscScopeControls = isSoc2 ? getSoc2ControlsForScope(tscScope) : [];
  const tscScopeText = isSoc2
    ? `SOC 2 TSC in scope: ${tscScope.join(', ')} (${tscScopeControls.length} controls). Key control areas: ${[...new Set(tscScopeControls.map(c => c.category))].slice(0,8).join('; ')}.`
    : '';
  const isoControlCount = isIso ? (iso27001Controls.controls || []).length : 0;
  const isoText = isIso
    ? `ISO 27001:2022 in scope: all ${isoControlCount} Annex A controls (A.5–A.8). Themes: Organizational (37), People (8), Physical (14), Technological (34).`
    : '';

  if (!getAnthropic()) return getDerivedTopRisks(onboarding);

  const system = `You are a senior GRC risk analyst. Analyse this company's onboarding profile and identify their real, specific security and compliance risks. Return ONLY a valid JSON array. No markdown, no explanation.`;

  const user = `Analyse ${co} and generate 9-12 specific, company-tailored risks.

COMPANY PROFILE:
Company: ${co} | Cloud: ${cloud} | Identity: ${idp} | MFA: ${onboarding.mfa_enabled||''} | Access model: ${onboarding.access_model||''}
Data types: ${data} | Classification: ${classif} | Encryption: ${enc} | Backup: ${backup}
RTO/RPO targets: ${onboarding.rto_rpo_targets||'not specified'}
Monitoring: ${monitor} | Devices: ${devices} | OS: ${opSys} | Work model: ${workType}
Publicly accessible: ${pubAccess} | IR process: ${irProcess} | Critical access (many people): ${critAccess}
Prod changes peer-reviewed: ${prodChanges} | Security owner: ${secOwner}
Compliance framework: ${fwV2}${tscScopeText ? `\n${tscScopeText}` : ''}${isoText ? `\n${isoText}` : ''}
Vendors: ${vendorList}

For each risk return a JSON object with these exact fields:
{
  "title": "short specific risk title referencing actual ${co} context",
  "category": "one of: Data Protection | Access Control | Vendor Risk | Infrastructure | Incident Response | Business Continuity | Change Management | Compliance | Fraud",
  "threat_source": "specific threat actor or cause relevant to ${co}",
  "why_this_company": "1-2 sentences explaining why THIS company specifically faces this risk — reference actual tools, data types, vendors",
  "likelihood": number 1-5,
  "impact": number 1-5,
  "likelihood_justification": "specific justification referencing ${co}'s environment",
  "impact_justification": "specific justification referencing ${co}'s data and operations"
}

Rules:
- Every risk must reference ${co}'s actual environment — name tools, data types, vendors
- Do NOT use generic titles like "Data Breach" — be specific e.g. "Client PII exposure via AWS S3 misconfiguration"
- Cover a range of categories — do not duplicate categories
- Calibrate likelihood/impact based on actual posture (e.g. if IR process exists, lower likelihood of undetected breach)
- MANDATORY: At least one risk must have category "Fraud" — this is a framework requirement. The fraud risk must be specific to ${co}'s business model, data types, and financial/operational exposure (e.g. payment fraud, invoice fraud, insider misappropriation, identity fraud against clients)`;

  const raw = await invokeClaudeApi(system, user, 6000);
  const result = extractJsonArray(raw);
  if (!result || result.length === 0) {
    console.log('[RiskDiscovery] AI returned no results, using derived risks');
    return ensureFraudRisk(getDerivedTopRisks(onboarding), onboarding);
  }
  const withFraud = ensureFraudRisk(result, onboarding);
  console.log(`[RiskDiscovery] Generated ${withFraud.length} company-specific risks for ${co} (fraud risk guaranteed)`);
  return withFraud;
}

async function runPolicyWriterAgent(policies, brief, onboarding, onBatchComplete) {
  if (!process.env.ANTHROPIC_API_KEY) return policies;

  const co       = onboarding.legal_entity || brief.company || 'The Organization';
  const industry = onboarding.industry || '';
  const cloud    = onboarding.cloud_providers || '';
  const idp      = onboarding.identity_provider || '';
  const mfa      = onboarding.mfa_enabled || '';
  const access   = onboarding.access_model || '';
  const data     = onboarding.data_types || '';
  const classif  = onboarding.classification || '';
  const enc      = onboarding.encryption || '';
  const backup   = onboarding.backup || '';
  const monitor  = onboarding.monitoring || '';
  const headcount = onboarding.employee_headcount || '';
  const fw       = Array.isArray(brief.frameworks) ? brief.frameworks.join(', ') : (brief.frameworks || '');
  const risks    = Array.isArray(brief.key_risks)  ? brief.key_risks.join(', ')  : (brief.key_risks  || '');
  const tech     = Array.isArray(brief.tech_stack) ? brief.tech_stack.join(', ') : (brief.tech_stack || cloud);

  const pubAccess     = onboarding.publicly_accessible || '';
  const prodSep       = onboarding.prod_test_separation || '';
  const irProcess     = onboarding.incident_response_process || '';
  const logsReviewed  = onboarding.security_logs_reviewed || '';
  const backupTested  = onboarding.backups_tested || '';
  const critAccess    = onboarding.critical_access_many || '';
  const prodChanges   = onboarding.prod_changes_reviewed || '';
  const complianceReq = onboarding.compliance_proof_requested || '';
  const secOwner      = onboarding.security_owner || '';
  const dataLeakImpact= onboarding.data_leak_impact || '';
  const devices       = onboarding.devices_used || '';
  const opSystems     = onboarding.operating_systems || '';
  const storageRegion = onboarding.storage_regions || '';
  const workType      = onboarding.work_type || '';
  const companyType   = onboarding.company_type || '';
  const fwV2          = Array.isArray(onboarding.framework_selection_v2)
    ? onboarding.framework_selection_v2.join(', ')
    : (onboarding.framework_selection_v2 || fw || '');
  const tscScope      = parseTscScope(onboarding);
  const isSoc2Fw      = fwV2.toLowerCase().includes('soc');
  const isIsoFw       = fwV2.toLowerCase().includes('iso');
  const tscScopeControls = isSoc2Fw ? getSoc2ControlsForScope(tscScope) : [];
  const tscScopeText  = isSoc2Fw
    ? `SOC 2 TSC in scope: ${tscScope.join(', ')} — ${tscScopeControls.length} controls. Categories: ${[...new Set(tscScopeControls.map(c => c.category))].join('; ')}.`
    : '';
  const isoFwText     = isIsoFw
    ? `ISO 27001:2022 in scope: all ${(iso27001Controls.controls || []).length} Annex A controls (A.5 Organizational, A.6 People, A.7 Physical, A.8 Technological). Policies must reference applicable Annex A control IDs where relevant.`
    : '';

  const vendorList = (Array.isArray(onboarding.vendors) ? onboarding.vendors : [])
    .filter(v => v && v.vendor_name)
    .map(v => `${v.vendor_name}${v.service_category ? ` (${v.service_category})` : ''}(data: ${v.data_types_handled||'unspecified'}; access: ${v.access_level_detail||'unspecified'})`)
    .join('; ') || 'none recorded';

  const topRisksList = getDerivedTopRisks(onboarding)
    .map(r => `${r.title} (${r.category}) — threat: ${r.threat_source}`)
    .join('\n  ');

  const system = `You are ${co}'s senior GRC consultant authoring official, audit-credible compliance policies.

COMPANY CONTEXT — embed these specifics in every policy:
Company: ${co} | Industry: ${industry} | Headcount: ${headcount} | Company type: ${companyType}
Work model: ${workType} | Cloud / hosting: ${cloud} | Identity provider: ${idp} | MFA: ${mfa} | Access model: ${access}
Devices used: ${devices} | Operating systems: ${opSystems} | Storage regions: ${storageRegion}
Data types: ${data} | Classification: ${classif} | Encryption: ${enc}
Backup: ${backup} | Monitoring / SIEM: ${monitor}
Compliance frameworks: ${fwV2} | Key risks: ${risks}
${tscScopeText ? `SOC 2 TSC scope: ${tscScopeText}` : ''}${isoFwText ? `\n${isoFwText}` : ''}
SECURITY POSTURE (use to calibrate control requirements):
Publicly accessible systems: ${pubAccess} | Prod/test separation: ${prodSep}
IR process in place: ${irProcess} | Security logs reviewed regularly: ${logsReviewed}
Backups tested: ${backupTested} | Many people with critical/admin access: ${critAccess}
Prod changes peer-reviewed: ${prodChanges} | Compliance proof requested by customers: ${complianceReq}
Security/compliance owner: ${secOwner} | Data leak business impact: ${dataLeakImpact}

TOP RISKS THIS POLICY PACK MUST ADDRESS (reference relevant ones in each policy):
  ${topRisksList}

VENDOR / TECHNOLOGY STACK (name these in relevant policy sections):
${vendorList}

MANDATORY WRITING RULES — all rules apply to every policy:
1. COMPANY NAME: Use "${co}" in the first sentence of every section. Never write "the organization", "the company", or "the entity."
2. TOOL SPECIFICITY: Name actual tools from the company context — not "a cloud provider" but "${cloud}"; not "an identity system" but "${idp}"; not "monitoring tools" but "${monitor}."
3. DATA SPECIFICITY: Reference ${data} and ${classif} explicitly. Not "sensitive data" but the actual data types.
4. SECURITY POSTURE: If ${pubAccess} is Yes, include explicit internet-facing controls. If ${irProcess} is No or empty, include building IR capability as a requirement.
4a. DEVICE & OS SPECIFICITY: Where relevant, reference the actual devices (${devices}) and operating systems (${opSystems}) used. Endpoint and workstation policies must name these.
4b. WORK MODEL: The company operates ${workType} — reflect this in policies covering access, remote work, and device management.
4c. DATA RESIDENCY: Storage region is ${storageRegion} — reference this in data handling and privacy policies.
4d. FRAMEWORK SPECIFICITY: The applicable compliance framework is ${fwV2} — use the full name, not a shorthand.
5. HEADINGS: Subsection headings must be on their own line followed by a blank line. Never inline a heading with content.
6. LISTS: Three or more obligations become a numbered list.
7. AUDITABLE CONTROLS: Every control statement must name who owns it, what they must do, and how often.
8. EXECUTIVE SUMMARY: Must state specifically why this policy matters for ${co} — reference the industry, data types, and at least one named tool.
9. UNIQUENESS: Every policy MUST open with a unique, subject-specific sentence that states what the policy governs and the risk it addresses. NEVER use the formula "[Company] establishes the standards for [X] in support of [business description]." That formula is banned.
10. NO BUSINESS MODEL COPY-PASTE: Do NOT copy the company's business model description into policy text.
11. PRESERVE EXACTLY: policy_id, name, category, owner, sign_off_by, review_cycle, version, effective_date, linked_risks, linked_controls, treatment_action, treatment_owner, treatment_due, all metadata fields. Only rewrite body and executive_summary.
12. OUTPUT: Return ONLY a valid JSON array — same structure as input. No markdown, no commentary.
13. NO HALLUCINATION: NEVER invent tool names not listed in the company context above.
14. NO INVENTED VENDORS: Only reference vendors explicitly listed in the VENDOR / TECHNOLOGY STACK section.
15. NO FILLER: Every sentence must be grounded in ${co}'s actual context.`;

  const written = [];
  const batchSize = 3;
  for (let i = 0; i < policies.length; i += batchSize) {
    const batch = policies.slice(i, i + batchSize);
    const user = `Rewrite the body and executive_summary of each policy to be fully specific to ${co}. CRITICAL: Do NOT use the formula "[Company] establishes the standards for [X] in support of [business description]" — this is banned. Each policy must open with a unique, subject-specific sentence. Do NOT copy the business model description into policy text. Use ONLY the tools, vendors, and data types listed. Reference ${cloud}, ${idp}, ${data}, ${monitor}, and relevant vendors where applicable. Every policy must read as written specifically for ${co}'s real ${industry} environment. Return complete policy array as JSON. Input: ${JSON.stringify(batch)}`;
    const batchNum = Math.floor(i/batchSize)+1;
    const totalBatches = Math.ceil(policies.length/batchSize);
    console.log(`[PolicyWriter] Batch ${batchNum}/${totalBatches}`);
    if (onBatchComplete) onBatchComplete(batchNum, totalBatches);
    const raw = await invokeClaudeApi(system, user, 16000);
    const result = extractJsonArray(raw);
    if (result && result.length > 0) { written.push(...result); }
    else { written.push(...batch); }
    if (onBatchComplete) onBatchComplete(batchNum, totalBatches, true);
  }
  return written.length > 0 ? written : policies;
}

function runPolicyCriticAgent(policies, brief, onboarding) {
  // Deterministic — no API call needed
  const co    = onboarding.legal_entity || brief.company || '';
  const cloud = (onboarding.cloud_providers || '').split(',')[0].trim();
  const idp   = (onboarding.identity_provider || '').split(',')[0].trim();
  return policies.map(policy => {
    const full = `${policy.executive_summary || ''} ${policy.body || ''}`;
    let score = 100;
    const flags = [];
    const genericCount = (full.match(/\b(the organization|the company|the entity|the firm)\b/gi) || []).length;
    if (genericCount > 0) { score -= Math.min(20, genericCount * 5); flags.push(`Uses generic language ${genericCount} times`); }
    if (co && !(policy.executive_summary || '').includes(co)) { score -= 10; flags.push(`Executive summary missing "${co}"`); }
    if (cloud && !(policy.body || '').toLowerCase().includes(cloud.toLowerCase())) { score -= 5; flags.push(`Missing cloud reference "${cloud}"`); }
    if (idp && !(policy.body || '').toLowerCase().includes(idp.toLowerCase())) { score -= 5; flags.push(`Missing IdP reference "${idp}"`); }
    const weakLang = (full.match(/\b(should consider|may implement|could adopt|might want to)\b/gi) || []).length;
    if (weakLang > 0) { score -= Math.min(15, weakLang * 3); flags.push(`Weak language: ${weakLang} instances`); }
    return { policy_id: policy.policy_id, score: Math.max(0, score), flags };
  });
}

async function runPolicyRewriterAgent(policies, criticResults, brief) {
  if (!process.env.ANTHROPIC_API_KEY) return policies;
  const co = brief.company || '';
  const failed = criticResults.filter(r => r.score < 80);
  if (failed.length === 0) return policies;

  const system = `You are fixing specific flagged issues in ${co} compliance policies. Fix ONLY the flagged issues — preserve everything else. Return ONLY a valid JSON object with the corrected policy.`;
  const fixed = {};
  for (const cr of failed) {
    const policy = policies.find(p => p.policy_id === cr.policy_id);
    if (!policy) continue;
    const user = `Fix ONLY these issues: ${cr.flags.join('; ')}. Return the corrected policy as JSON. Policy: ${JSON.stringify(policy)}`;
    const raw = await invokeClaudeApi(system, user, 4000);
    const result = extractJsonObject(raw);
    fixed[cr.policy_id] = result || policy;
  }
  return policies.map(p => fixed[p.policy_id] || p);
}

async function runRiskAnalystAgent(risks, policies, brief, onboarding) {
  if (!process.env.ANTHROPIC_API_KEY) return risks;

  const co       = onboarding.legal_entity || brief.company || 'The Organization';
  const industry = onboarding.industry || '';
  const headcount= onboarding.employee_headcount || '';
  const workType = onboarding.work_type || '';
  const cloud    = onboarding.cloud_providers || '';
  const regions  = onboarding.storage_regions || '';
  const idp      = onboarding.identity_provider || '';
  const mfa      = onboarding.mfa_enabled || '';
  const access   = onboarding.access_model || '';
  const data     = onboarding.data_types || '';
  const classif  = onboarding.classification || '';
  const enc      = onboarding.encryption || '';
  const backup   = onboarding.backup || '';
  const monitor  = onboarding.monitoring || '';
  const biz      = String(onboarding.business_model || '').substring(0, 300);

  const vendorIntel = (Array.isArray(onboarding.vendors) ? onboarding.vendors : [])
    .filter(v => v && v.vendor_name)
    .map(v => `${v.vendor_name}${v.service_category ? ` [${v.service_category}]` : ''}: data=${v.data_types_handled||'unspecified'} | access=${v.access_level_detail||'unspecified'}`)
    .join('\n') || 'No vendors recorded.';

  const policyIndex = policies.filter(Boolean).map(p =>
    `${p.policy_id} (${p.name}): ${String(p.body||'').substring(0,300)}`
  ).join('\n');

  const system = `You are a senior GRC consultant producing a production-ready, audit-credible risk register for ${co}.

COMPANY CONTEXT:
Company: ${co} | Industry: ${industry} | Headcount: ${headcount} | Work model: ${workType}
Cloud: ${cloud} | Storage regions: ${regions} | IdP: ${idp} | MFA: ${mfa} | Access: ${access}
Data: ${data} | Classification: ${classif} | Encryption: ${enc} | Backup: ${backup} | SIEM: ${monitor}
Business: ${biz}

VENDOR INTELLIGENCE:
${vendorIntel}

AVAILABLE POLICIES:
${policyIndex}

REWRITE RULES:
1. WHY_THIS_COMPANY: 2-3 sentences naming ${co} explicitly. Reference actual cloud, IdP, data types.
2. VULNERABILITY: Name the specific technical gap at ${co}.
3. EXISTING_CONTROLS: List actual policy IDs with one-sentence descriptions.
4. CONTROL_GAPS: Operationally precise — name specific gaps tied to ${co}'s environment.
5. TREATMENT_PLAN: Preserve exactly as-is.
6. PRESERVE EXACTLY: All numeric scores, IDs, dates, linked_policies, linked_controls.
7. OUTPUT: Return ONLY a valid JSON array. No markdown.`;

  const user = `Rewrite every descriptive text field in these ${co} risk records. Risks: ${JSON.stringify(risks)}`;
  const raw = await invokeClaudeApi(system, user, 12000);
  const result = extractJsonArray(raw);
  return (result && result.length > 0) ? result : risks;
}

async function runVendorAnalystAgent(vendors, policies, risks, brief, onboarding) {
  if (!process.env.ANTHROPIC_API_KEY) return vendors;

  const co       = onboarding.legal_entity || brief.company || 'The Organization';
  const industry = onboarding.industry || '';
  const headcount= onboarding.employee_headcount || '';
  const cloud    = onboarding.cloud_providers || '';
  const regions  = onboarding.storage_regions || '';
  const idp      = onboarding.identity_provider || '';
  const mfa      = onboarding.mfa_enabled || '';
  const data     = onboarding.data_types || '';
  const classif  = onboarding.classification || '';
  const enc      = onboarding.encryption || '';
  const backup   = onboarding.backup || '';
  const monitor  = onboarding.monitoring || '';
  const framework= onboarding.framework_selection || '';
  const biz      = String(onboarding.business_model || '').substring(0, 300);
  const secOwner = onboarding.security_owner || '';

  const policyIndex = policies.filter(Boolean).map(p =>
    `${p.policy_id} (${p.name}): ${String(p.body||'').substring(0,200)}`
  ).join('\n');
  const riskIndex = risks.filter(Boolean).map(r =>
    `${r.risk_id} | ${r.threat} | gaps: ${String(r.control_gaps||'').substring(0,160)}`
  ).join('\n');

  const system = `You are a senior GRC consultant writing production-ready third-party vendor risk assessments for ${co}, a ${headcount}-person ${industry} business.

=== COMPANY PROFILE ===
Legal entity: ${co} | Industry: ${industry} | Headcount: ${headcount}
Cloud: ${cloud} | Regions: ${regions} | IdP: ${idp} | MFA: ${mfa}
Data: ${data} | Classification: ${classif} | Encryption: ${enc}
Backup: ${backup} | RTO/RPO: ${onboarding.rto_rpo_targets||'not specified'} | SIEM: ${monitor} | Framework: ${framework}
Security owner: ${secOwner}
Business: ${biz}

=== POLICY REGISTER ===
${policyIndex}

=== RISK REGISTER ===
${riskIndex}

=== MANDATORY OUTPUT RULES ===
A. notes: 2-3 sentences naming ${co} and the vendor. Describe the vendor's exact role in ${co}'s live environment.
B. treatment_plan: Format: "Treatment plan (Mitigate)\nPrimary objective: [one sentence]\nKey actions:\n- [action]\n...\nReview requirement: [cadence]". Every action must name ${co} or a specific tool.
C. assessment_questions: 4-6 audit-ready questions specific to this vendor's category and ${co}'s risk profile.
D. linked_risks: Assign risk IDs that this vendor's failure directly triggers.
E. PRESERVE EXACTLY: vendor_id, vendor_name, service_category, all numeric scores, inherent_risk, residual_risk.
F. UNIQUENESS: No two vendors may share the same sentences or paragraph structure.
G. OUTPUT: Return ONLY a valid JSON array. Start with [ and end with ].`;

  const written = [];
  const batchSize = 3;
  for (let i = 0; i < vendors.length; i += batchSize) {
    const batch = vendors.slice(i, i + batchSize);
    const user = `Rewrite every descriptive field for these ${co} vendor records. Apply company profile, treatment rules, and output rules above. Vendors: ${JSON.stringify(batch)}`;
    console.log(`[VendorAgent] Batch ${Math.floor(i/batchSize)+1}/${Math.ceil(vendors.length/batchSize)}`);
    const raw = await invokeClaudeApi(system, user, 14000);
    const result = extractJsonArray(raw);
    if (result && result.length > 0) { written.push(...result); }
    else { written.push(...batch); }
  }
  return written.length > 0 ? written : vendors;
}

async function runTreatmentPlanAgent(risks, onboarding, policies, vendors) {
  if (!process.env.ANTHROPIC_API_KEY) return risks;

  const co      = onboarding.legal_entity || 'The Organization';
  const cloud   = onboarding.cloud_providers   || 'cloud infrastructure';
  const idp     = onboarding.identity_provider || 'the identity provider';
  const data    = onboarding.data_types        || 'company data';
  const classif = onboarding.classification    || 'regulated data';
  const backup  = onboarding.backup            || 'backup procedures';
  const monitor = onboarding.monitoring        || 'monitoring tooling';

  const system = `You are a senior GRC consultant writing unique, specific treatment plans for ${co}'s risk register. Each treatment plan must be 5-7 actionable steps that reference ${co}'s actual environment (${cloud}, ${idp}, ${monitor}). Format: "Treatment plan (Mitigate)\nPrimary objective: [specific to ${co}]\nKey actions:\n- [action 1]\n- [action 2]\n...\nReview requirement: [specific cadence]". Return ONLY a valid JSON array of risk objects with treatment_plan field updated. Preserve all other fields exactly.`;
  const user = `Write unique treatment plans for these ${co} risks. Reference: cloud=${cloud}, idp=${idp}, data=${data}, classif=${classif}, backup=${backup}, monitor=${monitor}. Risks: ${JSON.stringify(risks.map(r => ({ risk_id: r.risk_id, threat: r.threat, category: r.category, why_this_company: r.why_this_company })))}`;
  const raw = await invokeClaudeApi(system, user, 8000);
  const result = extractJsonArray(raw);
  if (!result || result.length === 0) return risks;
  const planMap = {};
  for (const r of result) { if (r.risk_id) planMap[r.risk_id] = r.treatment_plan; }
  return risks.map(r => planMap[r.risk_id] ? { ...r, treatment_plan: planMap[r.risk_id] } : r);
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESSING PIPELINES
// ═══════════════════════════════════════════════════════════════════════════

// Full client processing — runs async, never blocks the server
async function runClientProcessing(clientId, forcePolicyRegeneration = false) {
  const paths = getSectionPaths(clientId);
  let pg = readJson(paths['policy-generation'].file, newDefaultSection('policy-generation', clientId, clientId));
  const onboarding = readJson(paths.onboarding.file, newDefaultSection('onboarding', clientId, clientId));
  let topRisks = getDerivedTopRisks(onboarding); // will be replaced by AI-discovered risks

  try {
    writeAuditLog(clientId, 'processing_started', { client_id: clientId });
    const existingPolicies = (pg.policies || []).filter(Boolean);
    const hasExisting = existingPolicies.length > 0;
    let finalPolicies = [];

    if (hasExisting && !forcePolicyRegeneration) {
      // Skip policy generation — use existing
      finalPolicies = existingPolicies;
      pg.generation_status = 'Completed';
      (pg.generation_stages || []).forEach(s => { s.status = 'complete'; });
    } else {
      // Full policy pipeline
      if (!pg.generation_started_at) pg.generation_started_at = new Date().toISOString();
      pg.generation_status = 'In progress';
      pg.generation_stages = newPolicyGenerationStages();

      pg = startStage(pg, 'prepare', 'Loading policy templates, framework basis, and company context.');
      saveJson(paths['policy-generation'].file, pg);

      pg = startStage(pg, 'draft', 'Building draft policies from templates and company context.');
      saveJson(paths['policy-generation'].file, pg);
      let drafts = newPolicyDraftRecords(onboarding, topRisks);
      completeStage(pg, 'draft');

      pg = startStage(pg, 'rewrite', 'Rewriting drafts into company-specific narrative language.');
      saveJson(paths['policy-generation'].file, pg);
      completeStage(pg, 'rewrite');

      pg = startStage(pg, 'format', 'Formatting policy structure and presentation.');
      saveJson(paths['policy-generation'].file, pg);
      completeStage(pg, 'format');

      pg = startStage(pg, 'specificity', 'Applying company-specific language and metadata.');
      saveJson(paths['policy-generation'].file, pg);
      finalPolicies = applyPolicyGovernance(existingPolicies, drafts, onboarding);
      completeStage(pg, 'specificity');

      if (process.env.ANTHROPIC_API_KEY) {
        // Agent 1 — Orchestrator
        pg = startStage(pg, 'orchestrator', 'Orchestrator agent — building shared company brief.');
        saveJson(paths['policy-generation'].file, pg);
        const brief = await buildCompanyBrief(onboarding);
        pg.company_brief = brief;
        completeStage(pg, 'orchestrator');

        // Agent 1b — Risk Discovery
        pg = startStage(pg, 'risk-discovery', 'Risk discovery agent — identifying company-specific risks.');
        saveJson(paths['policy-generation'].file, pg);
        const discoveredRisks = await runRiskDiscoveryAgent(onboarding, brief);
        topRisks = discoveredRisks; // replace hardcoded list with AI-discovered risks
        // Save discovered risks to risk assessment so policies and risks are aligned
        const raFile = paths['risk-assessment'].file;
        const existingRa = readJson(raFile, {});
        const discoveredRaSection = buildRiskAssessmentSection(onboarding, topRisks, finalPolicies);
        saveJson(raFile, { ...existingRa, ...discoveredRaSection, risks: discoveredRaSection.risks });
        // Rebuild policy drafts with discovered risks so linked_risks are accurate
        const draftsWithRisks = newPolicyDraftRecords(onboarding, topRisks);
        finalPolicies = applyPolicyGovernance(finalPolicies, draftsWithRisks, onboarding);
        completeStage(pg, 'risk-discovery');
        saveJson(paths['policy-generation'].file, pg);

        // Agent 2 — Policy Writer
        pg = startStage(pg, 'writer', 'Policy writer agent — rewriting with company-specific depth.');
        saveJson(paths['policy-generation'].file, pg);
        const written = await runPolicyWriterAgent(finalPolicies, brief, onboarding, (batchNum, totalBatches, done) => {
          pg.generation_stage_note = done
            ? `Policy writer agent — Batch ${batchNum}/${totalBatches} complete`
            : `Policy writer agent — Writing batch ${batchNum}/${totalBatches}…`;
          saveJson(paths['policy-generation'].file, pg);
        });
        if (written && written.length > 0) finalPolicies = written;
        completeStage(pg, 'writer');
        // Save intermediate so status poll shows policies written
        pg.policies = finalPolicies;
        saveJson(paths['policy-generation'].file, pg);

        // Agent 3 — Critic
        pg = startStage(pg, 'critic', 'Policy critic agent — scoring and flagging quality issues.');
        saveJson(paths['policy-generation'].file, pg);
        const criticResults = runPolicyCriticAgent(finalPolicies, brief, onboarding);
        pg.critic_results = criticResults;
        const failedCount = criticResults.filter(r => r.score < 80).length;
        const avgScore = criticResults.reduce((s, r) => s + r.score, 0) / (criticResults.length || 1);
        completeStage(pg, 'critic');

        // Agent 4 — Rewriter
        if (failedCount > 0) {
          pg = startStage(pg, 'rewriter', `Rewriter agent — fixing ${failedCount} policies below 80. Avg: ${avgScore.toFixed(1)}/100.`);
          saveJson(paths['policy-generation'].file, pg);
          const rewritten = await runPolicyRewriterAgent(finalPolicies, criticResults, brief);
          if (rewritten && rewritten.length > 0) finalPolicies = rewritten;
        } else {
          pg = startStage(pg, 'rewriter', `All ${criticResults.length} policies passed (avg: ${avgScore.toFixed(1)}/100).`);
        }
        completeStage(pg, 'rewriter');
      } else {
        // Skip AI stages
        for (const s of ['orchestrator','writer','critic','rewriter']) completeStage(startStage(pg, s, 'Skipped — no API key.'), s);
      }

      pg = startStage(pg, 'qa', 'Running policy QA checks and finalizing policy pack.');
      saveJson(paths['policy-generation'].file, pg);
      completeStage(pg, 'qa');

      pg.generation_status = 'Completed';
      pg.generation_completed_at = new Date().toISOString();
      pg.policies = finalPolicies;
    }

    saveJson(paths['policy-generation'].file, pg);

    const policyQa = buildPolicyQaSection(finalPolicies, onboarding);
    saveJson(paths['policy-qa'].file, policyQa);

    const policySummary = buildPolicySummarySection(finalPolicies, policyQa.findings);
    saveJson(paths['policy-summary'].file, policySummary);

    // Don't proceed to risks/vendors unless policies approved
    if (!policiesApproved(finalPolicies)) {
      writeAuditLog(clientId, 'processing_paused_for_policy_approval', { client_id: clientId, policy_count: finalPolicies.length });
      return;
    }

    const savedBrief = pg.company_brief || await buildCompanyBrief(onboarding);
    await runRisksAndVendors(clientId, onboarding, topRisks, finalPolicies, savedBrief, paths);

    onboarding.reprocessing_required = 'No';
    onboarding.change_notice = '';
    onboarding.last_processed_at = new Date().toISOString();
    saveJson(paths.onboarding.file, onboarding);
    writeAuditLog(clientId, 'processing_completed', { client_id: clientId });
  } catch (e) {
    console.error('[runClientProcessing] Error:', e.message);
    pg = failSection(pg, e.message);
    saveJson(paths['policy-generation'].file, pg);
    writeAuditLog(clientId, 'processing_failed', { client_id: clientId, error: e.message });
  }
}

// ── Evidence tracker seeding ───────────────────────────────────────────────
function buildEvidenceTrackerItems(onboarding) {
  const items = [];
  const fwRaw = String(onboarding.framework_selection_v2 || onboarding.framework_selection || '').toLowerCase();
  const isSoc2 = fwRaw.includes('soc');
  const isIso  = fwRaw.includes('iso');

  if (isSoc2) {
    const tscScope = parseTscScope(onboarding);
    const controls = getSoc2ControlsForScope(tscScope);
    for (const ctrl of controls) {
      items.push({
        evidence_id:       `EV-SOC2-${ctrl.control_id.replace(/\./g, '')}`,
        framework:         'SOC 2',
        control_id:        ctrl.control_id,
        control_name:      ctrl.control_name,
        tsc:               ctrl.tsc,
        suggested_owner:   ctrl.suggested_owner || '',
        frequency:         ctrl.typical_frequency || '',
        required_evidence: ctrl.required_evidence || '',
        status:            'Not Started',
        evidence_location: '',
        collection_date:   '',
        deviations_notes:  '',
      });
    }
  }

  if (isIso) {
    for (const ctrl of (iso27001Controls.controls || [])) {
      items.push({
        evidence_id:       `EV-ISO-${ctrl.control_id.replace(/\./g, '')}`,
        framework:         'ISO 27001:2022',
        control_id:        ctrl.control_id,
        control_name:      ctrl.control_name,
        theme:             ctrl.theme,
        suggested_owner:   ctrl.suggested_owner || '',
        frequency:         ctrl.typical_frequency || '',
        required_evidence: ctrl.required_evidence || '',
        status:            'Not Started',
        evidence_location: '',
        collection_date:   '',
        deviations_notes:  '',
      });
    }
  }

  return items;
}

async function runRisksAndVendors(clientId, onboarding, topRisks, policies, brief, paths) {
  // Risks
  let ra = buildRiskAssessmentSection(onboarding, ensureFraudRisk(topRisks, onboarding), policies);
  if (process.env.ANTHROPIC_API_KEY) {
    const withPlans = await runTreatmentPlanAgent(ra.risks, onboarding, policies, []);
    if (withPlans && withPlans.length > 0) ra.risks = withPlans;
    const aiRisks = await runRiskAnalystAgent(ra.risks, policies, brief, onboarding);
    if (aiRisks && aiRisks.length > 0) ra.risks = aiRisks;
  }
  ra.risks = ensureFraudRisk(ra.risks, onboarding);
  saveJson(paths['risk-assessment'].file, ra);
  saveJson(paths['risk-qa'].file, buildRiskQaSection(ra.risks));

  // Vendors
  let vr = buildVendorRiskSection(onboarding, ra.risks, policies);
  if (process.env.ANTHROPIC_API_KEY) {
    const aiVendors = await runVendorAnalystAgent(vr.vendors, policies, ra.risks, brief, onboarding);
    if (aiVendors && aiVendors.length > 0) vr.vendors = aiVendors;
  }
  updateVendorCatalog(vr.vendors);
  saveJson(paths['vendor-risk'].file, vr);
  saveJson(paths['vendor-qa'].file, buildVendorQaSection(vr.vendors));

  // Controls + Audit
  const fw = getFrameworkLabels(onboarding);
  const cm = buildControlMappingSection(policies, ra.risks, vr.vendors, fw, onboarding);
  saveJson(paths['control-mapping'].file, cm);
  const aq = buildAuditQaSection(policies, ra.risks, vr.vendors, cm.controls, onboarding);
  saveJson(paths['audit-qa'].file, aq);

  // Evidence tracker — seed with framework-specific items if not already populated
  const evPath = paths['evidence-tracker'].file;
  const existingEv = readJson(evPath, newDefaultSection('evidence-tracker', clientId, clientId));
  if (!existingEv.evidence_items || existingEv.evidence_items.length === 0) {
    existingEv.evidence_items = buildEvidenceTrackerItems(onboarding);
    saveJson(evPath, existingEv);
    console.log(`[EvidenceTracker] Seeded ${existingEv.evidence_items.length} items for ${clientId}`);
  }

  // Output
  const output = buildOutputSection(policies, ra.risks, vr.vendors, cm.controls, aq.findings);
  saveJson(paths.output.file, output);
}

async function runSelectiveRiskRegeneration(clientId) {
  const paths = getSectionPaths(clientId);
  const onboarding = readJson(paths.onboarding.file, newDefaultSection('onboarding', clientId, clientId));
  const pg         = readJson(paths['policy-generation'].file, { policies: [] });
  const policies   = (pg.policies || []).filter(Boolean);
  const topRisks   = getDerivedTopRisks(onboarding);
  const brief      = pg.company_brief || await buildCompanyBrief(onboarding);

  let ra = buildRiskAssessmentSection(onboarding, topRisks, policies);
  if (process.env.ANTHROPIC_API_KEY) {
    const withPlans = await runTreatmentPlanAgent(ra.risks, onboarding, policies, []);
    if (withPlans && withPlans.length > 0) ra.risks = withPlans;
    const aiRisks = await runRiskAnalystAgent(ra.risks, policies, brief, onboarding);
    if (aiRisks && aiRisks.length > 0) ra.risks = aiRisks;
  }
  saveJson(paths['risk-assessment'].file, ra);
  saveJson(paths['risk-qa'].file, buildRiskQaSection(ra.risks));
  console.log(`[risks-worker] Generated ${ra.risks.length} risks for ${clientId}`);

  // Auto-chain to vendors
  await runSelectiveVendorRegeneration(clientId);
}

async function runSelectiveVendorRegeneration(clientId) {
  const paths = getSectionPaths(clientId);
  const onboarding = readJson(paths.onboarding.file, newDefaultSection('onboarding', clientId, clientId));
  const pg         = readJson(paths['policy-generation'].file, { policies: [], company_brief: null });
  const ra         = readJson(paths['risk-assessment'].file,   { risks: [] });
  const policies   = (pg.policies || []).filter(Boolean);
  const risks      = (ra.risks    || []).filter(Boolean);
  const brief      = pg.company_brief || await buildCompanyBrief(onboarding);

  let vr = buildVendorRiskSection(onboarding, risks, policies);
  if (process.env.ANTHROPIC_API_KEY) {
    const aiVendors = await runVendorAnalystAgent(vr.vendors, policies, risks, brief, onboarding);
    if (aiVendors && aiVendors.length > 0) vr.vendors = aiVendors;
  }
  updateVendorCatalog(vr.vendors);
  saveJson(paths['vendor-risk'].file, vr);
  saveJson(paths['vendor-qa'].file, buildVendorQaSection(vr.vendors));

  // Regenerate controls + audit after vendor update
  const fw = getFrameworkLabels(onboarding);
  const cm = buildControlMappingSection(policies, risks, vr.vendors, fw, onboarding);
  saveJson(paths['control-mapping'].file, cm);
  const aq = buildAuditQaSection(policies, risks, vr.vendors, cm.controls, onboarding);
  saveJson(paths['audit-qa'].file, aq);
  console.log(`[vendors-worker] Generated ${vr.vendors.length} vendors for ${clientId}`);
}

// ── Publish/unpublish helpers ──────────────────────────────────────────────
function publishAllPolicies(clientId, unsignOnly = false) {
  const paths = getSectionPaths(clientId);
  const onboarding = readJson(paths.onboarding.file, {});
  const pg = readJson(paths['policy-generation'].file, { policies: [] });
  const policies = (pg.policies || []).filter(Boolean);
  if (policies.length === 0) return getClientAggregate(clientId);

  const usernames = getClientUsernames(onboarding);
  const actor = usernames[0] || '';
  const now = new Date().toISOString();

  pg.policies = policies.map(p => ({
    ...p,
    published: unsignOnly ? p.published : 'Yes',
    published_by: unsignOnly ? p.published_by : (p.published_by || actor),
    published_at: unsignOnly ? p.published_at : (p.published_at || now),
    sign_off_complete: 'Yes',
    sign_off_completed_by: p.sign_off_completed_by || actor,
    sign_off_completed_at: p.sign_off_completed_at || now,
  }));
  saveJson(paths['policy-generation'].file, pg);
  writeAuditLog(clientId, 'policy_generation_bulk_approved', { client_id: clientId, policy_count: pg.policies.length });
  return getClientAggregate(clientId);
}

function unpublishAllPolicies(clientId) {
  const paths = getSectionPaths(clientId);
  const pg = readJson(paths['policy-generation'].file, { policies: [] });
  pg.policies = (pg.policies || []).filter(Boolean).map(p => ({ ...p, published: 'No', published_by: '', published_at: '' }));
  saveJson(paths['policy-generation'].file, pg);
  return getClientAggregate(clientId);
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND WORKER MODE
// node server.js process-risks-worker "ClientId"
// ═══════════════════════════════════════════════════════════════════════════
const workerTasks = ['process-client','process-risks-worker','process-vendors-worker','process-controls-worker'];
const taskArg = process.argv[2];
const clientArg = process.argv[3] ? decodeURIComponent(process.argv[3]) : '';

if (taskArg && workerTasks.includes(taskArg) && clientArg) {
  // Running as background worker — do the work then exit
  (async () => {
    try {
      if (taskArg === 'process-risks-worker')    await runSelectiveRiskRegeneration(clientArg);
      else if (taskArg === 'process-vendors-worker') await runSelectiveVendorRegeneration(clientArg);
      else if (taskArg === 'process-controls-worker') {
        const paths = getSectionPaths(clientArg);
        const ob = readJson(paths.onboarding.file, {});
        const pg = readJson(paths['policy-generation'].file, { policies: [] });
        const ra = readJson(paths['risk-assessment'].file, { risks: [] });
        const vr = readJson(paths['vendor-risk'].file, { vendors: [] });
        const fw = getFrameworkLabels(ob);
        const cm = buildControlMappingSection(pg.policies, ra.risks, vr.vendors, fw, ob);
        saveJson(paths['control-mapping'].file, cm);
        const aq = buildAuditQaSection(pg.policies, ra.risks, vr.vendors, cm.controls, ob);
        saveJson(paths['audit-qa'].file, aq);
        console.log(`[controls-worker] Generated ${cm.controls.length} controls for ${clientArg}`);
      }
      else if (taskArg === 'process-client') {
        const force = process.argv[4] === 'true';
        await runClientProcessing(clientArg, force);
      }
    } catch (e) {
      console.error(`[worker ${taskArg}] Fatal:`, e.message);
    }
    process.exit(0);
  })();
} else {

// ═══════════════════════════════════════════════════════════════════════════
// EXPRESS HTTP SERVER
// ═══════════════════════════════════════════════════════════════════════════
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(publicRoot));

// ── GET /api/intelligence/status ───────────────────────────────────────────
app.get('/api/intelligence/status', (req, res) => {
  res.json({ api_key_set: !!process.env.ANTHROPIC_API_KEY, ai_active: !!process.env.ANTHROPIC_API_KEY });
});

// ── GET /api/settings ──────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  res.json({ ai_enabled: !!process.env.ANTHROPIC_API_KEY, api_key_valid: !!process.env.ANTHROPIC_API_KEY, api_key_last_four: process.env.ANTHROPIC_API_KEY ? '****' : '' });
});

// ── POST /api/settings/api-key ─────────────────────────────────────────────
app.post('/api/settings/api-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'apiKey required' });
  process.env.ANTHROPIC_API_KEY = apiKey;
  _anthropic = null; // reset cached client
  // Write to .env
  const envPath = path.join(scriptRoot, '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (/^ANTHROPIC_API_KEY=/m.test(envContent)) envContent = envContent.replace(/^ANTHROPIC_API_KEY=.*/m, `ANTHROPIC_API_KEY=${apiKey}`);
  else envContent += `\nANTHROPIC_API_KEY=${apiKey}`;
  fs.writeFileSync(envPath, envContent, 'utf8');
  res.json({ success: true, api_key_valid: true });
});

// ── GET /api/vendor-catalog ────────────────────────────────────────────────
app.get('/api/vendor-catalog', (req, res) => {
  res.json(readJson(vendorCatalogPath, { version: '1.0', vendors: [] }));
});

// ── GET /api/prompt-registry ───────────────────────────────────────────────
app.get('/api/prompt-registry', (req, res) => {
  const registryPath = path.join(configRoot, 'agent-prompt-registry.json');
  res.json(readJson(registryPath, { version: '1.0', prompts: [] }));
});

// ── GET /api/prompts/:promptId ─────────────────────────────────────────────
app.get('/api/prompts/:promptId', (req, res) => {
  const registry = readJson(path.join(configRoot, 'agent-prompt-registry.json'), { prompts: [] });
  const entry = (registry.prompts || []).find(p => p.id === req.params.promptId);
  if (!entry) return res.status(404).json({ error: 'Prompt not found' });
  const promptFile = path.join(promptRoot, entry.relative_path || `${req.params.promptId}.txt`);
  const content = fs.existsSync(promptFile) ? fs.readFileSync(promptFile, 'utf8') : '';
  res.json({ ...entry, content });
});

// ── GET /api/clients ───────────────────────────────────────────────────────
app.get('/api/clients', (req, res) => {
  try { res.json(getClients()); } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/clients ──────────────────────────────────────────────────────
app.post('/api/clients', (req, res) => {
  try {
    const name = req.body.legal_entity || req.body.companyName;
    if (!name) return res.status(400).json({ error: 'legal_entity or companyName required' });
    const clientId = ensureClientWorkspace(name);
    // Set legal_entity in onboarding
    const paths = getSectionPaths(clientId);
    const ob = readJson(paths.onboarding.file, newDefaultSection('onboarding', clientId, name));
    ob.legal_entity = name;
    saveJson(paths.onboarding.file, ob);
    writeAuditLog(clientId, 'client_created', { client_id: clientId, company_name: name });
    res.json(getClientAggregate(clientId));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── GET /api/clients/:id ───────────────────────────────────────────────────
app.get('/api/clients/:id', (req, res) => {
  try {
    const clientId = decodeURIComponent(req.params.id);
    if (!fs.existsSync(path.join(dataRoot, clientId))) return res.status(404).json({ error: 'Client not found' });
    res.json(getClientAggregate(clientId));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/clients/:id ────────────────────────────────────────────────
app.delete('/api/clients/:id', (req, res) => {
  try {
    const clientId = decodeURIComponent(req.params.id);
    const clientDir = path.join(dataRoot, clientId);
    if (!fs.existsSync(clientDir)) return res.status(404).json({ error: 'Client not found' });
    fs.rmSync(clientDir, { recursive: true, force: true });
    writeAuditLog(clientId, 'client_deleted', { client_id: clientId });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/clients/:id/:sectionKey ──────────────────────────────────────
app.put('/api/clients/:id/:sectionKey', (req, res) => {
  try {
    const clientId  = decodeURIComponent(req.params.id);
    const sectionKey = req.params.sectionKey;
    if (!SECTION_META[sectionKey]) return res.status(404).json({ error: 'Unknown section' });
    ensureClientWorkspace(clientId);
    const paths = getSectionPaths(clientId);
    const current  = readJson(paths[sectionKey].file, newDefaultSection(sectionKey, clientId, clientId));
    const previous = { ...current };
    const payload  = req.body;

    Object.assign(current, payload);

    if (sectionKey === 'policy-generation') {
      // Only merge if policies were actually sent — never wipe existing with an empty array
      if (Array.isArray(payload.policies) && payload.policies.length > 0) {
        current.policies = applyPolicyGovernance(previous.policies || [], payload.policies, readJson(paths.onboarding.file, {}));
      } else {
        current.policies = previous.policies || [];
      }
      writeAuditLog(clientId, 'policy_generation_saved', { client_id: clientId, policy_count: (current.policies||[]).length });
    }
    if (sectionKey === 'onboarding') {
      const changed = onboardingMateriallyChanged(previous, current);
      if (changed) {
        current.reprocessing_required = 'Yes';
        current.change_notice = 'Onboarding changed. Policies, risks, and vendor assessments must be regenerated so all downstream outputs reflect the updated intake.';
        current.downstream_reset_at = new Date().toISOString();
        resetDownstreamWorkflow(clientId);
        writeAuditLog(clientId, 'onboarding_changed', { client_id: clientId, downstream_reset: true });
      }
      updateVendorCatalog(Array.isArray(current.vendors) ? current.vendors : []);
    }
    if (sectionKey === 'vendor-risk') {
      current.vendors = applyVendorGovernance(previous.vendors || [], current.vendors || []);
      updateVendorCatalog(current.vendors);
    }
    if (sectionKey === 'risk-assessment') {
      current.risks = applyRiskGovernance(previous.risks || [], current.risks || []);
    }
    saveJson(paths[sectionKey].file, current);
    res.json(getClientAggregate(clientId));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/clients/:id/policy-generation-status ─────────────────────────
app.get('/api/clients/:id/policy-generation-status', (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  const paths = getSectionPaths(clientId);
  const pg = readJson(paths['policy-generation'].file, { generation_status: '', generation_stages: [] });
  res.json({
    generation_status:       pg.generation_status       || '',
    generation_stage:        pg.generation_stage        || '',
    generation_stage_note:   pg.generation_stage_note   || '',
    generation_started_at:   pg.generation_started_at   || '',
    generation_completed_at: pg.generation_completed_at || '',
    generation_last_error:   pg.generation_last_error   || '',
    generation_stages:       pg.generation_stages       || [],
    policy_count:            (pg.policies || []).filter(Boolean).length,
  });
});

// ── GET /api/clients/:id/downstream-status ────────────────────────────────
app.get('/api/clients/:id/downstream-status', (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  const paths = getSectionPaths(clientId);
  const ra = readJson(paths['risk-assessment'].file, { risks: [] });
  const vr = readJson(paths['vendor-risk'].file,     { vendors: [] });
  res.json({
    risk_count:         (ra.risks   || []).filter(Boolean).length,
    vendor_count:       (vr.vendors || []).filter(Boolean).length,
    risks_updated_at:   ra.updatedAt   || '',
    vendors_updated_at: vr.updatedAt   || '',
  });
});

// ── POST /api/clients/:id/reset-processing ────────────────────────────────
app.post('/api/clients/:id/reset-processing', (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  const paths = getSectionPaths(clientId);
  const pg = readJson(paths['policy-generation'].file, {});
  if (pg.generation_status === 'In progress') {
    pg.generation_status = 'Failed';
    pg.generation_last_error = 'Processing was manually reset after getting stuck.';
    pg.generation_completed_at = new Date().toISOString();
    (pg.generation_stages || []).forEach(s => { if (s.status === 'in-progress') { s.status = 'failed'; s.note = 'Reset by user.'; } });
    saveJson(paths['policy-generation'].file, pg);
    writeAuditLog(clientId, 'processing_reset', { client_id: clientId });
  }
  res.json(getClientAggregate(clientId));
});

// ── POST /api/clients/:id/process ─────────────────────────────────────────
app.post('/api/clients/:id/process', (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  const force    = req.query.forcePolicies === 'yes';
  ensureClientWorkspace(clientId);

  const paths = getSectionPaths(clientId);
  const pg = readJson(paths['policy-generation'].file, { generation_status: '' });
  if (isPolicyGenerationInProgress(pg)) {
    return res.json(getClientAggregate(clientId)); // already running
  }

  // Only reset stages if we're doing a full regen — not when policies already exist
  const existingPolicies = (pg.policies || []).filter(Boolean);
  if (force || existingPolicies.length === 0) {
    pg.generation_status = 'In progress';
    pg.generation_started_at = new Date().toISOString();
    pg.generation_stages = newPolicyGenerationStages();
    saveJson(paths['policy-generation'].file, pg);
  }

  // Fire async — don't await — server remains responsive
  runClientProcessing(clientId, force).catch(e => console.error('[process] Error:', e.message));

  res.json(getClientAggregate(clientId));
});

// ── POST /api/clients/:id/process-risks ───────────────────────────────────
app.post('/api/clients/:id/process-risks', (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  // Run async inline — no need to spawn a new process in Node
  runSelectiveRiskRegeneration(clientId).catch(e => console.error('[process-risks] Error:', e.message));
  res.json(getClientAggregate(clientId));
});

// ── POST /api/clients/:id/process-vendors ─────────────────────────────────
app.post('/api/clients/:id/process-vendors', (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  runSelectiveVendorRegeneration(clientId).catch(e => console.error('[process-vendors] Error:', e.message));
  res.json(getClientAggregate(clientId));
});

// ── POST /api/clients/:id/process-controls ────────────────────────────────
app.post('/api/clients/:id/process-controls', (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  const paths = getSectionPaths(clientId);
  const ob = readJson(paths.onboarding.file, {});
  const pg = readJson(paths['policy-generation'].file, { policies: [] });
  const ra = readJson(paths['risk-assessment'].file, { risks: [] });
  const vr = readJson(paths['vendor-risk'].file, { vendors: [] });
  const fw = getFrameworkLabels(ob);
  const cm = buildControlMappingSection(pg.policies, ra.risks, vr.vendors, fw, ob);
  saveJson(paths['control-mapping'].file, cm);
  const aq = buildAuditQaSection(pg.policies, ra.risks, vr.vendors, cm.controls, ob);
  saveJson(paths['audit-qa'].file, aq);
  res.json(getClientAggregate(clientId));
});

// ── POST /api/clients/:id/process-audit ───────────────────────────────────
app.post('/api/clients/:id/process-audit', (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  const paths = getSectionPaths(clientId);
  const ob = readJson(paths.onboarding.file, {});
  const pg = readJson(paths['policy-generation'].file, { policies: [] });
  const ra = readJson(paths['risk-assessment'].file, { risks: [] });
  const vr = readJson(paths['vendor-risk'].file, { vendors: [] });
  const cm = readJson(paths['control-mapping'].file, { controls: [] });
  const aq = buildAuditQaSection(pg.policies, ra.risks, vr.vendors, cm.controls, ob);
  saveJson(paths['audit-qa'].file, aq);
  res.json(getClientAggregate(clientId));
});

// ── POST /api/clients/:id/process-targeted ────────────────────────────────
app.post('/api/clients/:id/process-targeted', (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  // For now just return current state — targeted regen is complex; full regen handles this
  res.json(getClientAggregate(clientId));
});

// ── POST /api/clients/:id/regenerate-treatment-plans ─────────────────────
app.post('/api/clients/:id/regenerate-treatment-plans', async (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  const paths = getSectionPaths(clientId);
  const ob  = readJson(paths.onboarding.file, {});
  const pg  = readJson(paths['policy-generation'].file, { policies: [] });
  const vr  = readJson(paths['vendor-risk'].file, { vendors: [] });
  const ra  = readJson(paths['risk-assessment'].file, { risks: [] });
  if ((ra.risks || []).filter(Boolean).length > 0) {
    const withPlans = await runTreatmentPlanAgent(ra.risks, ob, pg.policies || [], vr.vendors || []);
    if (withPlans && withPlans.length > 0) { ra.risks = withPlans; saveJson(paths['risk-assessment'].file, ra); }
  }
  res.json(getClientAggregate(clientId));
});

// ── POST /api/clients/:id/policies/publish-all ────────────────────────────
app.post('/api/clients/:id/policies/publish-all', (req, res) => {
  res.json(publishAllPolicies(decodeURIComponent(req.params.id)));
});

// ── POST /api/clients/:id/policies/unpublish-all ──────────────────────────
app.post('/api/clients/:id/policies/unpublish-all', (req, res) => {
  res.json(unpublishAllPolicies(decodeURIComponent(req.params.id)));
});

// ── POST /api/clients/:id/policies/unsign-all ─────────────────────────────
app.post('/api/clients/:id/policies/unsign-all', (req, res) => {
  res.json(publishAllPolicies(decodeURIComponent(req.params.id), true));
});

// ── POST /api/clients/:id/process-policy/:policyId ────────────────────────
app.post('/api/clients/:id/process-policy/:policyId', async (req, res) => {
  const clientId = decodeURIComponent(req.params.id);
  const policyId = decodeURIComponent(req.params.policyId);
  const paths = getSectionPaths(clientId);
  const pg = readJson(paths['policy-generation'].file, { policies: [] });
  const ob = readJson(paths.onboarding.file, {});
  const brief = pg.company_brief || await buildCompanyBrief(ob);
  const policy = (pg.policies || []).find(p => p.policy_id === policyId);
  if (policy && process.env.ANTHROPIC_API_KEY) {
    const result = await runPolicyWriterAgent([policy], brief, ob);
    if (result && result[0]) {
      pg.policies = (pg.policies || []).map(p => p.policy_id === policyId ? result[0] : p);
      saveJson(paths['policy-generation'].file, pg);
    }
  }
  res.json(getClientAggregate(clientId));
});

// ── POST /api/intelligence/improve ────────────────────────────────────────
app.post('/api/intelligence/improve', async (req, res) => {
  const { clientId, type } = req.body;
  if (!clientId) return res.status(400).json({ error: 'clientId required' });
  const id = decodeURIComponent(clientId);
  const paths = getSectionPaths(id);
  const ob    = readJson(paths.onboarding.file, {});
  const pg    = readJson(paths['policy-generation'].file, { policies: [] });
  const brief = pg.company_brief || await buildCompanyBrief(ob);

  if (type === 'policies') {
    const written = await runPolicyWriterAgent(pg.policies || [], brief, ob);
    if (written && written.length > 0) { pg.policies = written; saveJson(paths['policy-generation'].file, pg); }
  } else if (type === 'risks') {
    const ra = readJson(paths['risk-assessment'].file, { risks: [] });
    const aiRisks = await runRiskAnalystAgent(ra.risks || [], pg.policies || [], brief, ob);
    if (aiRisks && aiRisks.length > 0) { ra.risks = aiRisks; saveJson(paths['risk-assessment'].file, ra); }
  } else if (type === 'vendors') {
    const ra = readJson(paths['risk-assessment'].file, { risks: [] });
    const vr = readJson(paths['vendor-risk'].file, { vendors: [] });
    const aiVendors = await runVendorAnalystAgent(vr.vendors || [], pg.policies || [], ra.risks || [], brief, ob);
    if (aiVendors && aiVendors.length > 0) { vr.vendors = aiVendors; saveJson(paths['vendor-risk'].file, vr); }
  }
  res.json(getClientAggregate(id));
});

// ── POST /api/clients/:id/evidence-upload ─────────────────────────────────
app.post('/api/clients/:id/evidence-upload', (req, res) => {
  try {
    const clientId = decodeURIComponent(req.params.id);
    const { filename, data, evidenceId } = req.body;
    if (!filename || !data) return res.status(400).json({ error: 'filename and data required' });
    const paths = getSectionPaths(clientId);
    const dir = path.join(paths['evidence-tracker'].folder, 'files', evidenceId || 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    const buf = Buffer.from(data, 'base64');
    fs.writeFileSync(path.join(dir, filename), buf);
    res.json({ success: true, path: path.join(dir, filename) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Fallback: serve index.html for SPA routes ─────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(publicRoot, 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send('Not found');
});

// ── Start server ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8090', 10);
app.listen(PORT, () => {
  console.log(`[.env] Loaded environment from ${path.join(scriptRoot, '.env')}`);
  if (process.env.ANTHROPIC_API_KEY) console.log('[AI] API key validated - AI agents active.');
  else console.log('[AI] No API key — AI agents disabled.');
  console.log(`DB Agent local app running at http://localhost:${PORT}`);
});

} // end else (not worker mode)
