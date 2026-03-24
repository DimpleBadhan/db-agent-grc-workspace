param([int]$Port = 8090)

$ErrorActionPreference = "Stop"
$Task = if ($args.Count -ge 1 -and [string]$args[0]) { [string]$args[0] } else { "serve" }
$TaskClientId = if ($args.Count -ge 2 -and [string]$args[1]) { [string]$args[1] } else { "" }
$TaskForcePolicyRegeneration = $false
if ($args.Count -ge 3) {
  $TaskForcePolicyRegeneration = ([string]$args[2]).ToLowerInvariant() -in @("true", "1", "yes")
}
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent $scriptRoot
$publicRoot = Join-Path $scriptRoot "public"
$configRoot = Join-Path $scriptRoot "config"
$promptRoot = Join-Path $scriptRoot "prompts"
$frameworkCacheRoot = Join-Path $scriptRoot "framework-cache"
$processingRoot = Join-Path $scriptRoot "local-processing-store"
$catalogRoot = Join-Path $processingRoot "catalogs"
$dataRoot = Join-Path $processingRoot "clients"
$exportsRoot = Join-Path $processingRoot "exports"
$auditLogsRoot = Join-Path $processingRoot "audit-logs"
$responseErrorLogPath = Join-Path $scriptRoot "response-errors.log"
$legacyDataRoot = Join-Path $scriptRoot "data\clients"
$templateCacheRoot = Join-Path $scriptRoot "template-cache\policy-templates"
$isoFrameworkCachePath = Join-Path $frameworkCacheRoot "iso27001\requirements.json"
$vendorCatalogPath = Join-Path $catalogRoot "vendor-catalog.json"
$policyTemplateRoot = Join-Path $workspaceRoot "compliance_inputs\policy_templates\anthony_new_batch_policies_all_frameworks_combined"
$isoFrameworkPath = Join-Path $workspaceRoot "compliance_inputs\frameworks\iso27001\anthony\iso27001_all.xlsx"
$policyGenerationRulesPath = Join-Path $workspaceRoot "compliance_inputs\agent_prompts\generation\policy_generation_agent.txt"
$scriptFilePath = $MyInvocation.MyCommand.Path
New-Item -ItemType Directory -Force -Path $frameworkCacheRoot | Out-Null
New-Item -ItemType Directory -Force -Path $processingRoot | Out-Null
New-Item -ItemType Directory -Force -Path $catalogRoot | Out-Null
New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
New-Item -ItemType Directory -Force -Path $exportsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $auditLogsRoot | Out-Null
if (Test-Path $legacyDataRoot -PathType Container) {
  foreach ($legacyClient in Get-ChildItem -Path $legacyDataRoot -Directory -Force -ErrorAction SilentlyContinue) {
    $targetClient = Join-Path $dataRoot $legacyClient.Name
    if (-not (Test-Path $targetClient -PathType Container)) {
      Copy-Item -Path $legacyClient.FullName -Destination $targetClient -Recurse -Force
    }
  }
}
$promptRegistryPath = Join-Path $configRoot "agent-prompt-registry.json"
$envFilePath = Join-Path $scriptRoot ".env"

# Auto-load .env file — sets any variable not already in the environment
if (Test-Path $envFilePath) {
  foreach ($line in Get-Content $envFilePath) {
    # Strip UTF-8 BOM character if present at start of line
    $line = $line.TrimStart([char]0xFEFF)
    if ($line -match '^\s*([^#=\s][^=]*?)\s*=\s*(.*?)\s*$') {
      $varName  = $Matches[1].Trim().TrimStart([char]0xFEFF)
      $varValue = $Matches[2].Trim('"').Trim("'")
      if (-not [string]::IsNullOrWhiteSpace($varName) -and [string]::IsNullOrWhiteSpace([System.Environment]::GetEnvironmentVariable($varName))) {
        Set-Item "env:$varName" $varValue
      }
    }
  }
  Write-Host "[.env] Loaded environment from $envFilePath"
}

# AI key validity cache — updated at startup and after every API call outcome
$script:aiKeyValid = $false

function Test-AnthropicKeyValid {
  $k = $env:ANTHROPIC_API_KEY
  if ([string]::IsNullOrWhiteSpace($k)) { $script:aiKeyValid = $false; return $false }
  try {
    $body = [ordered]@{
      model      = "claude-haiku-4-5-20251001"
      max_tokens = 10
      messages   = @(@{ role = "user"; content = "ping" })
    } | ConvertTo-Json -Depth 5 -Compress
    $r = Invoke-WebRequest -Uri "https://api.anthropic.com/v1/messages" `
      -Method POST -Body $body -ContentType "application/json" `
      -Headers @{ "x-api-key" = $k; "anthropic-version" = "2023-06-01" } `
      -UseBasicParsing -ErrorAction Stop
    $script:aiKeyValid = ($r.StatusCode -eq 200)
  } catch {
    $script:aiKeyValid = $false
  }
  if ($script:aiKeyValid) { Write-Host "[AI] API key validated — AI agents active." }
  else { Write-Host "[AI] API key invalid or unreachable — AI agents disabled. Update key via Settings." }
  return $script:aiKeyValid
}

# Validate key at startup — synchronous so $script:aiKeyValid is correct before first request
if (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
  $null = Test-AnthropicKeyValid
}

$sectionMeta = @{
  "onboarding" = @{ Folder = "Client Details"; File = "onboarding.json"; Property = "onboarding"; CountKey = $null; Collection = "vendors" }
  "policy-generation" = @{ Folder = "Policies and Procedures"; File = "policies.json"; Property = "policyGeneration"; CountKey = "policyCount"; Collection = "policies" }
  "policy-qa" = @{ Folder = "Policy QA"; File = "policy-qa.json"; Property = "policyQa"; CountKey = "policyQaFindingCount"; Collection = "findings" }
  "policy-summary" = @{ Folder = "Policy Summary"; File = "policy-summary.json"; Property = "policySummary"; CountKey = "policySummaryCount"; Collection = "summaries" }
  "risk-assessment" = @{ Folder = "Risk Assessments"; File = "risk-assessments.json"; Property = "riskAssessment"; CountKey = "riskCount"; Collection = "risks" }
  "risk-qa" = @{ Folder = "Risk QA"; File = "risk-qa.json"; Property = "riskQa"; CountKey = "riskQaFindingCount"; Collection = "findings" }
  "vendor-risk" = @{ Folder = "Vendor Assessments"; File = "vendor-assessments.json"; Property = "vendorRisk"; CountKey = "vendorCount"; Collection = "vendors" }
  "vendor-qa" = @{ Folder = "Vendor QA"; File = "vendor-qa.json"; Property = "vendorQa"; CountKey = "vendorQaFindingCount"; Collection = "findings" }
  "control-mapping" = @{ Folder = "Control Mapping"; File = "controls.json"; Property = "controlMapping"; CountKey = "controlCount"; Collection = "controls" }
  "audit-qa" = @{ Folder = "Audit QA"; File = "audit-qa.json"; Property = "auditQa"; CountKey = "auditFindingCount"; Collection = "findings" }
  "output" = @{ Folder = "Output"; File = "dashboard-output.json"; Property = "output"; CountKey = "outputCount"; Collection = "outputs" }
  "evidence-tracker" = @{ Folder = "Evidence Tracker"; File = "evidence-tracker.json"; Property = "evidenceTracker"; CountKey = $null; Collection = "evidence_items" }
}

function Get-ContentType {
  param([string]$Path)
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "application/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".csv" { "text/csv; charset=utf-8" }
    ".txt" { "text/plain; charset=utf-8" }
    ".pdf" { "application/pdf" }
    ".xlsx" { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    ".zip" { "application/zip" }
    default { "application/octet-stream" }
  }
}

function ConvertTo-SafeFolderName {
  param([string]$Name)
  $trimmed = [string]$Name
  $trimmed = $trimmed.Trim()
  if (-not $trimmed) { throw "Company name is required." }
  $invalidChars = [Regex]::Escape((-join [System.IO.Path]::GetInvalidFileNameChars()))
  $clean = [Regex]::Replace($trimmed, "[$invalidChars]", " ")
  $clean = [Regex]::Replace($clean, "\s+", " ").Trim().TrimEnd(".")
  if (-not $clean) { throw "Company name does not produce a valid folder name." }
  return $clean
}

function New-DefaultSection {
  param([string]$SectionKey, [string]$ClientId, [string]$CompanyName)
  switch ($SectionKey) {
    "onboarding" {
      return [ordered]@{
        legal_entity = $CompanyName; public_website = ""; business_model = ""; employee_headcount = ""; work_type = ""; company_type = ""; industry = ""; tech_stack = ""; cloud_providers = ""; storage_regions = ""; devices_used = ""; operating_systems = ""; identity_provider = ""; mfa_enabled = ""; access_model = ""; data_types = ""; classification = ""; encryption = ""; backup = ""; monitoring = ""; top_risks = ""; vulnerabilities = ""; incidents = ""; framework_selection = ""; audit_timeline = ""; scope = ""; client_users = ""; client_usernames = ""; client_user_records = @(); policy_templates = ""; iso_27001_framework = ""; soc2_framework = ""; vendors = @(); reprocessing_required = ""; change_notice = ""; downstream_reset_at = ""; last_processed_at = ""; updatedAt = $null
      }
    }
    "policy-generation" {
      return [ordered]@{
        template_status = ""
        framework_basis = ""
        top_risks_input = ""
        generation_status = "Not started"
        generation_stage = ""
        generation_stage_note = ""
        generation_started_at = ""
        generation_completed_at = ""
        generation_last_error = ""
        generation_stages = New-PolicyGenerationStages
        policies = @()
        updatedAt = $null
      }
    }
    "policy-qa" {
      return [ordered]@{ qa_owner = ""; cleaned_policies_ref = ""; qa_notes = ""; findings = @(); updatedAt = $null }
    }
    "policy-summary" {
      return [ordered]@{ summary_owner = ""; summary_notes = ""; summaries = @(); updatedAt = $null }
    }
    "risk-assessment" {
      return [ordered]@{ risk_methodology = ""; policy_summary_ref = ""; risk_notes = ""; risks = @(); updatedAt = $null }
    }
    "risk-qa" {
      return [ordered]@{ qa_owner = ""; risk_register_ref = ""; qa_notes = ""; findings = @(); updatedAt = $null }
    }
    "vendor-risk" {
      return [ordered]@{ vendor_methodology = ""; policy_summary_ref = ""; vendor_notes = ""; vendors = @(); updatedAt = $null }
    }
    "vendor-qa" {
      return [ordered]@{ qa_owner = ""; vendor_register_ref = ""; qa_notes = ""; findings = @(); updatedAt = $null }
    }
    "control-mapping" {
      return [ordered]@{ mapping_basis = ""; evidence_standard = ""; controls = @(); updatedAt = $null }
    }
    "audit-qa" {
      return [ordered]@{ audit_owner = ""; audit_notes = ""; findings = @(); updatedAt = $null }
    }
    "output" {
      return [ordered]@{ validation_status = ""; output_notes = ""; outputs = @(); updatedAt = $null }
    }
    "evidence-tracker" {
      return [ordered]@{ security_maturity = ""; tasks = @(); evidence_items = @(); updatedAt = $null }
    }
    default { throw "Unsupported section key: $SectionKey" }
  }
}

function New-PolicyGenerationStages {
  return @(
    [ordered]@{
      key = "prepare"
      label = "Load templates and company context"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    },
    [ordered]@{
      key = "draft"
      label = "Build policy drafts"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    },
    [ordered]@{
      key = "rewrite"
      label = "Rewrite narrative and tailor content"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    },
    [ordered]@{
      key = "format"
      label = "Format and normalize policy bodies"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    },
    [ordered]@{
      key = "specificity"
      label = "Apply company-specific language and metadata"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    },
    [ordered]@{
      key = "orchestrator"
      label = "AI — Build company brief"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    },
    [ordered]@{
      key = "writer"
      label = "AI — Write company-specific policies"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    },
    [ordered]@{
      key = "critic"
      label = "AI — Score and review all policies"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    },
    [ordered]@{
      key = "rewriter"
      label = "AI — Fix flagged policies"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    },
    [ordered]@{
      key = "qa"
      label = "Run QA and finalize policy pack"
      status = "pending"
      note = ""
      started_at = ""
      completed_at = ""
    }
  )
}

function New-PolicyGenerationProgressSection {
  param([object]$Onboarding, [object[]]$TopRisks)

  return [ordered]@{
    template_status = "{0} extracted templates loaded; generation rules applied" -f (Get-TemplateInventory).Count
    framework_basis = Get-FrameworkBasisText -Onboarding $Onboarding
    top_risks_input = (@($TopRisks | ForEach-Object { $_.title }) -join ", ")
    generation_status = "Queued"
    generation_stage = ""
    generation_stage_note = ""
    generation_started_at = ""
    generation_completed_at = ""
    generation_last_error = ""
    generation_stages = New-PolicyGenerationStages
    policies = @()
    improvement_log = $null
    updatedAt = $null
  }
}

function Set-ObjectPropertyValue {
  param([object]$Object, [string]$Name, [object]$Value)

  if ($null -eq $Object) { return }

  if ($Object.PSObject.Properties[$Name]) {
    $Object.$Name = $Value
  } else {
    Add-Member -InputObject $Object -NotePropertyName $Name -NotePropertyValue $Value -Force
  }
}

function Ensure-PolicyGenerationSectionSchema {
  param([object]$Section)

  if ($null -eq $Section) { return $null }

  # Ordered hashtables expose keys via PSObject differently from PSCustomObjects.
  # Convert to PSCustomObject so PSObject.Properties checks work correctly and
  # ConvertTo-Json serialises all properties (not just the original hashtable keys).
  if ($Section -is [System.Collections.IDictionary]) {
    $Section = [PSCustomObject]$Section
  }

  if (-not $Section.PSObject.Properties["generation_status"]) {
    Set-ObjectPropertyValue -Object $Section -Name "generation_status" -Value "Not started"
  }
  if (-not $Section.PSObject.Properties["generation_stage"]) {
    Set-ObjectPropertyValue -Object $Section -Name "generation_stage" -Value ""
  }
  if (-not $Section.PSObject.Properties["generation_stage_note"]) {
    Set-ObjectPropertyValue -Object $Section -Name "generation_stage_note" -Value ""
  }
  if (-not $Section.PSObject.Properties["generation_started_at"]) {
    Set-ObjectPropertyValue -Object $Section -Name "generation_started_at" -Value ""
  }
  if (-not $Section.PSObject.Properties["generation_completed_at"]) {
    Set-ObjectPropertyValue -Object $Section -Name "generation_completed_at" -Value ""
  }
  if (-not $Section.PSObject.Properties["generation_last_error"]) {
    Set-ObjectPropertyValue -Object $Section -Name "generation_last_error" -Value ""
  }
  if (-not $Section.PSObject.Properties["generation_stages"] -or @($Section.generation_stages).Count -eq 0) {
    Set-ObjectPropertyValue -Object $Section -Name "generation_stages" -Value (New-PolicyGenerationStages)
  }
  if (-not $Section.PSObject.Properties["policies"]) {
    Set-ObjectPropertyValue -Object $Section -Name "policies" -Value @()
  }
  if (-not $Section.PSObject.Properties["improvement_log"]) {
    Set-ObjectPropertyValue -Object $Section -Name "improvement_log" -Value $null
  }

  return $Section
}

function Start-PolicyGenerationStage {
  param([object]$Section, [string]$StageKey, [string]$Note)

  $Section = Ensure-PolicyGenerationSectionSchema -Section $Section
  $timestamp = (Get-Date).ToString("o")
  if (-not [string]$Section.generation_started_at) {
    $Section.generation_started_at = $timestamp
  }
  $Section.generation_status = "In progress"
  $Section.generation_stage = $StageKey
  $Section.generation_stage_note = $Note
  $Section.generation_completed_at = ""
  $Section.generation_last_error = ""
  $Section.policies = @()

  $reachedActive = $false
  foreach ($stage in @($Section.generation_stages)) {
    if ([string]$stage.key -eq $StageKey) {
      $reachedActive = $true
      $stage.status = "in-progress"
      $stage.note = $Note
      if (-not [string]$stage.started_at) {
        $stage.started_at = $timestamp
      }
      $stage.completed_at = ""
      continue
    }

    if (-not $reachedActive) {
      if ([string]$stage.status -ne "complete") {
        $stage.status = "complete"
        if (-not [string]$stage.completed_at) {
          $stage.completed_at = $timestamp
        }
      }
      continue
    }

    if ([string]$stage.status -ne "complete") {
      $stage.status = "pending"
      $stage.note = ""
      $stage.started_at = ""
      $stage.completed_at = ""
    }
  }

  return $Section
}

function Complete-PolicyGenerationSection {
  param([object]$Section, [object[]]$Policies, [string]$Note)

  $Section = Ensure-PolicyGenerationSectionSchema -Section $Section
  $timestamp = (Get-Date).ToString("o")
  $Section.generation_status = "Completed"
  $Section.generation_stage = "qa"
  $Section.policies = @($Policies)
  $policyCount = @($Section.policies | Where-Object { $_ }).Count
  $Section.generation_stage_note = if ([string]::IsNullOrWhiteSpace([string]$Note)) {
    "{0} policies generated after draft, rewrite, formatting, and QA passes." -f $policyCount
  } else {
    ([string]$Note) -replace "^\d+\s+policies generated", ("{0} policies generated" -f $policyCount)
  }
  $Section.generation_completed_at = $timestamp
  $Section.generation_last_error = ""

  foreach ($stage in @($Section.generation_stages)) {
    $stage.status = "complete"
    if (-not [string]$stage.started_at) {
      $stage.started_at = $timestamp
    }
    if (-not [string]$stage.completed_at) {
      $stage.completed_at = $timestamp
    }
  }

  return $Section
}

function Fail-PolicyGenerationSection {
  param([object]$Section, [string]$Note)

  $Section = Ensure-PolicyGenerationSectionSchema -Section $Section
  $timestamp = (Get-Date).ToString("o")
  $Section.generation_status = "Failed"
  $Section.generation_stage_note = $Note
  $Section.generation_completed_at = $timestamp
  $Section.generation_last_error = $Note
  $Section.policies = @()

  foreach ($stage in @($Section.generation_stages)) {
    if ([string]$stage.status -eq "in-progress") {
      $stage.status = "failed"
      $stage.note = $Note
      break
    }
  }

  return $Section
}

function Test-PolicyGenerationInProgress {
  param([object]$Section)
  $Section = Ensure-PolicyGenerationSectionSchema -Section $Section
  if ([string]$Section.generation_status -ne "In progress") { return $false }
  # Treat as stale (dead worker) if in progress for more than 20 minutes
  $startedAt = [string]$Section.generation_started_at
  if ($startedAt) {
    try {
      $elapsed = (Get-Date) - [datetime]::Parse($startedAt)
      if ($elapsed.TotalMinutes -gt 20) { return $false }
    } catch {}
  }
  return $true
}

function Get-SectionPaths {
  param([string]$ClientId)
  $clientRoot = Join-Path $dataRoot $ClientId
  $paths = @{}
  foreach ($sectionKey in $sectionMeta.Keys) {
    $meta = $sectionMeta[$sectionKey]
    $folder = Join-Path $clientRoot $meta.Folder
    $file = Join-Path $folder $meta.File
    $paths[$sectionKey] = [ordered]@{ Root = $clientRoot; Folder = $folder; File = $file }
  }
  return $paths
}

function Save-JsonFile {
  param([string]$Path, [object]$Value)
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Path) | Out-Null
  $Value.updatedAt = (Get-Date).ToString("o")
  Set-Content -Path $Path -Encoding UTF8 -Value ($Value | ConvertTo-Json -Depth 100)
}

function Read-JsonFile {
  param([string]$Path, [object]$DefaultValue)
  if (-not (Test-Path $Path -PathType Leaf)) { return $DefaultValue }
  $raw = Get-Content -Path $Path -Raw
  if (-not $raw.Trim()) { return $DefaultValue }
  return $raw | ConvertFrom-Json
}

function New-DefaultVendorCatalog {
  return [ordered]@{
    version = 1
    vendors = @()
    updatedAt = $null
  }
}

function Get-VendorCatalog {
  $default = New-DefaultVendorCatalog
  $catalog = Read-JsonFile -Path $vendorCatalogPath -DefaultValue $default
  if (-not $catalog.vendors) {
    $catalog | Add-Member -NotePropertyName vendors -NotePropertyValue @() -Force
  }
  return $catalog
}

function Save-VendorCatalog {
  param([object]$Catalog)
  Save-JsonFile -Path $vendorCatalogPath -Value $Catalog
}

if (-not (Test-Path $vendorCatalogPath -PathType Leaf)) {
  Save-VendorCatalog -Catalog (New-DefaultVendorCatalog)
}

function Get-PromptRegistry {
  if (-not (Test-Path $promptRegistryPath -PathType Leaf)) {
    return [ordered]@{ version = $null; mode = "local-api"; prompts = @(); phase_bindings = @{} }
  }
  return Get-Content -Path $promptRegistryPath -Raw | ConvertFrom-Json
}

function Get-PromptMetadataList {
  $registry = Get-PromptRegistry
  $items = foreach ($prompt in @($registry.prompts)) {
    [ordered]@{
      id = $prompt.id
      name = $prompt.name
      category = $prompt.category
      purpose = $prompt.purpose
      phases = @($prompt.phases)
      apiPath = "/api/prompts/$($prompt.id)"
    }
  }

  return [ordered]@{
    version = $registry.version
    mode = $registry.mode
    description = $registry.description
    prompts = @($items)
    phaseBindings = $registry.phase_bindings
  }
}

function Get-PromptRecord {
  param([string]$PromptId)
  $registry = Get-PromptRegistry
  $prompt = @($registry.prompts) | Where-Object { $_.id -eq $PromptId } | Select-Object -First 1
  if (-not $prompt) { return $null }

  $relativePath = [string]$prompt.relative_path
  $resolvedPath = [System.IO.Path]::GetFullPath((Join-Path $scriptRoot $relativePath))
  if (-not $resolvedPath.StartsWith([System.IO.Path]::GetFullPath($promptRoot), [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Prompt path is outside the prompt root."
  }
  if (-not (Test-Path $resolvedPath -PathType Leaf)) {
    throw "Prompt file not found."
  }

  return [ordered]@{
    id = $prompt.id
    name = $prompt.name
    category = $prompt.category
    purpose = $prompt.purpose
    phases = @($prompt.phases)
    relative_path = $relativePath
    content = Get-Content -Path $resolvedPath -Raw
  }
}

function Ensure-ClientWorkspace {
  param([string]$CompanyName)
  $clientId = ConvertTo-SafeFolderName -Name $CompanyName
  $paths = Get-SectionPaths -ClientId $clientId
  $clientDocumentsPath = Join-Path $paths["onboarding"].Root "Client Documents"
  foreach ($sectionKey in $sectionMeta.Keys) {
    $sectionPath = $paths[$sectionKey]
    New-Item -ItemType Directory -Force -Path $sectionPath.Folder | Out-Null
    if (-not (Test-Path $sectionPath.File -PathType Leaf)) {
      Save-JsonFile -Path $sectionPath.File -Value (New-DefaultSection -SectionKey $sectionKey -ClientId $clientId -CompanyName $CompanyName)
    }
  }
  New-Item -ItemType Directory -Force -Path $clientDocumentsPath | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $exportsRoot $clientId) | Out-Null
  return $clientId
}

function Get-OnboardingComparableObject {
  param([object]$Onboarding)

  if ($null -eq $Onboarding) {
    return [ordered]@{}
  }

  $excluded = @("updatedAt", "reprocessing_required", "change_notice", "downstream_reset_at", "last_processed_at")
  $result = [ordered]@{}
  foreach ($property in $Onboarding.PSObject.Properties.Name) {
    if ($excluded -contains $property) { continue }
    $result[$property] = $Onboarding.$property
  }
  return $result
}

function Test-OnboardingMaterialChange {
  param([object]$Before, [object]$After)

  $beforeJson = (Get-OnboardingComparableObject -Onboarding $Before) | ConvertTo-Json -Depth 50
  $afterJson = (Get-OnboardingComparableObject -Onboarding $After) | ConvertTo-Json -Depth 50
  return [string]$beforeJson -ne [string]$afterJson
}

function Reset-DownstreamWorkflow {
  param([string]$ClientId, [string]$CompanyName)

  $paths = Get-SectionPaths -ClientId $ClientId
  foreach ($sectionKey in @("policy-generation", "policy-qa", "policy-summary", "risk-assessment", "risk-qa", "vendor-risk", "vendor-qa", "control-mapping", "audit-qa", "output")) {
    Save-JsonFile -Path $paths[$sectionKey].File -Value (New-DefaultSection -SectionKey $sectionKey -ClientId $ClientId -CompanyName $CompanyName)
  }
}

function Get-ClientAggregate {
  param([string]$ClientId)
  $paths = Get-SectionPaths -ClientId $ClientId
  $aggregate = [ordered]@{}
  $stats = [ordered]@{ policyCount = 0; riskCount = 0; vendorCount = 0; controlCount = 0; auditFindingCount = 0 }
  $latestUpdated = @()

  foreach ($sectionKey in $sectionMeta.Keys) {
    $meta = $sectionMeta[$sectionKey]
    $sectionData = Read-JsonFile -Path $paths[$sectionKey].File -DefaultValue (New-DefaultSection -SectionKey $sectionKey -ClientId $ClientId -CompanyName $ClientId)
    $aggregate[$meta.Property] = $sectionData
    if ($meta.CountKey) {
      $stats[$meta.CountKey] = @($sectionData.($meta.Collection)).Count
    }
    if ($sectionData.updatedAt) { $latestUpdated += $sectionData.updatedAt }
  }

  if (-not (Test-PoliciesApproved -Policies @($aggregate.policyGeneration.policies))) {
    $stats.riskCount = 0
    $stats.vendorCount = 0
    $stats.controlCount = 0
    $stats.auditFindingCount = 0
  }

  $companyName = if ($aggregate.onboarding.legal_entity) { $aggregate.onboarding.legal_entity } else { $ClientId }
  $aggregate["client"] = [ordered]@{
    id = $ClientId
    companyName = $companyName
    folderPath = $paths["onboarding"].Root
    stats = $stats
    updatedAt = $latestUpdated | Sort-Object -Descending | Select-Object -First 1
  }

  return $aggregate
}

function Get-Clients {
  $directories = Get-ChildItem -Path $dataRoot -Directory -Force -ErrorAction SilentlyContinue | Sort-Object Name
  $clients = foreach ($directory in $directories) { (Get-ClientAggregate -ClientId $directory.Name).client }
  return @($clients)
}

function Initialize-VendorCatalogFromExistingData {
  $catalog = Get-VendorCatalog
  if (@($catalog.vendors).Count -gt 0) { return }

  $seedRecords = @()
  foreach ($directory in @(Get-ChildItem -Path $dataRoot -Directory -Force -ErrorAction SilentlyContinue)) {
    $paths = Get-SectionPaths -ClientId $directory.Name
    $onboarding = Read-JsonFile -Path $paths["onboarding"].File -DefaultValue $null
    $vendorRisk = Read-JsonFile -Path $paths["vendor-risk"].File -DefaultValue $null
    if ($onboarding -and $onboarding.vendors) {
      $seedRecords += @($onboarding.vendors)
    }
    if ($vendorRisk -and $vendorRisk.vendors) {
      $seedRecords += @($vendorRisk.vendors)
    }
  }

  if ($seedRecords.Count -gt 0) {
    Update-VendorCatalog -VendorRecords $seedRecords | Out-Null
  }
}

function ConvertTo-BodyObject {
  param([string]$Body)
  if (-not $Body) { return @{} }
  try { return $Body | ConvertFrom-Json } catch { return @{} }
}

function Split-TextList {
  param([string]$Value)
  if (-not $Value) { return @() }
  return @(
    ($Value -replace "`r", "`n") -split "[,\n]" |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ }
  )
}

function Get-VendorNormalizedName {
  param([string]$Value)
  return (([string]$Value -replace "[^a-zA-Z0-9]+", " ").Trim()).ToLowerInvariant()
}

function Get-VendorCatalogMatch {
  param([string]$VendorName, [object]$Catalog = $null)

  if ($null -eq $Catalog) {
    $Catalog = Get-VendorCatalog
  }

  $target = Get-VendorNormalizedName -Value $VendorName
  if (-not $target) { return $null }

  foreach ($vendor in @($Catalog.vendors)) {
    if ((Get-VendorNormalizedName -Value ([string]$vendor.vendor_name)) -eq $target) {
      return $vendor
    }
    foreach ($alias in @($vendor.aliases)) {
      if ((Get-VendorNormalizedName -Value ([string]$alias)) -eq $target) {
        return $vendor
      }
    }
  }

  return $null
}

function ConvertTo-VendorCatalogEntry {
  param([object]$Vendor)

  $vendorName = [string]$Vendor.vendor_name
  if ([string]::IsNullOrWhiteSpace($vendorName)) { return $null }

  $existingMetadata = @()
  foreach ($candidate in @(
    [string]$Vendor.business_function,
    [string]$Vendor.access_level,
    [string]$Vendor.criticality,
    [string]$Vendor.certifications,
    [string]$Vendor.location,
    [string]$Vendor.service_category,
    [string]$Vendor.known_services
  )) {
    if (-not [string]::IsNullOrWhiteSpace($candidate)) {
      $existingMetadata += $candidate.Trim()
    }
  }

  return [ordered]@{
    vendor_name = $vendorName
    vendor_description = [string]$Vendor.vendor_description
    service_category = [string]$Vendor.service_category
    known_services = [string]$Vendor.known_services
    website = [string]$Vendor.website
    aliases = @(
      @([string]$Vendor.vendor_name, [string]$Vendor.display_name, [string]$Vendor.aliases -split "[,\n]") |
        Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } |
        ForEach-Object { $_.Trim() } |
        Select-Object -Unique
    )
    metadata = @($existingMetadata | Select-Object -Unique)
    usage_count = 1
    last_used_at = (Get-Date).ToString("o")
  }
}

function Update-VendorCatalog {
  param([object[]]$VendorRecords)

  $catalog = Get-VendorCatalog
  $vendors = New-Object System.Collections.ArrayList
  foreach ($existing in @($catalog.vendors)) {
    [void]$vendors.Add([ordered]@{
      vendor_name = [string]$existing.vendor_name
      vendor_description = [string]$existing.vendor_description
      service_category = [string]$existing.service_category
      known_services = [string]$existing.known_services
      website = [string]$existing.website
      aliases = @($existing.aliases)
      metadata = @($existing.metadata)
      usage_count = if ($existing.usage_count) { [int]$existing.usage_count } else { 0 }
      last_used_at = [string]$existing.last_used_at
    })
  }

  foreach ($vendor in @($VendorRecords)) {
    $entry = ConvertTo-VendorCatalogEntry -Vendor $vendor
    if ($null -eq $entry) { continue }

    $normalized = Get-VendorNormalizedName -Value $entry.vendor_name
    $match = @($vendors | Where-Object { (Get-VendorNormalizedName -Value ([string]$_.vendor_name)) -eq $normalized } | Select-Object -First 1)
    if ($match.Count -eq 0) {
      [void]$vendors.Add($entry)
      continue
    }

    $current = $match[0]
    if (-not [string]::IsNullOrWhiteSpace([string]$entry.vendor_description)) {
      $current.vendor_description = [string]$entry.vendor_description
    }
    if (-not [string]::IsNullOrWhiteSpace([string]$entry.service_category)) {
      $current.service_category = [string]$entry.service_category
    }
    if (-not [string]::IsNullOrWhiteSpace([string]$entry.known_services)) {
      $current.known_services = [string]$entry.known_services
    }
    if (-not [string]::IsNullOrWhiteSpace([string]$entry.website)) {
      $current.website = [string]$entry.website
    }
    $current.aliases = @(@($current.aliases) + @($entry.aliases) | Where-Object { $_ } | Select-Object -Unique)
    $current.metadata = @(@($current.metadata) + @($entry.metadata) | Where-Object { $_ } | Select-Object -Unique)
    $current.usage_count = ([int]$current.usage_count) + 1
    $current.last_used_at = (Get-Date).ToString("o")
  }

  $catalog.vendors = @(
    $vendors |
      Sort-Object @{ Expression = { [int]$_.usage_count }; Descending = $true }, @{ Expression = { [string]$_.vendor_name }; Descending = $false }
  )
  Save-VendorCatalog -Catalog $catalog
  return $catalog
}

function Get-ClientUsersFromOnboarding {
  param([object]$Onboarding)
  if ($Onboarding.client_user_records -and @($Onboarding.client_user_records).Count -gt 0) {
    $users = @()
    $index = 1
    foreach ($record in @($Onboarding.client_user_records)) {
      $name = [string]$record.name
      if ([string]::IsNullOrWhiteSpace($name)) { continue }
      $users += [ordered]@{
        user_id = "USR-{0}" -f $index.ToString("000")
        name = $name.Trim()
        email = ([string]$record.email).Trim()
        designation = ([string]$record.designation).Trim()
      }
      $index++
    }
    if ($users.Count -gt 0) {
      return @($users)
    }
  }

  $rawValue = if ([string]$Onboarding.client_users) { [string]$Onboarding.client_users } else { [string]$Onboarding.client_usernames }
  if (-not $rawValue) { return @() }

  $users = @()
  $index = 1
  foreach ($line in (($rawValue -replace "`r", "") -split "`n")) {
    $entry = $line.Trim()
    if (-not $entry) { continue }
    $parts = $entry -split "\|"
    $name = if ($parts.Count -gt 0) { $parts[0].Trim() } else { "" }
    $email = if ($parts.Count -gt 1) { $parts[1].Trim() } else { "" }
    $designation = if ($parts.Count -gt 2) { $parts[2].Trim() } else { "" }
    if (-not $name) { continue }
    $users += [ordered]@{
      user_id = "USR-{0}" -f $index.ToString("000")
      name = $name
      email = $email
      designation = $designation
    }
    $index++
  }

  return @($users)
}

function Get-ClientUsernamesFromOnboarding {
  param([object]$Onboarding)
  $names = New-Object System.Collections.ArrayList
  foreach ($user in @(Get-ClientUsersFromOnboarding -Onboarding $Onboarding)) {
    $name = ([string]$user.name).Trim()
    if (-not [string]::IsNullOrWhiteSpace($name)) {
      [void]$names.Add($name)
    }
  }
  return @($names | Select-Object -Unique)
}

function Get-ClientDocumentsPath {
  param([string]$ClientId)
  return (Join-Path (Join-Path $dataRoot $ClientId) "Client Documents")
}

function Get-ClientExportsPath {
  param([string]$ClientId)
  return (Join-Path $exportsRoot $ClientId)
}

function Write-AuditLogEntry {
  param([string]$ClientId, [string]$EventType, [object]$Payload)

  $clientLogRoot = Join-Path $auditLogsRoot $ClientId
  New-Item -ItemType Directory -Force -Path $clientLogRoot | Out-Null
  $logPath = Join-Path $clientLogRoot "activity.log"
  $entry = [ordered]@{
    timestamp = (Get-Date).ToString("o")
    event_type = $EventType
    payload = $Payload
  }
  Add-Content -Path $logPath -Encoding UTF8 -Value (($entry | ConvertTo-Json -Depth 20 -Compress))
}

function Get-PolicyContentSignature {
  param([object]$Policy)
  return (
    @(
      [string]$Policy.name
      [string]$Policy.framework_mapping
      [string]$Policy.linked_risks
      [string]$Policy.linked_controls
      [string]$Policy.executive_summary
      [string]$Policy.table_of_contents
      [string]$Policy.body
    ) -join "||"
  )
}

function Get-NextPolicyVersion {
  param([string]$Version)
  if (-not $Version) { return "v1.0" }

  $trimmed = $Version.Trim()
  if ($trimmed -match "^v?(\d+)\.(\d+)$") {
    return "v{0}.{1}" -f $matches[1], ([int]$matches[2] + 1)
  }
  if ($trimmed -match "^v?(\d+)$") {
    return "v{0}.1" -f $matches[1]
  }
  return "v1.0"
}

function Add-PolicyHistoryEntry {
  param([string]$History, [string]$Message, [string]$Timestamp)
  $entry = "[{0}] {1}" -f $Timestamp, $Message
  if ([string]::IsNullOrWhiteSpace($History)) { return $entry }
  return "{0}`n{1}" -f $History.TrimEnd(), $entry
}

function Apply-PolicyGovernance {
  param([object[]]$CurrentPolicies, [object[]]$IncomingPolicies, [object]$Onboarding)

  $currentById = @{}
  foreach ($policy in @($CurrentPolicies)) {
    if ($policy -and [string]$policy.policy_id) {
      $currentById[[string]$policy.policy_id] = $policy
    }
  }

  $approvedUsers = Get-ClientUsernamesFromOnboarding -Onboarding $Onboarding
  $normalized = @()

  foreach ($incoming in @($IncomingPolicies)) {
    if (-not $incoming) { continue }
    $policyId = [string]$incoming.policy_id
    if (-not $policyId) { continue }

    $current = if ($currentById.ContainsKey($policyId)) { $currentById[$policyId] } else { $null }
    $timestamp = (Get-Date).ToString("o")
    $history = if ([string]$incoming.approval_history_text) { [string]$incoming.approval_history_text } elseif ($current) { [string]$current.approval_history_text } else { "" }
    $version = if ([string]$incoming.policy_version) { [string]$incoming.policy_version } elseif ($current) { [string]$current.policy_version } else { "v1.0" }
    $policyOwner = if ([string]$incoming.policy_owner) { [string]$incoming.policy_owner } elseif ($current) { [string]$current.policy_owner } else { "" }
    if (-not $policyOwner -and $approvedUsers.Count -gt 0) { $policyOwner = $approvedUsers[0] }
    $signOffBy = if ([string]$incoming.sign_off_by) { [string]$incoming.sign_off_by } elseif ($current) { [string]$current.sign_off_by } else { "" }
    $genericFrameworkMapping = (Get-FrameworkLabels -Onboarding $Onboarding) -join ", "
    $frameworkMapping = if ([string]$incoming.framework_mapping) { [string]$incoming.framework_mapping } elseif ($current) { [string]$current.framework_mapping } else { "" }
    if (-not $frameworkMapping -or $frameworkMapping -eq $genericFrameworkMapping) {
      $frameworkMapping = (Get-PolicyFrameworkMappings -PolicyName ([string]$incoming.name) -Onboarding $Onboarding) -join ", "
    }
    if (-not $signOffBy) {
      if ($approvedUsers.Count -gt 1) {
        $signOffBy = $approvedUsers[1]
      } elseif ($approvedUsers.Count -gt 0) {
        $signOffBy = $approvedUsers[0]
      }
    }

    $published = if (Test-ToggleEnabled -Value $incoming.published) { "Yes" } else { "No" }
    $signedOff = if (Test-ToggleEnabled -Value $incoming.sign_off_complete) { "Yes" } else { "No" }
    $publishedBy = if ([string]$incoming.published_by) { [string]$incoming.published_by } elseif ($current) { [string]$current.published_by } else { "" }
    $publishedAt = if ([string]$incoming.published_at) { [string]$incoming.published_at } elseif ($current) { [string]$current.published_at } else { "" }
    $signOffCompletedBy = if ([string]$incoming.sign_off_completed_by) { [string]$incoming.sign_off_completed_by } elseif ($current) { [string]$current.sign_off_completed_by } else { "" }
    $signOffCompletedAt = if ([string]$incoming.sign_off_completed_at) { [string]$incoming.sign_off_completed_at } elseif ($current) { [string]$current.sign_off_completed_at } else { "" }
    $materialChanged = $false

    if (-not $current) {
      $history = Add-PolicyHistoryEntry -History $history -Message "Policy generated from stored template and onboarding inputs." -Timestamp $timestamp
    } elseif ((Get-PolicyContentSignature -Policy $current) -ne (Get-PolicyContentSignature -Policy $incoming)) {
      $materialChanged = $true
      $version = Get-NextPolicyVersion -Version $version
      $history = Add-PolicyHistoryEntry -History $history -Message ("Material policy content changed. Version advanced to {0} and approvals reset." -f $version) -Timestamp $timestamp
      $published = "No"
      $signedOff = "No"
      $publishedBy = ""
      $publishedAt = ""
      $signOffCompletedBy = ""
      $signOffCompletedAt = ""
    }

    if ($published -eq "Yes") {
      if (-not ($current -and (Test-ToggleEnabled -Value $current.published)) -or [string]::IsNullOrWhiteSpace($publishedAt)) {
        $publishedAt = $timestamp
        $publishedBy = if ($policyOwner) { $policyOwner } else { $publishedBy }
        $publishedActor = if ($publishedBy) { $publishedBy } else { "Unassigned owner" }
        $history = Add-PolicyHistoryEntry -History $history -Message ("Published by {0}." -f $publishedActor) -Timestamp $timestamp
      }
    } else {
      if ($current -and (Test-ToggleEnabled -Value $current.published) -and -not $materialChanged) {
        $history = Add-PolicyHistoryEntry -History $history -Message "Publication state cleared." -Timestamp $timestamp
      }
      $publishedBy = ""
      $publishedAt = ""
    }

    if ($signedOff -eq "Yes" -and $published -eq "Yes") {
      if (-not ($current -and (Test-ToggleEnabled -Value $current.sign_off_complete)) -or [string]::IsNullOrWhiteSpace($signOffCompletedAt)) {
        $signOffCompletedAt = $timestamp
        $signOffCompletedBy = if ($signOffBy) { $signOffBy } else { $signOffCompletedBy }
        $signOffActor = if ($signOffCompletedBy) { $signOffCompletedBy } else { "Unassigned approver" }
        $history = Add-PolicyHistoryEntry -History $history -Message ("Signed off by {0}." -f $signOffActor) -Timestamp $timestamp
      }
    } else {
      if ($current -and (Test-ToggleEnabled -Value $current.sign_off_complete) -and -not $materialChanged) {
        $history = Add-PolicyHistoryEntry -History $history -Message "Sign-off state cleared." -Timestamp $timestamp
      }
      $signedOff = "No"
      $signOffCompletedBy = ""
      $signOffCompletedAt = ""
    }

    $normalized += [ordered]@{
      policy_id = $policyId
      name = [string]$incoming.name
      policy_owner = $policyOwner
      sign_off_by = $signOffBy
      policy_version = if ($version) { $version } else { "v1.0" }
      published = $published
      published_by = $publishedBy
      published_at = $publishedAt
      sign_off_complete = $signedOff
      sign_off_completed_by = $signOffCompletedBy
      sign_off_completed_at = $signOffCompletedAt
      framework_mapping = $frameworkMapping
      linked_risks = [string]$incoming.linked_risks
      linked_controls = [string]$incoming.linked_controls
      executive_summary = [string]$incoming.executive_summary
      table_of_contents = [string]$incoming.table_of_contents
      body = [string]$incoming.body
      approval_history_text = $history
    }
  }

  return @($normalized)
}

function Test-ToggleEnabled {
  param([object]$Value)
  return @("yes", "true", "1", "signed", "signed off", "published") -contains ([string]$Value).Trim().ToLowerInvariant()
}

function Test-PoliciesApproved {
  param([object[]]$Policies)

  $policyList = @($Policies | Where-Object { $_ -and (([string]$_.policy_id) -or ([string]$_.name) -or ([string]$_.body)) })
  if ($policyList.Count -eq 0) {
    return $false
  }

  foreach ($policy in $policyList) {
    if (-not (Test-ToggleEnabled -Value $policy.published) -or -not (Test-ToggleEnabled -Value $policy.sign_off_complete)) {
      return $false
    }
  }

  return $true
}

function Get-ComparableName {
  param([string]$Value)
  if (-not $Value) { return "" }
  return (($Value -replace "[^a-zA-Z0-9]+", " ").Trim()).ToLowerInvariant()
}

function Get-TemplateManifest {
  $manifestPath = Join-Path $templateCacheRoot "manifest.json"
  if (-not (Test-Path $manifestPath -PathType Leaf)) { return @() }

  try {
    return @(Get-Content -Path $manifestPath -Raw | ConvertFrom-Json)
  } catch {
    return @()
  }
}

function Get-TemplateInventory {
  $manifest = Get-TemplateManifest
  if ($manifest.Count -gt 0) {
    return @($manifest | Sort-Object template_name | ForEach-Object { [string]$_.template_name })
  }
  if (-not (Test-Path $policyTemplateRoot -PathType Container)) { return @() }
  return @(
    Get-ChildItem -Path $policyTemplateRoot -File -Filter *.pdf |
      Sort-Object Name |
      ForEach-Object { $_.BaseName }
  )
}

function Get-TemplateRecord {
  param([string]$TemplateName)

  $manifest = Get-TemplateManifest
  if ($manifest.Count -eq 0) { return $null }

  $target = Get-ComparableName -Value $TemplateName
  return @($manifest | Where-Object { (Get-ComparableName -Value ([string]$_.template_name)) -eq $target } | Select-Object -First 1)
}

function Get-TemplateText {
  param([string]$TemplateName)

  $record = Get-TemplateRecord -TemplateName $TemplateName
  if (-not $record) { return "" }

  $textPath = [string]$record.text_file
  if (-not $textPath -or -not (Test-Path $textPath -PathType Leaf)) { return "" }
  return Get-Content -Path $textPath -Raw
}

function Get-PolicyGenerationRulesText {
  if (-not (Test-Path $policyGenerationRulesPath -PathType Leaf)) { return "" }
  return Get-Content -Path $policyGenerationRulesPath -Raw
}

function Get-PolicyGenerationProfile {
  param([string]$RulesText)

  $text = if ($RulesText) { $RulesText } else { "" }
  return [ordered]@{
    ExecutiveSummaryMaxChars = if ($text -match "(?i)600\s*characters") { 600 } else { 600 }
    BodyMaxWords = if ($text -match "(?i)600\s*words") { 600 } else { 600 }
    PreferBullets = $text -match "(?i)bullet"
    HideFrameworkIdsInPolicy = $true
  }
}

function Split-ProviderNames {
  param([string]$Value)
  if (-not $Value) { return @() }

  $stopWords = @("na", "n a", "none", "unknown", "internal", "self hosted", "self-hosted", "multiple", "various", "other")
  $parts = ($Value -replace "(?i)\band\b", ",") -split "[,;/\n|]"
  $results = @()
  foreach ($part in $parts) {
    $name = ($part -replace "\(.+?\)", "").Trim()
    $normalized = (($name -replace "[^a-zA-Z0-9]+", " ").Trim()).ToLowerInvariant()
    if ($name -and $name.Length -gt 1 -and ($stopWords -notcontains $normalized)) {
      $results += $name
    }
  }
  return @($results | Select-Object -Unique)
}

function Get-FrameworkLabels {
  param([object]$Onboarding)
  switch ([string]$Onboarding.framework_selection) {
    "SOC2" { return @("SOC 2 Trust Services Criteria") }
    "ISO" { return @("ISO 27001 clauses and Annex A") }
    "Both" { return @("SOC 2 Trust Services Criteria", "ISO 27001 clauses and Annex A") }
    default { return @("Framework selection pending") }
  }
}

function Get-IsoFrameworkRequirements {
  if (-not (Test-Path $isoFrameworkCachePath -PathType Leaf)) { return @() }

  try {
    $cache = Get-Content -Path $isoFrameworkCachePath -Raw | ConvertFrom-Json
    return @($cache.requirements)
  } catch {
    return @()
  }
}

function Get-PolicyFrameworkKeywords {
  param([string]$PolicyName)

  $normalized = ([string]$PolicyName).ToLowerInvariant()
  $keywords = @(
    ($normalized -split "[^a-z0-9]+" | Where-Object { $_ -and $_.Length -ge 3 })
  )

  switch -Wildcard ($normalized) {
    "*access*" { $keywords += @("access", "authentication", "identity", "privileged") }
    "*password*" { $keywords += @("authentication", "credential", "identity") }
    "*vendor*" { $keywords += @("vendor", "supplier", "third-party", "external") }
    "*incident*" { $keywords += @("incident", "response", "breach", "detection") }
    "*logging*" { $keywords += @("monitoring", "logging", "audit", "alert") }
    "*backup*" { $keywords += @("backup", "restore", "continuity", "recovery") }
    "*disaster*" { $keywords += @("continuity", "recovery", "availability", "backup") }
    "*business continuity*" { $keywords += @("continuity", "recovery", "availability") }
    "*risk*" { $keywords += @("risk", "assessment", "treatment") }
    "*change*" { $keywords += @("change", "release", "deployment", "approval") }
    "*release*" { $keywords += @("change", "release", "deployment") }
    "*encryption*" { $keywords += @("encryption", "cryptographic", "key", "confidentiality") }
    "*crypto*" { $keywords += @("encryption", "cryptographic", "key") }
    "*privacy*" { $keywords += @("privacy", "personal", "data", "retention") }
    "*classification*" { $keywords += @("classification", "labeling", "handling", "data") }
    "*data*" { $keywords += @("data", "handling", "retention", "privacy") }
    "*training*" { $keywords += @("awareness", "training", "competence") }
    "*hr*" { $keywords += @("personnel", "screening", "employment") }
    "*background*" { $keywords += @("screening", "personnel", "employment") }
    "*remote*" { $keywords += @("remote", "access", "endpoint") }
    "*byod*" { $keywords += @("mobile", "device", "endpoint", "access") }
    "*secure sdlc*" { $keywords += @("development", "secure", "testing", "change") }
    "*vulnerability*" { $keywords += @("vulnerability", "patch", "remediation", "hardening") }
    "*patch*" { $keywords += @("patch", "vulnerability", "remediation") }
    "*compliance*" { $keywords += @("compliance", "obligation", "regulatory", "review") }
  }

  return @($keywords | Select-Object -Unique)
}

function Get-IsoMappingsForPolicyName {
  param([string]$PolicyName)

  $requirements = Get-IsoFrameworkRequirements
  if ($requirements.Count -eq 0) { return @("ISO 27001 clauses and Annex A") }

  $keywords = Get-PolicyFrameworkKeywords -PolicyName $PolicyName
  $scored = foreach ($requirement in $requirements) {
    $score = 0
    $searchText = ([string]$requirement.search_text).ToLowerInvariant()
    foreach ($keyword in $keywords) {
      if ($keyword -and $searchText.Contains($keyword.ToLowerInvariant())) {
        $score++
      }
    }
    if ($score -gt 0) {
      [ordered]@{
        score = $score
        identifier = [string]$requirement.identifier
        label = [string]$requirement.control_descriptive
      }
    }
  }

  $topMatches = @(
    $scored |
      Sort-Object -Property @{ Expression = "score"; Descending = $true }, @{ Expression = "identifier"; Descending = $false } |
      Select-Object -First 3
  )
  if ($topMatches.Count -eq 0) { return @("ISO 27001 clauses and Annex A") }
  return @($topMatches | ForEach-Object { "ISO 27001 {0} - {1}" -f $_.identifier, $_.label } | Select-Object -Unique)
}

function Get-Soc2MappingsForPolicyName {
  param([string]$PolicyName)

  $normalized = ([string]$PolicyName).ToLowerInvariant()
  switch -Wildcard ($normalized) {
    "*access*" { return @("SOC 2 CC6.1", "SOC 2 CC6.2", "SOC 2 CC6.3") }
    "*password*" { return @("SOC 2 CC6.1", "SOC 2 CC6.2") }
    "*authentication*" { return @("SOC 2 CC6.1", "SOC 2 CC6.2") }
    "*vendor*" { return @("SOC 2 CC9.2", "SOC 2 CC9.3") }
    "*incident*" { return @("SOC 2 CC7.4", "SOC 2 CC7.5") }
    "*logging*" { return @("SOC 2 CC7.2", "SOC 2 CC7.3") }
    "*monitoring*" { return @("SOC 2 CC7.2", "SOC 2 CC7.3") }
    "*backup*" { return @("SOC 2 A1.2", "SOC 2 A1.3") }
    "*disaster*" { return @("SOC 2 A1.2", "SOC 2 A1.3") }
    "*continuity*" { return @("SOC 2 A1.2", "SOC 2 A1.3") }
    "*change*" { return @("SOC 2 CC8.1") }
    "*release*" { return @("SOC 2 CC8.1") }
    "*secure sdlc*" { return @("SOC 2 CC8.1") }
    "*vulnerability*" { return @("SOC 2 CC7.1", "SOC 2 CC7.2") }
    "*patch*" { return @("SOC 2 CC7.1", "SOC 2 CC7.2") }
    "*encryption*" { return @("SOC 2 CC6.7", "SOC 2 C1.1") }
    "*privacy*" { return @("SOC 2 P1.1", "SOC 2 P2.1") }
    "*classification*" { return @("SOC 2 C1.1", "SOC 2 CC6.7") }
    "*data*" { return @("SOC 2 C1.1", "SOC 2 CC6.7") }
    "*risk*" { return @("SOC 2 CC3.2", "SOC 2 CC3.3") }
    "*training*" { return @("SOC 2 CC2.2") }
    "*compliance*" { return @("SOC 2 CC1.5", "SOC 2 CC3.2") }
    default { return @("SOC 2 CC1.1", "SOC 2 CC3.2") }
  }
}

function Get-PolicyFrameworkMappings {
  param([string]$PolicyName, [object]$Onboarding)

  $selection = [string]$Onboarding.framework_selection
  $mappings = @()
  switch ($selection) {
    "SOC2" {
      $mappings += Get-Soc2MappingsForPolicyName -PolicyName $PolicyName
    }
    "ISO" {
      $mappings += Get-IsoMappingsForPolicyName -PolicyName $PolicyName
    }
    "Both" {
      $mappings += Get-Soc2MappingsForPolicyName -PolicyName $PolicyName
      $mappings += Get-IsoMappingsForPolicyName -PolicyName $PolicyName
    }
  }

  if ($mappings.Count -eq 0) {
    return Get-FrameworkLabels -Onboarding $Onboarding
  }
  return @($mappings | Select-Object -Unique)
}

function Get-FrameworkBasisText {
  param([object]$Onboarding)
  switch ([string]$Onboarding.framework_selection) {
    "SOC2" { return "SOC 2 mapping based on the stored DB Agent working basis and relevant Trust Services Criteria coverage." }
    "ISO" { return "ISO 27001 mapping based on the stored workbook at $isoFrameworkPath and a local extracted cache of $((Get-IsoFrameworkRequirements).Count) requirements." }
    "Both" { return "Combined mapping using the stored ISO 27001 workbook/cache and the DB Agent SOC 2 working basis." }
    default { return "Framework selection pending." }
  }
}

function Add-DerivedRisk {
  param([System.Collections.ArrayList]$List, [string]$Title, [string]$Reason)
  if (-not ($List | Where-Object { $_.title -eq $Title })) {
    [void]$List.Add([ordered]@{ title = $Title; reason = $Reason })
  }
}

function Get-DerivedVendorCandidates {
  param([object]$Onboarding)

  $catalog = Get-VendorCatalog
  $seeds = @(
    [ordered]@{
      Source = [string]$Onboarding.cloud_providers
      Purpose = "Cloud hosting or infrastructure services"
      BusinessFunction = "Infrastructure"
      AccessLevel = "Production infrastructure access"
      Criticality = "High"
    },
    [ordered]@{
      Source = [string]$Onboarding.identity_provider
      Purpose = "Identity and authentication services"
      BusinessFunction = "Identity and access management"
      AccessLevel = "Authentication and workforce access"
      Criticality = "High"
    }
  )

  $seen = @{}
  $candidates = @()
  $dataAccessed = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.data_types)) { "To be confirmed" } else { [string]$Onboarding.data_types }
  $location = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.storage_regions)) { "To be confirmed" } else { [string]$Onboarding.storage_regions }

  foreach ($manualVendor in @($Onboarding.vendors)) {
    $vendorName = [string]$manualVendor.vendor_name
    $key = Get-VendorNormalizedName -Value $vendorName
    if (-not $key -or $seen.ContainsKey($key)) { continue }
    $seen[$key] = $true
    $catalogMatch = Get-VendorCatalogMatch -VendorName $vendorName -Catalog $catalog
    $candidates += [ordered]@{
      vendor_id = if ([string]::IsNullOrWhiteSpace([string]$manualVendor.vendor_id)) { "ONB-{0}" -f (($candidates.Count + 1).ToString("000")) } else { [string]$manualVendor.vendor_id }
      vendor_name = if ($catalogMatch) { [string]$catalogMatch.vendor_name } else { $vendorName }
      vendor_description = if (-not [string]::IsNullOrWhiteSpace([string]$manualVendor.vendor_description)) { [string]$manualVendor.vendor_description } elseif ($catalogMatch) { [string]$catalogMatch.vendor_description } else { "" }
      purpose = [string]$manualVendor.purpose
      business_function = if (-not [string]::IsNullOrWhiteSpace([string]$manualVendor.business_function)) { [string]$manualVendor.business_function } elseif ($catalogMatch) { [string]$catalogMatch.service_category } else { "Third-party service" }
      access_level = if (-not [string]::IsNullOrWhiteSpace([string]$manualVendor.access_level)) { [string]$manualVendor.access_level } else { "To be confirmed" }
      data_accessed = if (-not [string]::IsNullOrWhiteSpace([string]$manualVendor.data_accessed)) { [string]$manualVendor.data_accessed } else { $dataAccessed }
      criticality = if (-not [string]::IsNullOrWhiteSpace([string]$manualVendor.criticality)) { [string]$manualVendor.criticality } else { "Medium" }
      certifications = if (-not [string]::IsNullOrWhiteSpace([string]$manualVendor.certifications)) { [string]$manualVendor.certifications } else { "" }
      location = if (-not [string]::IsNullOrWhiteSpace([string]$manualVendor.location)) { [string]$manualVendor.location } else { $location }
      service_category = if ($catalogMatch) { [string]$catalogMatch.service_category } else { [string]$manualVendor.service_category }
      known_services = if ($catalogMatch) { [string]$catalogMatch.known_services } else { [string]$manualVendor.known_services }
      website = if ($catalogMatch) { [string]$catalogMatch.website } else { [string]$manualVendor.website }
      # Client-specific intelligence fields (from structured onboarding questions)
      stores_processes_data         = [string]$manualVendor.stores_processes_data
      data_types_handled            = [string]$manualVendor.data_types_handled
      access_level_detail           = [string]$manualVendor.access_level_detail
      business_impact               = [string]$manualVendor.business_impact
      has_contract                  = [string]$manualVendor.has_contract
      has_dpa                       = [string]$manualVendor.has_dpa
      vendor_certifications_confirmed = [string]$manualVendor.vendor_certifications_confirmed
      inherent_risk = ""
      residual_risk = ""
      treatment_plan = ""
      linked_risks = ""
      linked_controls = ""
    }
  }

  if ($candidates.Count -gt 0) {
    return @($candidates)
  }

  for ($seedIndex = 0; $seedIndex -lt $seeds.Count; $seedIndex++) {
    $seed = $seeds[$seedIndex]
    $providerNames = Split-ProviderNames -Value $seed.Source
    for ($vendorIndex = 0; $vendorIndex -lt $providerNames.Count; $vendorIndex++) {
      $vendorName = $providerNames[$vendorIndex]
      $key = Get-VendorNormalizedName -Value $vendorName
      if (-not $key -or $seen.ContainsKey($key)) { continue }
      $seen[$key] = $true
      $catalogMatch = Get-VendorCatalogMatch -VendorName $vendorName -Catalog $catalog
      $candidates += [ordered]@{
        vendor_id = "DRV-{0}{1}" -f ($seedIndex + 1), ($vendorIndex + 1).ToString("00")
        vendor_name = if ($catalogMatch) { [string]$catalogMatch.vendor_name } else { $vendorName }
        vendor_description = if ($catalogMatch) { [string]$catalogMatch.vendor_description } else { "" }
        purpose = $seed.Purpose
        business_function = if ($catalogMatch -and -not [string]::IsNullOrWhiteSpace([string]$catalogMatch.service_category)) { [string]$catalogMatch.service_category } else { $seed.BusinessFunction }
        access_level = $seed.AccessLevel
        data_accessed = $dataAccessed
        criticality = $seed.Criticality
        certifications = ""
        location = $location
        service_category = if ($catalogMatch) { [string]$catalogMatch.service_category } else { "" }
        known_services = if ($catalogMatch) { [string]$catalogMatch.known_services } else { "" }
        website = if ($catalogMatch) { [string]$catalogMatch.website } else { "" }
        inherent_risk = ""
        residual_risk = ""
        treatment_plan = ""
        linked_risks = ""
        linked_controls = ""
      }
    }
  }

  return @($candidates)
}

function Get-DerivedTopRisks {
  param([object]$Onboarding)

  $textBlob = @(
    [string]$Onboarding.business_model,
    [string]$Onboarding.cloud_providers,
    [string]$Onboarding.access_model,
    [string]$Onboarding.data_types,
    [string]$Onboarding.classification,
    [string]$Onboarding.encryption,
    [string]$Onboarding.backup,
    [string]$Onboarding.monitoring,
    [string]$Onboarding.scope
  ) -join " "
  $textBlob = $textBlob.ToLowerInvariant()

  $risks = New-Object System.Collections.ArrayList
  if ($textBlob -match "pii|personal|customer|employee|financial|payment|health|phi|sensitive") {
    Add-DerivedRisk -List $risks -Title "Sensitive data exposure" -Reason "The onboarding profile indicates regulated or sensitive data handling."
  }
  if ((Get-DerivedVendorCandidates -Onboarding $Onboarding).Count -gt 0) {
    Add-DerivedRisk -List $risks -Title "Third-party service dependency" -Reason "The operating model relies on external vendors or service providers."
  }
  if ($textBlob -match "aws|azure|gcp|cloud|kubernetes|container|terraform|saas|api") {
    Add-DerivedRisk -List $risks -Title "Cloud or infrastructure misconfiguration" -Reason "The production stack indicates cloud-hosted or distributed systems."
  }
  if (-not ([string]$Onboarding.mfa_enabled).ToLowerInvariant().Contains("yes")) {
    Add-DerivedRisk -List $risks -Title "Unauthorized account access" -Reason "MFA is not clearly enforced across the environment."
  }
  if (-not ([string]$Onboarding.monitoring).ToLowerInvariant().Contains("siem") -and -not ([string]$Onboarding.monitoring).ToLowerInvariant().Contains("alert")) {
    Add-DerivedRisk -List $risks -Title "Delayed detection and response" -Reason "Monitoring details do not yet indicate strong detection coverage."
  }
  if (-not ([string]$Onboarding.backup).ToLowerInvariant().Contains("tested") -and -not ([string]$Onboarding.backup).ToLowerInvariant().Contains("restore")) {
    Add-DerivedRisk -List $risks -Title "Backup or recovery failure" -Reason "Backup and recovery details do not yet show mature recovery assurance."
  }
  if (-not ([string]$Onboarding.encryption).ToLowerInvariant().Contains("encrypt") -and -not ([string]$Onboarding.encryption).ToLowerInvariant().Contains("kms")) {
    Add-DerivedRisk -List $risks -Title "Weak data protection controls" -Reason "Encryption details do not clearly show end-to-end protection."
  }
  Add-DerivedRisk -List $risks -Title "Access control drift" -Reason "Role changes and provisioning can weaken least-privilege controls over time."
  Add-DerivedRisk -List $risks -Title "Change management gaps" -Reason "Policy and control execution depend on consistent operational change control."

  return @($risks)
}

function Get-PolicyWordCount {
  param([string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return 0 }
  return @(($Text.Trim() -split "\s+") | Where-Object { $_ }).Count
}

function Get-TemplateSignalLines {
  param([string]$TemplateText)
  if ([string]::IsNullOrWhiteSpace($TemplateText)) { return @() }
  $skipPhrases = @("table of contents", "document content page", "document version control", "auditor evidence artifacts", "references", "to review")
  $lines = @()
  foreach ($rawLine in (($TemplateText -replace "", "") -split "
")) {
    $line = $rawLine.Trim()
    if (-not $line) { continue }
    $line = $line.Replace([char]0x2013, "-").Replace([char]0x2014, "-")
    $lower = $line.ToLowerInvariant()
    if ($lower -match "^policy\s+\d+") { continue }
    if ($lower -match "^\d+\s+document content page$") { continue }
    $skip = $false
    foreach ($phrase in $skipPhrases) {
      if ($lower.Contains($phrase)) {
        $skip = $true
        break
      }
    }
    if ($skip) { continue }
    $lines += $line
  }
  return @($lines)
}
function Convert-ToMandatoryStatement {
  param([string]$Text)

  $statement = (($Text -replace "\s+", " ").Trim()).TrimEnd(".")
  if (-not $statement) { return "" }

  if ($statement -match "(?i)\b(must|shall|required|requires)\b") {
    return "$statement."
  }
  if ($statement -match "^(All|Each|Users|System owners|Managers|Privileged|Administrative|Access|Exceptions|Emergency access|Quarterly|Monthly|Annual|Annually|Weekly|Daily|Only|No|Passwords|Secrets|Logs|Changes|Releases|Vendors|Systems|Endpoints|Backups|Data|Information|Records|Policy owners|Workforce)\b") {
    return "$statement."
  }

  if ($statement.Length -eq 1) {
    return "The company must $statement."
  }

  $loweredLead = $statement.Substring(0, 1).ToLowerInvariant() + $statement.Substring(1)
  return "The company must $loweredLead."
}

function Repair-TemplateControlStatement {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
  $statement = (($Text -replace "\s+", " ").Trim()).TrimEnd(".")

  $repairs = @(
    @{ Pattern = "(?i)^use company assets for authorised business activities;\s*limited personal use$"; Replacement = "Company assets may be used only for authorized business activities. Limited personal use is permitted when it does not interfere with business operations or security requirements." },
    @{ Pattern = "(?i)^prohibit illegal,\s*harassing,\s*or copyright-infringing activities$"; Replacement = "Workforce users must not use company systems for illegal, harassing, abusive, or copyright-infringing activities." },
    @{ Pattern = "(?i)^minimum\s+(\d+)\s+characters\s+or\s+passphrase;\s*prohibit\s+commonly\s+breached\s+strings$"; Replacement = "Passwords must be at least `$1 characters long or use an approved passphrase, and commonly breached strings must be prohibited." },
    @{ Pattern = "(?i)^no\s+forced\s+periodic\s+rotation\s+unless\s+compromise\s+suspected$"; Replacement = "Passwords must not be rotated on a fixed schedule unless compromise is suspected or a system-specific requirement applies." },
    @{ Pattern = "(?i)^unique\s+password\s+per\s+system;\s*store\s+passwords\s+in\s+an\s+approved\s+password$"; Replacement = "Users must maintain unique passwords per system and store them only in an approved password manager." },
    @{ Pattern = "(?i)^perform full backups daily for critical production data;\s*retain at least 30 days$"; Replacement = "Critical production data must be backed up at least daily and retained according to the approved recovery schedule." },
    @{ Pattern = "(?i)^snapshot infrastructure-as-code and configs before each major change$"; Replacement = "Material infrastructure and configuration changes must be recoverable through approved snapshots or rollback records before implementation." },
    @{ Pattern = "(?i)^store backups in geographically separate region or provider$"; Replacement = "Backups must be stored in a logically or geographically separate location that supports recovery objectives." },
    @{ Pattern = "(?i)^central\s+list\s+of\s+active\s+vendors\s+with\s+owner\s+and\s+contact$"; Replacement = "The company must maintain a central list of active vendors with an assigned owner and current contact details." },
    @{ Pattern = "(?i)^high-risk:\s*obtain\s+soc\s+2/iso\s+27001\s+report\s+or\s+complete\s+security\s+questionnaire$"; Replacement = "High-risk vendors must provide current assurance evidence such as a SOC report, ISO certification, or a completed security questionnaire before approval." },
    @{ Pattern = "(?i)^continuous\s+dependency\s+scanning\s+in\s+ci\s+pipeline$"; Replacement = "Dependency scanning must run continuously in the CI pipeline, and findings must be tracked to remediation." },
    @{ Pattern = "(?i)^external\s+attack\s+surface\s+scan\s+monthly;\s*internal\s+scan\s+quarterly\s+or\s+after\s+big$"; Replacement = "External attack surface scanning must run at least monthly, and internal scanning must run at least quarterly or after material changes." },
    @{ Pattern = "(?i)^tier\s+vendors\s+by\s+risk.*$"; Replacement = "The company must tier vendors by data access, criticality, and service impact, and apply deeper review to higher-risk vendors." },
    @{ Pattern = "(?i)^record names in the comp ai platform$"; Replacement = "Security and privacy governance role assignments must be documented in the approved governance record." },
    @{ Pattern = "(?i)^store all policies in comp ai; spo verifies access and link integrity annually$"; Replacement = "Policies must be stored in the approved policy repository, and access and link integrity must be reviewed at least annually." },
    @{ Pattern = "(?i)^maintain a single risk register on comp ai platform.*$"; Replacement = "The company must maintain a single risk register that records each risk, its likelihood and impact, an owner, and the selected treatment." },
    @{ Pattern = "(?i)^senior management signs an annual statement acknowledging ultimate$"; Replacement = "Senior management must acknowledge responsibility for security and privacy at least annually." },
    @{ Pattern = "(?i)^allocate at least one measurable security improvement task per sprint or work$"; Replacement = "Management must allocate measurable security improvement actions during each planning or work cycle." },
    @{ Pattern = "(?i)^use electronic badge or key system;\s*disable badges immediately upon$"; Replacement = "Badge or key-based physical access controls must be used for controlled areas, and facility access must be revoked promptly when employment or approved access ends." },
    @{ Pattern = "(?i)^require sign-in,\s*government-issued id,\s*and visible visitor badge$"; Replacement = "Visitors must sign in, present identification when required, display a visitor badge, and remain escorted in restricted areas." },
    @{ Pattern = "(?i)^host must escort visitor at all times;\s*log retained 12 months$"; Replacement = "Hosts must escort visitors in restricted areas, and visitor logs must be retained for at least 12 months." },
    @{ Pattern = "(?i)^ensure hvac maintains manufacturer-recommended temperature/humidity$"; Replacement = "Environmental controls for areas containing company equipment or records must maintain temperature and humidity within manufacturer-recommended ranges." },
    @{ Pattern = "(?i)^apply progressive discipline:\s*coaching.*$"; Replacement = "The company must apply documented disciplinary steps that may include coaching, written warning, suspension, or termination based on the severity and recurrence of the violation." },
    @{ Pattern = "(?i)^align severity with impact:\s*data breach,\s*harassment,\s*or unlawful acts may$"; Replacement = "Disciplinary severity must reflect the seriousness of the violation, including whether it involved data exposure, harassment, fraud, or unlawful conduct." },
    @{ Pattern = "(?i)^offer the accused an opportunity to provide explanation before decision$"; Replacement = "Individuals subject to disciplinary review must be given an opportunity to provide relevant information before a final decision is made, unless law or immediate safety concerns require otherwise." },
    @{ Pattern = "(?i)^minor:\s*verbal coaching and retraining$"; Replacement = "Minor first-time violations must be addressed through verbal coaching and retraining when appropriate." },
    @{ Pattern = "(?i)^ensure the register is never blank$"; Replacement = "The risk register must be maintained as a current operating record for in-scope activities and updated when material risks are identified or reassessed." },
    @{ Pattern = "(?i)^define standard roles per system \(e\.g\.,?\s*admin,\s*user,\s*read-only\)$"; Replacement = "Standard roles and permitted access levels must be defined for each in-scope system." },
    @{ Pattern = "(?i)^provision access via ticket with manager approval$"; Replacement = "Access must be provisioned only through documented requests and manager approval." },
    @{ Pattern = "(?i)^modify privileges within 48 h of role change$"; Replacement = "Access privileges must be updated within 48 hours of an approved role change." },
    @{ Pattern = "(?i)^disable or delete accounts by end of final workday$"; Replacement = "Accounts must be disabled by the end of the user's final working day unless a shorter timeframe is required." },
    @{ Pattern = "(?i)^use simple 1-5 scoring for impact and likelihood$"; Replacement = "Risks must be scored using a documented 1 to 5 scale for likelihood and impact." },
    @{ Pattern = "(?i)^highlight the three highest-scoring risks each quarter$"; Replacement = "The highest-rated risks must be reviewed with management at least quarterly." },
    @{ Pattern = "(?i)^record rationale for any score change$"; Replacement = "Changes to risk scores must include documented rationale and approver visibility." },
    @{ Pattern = "(?i)^designate a security \& privacy owner \(spo\) and a documented backup$"; Replacement = "Management must designate a Security and Privacy Owner and a documented delegate." }
  )

  foreach ($repair in $repairs) {
    if ($statement -match $repair.Pattern) {
      return $repair.Replacement
    }
  }

  return $statement
}

function Test-TemplateControlCandidateQuality {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
  $candidate = (($Text -replace "\s+", " ").Trim()).TrimEnd(".")
  if ($candidate.Length -lt 20) { return $false }
  if ($candidate -match "(?i)\bcomp ai\b") { return $false }
  if ($candidate -match "(?i)(=\.|\b(and|or|with|for|to|by|via|using|over|under|after|before|big|limited|admin|customer|sensitive|holding|on)\.?$|[:;,-]\s*$)") { return $false }
  if ($candidate -match "[\u2190-\u21FF]") { return $false }
  return $true
}

function Get-TemplateControlStatements {
  param([string]$TemplateText)
  $seen = @{}
  $controls = @()
  foreach ($line in (Get-TemplateSignalLines -TemplateText $TemplateText)) {
    $candidate = ""
    if ($line -match "^\-\s+(.+)$") {
      $candidate = $Matches[1]
    } elseif ($line -match "^\d+\.\d+\s+(Purpose|Scope|Compliance Measurement|Exceptions|Non-Compliance|Continual Improvement)\s+\-\s+(.+)$") {
      continue
    } elseif ($line -match "^\d+\.\d+\s+[^\-]+\-\s+(.+)$") {
      $candidate = $Matches[1]
    }
    if (-not $candidate) { continue }
    if (-not (Test-TemplateControlCandidateQuality -Text $candidate)) { continue }
    $statement = Convert-ToMandatoryStatement -Text (Repair-TemplateControlStatement -Text $candidate)
    $key = Get-ComparableName -Value $statement
    if (-not $statement -or $seen.ContainsKey($key)) { continue }
    $seen[$key] = $true
    $controls += $statement
  }
  return @($controls | Select-Object -First 4)
}

function Get-PolicyTemplateStatementKeywords {
  param([string]$PolicyName)

  $normalized = ([string]$PolicyName).ToLowerInvariant()
  switch -Wildcard ($normalized) {
    "*information security*" { return @("governance","security","privacy","owner","management","policy","oversight","responsibility","review","improvement") }
    "*governance*" { return @("governance","security","privacy","owner","management","policy","oversight","responsibility","review","improvement") }
    "*physical*" { return @("badge","visitor","facility","physical","office","environment","cctv","entry","access card","humidity","temperature","hvac") }
    "*sanctions*" { return @("discipline","disciplinary","sanction","violation","warning","termination","coaching","misconduct","hr","investigation") }
    "*disciplinary*" { return @("discipline","disciplinary","sanction","violation","warning","termination","coaching","misconduct","hr","investigation") }
    "*risk management*" { return @("risk","register","likelihood","impact","treatment","residual","owner","review","accept") }
    "*policy management*" { return @("policy","review","approval","version","exception","repository","owner","publish") }
    "*compliance*" { return @("compliance","regulatory","obligation","assessment","evidence","review","contractual") }
    "*remote*" { return @("remote","vpn","session","device","network","screen","location") }
    "*byod*" { return @("byod","personal device","device","mobile","separation","wipe","access") }
    "*vendor*" { return @("vendor","third-party","supplier","due diligence","contract","questionnaire","reassessment","subprocessor") }
    "*privacy*" { return @("privacy","personal data","subject","notice","lawful basis","consent","disclosure","retention") }
    "*access*" { return @("access","privileged","approval","least privilege","entitlement","role","account") }
    "*authentication*" { return @("authentication","credential","secret","mfa","sign-in","account","password") }
    "*password*" { return @("password","credential","secret","rotation","manager","default") }
    "*classification*" { return @("classification","label","handling","restricted","confidential","data") }
    "*encryption*" { return @("encryption","cryptographic","key","tls","at rest","in transit","secret") }
    "*backup*" { return @("backup","restore","snapshot","retention","recovery") }
    "*continuity*" { return @("continuity","exercise","dependency","recovery","availability") }
    "*disaster*" { return @("recovery","disaster","restore","priority","dependency","exercise") }
    "*logging*" { return @("log","alert","monitor","investigation","retention","audit") }
    "*monitoring*" { return @("monitor","alert","threshold","coverage","on-call","response") }
    "*incident*" { return @("incident","containment","eradication","recovery","notification","lessons learned") }
    "*change*" { return @("change","approval","testing","emergency","implementation","rollback") }
    "*release*" { return @("release","deployment","rollback","approval","testing") }
    "*secure sdlc*" { return @("development","testing","review","defect","release","security") }
    "*vulnerability*" { return @("vulnerability","scan","finding","remediation","exception","severity") }
    "*patch*" { return @("patch","severity","timeline","deferral","maintenance","remediation") }
    "*training*" { return @("training","awareness","completion","role-based","assignment") }
    "*background*" { return @("screening","background","onboarding","offboarding","personnel","employment") }
    default { return @(Get-PolicyFrameworkKeywords -PolicyName $PolicyName) }
  }
}

function Get-PolicyTemplateControlStatements {
  param([string]$PolicyName, [string]$TemplateText)

  $controls = @(Get-TemplateControlStatements -TemplateText $TemplateText)
  if ($controls.Count -le 2) { return $controls }

  $keywords = @(Get-PolicyTemplateStatementKeywords -PolicyName $PolicyName | Where-Object { $_ })
  if ($keywords.Count -eq 0) { return @($controls | Select-Object -First 4) }
  $normalizedPolicy = ([string]$PolicyName).ToLowerInvariant()
  $exclusionKeywords = @()
  switch -Wildcard ($normalizedPolicy) {
    "*information security*" { $exclusionKeywords = @("lawful basis","consent","data subject","privacy notice","rights-handling","disclosure decision") }
    "*governance*" { $exclusionKeywords = @("lawful basis","consent","data subject","privacy notice","rights-handling","disclosure decision") }
  }

  $scored = foreach ($statement in $controls) {
    $lower = ([string]$statement).ToLowerInvariant()
    if (@($exclusionKeywords | Where-Object { $lower.Contains($_.ToLowerInvariant()) }).Count -gt 0) { continue }
    $score = 0
    foreach ($keyword in $keywords) {
      if ($lower.Contains($keyword.ToLowerInvariant())) {
        $score++
      }
    }
    [ordered]@{
      statement = $statement
      score = $score
    }
  }

  $selected = @(
    $scored |
      Sort-Object @{ Expression = "score"; Descending = $true }, @{ Expression = "statement"; Descending = $false } |
      Where-Object { $_.score -gt 0 } |
      Select-Object -First 4
  )

  if ($selected.Count -ge 2) {
    return @($selected | ForEach-Object { $_.statement })
  }

  return @($controls | Select-Object -First 4)
}
function Get-RiskMitigationStatement {
  param([object]$Risk, [object]$Onboarding, [string]$PolicyName)

  $dataText = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.data_types)) { "in-scope company and customer data" } else { [string]$Onboarding.data_types }
  $scopeText = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.scope)) { "in-scope systems and supporting services" } else { [string]$Onboarding.scope }

  switch -Wildcard ([string]$Risk.title) {
    "Sensitive data exposure" {
      return "The company must restrict access to $dataText based on role, protect that data with approved encryption controls, and review access to sensitive datasets at least quarterly."
    }
    "Third-party service dependency" {
      return "The company must approve vendors supporting $scopeText before use, define security obligations in writing, and review their access and assurance evidence at least annually."
    }
    "Cloud or infrastructure misconfiguration" {
      return "The company must manage material configuration changes through approved workflows, validate hardened settings for in-scope environments, and retain evidence of review and remediation."
    }
    "Unauthorized account access" {
      return "The company must enforce MFA for workforce and privileged access, promptly remove unneeded entitlements, and investigate authentication anomalies affecting $scopeText."
    }
    "Delayed detection and response" {
      return "The company must monitor logs and alerts for in-scope systems, route material events to responsible responders, and document response actions and follow-up."
    }
    "Backup or recovery failure" {
      return "The company must protect backups for critical systems, test restoration on a defined schedule, and address failed recovery tests through documented remediation."
    }
    "Weak data protection controls" {
      return "The company must apply approved encryption and key-management controls to $dataText and verify their operation during periodic review activities."
    }
    "Access control drift" {
      return "The company must review user entitlements at least quarterly and remove stale, excessive, or unapproved privileges from in-scope systems."
    }
    "Change management gaps" {
      return "The company must approve, test, and document material changes before deployment and retain evidence of review, testing, and release decisions."
    }
    default {
      return "The company must operate $PolicyName controls in a way that mitigates $((([string]$Risk.title).ToLowerInvariant())) and review the design of those controls at least quarterly."
    }
  }
}

function Get-PolicySectionTitles {
  param([string]$PolicyName)

  return @(
    "Purpose and Scope",
    "Roles and Responsibilities",
    "Policy Requirements",
    "Exceptions and Review"
  )
}

function Join-ReadableList {
  param([object[]]$Items, [string]$Conjunction = "and")

  $values = @(
    $Items |
      Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } |
      ForEach-Object { ([string]$_).Trim() } |
      Select-Object -Unique
  )

  switch ($values.Count) {
    0 { return "" }
    1 { return $values[0] }
    2 { return "{0} {1} {2}" -f $values[0], $Conjunction, $values[1] }
    default { return "{0}, {1} {2}" -f (($values | Select-Object -First ($values.Count - 1)) -join ", "), $Conjunction, $values[-1] }
  }
}

function Get-PolicyFrameworkNarrative {
  param([object]$Onboarding)

  switch ([string]$Onboarding.framework_selection) {
    "SOC2" { return "the organization's selected SOC 2 obligations" }
    "ISO" { return "the organization's selected ISO 27001 obligations" }
    "Both" { return "the organization's selected SOC 2 and ISO 27001 obligations" }
    default { return "the organization's selected compliance obligations" }
  }
}

function Get-CleanPolicyInputText {
  param([string]$Value, [string]$Fallback = "")

  $text = if ($Value) { (($Value -replace "\s+", " ").Trim()) } else { "" }
  $text = $text -replace "([A-Za-z])\(", '$1 ('
  $text = $text -replace "(?i)\bpervious\b", "previous"
  $text = $text -replace "(?i)\bacesss\b", "access"
  $text = $text -replace "(?i)\bacess\b", "access"
  $text = $text -replace "(?i)\bployed\b", "deployed"
  $text = $text -replace "(?i)\bcommmunication\b", "communication"
  $normalized = (($text -replace "[^a-zA-Z0-9]+", " ").Trim()).ToLowerInvariant()
  $placeholderValues = @("na", "n a", "n a a", "not applicable", "none", "unknown", "tbd", "to be determined")
  if ([string]::IsNullOrWhiteSpace($text) -or ($placeholderValues -contains $normalized)) {
    return $Fallback
  }
  return $text
}

function Convert-ToSentenceFragment {
  param([string]$Text)

  $value = Get-CleanPolicyInputText -Value $Text -Fallback ""
  if (-not $value) { return "" }
  $trimmed = $value.Trim().TrimEnd(".")
  if ($trimmed.Length -le 1) { return $trimmed.ToLowerInvariant() }
  return $trimmed.Substring(0, 1).ToLowerInvariant() + $trimmed.Substring(1)
}

function Get-CompanyServiceNarrative {
  param([object]$Onboarding)

  $services = New-Object System.Collections.ArrayList
  $entries = @()
  if ([string]$Onboarding.business_model) {
    $entries += (([string]$Onboarding.business_model -replace ";", "`n") -split "`n")
  }

  foreach ($entry in @($entries)) {
    $text = Get-CleanPolicyInputText -Value ([string]$entry) -Fallback ""
    if (-not $text) { continue }
    $text = $text -replace "(?i)\bSOC2\b", "SOC 2"
    $text = $text -replace "(?i)\bvCISO\b", "virtual CISO"
    $text = $text -replace "(?i)^provide\s+", ""
    $text = $text -replace "(?i)^providing\s+", ""
    $text = $text -replace "(?i)assurance consultancy like", "assurance consulting, including"
    $text = $text -replace "(?i)iso 27000:2023", "ISO 27001 readiness"
    $text = $text -replace "(?i)iso 27000", "ISO 27001"
    $text = $text -replace "(?i)\bconsultancy\b", "consulting"
    $text = $text -replace "(?i)\breadiness\b", "readiness"
    $text = $text -replace "(?i)\bservices\b", "services"
    $text = $text.Trim().TrimEnd(".")
    if ($text) {
      [void]$services.Add($text)
    }
  }

  $uniqueServices = @($services | Select-Object -Unique)
  if ($uniqueServices.Count -eq 0) { return "" }
  return (Join-ReadableList -Items $uniqueServices -Conjunction "and")
}

function Get-CompanyServiceHeadline {
  param([object]$Onboarding)

  $serviceNarrative = Convert-ToSentenceFragment -Text (Get-CompanyServiceNarrative -Onboarding $Onboarding)
  if (-not $serviceNarrative) { return "" }

  if ($serviceNarrative -match "(?i)soc 2" -and $serviceNarrative -match "(?i)virtual ciso") {
    return "assurance readiness and virtual CISO services"
  }

  $headline = $serviceNarrative -replace "(?i)iso 27000:2023", "ISO 27000"
  if ($headline.Length -gt 85 -and $headline.Contains(",")) {
    return (($headline -split ",")[0]).Trim()
  }
  return $headline
}

function Get-AccessModelNarrative {
  param([object]$Onboarding)

  $value = Get-CleanPolicyInputText -Value ([string]$Onboarding.access_model) -Fallback ""
  if (-not $value) { return "the documented access management process" }
  $normalized = ($value -replace "^(?i)(using|uses|used for)\s+", "").Trim()
  if ($normalized -match "(?i)jumpcloud" -and $normalized -match "(?i)google workspace") { return "the documented identity provisioning and device-management workflow" }
  if ($normalized -match "(?i)jumpcloud|mdm|device") { return "the documented access and device-management workflow" }
  if ($normalized -match "(?i)okta|entra|azure ad|google workspace|identity|sso|mfa") { return "the documented identity and access workflow" }
  if ($normalized -match "(?i)rbac|least privilege|role") { return "the documented role-based access workflow" }
  return "the documented access management process"
}

function Get-BackupNarrative {
  param([object]$Onboarding)

  $value = Get-CleanPolicyInputText -Value ([string]$Onboarding.backup) -Fallback ""
  if (-not $value) { return "documented backup and recovery procedures" }
  if ($value -match "(?i)aws" -and $value -match "(?i)snapshot") { return "documented AWS snapshot and restore procedures" }
  if ($value -match "(?i)snapshot") { return "documented snapshot and restore procedures" }
  if ($value -match "(?i)restore|recovery|backup") { return $value }
  return "documented backup and recovery procedures"
}

function Get-MonitoringNarrative {
  param([object]$Onboarding)

  $value = Get-CleanPolicyInputText -Value ([string]$Onboarding.monitoring) -Fallback ""
  if (-not $value) {
    $vendorNames = @(Get-DerivedVendorCandidates -Onboarding $Onboarding | ForEach-Object { [string]$_.vendor_name })
    if (@($vendorNames | Where-Object { $_ -match "(?i)sentry|cloudtrail|cloudwatch|siem" }).Count -gt 0) {
      return "documented monitoring, alerting, and escalation workflows supported by approved monitoring tools"
    }
    return "approved monitoring and escalation workflows"
  }
  if ($value -match "(?i)siem|monitor|alert|log|sentry|cloudwatch|detection|response") { return $value }
  return "approved monitoring and escalation workflows"
}

function Get-CompanyDescriptorText {
  param([object]$Onboarding)

  $businessModel = Get-CleanPolicyInputText -Value ([string]$Onboarding.business_model)
  $industry = Get-CleanPolicyInputText -Value ([string]$Onboarding.industry)
  $companyType = Get-CleanPolicyInputText -Value ([string]$Onboarding.company_type)

  $serviceNarrative = Get-CompanyServiceNarrative -Onboarding $Onboarding
  if ($industry -and $serviceNarrative) {
    return "a $industry business delivering $(Convert-ToSentenceFragment -Text $serviceNarrative)"
  }
  if ($industry -and $businessModel) {
    return "a $industry organization focused on $(Convert-ToSentenceFragment -Text $businessModel)"
  }
  if ($industry -and $companyType) {
    return "a $industry $companyType"
  }
  if ($industry) {
    return "a $industry organization"
  }
  if ($businessModel) {
    return "an organization focused on $businessModel"
  }
  if ($companyType) {
    return "a $companyType organization"
  }

  return "the organization"
}

function Get-PolicyScopeNarrative {
  param([object]$Onboarding)

  $scope = Get-CleanPolicyInputText -Value ([string]$Onboarding.scope)
  if ($scope) { return $scope }

  $serviceNarrative = Convert-ToSentenceFragment -Text (Get-CompanyServiceNarrative -Onboarding $Onboarding)
  $dataTypes = Get-CleanPolicyInputText -Value ([string]$Onboarding.data_types) -Fallback "company and customer information"
  if ($serviceNarrative) {
    return "the delivery of $serviceNarrative, supporting business systems, workforce accounts, and the handling of $dataTypes"
  }
  return "core business operations, supporting business systems, workforce accounts, and the handling of $dataTypes"
}

function Get-OperatingContextNarrative {
  param([object]$Onboarding)

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "The company" } else { [string]$Onboarding.legal_entity }
  $hostingText = Get-CleanPolicyInputText -Value ([string]$Onboarding.cloud_providers) -Fallback "approved production services"
  $identityText = Get-CleanPolicyInputText -Value ([string]$Onboarding.identity_provider) -Fallback "the approved identity platform"
  $serviceHeadline = Convert-ToSentenceFragment -Text (Get-CompanyServiceHeadline -Onboarding $Onboarding)
  $phrases = New-Object System.Collections.ArrayList
  $seen = @{}
  $catalog = Get-VendorCatalog
  $excludedNames = New-Object System.Collections.ArrayList
  foreach ($providerName in @(
    @(Split-ProviderNames -Value ([string]$Onboarding.cloud_providers)) +
    @(Split-ProviderNames -Value ([string]$Onboarding.identity_provider))
  )) {
    $normalizedProvider = Get-VendorNormalizedName -Value $providerName
    if ($normalizedProvider) {
      [void]$excludedNames.Add($normalizedProvider)
    }
    $catalogMatch = Get-VendorCatalogMatch -VendorName $providerName -Catalog $catalog
    if ($catalogMatch) {
      [void]$excludedNames.Add((Get-VendorNormalizedName -Value ([string]$catalogMatch.vendor_name)))
      foreach ($alias in @($catalogMatch.aliases)) {
        $aliasKey = Get-VendorNormalizedName -Value ([string]$alias)
        if ($aliasKey) {
          [void]$excludedNames.Add($aliasKey)
        }
      }
    }
  }
  $excludedNames = @(
    $excludedNames |
      Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } |
      Select-Object -Unique
  )

  foreach ($vendor in @($Onboarding.vendors | Where-Object { $_ })) {
    $vendorName = Get-CleanPolicyInputText -Value ([string]$vendor.vendor_name) -Fallback ""
    if (-not $vendorName) { continue }
    $vendorKey = Get-VendorNormalizedName -Value $vendorName
    if ($vendorKey -match "amazon web services|google workspace") { continue }
    if ($excludedNames -contains $vendorKey) { continue }
    if ($seen.ContainsKey($vendorKey)) { continue }
    $phrase = switch -Wildcard ($vendorKey) {
      "*jumpcloud*" { "$vendorName for device management and access lifecycle administration" }
      "*cloudflare*" { "$vendorName for web security and perimeter protection" }
      "*sentry*" { "$vendorName for application monitoring, alert visibility, and issue response" }
      "*slack*" { "$vendorName for internal collaboration and incident communications" }
      "*figma*" { "$vendorName for design collaboration" }
      default {
        $purposeFragment = Convert-ToSentenceFragment -Text ([string]$vendor.purpose)
        if ($purposeFragment) {
          "$vendorName for $purposeFragment"
        } else {
          $descriptionFragment = Convert-ToSentenceFragment -Text ([string]$vendor.vendor_description)
          if ($descriptionFragment) { "$vendorName to support $descriptionFragment" } else { "" }
        }
      }
    }
    if ($phrase) {
      $seen[$vendorKey] = $true
      [void]$phrases.Add($phrase)
    }
  }

  $sentences = @()
  if ($serviceHeadline) {
    $sentences += "$companyName provides $serviceHeadline and runs its core operations on $hostingText, using $identityText as the primary workforce identity platform."
  } else {
    $sentences += "$companyName runs its core operations on $hostingText and uses $identityText as the primary workforce identity platform."
  }
  if ($phrases.Count -gt 0) {
    $sentences += "Supporting services used across the current scope include $(Join-ReadableList -Items @($phrases | Select-Object -First 4) -Conjunction "and")."
  }
  return (($sentences -join " ") -replace "\s+", " ").Trim()
}

function Get-PolicyPurposeNarrative {
  param([string]$PolicyName, [object]$Onboarding)

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "The company" } else { [string]$Onboarding.legal_entity }
  $serviceHeadline = Get-CompanyServiceHeadline -Onboarding $Onboarding
  $dataTypes = Get-CleanPolicyInputText -Value ([string]$Onboarding.data_types) -Fallback "company and customer information"
  $supportContext = if ($serviceHeadline) { " in support of $serviceHeadline and the secure handling of $dataTypes" } else { " across business operations, supporting systems, and the handling of $dataTypes" }
  $policyKey = ([string]$PolicyName).ToLowerInvariant()

  switch -Wildcard ($policyKey) {
    "*governance*" { return "$companyName establishes the management standards for security governance, accountability, and oversight$supportContext." }
    "*information security*" { return "$companyName establishes the management standards for security governance, accountability, and oversight$supportContext." }
    "*acceptable use*" { return "$companyName establishes the standards for acceptable use, endpoint security, and user responsibility$supportContext." }
    "*workstation*" { return "$companyName establishes the standards for acceptable use, endpoint security, and user responsibility$supportContext." }
    "*access*" { return "$companyName establishes the standards for access management, role assignment, and least-privilege enforcement$supportContext." }
    "*authentication*" { return "$companyName establishes the standards for authentication, credential security, and account protection$supportContext." }
    "*password*" { return "$companyName establishes the standards for authentication, credential security, and account protection$supportContext." }
    "*vendor*" { return "$companyName establishes the standards for vendor onboarding, oversight, and reassessment$supportContext." }
    "*incident*" { return "$companyName establishes the standards for incident escalation, response, containment, and reporting$supportContext." }
    "*backup*" { return "$companyName establishes the standards for backup, recovery, and continuity$supportContext." }
    "*continuity*" { return "$companyName establishes the standards for backup, recovery, and continuity$supportContext." }
    "*disaster*" { return "$companyName establishes the standards for backup, recovery, and continuity$supportContext." }
    "*change*" { return "$companyName establishes the standards for change approval, testing, and release control$supportContext." }
    "*release*" { return "$companyName establishes the standards for change approval, testing, and release control$supportContext." }
    "*logging*" { return "$companyName establishes the standards for logging, monitoring, and alert handling$supportContext." }
    "*monitoring*" { return "$companyName establishes the standards for logging, monitoring, and alert handling$supportContext." }
    "*remote*" { return "$companyName establishes the standards for remote access, remote work, and secure connectivity$supportContext." }
    "*byod*" { return "$companyName establishes the standards for approved personal-device use$supportContext." }
    "*encryption*" { return "$companyName establishes the standards for encryption and key management$supportContext." }
    "*classification*" { return "$companyName establishes the standards for information classification and handling$supportContext." }
    "*privacy*" { return "$companyName establishes the standards for privacy and regulated-data handling$supportContext." }
    "*retention*" { return "$companyName establishes the standards for retention and secure disposal$supportContext." }
    "*secure sdlc*" { return "$companyName establishes the standards for secure development and release practices$supportContext." }
    "*vulnerability*" { return "$companyName establishes the standards for vulnerability identification, prioritization, and remediation$supportContext." }
    "*patch*" { return "$companyName establishes the standards for vulnerability identification, prioritization, and remediation$supportContext." }
    "*training*" { return "$companyName establishes the standards for security and privacy awareness, training, and completion$supportContext." }
    "*background*" { return "$companyName establishes the standards for personnel screening, onboarding, role-change, and offboarding$supportContext." }
    "*policy management*" { return "$companyName establishes the standards for policy lifecycle, exception handling, and review$supportContext." }
    "*risk management*" { return "$companyName establishes the standards for risk identification, assessment, treatment, and review$supportContext." }
    "*compliance*" { return "$companyName establishes the standards for compliance monitoring, obligation management, and evidence review$supportContext." }
    "*physical*" { return "$companyName establishes the standards for physical access, environmental safeguards, and facility protection$supportContext." }
    "*sanctions*" { return "$companyName establishes the standards for disciplinary and sanction-management response$supportContext." }
    "*disciplinary*" { return "$companyName establishes the standards for disciplinary and sanction-management response$supportContext." }
    default { return "$companyName establishes the mandatory standards for security and governance$supportContext." }
  }
}

function Get-PolicyApplicabilityNarrative {
  param([string]$PolicyName, [object]$Onboarding)

  $policyKey = ([string]$PolicyName).ToLowerInvariant()
  $dataTypes = Get-CleanPolicyInputText -Value ([string]$Onboarding.data_types) -Fallback "company and customer information"
  $serviceNarrative = Convert-ToSentenceFragment -Text (Get-CompanyServiceNarrative -Onboarding $Onboarding)
  $defaultScope = Get-PolicyScopeNarrative -Onboarding $Onboarding

  switch -Wildcard ($policyKey) {
    "*governance*" { return "This policy applies to management oversight, policy ownership, control accountability, governance meetings, and evidence management supporting company systems, vendors, and $dataTypes." }
    "*information security*" { return "This policy applies to management oversight, policy ownership, control accountability, governance meetings, and evidence management supporting company systems, vendors, and $dataTypes." }
    "*privacy*" { return "This policy applies to personnel, systems, records, workflows, and approved vendors that collect, use, store, share, retain, or delete $dataTypes during client delivery and internal operations." }
    "*retention*" { return "This policy applies to records, systems, storage locations, and approved vendors that retain or dispose of $dataTypes and related operational records." }
    "*sharing*" { return "This policy applies to any internal or external sharing of $dataTypes, including transfers to customers, vendors, and approved collaboration tools." }
    "*transfer*" { return "This policy applies to transfers of $dataTypes across systems, vendors, storage locations, and approved communication channels." }
    "*access*" { return "This policy applies to workforce identities, privileged accounts, service accounts, devices, and platforms used to access company systems and $dataTypes." }
    "*authentication*" { return "This policy applies to workforce authentication methods, credentials, service accounts, and identity-provider integrations used to access company systems and $dataTypes." }
    "*password*" { return "This policy applies to passwords, secrets, authentication factors, and credential handling practices for workforce, administrative, and service accounts." }
    "*acceptable use*" { return "This policy applies to workforce use of company systems, managed devices, collaboration tools, and approved third-party services used to support $dataTypes and business operations." }
    "*workstation*" { return "This policy applies to company-managed endpoints, local device controls, approved software, and workstation use in support of $dataTypes and business operations." }
    "*remote*" { return "This policy applies to remote access sessions, remote work locations, managed devices, and collaboration channels used to support company operations and $dataTypes." }
    "*byod*" { return "This policy applies to any approved personal device used to access company systems, collaboration tools, or $dataTypes." }
    "*vendor*" {
      if ($serviceNarrative) {
        return "This policy applies to third-party services, subprocessors, and vendor owners supporting $serviceNarrative and the handling of $dataTypes."
      }
      return "This policy applies to third-party services, subprocessors, and vendor owners supporting company operations and the handling of $dataTypes."
    }
    "*incident*" { return "This policy applies to security events, incidents, response activities, communications, evidence, and post-incident remediation affecting company systems, vendors, or $dataTypes." }
    "*logging*" { return "This policy applies to audit logs, security alerts, monitoring workflows, and supporting systems used to detect, investigate, and respond to events affecting company systems or $dataTypes." }
    "*monitoring*" { return "This policy applies to monitoring coverage, alert handling, log review, escalation workflows, and tooling used to detect issues affecting company systems or $dataTypes." }
    "*backup*" { return "This policy applies to backups, restoration procedures, supporting infrastructure, storage locations, and dependencies that protect company systems and $dataTypes." }
    "*continuity*" { return "This policy applies to continuity planning, recovery arrangements, critical vendors, and supporting systems needed to maintain company services and protect $dataTypes." }
    "*disaster*" { return "This policy applies to disaster recovery plans, restoration priorities, infrastructure dependencies, and supporting vendors needed to recover company systems and $dataTypes." }
    "*change*" { return "This policy applies to material changes affecting applications, infrastructure, configurations, vendor integrations, and operational processes supporting company systems and $dataTypes." }
    "*release*" { return "This policy applies to application and infrastructure releases, deployment workflows, approvals, testing, and rollback procedures affecting company systems and $dataTypes." }
    "*secure sdlc*" { return "This policy applies to software design, development, testing, release, and defect management activities affecting company systems and $dataTypes." }
    "*configuration*" { return "This policy applies to baseline configurations, configuration changes, and drift management for systems, devices, and services supporting company operations and $dataTypes." }
    "*hardening*" { return "This policy applies to hardening standards and secure baseline settings for endpoints, infrastructure, cloud services, and supporting systems used by the company." }
    "*vulnerability*" { return "This policy applies to vulnerability identification, assessment, remediation, exceptions, and related evidence for company systems, applications, and supporting vendors." }
    "*patch*" { return "This policy applies to security patches, remediation timelines, exception handling, and evidence of maintenance for company systems and applications." }
    "*training*" { return "This policy applies to security and privacy training, role-based awareness activities, and completion tracking for personnel supporting company operations." }
    "*background*" { return "This policy applies to screening, onboarding, role changes, and offboarding activities for personnel who access company systems, vendors, or $dataTypes." }
    "*policy management*" { return "This policy applies to policy drafting, review, approval, publication, exception handling, and workforce communication for documents governing company systems, vendors, and $dataTypes." }
    "*risk management*" { return "This policy applies to risk identification, scoring, treatment, acceptance, review, and reporting activities affecting company systems, vendors, and $dataTypes." }
    "*compliance*" { return "This policy applies to compliance monitoring, obligation tracking, evidence review, and remediation planning for company systems, vendors, and $dataTypes." }
    "*physical*" { return "This policy applies to offices, facilities, equipment, visitor activity, and environmental safeguards used to protect company systems, records, and $dataTypes." }
    "*sanctions*" { return "This policy applies to investigation, disciplinary, and management-response activities for policy violations affecting company systems, personnel, vendors, or $dataTypes." }
    "*disciplinary*" { return "This policy applies to investigation, disciplinary, and management-response activities for policy violations affecting company systems, personnel, vendors, or $dataTypes." }
    default { return "This policy applies to workforce users, service accounts, systems, supporting services, and approved vendors involved in $defaultScope." }
  }
}

function Get-PolicyAssuranceStatements {
  param([string]$PolicyName, [object]$Onboarding, [object[]]$TopRisks)

  $policyKey = ([string]$PolicyName).ToLowerInvariant()
  $governanceStylePolicy = ($policyKey -like "*governance*") -or ($policyKey -like "*information security*")
  $statements = New-Object System.Collections.ArrayList
  $seen = @{}
  $monitoring = Get-MonitoringNarrative -Onboarding $Onboarding
  $backup = Get-BackupNarrative -Onboarding $Onboarding
  $dataTypes = Get-CleanPolicyInputText -Value ([string]$Onboarding.data_types) -Fallback "company and customer information"
  $vendorSummary = Join-ReadableList -Items @((Get-DerivedVendorCandidates -Onboarding $Onboarding | Select-Object -First 4 | ForEach-Object { $_.vendor_name })) -Conjunction "and"
  $topRiskSummary = Join-ReadableList -Items @($TopRisks | Select-Object -First 2 | ForEach-Object { ([string]$_.title).ToLowerInvariant() }) -Conjunction "and"

  if ($governanceStylePolicy) {
    Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Management review actions, policy exceptions, and governance decisions must be recorded, assigned owners, and tracked to closure"
    Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Changes to the operating model, service delivery, vendor footprint, or data handling must trigger documented review of governance responsibilities and approval authorities"
    Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Management must review evidence of policy operation, risk treatment, and vendor oversight on a defined schedule and escalate unresolved gaps"
    if ($topRiskSummary) {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Material changes affecting risks such as $topRiskSummary must trigger review of this policy and any dependent procedures"
    }
    return @($statements | Select-Object -First 3)
  }

  switch -Wildcard ($policyKey) {
    "*governance*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Management review actions, policy exceptions, and governance decisions must be recorded, assigned owners, and tracked to closure"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Changes to the operating model, service delivery, vendor footprint, or data handling must trigger documented review of governance responsibilities and approval authorities"
    }
    "*information security*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Management review actions, policy exceptions, and governance decisions must be recorded, assigned owners, and tracked to closure"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Changes to the operating model, service delivery, vendor footprint, or data handling must trigger documented review of governance responsibilities and approval authorities"
    }
    "*privacy*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Privacy notices, processing records, and rights-handling workflows must be reviewed after material processing changes and at least quarterly for completeness"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Data subject requests, consent changes, and disclosure decisions must be logged, tracked to closure, and retained as evidence of timely response"
      if ($vendorSummary) {
        Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Sharing $dataTypes with approved vendors such as $vendorSummary must follow documented contractual safeguards, review, and periodic reassessment"
      }
    }
    "*access*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Access requests, approvals, entitlement changes, and quarterly access reviews must be retained as evidence of least-privilege operation"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Privileged access assignments and emergency access use must be reviewed by the policy owner or delegate on a defined schedule"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Access anomalies and authentication issues must be investigated through $monitoring and documented to resolution"
    }
    "*authentication*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Authentication failures, suspicious sign-ins, and exceptions to standard authentication controls must be reviewed and escalated through $monitoring"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Credential issuance, reset, and revocation records must be retained as evidence of controlled account management"
    }
    "*password*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Password resets, credential exceptions, and privileged secret handling must be logged and reviewed by the responsible team"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Evidence of secure storage, rotation, and revocation of high-risk credentials must be retained for review"
    }
    "*acceptable use*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Violations of acceptable-use rules must be investigated, documented, and escalated through the approved disciplinary or incident workflow"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Device compliance, encryption status, and patching evidence must be reviewed on a defined schedule for workforce systems"
    }
    "*workstation*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Endpoint hardening status, software approval exceptions, and remediation actions must be documented for managed devices"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Workstation compliance checks must be reviewed regularly, and exceptions must be time-bound and approved"
    }
    "*vendor*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Vendor due diligence, approvals, contracts, and reassessment results must be retained in the centralized vendor management record"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Material changes to vendor services, data access, or assurance evidence must trigger documented reassessment before continued reliance"
      if ($vendorSummary) {
        Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Critical vendors such as $vendorSummary must have a documented owner, current service description, and review history"
      }
    }
    "*incident*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Incident tickets, communications, containment decisions, and lessons learned must be retained as evidence of response activity"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Material incidents must be reviewed after closure to identify control improvements, owner actions, and follow-up dates"
    }
    "*logging*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Log review activities, alert investigations, and escalation outcomes must be retained as evidence of monitoring effectiveness"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Changes to log coverage, retention, or alert routing must be approved and documented before implementation"
    }
    "*monitoring*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Monitoring coverage, alert thresholds, and on-call or response responsibilities must be reviewed after major incidents and at least annually"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Monitoring gaps or disabled alerting must be treated as control deficiencies and remediated through documented action plans"
    }
    "*backup*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Backup job results, restore test evidence, and failed recovery actions must be reviewed and retained to demonstrate recoverability"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Changes to retention, backup scope, or restoration priorities must be approved and reflected in $backup"
    }
    "*continuity*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Continuity plans, exercise results, dependency assumptions, and remediation actions must be retained and reviewed by management"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Critical service dependencies and vendor contacts must be reviewed after major operational changes and at least annually"
    }
    "*disaster*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Disaster recovery tests, recovery-time decisions, and unresolved gaps must be documented and tracked to remediation"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Recovery priorities, recovery roles, and dependency assumptions must be reviewed after material infrastructure changes"
    }
    "*change*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Change requests, approvals, testing evidence, and post-implementation findings must be retained for materially significant changes"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Failed or emergency changes must receive documented review, remediation, and management visibility"
    }
    "*release*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Release approvals, deployment evidence, rollback decisions, and post-release issues must be retained as part of the release record"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Material release exceptions must be reviewed and approved before production deployment"
    }
    "*secure sdlc*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Security reviews, defect remediation, and approval evidence must be retained for software changes that affect production systems or $dataTypes"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Security-impacting design or code issues must be tracked to remediation before closure"
    }
    "*configuration*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Baseline configuration records, approved deviations, and remediation of configuration drift must be retained for review"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Material configuration changes must be linked to approved change records and validation evidence"
    }
    "*hardening*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Hardening exceptions must be approved, time-bound, and supported by documented compensating controls"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Evidence of baseline review and post-change validation must be retained for systems in scope"
    }
    "*vulnerability*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Vulnerability findings, remediation due dates, accepted exceptions, and closure evidence must be retained for management review"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Overdue high-risk findings must be escalated through the approved risk or security governance workflow"
    }
    "*patch*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Patch status, overdue remediation items, and approved deferrals must be reviewed regularly and retained as evidence of maintenance"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Systems that cannot be patched on time must have documented compensating controls and an approved remediation plan"
    }
    "*classification*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Classification decisions, handling exceptions, and sharing approvals for $dataTypes must be documented and periodically reviewed"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Labeling and handling guidance must remain available to personnel and updated after material changes to data use"
    }
    "*encryption*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Evidence of encryption settings, key-management reviews, and approved exceptions must be retained for systems handling $dataTypes"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Encryption control changes must be reviewed for impact on vendors, backups, and access pathways before implementation"
    }
    "*retention*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Retention schedules, disposal approvals, and deletion evidence must be retained for records and systems handling $dataTypes"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Exceptions to approved retention periods must be justified, approved, and tracked to closure"
    }
    "*sharing*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Data-sharing approvals, recipient justification, and transfer evidence must be retained for sensitive or regulated information"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Changes to approved sharing patterns or recipients must trigger review of this policy and related procedures"
    }
    "*transfer*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Transfer approvals, secure-channel settings, and regional restrictions for $dataTypes must be documented and retained"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Transfers involving new vendors or locations must be reviewed before implementation"
    }
    "*training*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Training completion, overdue assignments, and role-based awareness coverage must be reviewed on a defined schedule and escalated when incomplete"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Material changes to roles, tooling, or data access must trigger updates to training content and assignment criteria"
    }
    "*background*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Personnel screening records, offboarding approvals, and access-removal evidence must be handled as restricted records and reviewed by authorized personnel only"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Delayed offboarding, unresolved role-change actions, and screening exceptions must be escalated through the approved management workflow"
    }
    "*policy management*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Policy review dates, approver decisions, and material revisions must be retained in the approved policy repository"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Policy exceptions and unresolved review actions must be assigned owners and tracked to completion"
    }
    "*risk management*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Risk reviews, treatment-plan updates, and accepted-risk decisions must be retained in the approved risk record"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Overdue treatment actions, critical residual risks, and material vendor-driven risk changes must be escalated to management"
    }
    "*compliance*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Compliance obligations, internal mappings, and evidence gaps must be reviewed after material business or regulatory changes and at least quarterly"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Assessment findings, remediation plans, and unresolved compliance gaps must be retained and reviewed by management"
    }
    "*physical*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Facility access reviews, visitor controls, and physical security exceptions must be documented and reviewed on a defined schedule"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Changes to office access arrangements, equipment storage, or environmental safeguards must trigger documented review before implementation"
    }
    "*sanctions*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Policy violations, investigation outcomes, and disciplinary decisions must be documented and handled as restricted records"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Repeated violations or unresolved disciplinary actions must be escalated through the approved management workflow"
    }
    "*disciplinary*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Policy violations, investigation outcomes, and disciplinary decisions must be documented and handled as restricted records"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Repeated violations or unresolved disciplinary actions must be escalated through the approved management workflow"
    }
    default {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Policy operation, exceptions, and evidence of review must be retained to support internal oversight and audit readiness"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Material changes to systems, vendors, or data handling affected by this policy must trigger review and update of the related procedures"
    }
  }

  if ($topRiskSummary) {
    Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Material changes affecting risks such as $topRiskSummary must trigger review of this policy and any dependent procedures"
  }

  return @($statements | Select-Object -First 3)
}

function Get-PolicyMonitoringReviewText {
  param([string]$PolicyName, [object]$Onboarding)

  $policyKey = ([string]$PolicyName).ToLowerInvariant()
  switch -Wildcard ($policyKey) {
    "*governance*" { return "Management review outcomes, policy exceptions, and open governance actions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material business, vendor, or compliance changes." }
    "*information security*" { return "Management review outcomes, policy exceptions, and open governance actions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material business, vendor, or compliance changes." }
    "*privacy*" { return "Privacy notices, processing records, rights-handling activity, and vendor data-sharing arrangements must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material changes to processing, vendors, or legal obligations." }
    "*access*" { return "Access approvals, privileged access assignments, and periodic access reviews must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material identity, workforce, or system changes." }
    "*authentication*" { return "Authentication exceptions, suspicious sign-in activity, and credential-management controls must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material identity or system changes." }
    "*acceptable use*" { return "Acceptable-use violations, endpoint compliance results, and approved exceptions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material workforce, device, or collaboration changes." }
    "*workstation*" { return "Endpoint hardening status, patch compliance, and approved software exceptions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material device or platform changes." }
    "*remote*" { return "Remote-access approvals, session controls, and device posture exceptions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material workforce or access-model changes." }
    "*byod*" { return "BYOD approvals, device posture exceptions, and data-removal controls must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material workforce or device-management changes." }
    "*backup*" { return "Backup success, restoration testing, and recovery gaps must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material infrastructure or vendor changes." }
    "*continuity*" { return "Continuity plans, exercise results, and unresolved recovery gaps must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material business, vendor, or infrastructure changes." }
    "*vendor*" { return "Vendor due diligence status, reassessment results, and material service changes must be reviewed at least quarterly, and this policy must be reviewed at least annually or after significant vendor or data-access changes." }
    "*logging*" { return "Log coverage, alert routing, and monitoring outcomes must be reviewed at least quarterly, and this policy must be reviewed at least annually or after major platform, vendor, or response-process changes." }
    "*monitoring*" { return "Monitoring coverage, alert thresholds, and unresolved detection gaps must be reviewed at least quarterly, and this policy must be reviewed at least annually or after major platform, vendor, or response-process changes." }
    "*incident*" { return "Incident response effectiveness, escalations, and corrective actions must be reviewed after material incidents and at least quarterly, and this policy must be reviewed at least annually." }
    "*change*" { return "Change approvals, failed changes, emergency changes, and follow-up actions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material delivery or platform changes." }
    "*release*" { return "Release approvals, deployment outcomes, rollback decisions, and unresolved post-release issues must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material delivery or platform changes." }
    "*secure sdlc*" { return "Security design reviews, testing outcomes, and unresolved development issues must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material engineering or platform changes." }
    "*configuration*" { return "Baseline reviews, drift findings, and approved configuration exceptions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material infrastructure changes." }
    "*hardening*" { return "Hardening exceptions, baseline validation outcomes, and remediation progress must be reviewed at least quarterly, and this policy must be reviewed at least annually or after major platform changes." }
    "*vulnerability*" { return "Scanning results, overdue remediation items, and accepted-risk decisions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after major platform or threat changes." }
    "*patch*" { return "Patch status, overdue remediation items, and approved deferrals must be reviewed at least quarterly, and this policy must be reviewed at least annually or after major platform or threat changes." }
    "*classification*" { return "Classification decisions, handling exceptions, and sharing approvals must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material data-use changes." }
    "*encryption*" { return "Encryption settings, key-management reviews, and approved exceptions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material system, vendor, or data-handling changes." }
    "*retention*" { return "Retention schedules, legal holds, deletion evidence, and disposal exceptions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material legal or data-handling changes." }
    "*sharing*" { return "Sharing approvals, recipient changes, and transfer exceptions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material changes to data-sharing practices." }
    "*transfer*" { return "Transfer approvals, secure-channel controls, and location changes must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material changes to data-transfer practices." }
    "*training*" { return "Training completion, overdue assignments, and role-based awareness coverage must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material workforce or role changes." }
    "*background*" { return "Screening completion, offboarding timing, and unresolved personnel-access issues must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material workforce changes." }
    "*policy management*" { return "Policy review status, open revision actions, and overdue approvals must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material changes to business operations, vendors, or data use." }
    "*risk management*" { return "Risk reviews, overdue treatment actions, and accepted-risk decisions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material business, technology, or vendor changes." }
    "*compliance*" { return "Compliance obligations, mapping updates, and unresolved evidence gaps must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material regulatory, contractual, or business changes." }
    "*physical*" { return "Facility access reviews, visitor controls, and physical-security exceptions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material office, equipment, or environmental changes." }
    "*sanctions*" { return "Policy violations, disciplinary outcomes, and unresolved corrective actions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material policy or workforce changes." }
    "*disciplinary*" { return "Policy violations, disciplinary outcomes, and unresolved corrective actions must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material policy or workforce changes." }
    default { return "Control operation must be reviewed at least quarterly, and this policy must be reviewed at least annually or after material business, vendor, system, or data-handling changes." }
  }
}

function Get-PolicyRecordsEvidenceText {
  param([string]$PolicyName, [object]$Onboarding)

  $policyKey = ([string]$PolicyName).ToLowerInvariant()
  switch -Wildcard ($policyKey) {
    "*governance*" { return "Evidence of governance meetings, policy exceptions, management approvals, action-item tracking, and remediation activity must be retained to support compliance and audit activities." }
    "*information security*" { return "Evidence of governance meetings, policy exceptions, management approvals, action-item tracking, and remediation activity must be retained to support compliance and audit activities." }
    "*privacy*" { return "Evidence of privacy notices, processing records, data subject requests, sharing approvals, and remediation activity must be retained to support compliance and audit activities." }
    "*access*" { return "Evidence of access requests, approvals, access reviews, privileged-access records, and remediation activity must be retained to support compliance and audit activities." }
    "*authentication*" { return "Evidence of authentication settings, credential lifecycle actions, exception approvals, and remediation activity must be retained to support compliance and audit activities." }
    "*acceptable use*" { return "Evidence of acceptable-use acknowledgements, violations, disciplinary actions, device-compliance reviews, and remediation activity must be retained to support compliance and audit activities." }
    "*workstation*" { return "Evidence of endpoint hardening status, software approval decisions, patch compliance, and remediation activity must be retained to support compliance and audit activities." }
    "*remote*" { return "Evidence of remote-access approvals, session-control exceptions, device posture checks, and remediation activity must be retained to support compliance and audit activities." }
    "*byod*" { return "Evidence of BYOD approvals, device compliance checks, data-removal actions, and remediation activity must be retained to support compliance and audit activities." }
    "*backup*" { return "Evidence of backup configuration, restore testing, continuity exercises, approvals, and remediation activity must be retained to support compliance and audit activities." }
    "*vendor*" { return "Evidence of vendor due diligence, approvals, contracts, reassessments, and remediation activity must be retained to support compliance and audit activities." }
    "*incident*" { return "Evidence of incident tickets, response decisions, communications, recovery actions, and lessons learned must be retained to support compliance and audit activities." }
    "*logging*" { return "Evidence of log reviews, alert investigations, coverage changes, and remediation activity must be retained to support compliance and audit activities." }
    "*monitoring*" { return "Evidence of monitoring coverage, alert-threshold changes, response investigations, and remediation activity must be retained to support compliance and audit activities." }
    "*change*" { return "Evidence of change requests, approvals, testing, emergency-change reviews, and remediation activity must be retained to support compliance and audit activities." }
    "*release*" { return "Evidence of release approvals, deployment records, rollback decisions, and remediation activity must be retained to support compliance and audit activities." }
    "*secure sdlc*" { return "Evidence of security reviews, testing results, defect remediation, approvals, and remediation activity must be retained to support compliance and audit activities." }
    "*configuration*" { return "Evidence of baseline configurations, approved deviations, drift findings, and remediation activity must be retained to support compliance and audit activities." }
    "*hardening*" { return "Evidence of hardening baselines, validation results, approved exceptions, and remediation activity must be retained to support compliance and audit activities." }
    "*vulnerability*" { return "Evidence of scan results, remediation due dates, accepted-risk decisions, and closure activity must be retained to support compliance and audit activities." }
    "*patch*" { return "Evidence of patch status, approved deferrals, compensating controls, and remediation activity must be retained to support compliance and audit activities." }
    "*classification*" { return "Evidence of classification decisions, handling exceptions, sharing approvals, and remediation activity must be retained to support compliance and audit activities." }
    "*encryption*" { return "Evidence of encryption settings, key-management reviews, approved exceptions, and remediation activity must be retained to support compliance and audit activities." }
    "*retention*" { return "Evidence of retention schedules, deletion approvals, disposal records, legal-hold actions, and remediation activity must be retained to support compliance and audit activities." }
    "*sharing*" { return "Evidence of sharing approvals, recipient reviews, transfer decisions, and remediation activity must be retained to support compliance and audit activities." }
    "*transfer*" { return "Evidence of transfer approvals, secure-channel settings, location restrictions, and remediation activity must be retained to support compliance and audit activities." }
    "*training*" { return "Evidence of training assignments, completion records, overdue escalations, and remediation activity must be retained to support compliance and audit activities." }
    "*background*" { return "Evidence of screening completion, onboarding and offboarding actions, access-removal records, and remediation activity must be retained to support compliance and audit activities." }
    "*policy management*" { return "Evidence of policy versions, approvals, review dates, exceptions, and remediation activity must be retained to support compliance and audit activities." }
    "*risk management*" { return "Evidence of risk reviews, treatment decisions, approvals, and remediation activity must be retained to support compliance and audit activities." }
    "*compliance*" { return "Evidence of compliance assessments, mapping updates, evidence gaps, approvals, and remediation activity must be retained to support compliance and audit activities." }
    "*physical*" { return "Evidence of facility access reviews, visitor records, environmental checks, and remediation activity must be retained to support compliance and audit activities." }
    "*sanctions*" { return "Evidence of policy violations, disciplinary decisions, approvals, and remediation activity must be retained to support compliance and audit activities." }
    "*disciplinary*" { return "Evidence of policy violations, disciplinary decisions, approvals, and remediation activity must be retained to support compliance and audit activities." }
    default { return "Evidence of approvals, reviews, remediation, and material control activity must be retained to support compliance and audit activities." }
  }
}

function Get-PolicyRelatedOperationsText {
  param([string]$PolicyName, [object]$Onboarding)

  $policyKey = ([string]$PolicyName).ToLowerInvariant()
  switch -Wildcard ($policyKey) {
    "*governance*" { return "Policy implementation must remain consistent with the organization's risk management, compliance review, vendor management, and policy lifecycle processes." }
    "*information security*" { return "Policy implementation must remain consistent with the organization's risk management, compliance review, vendor management, and policy lifecycle processes." }
    "*privacy*" { return "Policy implementation must remain consistent with the organization's retention, vendor management, incident response, and records-management processes." }
    "*access*" { return "Policy implementation must remain consistent with the organization's onboarding and offboarding, authentication, device management, and monitoring processes." }
    "*authentication*" { return "Policy implementation must remain consistent with the organization's access administration, monitoring, incident response, and privileged-access processes." }
    "*acceptable use*" { return "Policy implementation must remain consistent with the organization's HR, device management, incident response, and disciplinary processes." }
    "*workstation*" { return "Policy implementation must remain consistent with the organization's device management, patching, vulnerability management, and monitoring processes." }
    "*remote*" { return "Policy implementation must remain consistent with the organization's access administration, device management, monitoring, and incident response processes." }
    "*byod*" { return "Policy implementation must remain consistent with the organization's access administration, device management, retention, and incident response processes." }
    "*backup*" { return "Policy implementation must remain consistent with the organization's change management, infrastructure operations, continuity planning, and incident response processes." }
    "*vendor*" { return "Policy implementation must remain consistent with the organization's procurement, privacy, security review, and risk-management processes." }
    "*logging*" { return "Policy implementation must remain consistent with the organization's incident response, access administration, vulnerability management, and change-management processes." }
    "*monitoring*" { return "Policy implementation must remain consistent with the organization's incident response, access administration, vulnerability management, and change-management processes." }
    "*change*" { return "Policy implementation must remain consistent with the organization's release management, secure development, incident response, and evidence-retention processes." }
    "*release*" { return "Policy implementation must remain consistent with the organization's change management, secure development, incident response, and evidence-retention processes." }
    "*secure sdlc*" { return "Policy implementation must remain consistent with the organization's change management, release management, vulnerability management, and incident response processes." }
    "*configuration*" { return "Policy implementation must remain consistent with the organization's change management, vulnerability management, monitoring, and incident response processes." }
    "*hardening*" { return "Policy implementation must remain consistent with the organization's configuration management, vulnerability management, monitoring, and incident response processes." }
    "*vulnerability*" { return "Policy implementation must remain consistent with the organization's patch management, change management, risk management, and monitoring processes." }
    "*patch*" { return "Policy implementation must remain consistent with the organization's vulnerability management, change management, monitoring, and risk-management processes." }
    "*classification*" { return "Policy implementation must remain consistent with the organization's privacy, sharing and transfer, retention, and vendor management processes." }
    "*encryption*" { return "Policy implementation must remain consistent with the organization's access administration, backup and recovery, transfer, and vendor management processes." }
    "*retention*" { return "Policy implementation must remain consistent with the organization's privacy, legal hold, records-management, and vendor management processes." }
    "*sharing*" { return "Policy implementation must remain consistent with the organization's privacy, vendor management, transfer, and records-management processes." }
    "*transfer*" { return "Policy implementation must remain consistent with the organization's privacy, vendor management, encryption, and records-management processes." }
    "*training*" { return "Policy implementation must remain consistent with the organization's HR, onboarding and offboarding, access administration, and policy management processes." }
    "*background*" { return "Policy implementation must remain consistent with the organization's HR, onboarding and offboarding, access administration, and disciplinary processes." }
    "*policy management*" { return "Policy implementation must remain consistent with the organization's governance, compliance review, risk management, and workforce communications processes." }
    "*risk management*" { return "Policy implementation must remain consistent with the organization's vendor management, change management, incident response, and compliance review processes." }
    "*compliance*" { return "Policy implementation must remain consistent with the organization's governance, risk management, policy management, and evidence-retention processes." }
    "*physical*" { return "Policy implementation must remain consistent with the organization's asset management, HR, incident response, and business continuity processes." }
    "*sanctions*" { return "Policy implementation must remain consistent with the organization's HR, acceptable-use, incident response, and policy management processes." }
    "*disciplinary*" { return "Policy implementation must remain consistent with the organization's HR, acceptable-use, incident response, and policy management processes." }
    default { return "Policy implementation must remain consistent with the organization's access administration, backup and recovery, and security monitoring processes." }
  }
}

function Add-UniqueMandatoryStatement {
  param(
    [System.Collections.ArrayList]$List,
    [hashtable]$Seen,
    [string]$Statement
  )

  $normalizedStatement = Convert-ToMandatoryStatement -Text $Statement
  if ([string]::IsNullOrWhiteSpace($normalizedStatement)) { return }
  $key = Get-ComparableName -Value $normalizedStatement
  if ($Seen.ContainsKey($key)) { return }
  $Seen[$key] = $true
  [void]$List.Add($normalizedStatement)
}

function Get-PolicyTailoredStatements {
  param([string]$PolicyName, [object]$Onboarding)

  $policyKey = ([string]$PolicyName).ToLowerInvariant()
  $governanceStylePolicy = ($policyKey -like "*governance*") -or ($policyKey -like "*information security*")
  $statements = New-Object System.Collections.ArrayList
  $seen = @{}
  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "The company" } else { [string]$Onboarding.legal_entity }
  $identityProvider = Get-CleanPolicyInputText -Value ([string]$Onboarding.identity_provider) -Fallback "the designated identity provider"
  $hostingProviders = Get-CleanPolicyInputText -Value ([string]$Onboarding.cloud_providers) -Fallback "the approved production environment"
  $accessModel = Get-AccessModelNarrative -Onboarding $Onboarding
  $monitoring = Get-MonitoringNarrative -Onboarding $Onboarding
  $backup = Get-BackupNarrative -Onboarding $Onboarding
  $encryption = Get-CleanPolicyInputText -Value ([string]$Onboarding.encryption) -Fallback "approved encryption safeguards"
  $classification = Get-CleanPolicyInputText -Value ([string]$Onboarding.classification) -Fallback "the organization's data handling standard"
  $dataTypes = Get-CleanPolicyInputText -Value ([string]$Onboarding.data_types) -Fallback "company and customer information"
  $classificationReference = if ((Get-ComparableName -Value $classification) -eq (Get-ComparableName -Value $dataTypes)) { "the organization's approved handling standard for $dataTypes" } else { $classification }
  $regions = Get-CleanPolicyInputText -Value ([string]$Onboarding.storage_regions) -Fallback "approved locations"
  $workType = Get-CleanPolicyInputText -Value ([string]$Onboarding.work_type) -Fallback "the current workforce model"
  $devices = Get-CleanPolicyInputText -Value ([string]$Onboarding.devices_used) -Fallback "approved company-managed devices"
  $operatingSystems = Get-CleanPolicyInputText -Value ([string]$Onboarding.operating_systems) -Fallback "approved operating systems"
  $vendorNames = Join-ReadableList -Items @((Get-DerivedVendorCandidates -Onboarding $Onboarding | Select-Object -First 4 | ForEach-Object { $_.vendor_name })) -Conjunction "and"

  if ($governanceStylePolicy) {
    Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Management must review policy, risk, and control performance on a defined schedule and track assigned actions to closure"
    Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Security and privacy governance roles, delegated owners, and approval authorities must be documented and kept current"
    Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Management must designate a Security and Privacy Owner and a documented delegate"
    Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Senior management must acknowledge responsibility for security and privacy at least annually"
    return @($statements | Select-Object -First 4)
  }

  switch -Wildcard ($policyKey) {
    "*governance*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Management must review policy, risk, and control performance on a defined schedule and track assigned actions to closure"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Security and privacy governance roles, delegated owners, and approval authorities must be documented and kept current"
    }
    "*information security*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Management must review policy, risk, and control performance on a defined schedule and track assigned actions to closure"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Security and privacy governance roles, delegated owners, and approval authorities must be documented and kept current"
    }
    "*access*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "$companyName shall provision, modify, and remove access through $identityProvider according to $accessModel"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Privileged access must be separately approved, time-bound where appropriate, and reviewed at least quarterly"
      if (([string]$Onboarding.mfa_enabled).ToLowerInvariant().Contains("yes")) {
        Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Multi-factor authentication must remain enforced through $identityProvider for workforce and privileged access"
      }
    }
    "*authentication*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "$companyName shall centralize authentication through $identityProvider and investigate authentication anomalies through $monitoring"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Shared or generic workforce accounts must not be used unless explicitly approved and controlled"
    }
    "*password*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Authentication secrets must be created, stored, rotated, and reset through approved secure mechanisms managed by $identityProvider"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Default credentials must be removed before systems or applications are placed into production use"
    }
    "*acceptable use*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Workforce users must use company systems and accounts only for approved business activities and must not bypass security controls"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Devices used under $workType must maintain approved screen lock, patching, anti-malware, and local encryption settings"
    }
    "*workstation*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Endpoints running $operatingSystems must follow the approved hardening baseline and automatic update settings"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Only approved software may be installed on workforce systems used to access in-scope services"
    }
    "*remote*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Remote access under the $workType model must use approved authentication, encrypted sessions, and managed devices"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Remote work locations must protect screen visibility, printed material, and unattended devices from unauthorized access"
    }
    "*byod*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Bring-your-own-device access must be explicitly approved and limited to devices that meet the required security baseline"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Corporate data on personal devices must remain logically separated and removable when access is revoked"
    }
    "*vendor*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Third-party services must not be onboarded until security, legal, and business review requirements are completed and documented"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "The company must maintain a current vendor inventory with service descriptions, client-specific purpose, criticality, and approval status"
      if ($vendorNames) {
        Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Vendor oversight must cover key supporting services such as $vendorNames, with reassessment after material vendor changes"
      }
    }
    "*incident*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Security events must be triaged, escalated, and documented through $monitoring according to severity and business impact"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Incident response records must capture containment, eradication, recovery, notification, and lessons learned activities"
    }
    "*logging*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "In-scope systems hosted on $hostingProviders must generate audit logs sufficient to support detection, investigation, and accountability"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Log review and alert handling must operate through $monitoring with documented escalation responsibilities"
    }
    "*monitoring*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Monitoring coverage must include critical systems, authentication events, administrative actions, and material security alerts"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Alert thresholds and routing must be reviewed after major incidents and at least annually"
    }
    "*backup*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Backups supporting workloads on $hostingProviders must follow $backup and include documented restoration testing"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Backup copies must be protected from unauthorized alteration or deletion and retained according to business and compliance needs"
    }
    "*continuity*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Business continuity arrangements must prioritize the systems, vendors, and data sets required to operate the selected scope"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Recovery procedures must be tested, lessons learned must be tracked, and material failures must be remediated"
    }
    "*disaster*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Disaster recovery plans for services on $hostingProviders must define restoration priorities, decision makers, and evidence of testing"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Recovery dependencies, including critical vendors and identity services, must be reviewed after material infrastructure changes"
    }
    "*encryption*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "$dataTypes must be protected with approved encryption controls for storage, transmission, and administrative access, including $encryption"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Cryptographic keys and secrets must be restricted to authorized personnel and services with documented rotation and revocation procedures"
    }
    "*classification*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Information must be classified according to $classificationReference and handled based on the sensitivity of $dataTypes"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Labels, handling instructions, and sharing restrictions must be applied consistently across systems and workflows"
    }
    "*privacy*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Personal and regulated data must be processed only for approved business purposes and handled in accordance with $classificationReference"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Privacy-related requests, retention decisions, and disclosures must be recorded and reviewed through approved workflows"
    }
    "*retention*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "$dataTypes must be retained only as long as required for legal, contractual, business, or regulatory needs"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Secure disposal methods must be used for records and systems that reach the end of their retention period"
    }
    "*sharing*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Data sharing must be limited to approved recipients, approved channels, and documented business need"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Transfers of sensitive information outside approved workflows or regions such as $regions must be explicitly authorized"
    }
    "*transfer*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Transfers of sensitive data must use approved secure channels and preserve classification and handling requirements"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Cross-border or regional storage and transfer decisions must align with approved locations such as $regions"
    }
    "*change*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Material changes affecting services on $hostingProviders must be documented, risk assessed, approved, tested, and traceable to implementation evidence"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Emergency changes must receive retrospective review and documented approval after implementation"
    }
    "*release*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Application and infrastructure releases must follow an approved workflow with testing, review, separation of duties, and deployment records"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Rollback or recovery procedures must be defined before production release of material changes"
    }
    "*secure sdlc*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Secure development activities must include design review, testing, defect remediation, and approval before release to production"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Security-impacting issues identified during development must be tracked to remediation before closure"
    }
    "*configuration*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Baseline configurations for systems on $hostingProviders must be documented, approved, and reviewed after material changes"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Unauthorized configuration drift must be detected and remediated through documented operational processes"
    }
    "*hardening*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Systems and endpoints must follow approved hardening baselines before they are used for in-scope activities"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Hardening standards must be reviewed after major platform changes and at least annually"
    }
    "*vulnerability*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Vulnerability findings affecting in-scope systems or vendors must be prioritized, tracked, and remediated according to risk"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Scanning, assessment, and exception records must be retained to support management oversight"
    }
    "*patch*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Security patches for supported systems and applications must be applied according to severity-based timelines"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Patch exceptions must be approved, time-bound, and supported by compensating controls"
    }
    "*training*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Security and privacy training must be completed at onboarding and at least annually for relevant personnel"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Role-specific training must be assigned when responsibilities involve privileged access, engineering, or sensitive data handling"
    }
    "*background*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Personnel screening must be completed before granting access to systems or data based on role sensitivity and legal requirements"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Changes in role, employment status, or contractual relationship must trigger timely access review and offboarding actions"
    }
    "*policy management*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Policy owners must review policies annually and after material changes to systems, vendors, or data use"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Policies must remain accessible to the workforce and mapped internally to the organization's selected compliance obligations"
    }
    "*risk management*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Risk assessments must be updated after significant business, technology, vendor, or data-handling changes"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Risk treatment decisions must identify owners, due dates, and evidence of completion"
    }
    "*compliance*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Compliance obligations must be reviewed against the current operating model, vendor footprint, and data-handling activities"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Regulatory and contractual changes must be assessed for policy, control, and evidence impact"
    }
    "*physical*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Physical access to offices, equipment, and records storage must be limited to authorized personnel and approved visitors"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Environmental safeguards for equipment and records must be maintained and tested according to facility requirements"
    }
    "*sanctions*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Violations of security or privacy requirements must be investigated and handled through documented disciplinary procedures"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Disciplinary outcomes must be coordinated with management and HR and retained as restricted records"
    }
    "*disciplinary*" {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Violations of security or privacy requirements must be investigated and handled through documented disciplinary procedures"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Disciplinary outcomes must be coordinated with management and HR and retained as restricted records"
    }
    default {
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "$companyName shall operate this policy in a way that reflects the current business model, workforce model, and technology environment"
      Add-UniqueMandatoryStatement -List $statements -Seen $seen -Statement "Control owners must review policy operation after material changes to systems, vendors, data use, or compliance scope"
    }
  }

  return @($statements | Select-Object -First 4)
}

function Get-PolicyRequirementLeadText {
  param([string]$PolicyName, [object]$Onboarding)

  $policyKey = ([string]$PolicyName).ToLowerInvariant()
  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "The organization" } else { [string]$Onboarding.legal_entity }
  $identityProvider = Get-CleanPolicyInputText -Value ([string]$Onboarding.identity_provider) -Fallback "the designated identity platform"
  $hostingProviders = Get-CleanPolicyInputText -Value ([string]$Onboarding.cloud_providers) -Fallback "the approved production environment"
  $dataTypes = Get-CleanPolicyInputText -Value ([string]$Onboarding.data_types) -Fallback "company and customer information"

  switch -Wildcard ($policyKey) {
    "*acceptable use*" { return "$companyName expects workforce personnel to use company technology in a way that protects business operations, customer trust, and managed endpoints." }
    "*workstation*" { return "$companyName expects managed endpoints to remain hardened, supportable, and fit for business use throughout their lifecycle." }
    "*access*" { return "Access to company systems must remain tied to business need, approved roles, and timely entitlement changes through $identityProvider." }
    "*authentication*" { return "Authentication controls must establish strong identity assurance for workforce and administrative access across the environment." }
    "*password*" { return "Credential management practices must prevent weak, shared, or uncontrolled secrets from exposing company systems or data." }
    "*vendor*" { return "Third-party services must be approved, documented, and governed in line with the business use case and the level of access they receive." }
    "*privacy*" { return "Privacy obligations must be embedded in day-to-day handling of $dataTypes so collection, use, retention, and disclosure remain controlled." }
    "*incident*" { return "Incident response activities must support timely detection, containment, communication, and recovery when security events occur." }
    "*backup*" { return "Backup and recovery arrangements must support restoration of critical services and data within documented business expectations." }
    "*continuity*" { return "Continuity planning must address the people, systems, vendors, and decision paths needed to sustain the business during disruption." }
    "*disaster*" { return "Recovery planning must define how the organization restores critical technology services after material outages or platform failures." }
    "*logging*" { return "Logging practices must provide enough visibility to detect, investigate, and evidence events affecting company systems and data." }
    "*monitoring*" { return "Monitoring practices must provide reliable alerting, escalation, and follow-through for issues that affect security, privacy, or availability." }
    "*remote*" { return "Remote access and remote work arrangements must preserve the same level of protection expected for in-office operations." }
    "*byod*" { return "Any approved personal-device use must preserve separation of company data, enforce baseline protection, and support timely revocation." }
    "*encryption*" { return "Encryption controls must protect sensitive information in storage, transit, and administrative use without weakening operational resilience." }
    "*classification*" { return "Information handling decisions must reflect the sensitivity of the data involved and the approved handling standard for that information." }
    "*retention*" { return "Retention and disposal practices must keep records only for as long as justified and ensure secure deletion when no longer needed." }
    "*sharing*" { return "Data-sharing practices must remain purposeful, approved, and limited to recipients, channels, and locations that the organization accepts." }
    "*transfer*" { return "Transfers of sensitive information must remain traceable, secure, and aligned to approved destinations and data-handling requirements." }
    "*change*" { return "Material technology and process changes must move through a controlled workflow before they affect production operations." }
    "*release*" { return "Production releases must move through approved planning, testing, and rollback arrangements before deployment." }
    "*secure sdlc*" { return "Engineering activities must address security requirements during design, build, test, and release, not after deployment." }
    "*configuration*" { return "Configuration management must keep approved baselines current and prevent unreviewed drift in systems that support the business." }
    "*hardening*" { return "Hardening standards must be applied consistently so systems and endpoints enter service in a defensible state." }
    "*vulnerability*" { return "Vulnerability management must identify, prioritize, and remediate weaknesses before they create disproportionate risk." }
    "*patch*" { return "Patch management must keep supported systems current enough to limit exploitable exposure and operational risk." }
    "*training*" { return "Security and privacy awareness must be part of normal workforce responsibilities and reinforced through assigned training." }
    "*background*" { return "Personnel screening and lifecycle controls must support the level of trust required for the access each role receives." }
    "*policy management*" { return "Policies must remain current, approved, and understandable so they can be used as operational standards rather than static documents." }
    "*risk management*" { return "Risk management activities must support informed decisions about which issues are accepted, mitigated, transferred, or escalated." }
    "*compliance*" { return "Compliance oversight must keep obligations visible and translate them into practical actions, evidence, and follow-up." }
    "*physical*" { return "Physical safeguards must protect offices, records, and equipment from unauthorized access, loss, and environmental damage." }
    "*sanctions*" { return "Violations of policy must lead to a consistent, documented management response that reflects seriousness, intent, and business impact." }
    "*disciplinary*" { return "Violations of policy must lead to a consistent, documented management response that reflects seriousness, intent, and business impact." }
    default { return "$companyName expects this policy area to operate through documented, repeatable practices that fit the current business and technology environment." }
  }
}

function Get-PolicyOversightLeadText {
  param([string]$PolicyName)

  $policyKey = ([string]$PolicyName).ToLowerInvariant()
  switch -Wildcard ($policyKey) {
    "*access*" { return "Operational oversight for access management must show that approvals, reviews, and exceptions remain controlled over time." }
    "*vendor*" { return "Ongoing vendor oversight must show that service changes, assurance evidence, and ownership remain current after approval." }
    "*incident*" { return "Response governance must show that incidents are escalated, evidenced, and improved after closure." }
    "*risk management*" { return "Risk governance must show that open treatment work, accepted risk, and reassessment triggers remain visible to management." }
    "*privacy*" { return "Privacy oversight must show that processing changes, requests, disclosures, and vendor relationships continue to follow approved practice." }
    "*monitoring*" { return "Monitoring oversight must show that coverage, alert routing, and follow-up remain effective as systems and threats change." }
    "*backup*" { return "Recovery oversight must show that backup coverage, restore testing, and unresolved gaps remain visible and actionable." }
    default { return "Operational oversight must show that this policy continues to work in practice, not just on paper." }
  }
}

function Convert-PolicyStatementToSentence {
  param([string]$Statement, [string]$CompanyName = "The organization")

  $value = Convert-ToMandatoryStatement -Text $Statement
  if (-not $value) { return "" }
  $text = $value.Trim().TrimEnd(".")
  if ($CompanyName) {
    $escapedCompany = [regex]::Escape($CompanyName)
    $text = $text -replace "^(?i)$escapedCompany\s+shall\s+", ""
  }
  $text = $text -replace "^(?i)the company must\s+", ""
  $text = $text -replace "^(?i)the company shall\s+", ""
  $text = $text -replace "^(?i)must\s+", ""
  if (-not $text) { return "" }
  if ($text -notmatch "(?i)\b(must|shall|may|cannot|should)\b") {
    $firstWord = (($text -split "\s+")[0]).Trim(",").ToLowerInvariant()
    $verbLedClauses = @(
      "conduct","perform","complete","centralize","provision","modify","remove","define","maintain",
      "protect","classify","use","manage","restrict","secure","track","review","retain","approve",
      "document","apply","assign","disable","escalate","investigate","collect","update","verify",
      "notify","record","store","rotate","reset","limit","prioritize","test","label","transfer"
    )
    if ($verbLedClauses -contains $firstWord) {
      $text = "the organization must $text"
    }
  }
  return ($text.Substring(0,1).ToUpperInvariant() + $text.Substring(1) + ".")
}

function Convert-PolicyStatementToClause {
  param([string]$Statement, [string]$CompanyName = "The organization")

  $value = Convert-ToMandatoryStatement -Text $Statement
  if (-not $value) { return "" }
  $text = $value.Trim().TrimEnd(".")
  if ($CompanyName) {
    $escapedCompany = [regex]::Escape($CompanyName)
    $text = $text -replace "^(?i)$escapedCompany\s+shall\s+", ""
  }
  $text = $text -replace "^(?i)the company must\s+", ""
  $text = $text -replace "^(?i)the company shall\s+", ""
  if (-not $text) { return "" }
  if ($text.Length -gt 1 -and [char]::IsUpper($text[0]) -and [char]::IsLower($text[1])) {
    $text = $text.Substring(0,1).ToLowerInvariant() + $text.Substring(1)
  }
  if ($text -notmatch "(?i)\b(must|shall|may|cannot|should)\b") {
    $firstWord = (($text -split "\s+")[0]).ToLowerInvariant()
    $verbLedClauses = @(
      "conduct","perform","complete","centralize","provision","modify","remove","define","maintain",
      "protect","classify","use","manage","restrict","secure","track","review","retain","approve",
      "document","apply","assign","disable","escalate","investigate","collect","update","verify",
      "notify","record","store","rotate","reset","limit","prioritize","test","label","transfer"
    )
    if ($verbLedClauses -contains $firstWord) {
      $text = "the organization must $text"
    }
  }
  return $text
}

function Get-PolicyOperationalFollowThroughText {
  param([string]$PolicyName)

  $policyKey = ([string]$PolicyName).ToLowerInvariant()
  switch -Wildcard ($policyKey) {
    "*access*" { return "Least-privilege operation depends on timely entitlement changes, disciplined approval, and clear removal deadlines." }
    "*authentication*" { return "Authentication standards are effective only when credential handling, exception management, and anomaly response remain tightly controlled." }
    "*acceptable use*" { return "These expectations are effective only when workforce behavior and endpoint configuration stay aligned with the approved baseline." }
    "*workstation*" { return "These expectations depend on consistent endpoint configuration, supported software, and timely remediation of device issues." }
    "*vendor*" { return "Vendor governance depends on accurate service records, clear ownership, and reassessment when services or exposure change." }
    "*privacy*" { return "Privacy obligations remain practical only when collection, use, retention, and disclosure decisions are handled through documented workflows." }
    "*backup*" { return "Recovery capability depends on repeatable backup execution, tested restoration, and visible follow-up on failed recovery activities." }
    "*change*" { return "Change control remains effective only when approvals, testing, and rollback preparation are embedded in normal delivery practice." }
    "*logging*" { return "Monitoring effectiveness depends on reliable event coverage, timely review, and clear escalation ownership." }
    "*risk management*" { return "Risk management remains credible only when treatment decisions, ownership, and reassessment triggers stay current." }
    "*physical*" { return "Physical safeguards remain effective only when visitor controls, equipment protection, and facility oversight are consistently applied." }
    default { return "These expectations must be reflected in daily operations, documented decisions, and accountable follow-through." }
  }
}

function New-PolicyNarrativeParagraph {
  param(
    [string]$LeadText,
    [string[]]$Statements,
    [string]$CompanyName = "The organization",
    [string]$ClauseLeadText = ""
  )

  $sentences = @(
    $Statements |
      ForEach-Object { Convert-PolicyStatementToSentence -Statement ([string]$_) -CompanyName $CompanyName } |
      Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } |
      Select-Object -Unique
  )

  $parts = @()
  if (-not [string]::IsNullOrWhiteSpace([string]$LeadText)) {
    $parts += ([string]$LeadText).Trim().TrimEnd(".") + "."
  }
  if (-not [string]::IsNullOrWhiteSpace([string]$ClauseLeadText)) {
    $parts += ([string]$ClauseLeadText).Trim().TrimEnd(".") + "."
  }
  $parts += $sentences
  return (($parts -join " ") -replace "\s+", " ").Trim()
}

function Get-PolicyComposedParagraphs {
  param([string]$PolicyName, [string[]]$RequirementStatements, [string[]]$AssuranceStatements, [object]$Onboarding)

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "The organization" } else { [string]$Onboarding.legal_entity }
  $requirements = @($RequirementStatements | Where-Object { $_ })
  $assurance = @($AssuranceStatements | Where-Object { $_ })

  $requirementPrimary = @($requirements | Select-Object -First 2)
  $requirementSecondary = @($requirements | Select-Object -Skip 2 -First 2)
  $assurancePrimary = @($assurance | Select-Object -First 2)
  $assuranceSecondary = @($assurance | Select-Object -Skip 2 -First 1)

  if ($requirementSecondary.Count -eq 0 -and $assurancePrimary.Count -gt 0) {
    $requirementSecondary = @($assurancePrimary | Select-Object -First 1)
    $assurancePrimary = @($assurancePrimary | Select-Object -Skip 1)
  }

  $requirementParagraphs = @(
    New-PolicyNarrativeParagraph -LeadText (Get-PolicyRequirementLeadText -PolicyName $PolicyName -Onboarding $Onboarding) -Statements $requirementPrimary -CompanyName $companyName
  )
  if ($requirementSecondary.Count -gt 0) {
    $requirementParagraphs += New-PolicyNarrativeParagraph -LeadText (Get-PolicyOperationalFollowThroughText -PolicyName $PolicyName) -Statements $requirementSecondary -CompanyName $companyName
  }

  $assuranceParagraphs = @(
    New-PolicyNarrativeParagraph -LeadText (Get-PolicyOversightLeadText -PolicyName $PolicyName) -Statements $assurancePrimary -CompanyName $companyName
  )
  if ($assuranceSecondary.Count -gt 0) {
    $assuranceParagraphs += New-PolicyNarrativeParagraph -LeadText "Review activity must drive remediation, exception handling, and visible follow-up rather than remain a documentation exercise" -Statements $assuranceSecondary -CompanyName $companyName
  }

  return [ordered]@{
    RequirementText = (@($requirementParagraphs | Where-Object { $_ }) -join " ")
    OversightText = (@($assuranceParagraphs | Where-Object { $_ }) -join " ")
  }
}

function New-PolicyExecutiveSummary {
  param([string]$PolicyName, [object]$Onboarding, [string[]]$TopRiskTitles, [string[]]$FrameworkLabels, [object]$RulesProfile)

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "The company" } else { [string]$Onboarding.legal_entity }
  $purposeText = Get-PolicyPurposeNarrative -PolicyName $PolicyName -Onboarding $Onboarding
  $scopeText = Get-PolicyApplicabilityNarrative -PolicyName $PolicyName -Onboarding $Onboarding
  $riskText = if ($TopRiskTitles.Count -gt 0) { Join-ReadableList -Items @($TopRiskTitles | Select-Object -First 2 | ForEach-Object { ([string]$_).ToLowerInvariant() }) -Conjunction "and" } else { "" }
  $hostingText = Get-CleanPolicyInputText -Value ([string]$Onboarding.cloud_providers) -Fallback "the approved hosting environment"
  $identityText = Get-CleanPolicyInputText -Value ([string]$Onboarding.identity_provider) -Fallback "the primary identity platform"
  $summaryParts = @()
  $summaryParts += "$purposeText"
  $summaryParts += "$scopeText"
  if ($riskText) {
    $summaryParts += "It is intended to reduce operational exposure associated with $riskText and to set a clear management standard for this policy area."
  } else {
    $summaryParts += "It sets a clear management standard for this policy area and is intended to support consistent day-to-day execution."
  }
  $summaryParts += "The policy is written for an operating model centered on $hostingText and $identityText."
  $summary = ($summaryParts -join " ") -replace "\s+", " "
  $maxChars = if ($RulesProfile) { [int]$RulesProfile.ExecutiveSummaryMaxChars } else { 600 }
  if ($maxChars -lt 4) { return $summary }
  if ($summary.Length -le $maxChars) { return $summary }
  return ($summary.Substring(0, ($maxChars - 3)) + "...")
}

function New-PolicyTableOfContents {
  param([string]$PolicyName)

  $titles = Get-PolicySectionTitles -PolicyName $PolicyName
  return @(
    "1. $($titles[0])",
    "1.1 Purpose",
    "1.2 Scope",
    "1.3 Operating context",
    "2. $($titles[1])",
    "2.1 Policy ownership",
    "2.2 Operational responsibility",
    "3. $($titles[2])",
    "3.1 Operating requirements",
    "3.2 Oversight and assurance",
    "4. $($titles[3])",
    "4.1 Exceptions",
    "4.2 Monitoring and review",
    "4.3 Records and evidence",
    "4.4 Related operations"
  ) -join "`n"
}

function New-PolicyBody {
  param([string]$PolicyName, [string]$TemplateText, [object]$Onboarding, [object[]]$TopRisks, [string[]]$FrameworkLabels, [object]$RulesProfile)

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "The company" } else { [string]$Onboarding.legal_entity }
  $scopeText = Get-PolicyApplicabilityNarrative -PolicyName $PolicyName -Onboarding $Onboarding
  $operatingContext = Get-OperatingContextNarrative -Onboarding $Onboarding
  $contextControls = Get-PolicyTailoredStatements -PolicyName $PolicyName -Onboarding $Onboarding
  $assuranceStatements = Get-PolicyAssuranceStatements -PolicyName $PolicyName -Onboarding $Onboarding -TopRisks $TopRisks

  $controlStatements = Get-PolicyTemplateControlStatements -PolicyName $PolicyName -TemplateText $TemplateText
  if ($controlStatements.Count -eq 0) {
    $controlStatements = @(
      "The company must operate role-based controls aligned to approved business responsibilities.",
      "Exceptions must be documented, approved, and tracked to closure.",
      "Evidence of execution must be retained for audit support.",
      "The company must review this policy and related control activity on a defined schedule."
    )
  }

  $requirementStatements = New-Object System.Collections.ArrayList
  $requirementSeen = @{}
  foreach ($statement in @($contextControls + $controlStatements)) {
    Add-UniqueMandatoryStatement -List $requirementStatements -Seen $requirementSeen -Statement $statement
  }
  $maxRequirementCount = if ($contextControls.Count -ge 4) { 4 } else { 6 }
  $requirementStatements = @($requirementStatements | Select-Object -First $maxRequirementCount)
  $composedParagraphs = Get-PolicyComposedParagraphs -PolicyName $PolicyName -RequirementStatements $requirementStatements -AssuranceStatements $assuranceStatements -Onboarding $Onboarding

  $titles = Get-PolicySectionTitles -PolicyName $PolicyName
  $ownerStatement = "The assigned policy owner must maintain this policy, coordinate implementation, and escalate material gaps."
  $lines = @(
    "1. $($titles[0])",
    "",
    "1.1 Purpose",
    "$(Get-PolicyPurposeNarrative -PolicyName $PolicyName -Onboarding $Onboarding)",
    "",
    "1.2 Scope",
    "$scopeText",
    "",
    "1.3 Operating context",
    "$operatingContext",
    "",
    "",
    "2. $($titles[1])",
    "",
    "2.1 Policy ownership",
    "$ownerStatement",
    "",
    "2.2 Operational responsibility",
    "Managers and system owners must implement controls for their areas, and workforce users must follow this policy as a condition of access and ongoing use of company systems.",
    "",
    "",
    "3. $($titles[2])",
    "",
    "3.1 Operating requirements",
    "$($composedParagraphs.RequirementText)",
    "",
    "3.2 Oversight and assurance",
    "$($composedParagraphs.OversightText)",
    "",
    "",
    "4. $($titles[3])",
    "",
    "4.1 Exceptions",
    "Exceptions must be documented, time-bound, approved by designated management, and tracked to closure with compensating controls where needed.",
    "",
    "4.2 Monitoring and review",
    "$(Get-PolicyMonitoringReviewText -PolicyName $PolicyName -Onboarding $Onboarding)",
    "",
    "4.3 Records and evidence",
    "$(Get-PolicyRecordsEvidenceText -PolicyName $PolicyName -Onboarding $Onboarding)",
    "",
    "4.4 Related operations",
    "$(Get-PolicyRelatedOperationsText -PolicyName $PolicyName -Onboarding $Onboarding)"
  )

  $body = $lines -join "`n"
  $bodyWordLimit = if ($RulesProfile) { [int]$RulesProfile.BodyMaxWords } else { 600 }
  if ((Get-PolicyWordCount -Text $body) -le $bodyWordLimit) { return $body }

  $trimmedControls = @($requirementStatements | Select-Object -First 3)
  $trimmedAssurance = @($assuranceStatements | Select-Object -First 2)
  $trimmedOwnerStatement = "The assigned policy owner must maintain this policy and coordinate remediation of material gaps."
  $trimmedParagraphs = Get-PolicyComposedParagraphs -PolicyName $PolicyName -RequirementStatements $trimmedControls -AssuranceStatements $trimmedAssurance -Onboarding $Onboarding
  $trimmedLines = @(
    "1. $($titles[0])",
    "",
    "1.1 Purpose",
    "$(Get-PolicyPurposeNarrative -PolicyName $PolicyName -Onboarding $Onboarding)",
    "",
    "1.2 Scope",
    "$scopeText",
    "",
    "1.3 Operating context",
    "$operatingContext",
    "",
    "",
    "2. $($titles[1])",
    "",
    "2.1 Policy ownership",
    "$trimmedOwnerStatement",
    "",
    "",
    "3. $($titles[2])",
    "",
    "3.1 Operating requirements",
    "$($trimmedParagraphs.RequirementText)",
    "",
    "3.2 Oversight and assurance",
    "$($trimmedParagraphs.OversightText)",
    "",
    "",
    "4. $($titles[3])",
    "",
    "4.1 Exceptions and review",
    "Exceptions must be documented and approved, and this policy must be reviewed at least annually with quarterly control reviews.",
    "",
    "4.2 Records and evidence",
    "$(Get-PolicyRecordsEvidenceText -PolicyName $PolicyName -Onboarding $Onboarding)"
  )

  return ($trimmedLines -join "`n")
}

function Get-SecurityRoleByHeadcount {
  param([object]$Onboarding)

  $raw = [string]$Onboarding.headcount -replace '[^0-9]', ''
  $headcount = 0
  [int]::TryParse($raw, [ref]$headcount) | Out-Null
  if ($headcount -le 0)   { return "the security function" }
  if ($headcount -lt 20)  { return "the security-aware engineer or designated technical lead" }
  if ($headcount -lt 50)  { return "the IT or security lead" }
  if ($headcount -lt 200) { return "the Security Manager or CISO" }
  return "the Chief Information Security Officer (CISO)"
}

function Get-NamedSystemsFromOnboarding {
  param([object]$Onboarding)

  $parts = @()
  $cloud = Get-CleanPolicyInputText -Value ([string]$Onboarding.cloud_providers) -Fallback ""
  if ($cloud) { $parts += $cloud }
  $idp = Get-CleanPolicyInputText -Value ([string]$Onboarding.identity_provider) -Fallback ""
  if ($idp) { $parts += $idp }
  $monitoring = Get-CleanPolicyInputText -Value ([string]$Onboarding.monitoring_tools) -Fallback ""
  if ($monitoring) { $parts += $monitoring }
  $mdr = Get-CleanPolicyInputText -Value ([string]$Onboarding.mdr_provider) -Fallback ""
  if ($mdr) { $parts += $mdr }
  if ($parts.Count -eq 0) { return "the approved system stack" }
  return Join-ReadableList -Items $parts -Conjunction "and"
}

function Get-NamedDataTypesFromOnboarding {
  param([object]$Onboarding)

  $types = Get-CleanPolicyInputText -Value ([string]$Onboarding.data_types) -Fallback ""
  if (-not $types) { return "in-scope company and customer data" }
  return $types
}

function Build-PolicyMetadataBlock {
  param([object]$Policy, [object]$Onboarding, [string[]]$FrameworkLabels)

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "The company" } else { [string]$Onboarding.legal_entity }
  $securityRole = Get-SecurityRoleByHeadcount -Onboarding $Onboarding
  $ownerDisplay = if ([string]$Policy.policy_owner) { [string]$Policy.policy_owner } else { $securityRole }
  $frameworkDisplay = if ($FrameworkLabels -and $FrameworkLabels.Count -gt 0) { $FrameworkLabels -join ", " } else { "Internal" }
  $lines = @(
    "Policy: $([string]$Policy.name)",
    "ID: $([string]$Policy.policy_id)",
    "Owner: $ownerDisplay",
    "Version: $([string]$Policy.policy_version)",
    "Organisation: $companyName",
    "Framework: $frameworkDisplay",
    "Classification: Internal — Confidential"
  )
  return $lines -join "`n"
}

function Invoke-CompanySpecificityPass {
  param([object[]]$Policies, [object]$Onboarding)

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { $null } else { [string]$Onboarding.legal_entity }
  $cloudRaw = Get-CleanPolicyInputText -Value ([string]$Onboarding.cloud_providers) -Fallback ""
  $idpRaw = Get-CleanPolicyInputText -Value ([string]$Onboarding.identity_provider) -Fallback ""
  $scope = Get-CleanPolicyInputText -Value ([string]$Onboarding.scope) -Fallback ""
  $namedDataTypes = Get-NamedDataTypesFromOnboarding -Onboarding $Onboarding
  $securityRole = Get-SecurityRoleByHeadcount -Onboarding $Onboarding

  $totalImprovements = 0
  $specificityScores = @()
  $updatedPolicies = @()

  foreach ($policy in @($Policies)) {
    $improvementCount = 0

    $updatedPolicy = [ordered]@{}
    if ($policy -is [System.Collections.IDictionary]) {
      foreach ($key in $policy.Keys) { $updatedPolicy[[string]$key] = $policy[$key] }
    } else {
      foreach ($prop in $policy.PSObject.Properties.Name) { $updatedPolicy[$prop] = $policy.$prop }
    }

    $body = [string]$policy.body
    $originalBodyLength = [Math]::Max(1, $body.Length)

    if ($companyName) {
      $genericTerms = @("The company", "the company", "The organization", "the organization", "The organisation", "the organisation")
      foreach ($term in $genericTerms) {
        $count = ([regex]::Matches($body, [regex]::Escape($term))).Count
        if ($count -gt 0) {
          $body = $body -replace [regex]::Escape($term), $companyName
          $improvementCount += $count
        }
      }
    }

    if ($cloudRaw -and $cloudRaw -ne "the approved hosting environment") {
      $count = ([regex]::Matches($body, "the approved hosting environment|the primary hosting environment")).Count
      $body = $body -replace "the approved hosting environment|the primary hosting environment", $cloudRaw
      $improvementCount += $count
    }

    if ($idpRaw -and $idpRaw -ne "the primary identity platform") {
      $count = ([regex]::Matches($body, "the primary identity platform")).Count
      $body = $body -replace "the primary identity platform", $idpRaw
      $improvementCount += $count
    }

    if ($scope -and $scope -ne "In-scope application and supporting systems") {
      $count = ([regex]::Matches($body, "(?i)in-scope application and supporting systems")).Count
      $body = $body -replace "(?i)in-scope application and supporting systems", $scope
      $improvementCount += $count
    }

    if ($securityRole -ne "the security function") {
      $count = ([regex]::Matches($body, "(?i)the security function")).Count
      $body = $body -replace "(?i)the security function", $securityRole
      $improvementCount += $count
    }

    if ($namedDataTypes -ne "in-scope company and customer data") {
      $count = ([regex]::Matches($body, "company or customer data|company and customer data|regulated or sensitive data")).Count
      $body = $body -replace "company or customer data|company and customer data|regulated or sensitive data", $namedDataTypes
      $improvementCount += $count
    }

    $updatedPolicy.body = $body

    $summary = [string]$policy.executive_summary
    if ($companyName) {
      foreach ($term in @("The company", "the company", "The organization", "the organization")) {
        $count = ([regex]::Matches($summary, [regex]::Escape($term))).Count
        if ($count -gt 0) {
          $summary = $summary -replace [regex]::Escape($term), $companyName
          $improvementCount += $count
        }
      }
    }
    if ($cloudRaw -and $cloudRaw -ne "the approved hosting environment") {
      $summary = $summary -replace "the approved hosting environment|the primary hosting environment", $cloudRaw
    }
    if ($idpRaw -and $idpRaw -ne "the primary identity platform") {
      $summary = $summary -replace "the primary identity platform", $idpRaw
    }
    $updatedPolicy.executive_summary = ($summary -replace "\s+", " ").Trim()

    $frameworkLabels = @([string]$policy.framework_mapping -split ",\s*" | Where-Object { $_ })
    $updatedPolicy.metadata_block = Build-PolicyMetadataBlock -Policy $policy -Onboarding $Onboarding -FrameworkLabels $frameworkLabels

    $totalImprovements += $improvementCount
    $wordsInBody = [Math]::Max(1, [Math]::Floor($originalBodyLength / 6))
    $specificityScore = [Math]::Min(100, [int](40 + ([Math]::Min($improvementCount, $wordsInBody) / [Math]::Max(1, $wordsInBody)) * 60))
    $specificityScores += $specificityScore

    $updatedPolicies += $updatedPolicy
  }

  $avgSpecificity = if ($specificityScores.Count -gt 0) { [int](($specificityScores | Measure-Object -Sum).Sum / $specificityScores.Count) } else { 40 }

  return [ordered]@{
    Policies            = @($updatedPolicies)
    TotalImprovements   = $totalImprovements
    SpecificityScore    = $avgSpecificity
  }
}

function New-VendorAssessmentQuestions {
  param([object]$Vendor, [object]$Onboarding)

  $vendorName = [string]$Vendor.vendor_name
  $dataTypes = Get-NamedDataTypesFromOnboarding -Onboarding $Onboarding
  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "the company" } else { [string]$Onboarding.legal_entity }

  return [ordered]@{
    security_posture = @(
      "Does $vendorName hold a current SOC 2 Type II, ISO 27001, or equivalent certification, and what is the last audit date and coverage scope?",
      "Has $vendorName disclosed any security incidents in the last 24 months that could affect $companyName data or service availability?",
      "What is $vendorName's patch management and vulnerability response SLA for critical findings?"
    )
    data_handling = @(
      "What categories of $dataTypes does $vendorName receive, store, or process on behalf of $companyName?",
      "Where is $companyName data stored geographically, and does $vendorName use sub-processors for any data handling?",
      "What encryption standards does $vendorName apply to $companyName data at rest and in transit?"
    )
    access_controls = @(
      "Who at $vendorName has access to $companyName data or production systems, and how is that access provisioned and reviewed?",
      "Does $vendorName enforce multi-factor authentication for all staff with access to $companyName environments?",
      "How does $vendorName notify $companyName of personnel changes that affect access to $companyName systems or data?"
    )
    business_continuity = @(
      "What is $vendorName's target RTO and RPO for services relied upon by $companyName?",
      "Has $vendorName tested its continuity plan in the last 12 months, and can evidence be provided?",
      "How will $vendorName communicate unplanned outages that affect $companyName's service delivery?"
    )
    contractual_compliance = @(
      "Does the $vendorName contract include data processing agreements, breach notification timelines, and audit rights?",
      "What are the exit provisions and data return or deletion obligations if $companyName terminates the relationship?",
      "Does $vendorName flow down equivalent security and compliance obligations to its own sub-processors?"
    )
    incident_response = @(
      "What is $vendorName's breach notification timeline and communication channel for incidents affecting $companyName?",
      "Does $vendorName have a dedicated incident response team and a documented playbook for security events?",
      "How are forensic artefacts and logs from $vendorName systems made available to $companyName during an investigation?"
    )
    ongoing_assurance = @(
      "Does $vendorName provide annual or event-driven evidence of its security controls (e.g. penetration test summaries, SOC 2 reports)?",
      "How does $vendorName communicate material changes to its service architecture, data handling, or security controls?",
      "What is the contact for $vendorName's security and compliance team and the SLA for responding to $companyName assurance enquiries?"
    )
  }
}

function New-ImprovementLog {
  param([int]$SpecificityScore, [int]$TotalSpecificityImprovements, [int]$PolicyCount, [string]$GeneratedAt, [object[]]$Policies = @(), [object]$Onboarding = $null)

  # ── Real specificity score ──────────────────────────────────
  # Count actual company-specific references present in final policy bodies
  $realSpecificity = $SpecificityScore
  if ($Policies.Count -gt 0 -and $Onboarding) {
    $companyName  = [string]$Onboarding.legal_entity
    $cloudRaw     = [string]$Onboarding.cloud_providers
    $idpRaw       = [string]$Onboarding.identity_provider
    $terms = @($companyName, $cloudRaw, $idpRaw) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    $totalHits = 0
    foreach ($policy in @($Policies)) {
      $body = [string]$policy.body
      foreach ($term in $terms) {
        $totalHits += ([regex]::Matches($body, [regex]::Escape($term), [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
      }
    }
    $hitsPerPolicy = if ($Policies.Count -gt 0) { $totalHits / $Policies.Count } else { 0 }
    # Map: 0 hits = 40, 3 hits = 65, 6 hits = 80, 10+ hits = 95
    $realSpecificity = [Math]::Min(95, [int](40 + [Math]::Min(55, $hitsPerPolicy * 5.5)))
  }

  # ── Real depth score ────────────────────────────────────────
  # Based on avg word count per policy body + executive summary presence
  $depthScore = 55
  if ($Policies.Count -gt 0) {
    $totalWords = 0
    $tocCount   = 0
    $summaryCount = 0
    foreach ($policy in @($Policies)) {
      $body = [string]$policy.body
      $totalWords += ($body -split '\s+' | Where-Object { $_ }).Count
      if ([string]$policy.table_of_contents) { $tocCount++ }
      if ([string]$policy.executive_summary)  { $summaryCount++ }
    }
    $avgWords = if ($Policies.Count -gt 0) { $totalWords / $Policies.Count } else { 0 }
    # 200w=55, 400w=68, 600w=78, 800w=86, 1000w+=92
    $wordScore = [Math]::Min(92, [int](55 + [Math]::Min(37, ($avgWords / 1000) * 37)))
    $tocBonus  = if ($tocCount -ge $Policies.Count * 0.8) { 4 } else { 0 }
    $sumBonus  = if ($summaryCount -ge $Policies.Count * 0.8) { 4 } else { 0 }
    $depthScore = [Math]::Min(100, $wordScore + $tocBonus + $sumBonus)
  }

  # ── Real formatting score ───────────────────────────────────
  # Check for: metadata block, numbered sections, section headers, TOC, executive summary
  $formattingScore = 50
  if ($Policies.Count -gt 0) {
    $metaCount    = 0
    $numberedCount = 0
    $headerCount  = 0
    $tocCount2    = 0
    $summaryCount2 = 0
    foreach ($policy in @($Policies)) {
      $body = [string]$policy.body
      if ([string]$policy.metadata_block)      { $metaCount++ }
      if ($body -match '\d+\.\d+\s+\w')         { $numberedCount++ }
      if ($body -match '(?m)^#{1,3}\s+\w|^[A-Z][A-Z\s]{4,}$') { $headerCount++ }
      if ([string]$policy.table_of_contents)   { $tocCount2++ }
      if ([string]$policy.executive_summary)   { $summaryCount2++ }
    }
    $n = $Policies.Count
    $formattingScore = [int](
      ($metaCount    / $n * 25) +
      ($numberedCount / $n * 25) +
      ($tocCount2    / $n * 20) +
      ($summaryCount2 / $n * 20) +
      ($headerCount  / $n * 10)
    )
    $formattingScore = [Math]::Max(50, [Math]::Min(100, $formattingScore))
  }

  $overallScore = [int](($realSpecificity * 0.4) + ($formattingScore * 0.3) + ($depthScore * 0.3))

  $improvements = @()
  if ($TotalSpecificityImprovements -gt 0) {
    $improvements += "Replaced $TotalSpecificityImprovements generic references with company-specific named systems, data types, and roles across $PolicyCount policies."
  }
  $improvements += "Applied metadata headers to all $PolicyCount policies (ID, owner, version, organisation, framework, classification)."
  $improvements += "Formatting pass enforced section headers, numbered subsections, and consistent line spacing."
  $improvements += "Narrative rewrite pass removed passive constructions and anchored obligations to named subjects."
  $improvements += "Policy body and executive summary trimmed to word-count and character limits."

  return [ordered]@{
    generated_at                  = if ($GeneratedAt) { $GeneratedAt } else { (Get-Date).ToString("o") }
    overall_score                 = $overallScore
    specificity_score             = $realSpecificity
    depth_score                   = $depthScore
    formatting_score              = $formattingScore
    total_specificity_improvements = $TotalSpecificityImprovements
    policy_count                  = $PolicyCount
    improvements                  = @($improvements)
  }
}

function New-PolicyDraftRecords {
  param([object]$Onboarding, [object[]]$TopRisks)

  $templateNames = Get-TemplateInventory
  if ($templateNames.Count -eq 0) {
    $templateNames = @("Information Security Policy")
  }

  $frameworkLabels = Get-FrameworkLabels -Onboarding $Onboarding
  $topRiskTitles = @($TopRisks | ForEach-Object { $_.title })
  $users = @(Get-ClientUsersFromOnboarding -Onboarding $Onboarding)
  $owner = if ($users.Count -gt 0) { [string]$users[0].name } else { "" }
  $signOffBy = if ($users.Count -gt 1) { [string]$users[1].name } elseif ($users.Count -gt 0) { [string]$users[0].name } else { "" }
  $rulesText = Get-PolicyGenerationRulesText
  $rulesProfile = Get-PolicyGenerationProfile -RulesText $rulesText
  $policies = @()

  for ($index = 0; $index -lt $templateNames.Count; $index++) {
    $policyName = $templateNames[$index]
    $policyId = "POL-{0}" -f ($index + 1).ToString("000")
    $controlId = "CTRL-{0}" -f ($index + 1).ToString("000")
    $templateText = Get-TemplateText -TemplateName $policyName
    $policyFrameworkMappings = Get-PolicyFrameworkMappings -PolicyName $policyName -Onboarding $Onboarding
    $policies += [ordered]@{
      policy_id = $policyId
      name = $policyName
      policy_owner = $owner
      sign_off_by = $signOffBy
      policy_version = "v1.0"
      published = "No"
      published_by = ""
      published_at = ""
      sign_off_complete = "No"
      sign_off_completed_by = ""
      sign_off_completed_at = ""
      framework_mapping = $policyFrameworkMappings -join ", "
      linked_risks = ($topRiskTitles | Select-Object -First 3) -join ", "
      linked_controls = $controlId
      executive_summary = New-PolicyExecutiveSummary -PolicyName $policyName -Onboarding $Onboarding -TopRiskTitles $topRiskTitles -FrameworkLabels $policyFrameworkMappings -RulesProfile $rulesProfile
      table_of_contents = New-PolicyTableOfContents -PolicyName $policyName
      body = New-PolicyBody -PolicyName $policyName -TemplateText $templateText -Onboarding $Onboarding -TopRisks $TopRisks -FrameworkLabels $policyFrameworkMappings -RulesProfile $rulesProfile
      approval_history_text = ""
    }
  }

  return @($policies)
}

function Invoke-PolicyNarrativeRewritePass {
  param([object[]]$Policies, [object]$Onboarding)

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "The organization" } else { [string]$Onboarding.legal_entity }
  $rewrittenPolicies = @()

  foreach ($policy in @($Policies)) {
    $summary = [string]$policy.executive_summary
    $summary = $summary -replace "\bIt is intended to reduce operational exposure associated with\b", "It reduces exposure associated with"
    $summary = $summary -replace "\bThe policy is written for an operating model centered on\b", "It reflects an operating model centered on"
    $summary = ($summary -replace "\s+", " ").Trim()

    $body = [string]$policy.body
    $body = $body -replace "Managers and system owners must implement controls for their areas, and workforce users must follow this policy as a condition of access and ongoing use of company systems\.", "Managers and system owners must implement the requirements in their areas, and workforce users must follow this policy as a condition of continued access to company systems."
    $body = $body -replace "Review activity must drive remediation, exception handling, and visible follow-up rather than remain a documentation exercise", "$companyName must treat review activity as an operational decision point that drives remediation, exception handling, and visible follow-up."
    $body = $body -replace "\bThe assigned policy owner must maintain this policy, coordinate implementation, and escalate material gaps\.", "The assigned policy owner must keep this policy current, coordinate implementation across relevant teams, and escalate material gaps that affect the operating environment."
    $body = $body -replace "\s+`n", "`n"
    $body = $body.Trim()

    $updatedPolicy = [ordered]@{}
    if ($policy -is [System.Collections.IDictionary]) {
      foreach ($property in $policy.Keys) {
        $updatedPolicy[[string]$property] = $policy[$property]
      }
    } else {
      foreach ($property in $policy.PSObject.Properties.Name) {
        $updatedPolicy[$property] = $policy.$property
      }
    }
    $updatedPolicy.executive_summary = $summary
    $updatedPolicy.body = $body
    $rewrittenPolicies += $updatedPolicy
  }

  return @($rewrittenPolicies)
}

function Format-PolicyDocumentText {
  param([string]$Text)

  $normalizedText = ([string]$Text -replace "`r`n", "`n" -replace "`r", "`n").Trim()
  $lines = $normalizedText -split "`n"
  $formattedLines = New-Object System.Collections.ArrayList
  $previousBlank = $false

  foreach ($line in $lines) {
    $normalizedLine = ($line -replace "\s+", " ").TrimEnd()
    if ([string]::IsNullOrWhiteSpace($normalizedLine)) {
      if (-not $previousBlank) {
        [void]$formattedLines.Add("")
      }
      $previousBlank = $true
      continue
    }

    # Convert old inline format "1.1 Heading. Content paragraph..." → heading on own line
    if ($normalizedLine -match '^(\d+\.\d+(?:\.\d+)?\s+[A-Za-z][^.\r\n]{2,50})\.\s+([A-Z][^\r\n]{20,})$') {
      if ($formattedLines.Count -gt 0 -and [string]$formattedLines[$formattedLines.Count - 1] -ne "") {
        [void]$formattedLines.Add("")
      }
      [void]$formattedLines.Add($Matches[1])
      [void]$formattedLines.Add("")
      [void]$formattedLines.Add($Matches[2])
      $previousBlank = $false
      continue
    }

    # Ensure blank line before main section headings (1. 2. 3. 4.)
    if ($normalizedLine -match "^\d+\." -and $formattedLines.Count -gt 0 -and [string]$formattedLines[$formattedLines.Count - 1] -ne "") {
      [void]$formattedLines.Add("")
    }

    [void]$formattedLines.Add($normalizedLine)
    $previousBlank = $false
  }

  return (($formattedLines -join "`n") -replace "(`n){3,}", "`n`n").Trim()
}

function Invoke-PolicyFormattingPass {
  param([object[]]$Policies)

  $formattedPolicies = @()
  foreach ($policy in @($Policies)) {
    $updatedPolicy = [ordered]@{}
    if ($policy -is [System.Collections.IDictionary]) {
      foreach ($property in $policy.Keys) {
        $updatedPolicy[[string]$property] = $policy[$property]
      }
    } else {
      foreach ($property in $policy.PSObject.Properties.Name) {
        $updatedPolicy[$property] = $policy.$property
      }
    }
    $updatedPolicy.table_of_contents = Format-PolicyDocumentText -Text ([string]$policy.table_of_contents)
    $updatedPolicy.body = Format-PolicyDocumentText -Text ([string]$policy.body)
    $updatedPolicy.executive_summary = ([string]$policy.executive_summary -replace "\s+", " ").Trim()
    $formattedPolicies += $updatedPolicy
  }

  return @($formattedPolicies)
}

# ── AI Enhancement Functions (Claude API) ────────────────────────────────────

function Invoke-ClaudeApi {
  param(
    [string]$SystemPrompt,
    [string]$UserPrompt,
    [int]$MaxTokens = 8000
  )
  $apiKey = $env:ANTHROPIC_API_KEY
  if ([string]::IsNullOrWhiteSpace($apiKey)) { $script:aiKeyValid = $false; return $null }
  try {
    $requestBody = [ordered]@{
      model      = "claude-sonnet-4-6"
      max_tokens = $MaxTokens
      system     = $SystemPrompt
      messages   = @(@{ role = "user"; content = $UserPrompt })
    } | ConvertTo-Json -Depth 10 -Compress
    $response = Invoke-WebRequest -Uri "https://api.anthropic.com/v1/messages" `
      -Method POST -Body $requestBody -ContentType "application/json" `
      -Headers @{ "x-api-key" = $apiKey; "anthropic-version" = "2023-06-01" } `
      -UseBasicParsing
    $script:aiKeyValid = $true
    # Force UTF-8 decoding — prevents garbled Unicode (em-dashes, curly quotes, ellipsis)
    $utf8Text = [System.Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
    $obj = $utf8Text | ConvertFrom-Json
    $rawText = $obj.content[0].text
    # Normalise common Unicode punctuation to plain ASCII equivalents
    $rawText = $rawText -replace '\u2014','--' -replace '\u2013','-' -replace '[\u201C\u201D]','"' -replace '[\u2018\u2019]',"'" -replace '\u2026','...' -replace '\u00A0',' '
    return $rawText
  } catch {
    $msg = $_.Exception.Message
    if ($msg -match "401") {
      $script:aiKeyValid = $false
      Write-Host "[AI] 401 Unauthorized — API key is invalid. Update via Settings in the app."
    } else {
      Write-Host "Invoke-ClaudeApi error: $msg"
    }
    return $null
  }
}

function ConvertFrom-ClaudeJsonArray {
  param([string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return $null }
  $s = $Text.IndexOf("[")
  $e = $Text.LastIndexOf("]")
  if ($s -lt 0 -or $e -le $s) { return $null }
  try { return ($Text.Substring($s, $e - $s + 1) | ConvertFrom-Json) } catch { return $null }
}

function Invoke-AiPolicyEnhancement {
  param([object[]]$Policies, [object]$Onboarding)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return $Policies }

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "the company" } else { [string]$Onboarding.legal_entity }
  $industry    = [string]$Onboarding.industry
  $cloud       = [string]$Onboarding.cloud_providers
  $idp         = [string]$Onboarding.identity_provider
  $dataTypes   = [string]$Onboarding.data_types
  $frameworks  = [string]$Onboarding.framework_selection
  $techStack   = (@($cloud, $idp) | Where-Object { $_ }) -join ", "

  $system = "You are a senior GRC consultant rewriting compliance policies for a specific company. Rules: (1) Use the company name '$companyName' — never 'the company' or 'the organization'. (2) Name actual systems, tools, and data types. (3) Each subsection heading (e.g. '1.1 Purpose') MUST be on its own line followed by a blank line, then the paragraph — never inline as '1.1 Heading. Content...'. (4) Break multi-requirement paragraphs (3+ 'must' statements) into numbered or bulleted lists. (5) Make every control statement auditable and concrete. (6) Return ONLY a valid JSON array — no markdown, no explanation, same structure as input."

  $batchSize = 5
  $enhanced  = @()

  for ($i = 0; $i -lt $Policies.Count; $i += $batchSize) {
    $top   = [Math]::Min($i + $batchSize - 1, $Policies.Count - 1)
    $batch = @($Policies[$i..$top])
    $batchJson = $batch | ConvertTo-Json -Depth 20 -Compress
    $user  = "Company: $companyName. Industry: $industry. Tech stack: $techStack. Data types: $dataTypes. Frameworks: $frameworks. Rewrite the body and executive_summary fields of each policy to be client-specific, properly formatted with headings on their own lines, and auditable. Preserve all other fields. Return the full policy array as JSON. Input: $batchJson"
    $raw   = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $user -MaxTokens 8000
    $result = ConvertFrom-ClaudeJsonArray -Text $raw
    if ($result) { $enhanced += @($result) } else { $enhanced += @($batch) }
  }
  return $enhanced
}

function Invoke-AiRiskEnhancement {
  param([object[]]$Risks, [object]$Onboarding)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return $Risks }

  $co      = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "the company" } else { [string]$Onboarding.legal_entity }
  $cloud   = [string]$Onboarding.cloud_providers
  $idp     = [string]$Onboarding.identity_provider
  $data    = [string]$Onboarding.data_types
  $classif = [string]$Onboarding.classification
  $enc     = [string]$Onboarding.encryption
  $backup  = [string]$Onboarding.backup
  $monitor = [string]$Onboarding.monitoring
  $mfa     = [string]$Onboarding.mfa_enabled
  $access  = [string]$Onboarding.access_model

  $system = @"
You are a senior GRC risk analyst writing a risk register for $co.
IMPORTANT RULES — every rule is mandatory:
1. Each risk's 'why_this_company' MUST name $co, reference the actual systems ($cloud, $idp) and actual data ($data, $classif).
2. Each 'treatment_plan' MUST be unique, non-repetitive, and contain 5-7 concrete steps that name $co's actual tools and workflows. Vary sentence structure and verb choices across risks. Do NOT reuse phrases like 'assign a business owner' or 'document the owner' as the primary action for more than one risk.
3. 'treatment_plan' steps must be implementable in the next 90 days — include who does what, how frequently, and what evidence to retain.
4. 'control_gaps' must name specific gaps based on ($cloud, $idp, $data, $mfa, $access, $monitor, $backup) — not generic phrases.
5. 'likelihood_justification' and 'impact_justification' must cite $co's actual configuration details.
6. Preserve all numeric score fields unchanged.
7. Return ONLY a valid JSON array with the same keys as input — no markdown, no explanation.
"@
  $context = "Company: $co | Industry: $([string]$Onboarding.industry) | Cloud/infra: $cloud | IdP: $idp | MFA: $mfa | Data handled: $data | Classified data: $classif | Encryption: $enc | Backup approach: $backup | Monitoring: $monitor | Access model: $access | Headcount: $([string]$Onboarding.employee_headcount)"
  $user    = "$context`n`nEnhance these risks to be specific, varied, and operationally actionable for $co. Input: $($Risks | ConvertTo-Json -Depth 20 -Compress)"
  $raw     = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $user -MaxTokens 8000
  $result  = ConvertFrom-ClaudeJsonArray -Text $raw
  if ($result) { return @($result) } else { return $Risks }
}

function Invoke-TreatmentPlanAgent {
  # Generates focused, AI-driven treatment plans for each risk using full context.
  # Called after risks exist but before saving — replaces any template-generated treatment_plan.
  param([object[]]$Risks, [object]$Onboarding, [object[]]$Policies, [object[]]$Vendors)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return $Risks }
  if (@($Risks | Where-Object { $_ }).Count -eq 0) { return $Risks }

  $co      = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "the company" } else { [string]$Onboarding.legal_entity }
  $cloud   = [string]$Onboarding.cloud_providers
  $idp     = [string]$Onboarding.identity_provider
  $data    = [string]$Onboarding.data_types
  $monitor = [string]$Onboarding.monitoring
  $backup  = [string]$Onboarding.backup
  $enc     = [string]$Onboarding.encryption
  $mfa     = [string]$Onboarding.mfa_enabled
  $access  = [string]$Onboarding.access_model

  $policyIndex = @($Policies | ForEach-Object {
    "$([string]$_.policy_id): $([string]$_.name)"
  }) -join "; "

  $vendorIndex = @($Vendors | Select-Object -First 8 | ForEach-Object {
    "$([string]$_.vendor_name) ($([string]$_.service_category))"
  }) -join ", "

  $system = @"
You are a senior GRC consultant writing treatment plans for $co's risk register.
Context: $co | Cloud: $cloud | IdP: $idp | MFA: $mfa | Data: $data | Encryption: $enc | Backup: $backup | Monitoring: $monitor | Access model: $access
Available policies: $policyIndex
Vendors in scope: $vendorIndex

TREATMENT PLAN RULES — strictly enforced:
1. Each treatment plan must be unique. Do NOT reuse identical steps across risks.
2. Every step must name $co's actual tools, systems, or processes by name ($cloud, $idp, etc.).
3. Include 5-7 steps per risk. Use active voice with a clear owner (e.g. "The security lead must...", "Engineering rotates...").
4. Each plan must include: one detection/monitoring step, one review cadence step, and one evidence retention requirement.
5. Reference the linked policy by ID/name where relevant.
6. Vary vocabulary and sentence structure — no two risks should read like clones of each other.
7. Return ONLY a valid JSON array. Each element: { "risk_id": "...", "treatment_plan": "..." }. No other fields.
"@

  $slim = @($Risks | ForEach-Object {
    [ordered]@{
      risk_id        = [string]$_.risk_id
      threat         = [string]$_.threat
      category       = [string]$_.category
      control_gaps   = [string]$_.control_gaps
      linked_policies = [string]$_.linked_policies
      inherent_score = [string]$_.inherent_score
    }
  })
  $user = "Generate treatment plans for these $co risks. For each, use the risk's threat, control gaps, and linked policies to write a distinct, operationally concrete plan. Risks: $($slim | ConvertTo-Json -Depth 5 -Compress)"
  $raw  = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $user -MaxTokens 6000

  $planMap = @{}
  $arr = ConvertFrom-ClaudeJsonArray -Text $raw
  if ($arr) {
    foreach ($item in @($arr)) {
      if ([string]$item.risk_id -and [string]$item.treatment_plan) {
        $planMap[[string]$item.risk_id] = [string]$item.treatment_plan
      }
    }
  }

  if ($planMap.Count -eq 0) { return $Risks }

  return @($Risks | ForEach-Object {
    $rid = [string]$_.risk_id
    if ($planMap.ContainsKey($rid)) {
      $_ | Add-Member -NotePropertyName "treatment_plan" -NotePropertyValue $planMap[$rid] -Force
    }
    $_
  })
}

function Invoke-AiVendorEnhancement {
  param([object[]]$Vendors, [object]$Onboarding)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return $Vendors }

  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "the company" } else { [string]$Onboarding.legal_entity }
  $system = "You are a senior GRC vendor risk analyst. Enhance vendor assessment records to be specific and actionable. Rules: (1) 'notes' must describe the actual vendor risk in the context of this company's environment — not generic. (2) 'treatment_plan' must reference specific controls and concrete review actions. (3) 'assessment_questions' must be targeted to this vendor's actual service type and data access. (4) Preserve all numeric risk scores — only enhance text fields. (5) Return ONLY a valid JSON array — same structure as input, no markdown, no explanation."
  $context = "Company: $companyName. Industry: $([string]$Onboarding.industry). Cloud stack: $([string]$Onboarding.cloud_providers). Data types: $([string]$Onboarding.data_types). Scope: $([string]$Onboarding.scope)."
  $inputJson = $Vendors | ConvertTo-Json -Depth 20 -Compress
  $user = "$context Enhance these vendor assessment records with company-specific narratives and targeted questions. Input: $inputJson"
  $raw  = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $user -MaxTokens 6000
  $result = ConvertFrom-ClaudeJsonArray -Text $raw
  if ($result) { return @($result) } else { return $Vendors }
}

# ── Multi-Agent Pipeline ──────────────────────────────────────

function New-CompanyBrief {
  param([object]$Onboarding)
  $base = [ordered]@{
    company      = [string]$Onboarding.legal_entity
    industry     = [string]$Onboarding.industry
    tech_stack   = (@([string]$Onboarding.cloud_providers, [string]$Onboarding.identity_provider) | Where-Object { $_ }) -join ", "
    data_handled = [string]$Onboarding.data_types
    frameworks   = [string]$Onboarding.framework_selection
    headcount    = [string]$Onboarding.employee_headcount
    scope        = [string]$Onboarding.scope
    tone         = "audit-ready, operationally specific, no boilerplate"
  }
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return $base }

  $system = "You are a senior GRC consultant. Read client onboarding data and produce a structured company brief used by downstream AI agents. Be precise and factual. Return ONLY valid JSON — no markdown, no explanation."
  $user   = "Produce a company brief from this onboarding data. Include: company name, industry, full tech stack (every tool named), data types handled, compliance frameworks, headcount band, scope, top 3-5 implied key risks, and recommended documentation tone. Onboarding: $($Onboarding | ConvertTo-Json -Depth 10 -Compress)"
  $raw    = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $user -MaxTokens 2000
  if ($raw) {
    $s = $raw.IndexOf("{"); $e = $raw.LastIndexOf("}")
    if ($s -ge 0 -and $e -gt $s) { try { return $raw.Substring($s, $e - $s + 1) | ConvertFrom-Json } catch {} }
  }
  return $base
}

function Invoke-PolicyWriterAgent {
  param([object[]]$Policies, [object]$Brief, [object]$Onboarding)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return $Policies }

  $co       = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { [string]$Brief.company } else { [string]$Onboarding.legal_entity }
  $industry = [string]$Onboarding.industry
  $cloud    = [string]$Onboarding.cloud_providers
  $idp      = [string]$Onboarding.identity_provider
  $mfa      = [string]$Onboarding.mfa_enabled
  $access   = [string]$Onboarding.access_model
  $data     = [string]$Onboarding.data_types
  $classif  = [string]$Onboarding.classification
  $enc      = [string]$Onboarding.encryption
  $backup   = [string]$Onboarding.backup
  $monitor  = [string]$Onboarding.monitoring
  $headcount = [string]$Onboarding.employee_headcount
  $tech     = if ($Brief.tech_stack  -is [array]) { $Brief.tech_stack  -join ", " } else { [string]$Brief.tech_stack }
  $fw       = if ($Brief.frameworks  -is [array]) { $Brief.frameworks  -join ", " } else { [string]$Brief.frameworks }
  $risks    = if ($Brief.key_risks   -is [array]) { $Brief.key_risks   -join ", " } else { [string]$Brief.key_risks }
  # Security posture signals
  $pubAccess    = [string]$Onboarding.publicly_accessible
  $prodSep      = [string]$Onboarding.prod_test_separation
  $irProcess    = [string]$Onboarding.incident_response_process
  $logsReviewed = [string]$Onboarding.security_logs_reviewed
  $backupTested = [string]$Onboarding.backups_tested
  $critAccess   = [string]$Onboarding.critical_access_many
  $prodChanges  = [string]$Onboarding.prod_changes_reviewed
  $complianceReq = [string]$Onboarding.compliance_proof_requested
  $secOwner     = [string]$Onboarding.security_owner
  $dataLeakImpact = [string]$Onboarding.data_leak_impact
  # Vendor stack summary
  $vendorList = @($Onboarding.vendors | Where-Object { $_ -and [string]$_.vendor_name } | ForEach-Object {
    $vn = [string]$_.vendor_name
    $vc = [string]$_.service_category
    $vd = [string]$_.data_types_handled
    $va = [string]$_.access_level_detail
    "$vn$(if($vc){" ($vc)"})(data: $(if($vd){$vd}else{'unspecified'}); access: $(if($va){$va}else{'unspecified'}))"
  }) -join "; "
  if (-not $vendorList) { $vendorList = "none recorded" }

  $system = @"
You are ${co}'s senior GRC consultant authoring official, audit-credible compliance policies.

COMPANY CONTEXT — embed these specifics in every policy:
Company: ${co} | Industry: $industry | Headcount: $headcount
Cloud / hosting: $cloud | Identity provider: $idp | MFA: $mfa | Access model: $access
Data types: $data | Classification: $classif | Encryption: $enc
Backup: $backup | Monitoring / SIEM: $monitor
Frameworks: $fw | Key risks: $risks

SECURITY POSTURE (use to calibrate control requirements):
Publicly accessible systems: $pubAccess | Prod/test separation: $prodSep
IR process in place: $irProcess | Security logs reviewed regularly: $logsReviewed
Backups tested: $backupTested | Many people with critical/admin access: $critAccess
Prod changes peer-reviewed: $prodChanges | Compliance proof requested by customers: $complianceReq
Security/compliance owner: $secOwner | Data leak business impact: $dataLeakImpact

VENDOR / TECHNOLOGY STACK (name these in relevant policy sections):
$vendorList

MANDATORY WRITING RULES — all rules apply to every policy:
1. COMPANY NAME: Use "${co}" in the first sentence of every section. Never write "the organization", "the company", or "the entity."
2. TOOL SPECIFICITY: Name actual tools from the company context — not "a cloud provider" but "$cloud"; not "an identity system" but "$idp"; not "monitoring tools" but "$monitor." Reference specific vendors from the stack above in policies that govern their use.
3. DATA SPECIFICITY: Reference $data and $classif explicitly when describing what the policy protects. Not "sensitive data" but the actual data types.
4. SECURITY POSTURE: If $pubAccess is Yes, include explicit internet-facing controls. If $irProcess is No or empty, include building IR capability as a requirement. If $logsReviewed is No, include mandatory log review obligations. Match control stringency to the actual posture answers.
5. HEADINGS: Subsection headings must be on their own line followed by a blank line. Never write "1.1 Heading. Content..." inline. Never merge a heading and its first sentence on the same line.
6. LISTS: Three or more obligations, controls, or requirements become a numbered list. No run-on sentences with "and" chaining 4+ items.
7. AUDITABLE CONTROLS: Every control statement must name who owns it, what they must do, and how often. E.g. "The IT Security Lead must review all $idp privileged accounts quarterly and remove access within 24 hours of termination."
8. EXECUTIVE SUMMARY: Must state specifically why this policy matters for ${co} — reference the company's industry, data types, and at least one named tool. Not a generic description of the policy type.
9. UNIQUENESS: Every policy MUST open with a unique purpose sentence that directly describes the specific subject of that policy. NEVER use the formula "[Company] establishes the standards for [X] in support of [business description]." That is a generic filler formula — it is prohibited. Instead, start the purpose with a concrete statement about what the policy governs and the specific risk it addresses for ${co}. For example: "Access to ${co}'s $cloud environment and $idp accounts must be governed by least-privilege principles to protect $data from unauthorized disclosure." Make the first sentence earn its place.
10. NO BUSINESS MODEL COPY-PASTE: Do NOT copy the company's business model description ("Providing Viso services..." or "consulting services for companies...") into policy text. Business model text has no place in a policy body. Write about what the policy governs, not what the company does commercially.
11. PRESERVE EXACTLY: policy_id, name, category, owner, sign_off_by, review_cycle, version, effective_date, linked_risks, linked_controls, treatment_action, treatment_owner, treatment_due, all metadata fields. Only rewrite body and executive_summary.
12. OUTPUT: Return ONLY a valid JSON array — same structure as input. No markdown, no commentary.
13. NO HALLUCINATION: NEVER invent tool names, product names, team names, department names, job titles, process names, certifications, or systems that are not explicitly listed in the company context above. If context is missing, use only role titles (e.g. "the Security Owner", "the CEO") — never invent names. If a process does not exist yet, frame it as a requirement to establish, not as an existing process.
14. NO INVENTED VENDORS: Only reference vendor names explicitly listed in the VENDOR / TECHNOLOGY STACK section. Never add tools, SaaS products, or infrastructure components not listed.
15. NO FILLER: Do not add generic compliance boilerplate that could apply to any company. Every sentence must be grounded in ${co}'s actual context, specific tools, and real security posture.
"@

  $written = @()
  for ($i = 0; $i -lt $Policies.Count; $i += 3) {
    $batch  = @($Policies[$i..[Math]::Min($i + 2, $Policies.Count - 1)])
    $user   = "Rewrite the body and executive_summary of each policy to be fully specific to ${co}. CRITICAL: Do NOT use the formula '[Company] establishes the standards for [X] in support of [business description]' — this is banned. Each policy must open with a unique, subject-specific sentence that states what the policy governs and the risk it addresses. Do NOT copy the business model description into policy text. Use ONLY the tools, vendors, and data types listed in the company context. Reference $cloud, $idp, $data, $monitor, and relevant vendors where applicable. Calibrate control requirements to the security posture signals. Ensure every heading is on its own line with a blank line after it. Every policy must read as if written specifically for ${co}'s real $industry environment — not a generic template. Return complete policy array as JSON. Input: $($batch | ConvertTo-Json -Depth 20 -Compress)"
    $raw    = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $user -MaxTokens 16000
    $result = ConvertFrom-ClaudeJsonArray -Text $raw
    $written += if ($result) { @($result) } else { @($batch) }
  }
  return $written
}

function Invoke-PolicyCriticAgent {
  # Deterministic scorer — no API call needed. Checks the same rubric with string matching.
  param([object[]]$Policies, [object]$Brief, [object]$Onboarding = $null)
  $co    = if ($Onboarding -and -not [string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { [string]$Onboarding.legal_entity } else { [string]$Brief.company }
  $cloud = if ($Onboarding) { [string]$Onboarding.cloud_providers } else { "" }
  $idp   = if ($Onboarding) { [string]$Onboarding.identity_provider } else { "" }
  $data  = if ($Onboarding) { [string]$Onboarding.data_types } else { "" }

  $results = @()
  foreach ($policy in $Policies) {
    $polId = [string]$policy.policy_id
    $body  = [string]$policy.body
    $exec  = [string]$policy.executive_summary
    $full  = "$exec $body"
    $score = 100
    $flags = @()

    # Generic company references (-5 each, max -20)
    $genericMatches = ([regex]::Matches($full, '(?i)\b(the organization|the company|the entity|the firm)\b')).Count
    if ($genericMatches -gt 0) { $score -= [Math]::Min(20, $genericMatches * 5); $flags += "Uses generic 'the organization/company' language ($genericMatches times) instead of '$co'" }

    # Missing company name in executive summary (-10)
    if ($exec -and $exec -notmatch [regex]::Escape($co)) { $score -= 10; $flags += "Executive summary does not mention '$co' by name" }

    # Missing cloud tool reference in body (-5)
    if ($cloud -and $body -and $body -notmatch [regex]::Escape($cloud.Split(',')[0].Trim())) { $score -= 5; $flags += "Body does not reference cloud provider '$cloud'" }

    # Missing IdP reference in body (-5)
    if ($idp -and $body -and $body -notmatch [regex]::Escape($idp.Split(',')[0].Trim())) { $score -= 5; $flags += "Body does not reference identity provider '$idp'" }

    # Inline headings: "1.1 Heading. Content..." on same line (-8 each, max -24)
    $inlineHeadings = ([regex]::Matches($body, '(?m)^\d+\.\d+[^\n]{3,50}\.\s+[A-Z]')).Count
    if ($inlineHeadings -gt 0) { $score -= [Math]::Min(24, $inlineHeadings * 8); $flags += "Inline headings detected ($inlineHeadings) — heading and content on same line" }

    # Weak modal language (-3 each, max -15)
    $weakLang = ([regex]::Matches($full, '(?i)\b(should consider|may implement|could adopt|might want to)\b')).Count
    if ($weakLang -gt 0) { $score -= [Math]::Min(15, $weakLang * 3); $flags += "Weak non-auditable language ($weakLang instances): 'should consider', 'may implement', etc." }

    $results += [ordered]@{ policy_id = $polId; score = [Math]::Max(0, $score); flags = $flags }
  }
  return $results
}

function Invoke-PolicyRewriterAgent {
  param([object[]]$Policies, [object[]]$CriticResults, [object]$Brief, [int]$Threshold = 80)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return $Policies }

  $co      = [string]$Brief.company
  $failed  = @($CriticResults | Where-Object { [int]$_.score -lt $Threshold })
  if ($failed.Count -eq 0) { return $Policies }
  $failIds = @($failed | ForEach-Object { [string]$_.policy_id })

  $system = "You are fixing specific flagged issues in $co compliance policies. Fix ONLY the flagged issues — preserve everything else. Return ONLY a valid JSON object with the corrected policy."
  $fixed  = @{}
  foreach ($cr in $failed) {
    $polId  = [string]$cr.policy_id
    $policy = $Policies | Where-Object { [string]$_.policy_id -eq $polId } | Select-Object -First 1
    if (-not $policy) { continue }
    $flags  = @($cr.flags) -join "; "
    $user   = "Fix ONLY these issues: $flags. Return the corrected policy as JSON. Policy: $($policy | ConvertTo-Json -Depth 20 -Compress)"
    $raw    = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $user -MaxTokens 4000
    $s = $raw.IndexOf("{"); $e = $raw.LastIndexOf("}")
    if ($s -ge 0 -and $e -gt $s) { try { $fixed[$polId] = $raw.Substring($s, $e - $s + 1) | ConvertFrom-Json; continue } catch {} }
    $fixed[$polId] = $policy
  }
  return @($Policies | ForEach-Object { if ($fixed.ContainsKey([string]$_.policy_id)) { $fixed[[string]$_.policy_id] } else { $_ } })
}

function Invoke-RiskAnalystAgent {
  param([object[]]$Risks, [object[]]$Policies, [object]$Brief, [object]$Onboarding)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return $Risks }

  $co      = if ([string]::IsNullOrWhiteSpace([string]$Brief.company)) { "the company" } else { [string]$Brief.company }
  $industry = [string]$Onboarding.industry
  $headcount = [string]$Onboarding.employee_headcount
  $workType  = [string]$Onboarding.work_type
  $cloud     = [string]$Onboarding.cloud_providers
  $regions   = [string]$Onboarding.storage_regions
  $idp       = [string]$Onboarding.identity_provider
  $mfa       = [string]$Onboarding.mfa_enabled
  $access    = [string]$Onboarding.access_model
  $data      = [string]$Onboarding.data_types
  $classif   = [string]$Onboarding.classification
  $enc       = [string]$Onboarding.encryption
  $backup    = [string]$Onboarding.backup
  $monitor   = [string]$Onboarding.monitoring
  $biz       = ([string]$Onboarding.business_model).Substring(0, [Math]::Min(300, ([string]$Onboarding.business_model).Length))
  # Security posture signals
  $pubAccess    = [string]$Onboarding.publicly_accessible
  $prodSep      = [string]$Onboarding.prod_test_separation
  $irProcess    = [string]$Onboarding.incident_response_process
  $logsReviewed = [string]$Onboarding.security_logs_reviewed
  $backupTested = [string]$Onboarding.backups_tested
  $critAccess   = [string]$Onboarding.critical_access_many
  $prodChanges  = [string]$Onboarding.prod_changes_reviewed
  $complianceReq = [string]$Onboarding.compliance_proof_requested
  $secOwner     = [string]$Onboarding.security_owner
  $dataLeakImpact = [string]$Onboarding.data_leak_impact
  # Vendor intel summary (top-criticality vendors with their intel fields)
  $vendorIntel = @($Onboarding.vendors | Where-Object { $_ -and [string]$_.vendor_name } | ForEach-Object {
    $vn = [string]$_.vendor_name; $vc = [string]$_.service_category
    $vd = [string]$_.data_types_handled; $va = [string]$_.access_level_detail
    $vbi = [string]$_.business_impact; $vcon = [string]$_.has_contract; $vdpa = [string]$_.has_dpa
    "$vn$(if($vc){" [$vc]"}): data=$( if($vd){$vd}else{'unspecified'} ) | access=$( if($va){$va}else{'unspecified'} ) | impact=$( if($vbi){$vbi}else{'unknown'} ) | contract=$( if($vcon){$vcon}else{'unknown'} ) | DPA=$( if($vdpa){$vdpa}else{'unknown'} )"
  }) -join "`n"
  if (-not $vendorIntel) { $vendorIntel = "No vendors recorded." }

  $policyIndex = @($Policies | ForEach-Object {
    "$([string]$_.policy_id) ($([string]$_.name)): $( ([string]$_.body).Substring(0,[Math]::Min(300,([string]$_.body).Length)) )"
  }) -join "`n"

  $system = @"
You are a senior GRC consultant producing a production-ready, audit-credible risk register for ${co}.

COMPANY CONTEXT — use these facts in every risk record:
Company: ${co} | Industry: $industry | Headcount: $headcount | Work model: $workType
Cloud / hosting: $cloud | Storage regions: $regions
Identity provider: $idp | MFA enabled: $mfa | Access model: $access
Data types processed: $data | Classification: $classif | Encryption: $enc
Backup strategy: $backup | Monitoring / SIEM: $monitor
Business model: $biz

SECURITY POSTURE (factor into likelihood and control gap analysis):
Publicly accessible systems: $pubAccess | Prod/test separation: $prodSep
IR process in place: $irProcess | Logs reviewed regularly: $logsReviewed
Backups tested: $backupTested | Many people with critical/admin access: $critAccess
Prod changes peer-reviewed: $prodChanges | Compliance proof requested by customers: $complianceReq
Security owner: $secOwner | Data leak business impact: $dataLeakImpact

VENDOR INTELLIGENCE (use for vendor-related risks and third-party control gaps):
$vendorIntel

AVAILABLE POLICY IDs AND EXCERPTS:
$policyIndex

REWRITE RULES — every rule is mandatory:
1. WHY_THIS_COMPANY: 2-3 sentences. Name ${co} explicitly. Reference actual cloud ($cloud), IdP ($idp), data types ($data), and business context. Explain precisely why this risk is elevated for ${co} — not a generic company. Never write "the organization" or "the company".
2. VULNERABILITY: Name the specific technical gap or configuration weakness at ${co} that exposes this threat. Reference real tools (cloud platform, IdP, monitoring stack, etc.).
3. EXISTING_CONTROLS: List actual policy IDs from the index that address this risk with a one-sentence description per policy: "POL-001 (Name): controls X; POL-002 (Name): controls Y."
4. CONTROL_GAPS: Be operationally precise — not "controls may be lacking" but e.g. "no defined quarterly entitlement review process for $idp admin roles" or "encryption-at-rest policy does not cover $cloud object storage buckets." Name specific gaps tied to ${co}'s actual environment.
5. IMPACT_DESCRIPTION: Real-world consequences if this risk materialises — regulatory obligations, financial loss, service disruption, reputational damage. Reference $data sensitivity, $classif level, and ${co}'s business model.
6. LIKELIHOOD_JUSTIFICATION: Cite ${co}'s actual attack surface — $cloud exposure, $idp configuration, $mfa status, $access model, industry threat landscape. Justify the numeric score with specifics.
7. IMPACT_JUSTIFICATION: Justify the numeric impact score citing $data sensitivity, $classif level, $backup coverage, business criticality, and recovery obligations.
8. TREATMENT_PLAN: Already generated by the treatment plan agent — preserve exactly as is. Do NOT rewrite it.
9. PRESERVE EXACTLY: likelihood, impact, inherent_score, inherent_rating, residual_likelihood, residual_impact, residual_score, residual_rating, risk_id, category, threat, threat_source, linked_policies, linked_controls, treatment_action, treatment_owner, treatment_due, review_date.
10. UNIQUENESS: No two risks may share identical sentences, opening phrases, or structural patterns. Vary vocabulary and narrative framing per risk.
11. OUTPUT: Return ONLY a valid JSON array with the same keys as input. No markdown, no commentary, no extra fields.
"@

  $user = "Rewrite every descriptive text field in these ${co} risk records using the company context and policy index above. Risks: $($Risks | ConvertTo-Json -Depth 20 -Compress)"
  $raw  = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $user -MaxTokens 12000
  $result = ConvertFrom-ClaudeJsonArray -Text $raw
  if ($result) { return @($result) } else { return $Risks }
}

function Invoke-VendorAnalystAgent {
  param([object[]]$Vendors, [object[]]$Policies, [object[]]$Risks, [object]$Brief, [object]$Onboarding)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return $Vendors }

  $co        = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { [string]$Brief.company } else { [string]$Onboarding.legal_entity }
  $industry  = [string]$Onboarding.industry
  $headcount = [string]$Onboarding.employee_headcount
  $cloud     = [string]$Onboarding.cloud_providers
  $regions   = [string]$Onboarding.storage_regions
  $idp       = [string]$Onboarding.identity_provider
  $mfa       = [string]$Onboarding.mfa_enabled
  $access    = [string]$Onboarding.access_model
  $data      = [string]$Onboarding.data_types
  $classif   = [string]$Onboarding.classification
  $enc       = [string]$Onboarding.encryption
  $backup    = [string]$Onboarding.backup
  $monitor   = [string]$Onboarding.monitoring
  $devices   = [string]$Onboarding.devices_used
  $framework = [string]$Onboarding.framework_selection
  $biz       = ([string]$Onboarding.business_model).Substring(0, [Math]::Min(300, ([string]$Onboarding.business_model).Length))
  # Security posture signals from company-level onboarding questions
  $pubAccess   = [string]$Onboarding.publicly_accessible
  $prodSep     = [string]$Onboarding.prod_test_separation
  $irProcess   = [string]$Onboarding.incident_response_process
  $logsReviewed = [string]$Onboarding.security_logs_reviewed
  $backupTested = [string]$Onboarding.backups_tested
  $secOwner    = [string]$Onboarding.security_owner

  $policyIndex = @($Policies | ForEach-Object {
    "$([string]$_.policy_id) ($([string]$_.name)): $( ([string]$_.body).Substring(0,[Math]::Min(200,([string]$_.body).Length)) )"
  }) -join "`n"

  $riskIndex = @($Risks | ForEach-Object {
    "$([string]$_.risk_id) | $([string]$_.threat) | gaps: $( ([string]$_.control_gaps).Substring(0,[Math]::Min(160,([string]$_.control_gaps).Length)) )"
  }) -join "`n"

  $system = @"
You are a senior GRC consultant writing production-ready third-party vendor risk assessments for ${co}, a ${headcount}-person ${industry} startup.

=== COMPANY PROFILE ===
Legal entity: ${co} | Industry: $industry | Headcount: $headcount | Work model: Remote
Cloud / hosting: $cloud | Storage regions: $regions
Identity provider: $idp | MFA: $mfa | Access model: $access
Publicly accessible systems: $pubAccess | Prod/test separation: $prodSep
Incident response process: $irProcess | Logs reviewed regularly: $logsReviewed | Backups tested: $backupTested
Security owner: $secOwner
Data processed: $data | Classification: $classif
Encryption: $enc | Backup: $backup | Monitoring/SIEM: $monitor
Devices: $devices | Compliance framework: $framework
Business: $biz

=== POLICY REGISTER ===
$policyIndex

=== RISK REGISTER (ID | Threat | Control Gaps) ===
$riskIndex

=== CATEGORY-SPECIFIC TREATMENT RULES ===
Apply the relevant block to every vendor based on its service_category. Each action must name ${co} and the specific vendor.

[CLOUD INFRASTRUCTURE — AWS, GCP, Azure, etc.]
Primary objective: Govern ${co}'s shared-responsibility boundary and ensure all cloud-hosted data is protected, monitored, and recoverable.
Required actions:
- Confirm the shared-responsibility split: what the provider manages vs what ${co} owns. Document in the vendor register.
- Verify IAM least-privilege: no wildcard (*) permissions in production. Tie IAM account creation/removal to $idp provisioning so leavers lose access within 24 hours.
- Confirm encryption at rest (AES-256) and in transit (TLS 1.3) for all ${co} data buckets/volumes — referencing: $enc
- Validate GuardDuty, CloudTrail, or equivalent alerting is enabled and forwarding to $monitor. Alert on root account usage.
- Confirm snapshot/backup schedule meets ${co}'s RTO/RPO. Reference: $backup. Test recovery from snapshot at least annually.
- Restrict data storage to $regions. Any sub-processor or replication outside $regions requires documented approval.

[SOURCE CODE MANAGEMENT — GitHub, GitLab, Bitbucket, etc.]
Primary objective: Prevent source code exposure, secret leakage, and supply-chain compromise in ${co}'s codebase.
Required actions:
- Enforce organisation-level SAML SSO via $idp. Only active $idp accounts may access ${co}'s GitHub organisation. Leavers' access must be revoked within 24 hours of $idp suspension.
- Audit all repositories for hardcoded secrets, API keys, or credentials. Reference Dependabot/CodeQL if enabled. Define a SLA for critical vulnerability remediation (recommended: 7 days for critical CVEs).
- Confirm all production/main branches enforce branch protection: required reviews, passing status checks, and no direct pushes.
- Review all personal access tokens (PATs), deploy keys, and OAuth apps quarterly. Revoke tokens belonging to departed staff immediately.
- Confirm all repositories containing ${co} client or infrastructure data are set to private.
- Audit GitHub Actions workflow permissions to prevent supply-chain injection via third-party actions.

[PAYMENTS — Stripe, Adyen, PayPal, etc.]
Primary objective: Maintain PCI DSS scope reduction and ensure ${co}'s payment integration does not expose cardholder data.
Required actions:
- Confirm ${co} operates entirely outside PCI DSS card data scope because the processor tokenises all card data. Document this scope boundary in the compliance register.
- Verify all payment API keys and webhook signing secrets are stored in $cloud Secrets Manager — never in application code, environment files, or GitHub repositories.
- Validate that all incoming webhook payloads are signature-verified before processing to prevent spoofed payment events.
- Restrict dashboard/admin access to the minimum necessary staff. At ${headcount} people, this should be a single named billing administrator. Enforce MFA on the payment dashboard account.
- Define a process for approving manual refunds and adjustments. All dashboard actions must be logged and reviewed monthly.
- Confirm customer billing record retention and deletion obligations. Ensure offboarded clients' billing data is deleted per the contractual timeline.

[IDENTITY PROVIDER — Google Workspace, Okta, Azure AD, etc.]
Primary objective: Protect the master identity layer — compromise here cascades to every SaaS tool ${co} uses.
Required actions:
- Limit super-administrator accounts to a maximum of 2 named individuals. Both must use hardware security keys or authenticator-app MFA — not SMS.
- Conduct a quarterly audit of all OAuth applications authorised via $idp. Revoke any app that is unrecognised, unused for 90+ days, or requests excessive scopes.
- Enforce a 24-hour SLA for suspending (not just deprovisioning) departed staff accounts. Suspended accounts must retain audit logs for 90 days before deletion.
- Forward $idp admin audit logs to $monitor. Create alerts for: super-admin role assignment, MFA bypass, password reset for admin accounts.
- Document the location and custodian of emergency recovery codes for admin accounts. Review annually.
- Annually review all domain-wide delegation grants in $idp to confirm no excessive service account permissions remain.

[COMMUNICATION / COLLABORATION — Slack, Teams, Google Chat, etc.]
Primary objective: Prevent ${co}'s internal communications and shared files from becoming an uncontrolled data store for $classif information.
Required actions:
- Confirm message and file storage region aligns with $regions. Review Slack/Teams data residency settings and document in the vendor register.
- Define and enforce a message retention policy that matches ${co}'s data classification requirements for $classif data. Configure retention in the admin console — do not rely on user behaviour.
- Conduct a quarterly audit of all external/guest workspace members. Every guest must have a documented business justification and an expiry date.
- Prohibit sharing of API keys, passwords, certificates, or credentials in any channel. Implement a DLP policy or at minimum a documented prohibition in the Acceptable Use Policy.
- Restrict workspace data exports to admin accounts only. Log all export events and forward to $monitor.
- Review all connected third-party apps and integrations. Remove any not actively used or without a documented owner.

[ISSUE TRACKING / PROJECT MANAGEMENT — Jira, Linear, Asana, Notion, etc.]
Primary objective: Ensure project tooling does not become an uncontrolled repository for ${co}'s $classif data or security vulnerability details.
Required actions:
- Review all projects containing security vulnerability, incident, or $classif data to confirm they are not accessible to external collaborators or guest accounts.
- Conduct a quarterly audit of all external/guest users. Remove guests at project end and within 24 hours of engagement completion.
- Review all integrations and webhooks configured in the tool. Disable unused integrations and ensure all active ones are owned by a named ${co} team member.
- Confirm that ticket data, attachments, and comments are covered by ${co}'s backup strategy: $backup
- Classify projects containing $classif data and apply access restrictions consistent with the classification policy.

[CDN / NETWORK SECURITY — Cloudflare, Fastly, Akamai, etc.]
Primary objective: Protect ${co}'s DNS, web traffic, and edge layer — a misconfiguration here is equivalent to a full traffic takeover.
Required actions:
- Restrict DNS record changes to a named approver. All DNS changes must go through a change control process — unauthorised DNS modification could redirect all ${co} traffic.
- Review and enforce WAF ruleset quarterly. Document any deliberately disabled rules with a business justification and risk acceptance sign-off.
- All API tokens must follow least-privilege scoping (per-zone, per-permission). Rotate all API tokens annually. Store in $cloud Secrets Manager.
- Confirm Full (Strict) SSL/TLS mode is enabled for all ${co} zones. Flexible SSL must not be used — it exposes backend traffic in plaintext.
- Set DDoS protection to at least "High" for all production endpoints. Review thresholds after any attack event.
- Enable Cloudflare audit log forwarding to $monitor. Alert on admin login, zone changes, and firewall rule modifications.

[SIEM / SECURITY MONITORING — Splunk, Datadog, Elastic, SumoLogic, etc.]
Primary objective: Ensure ${co}'s detection capability covers all critical log sources and that the SIEM itself is hardened as a high-value target.
Required actions:
- Audit log source coverage: confirm $cloud CloudTrail/audit logs, $idp admin logs, and application-layer logs are all forwarding to $monitor with no gaps.
- Review all active alert rules. Document each rule's owner, expected true-positive rate, and escalation path. Suppress known false positives with documented justifications.
- Confirm log retention meets ${co}'s $framework compliance requirements. Immutable log storage recommended for audit trails.
- Restrict SIEM admin and dashboard access to named security personnel only. SIEM data reveals ${co}'s full attack surface — treat as Confidential.
- Link SIEM alerts to documented incident response runbooks. Each alert type must have a named responder and SLA.
- Review SIEM integration credentials quarterly. Rotate all API keys used for log ingestion and alert forwarding.

[BACKUP / DISASTER RECOVERY — Secondary cloud, Veeam, Acronis, etc.]
Primary objective: Ensure ${co}'s secondary storage remains isolated, recoverable, and does not duplicate the access vulnerabilities of the primary environment.
Required actions:
- Confirm the secondary backup environment ($backup) uses separate credentials and access controls from the primary $cloud environment. A single compromised account must not disable both primary and backup.
- Test data recovery from the secondary environment at least semi-annually. Document RTO/RPO achieved in each test.
- Confirm backup data is encrypted at rest and in transit with the same standards as the primary: $enc
- Restrict access to backup management consoles to a maximum of 2 named administrators.
- Confirm data stored in the backup environment is subject to the same regional restrictions ($regions) as the primary environment.

=== MANDATORY OUTPUT RULES ===
A. data_accessed: REWRITE this field to reflect what this specific vendor ACTUALLY handles at ${co}. Use the vendor's data_types_handled field (client-supplied) if present; otherwise derive from service_category. Do not copy ${co}'s full data inventory onto every vendor.
B. certifications: If vendor_certifications_confirmed is "Yes", note that certifications are client-confirmed. Also populate with publicly known certifications for major vendors (AWS=SOC2/ISO27001/PCI/FedRAMP, GitHub=SOC2/ISO27001, Google=SOC2/ISO27001, Stripe=PCI-DSS-L1/SOC2, Cloudflare=SOC2/ISO27001, Splunk=SOC2/ISO27001). Do not leave blank for major SaaS providers.
A2. CLIENT-SUPPLIED INTELLIGENCE: Each vendor record now contains client-specific answers. Use these to make the assessment more precise:
  - stores_processes_data / data_types_handled / access_level_detail: Use in notes, data_accessed, and treatment_plan to describe actual data and access exposure.
  - business_impact: If "Critical" or "Major impact", escalate urgency in treatment_plan and review cadence.
  - has_contract / has_dpa: If "No" or "Not sure", add an action to obtain/confirm the contract or DPA in the treatment_plan.
  - vendor_certifications_confirmed: If "No" or "Not sure", add an assessment question asking the vendor to provide their current certification status.
C. notes: 2-3 sentences. Name ${co} and the vendor. Describe the exact role this vendor plays in ${co}'s live environment, referencing the vendor's purpose field. State specifically why this vendor's access or failure would impact ${co}'s $classif data or $framework compliance posture.
D. treatment_plan: Write the treatment plan using the category block above. Format: "Treatment plan (Mitigate)\nPrimary objective: [one precise sentence]\nKey actions:\n- [action 1]\n- [action 2]\n...\nReview requirement: [specific cadence]". Every action must name ${co} or reference a specific tool ($monitor, $idp, $cloud). No filler sentences.
E. assessment_questions: 4-6 audit-ready questions specific to this vendor's category and ${co}'s risk profile. Each question must reference ${co} or a specific data type/system. Avoid questions that any vendor could answer generically.
F. linked_risks: Assign risk IDs from the register that this vendor's failure DIRECTLY triggers. A payments outage → financial/availability risks. An IDP breach → access/identity risks. A SIEM failure → detection/monitoring risks. Different vendors must map to different primary risks where appropriate.
G. PRESERVE EXACTLY: vendor_id, vendor_name, service_category, all numeric fields (inherent_score, residual_score, vendor_likelihood, vendor_impact, residual_likelihood, residual_impact), inherent_risk, residual_risk, linked_controls, website, location, access_level.
H. UNIQUENESS: No two vendors may share the same sentences, bullet points, or paragraph structure. Every treatment plan must be structurally and substantively unique to its vendor.
I. OUTPUT: Return ONLY a valid JSON array of vendor objects. No markdown fences, no commentary, no wrapper object. Start with [ and end with ].
"@

  # Process in batches of 3 to stay well under the token limit
  $batchSize  = 3
  $allResults = [System.Collections.Generic.List[object]]::new()
  for ($i = 0; $i -lt $Vendors.Count; $i += $batchSize) {
    $batch     = @($Vendors[$i .. [Math]::Min($i + $batchSize - 1, $Vendors.Count - 1)])
    $batchUser = "Rewrite every descriptive text field for these ${co} vendor records. Apply the company profile, category-specific treatment rules, and output rules above.`n`nVendors JSON:`n$($batch | ConvertTo-Json -Depth 20 -Compress)"
    $raw       = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $batchUser -MaxTokens 14000
    Write-Host "[VendorAgent] Batch $([Math]::Floor($i/$batchSize)+1): response length $(if($raw){$raw.Length}else{0}) chars"
    $parsed = ConvertFrom-ClaudeJsonArray -Text $raw
    if ($parsed) {
      foreach ($v in $parsed) { $allResults.Add($v) }
      Write-Host "[VendorAgent] Batch $([Math]::Floor($i/$batchSize)+1): parsed $(@($parsed).Count) vendors OK"
    } else {
      Write-Host "[VendorAgent] Batch $([Math]::Floor($i/$batchSize)+1): parse FAILED — keeping template data for this batch"
      foreach ($v in $batch) { $allResults.Add($v) }
    }
  }
  if ($allResults.Count -gt 0) { return @($allResults) } else { return $Vendors }
}

function Invoke-QaCrossCheckAgent {
  param([object[]]$Policies, [object[]]$Risks, [object[]]$Vendors, [object]$Brief)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { return [ordered]@{ passed = $true; issues = @(); checked_at = (Get-Date).ToString("o") } }

  $co    = [string]$Brief.company
  $pids  = (@($Policies | ForEach-Object { [string]$_.policy_id })) -join ", "
  $rsum  = @($Risks   | ForEach-Object { [ordered]@{ risk_id = [string]$_.risk_id; linked_policies = [string]$_.linked_policies; why = ([string]$_.why_this_company).Substring(0,[Math]::Min(150,([string]$_.why_this_company).Length)) } }) | ConvertTo-Json -Depth 4 -Compress
  $vsum  = @($Vendors | ForEach-Object { [ordered]@{ vendor_id = [string]$_.vendor_id; name = [string]$_.vendor_name; linked_risks = [string]$_.linked_risks; notes = ([string]$_.notes).Substring(0,[Math]::Min(150,([string]$_.notes).Length)) } }) | ConvertTo-Json -Depth 4 -Compress

  $system = "You are a GRC QA auditor for $co. Check compliance program consistency. Return JSON: {passed:bool,issues:[{type,entity_id,description,severity}],checked_at:string}. Check: (1) risks referencing non-existent policy IDs, (2) vendors with no risk references, (3) remaining generic language ('the organization','the company'), (4) missing company name in key fields."
  $user   = "Available policy IDs: $pids. Risks: $rsum. Vendors: $vsum. Run consistency check for $co."
  $raw    = Invoke-ClaudeApi -SystemPrompt $system -UserPrompt $user -MaxTokens 3000
  if ($raw) {
    $s = $raw.IndexOf("{"); $e = $raw.LastIndexOf("}")
    if ($s -ge 0 -and $e -gt $s) { try { $r = $raw.Substring($s,$e-$s+1) | ConvertFrom-Json; $r | Add-Member -NotePropertyName "checked_at" -NotePropertyValue (Get-Date).ToString("o") -Force; return $r } catch {} }
  }
  return [ordered]@{ passed = $true; issues = @(); checked_at = (Get-Date).ToString("o") }
}

function New-PolicyGenerationSection {
  param([object]$Onboarding, [object[]]$TopRisks, [object[]]$Policies, [string]$StartedAt = "")

  $section = New-PolicyGenerationProgressSection -Onboarding $Onboarding -TopRisks $TopRisks
  $policyCount = @($Policies | Where-Object { $_ }).Count
  if ([string]$StartedAt) {
    $section.generation_started_at = $StartedAt
  }
  return (Complete-PolicyGenerationSection -Section $section -Policies $Policies -Note ("{0} policies generated after draft, rewrite, formatting, specificity, and QA passes." -f $policyCount))
}

function New-PolicyQaSection {
  param([object[]]$Policies, [object]$Onboarding)

  $findings = @()
  $counter = 1
  $companyName = [string]$Onboarding.legal_entity
  foreach ($policy in $Policies) {
    if (-not [string]$policy.policy_owner) {
      $findings += [ordered]@{
        finding_id = "PQA-{0}" -f $counter.ToString("000")
        policy_id = $policy.policy_id
        severity = "High"
        category = "Ownership"
        details = "Policy owner is not assigned."
        resolution_status = "Open"
      }
      $counter++
    }
    if (-not [string]$policy.sign_off_by) {
      $findings += [ordered]@{
        finding_id = "PQA-{0}" -f $counter.ToString("000")
        policy_id = $policy.policy_id
        severity = "Medium"
        category = "Approval"
        details = "Sign-off user is not assigned."
        resolution_status = "Open"
      }
      $counter++
    }
    if ([string]::IsNullOrWhiteSpace([string]$policy.executive_summary) -or [string]$policy.executive_summary.Length -gt 600) {
      $findings += [ordered]@{
        finding_id = "PQA-{0}" -f $counter.ToString("000")
        policy_id = $policy.policy_id
        severity = "Medium"
        category = "Executive Summary"
        details = "Executive summary is missing or exceeds the allowed length."
        resolution_status = "Open"
      }
      $counter++
    }
    if ([string]::IsNullOrWhiteSpace([string]$policy.table_of_contents)) {
      $findings += [ordered]@{
        finding_id = "PQA-{0}" -f $counter.ToString("000")
        policy_id = $policy.policy_id
        severity = "Medium"
        category = "Formatting"
        details = "Table of contents is missing."
        resolution_status = "Open"
      }
      $counter++
    }
    if ((Get-PolicyWordCount -Text ([string]$policy.body)) -gt 600) {
      $findings += [ordered]@{
        finding_id = "PQA-{0}" -f $counter.ToString("000")
        policy_id = $policy.policy_id
        severity = "High"
        category = "Length"
        details = "Policy body exceeds the target word-count limit."
        resolution_status = "Open"
      }
      $counter++
    }
    if (-not ([string]$policy.body -match "(?i)\b(must|shall)\b")) {
      $findings += [ordered]@{
        finding_id = "PQA-{0}" -f $counter.ToString("000")
        policy_id = $policy.policy_id
        severity = "High"
        category = "Enforceability"
        details = "Policy body does not contain sufficient enforceable language."
        resolution_status = "Open"
      }
      $counter++
    }
    if ($companyName -and -not (([string]$policy.executive_summary + "`n" + [string]$policy.body).Contains($companyName))) {
      $findings += [ordered]@{
        finding_id = "PQA-{0}" -f $counter.ToString("000")
        policy_id = $policy.policy_id
        severity = "Medium"
        category = "Contextualization"
        details = "Policy does not clearly embed the client name from onboarding."
        resolution_status = "Open"
      }
      $counter++
    }
    if (([string]$policy.executive_summary + "`n" + [string]$policy.table_of_contents + "`n" + [string]$policy.body) -match '(?i)(TO REVIEW|Document Version Control|Auditor Evidence Artifacts|References|MannyAI|\$client)') {
      $findings += [ordered]@{
        finding_id = "PQA-{0}" -f $counter.ToString("000")
        policy_id = $policy.policy_id
        severity = "High"
        category = "Template Cleanup"
        details = "Policy still contains banned placeholders or auditor artifacts."
        resolution_status = "Open"
      }
      $counter++
    }
    if (([string]$policy.executive_summary + "`n" + [string]$policy.body) -match "(?i)\bSOC\s*2\s+(CC|A|C|P)\d|ISO\s*27001\s+(A\.)?\d+(\.\d+)*|Annex\s*A\.\d+") {
      $findings += [ordered]@{
        finding_id = "PQA-{0}" -f $counter.ToString("000")
        policy_id = $policy.policy_id
        severity = "Medium"
        category = "Framework References"
        details = "Policy exposes framework control identifiers that should remain internal to the compliance mapping layer."
        resolution_status = "Open"
      }
      $counter++
    }
  }

  return [ordered]@{
    qa_owner = "DB Agent Policy QA"
    cleaned_policies_ref = "Policies and Procedures/policies.json"
    qa_notes = "Validation checks run against template cleanup, ownership, sign-off readiness, enforceable language, contextualization, and output structure."
    findings = @($findings)
    updatedAt = $null
  }
}

function New-PolicySummarySection {
  param([object[]]$Policies, [object[]]$QaFindings)

  $summaries = @()
  foreach ($policy in $Policies) {
    $policyFindings = @($QaFindings | Where-Object { $_.policy_id -eq $policy.policy_id })
    $keyControlStatements = @(
      ([string]$policy.body -split "`r?`n") |
        Where-Object { $_.Trim().StartsWith("- ") } |
        ForEach-Object { $_.Trim().Substring(2) } |
        Select-Object -First 3
    )
    $summaries += [ordered]@{
      summary_id = "SUM-{0}" -f $policy.policy_id
      policy_id = $policy.policy_id
      key_controls = if ($keyControlStatements.Count -gt 0) { $keyControlStatements -join " | " } else { [string]$policy.linked_controls }
      covered_domains = $policy.framework_mapping
      gaps = if ($policyFindings.Count -gt 0) { ($policyFindings.details -join " | ") } else { "No QA gaps identified during generation." }
    }
  }

  return [ordered]@{
    summary_owner = "DB Agent"
    summary_notes = "Policy summaries generated from the initial policy set and QA results."
    summaries = @($summaries)
    updatedAt = $null
  }
}

function Get-PolicyBodyControlStatements {
  param([object]$Policy)

  $controls = @()
  foreach ($line in (([string]$Policy.body -replace "`r", "") -split "`n")) {
    $trimmed = $line.Trim()
    if ($trimmed -match "^\-\s+(.+)$") {
      $controls += $Matches[1].Trim().TrimEnd(".")
    }
  }
  return @($controls | Select-Object -Unique)
}

function Get-TopicKeywords {
  param([string]$Topic, [string]$Kind)

  $normalized = ([string]$Topic).ToLowerInvariant()
  if ($Kind -eq "risk") {
    switch -Wildcard ($normalized) {
      "*sensitive data*" { return @("data", "privacy", "classification", "encryption", "retention", "sharing") }
      "*third-party*" { return @("vendor", "third-party", "access", "security obligations", "review their access", "assurance evidence") }
      "*cloud*" { return @("cloud", "configuration", "hardening", "change", "release", "environment") }
      "*unauthorized account*" { return @("mfa", "access", "authentication", "privileged", "entitlements", "review user entitlements") }
      "*detection*" { return @("monitor", "alert", "incident", "log", "response") }
      "*backup*" { return @("backup", "restore", "recovery", "continuity", "disaster") }
      "*data protection*" { return @("encryption", "key", "classification", "privacy") }
      "*access control drift*" { return @("access", "least privilege", "rbac", "review user entitlements", "joiner") }
      "*change management*" { return @("change", "release", "approve", "test", "deployment") }
      default { return @("security", "control", "review", "evidence") }
    }
  }

  switch -Wildcard ($normalized) {
    "*identity*" { return @("access", "authentication", "password", "identity", "privileged") }
    "*infrastructure*" { return @("vendor", "third-party", "backup", "availability", "configuration", "incident") }
    default { return @("vendor", "third-party", "access", "privacy", "encryption", "monitoring") }
  }
}

function Get-PolicyMatchScore {
  param([object]$Policy, [string[]]$Keywords)

  $blob = (([string]$Policy.name + " " + [string]$Policy.executive_summary + " " + [string]$Policy.body + " " + [string]$Policy.framework_mapping)).ToLowerInvariant()
  $score = 0
  foreach ($keyword in $Keywords) {
    if ($keyword -and $blob.Contains($keyword.ToLowerInvariant())) {
      $score++
    }
  }
  return $score
}

function Select-RelevantPoliciesForTopic {
  param([string]$Topic, [object[]]$Policies, [string]$Kind = "risk", [int]$MaxCount = 2)

  $keywords = Get-TopicKeywords -Topic $Topic -Kind $Kind
  $scored = foreach ($policy in @($Policies)) {
    [ordered]@{
      policy = $policy
      score = Get-PolicyMatchScore -Policy $policy -Keywords $keywords
    }
  }

  $selected = @(
    $scored |
      Sort-Object @{ Expression = "score"; Descending = $true }, @{ Expression = { $_.policy.name }; Descending = $false } |
      Where-Object { $_.score -gt 0 } |
      Select-Object -First $MaxCount
  )

  if ($selected.Count -eq 0) {
    return @($Policies | Select-Object -First $MaxCount)
  }

  return @($selected | ForEach-Object { $_.policy })
}

function Get-RiskScoreProfile {
  param([string]$RiskTitle, [int]$ControlStrength)

  $profile = switch -Wildcard ($RiskTitle) {
    "Sensitive data exposure" { [ordered]@{ Likelihood = 4; Impact = 5; ResidualLikelihood = 3; ResidualImpact = 4; ImpactText = "Exposure of regulated or sensitive data could trigger contractual, regulatory, and reputational damage."; Vulnerability = "Sensitive data handling without consistently enforced protection and review controls." } }
    "Third-party service dependency" { [ordered]@{ Likelihood = 4; Impact = 4; ResidualLikelihood = 3; ResidualImpact = 3; ImpactText = "Third-party failure or weak oversight could disrupt service delivery or expose customer data."; Vulnerability = "Reliance on external providers without sufficient due diligence, monitoring, or contingency planning." } }
    "Cloud or infrastructure misconfiguration" { [ordered]@{ Likelihood = 4; Impact = 5; ResidualLikelihood = 3; ResidualImpact = 4; ImpactText = "Infrastructure drift or insecure configuration could expose production systems or materially affect availability."; Vulnerability = "Cloud and platform changes may be deployed without sufficient hardening or validation." } }
    "Unauthorized account access" { [ordered]@{ Likelihood = 4; Impact = 5; ResidualLikelihood = 2; ResidualImpact = 4; ImpactText = "Compromised accounts could enable unauthorized access to production systems, administrative functions, or sensitive data."; Vulnerability = "Authentication, entitlement review, or privileged access safeguards may not consistently prevent misuse." } }
    "Delayed detection and response" { [ordered]@{ Likelihood = 3; Impact = 4; ResidualLikelihood = 2; ResidualImpact = 3; ImpactText = "Delayed detection can increase the impact of incidents by extending attacker dwell time and slowing containment."; Vulnerability = "Monitoring and escalation processes may not detect or triage security events quickly enough." } }
    "Backup or recovery failure" { [ordered]@{ Likelihood = 3; Impact = 5; ResidualLikelihood = 2; ResidualImpact = 3; ImpactText = "Failed recovery can extend downtime and impair the company’s ability to restore critical services and data."; Vulnerability = "Backup integrity and restoration readiness may not be validated often enough." } }
    "Weak data protection controls" { [ordered]@{ Likelihood = 4; Impact = 4; ResidualLikelihood = 2; ResidualImpact = 3; ImpactText = "Weak protection controls can lead to unauthorized disclosure or misuse of in-scope company and customer information."; Vulnerability = "Encryption or key-management controls may not be consistently applied across in-scope data flows." } }
    "Access control drift" { [ordered]@{ Likelihood = 3; Impact = 4; ResidualLikelihood = 2; ResidualImpact = 3; ImpactText = "Excessive or stale permissions can increase the blast radius of human error or account compromise."; Vulnerability = "Entitlements may not remain aligned to current roles and business need over time." } }
    default { [ordered]@{ Likelihood = 3; Impact = 4; ResidualLikelihood = 2; ResidualImpact = 3; ImpactText = "This risk could materially affect confidentiality, integrity, availability, or compliance commitments."; Vulnerability = "Documented controls may not fully address the underlying weakness without consistent execution." } }
  }

  if ($ControlStrength -ge 4) {
    $profile.ResidualLikelihood = [Math]::Max(1, $profile.ResidualLikelihood - 1)
  }

  return $profile
}

function Convert-ToTreatmentAction {
  param([string]$Statement, [string]$ContextLabel)

  $normalized = ([string]$Statement).Trim().TrimEnd(".")
  $normalized = $normalized -replace "^(?i)the company must\s+", ""
  $normalized = $normalized -replace "^(?i)must\s+", ""
  if (-not $normalized) { return "" }

  $lead = $normalized.Substring(0, 1).ToLowerInvariant() + $normalized.Substring(1)
  return "Use $ContextLabel to ensure the organization $lead."
}

function Get-ScoreBandLabel {
  param([Nullable[int]]$Score)

  if ($null -eq $Score) { return "" }
  if ($Score -ge 16) { return "Critical" }
  if ($Score -ge 10) { return "High" }
  if ($Score -ge 5) { return "Medium" }
  return "Low"
}

function Get-VendorRiskLabel {
  param([Nullable[int]]$Likelihood, [Nullable[int]]$Impact)

  if ($null -eq $Likelihood -or $null -eq $Impact) {
    return ""
  }

  $score = [int]$Likelihood * [int]$Impact
  return "{0} (L{1} x I{2})" -f (Get-ScoreBandLabel -Score $score), $Likelihood, $Impact
}

function Get-IntValueOrNull {
  param([object]$Value)

  $parsed = 0
  if ([int]::TryParse([string]$Value, [ref]$parsed)) {
    return [int]$parsed
  }

  return $null
}

function New-RiskTreatmentPlanText {
  param([string]$RiskTitle, [object[]]$Policies, [object]$Onboarding)

  $co      = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "the company" } else { [string]$Onboarding.legal_entity }
  $cloud   = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.cloud_providers))   { "cloud infrastructure" } else { [string]$Onboarding.cloud_providers }
  $idp     = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.identity_provider)) { "the identity provider" } else { [string]$Onboarding.identity_provider }
  $data    = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.data_types))        { "company and customer data" } else { [string]$Onboarding.data_types }
  $classif = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.classification))    { "regulated data" } else { [string]$Onboarding.classification }
  $backup  = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.backup))            { "backup procedures" } else { [string]$Onboarding.backup }
  $monitor = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.monitoring))        { "monitoring tooling" } else { [string]$Onboarding.monitoring }
  $enc     = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.encryption))        { "encryption controls" } else { [string]$Onboarding.encryption }
  $mfa     = [string]$Onboarding.mfa_enabled
  $headcount = [string]$Onboarding.employee_headcount

  $actions = @()
  $objective = switch -Wildcard ($RiskTitle) {
    "Sensitive data exposure"            { "Ensure $co's handling of $classif across $cloud is consistently aligned to approved data classification, access, and retention controls." }
    "Third-party service dependency"     { "Reduce the operational and compliance risk that vendor service disruptions or weak governance create for $co's production environment on $cloud." }
    "Cloud or infrastructure misconfiguration" { "Prevent insecure configuration drift or unreviewed changes from exposing $co's $cloud production environment to attack or service disruption." }
    "Unauthorized account access"        { "Keep $co's access provisioned through $idp aligned to least-privilege and ensure MFA is enforced across all workforce and privileged accounts." }
    "Delayed detection and response"     { "Reduce the mean time to detect and contain security events affecting $co's systems by improving coverage through $monitor." }
    "Backup or recovery failure"         { "Validate that $co can recover critical $cloud workloads within agreed RTOs through regularly tested restore procedures." }
    "Weak data protection controls"      { "Ensure $classif stored and transmitted across $co's $cloud infrastructure is consistently protected through $enc." }
    "Access control drift"               { "Maintain least-privilege access across $co's $idp-managed environment by enforcing timely access reviews as the team grows." }
    "Change management gaps"             { "Ensure that changes to $co's policies, controls, and $cloud configuration go through an approved change process with documented sign-off." }
    default                              { "Reduce the likelihood and impact of this risk through targeted controls, assigned ownership, and regular review within $co's operating environment." }
  }

  switch -Wildcard ($RiskTitle) {
    "Sensitive data exposure" {
      $actions += "Map every location where $classif flows within $co's $cloud environment, and confirm that storage, transit, and sharing controls align to the approved data classification policy."
      $actions += "Implement quarterly data access reviews to verify that only approved personnel and systems can reach $classif. Retain review records as audit evidence."
      $actions += "Configure $cloud DLP or equivalent tooling to alert on out-of-policy exports or transmissions of $classif outside approved boundaries."
      $actions += "Ensure all vendor agreements that involve access to $classif include data processing terms and are renewed or reviewed whenever the scope of access changes."
      $actions += "Assign a data protection owner responsible for tracking open findings from data classification audits and escalating overdue remediation to senior management."
    }
    "Third-party service dependency" {
      $actions += "Build and maintain a vendor criticality register that rates each provider against service dependency, data access, and substitutability — prioritising vendors hosted on $cloud."
      $actions += "For each Tier 1 vendor, collect annual assurance evidence (SOC 2, ISO 27001, or equivalent) and document the outcome of the review with an assigned owner."
      $actions += "Define a contingency plan for $co's top three most critical vendors that covers activation criteria, interim operating procedures, and communication obligations."
      $actions += "Track vendor-related incidents and service notifications in the risk register, linking each to an owner and a target remediation or review date."
      $actions += "Schedule vendor reassessments when a provider announces material platform changes, ownership transitions, or security incidents that affect $co's environment."
    }
    "Cloud or infrastructure misconfiguration" {
      $actions += "Enforce infrastructure change review through $co's approved change management workflow before any modification reaches the $cloud production environment."
      $actions += "Run automated configuration compliance checks against $co's $cloud baseline at least weekly and route findings to an owner with a defined SLA for remediation."
      $actions += "Validate that logging, monitoring through $monitor, and backup configurations remain intact and correctly scoped after every material infrastructure change."
      $actions += "Conduct a configuration baseline review at least quarterly to identify and remediate drift from hardened settings across $co's $cloud workloads."
      $actions += "Retain change approval records, configuration snapshots, and drift reports as evidence for each review cycle."
    }
    "Unauthorized account access" {
      $actions += "Enforce MFA across all $co user accounts in $idp, prioritising administrator and privileged roles. Treat any MFA exception as a documented, time-limited risk acceptance."
      $actions += "Run quarterly access reviews in $idp to verify that every active account reflects a current employment status and assigned role. Remove stale or excess entitlements within five business days."
      $actions += "Integrate joiner, mover, and leaver events into a formal identity workflow so access is provisioned, transferred, and revoked within approved SLAs."
      $actions += "Alert on authentication anomalies (unusual locations, repeated failures, off-hours logins) via $monitor and assign a response owner for each triggered alert."
      $actions += "Review all privileged and service accounts at least quarterly. Rotate credentials for accounts that have not been audited within the review window."
    }
    "Delayed detection and response" {
      $actions += "Define and document alert thresholds in $monitor for $co's highest-risk event categories (authentication anomalies, data exfiltration signals, configuration changes)."
      $actions += "Assign a named on-call owner for high-severity alerts and document escalation paths so response is initiated within the agreed SLA."
      $actions += "Conduct tabletop exercises at least twice per year using realistic $co scenarios to validate that response playbooks work as expected."
      $actions += "Review alert fatigue metrics monthly and tune $monitor rules to reduce false positives without degrading detection coverage."
      $actions += "Retain incident timelines, triage notes, and post-incident reviews as evidence of detection and response performance."
    }
    "Backup or recovery failure" {
      $actions += "Confirm that all Tier 1 workloads on $co's $cloud environment are captured in the backup schedule and that coverage is verified at least monthly."
      $actions += "Run full restore tests for critical systems at least quarterly using $backup. Document test outcomes, RTO achieved, and any issues requiring remediation."
      $actions += "Assign a backup owner who is responsible for monitoring job outcomes, investigating failures within 24 hours, and escalating unresolved issues."
      $actions += "Store backup copies in a geographically or logically separate location from the primary $cloud region and verify offsite availability at each test cycle."
      $actions += "Include recovery capability in $co's incident response runbooks so the team knows which systems to restore first and in what sequence."
    }
    "Weak data protection controls" {
      $actions += "Audit current encryption coverage across $co's $cloud environment against the approved encryption standard — covering data at rest, in transit, and in backups."
      $actions += "Remediate any workloads or data stores that do not meet the encryption baseline within 30 days and document exceptions with risk acceptance sign-off."
      $actions += "Rotate encryption keys and service credentials on the approved schedule and confirm that key management procedures align to $enc."
      $actions += "Review encryption configurations after every major $cloud infrastructure change or vendor update that could affect the protection posture."
      $actions += "Assign a control owner who tracks the encryption remediation backlog and reports status to senior management at each quarterly review."
    }
    "Access control drift" {
      $actions += "Schedule access reviews in $idp on a $([Math]::Max(1, [Math]::Min(3, [int]([string]$headcount -replace '\D','0')/50 + 1)))-month cycle, or more frequently when team size changes materially."
      $actions += "Automate off-boarding checks so that when an employee leaves $co, their $idp account, $cloud access, and SaaS credentials are deprovisioned within one business day."
      $actions += "Implement role-based access templates in $idp so new provisioning requests are matched against approved role definitions rather than copied from existing users."
      $actions += "Flag accounts that have not been used in 60 days for review. Disable and document them within 10 business days unless a business justification is provided."
      $actions += "Produce a monthly access exception report for accounts where provisioned permissions exceed the role template. Route to the system owner for sign-off or remediation."
    }
    "Change management gaps" {
      $actions += "Establish a documented change management workflow covering policy updates, $cloud configuration changes, and software releases — requiring sign-off before implementation."
      $actions += "Maintain a change log that records what changed, who approved it, and the rollback procedure, updated with every production change in $co's environment."
      $actions += "Require post-implementation review for high-risk changes within five business days, documenting outcomes and any follow-up actions required."
      $actions += "Train the team responsible for $cloud operations on the change management process at least annually and after material process updates."
      $actions += "Include change management evidence in $co's quarterly compliance review, tracking open deviations and escalating overdue closures."
    }
    default {
      $actions += "Identify and document the specific control actions required to reduce this risk within $co's $cloud environment, and assign a named owner with a target completion date."
      $actions += "Review the risk owner's status report at least quarterly and update the risk register with evidence of control effectiveness."
      $actions += "Escalate risks that exceed the agreed residual tolerance to senior management with a remediation plan and revised target date."
    }
  }

  foreach ($policy in @($Policies)) {
    foreach ($statement in @(Get-PolicyBodyControlStatements -Policy $policy | Select-Object -First 1)) {
      $actions += (Convert-ToTreatmentAction -Statement $statement -ContextLabel ([string]$policy.name))
    }
  }
  $actions = @($actions | Where-Object { $_ } | Select-Object -Unique | Select-Object -First 7)
  if ($actions.Count -eq 0) {
    $actions = @("Use the linked policy set to implement, review, and evidence controls that directly mitigate this risk within $co's operating environment.")
  }

  return @(
    "Treatment plan (Mitigate)"
    "Primary objective: $objective"
    "Key actions:"
    ($actions | ForEach-Object { "- $_" })
    "Review requirement: The risk owner at $co must review treatment status at least quarterly, and immediately following any material change to the relevant systems, data handling, vendors, or workforce."
  ) -join "`n"
}

function Get-VendorContextSignals {
  param([object]$Vendor)

  $blob = @(
    [string]$Vendor.vendor_name,
    [string]$Vendor.vendor_description,
    [string]$Vendor.purpose,
    [string]$Vendor.business_function,
    [string]$Vendor.service_category,
    [string]$Vendor.known_services,
    [string]$Vendor.access_level,
    [string]$Vendor.data_accessed
  ) -join " "
  $text = $blob.ToLowerInvariant()

  return [ordered]@{
    IsCloud = $text -match "hosting|infrastructure|aws|azure|gcp|compute|storage|cdn|cloud infrastructure|cloud hosting"
    IsIdentity = $text -match "identity|sso|directory|mfa|authentication|okta|jumpcloud|entra"
    IsMonitoring = $text -match "monitor|logging|observability|alert|siem|edr|sentry"
    IsCollaboration = $text -match "email|messaging|chat|collaboration|workspace|document|file sharing"
    IsDesignOrDevTool = $text -match "design|prototype|figma|repository|github|gitlab|jira|ticket"
    HandlesSensitiveData = $text -match "pii|personal|customer|employee|financial|payment|health|phi|sensitive|confidential"
    HasProductionAccess = $text -match "production|admin|administrative|privileged|infrastructure access|console"
  }
}

function New-VendorTreatmentPlanText {
  param([object]$Vendor, [object[]]$Policies, [object[]]$LinkedRisks, [hashtable]$Signals)

  $actions = @()
  $vendorName = if ([string]::IsNullOrWhiteSpace([string]$Vendor.vendor_name)) { "This vendor" } else { [string]$Vendor.vendor_name }

  $actions += "Assign a business owner for $vendorName, confirm the documented use case, and review the service whenever its access, data use, or criticality changes."

  if ($Signals.HandlesSensitiveData) {
    $actions += "Review data handling, retention, encryption posture, and contractual data protection obligations for $vendorName before approval and at reassessment."
  }
  if ($Signals.HasProductionAccess) {
    $actions += "Restrict administrative or production access for $vendorName to named personnel, keep approvals documented, and review elevated access at least quarterly."
  }
  if ($Signals.IsCloud) {
    $actions += "Review the shared-responsibility boundary for $vendorName, confirm logging and backup expectations, and track material platform changes that affect the production environment."
  }
  if ($Signals.IsIdentity) {
    $actions += "Keep $vendorName aligned to the joiner, mover, and leaver workflow, enforce strong administrator controls, and review MFA and privileged settings on a defined cadence."
  }
  if ($Signals.IsMonitoring) {
    $actions += "Limit what production data is sent to $vendorName, validate alert routing and support access, and review retention or redaction settings for collected telemetry."
  }
  if ($Signals.IsCollaboration) {
    $actions += "Confirm sharing restrictions, guest access, and retention settings for $vendorName so workforce collaboration does not bypass approved data handling requirements."
  }
  if ($Signals.IsDesignOrDevTool) {
    $actions += "Avoid using live regulated data in $vendorName where practical, and review tokens, exports, and workspace access used for design or development workflows."
  }
  foreach ($linkedRisk in @($LinkedRisks | Select-Object -First 2)) {
    if ([string]$linkedRisk.threat) {
      $actions += "Track mitigation work for the linked risk '$([string]$linkedRisk.threat)' and confirm vendor-specific evidence is retained for reassessment."
    }
  }
  foreach ($policy in @($Policies | Select-Object -First 2)) {
    foreach ($statement in @(Get-PolicyBodyControlStatements -Policy $policy | Select-Object -First 1)) {
      $actions += (Convert-ToTreatmentAction -Statement $statement -ContextLabel ([string]$policy.name))
    }
  }

  $actions = @($actions | Where-Object { $_ } | Select-Object -Unique | Select-Object -First 6)
  if ($actions.Count -eq 0) {
    $actions = @("Review the vendor's security obligations, evidence, and remediation commitments before approval and during reassessment.")
  }

  $objective = if ($Signals.IsIdentity) {
    "Prevent identity, authentication, or privileged-access weaknesses from creating broader access risk."
  } elseif ($Signals.IsMonitoring) {
    "Maintain reliable detection coverage without overexposing operational or sensitive data."
  } elseif ($Signals.IsDesignOrDevTool -or $Signals.IsCollaboration) {
    "Keep collaboration and product-development tooling aligned to approved data handling, access, and sharing requirements."
  } elseif ($Signals.IsCloud) {
    "Maintain secure and resilient use of a vendor that supports the production environment."
  } else {
    "Keep vendor use aligned to documented business need, approved access, and the organization’s control expectations."
  }

  return @(
    "Treatment plan (Mitigate)"
    "Primary objective: $objective"
    "Key actions:"
    ($actions | ForEach-Object { "- $_" })
    "Review requirement: Reassess this vendor at least annually and after material service, data-handling, or access changes."
  ) -join "`n"
}

function Normalize-RiskRecord {
  param([object]$Risk)

  $record = [ordered]@{}
  foreach ($property in $Risk.PSObject.Properties.Name) {
    $record[$property] = $Risk.$property
  }

  $likelihood = Get-IntValueOrNull -Value $record.likelihood
  $impact = Get-IntValueOrNull -Value $record.impact
  $residualLikelihood = Get-IntValueOrNull -Value $record.residual_likelihood
  $residualImpact = Get-IntValueOrNull -Value $record.residual_impact
  $inherentScore = if ($null -ne $likelihood -and $null -ne $impact) { [int]$likelihood * [int]$impact } else { $null }
  $residualScore = if ($null -ne $residualLikelihood -and $null -ne $residualImpact) { [int]$residualLikelihood * [int]$residualImpact } else { $null }

  $record.inherent_score = if ($null -ne $inherentScore) { [string]$inherentScore } else { "" }
  $record.inherent_rating = if ($null -ne $inherentScore) { Get-ScoreBandLabel -Score $inherentScore } else { "" }
  $record.residual_score = if ($null -ne $residualScore) { [string]$residualScore } else { "" }
  $record.residual_rating = if ($null -ne $residualScore) { Get-ScoreBandLabel -Score $residualScore } else { "" }

  return $record
}

function Normalize-VendorRecord {
  param([object]$Vendor)

  $record = [ordered]@{}
  foreach ($property in $Vendor.PSObject.Properties.Name) {
    $record[$property] = $Vendor.$property
  }

  $vendorLikelihood = Get-IntValueOrNull -Value $record.vendor_likelihood
  $vendorImpact = Get-IntValueOrNull -Value $record.vendor_impact
  $residualLikelihood = Get-IntValueOrNull -Value $record.residual_likelihood
  $residualImpact = Get-IntValueOrNull -Value $record.residual_impact
  $inherentScore = if ($null -ne $vendorLikelihood -and $null -ne $vendorImpact) { [int]$vendorLikelihood * [int]$vendorImpact } else { $null }
  $residualScore = if ($null -ne $residualLikelihood -and $null -ne $residualImpact) { [int]$residualLikelihood * [int]$residualImpact } else { $null }

  $record.inherent_score = if ($null -ne $inherentScore) { [string]$inherentScore } else { "" }
  $record.inherent_risk = if ($null -ne $inherentScore) { Get-VendorRiskLabel -Likelihood $vendorLikelihood -Impact $vendorImpact } else { [string]$record.inherent_risk }
  $record.residual_score = if ($null -ne $residualScore) { [string]$residualScore } else { "" }
  $record.residual_risk = if ($null -ne $residualScore) { Get-VendorRiskLabel -Likelihood $residualLikelihood -Impact $residualImpact } else { [string]$record.residual_risk }

  return $record
}

function New-RiskAssessmentSection {
  param([object]$Onboarding, [object[]]$TopRisks, [object[]]$Policies)

  $securityRole = Get-SecurityRoleByHeadcount -Onboarding $Onboarding
  $namedDataTypes = Get-NamedDataTypesFromOnboarding -Onboarding $Onboarding
  $namedSystems = Get-NamedSystemsFromOnboarding -Onboarding $Onboarding
  $companyName = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.legal_entity)) { "the company" } else { [string]$Onboarding.legal_entity }
  $nextQuarter = (Get-Date).AddMonths(3).ToString("yyyy-MM-dd")

  $risks = @()
  for ($index = 0; $index -lt $TopRisks.Count; $index++) {
    $risk = $TopRisks[$index]
    $riskTitle = [string]$risk.title
    $relevantPolicies = Select-RelevantPoliciesForTopic -Topic $riskTitle -Policies $Policies -Kind "risk" -MaxCount 2
    $controlStrength = @(
      $relevantPolicies |
        ForEach-Object { @(Get-PolicyBodyControlStatements -Policy $_).Count } |
        Measure-Object -Sum
    ).Sum
    $profile = Get-RiskScoreProfile -RiskTitle $riskTitle -ControlStrength $controlStrength
    $linkedPolicyIds = @($relevantPolicies | ForEach-Object { $_.policy_id } | Select-Object -Unique)
    $linkedControlIds = @($relevantPolicies | ForEach-Object { [string]$_.linked_controls } | Where-Object { $_ } | Select-Object -Unique)

    $category = switch -Wildcard ($riskTitle) {
      "Sensitive data exposure"            { "Data Protection" }
      "Third-party service dependency"     { "Third-Party Risk" }
      "Cloud or infrastructure misconfiguration" { "Infrastructure" }
      "Unauthorized account access"        { "Identity and Access" }
      "Delayed detection and response"     { "Security Operations" }
      "Backup or recovery failure"         { "Business Continuity" }
      "Weak data protection controls"      { "Data Protection" }
      "Access control drift"               { "Identity and Access" }
      default                              { "Operational" }
    }

    $threatSource = switch -Wildcard ($riskTitle) {
      "Unauthorized account access"        { "External / Insider" }
      "Sensitive data exposure"            { "External / Insider" }
      "Third-party service dependency"     { "Third-Party" }
      "Cloud or infrastructure misconfiguration" { "Internal / External" }
      default                              { "External" }
    }

    $whyThisCompany = switch -Wildcard ($riskTitle) {
      "Sensitive data exposure"            { "$companyName handles $namedDataTypes across $namedSystems, making data exposure a direct operational risk." }
      "Third-party service dependency"     { "$companyName relies on $namedSystems for core services, creating single-points-of-failure if vendor governance is weak." }
      "Cloud or infrastructure misconfiguration" { "$companyName operates on $namedSystems, where configuration drift can expose the production environment." }
      "Unauthorized account access"        { "$companyName uses $namedSystems for workforce access; weak entitlement control or MFA gaps increase this exposure." }
      "Delayed detection and response"     { "$companyName's monitoring coverage across $namedSystems must be sufficient to detect and triage events quickly." }
      "Backup or recovery failure"         { "$companyName's service continuity depends on validated backup and recovery procedures for systems hosted on $namedSystems." }
      "Weak data protection controls"      { "$companyName stores and processes $namedDataTypes, requiring consistently enforced encryption and handling controls." }
      "Access control drift"               { "$companyName's workforce access on $namedSystems may drift from approved role definitions as the team changes." }
      default                              { "$companyName's operating environment on $namedSystems creates exposure to this risk category." }
    }

    $existingControls = if ($relevantPolicies.Count -gt 0) {
      "Controls defined in: $(@($relevantPolicies | ForEach-Object { [string]$_.name }) -join ', ')."
    } else {
      "No linked policy controls are currently assigned to this risk."
    }

    $controlGaps = switch -Wildcard ($riskTitle) {
      "Sensitive data exposure"            { "Data classification and handling obligations may not be consistently enforced across all in-scope data flows." }
      "Third-party service dependency"     { "Vendor assurance evidence and contingency planning may not be reviewed on a defined schedule." }
      "Cloud or infrastructure misconfiguration" { "Configuration baselines and change-validation procedures may not cover all deployed services." }
      "Unauthorized account access"        { "Entitlement reviews and privileged access monitoring may not be performed frequently enough." }
      "Delayed detection and response"     { "Alert coverage and escalation paths may have gaps that extend detection time for certain event types." }
      "Backup or recovery failure"         { "Restoration testing may not be performed often enough to validate recoverability for all critical systems." }
      "Weak data protection controls"      { "Encryption coverage or key-management practices may not be consistently applied across all data stores and transfers." }
      "Access control drift"               { "Periodic entitlement review cadence may not be sufficient to catch role drift before it creates material exposure." }
      default                              { "Control coverage for this risk type may have gaps that require owner review and gap remediation." }
    }

    $likelihoodJustification = switch -Wildcard ($riskTitle) {
      "Sensitive data exposure"            { "Likelihood rated $([string]$profile.Likelihood) — $companyName processes $namedDataTypes, increasing the frequency of data-handling activity and potential misuse scenarios." }
      "Unauthorized account access"        { "Likelihood rated $([string]$profile.Likelihood) — credential-based attacks are the most common attack vector; likelihood is elevated without consistent MFA and entitlement controls." }
      "Cloud or infrastructure misconfiguration" { "Likelihood rated $([string]$profile.Likelihood) — cloud platform changes are frequent and configuration drift is a known source of exposure." }
      "Third-party service dependency"     { "Likelihood rated $([string]$profile.Likelihood) — $companyName uses multiple third-party services; weak governance or an upstream incident can materialise quickly." }
      default                              { "Likelihood rated $([string]$profile.Likelihood) — based on the risk profile for this category and the current control coverage for $companyName." }
    }

    $impactJustification = switch -Wildcard ($riskTitle) {
      "Sensitive data exposure"            { "Impact rated $([string]$profile.Impact) — exposure of $namedDataTypes could trigger regulatory notification obligations, contractual breach, and reputational damage." }
      "Cloud or infrastructure misconfiguration" { "Impact rated $([string]$profile.Impact) — a misconfiguration affecting production services on $namedSystems could cause extended outage or data loss." }
      "Backup or recovery failure"         { "Impact rated $([string]$profile.Impact) — failure to recover critical systems within the required RTO would directly affect service delivery and commitments." }
      default                              { "Impact rated $([string]$profile.Impact) — based on the potential operational, financial, or reputational consequences of this risk materialising for $companyName." }
    }

    $risks += [ordered]@{
      risk_id                  = "RISK-{0}" -f ($index + 1).ToString("000")
      category                 = $category
      asset                    = if ([string]::IsNullOrWhiteSpace([string]$Onboarding.scope)) { "In-scope application and supporting systems" } else { [string]$Onboarding.scope }
      threat                   = $riskTitle
      threat_source            = $threatSource
      vulnerability            = if ([string]::IsNullOrWhiteSpace([string]$risk.reason)) { [string]$profile.Vulnerability } else { [string]$risk.reason }
      why_this_company         = $whyThisCompany
      existing_controls        = $existingControls
      control_gaps             = $controlGaps
      impact_description       = [string]$profile.ImpactText
      likelihood               = [string]$profile.Likelihood
      impact                   = [string]$profile.Impact
      inherent_score           = [string]([int]$profile.Likelihood * [int]$profile.Impact)
      likelihood_justification = $likelihoodJustification
      impact_justification     = $impactJustification
      residual_likelihood      = [string]$profile.ResidualLikelihood
      residual_impact          = [string]$profile.ResidualImpact
      residual_score           = [string]([int]$profile.ResidualLikelihood * [int]$profile.ResidualImpact)
      treatment_plan           = New-RiskTreatmentPlanText -RiskTitle $riskTitle -Policies $relevantPolicies -Onboarding $Onboarding
      treatment_action         = "Mitigate"
      treatment_owner          = $securityRole
      treatment_due            = "Within 90 days"
      review_date              = $nextQuarter
      linked_policies          = $linkedPolicyIds -join ", "
      linked_controls          = $linkedControlIds -join ", "
    }
  }

  return [ordered]@{
    risk_methodology = "Risk = asset + threat + vulnerability + impact, informed by the stored risk assessment prompt and linked policy controls."
    policy_summary_ref = "Policy Summary/policy-summary.json"
    risk_notes = "Risk register generated from onboarding-derived top risks and the most relevant approved policies."
    risks = @($risks)
    updatedAt = $null
  }
}

function New-RiskQaSection {
  param([object[]]$Risks)

  $findings = @()
  $counter = 1
  foreach ($risk in $Risks) {
    if (-not [string]$risk.treatment_plan) {
      $findings += [ordered]@{
        finding_id = "RQA-{0}" -f $counter.ToString("000")
        risk_id = $risk.risk_id
        severity = "High"
        category = "Completeness"
        details = "Risk record is missing a treatment plan."
        resolution_status = "Open"
      }
      $counter++
    }
    $expectedScore = ([int]$risk.likelihood) * ([int]$risk.impact)
    if ([string]$risk.inherent_score -ne [string]$expectedScore) {
      $findings += [ordered]@{
        finding_id = "RQA-{0}" -f $counter.ToString("000")
        risk_id = $risk.risk_id
        severity = "Medium"
        category = "Scoring"
        details = "Inherent score does not match likelihood x impact."
        resolution_status = "Open"
      }
      $counter++
    }
    if (-not [string]$risk.linked_policies -or -not [string]$risk.linked_controls) {
      $findings += [ordered]@{
        finding_id = "RQA-{0}" -f $counter.ToString("000")
        risk_id = $risk.risk_id
        severity = "High"
        category = "Traceability"
        details = "Risk record is missing linked policy or linked control references."
        resolution_status = "Open"
      }
      $counter++
    }
    if ([int]$risk.residual_score -gt [int]$risk.inherent_score) {
      $findings += [ordered]@{
        finding_id = "RQA-{0}" -f $counter.ToString("000")
        risk_id = $risk.risk_id
        severity = "Medium"
        category = "Residual Risk"
        details = "Residual risk cannot exceed inherent risk."
        resolution_status = "Open"
      }
      $counter++
    }
  }

  return [ordered]@{
    qa_owner = "DB Agent Risk QA"
    risk_register_ref = "Risk Assessments/risk-assessments.json"
    qa_notes = "Risk QA agent checks risk scoring, treatment completeness, traceability, and residual-risk logic before the register is accepted."
    findings = @($findings)
    updatedAt = $null
  }
}

function New-VendorRiskSection {
  param([object]$Onboarding, [object[]]$Risks, [object[]]$Policies)

  $vendors = @()
  $candidates = Get-DerivedVendorCandidates -Onboarding $Onboarding
  foreach ($candidate in $candidates) {
    $topic = @([string]$candidate.vendor_name, [string]$candidate.vendor_description, [string]$candidate.purpose, [string]$candidate.business_function, [string]$candidate.access_level, [string]$candidate.data_accessed, [string]$candidate.known_services) -join " "
    $relevantPolicies = Select-RelevantPoliciesForTopic -Topic $topic -Policies $Policies -Kind "vendor" -MaxCount 3
    $linkedPolicyIds = @($relevantPolicies | ForEach-Object { $_.policy_id } | Select-Object -Unique)
    $linkedControlIds = @($relevantPolicies | ForEach-Object { [string]$_.linked_controls } | Where-Object { $_ } | Select-Object -Unique)
    $dataBlob = ([string]$candidate.data_accessed + " " + [string]$candidate.access_level + " " + [string]$candidate.data_types_handled).ToLowerInvariant()
    $signals = Get-VendorContextSignals -Vendor $candidate

    # Base likelihood from criticality field
    $likelihood = switch ([string]$candidate.criticality) {
      "Critical" { 5 }
      "High" { 4 }
      "Medium" { 3 }
      default { 2 }
    }
    # Boost likelihood from client-supplied business_impact answer
    if ([string]$candidate.business_impact -eq "Critical") { $likelihood = [Math]::Max($likelihood, 5) }
    elseif ([string]$candidate.business_impact -eq "Major impact") { $likelihood = [Math]::Max($likelihood, 4) }
    elseif ([string]$candidate.business_impact -eq "Some impact") { $likelihood = [Math]::Max($likelihood, 3) }
    if ($signals.IsCloud -or $signals.IsIdentity) { $likelihood = [Math]::Min(5, $likelihood + 1) }

    # Base impact from signals
    $impact = if ($signals.HandlesSensitiveData) { 5 } elseif ($signals.HasProductionAccess -or $signals.IsCloud) { 4 } else { 3 }
    if ([string]$candidate.criticality -eq "Critical") { $impact = 5 }
    # Boost impact from client-supplied data and access answers
    if ([string]$candidate.stores_processes_data -eq "Yes") { $impact = [Math]::Max($impact, 4) }
    if ([string]$candidate.data_types_handled -match "PII|Financial|Credentials") { $impact = [Math]::Max($impact, 4) }
    if ([string]$candidate.access_level_detail -in @("Admin", "Infrastructure")) { $impact = [Math]::Max($impact, 4) }
    if ([string]$candidate.access_level_detail -eq "Infrastructure") { $impact = 5 }

    # Residual scoring — reduced by contracts/DPA/certifications
    $residualLikelihood = [Math]::Max(1, $likelihood - [Math]::Min(2, [Math]::Max(1, $relevantPolicies.Count)))
    if ($signals.IsCloud -or $signals.IsIdentity) { $residualLikelihood = [Math]::Max(1, $residualLikelihood - 1) }
    if ([string]$candidate.has_contract -eq "Yes") { $residualLikelihood = [Math]::Max(1, $residualLikelihood - 1) }
    $residualImpact = [Math]::Max(2, $impact - 1)
    if ([string]$candidate.has_dpa -eq "Yes") { $residualImpact = [Math]::Max(2, $residualImpact - 1) }
    $linkedRiskIds = @(
      $Risks |
        Where-Object {
          $_.threat -eq "Third-party service dependency" -or
          (($dataBlob -match "sensitive|confidential|customer|employee") -and $_.threat -eq "Sensitive data exposure")
        } |
        ForEach-Object { $_.risk_id } |
        Select-Object -Unique
    )
    $linkedRisks = @($Risks | Where-Object { $linkedRiskIds -contains $_.risk_id })
    $riskDescription = if ($signals.IsCloud) {
      "$($candidate.vendor_name) supports the production or infrastructure environment, so service changes, outages, or weak configuration and access governance could materially affect security and availability. $([string]$candidate.vendor_description)"
    } elseif ($signals.IsIdentity) {
      "$($candidate.vendor_name) supports identity or workforce access, so weaknesses in administrator control, provisioning, or authentication settings could expand unauthorized access risk. $([string]$candidate.vendor_description)"
    } elseif ($signals.IsMonitoring) {
      "$($candidate.vendor_name) supports monitoring or detection workflows, so poor telemetry handling, alert routing, or support access could reduce detection quality or expose operational data. $([string]$candidate.vendor_description)"
    } else {
      "$($candidate.vendor_name) supports $([string]$candidate.business_function.ToLowerInvariant()) and may affect service delivery, confidentiality, or compliance if oversight is weak. $([string]$candidate.vendor_description)"
    }
    $vendors += [ordered]@{
      vendor_id = $candidate.vendor_id
      vendor_name = $candidate.vendor_name
      vendor_description = $candidate.vendor_description
      purpose = $candidate.purpose
      business_function = $candidate.business_function
      service_category = $candidate.service_category
      known_services = $candidate.known_services
      website = $candidate.website
      access_level = $candidate.access_level
      data_accessed = $candidate.data_accessed
      criticality = $candidate.criticality
      certifications = $candidate.certifications
      location = $candidate.location
      stores_processes_data           = [string]$candidate.stores_processes_data
      data_types_handled              = [string]$candidate.data_types_handled
      access_level_detail             = [string]$candidate.access_level_detail
      business_impact                 = [string]$candidate.business_impact
      has_contract                    = [string]$candidate.has_contract
      has_dpa                         = [string]$candidate.has_dpa
      vendor_certifications_confirmed = [string]$candidate.vendor_certifications_confirmed
      vendor_likelihood = [string]$likelihood
      vendor_impact = [string]$impact
      inherent_score = [string]($likelihood * $impact)
      inherent_risk = Get-VendorRiskLabel -Likelihood $likelihood -Impact $impact
      residual_likelihood = [string]$residualLikelihood
      residual_impact = [string]$residualImpact
      residual_score = [string]($residualLikelihood * $residualImpact)
      residual_risk = Get-VendorRiskLabel -Likelihood $residualLikelihood -Impact $residualImpact
      treatment_plan = New-VendorTreatmentPlanText -Vendor $candidate -Policies $relevantPolicies -LinkedRisks $linkedRisks -Signals $signals
      linked_risks = $linkedRiskIds -join ", "
      linked_controls = $linkedControlIds -join ", "
      notes = $riskDescription
      assessment_questions = New-VendorAssessmentQuestions -Vendor $candidate -Onboarding $Onboarding
    }
  }

  return [ordered]@{
    vendor_methodology = "Criticality, access level, data exposure, integration depth, and policy-linked treatment planning informed by the stored vendor assessment prompt."
    risk_register_ref = "Risk Assessments/risk-assessments.json"
    vendor_notes = "Vendor assessments generated from the client vendor list, enriched from the shared vendor catalog when available, and matched against the most relevant approved policies."
    vendors = @($vendors)
    updatedAt = $null
  }
}

function New-VendorQaSection {
  param([object[]]$Vendors)

  $findings = @()
  $counter = 1
  foreach ($vendor in $Vendors) {
    if (-not [string]$vendor.inherent_risk -or -not [string]$vendor.residual_risk) {
      $findings += [ordered]@{
        finding_id = "VQA-{0}" -f $counter.ToString("000")
        vendor_id = $vendor.vendor_id
        severity = "High"
        category = "Completeness"
        details = "Vendor assessment is missing inherent or residual risk."
        resolution_status = "Open"
      }
      $counter++
    }
    if (-not [string]$vendor.treatment_plan) {
      $findings += [ordered]@{
        finding_id = "VQA-{0}" -f $counter.ToString("000")
        vendor_id = $vendor.vendor_id
        severity = "Medium"
        category = "Treatment"
        details = "Vendor assessment is missing a treatment plan."
        resolution_status = "Open"
      }
      $counter++
    }
    if (-not [string]$vendor.linked_risks -or -not [string]$vendor.linked_controls) {
      $findings += [ordered]@{
        finding_id = "VQA-{0}" -f $counter.ToString("000")
        vendor_id = $vendor.vendor_id
        severity = "High"
        category = "Traceability"
        details = "Vendor assessment is missing linked risk or control references."
        resolution_status = "Open"
      }
      $counter++
    }
  }

  return [ordered]@{
    qa_owner = "DB Agent Vendor QA"
    vendor_register_ref = "Vendor Assessments/vendor-assessments.json"
    qa_notes = "Vendor QA agent checks criticality, treatment completeness, and traceability before vendor assessments are accepted."
    findings = @($findings)
    updatedAt = $null
  }
}

function Split-LinkedValues {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) { return @() }
  return @(
    $Value -split "," |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ } |
      Select-Object -Unique
  )
}

function Test-AllLinkedValuesExist {
  param([string]$Value, [hashtable]$IdSet)

  foreach ($entry in (Split-LinkedValues -Value $Value)) {
    if (-not $IdSet.ContainsKey($entry)) {
      return $false
    }
  }
  return $true
}

function New-ControlMappingSection {
  param([object[]]$Policies, [object[]]$Risks, [object[]]$Vendors, [string[]]$FrameworkLabels)

  $controls = @()
  for ($index = 0; $index -lt $Policies.Count; $index++) {
    $policy = $Policies[$index]
    $policyRisks = @($Risks | Where-Object { (Split-LinkedValues -Value ([string]$_.linked_policies)) -contains [string]$policy.policy_id })
    $policyVendors = @($Vendors | Where-Object { (Split-LinkedValues -Value ([string]$_.linked_controls)) -contains [string]$policy.linked_controls })
    $policyStatements = @(Get-PolicyBodyControlStatements -Policy $policy | Select-Object -First 2)
    $descriptionParts = @("Operate and evidence the requirements defined in $($policy.name).")
    if ($policyStatements.Count -gt 0) {
      $descriptionParts += "Key operational themes: $($policyStatements -join ' | ')."
    }
    $controls += [ordered]@{
      control_id = if ([string]::IsNullOrWhiteSpace([string]$policy.linked_controls)) { "CTRL-{0}" -f ($index + 1).ToString("000") } else { [string]$policy.linked_controls }
      description = $descriptionParts -join " "
      owner = if ([string]::IsNullOrWhiteSpace([string]$policy.policy_owner)) { "Owner pending assignment" } else { [string]$policy.policy_owner }
      frequency = "Quarterly control review; annual policy review; upon material change"
      evidence = "Approved policy text, sign-off record, quarterly review notes, execution evidence, and remediation tracking where applicable."
      linked_policies = $policy.policy_id
      linked_risks = @($policyRisks | ForEach-Object { $_.risk_id } | Select-Object -Unique) -join ", "
      linked_vendors = @($policyVendors | ForEach-Object { $_.vendor_id } | Select-Object -Unique) -join ", "
      framework_mapping = if ([string]$policy.framework_mapping) { [string]$policy.framework_mapping } else { $FrameworkLabels -join ", " }
    }
  }

  for ($index = 0; $index -lt $Vendors.Count; $index++) {
    $vendor = $Vendors[$index]
    $vendorPolicies = @($Policies | Where-Object { (Split-LinkedValues -Value ([string]$vendor.linked_controls)) -contains [string]$_.linked_controls } | Select-Object -First 2)
    $vendorFrameworkMappings = @($vendorPolicies | ForEach-Object { Split-LinkedValues -Value ([string]$_.framework_mapping) } | Where-Object { $_ } | Select-Object -Unique)
    $controls += [ordered]@{
      control_id = "CTRL-VDR-{0}" -f ($index + 1).ToString("000")
      description = "Perform vendor oversight for $($vendor.vendor_name), including evidence review, security obligation tracking, and remediation follow-up."
      owner = if ($vendorPolicies.Count -gt 0 -and [string]$vendorPolicies[0].policy_owner) { [string]$vendorPolicies[0].policy_owner } else { "Vendor owner pending assignment" }
      frequency = "Before onboarding; annually; after material vendor change"
      evidence = "Vendor assessment record, security documentation, approval notes, remediation tracker, and reassessment history."
      linked_policies = @($vendorPolicies | ForEach-Object { $_.policy_id } | Select-Object -Unique) -join ", "
      linked_risks = [string]$vendor.linked_risks
      linked_vendors = [string]$vendor.vendor_id
      framework_mapping = if ($vendorFrameworkMappings.Count -gt 0) { $vendorFrameworkMappings -join ", " } else { $FrameworkLabels -join ", " }
    }
  }

  return [ordered]@{
    mapping_basis = "Generated from approved policy statements, linked risk records, vendor oversight needs, and shared framework coverage."
    evidence_standard = "Evidence must be attributable, time-bound, and retained for audit."
    controls = @($controls)
    updatedAt = $null
  }
}

function New-AuditQaSection {
  param([object[]]$Policies, [object[]]$Risks, [object[]]$Vendors, [object[]]$Controls)

  $findings = @()
  $counter = 1
  $policyIdSet = @{}
  @($Policies | ForEach-Object { if ([string]$_.policy_id) { $policyIdSet[[string]$_.policy_id] = $true } })
  $riskIdSet = @{}
  @($Risks | ForEach-Object { if ([string]$_.risk_id) { $riskIdSet[[string]$_.risk_id] = $true } })
  $vendorIdSet = @{}
  @($Vendors | ForEach-Object { if ([string]$_.vendor_id) { $vendorIdSet[[string]$_.vendor_id] = $true } })
  $controlIdSet = @{}
  @($Controls | ForEach-Object { if ([string]$_.control_id) { $controlIdSet[[string]$_.control_id] = $true } })

  foreach ($policy in $Policies) {
    if (-not [string]$policy.policy_owner) {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "policy"
        affected_item_id = $policy.policy_id
        severity = "High"
        reason = "Generated policy has no assigned owner."
        audit_impact = "Policy accountability is not demonstrable."
        remediation = "Assign a policy owner from the client access list."
      }
      $counter++
    }
    if (-not (Test-ToggleEnabled -Value $policy.published)) {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "policy"
        affected_item_id = $policy.policy_id
        severity = "Medium"
        reason = "Policy is not yet published."
        audit_impact = "The policy set is not finalized for downstream compliance work."
        remediation = "Publish the policy after review and final approval."
      }
      $counter++
    }
    if ([string]$policy.sign_off_complete -ne "Yes") {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "policy"
        affected_item_id = $policy.policy_id
        severity = "Medium"
        reason = "Policy is not yet signed off."
        audit_impact = "Approval status is not final."
        remediation = "Set the sign-off toggle after reviewer approval."
      }
      $counter++
    }
  }

  foreach ($risk in $Risks) {
    if (-not (Test-AllLinkedValuesExist -Value ([string]$risk.linked_policies) -IdSet $policyIdSet)) {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "risk"
        affected_item_id = $risk.risk_id
        severity = "High"
        reason = "Risk record references policies that do not exist."
        audit_impact = "Traceability from risk to policy cannot be demonstrated."
        remediation = "Update linked_policies to valid approved policy IDs."
      }
      $counter++
    }
    if (-not (Test-AllLinkedValuesExist -Value ([string]$risk.linked_controls) -IdSet $controlIdSet)) {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "risk"
        affected_item_id = $risk.risk_id
        severity = "High"
        reason = "Risk record references controls that do not exist."
        audit_impact = "Risk treatment cannot be traced to implemented controls."
        remediation = "Update linked_controls to valid control IDs."
      }
      $counter++
    }
  }

  foreach ($vendor in $Vendors) {
    if (-not (Test-AllLinkedValuesExist -Value ([string]$vendor.linked_risks) -IdSet $riskIdSet)) {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "vendor"
        affected_item_id = $vendor.vendor_id
        severity = "High"
        reason = "Vendor assessment references risks that do not exist."
        audit_impact = "Vendor oversight is not traceable to the risk register."
        remediation = "Update linked_risks to valid risk IDs."
      }
      $counter++
    }
    if (-not (Test-AllLinkedValuesExist -Value ([string]$vendor.linked_controls) -IdSet $controlIdSet)) {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "vendor"
        affected_item_id = $vendor.vendor_id
        severity = "High"
        reason = "Vendor assessment references controls that do not exist."
        audit_impact = "Vendor treatment is not traceable to implemented controls."
        remediation = "Update linked_controls to valid control IDs."
      }
      $counter++
    }
  }

  foreach ($control in $Controls) {
    if (-not [string]$control.owner) {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "control"
        affected_item_id = $control.control_id
        severity = "High"
        reason = "Control has no assigned owner."
        audit_impact = "Control accountability is not demonstrable."
        remediation = "Assign a responsible owner for the control."
      }
      $counter++
    }
    if (-not [string]$control.evidence) {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "control"
        affected_item_id = $control.control_id
        severity = "High"
        reason = "Control has no evidence requirement."
        audit_impact = "Control operation cannot be verified during audit testing."
        remediation = "Define the evidence that proves the control operated."
      }
      $counter++
    }
    if (-not (Test-AllLinkedValuesExist -Value ([string]$control.linked_policies) -IdSet $policyIdSet)) {
      $findings += [ordered]@{
        finding_id = "AQA-{0}" -f $counter.ToString("000")
        affected_item_type = "control"
        affected_item_id = $control.control_id
        severity = "Medium"
        reason = "Control references policies that do not exist."
        audit_impact = "Control design cannot be traced back to policy requirements."
        remediation = "Update linked_policies to valid approved policy IDs."
      }
      $counter++
    }
  }

  return [ordered]@{
    audit_owner = "DB Agent Audit QA"
    audit_notes = "Audit-readiness findings generated from policy approval status, reference integrity, and control-evidence readiness."
    findings = @($findings)
    updatedAt = $null
  }
}

function Invoke-TargetedRegeneration {
  param(
    [string]$ClientId,
    [string[]]$PolicyIds = @(),
    [string[]]$RiskIds   = @(),
    [string[]]$VendorIds = @()
  )
  $paths      = Get-SectionPaths -ClientId $ClientId
  $onboarding = Read-JsonFile -Path $paths["onboarding"].File        -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $ClientId -CompanyName $ClientId)
  $pg         = Read-JsonFile -Path $paths["policy-generation"].File  -DefaultValue ([ordered]@{ policies = @() })
  $ra         = Read-JsonFile -Path $paths["risk-assessment"].File    -DefaultValue ([ordered]@{ risks    = @() })
  $vr         = Read-JsonFile -Path $paths["vendor-risk"].File        -DefaultValue ([ordered]@{ vendors  = @() })
  $cm         = Read-JsonFile -Path $paths["control-mapping"].File    -DefaultValue ([ordered]@{ controls = @() })
  $savedAny   = $false
  $hasApiKey  = -not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)

  # Enhance only the specified policies
  if ($PolicyIds.Count -gt 0 -and $hasApiKey) {
    $targets = @($pg.policies | Where-Object { $PolicyIds -contains [string]$_.policy_id })
    if ($targets.Count -gt 0) {
      $enhanced = Invoke-AiPolicyEnhancement -Policies $targets -Onboarding $onboarding
      if (@($enhanced | Where-Object { $_ }).Count -gt 0) {
        foreach ($ep in @($enhanced)) {
          $eid = [string]$ep.policy_id
          $pg.policies = @($pg.policies | ForEach-Object { if ([string]$_.policy_id -eq $eid) { $ep } else { $_ } })
        }
        Save-JsonFile -Path $paths["policy-generation"].File -Value $pg
        $savedAny = $true
      }
    }
  }

  # Enhance only the specified risks
  if ($RiskIds.Count -gt 0 -and $hasApiKey) {
    $targets = @($ra.risks | Where-Object { $RiskIds -contains [string]$_.risk_id })
    if ($targets.Count -gt 0) {
      $enhanced = Invoke-AiRiskEnhancement -Risks $targets -Onboarding $onboarding
      if (@($enhanced | Where-Object { $_ }).Count -gt 0) {
        foreach ($er in @($enhanced)) {
          $eid = [string]$er.risk_id
          $ra.risks = @($ra.risks | ForEach-Object { if ([string]$_.risk_id -eq $eid) { $er } else { $_ } })
        }
        Save-JsonFile -Path $paths["risk-assessment"].File -Value $ra
        $savedAny = $true
      }
    }
  }

  # Enhance only the specified vendors
  if ($VendorIds.Count -gt 0 -and $hasApiKey) {
    $targets = @($vr.vendors | Where-Object { $VendorIds -contains [string]$_.vendor_id })
    if ($targets.Count -gt 0) {
      $enhanced = Invoke-AiVendorEnhancement -Vendors $targets -Onboarding $onboarding
      if (@($enhanced | Where-Object { $_ }).Count -gt 0) {
        foreach ($ev in @($enhanced)) {
          $eid = [string]$ev.vendor_id
          $vr.vendors = @($vr.vendors | ForEach-Object { if ([string]$_.vendor_id -eq $eid) { $ev } else { $_ } })
        }
        Save-JsonFile -Path $paths["vendor-risk"].File -Value $vr
        $savedAny = $true
      }
    }
  }

  # Always refresh audit QA — it's fast and reflects the latest evidence state
  $auditQa = New-AuditQaSection -Policies $pg.policies -Risks $ra.risks -Vendors $vr.vendors -Controls $cm.controls
  Save-JsonFile -Path $paths["audit-qa"].File -Value $auditQa

  Write-AuditLogEntry -ClientId $ClientId -EventType "targeted_regeneration" -Payload ([ordered]@{
    policy_ids  = $PolicyIds -join ", "
    risk_ids    = $RiskIds   -join ", "
    vendor_ids  = $VendorIds -join ", "
    ai_enhanced = $hasApiKey
    saved       = $savedAny
  })
  return Get-ClientAggregate -ClientId $ClientId
}

function Invoke-SelectiveRiskRegeneration {
  param([string]$ClientId)
  $paths      = Get-SectionPaths -ClientId $ClientId
  $onboarding = Read-JsonFile -Path $paths["onboarding"].File        -DefaultValue (New-DefaultSection -SectionKey "onboarding"       -ClientId $ClientId -CompanyName $ClientId)
  $pg         = Read-JsonFile -Path $paths["policy-generation"].File  -DefaultValue ([ordered]@{ policies = @() })
  $vendorRisk = Read-JsonFile -Path $paths["vendor-risk"].File        -DefaultValue ([ordered]@{ vendors  = @() })
  $topRisks   = Get-DerivedTopRisks -Onboarding $onboarding

  $riskAssessment = New-RiskAssessmentSection -Onboarding $onboarding -TopRisks $topRisks -Policies $pg.policies

  if (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
    # Step 1: Generate context-aware, non-repetitive treatment plans first
    $withPlans = Invoke-TreatmentPlanAgent -Risks $riskAssessment.risks -Onboarding $onboarding -Policies $pg.policies -Vendors $vendorRisk.vendors
    if (@($withPlans | Where-Object { $_ }).Count -gt 0) { $riskAssessment.risks = @($withPlans) }

    # Step 2: Full narrative enhancement using company brief and policies
    $brief = if ($pg.company_brief) { $pg.company_brief } else { New-CompanyBrief -Onboarding $onboarding }
    $enhanced = Invoke-RiskAnalystAgent -Risks $riskAssessment.risks -Policies $pg.policies -Brief $brief -Onboarding $onboarding
    if (@($enhanced | Where-Object { $_ }).Count -gt 0) { $riskAssessment.risks = @($enhanced) }
  }

  Save-JsonFile -Path $paths["risk-assessment"].File -Value $riskAssessment
  $riskQa = New-RiskQaSection -Risks $riskAssessment.risks
  Save-JsonFile -Path $paths["risk-qa"].File -Value $riskQa

  $controlMapping = Read-JsonFile -Path $paths["control-mapping"].File -DefaultValue ([ordered]@{ controls = @() })
  $auditQa = New-AuditQaSection -Policies $pg.policies -Risks $riskAssessment.risks -Vendors $vendorRisk.vendors -Controls $controlMapping.controls
  Save-JsonFile -Path $paths["audit-qa"].File -Value $auditQa

  Write-AuditLogEntry -ClientId $ClientId -EventType "selective_risk_regeneration" -Payload ([ordered]@{
    risk_count  = @($riskAssessment.risks).Count
    ai_enhanced = (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY))
    used_plan_agent = (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY))
  })
  return Get-ClientAggregate -ClientId $ClientId
}

function Invoke-SelectiveVendorRegeneration {
  param([string]$ClientId)
  $paths      = Get-SectionPaths -ClientId $ClientId
  $onboarding = Read-JsonFile -Path $paths["onboarding"].File        -DefaultValue (New-DefaultSection -SectionKey "onboarding"        -ClientId $ClientId -CompanyName $ClientId)
  $pg         = Read-JsonFile -Path $paths["policy-generation"].File  -DefaultValue ([ordered]@{ policies = @() })
  $ra         = Read-JsonFile -Path $paths["risk-assessment"].File    -DefaultValue ([ordered]@{ risks    = @() })

  $vendorRisk  = New-VendorRiskSection -Onboarding $onboarding -Risks $ra.risks -Policies $pg.policies
  $companyBrief = if ($pg.company_brief) { $pg.company_brief } else { New-CompanyBrief -Onboarding $onboarding }
  if (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
    $ai = Invoke-VendorAnalystAgent -Vendors $vendorRisk.vendors -Policies $pg.policies -Risks $ra.risks -Brief $companyBrief -Onboarding $onboarding
    if (@($ai | Where-Object { $_ }).Count -gt 0) { $vendorRisk.vendors = @($ai) }
  }
  Update-VendorCatalog -VendorRecords @($vendorRisk.vendors) | Out-Null
  Save-JsonFile -Path $paths["vendor-risk"].File -Value $vendorRisk
  $vendorQa = New-VendorQaSection -Vendors $vendorRisk.vendors
  Save-JsonFile -Path $paths["vendor-qa"].File -Value $vendorQa

  # Auto-generate control mapping from policies + risks + vendors
  $frameworkLabels = Get-FrameworkLabels -Onboarding $onboarding
  $controlMapping = New-ControlMappingSection -Policies $pg.policies -Risks $ra.risks -Vendors $vendorRisk.vendors -FrameworkLabels $frameworkLabels
  Save-JsonFile -Path $paths["control-mapping"].File -Value $controlMapping

  $auditQa = New-AuditQaSection -Policies $pg.policies -Risks $ra.risks -Vendors $vendorRisk.vendors -Controls $controlMapping.controls
  Save-JsonFile -Path $paths["audit-qa"].File -Value $auditQa

  Write-AuditLogEntry -ClientId $ClientId -EventType "selective_vendor_regeneration" -Payload ([ordered]@{ vendor_count = @($vendorRisk.vendors).Count; control_count = @($controlMapping.controls).Count; ai_enhanced = (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) })
  return Get-ClientAggregate -ClientId $ClientId
}

function Invoke-SelectiveAuditRegeneration {
  param([string]$ClientId)
  $paths      = Get-SectionPaths -ClientId $ClientId
  $pg         = Read-JsonFile -Path $paths["policy-generation"].File  -DefaultValue ([ordered]@{ policies = @() })
  $ra         = Read-JsonFile -Path $paths["risk-assessment"].File    -DefaultValue ([ordered]@{ risks    = @() })
  $vr         = Read-JsonFile -Path $paths["vendor-risk"].File        -DefaultValue ([ordered]@{ vendors  = @() })
  $cm         = Read-JsonFile -Path $paths["control-mapping"].File    -DefaultValue ([ordered]@{ controls = @() })
  $onboarding = Read-JsonFile -Path $paths["onboarding"].File         -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $ClientId -CompanyName $ClientId)

  $auditQa = New-AuditQaSection -Policies $pg.policies -Risks $ra.risks -Vendors $vr.vendors -Controls $cm.controls
  Save-JsonFile -Path $paths["audit-qa"].File -Value $auditQa

  # Run AI QA cross-check if API key is available
  if (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
    $brief = if ($pg.company_brief) { $pg.company_brief } else { New-CompanyBrief -Onboarding $onboarding }
    $qaCrossCheck = Invoke-QaCrossCheckAgent -Policies $pg.policies -Risks $ra.risks -Vendors $vr.vendors -Brief $brief
    $pg | Add-Member -NotePropertyName "qa_cross_check" -NotePropertyValue $qaCrossCheck -Force
    Save-JsonFile -Path $paths["policy-generation"].File -Value $pg
  }

  Write-AuditLogEntry -ClientId $ClientId -EventType "selective_audit_regeneration" -Payload ([ordered]@{ finding_count = @($auditQa.findings).Count; ai_cross_check = (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) })
  return Get-ClientAggregate -ClientId $ClientId
}

function Invoke-SelectivePolicyAiEnhancement {
  param([string]$ClientId, [string]$PolicyId)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
    return [ordered]@{ error = "ANTHROPIC_API_KEY not configured on the server." }
  }
  $paths      = Get-SectionPaths -ClientId $ClientId
  $onboarding = Read-JsonFile -Path $paths["onboarding"].File        -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $ClientId -CompanyName $ClientId)
  $pg         = Read-JsonFile -Path $paths["policy-generation"].File  -DefaultValue ([ordered]@{ policies = @() })

  $target = @($pg.policies | Where-Object { [string]$_.policy_id -eq $PolicyId })
  if ($target.Count -eq 0) { return [ordered]@{ error = "Policy not found: $PolicyId" } }

  $enhanced = Invoke-AiPolicyEnhancement -Policies @($target[0]) -Onboarding $onboarding
  if (@($enhanced | Where-Object { $_ }).Count -gt 0) {
    $ep = $enhanced[0]
    $pg.policies = @($pg.policies | ForEach-Object { if ([string]$_.policy_id -eq $PolicyId) { $ep } else { $_ } })
    Save-JsonFile -Path $paths["policy-generation"].File -Value $pg
  }
  Write-AuditLogEntry -ClientId $ClientId -EventType "selective_policy_ai_enhancement" -Payload ([ordered]@{ policy_id = $PolicyId })
  return Get-ClientAggregate -ClientId $ClientId
}

function Invoke-ClientExportGeneration {
  param([string]$ClientId)

  $scriptPath = Join-Path $scriptRoot "scripts\generate_client_exports.py"
  if (-not (Test-Path $scriptPath -PathType Leaf)) { return $null }

  $clientRoot = Join-Path $dataRoot $ClientId
  $exportRoot = Get-ClientExportsPath -ClientId $ClientId
  New-Item -ItemType Directory -Force -Path $exportRoot | Out-Null

  try {
    $result = & python $scriptPath --client-id $ClientId --client-root $clientRoot --export-root $exportRoot 2>&1
    if ($LASTEXITCODE -ne 0) {
      return [ordered]@{
        status = "error"
        message = ($result | Out-String).Trim()
        generated_at = (Get-Date).ToString("o")
        outputs = @()
      }
    }

    $json = ($result | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($json)) { return $null }
    return ($json | ConvertFrom-Json)
  } catch {
    return [ordered]@{
      status = "error"
      message = $_.Exception.Message
      generated_at = (Get-Date).ToString("o")
      outputs = @()
    }
  }
}

function Get-OutputArtifactText {
  param([object]$ExportManifest, [string]$OutputId)

  if (-not $ExportManifest -or -not $ExportManifest.outputs) { return "" }
  $record = @($ExportManifest.outputs | Where-Object { [string]$_.output_id -eq $OutputId } | Select-Object -First 1)
  if ($record.Count -eq 0) { return "" }
  return @($record[0].files) -join "`n"
}

function New-OutputSection {
  param([object[]]$Policies, [object[]]$Risks, [object[]]$Vendors, [object[]]$Controls, [object[]]$AuditFindings, [object]$ExportManifest)

  $exportErrorMessage = if ($ExportManifest -and [string]$ExportManifest.status -eq "error") { [string]$ExportManifest.message } else { "" }

  return [ordered]@{
    validation_status = if ($AuditFindings.Count -gt 0) { "Action required ($($AuditFindings.Count) audit findings)" } else { "Ready for review" }
    output_notes = if ($exportErrorMessage) { "Dashboard-ready output generated, but export packaging requires attention: $exportErrorMessage" } else { "Dashboard-ready output generated from the linked DB Agent lifecycle with policies, risks, vendors, controls, and audit-readiness status." }
    outputs = @(
      [ordered]@{
        output_id = "OUT-001"
        output_type = "Policy pack"
        status = "Generated"
        linked_policies = @($Policies | ForEach-Object { $_.policy_id }) -join ", "
        linked_risks = @($Risks | Select-Object -First 3 | ForEach-Object { $_.risk_id }) -join ", "
        linked_vendors = ""
        linked_controls = @($Controls | Select-Object -First 3 | ForEach-Object { $_.control_id }) -join ", "
        notes = "Editable policies, owners, and sign-off state are available in the platform."
        file_artifacts = Get-OutputArtifactText -ExportManifest $ExportManifest -OutputId "OUT-001"
      },
      [ordered]@{
        output_id = "OUT-002"
        output_type = "Risk register"
        status = "Generated"
        linked_policies = @($Policies | Select-Object -First 3 | ForEach-Object { $_.policy_id }) -join ", "
        linked_risks = @($Risks | ForEach-Object { $_.risk_id }) -join ", "
        linked_vendors = ""
        linked_controls = @($Controls | Select-Object -First 4 | ForEach-Object { $_.control_id }) -join ", "
        notes = "Risk register created from onboarding-derived risks and linked policy controls."
        file_artifacts = Get-OutputArtifactText -ExportManifest $ExportManifest -OutputId "OUT-002"
      },
      [ordered]@{
        output_id = "OUT-003"
        output_type = "Vendor register"
        status = "Generated"
        linked_policies = @($Policies | Where-Object { $_.name -match "Vendor|Access|Encryption|Privacy" } | Select-Object -First 3 | ForEach-Object { $_.policy_id }) -join ", "
        linked_risks = @($Risks | Where-Object { $_.threat -match "Third-party|Sensitive data" } | ForEach-Object { $_.risk_id }) -join ", "
        linked_vendors = @($Vendors | ForEach-Object { $_.vendor_id }) -join ", "
        linked_controls = @($Controls | Where-Object { $_.control_id -like "CTRL-VDR-*" } | ForEach-Object { $_.control_id }) -join ", "
        notes = "Vendor assessments were generated from inferred providers and linked to relevant policies and risks."
        file_artifacts = Get-OutputArtifactText -ExportManifest $ExportManifest -OutputId "OUT-003"
      },
      [ordered]@{
        output_id = "OUT-004"
        output_type = "Control library"
        status = "Generated"
        linked_policies = @($Policies | ForEach-Object { $_.policy_id }) -join ", "
        linked_risks = @($Risks | ForEach-Object { $_.risk_id }) -join ", "
        linked_vendors = @($Vendors | ForEach-Object { $_.vendor_id }) -join ", "
        linked_controls = @($Controls | ForEach-Object { $_.control_id }) -join ", "
        notes = "Unified control library covering policy operation, risk treatment, and vendor oversight."
        file_artifacts = Get-OutputArtifactText -ExportManifest $ExportManifest -OutputId "OUT-004"
      },
      [ordered]@{
        output_id = "OUT-005"
        output_type = "Audit readiness report"
        status = if ($AuditFindings.Count -gt 0) { "Action required" } else { "Ready" }
        linked_policies = @($Policies | ForEach-Object { $_.policy_id }) -join ", "
        linked_risks = @($Risks | ForEach-Object { $_.risk_id }) -join ", "
        linked_vendors = @($Vendors | ForEach-Object { $_.vendor_id }) -join ", "
        linked_controls = @($Controls | ForEach-Object { $_.control_id }) -join ", "
        notes = if ($AuditFindings.Count -gt 0) { "$($AuditFindings.Count) audit QA findings require remediation before audit readiness is claimed." } else { "No audit QA findings were generated in this run." }
        file_artifacts = Get-OutputArtifactText -ExportManifest $ExportManifest -OutputId "OUT-005"
      }
    )
    updatedAt = $null
  }
}

function Start-ClientProcessingJob {
  param([string]$ClientId, [switch]$ForcePolicyRegeneration)

  Ensure-ClientWorkspace -CompanyName $ClientId | Out-Null
  $paths = Get-SectionPaths -ClientId $ClientId
  $onboarding = Read-JsonFile -Path $paths["onboarding"].File -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $ClientId -CompanyName $ClientId)
  $existingPolicyGeneration = Read-JsonFile -Path $paths["policy-generation"].File -DefaultValue (New-DefaultSection -SectionKey "policy-generation" -ClientId $ClientId -CompanyName $ClientId)

  if (Test-PolicyGenerationInProgress -Section $existingPolicyGeneration) {
    return Get-ClientAggregate -ClientId $ClientId
  }

  $topRisks = Get-DerivedTopRisks -Onboarding $onboarding
  $policyGeneration = New-PolicyGenerationProgressSection -Onboarding $onboarding -TopRisks $topRisks
  $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "prepare" -Note "Loading policy templates, framework basis, and company context."
  Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration

  foreach ($sectionKey in @("policy-qa", "policy-summary", "risk-assessment", "risk-qa", "vendor-risk", "vendor-qa", "control-mapping", "audit-qa", "output")) {
    Save-JsonFile -Path $paths[$sectionKey].File -Value (New-DefaultSection -SectionKey $sectionKey -ClientId $ClientId -CompanyName $ClientId)
  }

  $forceFlag = if ($ForcePolicyRegeneration) { "true" } else { "false" }
  $workerArguments = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", ('"{0}"' -f $scriptFilePath),
    [string]$Port,
    "process-client",
    ('"{0}"' -f $ClientId),
    $forceFlag
  ) -join " "
  $processStartInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $processStartInfo.FileName = "powershell.exe"
  $processStartInfo.Arguments = $workerArguments
  $processStartInfo.UseShellExecute = $false
  $processStartInfo.CreateNoWindow = $true
  $processStartInfo.RedirectStandardError = $true
  $processStartInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
  $worker = [System.Diagnostics.Process]::Start($processStartInfo)

  # Capture stderr asynchronously — write to policy file if worker crashes on startup
  $workerPid = $worker.Id
  $workerPaths = $paths
  $null = $worker.BeginErrorReadLine()
  $worker.add_ErrorDataReceived({
    param($s, $e)
    if ($e.Data -and $e.Data.Trim()) {
      Write-Host "[worker-$workerPid stderr] $($e.Data)"
    }
  })

  Write-AuditLogEntry -ClientId $ClientId -EventType "processing_queued" -Payload ([ordered]@{
    client_id = $ClientId
    policy_generation_only = $true
    worker_pid = [string]$worker.Id
    force_policy_regeneration = [bool]$ForcePolicyRegeneration
  })

  return Get-ClientAggregate -ClientId $ClientId
}

function Invoke-ClientProcessing {
  param([string]$ClientId, [switch]$ForcePolicyRegeneration)

  Ensure-ClientWorkspace -CompanyName $ClientId | Out-Null
  Write-AuditLogEntry -ClientId $ClientId -EventType "processing_started" -Payload ([ordered]@{ client_id = $ClientId })
  $paths = Get-SectionPaths -ClientId $ClientId
  $onboarding = Read-JsonFile -Path $paths["onboarding"].File -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $ClientId -CompanyName $ClientId)
  $topRisks = Get-DerivedTopRisks -Onboarding $onboarding

  $existingPolicyGeneration = Read-JsonFile -Path $paths["policy-generation"].File -DefaultValue (New-DefaultSection -SectionKey "policy-generation" -ClientId $ClientId -CompanyName $ClientId)
  $existingPolicyGeneration = Ensure-PolicyGenerationSectionSchema -Section $existingPolicyGeneration
  $policyList = @($existingPolicyGeneration.policies)
  $hasExistingPolicies = @($policyList | Where-Object { $_ -and (([string]$_.policy_id) -or ([string]$_.name) -or ([string]$_.body)) }).Count -gt 0
  $policyQa = $null

  if ($hasExistingPolicies -and -not $ForcePolicyRegeneration) {
    $policyGeneration = $existingPolicyGeneration
    $policyGeneration.template_status = "{0} extracted templates loaded; generation rules applied" -f (Get-TemplateInventory).Count
    $policyGeneration.framework_basis = Get-FrameworkBasisText -Onboarding $onboarding
    $policyGeneration.top_risks_input = (@($topRisks | ForEach-Object { $_.title }) -join ", ")
    $policyGeneration.generation_status = "Completed"
    $policyGeneration.generation_stage = "qa"
    $policyGeneration.generation_stage_note = "Policy set is available for review."
    if (-not [string]$policyGeneration.generation_started_at) {
      $policyGeneration.generation_started_at = (Get-Date).ToString("o")
    }
    if (-not [string]$policyGeneration.generation_completed_at) {
      $policyGeneration.generation_completed_at = (Get-Date).ToString("o")
    }
    if (-not $policyGeneration.generation_stages -or @($policyGeneration.generation_stages).Count -eq 0) {
      $policyGeneration.generation_stages = New-PolicyGenerationStages
    }
    foreach ($stage in @($policyGeneration.generation_stages)) {
      $stage.status = "complete"
      if (-not [string]$stage.started_at) { $stage.started_at = $policyGeneration.generation_started_at }
      if (-not [string]$stage.completed_at) { $stage.completed_at = $policyGeneration.generation_completed_at }
    }
    $policyGeneration.policies = Apply-PolicyGovernance -CurrentPolicies $policyGeneration.policies -IncomingPolicies $policyGeneration.policies -Onboarding $onboarding
  } else {
    $policyGeneration = New-PolicyGenerationProgressSection -Onboarding $onboarding -TopRisks $topRisks
    $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "prepare" -Note "Loading policy templates, framework basis, and company context."
    Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration

    $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "draft" -Note "Building draft policies from the stored templates and company context."
    Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
    $draftPolicies = New-PolicyDraftRecords -Onboarding $onboarding -TopRisks $topRisks
    if (@($draftPolicies | Where-Object { $_ }).Count -eq 0) {
      throw "Policy generation produced no draft policies from the stored templates."
    }

    $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "rewrite" -Note "Rewriting drafts into company-specific narrative policy language."
    Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
    $rewrittenPolicies = Invoke-PolicyNarrativeRewritePass -Policies $draftPolicies -Onboarding $onboarding
    if (@($rewrittenPolicies | Where-Object { $_ }).Count -eq 0) {
      $rewrittenPolicies = @($draftPolicies)
    }

    $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "format" -Note "Formatting policy structure, section flow, and presentation."
    Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
    $formattedPolicies = Invoke-PolicyFormattingPass -Policies $rewrittenPolicies
    if (@($formattedPolicies | Where-Object { $_ }).Count -eq 0) {
      $formattedPolicies = @($rewrittenPolicies)
    }
    $governedPolicies = Apply-PolicyGovernance -CurrentPolicies $policyList -IncomingPolicies $formattedPolicies -Onboarding $onboarding
    if (@($governedPolicies | Where-Object { $_ }).Count -eq 0) {
      $governedPolicies = @($formattedPolicies)
    }
    if (@($governedPolicies | Where-Object { $_ }).Count -eq 0) {
      throw "Policy generation produced no final policy records after rewrite and governance passes."
    }

    $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "specificity" -Note "Replacing generic references with company-specific language and applying metadata headers."
    Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
    $specificityResult = Invoke-CompanySpecificityPass -Policies $governedPolicies -Onboarding $onboarding
    $finalPolicies = @($specificityResult.Policies)
    if (@($finalPolicies | Where-Object { $_ }).Count -eq 0) {
      $finalPolicies = @($governedPolicies)
    }
    $improvementLog = New-ImprovementLog -SpecificityScore ([int]$specificityResult.SpecificityScore) -TotalSpecificityImprovements ([int]$specificityResult.TotalImprovements) -PolicyCount $finalPolicies.Count -GeneratedAt ([string]$policyGeneration.generation_started_at) -Policies $finalPolicies -Onboarding $onboarding

    if (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
      # Agent 1 — Orchestrator: build shared company brief
      $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "orchestrator" -Note "Orchestrator agent — building shared company brief for all downstream agents."
      Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
      $companyBrief = New-CompanyBrief -Onboarding $onboarding
      $policyGeneration | Add-Member -NotePropertyName "company_brief" -NotePropertyValue $companyBrief -Force

      # Agent 2 — Policy Writer: inject company-specific content using brief
      $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "writer" -Note "Policy writer agent — rewriting with company-specific depth, named systems, and proper heading format."
      Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
      $writtenPolicies = Invoke-PolicyWriterAgent -Policies $finalPolicies -Brief $companyBrief -Onboarding $onboarding
      if (@($writtenPolicies | Where-Object { $_ }).Count -gt 0) { $finalPolicies = @($writtenPolicies) }

      # Agent 3 — Policy Critic: score and flag quality issues
      $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "critic" -Note "Policy critic agent — scoring all policies and flagging quality issues."
      Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
      $criticResults = Invoke-PolicyCriticAgent -Policies $finalPolicies -Brief $companyBrief -Onboarding $onboarding
      $policyGeneration | Add-Member -NotePropertyName "critic_results" -NotePropertyValue $criticResults -Force
      $failedCount = @($criticResults | Where-Object { [int]$_.score -lt 80 }).Count
      $avgScore    = if ($criticResults.Count -gt 0) { [Math]::Round((@($criticResults | ForEach-Object { [int]$_.score }) | Measure-Object -Average).Average, 1) } else { 0 }

      # Agent 4 — Policy Rewriter: fix only the failed policies
      if ($failedCount -gt 0) {
        $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "rewriter" -Note "Policy rewriter agent — fixing $failedCount polic$(if($failedCount -eq 1){'y'}else{'ies'}) that scored below 80. Average score: $avgScore/100."
        Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
        $rewrittenPolicies = Invoke-PolicyRewriterAgent -Policies $finalPolicies -CriticResults $criticResults -Brief $companyBrief
        if (@($rewrittenPolicies | Where-Object { $_ }).Count -gt 0) { $finalPolicies = @($rewrittenPolicies) }
      } else {
        $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "rewriter" -Note "All $($criticResults.Count) policies passed critic review (avg score: $avgScore/100) — rewriter not needed."
        Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
      }
    }

    $policyGeneration = Start-PolicyGenerationStage -Section $policyGeneration -StageKey "qa" -Note "Running policy QA checks and finalizing the policy pack."
    Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
    $policyQa = New-PolicyQaSection -Policies $finalPolicies -Onboarding $onboarding

    $policyGeneration = New-PolicyGenerationSection -Onboarding $onboarding -TopRisks $topRisks -Policies $finalPolicies -StartedAt ([string]$policyGeneration.generation_started_at)
    $policyGeneration | Add-Member -NotePropertyName "improvement_log" -NotePropertyValue $improvementLog -Force
  }
  Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration

  if (-not $policyQa) {
    $policyQa = New-PolicyQaSection -Policies $policyGeneration.policies -Onboarding $onboarding
  }
  Save-JsonFile -Path $paths["policy-qa"].File -Value $policyQa

  $policySummary = New-PolicySummarySection -Policies $policyGeneration.policies -QaFindings $policyQa.findings
  Save-JsonFile -Path $paths["policy-summary"].File -Value $policySummary

  if (-not (Test-PoliciesApproved -Policies $policyGeneration.policies)) {
    Write-AuditLogEntry -ClientId $ClientId -EventType "processing_paused_for_policy_approval" -Payload ([ordered]@{
      client_id = $ClientId
      policy_count = @($policyGeneration.policies).Count
    })
    return Get-ClientAggregate -ClientId $ClientId
  }

  # Read company brief from saved policy generation (set during policy agent chain, if API key was set)
  $savedBrief = if ($policyGeneration.company_brief) { $policyGeneration.company_brief } else { New-CompanyBrief -Onboarding $onboarding }

  $riskAssessment = New-RiskAssessmentSection -Onboarding $onboarding -TopRisks $topRisks -Policies $policyGeneration.policies
  if (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
    # Agent 5a — Treatment Plan Agent: generates unique, context-aware treatment plans per risk
    $withPlans = Invoke-TreatmentPlanAgent -Risks $riskAssessment.risks -Onboarding $onboarding -Policies $policyGeneration.policies -Vendors @()
    if (@($withPlans | Where-Object { $_ }).Count -gt 0) { $riskAssessment.risks = @($withPlans) }
    # Agent 5b — Risk Analyst: full narrative enhancement using company brief and policy content
    $aiRisks = Invoke-RiskAnalystAgent -Risks $riskAssessment.risks -Policies $policyGeneration.policies -Brief $savedBrief -Onboarding $onboarding
    if (@($aiRisks | Where-Object { $_ }).Count -gt 0) { $riskAssessment.risks = @($aiRisks) }
  }
  Save-JsonFile -Path $paths["risk-assessment"].File -Value $riskAssessment

  $riskQa = New-RiskQaSection -Risks $riskAssessment.risks
  Save-JsonFile -Path $paths["risk-qa"].File -Value $riskQa

  $vendorRisk = New-VendorRiskSection -Onboarding $onboarding -Risks $riskAssessment.risks -Policies $policyGeneration.policies
  if (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
    # Agent 6 — Vendor Analyst: reads risks + policies to write traceable vendor assessments
    $aiVendors = Invoke-VendorAnalystAgent -Vendors $vendorRisk.vendors -Policies $policyGeneration.policies -Risks $riskAssessment.risks -Brief $savedBrief -Onboarding $onboarding
    if (@($aiVendors | Where-Object { $_ }).Count -gt 0) { $vendorRisk.vendors = @($aiVendors) }
  }
  Update-VendorCatalog -VendorRecords @($vendorRisk.vendors) | Out-Null
  Save-JsonFile -Path $paths["vendor-risk"].File -Value $vendorRisk

  $vendorQa = New-VendorQaSection -Vendors $vendorRisk.vendors
  Save-JsonFile -Path $paths["vendor-qa"].File -Value $vendorQa

  $controlMapping = New-ControlMappingSection -Policies $policyGeneration.policies -Risks $riskAssessment.risks -Vendors $vendorRisk.vendors -FrameworkLabels (Get-FrameworkLabels -Onboarding $onboarding)
  Save-JsonFile -Path $paths["control-mapping"].File -Value $controlMapping

  $auditQa = New-AuditQaSection -Policies $policyGeneration.policies -Risks $riskAssessment.risks -Vendors $vendorRisk.vendors -Controls $controlMapping.controls
  Save-JsonFile -Path $paths["audit-qa"].File -Value $auditQa

  # QA Cross-Check Agent — verify consistency across all outputs
  if (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
    $qaCrossCheck = Invoke-QaCrossCheckAgent -Policies $policyGeneration.policies -Risks $riskAssessment.risks -Vendors $vendorRisk.vendors -Brief $savedBrief
    $policyGeneration | Add-Member -NotePropertyName "qa_cross_check" -NotePropertyValue $qaCrossCheck -Force
    Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
  }

  $exportManifest = Invoke-ClientExportGeneration -ClientId $ClientId
  $output = New-OutputSection -Policies $policyGeneration.policies -Risks $riskAssessment.risks -Vendors $vendorRisk.vendors -Controls $controlMapping.controls -AuditFindings $auditQa.findings -ExportManifest $exportManifest
  Save-JsonFile -Path $paths["output"].File -Value $output
  $onboarding.reprocessing_required = "No"
  $onboarding.change_notice = ""
  $onboarding.last_processed_at = (Get-Date).ToString("o")
  Save-JsonFile -Path $paths["onboarding"].File -Value $onboarding
  Write-AuditLogEntry -ClientId $ClientId -EventType "processing_completed" -Payload ([ordered]@{
    client_id = $ClientId
    policy_count = @($policyGeneration.policies).Count
    risk_count = @($riskAssessment.risks).Count
    vendor_count = @($vendorRisk.vendors).Count
    control_count = @($controlMapping.controls).Count
    audit_finding_count = @($auditQa.findings).Count
    export_status = if ($exportManifest) { [string]$exportManifest.status } else { "not_generated" }
  })

  return Get-ClientAggregate -ClientId $ClientId
}

function Publish-AllClientPolicies {
  param([string]$ClientId)

  Ensure-ClientWorkspace -CompanyName $ClientId | Out-Null
  $paths = Get-SectionPaths -ClientId $ClientId
  $onboarding = Read-JsonFile -Path $paths["onboarding"].File -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $ClientId -CompanyName $ClientId)
  $policyGeneration = Read-JsonFile -Path $paths["policy-generation"].File -DefaultValue (New-DefaultSection -SectionKey "policy-generation" -ClientId $ClientId -CompanyName $ClientId)
  $policyGeneration = Ensure-PolicyGenerationSectionSchema -Section $policyGeneration
  $existingPolicies = @($policyGeneration.policies | Where-Object { $_ -and (([string]$_.policy_id) -or ([string]$_.name) -or ([string]$_.body)) })

  if ($existingPolicies.Count -eq 0) {
    return Get-ClientAggregate -ClientId $ClientId
  }

  $approvedUsers = Get-ClientUsernamesFromOnboarding -Onboarding $onboarding
  $defaultActor = if ($approvedUsers.Count -gt 0) { [string]$approvedUsers[0] } else { "" }

  $incomingPolicies = foreach ($policy in $existingPolicies) {
    $policyOwner = if ([string]$policy.policy_owner) { [string]$policy.policy_owner } else { $defaultActor }
    $signOffBy = if ([string]$policy.sign_off_by) { [string]$policy.sign_off_by } elseif ($defaultActor) { $defaultActor } else { "" }

    [ordered]@{
      policy_id = [string]$policy.policy_id
      name = [string]$policy.name
      policy_owner = $policyOwner
      sign_off_by = $signOffBy
      policy_version = [string]$policy.policy_version
      published = "Yes"
      published_by = [string]$policy.published_by
      published_at = [string]$policy.published_at
      sign_off_complete = "Yes"
      sign_off_completed_by = [string]$policy.sign_off_completed_by
      sign_off_completed_at = [string]$policy.sign_off_completed_at
      framework_mapping = [string]$policy.framework_mapping
      linked_risks = [string]$policy.linked_risks
      linked_controls = [string]$policy.linked_controls
      executive_summary = [string]$policy.executive_summary
      table_of_contents = [string]$policy.table_of_contents
      body = [string]$policy.body
      approval_history_text = [string]$policy.approval_history_text
    }
  }

  $policyGeneration.policies = Apply-PolicyGovernance -CurrentPolicies $existingPolicies -IncomingPolicies $incomingPolicies -Onboarding $onboarding
  Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
  Write-AuditLogEntry -ClientId $ClientId -EventType "policy_generation_bulk_approved" -Payload ([ordered]@{
    client_id = $ClientId
    policy_count = @($policyGeneration.policies).Count
    actor = if ($defaultActor) { $defaultActor } else { "Unassigned" }
  })

  return Get-ClientAggregate -ClientId $ClientId
}

function Unpublish-AllClientPolicies {
  param([string]$ClientId, [switch]$UnsignOnly)

  Ensure-ClientWorkspace -CompanyName $ClientId | Out-Null
  $paths = Get-SectionPaths -ClientId $ClientId
  $onboarding = Read-JsonFile -Path $paths["onboarding"].File -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $ClientId -CompanyName $ClientId)
  $policyGeneration = Read-JsonFile -Path $paths["policy-generation"].File -DefaultValue (New-DefaultSection -SectionKey "policy-generation" -ClientId $ClientId -CompanyName $ClientId)
  $policyGeneration = Ensure-PolicyGenerationSectionSchema -Section $policyGeneration
  $existingPolicies = @($policyGeneration.policies | Where-Object { $_ -and (([string]$_.policy_id) -or ([string]$_.name) -or ([string]$_.body)) })

  if ($existingPolicies.Count -eq 0) { return Get-ClientAggregate -ClientId $ClientId }

  $policyGeneration.policies = @($existingPolicies | ForEach-Object {
    $p = $_
    if ($UnsignOnly) {
      # Only clear sign-off, keep published state
      $p.sign_off_complete    = "No"
      $p.sign_off_completed_by = ""
      $p.sign_off_completed_at = ""
    } else {
      # Clear both published and sign-off
      $p.published             = "No"
      $p.published_by          = ""
      $p.published_at          = ""
      $p.sign_off_complete     = "No"
      $p.sign_off_completed_by = ""
      $p.sign_off_completed_at = ""
    }
    $p
  })
  Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
  $eventType = if ($UnsignOnly) { "policy_generation_bulk_unsigned" } else { "policy_generation_bulk_unpublished" }
  Write-AuditLogEntry -ClientId $ClientId -EventType $eventType -Payload ([ordered]@{
    client_id    = $ClientId
    policy_count = @($policyGeneration.policies).Count
    unsign_only  = [bool]$UnsignOnly
  })
  return Get-ClientAggregate -ClientId $ClientId
}

function Send-Response {
  param([System.Net.Sockets.TcpClient]$Client, [int]$StatusCode, [string]$ContentType, [byte[]]$BodyBytes, [hashtable]$ExtraHeaders = @{})
  try {
    if (-not $Client -or -not $Client.Connected) { return }
    $statusText = switch ($StatusCode) { 200 { "OK" } 201 { "Created" } 400 { "Bad Request" } 404 { "Not Found" } 500 { "Internal Server Error" } default { "OK" } }
    $stream = $Client.GetStream()
    $headerLines = @(
      "HTTP/1.1 $StatusCode $statusText"
      "Content-Type: $ContentType"
      "Content-Length: $($BodyBytes.Length)"
      "Connection: close"
    )
    foreach ($headerKey in $ExtraHeaders.Keys) {
      $headerLines += ("{0}: {1}" -f $headerKey, $ExtraHeaders[$headerKey])
    }
    $header = ($headerLines -join "`r`n") + "`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($BodyBytes.Length -gt 0) { $stream.Write($BodyBytes, 0, $BodyBytes.Length) }
    $stream.Flush()
  } catch {
    try {
      Add-Content -Path $responseErrorLogPath -Value ("[{0}] Send-Response failure: {1}" -f (Get-Date).ToString("o"), $_.Exception.Message)
    } catch {}
    try {
      if ($Client) { $Client.Dispose() }
    } catch {}
    return
  }
}

function Respond-Json {
  param([System.Net.Sockets.TcpClient]$Client, [int]$StatusCode, [object]$Payload)
  $json = if ($null -eq $Payload) { "null" } elseif ($Payload -is [System.Array] -and $Payload.Count -eq 0) { "[]" } else { $Payload | ConvertTo-Json -Depth 100 }
  if ([string]::IsNullOrWhiteSpace($json)) { $json = "null" }
  Send-Response -Client $Client -StatusCode $StatusCode -ContentType "application/json; charset=utf-8" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes($json))
}

function Respond-Text {
  param([System.Net.Sockets.TcpClient]$Client, [int]$StatusCode, [string]$Text)
  if ($null -eq $Text) { $Text = "" }
  Send-Response -Client $Client -StatusCode $StatusCode -ContentType "text/plain; charset=utf-8" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes($Text))
}

function Respond-File {
  param([System.Net.Sockets.TcpClient]$Client, [string]$FilePath)

  if (-not (Test-Path $FilePath -PathType Leaf)) {
    Respond-Text -Client $Client -StatusCode 404 -Text "File not found"
    return
  }

  $fileName = [System.IO.Path]::GetFileName($FilePath)
  Send-Response -Client $Client -StatusCode 200 -ContentType (Get-ContentType -Path $FilePath) -BodyBytes ([System.IO.File]::ReadAllBytes($FilePath)) -ExtraHeaders @{
    "Content-Disposition" = "attachment; filename=""$fileName"""
    "Cache-Control" = "no-store"
  }
}

function Handle-StaticRequest {
  param([System.Net.Sockets.TcpClient]$Client, [string]$Path)
  $requestUri = [System.Uri]::new("http://localhost$Path")
  $routePath = $requestUri.AbsolutePath
  $relativePath = if ($routePath -eq "/") { "/index.html" } else { $routePath }
  $relativePath = [System.Uri]::UnescapeDataString($relativePath.TrimStart("/"))
  $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $publicRoot $relativePath))
  if (-not $candidatePath.StartsWith([System.IO.Path]::GetFullPath($publicRoot), [System.StringComparison]::OrdinalIgnoreCase)) { Respond-Text -Client $Client -StatusCode 404 -Text "Not found"; return }
  if (-not (Test-Path $candidatePath -PathType Leaf)) { Respond-Text -Client $Client -StatusCode 404 -Text "Not found"; return }
  Send-Response -Client $Client -StatusCode 200 -ContentType (Get-ContentType -Path $candidatePath) -BodyBytes ([System.IO.File]::ReadAllBytes($candidatePath))
}

function Handle-ApiRequest {
  param([System.Net.Sockets.TcpClient]$Client, [string]$Method, [string]$Path, [string]$Body)
  $requestUri = [System.Uri]::new("http://localhost$Path")
  $routePath = $requestUri.AbsolutePath
  $segments = $routePath.Trim("/").Split("/")
  $queryParams = @{}
  if ($requestUri.Query) {
    foreach ($pair in $requestUri.Query.TrimStart("?") -split "&") {
      if (-not $pair) { continue }
      $parts = $pair -split "=", 2
      $key = [System.Uri]::UnescapeDataString($parts[0])
      $value = if ($parts.Count -gt 1) { [System.Uri]::UnescapeDataString($parts[1]) } else { "" }
      $queryParams[$key] = $value
    }
  }
  if ($segments.Length -eq 2 -and $segments[0] -eq "api" -and $segments[1] -eq "prompt-registry" -and $Method -eq "GET") {
    Respond-Json -Client $Client -StatusCode 200 -Payload (Get-PromptMetadataList)
    return
  }
  if ($segments.Length -eq 2 -and $segments[0] -eq "api" -and $segments[1] -eq "download" -and $Method -eq "GET") {
    $requestedPath = [string]$queryParams["path"]
    $downloadMode = [string]$queryParams["mode"]
    if ([string]::IsNullOrWhiteSpace($requestedPath)) { Respond-Text -Client $Client -StatusCode 400 -Text "Missing file path"; return }
    $resolvedPath = [System.IO.Path]::GetFullPath($requestedPath)
    $allowedRoots = @(
      [System.IO.Path]::GetFullPath($exportsRoot),
      [System.IO.Path]::GetFullPath($processingRoot)
    )
    $isAllowed = $false
    foreach ($allowedRoot in $allowedRoots) {
      if ($resolvedPath.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $isAllowed = $true
        break
      }
    }
    if (-not $isAllowed) { Respond-Text -Client $Client -StatusCode 404 -Text "File not available"; return }
    if ($downloadMode -eq "blob") {
      $fileBytes = [System.IO.File]::ReadAllBytes($resolvedPath)
      Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{
        file_name = [System.IO.Path]::GetFileName($resolvedPath)
        content_type = Get-ContentType -Path $resolvedPath
        base64 = [System.Convert]::ToBase64String($fileBytes)
      })
      return
    }
    Respond-File -Client $Client -FilePath $resolvedPath
    return
  }
  if ($segments.Length -eq 3 -and $segments[0] -eq "api" -and $segments[1] -eq "prompts" -and $Method -eq "GET") {
    $promptRecord = Get-PromptRecord -PromptId ([System.Uri]::UnescapeDataString($segments[2]))
    if (-not $promptRecord) { Respond-Text -Client $Client -StatusCode 404 -Text "Prompt not found"; return }
    Respond-Json -Client $Client -StatusCode 200 -Payload $promptRecord
    return
  }
  if ($segments.Length -eq 2 -and $segments[0] -eq "api" -and $segments[1] -eq "vendor-catalog" -and $Method -eq "GET") {
    Respond-Json -Client $Client -StatusCode 200 -Payload (Get-VendorCatalog)
    return
  }
  if ($segments.Length -eq 2 -and $segments[0] -eq "api" -and $segments[1] -eq "clients") {
    if ($Method -eq "GET") { Respond-Json -Client $Client -StatusCode 200 -Payload (Get-Clients); return }
    if ($Method -eq "POST") {
      $payload = ConvertTo-BodyObject -Body $Body
      $companyName = if ($payload.legal_entity) { $payload.legal_entity } else { $payload.companyName }
      $clientId = Ensure-ClientWorkspace -CompanyName $companyName
      Respond-Json -Client $Client -StatusCode 201 -Payload (Get-ClientAggregate -ClientId $clientId).client
      return
    }
  }
  if ($segments.Length -eq 3 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $Method -eq "GET") {
    Respond-Json -Client $Client -StatusCode 200 -Payload (Get-ClientAggregate -ClientId ([System.Uri]::UnescapeDataString($segments[2])))
    return
  }
  if ($segments.Length -eq 3 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $Method -eq "DELETE") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $clientRoot = Join-Path $dataRoot $clientId
    if (-not (Test-Path $clientRoot -PathType Container)) { Respond-Text -Client $Client -StatusCode 404 -Text "Client not found"; return }
    Remove-Item -Path $clientRoot -Recurse -Force
    Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{ deleted = $true; clientId = $clientId })
    return
  }
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "process" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $forcePolicyRegeneration = [string]$queryParams["forcePolicies"]
    $backgroundMode = [string]$queryParams["background"]
    if ($backgroundMode -eq "yes") {
      Respond-Json -Client $Client -StatusCode 200 -Payload (Start-ClientProcessingJob -ClientId $clientId -ForcePolicyRegeneration:($forcePolicyRegeneration -eq "yes"))
    } else {
      Respond-Json -Client $Client -StatusCode 200 -Payload (Invoke-ClientProcessing -ClientId $clientId -ForcePolicyRegeneration:($forcePolicyRegeneration -eq "yes"))
    }
    return
  }
  # ── Targeted regeneration (dependency-resolved, entity-level) ──
  # GET /api/clients/:id/downstream-status — lightweight poll: risk count + vendor count for auto-chain polling
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "downstream-status" -and $Method -eq "GET") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $paths = Get-SectionPaths -ClientId $clientId
    $ra = Read-JsonFile -Path $paths["risk-assessment"].File  -DefaultValue ([ordered]@{ risks   = @() })
    $vr = Read-JsonFile -Path $paths["vendor-risk"].File      -DefaultValue ([ordered]@{ vendors = @() })
    Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{
      risk_count   = @($ra.risks   | Where-Object { $_ }).Count
      vendor_count = @($vr.vendors | Where-Object { $_ }).Count
      risks_updated_at   = [string]$ra.updatedAt
      vendors_updated_at = [string]$vr.updatedAt
    })
    return
  }

  # GET /api/clients/:id/policy-generation-status — lightweight poll endpoint (no full policy bodies)
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "policy-generation-status" -and $Method -eq "GET") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $paths = Get-SectionPaths -ClientId $clientId
    $pg = Read-JsonFile -Path $paths["policy-generation"].File -DefaultValue ([ordered]@{ generation_status = ""; generation_stage = ""; generation_stages = @() })
    Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{
      generation_status       = [string]$pg.generation_status
      generation_stage        = [string]$pg.generation_stage
      generation_stage_note   = [string]$pg.generation_stage_note
      generation_started_at   = [string]$pg.generation_started_at
      generation_completed_at = [string]$pg.generation_completed_at
      generation_last_error   = [string]$pg.generation_last_error
      generation_stages       = @($pg.generation_stages)
      policy_count            = @($pg.policies).Count
    })
    return
  }

  # POST /api/clients/:id/reset-processing — force-clears a stuck in-progress status
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "reset-processing" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $paths = Get-SectionPaths -ClientId $clientId
    $pg = Read-JsonFile -Path $paths["policy-generation"].File -DefaultValue ([ordered]@{})
    if ([string]$pg.generation_status -eq "In progress") {
      $pg.generation_status = "Failed"
      $pg.generation_last_error = "Processing was manually reset after getting stuck."
      $pg.generation_completed_at = (Get-Date).ToString("o")
      foreach ($stage in @($pg.generation_stages)) {
        if ([string]$stage.status -eq "in-progress") { $stage.status = "failed"; $stage.note = "Reset by user." }
      }
      Save-JsonFile -Path $paths["policy-generation"].File -Value $pg
      Write-AuditLogEntry -ClientId $clientId -EventType "processing_reset" -Payload ([ordered]@{ client_id = $clientId })
    }
    Respond-Json -Client $Client -StatusCode 200 -Payload (Get-ClientAggregate -ClientId $clientId)
    return
  }

  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "process-targeted" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $payload  = ConvertTo-BodyObject -Body $Body
    $policyIds = @($payload.policyIds | ForEach-Object { [string]$_ }) | Where-Object { $_ }
    $riskIds   = @($payload.riskIds   | ForEach-Object { [string]$_ }) | Where-Object { $_ }
    $vendorIds = @($payload.vendorIds | ForEach-Object { [string]$_ }) | Where-Object { $_ }
    Respond-Json -Client $Client -StatusCode 200 -Payload (Invoke-TargetedRegeneration -ClientId $clientId -PolicyIds $policyIds -RiskIds $riskIds -VendorIds $vendorIds)
    return
  }
  # ── Treatment plan regeneration ────────────────────────────────
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "regenerate-treatment-plans" -and $Method -eq "POST") {
    $clientId   = [System.Uri]::UnescapeDataString($segments[2])
    $paths      = Get-SectionPaths -ClientId $clientId
    $onboarding = Read-JsonFile -Path $paths["onboarding"].File       -DefaultValue (New-DefaultSection -SectionKey "onboarding"       -ClientId $clientId -CompanyName $clientId)
    $pg         = Read-JsonFile -Path $paths["policy-generation"].File -DefaultValue ([ordered]@{ policies = @() })
    $vr         = Read-JsonFile -Path $paths["vendor-risk"].File       -DefaultValue ([ordered]@{ vendors  = @() })
    $ra         = Read-JsonFile -Path $paths["risk-assessment"].File   -DefaultValue ([ordered]@{ risks    = @() })
    if (@($ra.risks | Where-Object { $_ }).Count -gt 0) {
      $withPlans = Invoke-TreatmentPlanAgent -Risks $ra.risks -Onboarding $onboarding -Policies $pg.policies -Vendors $vr.vendors
      if (@($withPlans | Where-Object { $_ }).Count -gt 0) {
        $ra.risks = @($withPlans)
        Save-JsonFile -Path $paths["risk-assessment"].File -Value $ra
        Write-AuditLogEntry -ClientId $clientId -EventType "treatment_plan_regeneration" -Payload ([ordered]@{
          risk_count  = @($ra.risks).Count
          ai_enhanced = (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY))
        })
      }
    }
    Respond-Json -Client $Client -StatusCode 200 -Payload (Get-ClientAggregate -ClientId $clientId)
    return
  }
  # ── Selective regeneration endpoints ──────────────────────────
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "process-risks" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = "powershell.exe"
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptFilePath`" $Port process-risks-worker `"$clientId`""
    $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
    [System.Diagnostics.Process]::Start($psi) | Out-Null
    Respond-Json -Client $Client -StatusCode 200 -Payload (Get-ClientAggregate -ClientId $clientId)
    return
  }
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "process-vendors" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = "powershell.exe"
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptFilePath`" $Port process-vendors-worker `"$clientId`""
    $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
    [System.Diagnostics.Process]::Start($psi) | Out-Null
    Respond-Json -Client $Client -StatusCode 200 -Payload (Get-ClientAggregate -ClientId $clientId)
    return
  }
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "process-audit" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    Respond-Json -Client $Client -StatusCode 200 -Payload (Invoke-SelectiveAuditRegeneration -ClientId $clientId)
    return
  }
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "process-controls" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $cPaths      = Get-SectionPaths -ClientId $clientId
    $cOnboarding = Read-JsonFile -Path $cPaths["onboarding"].File       -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $clientId -CompanyName $clientId)
    $cPg         = Read-JsonFile -Path $cPaths["policy-generation"].File -DefaultValue ([ordered]@{ policies = @() })
    $cRa         = Read-JsonFile -Path $cPaths["risk-assessment"].File   -DefaultValue ([ordered]@{ risks    = @() })
    $cVr         = Read-JsonFile -Path $cPaths["vendor-risk"].File       -DefaultValue ([ordered]@{ vendors  = @() })
    $cCm         = New-ControlMappingSection -Policies $cPg.policies -Risks $cRa.risks -Vendors $cVr.vendors -FrameworkLabels (Get-FrameworkLabels -Onboarding $cOnboarding)
    Save-JsonFile -Path $cPaths["control-mapping"].File -Value $cCm
    $cAudit      = New-AuditQaSection -Policies $cPg.policies -Risks $cRa.risks -Vendors $cVr.vendors -Controls $cCm.controls
    Save-JsonFile -Path $cPaths["audit-qa"].File -Value $cAudit
    Respond-Json -Client $Client -StatusCode 200 -Payload (Get-ClientAggregate -ClientId $clientId)
    return
  }
  if ($segments.Length -eq 5 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "process-policy" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $policyId = [System.Uri]::UnescapeDataString($segments[4])
    Respond-Json -Client $Client -StatusCode 200 -Payload (Invoke-SelectivePolicyAiEnhancement -ClientId $clientId -PolicyId $policyId)
    return
  }
  if ($segments.Length -eq 5 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "policies" -and $segments[4] -eq "publish-all" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    Respond-Json -Client $Client -StatusCode 200 -Payload (Publish-AllClientPolicies -ClientId $clientId)
    return
  }
  if ($segments.Length -eq 5 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "policies" -and $segments[4] -eq "unpublish-all" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    Respond-Json -Client $Client -StatusCode 200 -Payload (Unpublish-AllClientPolicies -ClientId $clientId)
    return
  }
  if ($segments.Length -eq 5 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "policies" -and $segments[4] -eq "unsign-all" -and $Method -eq "POST") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    Respond-Json -Client $Client -StatusCode 200 -Payload (Unpublish-AllClientPolicies -ClientId $clientId -UnsignOnly)
    return
  }
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $Method -eq "PUT") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $sectionKey = [System.Uri]::UnescapeDataString($segments[3])
    if (-not $sectionMeta.ContainsKey($sectionKey)) { Respond-Text -Client $Client -StatusCode 404 -Text "Unknown section"; return }
    Ensure-ClientWorkspace -CompanyName $clientId | Out-Null
    $paths = Get-SectionPaths -ClientId $clientId
    $current = Read-JsonFile -Path $paths[$sectionKey].File -DefaultValue (New-DefaultSection -SectionKey $sectionKey -ClientId $clientId -CompanyName $clientId)
    $previousSection = Read-JsonFile -Path $paths[$sectionKey].File -DefaultValue (New-DefaultSection -SectionKey $sectionKey -ClientId $clientId -CompanyName $clientId)
    $existingPolicies = @($current.policies)
    $payload = ConvertTo-BodyObject -Body $Body
    $onboardingCurrent = Read-JsonFile -Path $paths["onboarding"].File -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $clientId -CompanyName $clientId)
    foreach ($property in $payload.PSObject.Properties.Name) {
      $current | Add-Member -NotePropertyName $property -NotePropertyValue $payload.$property -Force
    }
    if ($sectionKey -eq "policy-generation") {
      $current.policies = Apply-PolicyGovernance -CurrentPolicies $existingPolicies -IncomingPolicies @($payload.policies) -Onboarding $onboardingCurrent
      Write-AuditLogEntry -ClientId $clientId -EventType "policy_generation_saved" -Payload ([ordered]@{
        client_id = $clientId
        policy_count = @($current.policies).Count
        approved_policy_count = @($current.policies | Where-Object { (Test-ToggleEnabled -Value $_.published) -and (Test-ToggleEnabled -Value $_.sign_off_complete) }).Count
      })
    }
    if ($sectionKey -eq "risk-assessment") {
      $current.risks = @($current.risks | ForEach-Object { Normalize-RiskRecord -Risk $_ })
    }
    if ($sectionKey -eq "vendor-risk") {
      $current.vendors = @($current.vendors | ForEach-Object { Normalize-VendorRecord -Vendor $_ })
    }
    if ($sectionKey -eq "onboarding") {
      $materialChange = Test-OnboardingMaterialChange -Before $previousSection -After $current
      if ($materialChange) {
        $current.reprocessing_required = "Yes"
        $current.change_notice = "Onboarding changed. Policies, risks, and vendor assessments must be regenerated so all downstream outputs reflect the updated intake."
        $current.downstream_reset_at = (Get-Date).ToString("o")
        Reset-DownstreamWorkflow -ClientId $clientId -CompanyName $clientId
        Write-AuditLogEntry -ClientId $clientId -EventType "onboarding_changed" -Payload ([ordered]@{
          client_id = $clientId
          downstream_reset = $true
          reset_at = $current.downstream_reset_at
        })
      }
      Update-VendorCatalog -VendorRecords @($current.vendors) | Out-Null
    }
    if ($sectionKey -eq "vendor-risk") {
      Update-VendorCatalog -VendorRecords @($current.vendors) | Out-Null
    }
    Save-JsonFile -Path $paths[$sectionKey].File -Value $current
    if ($sectionKey -eq "onboarding" -and $current.legal_entity) {
      $aggregate = Get-ClientAggregate -ClientId $clientId
      $aggregate.client.companyName = $current.legal_entity
    }
    $aggregate = Get-ClientAggregate -ClientId $clientId
    Respond-Json -Client $Client -StatusCode 200 -Payload $aggregate.($sectionMeta[$sectionKey].Property)
    return
  }
  # ── Intelligence Centre ────────────────────────────────────────
  if ($segments.Length -eq 3 -and $segments[0] -eq "api" -and $segments[1] -eq "intelligence" -and $segments[2] -eq "status" -and $Method -eq "GET") {
    $apiKeyConfigured = -not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)
    Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{
      api_key_configured = $apiKeyConfigured
    })
    return
  }
  if ($segments.Length -eq 3 -and $segments[0] -eq "api" -and $segments[1] -eq "intelligence" -and $segments[2] -eq "improve" -and $Method -eq "POST") {
    $payload = ConvertTo-BodyObject -Body $Body
    $improveType = [string]$payload.type
    $apiKey = [string]$payload.api_key
    $contextObj = $payload.context
    if ([string]::IsNullOrWhiteSpace($apiKey)) { $apiKey = $env:ANTHROPIC_API_KEY }
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
      Respond-Json -Client $Client -StatusCode 400 -Payload ([ordered]@{ error = "No API key provided." })
      return
    }
    try {
      $systemPrompt = "You are a senior GRC consultant improving compliance documentation for a specific company. Your task is to transform generic policy content into precise, operationally meaningful documentation. Rules: (1) Every section must reference the company by name, not 'the company'. (2) Name actual systems, tools, platforms, and data types rather than using generic terms. (3) Each policy body field must use the exact format: section heading on its own line, blank line, then paragraph content — never 'N.N Heading. Content...' on one line. (4) Controls must be specific and auditable, not aspirational. (5) Return ONLY valid JSON with the same structure as the input — no extra keys, no markdown, no explanation."
      switch ($improveType) {
        "policies" {
          $inputData = $payload.policies
          $userPrompt = "Company: $($contextObj.companyName). Industry: $($contextObj.industry). Tech stack: $($contextObj.techStack). Frameworks: $($contextObj.frameworks). Data handled: $($contextObj.dataTypes). Rewrite the body field of each policy in this array to: (1) Name $($contextObj.companyName) explicitly in every section. (2) Reference the actual tech stack ($($contextObj.techStack)) and data types ($($contextObj.dataTypes)) with specifics. (3) Replace any 'N.N Heading. Content...' inline format — each subsection heading MUST be on its own line followed by a blank line then the paragraph. (4) Make controls auditable and concrete — name the actual mechanisms, not general principles. (5) Preserve and improve the executive_summary and table_of_contents fields. Return the full improved policies array as JSON. Input: $($inputData | ConvertTo-Json -Depth 20 -Compress)"
        }
        "risks" {
          $inputData = $payload.risks
          $userPrompt = "Company: $($contextObj.companyName). Industry: $($contextObj.industry). Tech stack: $($contextObj.techStack). Improve the following risk register entries — add specific threat actors, realistic likelihood justifications, company-specific why_this_company fields, and concrete treatment plans. Return the improved risks array as JSON. Input: $($inputData | ConvertTo-Json -Depth 20 -Compress)"
        }
        "vendors" {
          $inputData = $payload.vendors
          $userPrompt = "Company: $($contextObj.companyName). Industry: $($contextObj.industry). Improve the following vendor assessments — add specific security questions, realistic risk scores, and concrete notes referencing the vendor's actual service. Return the improved vendors array as JSON. Input: $($inputData | ConvertTo-Json -Depth 20 -Compress)"
        }
        default {
          Respond-Json -Client $Client -StatusCode 400 -Payload ([ordered]@{ error = "Unknown improvement type: $improveType" })
          return
        }
      }
      $requestBody = [ordered]@{
        model = "claude-sonnet-4-6"
        max_tokens = 8000
        system = $systemPrompt
        messages = @(@{ role = "user"; content = $userPrompt })
      } | ConvertTo-Json -Depth 10 -Compress
      $response = Invoke-WebRequest -Uri "https://api.anthropic.com/v1/messages" -Method POST -Body $requestBody -ContentType "application/json" -Headers @{
        "x-api-key" = $apiKey
        "anthropic-version" = "2023-06-01"
      } -UseBasicParsing
      $responseObj = $response.Content | ConvertFrom-Json
      $assistantText = $responseObj.content[0].text
      $jsonStart = $assistantText.IndexOf("[")
      if ($jsonStart -lt 0) { $jsonStart = $assistantText.IndexOf("{") }
      $jsonEnd = $assistantText.LastIndexOf("]")
      if ($jsonEnd -lt 0) { $jsonEnd = $assistantText.LastIndexOf("}") }
      if ($jsonStart -lt 0 -or $jsonEnd -lt 0 -or $jsonEnd -le $jsonStart) {
        Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{
          score = 0
          improvements_count = 0
          error = "Could not parse LLM response as JSON."
          raw = $assistantText.Substring(0, [Math]::Min(500, $assistantText.Length))
        })
        return
      }
      $improvedJson = $assistantText.Substring($jsonStart, $jsonEnd - $jsonStart + 1)
      $improvedData = $improvedJson | ConvertFrom-Json
      $improvementsCount = if ($improveType -eq "policies") { @($improvedData).Count * 3 } else { @($improvedData).Count }
      Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{
        score = 85
        improvements_count = $improvementsCount
        type = $improveType
        data = $improvedData
      })
    } catch {
      Respond-Json -Client $Client -StatusCode 500 -Payload ([ordered]@{ error = $_.Exception.Message })
    }
    return
  }
  # GET /api/settings
  if ($segments.Length -eq 2 -and $segments[0] -eq "api" -and $segments[1] -eq "settings" -and $Method -eq "GET") {
    $hasKey = (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY))
    Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{
      ai_enabled  = ($hasKey -and $script:aiKeyValid)
      has_api_key = $hasKey
      key_valid   = $script:aiKeyValid
    })
    return
  }

  # POST /api/settings/api-key — save key to .env and apply immediately
  if ($segments.Length -eq 3 -and $segments[0] -eq "api" -and $segments[1] -eq "settings" -and $segments[2] -eq "api-key" -and $Method -eq "POST") {
    $payload = ConvertTo-BodyObject -Body $Body
    $newKey = [string]$payload.api_key
    if ([string]::IsNullOrWhiteSpace($newKey)) {
      Respond-Json -Client $Client -StatusCode 400 -Payload ([ordered]@{ error = "api_key is required" })
      return
    }
    $envFile = Join-Path $scriptRoot ".env"
    $kept = @()
    if (Test-Path $envFile) { $kept = @(Get-Content $envFile | Where-Object { $_ -notmatch '^\s*ANTHROPIC_API_KEY\s*=' }) }
    $kept += "ANTHROPIC_API_KEY=$newKey"
    # Write without BOM — UTF8 with BOM causes the key to load with a junk prefix on restart
    $enc = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllLines($envFile, $kept, $enc)
    $env:ANTHROPIC_API_KEY = $newKey
    Write-Host "[settings] ANTHROPIC_API_KEY saved to .env and applied. Validating..."
    $valid = Test-AnthropicKeyValid
    Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{ saved = $true; ai_enabled = $valid; key_valid = $valid })
    return
  }

  # ── Evidence file upload ──────────────────────────────────────
  # POST /api/clients/:id/evidence-upload
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "evidence-upload" -and $Method -eq "POST") {
    $clientId     = [System.Uri]::UnescapeDataString($segments[2])
    $payload      = ConvertTo-BodyObject -Body $Body
    $evidenceId   = [string]$payload.evidence_id
    $originalName = [string]$payload.file_name
    $base64Data   = [string]$payload.base64

    if ([string]::IsNullOrWhiteSpace($evidenceId) -or [string]::IsNullOrWhiteSpace($originalName) -or [string]::IsNullOrWhiteSpace($base64Data)) {
      Respond-Json -Client $Client -StatusCode 400 -Payload ([ordered]@{ error = "evidence_id, file_name, and base64 are required" })
      return
    }

    # Sanitize filename — remove path traversal characters
    $safeName = [System.Text.RegularExpressions.Regex]::Replace($originalName, '[\\/:*?"<>|]', '_').Trim()
    if ([string]::IsNullOrWhiteSpace($safeName)) { $safeName = "attachment" }

    $paths      = Get-SectionPaths -ClientId $clientId
    $evFolder   = Join-Path (Split-Path -Parent $paths["evidence-tracker"].File) "files"
    $itemFolder = Join-Path $evFolder $evidenceId
    New-Item -ItemType Directory -Force -Path $itemFolder | Out-Null
    $targetPath = Join-Path $itemFolder $safeName

    try {
      $fileBytes = [System.Convert]::FromBase64String($base64Data)
      [System.IO.File]::WriteAllBytes($targetPath, $fileBytes)
      Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{ file_name = $safeName; file_path = $targetPath })
    } catch {
      Respond-Json -Client $Client -StatusCode 500 -Payload ([ordered]@{ error = $_.Exception.Message })
    }
    return
  }

  # ── Evidence ZIP export ────────────────────────────────────────
  # GET /api/clients/:id/evidence-zip
  if ($segments.Length -eq 4 -and $segments[0] -eq "api" -and $segments[1] -eq "clients" -and $segments[3] -eq "evidence-zip" -and $Method -eq "GET") {
    $clientId = [System.Uri]::UnescapeDataString($segments[2])
    $paths    = Get-SectionPaths -ClientId $clientId
    $etData   = Read-JsonFile -Path $paths["evidence-tracker"].File -DefaultValue ([ordered]@{ evidence_items = @() })
    $items    = @($etData.evidence_items | Where-Object { $_ })

    if ($items.Count -eq 0) {
      Respond-Json -Client $Client -StatusCode 200 -Payload ([ordered]@{ error = "No evidence items found" })
      return
    }

    Add-Type -AssemblyName System.IO.Compression

    $memStream = [System.IO.MemoryStream]::new()
    $zip       = [System.IO.Compression.ZipArchive]::new($memStream, [System.IO.Compression.ZipArchiveMode]::Create, $true)

    try {
      $clientRoot = [System.IO.Path]::GetFullPath((Join-Path $dataRoot $clientId))

      $sanitize = { param([string]$n) [System.Text.RegularExpressions.Regex]::Replace(($n.Trim() -replace '\s+', ' '), '[\\/:*?"<>|]', '_').Trim() }

      foreach ($item in $items) {
        $itemId    = [string]$item.id
        $taskId    = & $sanitize ([string]$item.task_id)
        $evTitle   = & $sanitize ([string]$item.title)
        if ([string]::IsNullOrWhiteSpace($evTitle)) { $evTitle = $itemId }
        $folderPfx = "$taskId/$evTitle"

        $filePath = [string]$item.file_path
        if (-not [string]::IsNullOrWhiteSpace($filePath) -and (Test-Path $filePath -PathType Leaf)) {
          # Security: file must be within this client's folder
          $resolvedFile = [System.IO.Path]::GetFullPath($filePath)
          if ($resolvedFile.StartsWith($clientRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            $fileName  = [System.IO.Path]::GetFileName($filePath)
            $entryName = "$folderPfx/$fileName"
            $entry     = $zip.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Fastest)
            $es        = $entry.Open()
            $fb        = [System.IO.File]::ReadAllBytes($filePath)
            $es.Write($fb, 0, $fb.Length)
            $es.Dispose()
          }
        } else {
          # Metadata-only item — write a plain-text descriptor
          $metaLines = @(
            "Evidence Item : $([string]$item.title)",
            "ID            : $itemId",
            "Task ID       : $([string]$item.task_id)",
            "Type          : $([string]$item.evidence_type)",
            "Description   : $([string]$item.description)",
            "Effective Date: $([string]$item.effective_date)",
            "Added         : $([string]$item.uploaded_at)",
            "",
            "Note: No file was attached to this evidence item — metadata only."
          )
          $metaBytes = [System.Text.Encoding]::UTF8.GetBytes(($metaLines -join "`r`n"))
          $entryName = "$folderPfx/evidence-metadata.txt"
          $entry     = $zip.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Fastest)
          $es        = $entry.Open()
          $es.Write($metaBytes, 0, $metaBytes.Length)
          $es.Dispose()
        }
      }

      $zip.Dispose()
      $zipBytes = $memStream.ToArray()
      $memStream.Dispose()

      $safeId    = [System.Text.RegularExpressions.Regex]::Replace($clientId, '[^a-zA-Z0-9\-_ ]', '').Trim()
      $datestamp = (Get-Date).ToString("yyyy-MM-dd")
      $zipName   = "Evidence-${safeId}-${datestamp}.zip"

      Send-Response -Client $Client -StatusCode 200 -ContentType "application/zip" -BodyBytes $zipBytes -ExtraHeaders @{
        "Content-Disposition" = "attachment; filename=""$zipName"""
        "Cache-Control"       = "no-store"
        "Access-Control-Allow-Origin" = "*"
      }
    } catch {
      try { $zip.Dispose() }       catch {}
      try { $memStream.Dispose() } catch {}
      Respond-Json -Client $Client -StatusCode 500 -Payload ([ordered]@{ error = $_.Exception.Message })
    }
    return
  }

  Respond-Text -Client $Client -StatusCode 404 -Text "Not found"
}

# Skip heavy catalog initialization when running as a background worker
if ($Task -ne "process-client") {
  Initialize-VendorCatalogFromExistingData
}

if ($Task -in @("process-client", "process-risks-worker", "process-vendors-worker", "process-controls-worker")) {
  if (-not $TaskClientId) {
    throw "Task client ID is required for $Task."
  }

  # Ensure worker process has API key from .env (parent env vars may not be inherited)
  if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
    $workerEnvFile = Join-Path $scriptRoot ".env"
    if (Test-Path $workerEnvFile) {
      foreach ($line in Get-Content $workerEnvFile) {
        if ($line -match '^\s*([^#=\s][^=]*?)\s*=\s*(.*?)\s*$') {
          $vn = $Matches[1].Trim().TrimStart([char]0xFEFF); $vv = $Matches[2].Trim('"').Trim("'")
          if (-not [string]::IsNullOrWhiteSpace($vn)) { Set-Item "env:$vn" $vv }
        }
      }
      Write-Host "[worker] Loaded .env — ANTHROPIC_API_KEY $(if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) { 'NOT set' } else { 'loaded' })"
    }
  }

  if ($Task -eq "process-risks-worker") {
    try { Invoke-SelectiveRiskRegeneration -ClientId $TaskClientId | Out-Null } catch { Write-Host "[risks-worker] Error: $($_.Exception.Message)" }
    # Auto-chain: generate vendor assessments as soon as risks are complete
    try { Invoke-SelectiveVendorRegeneration -ClientId $TaskClientId | Out-Null } catch { Write-Host "[risks-worker] Vendor chain error: $($_.Exception.Message)" }
    return
  }

  if ($Task -eq "process-vendors-worker") {
    try { Invoke-SelectiveVendorRegeneration -ClientId $TaskClientId | Out-Null } catch { Write-Host "[vendors-worker] Error: $($_.Exception.Message)" }
    return
  }

  if ($Task -eq "process-controls-worker") {
    try {
      $cPaths      = Get-SectionPaths -ClientId $TaskClientId
      $cOnboarding = Read-JsonFile -Path $cPaths["onboarding"].File       -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $TaskClientId -CompanyName $TaskClientId)
      $cPg         = Read-JsonFile -Path $cPaths["policy-generation"].File -DefaultValue ([ordered]@{ policies = @() })
      $cRa         = Read-JsonFile -Path $cPaths["risk-assessment"].File   -DefaultValue ([ordered]@{ risks    = @() })
      $cVr         = Read-JsonFile -Path $cPaths["vendor-risk"].File       -DefaultValue ([ordered]@{ vendors  = @() })
      $cCm         = New-ControlMappingSection -Policies $cPg.policies -Risks $cRa.risks -Vendors $cVr.vendors -FrameworkLabels (Get-FrameworkLabels -Onboarding $cOnboarding)
      Save-JsonFile -Path $cPaths["control-mapping"].File -Value $cCm
      $cAudit      = New-AuditQaSection -Policies $cPg.policies -Risks $cRa.risks -Vendors $cVr.vendors -Controls $cCm.controls
      Save-JsonFile -Path $cPaths["audit-qa"].File -Value $cAudit
      Write-Host "[controls-worker] Generated $(@($cCm.controls).Count) controls for $TaskClientId"
    } catch { Write-Host "[controls-worker] Error: $($_.Exception.Message)" }
    return
  }

  try {
    Invoke-ClientProcessing -ClientId $TaskClientId -ForcePolicyRegeneration:$TaskForcePolicyRegeneration | Out-Null
  } catch {
    $paths = Get-SectionPaths -ClientId $TaskClientId
    $onboarding = Read-JsonFile -Path $paths["onboarding"].File -DefaultValue (New-DefaultSection -SectionKey "onboarding" -ClientId $TaskClientId -CompanyName $TaskClientId)
    $topRisks = Get-DerivedTopRisks -Onboarding $onboarding
    $policyGeneration = Read-JsonFile -Path $paths["policy-generation"].File -DefaultValue (New-PolicyGenerationProgressSection -Onboarding $onboarding -TopRisks $topRisks)
    $policyGeneration = Fail-PolicyGenerationSection -Section $policyGeneration -Note $_.Exception.Message
    Save-JsonFile -Path $paths["policy-generation"].File -Value $policyGeneration
    Write-AuditLogEntry -ClientId $TaskClientId -EventType "processing_failed" -Payload ([ordered]@{
      client_id = $TaskClientId
      error = $_.Exception.Message
    })
    throw
  }

  return
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "DB Agent local app running at http://localhost:$Port"

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8, $false, 4096, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { Respond-Text -Client $client -StatusCode 400 -Text "Bad request"; continue }
      $requestParts = $requestLine.Split(" ")
      $method = $requestParts[0].ToUpperInvariant()
      $path = $requestParts[1]
      $headers = @{}
      while ($true) {
        $headerLine = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($headerLine)) { break }
        $separator = $headerLine.IndexOf(":")
        if ($separator -gt 0) { $headers[$headerLine.Substring(0, $separator).Trim().ToLowerInvariant()] = $headerLine.Substring($separator + 1).Trim() }
      }
      $body = ""
      if ($headers.ContainsKey("content-length")) {
        $contentLength = [int]$headers["content-length"]
        if ($contentLength -gt 0) {
          $buffer = New-Object char[] $contentLength
          $charsRead = $reader.ReadBlock($buffer, 0, $contentLength)
          if ($charsRead -gt 0) {
            $body = -join $buffer[0..($charsRead - 1)]
          }
        }
      }
      if ($path.StartsWith("/api/")) { Handle-ApiRequest -Client $client -Method $method -Path $path -Body $body } else { Handle-StaticRequest -Client $client -Path $path }
    } catch {
      try { Respond-Text -Client $client -StatusCode 500 -Text $_.Exception.Message } catch {}
    } finally {
      if ($reader) { $reader.Dispose() }
      if ($stream) { $stream.Dispose() }
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
}


