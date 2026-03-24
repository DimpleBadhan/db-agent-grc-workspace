"use strict";

// Popular vendor IDs shown as quick-select chips
const VL_POPULAR_IDS = ["VL-001", "VL-009", "VL-014", "VL-019", "VL-031", "VL-008"];

// Built-in vendor library — 105 vendors
const VL_LIBRARY = [
  // ─── CLOUD INFRASTRUCTURE ───────────────────────────────────────
  { id: "VL-001", name: "Amazon Web Services (AWS)", category: "Cloud Infrastructure",
    description: "Cloud computing platform providing servers, storage, databases, networking, analytics, and AI services. Used for hosting applications and infrastructure.",
    typical_data_access: ["PII", "PHI", "PCI", "Financial", "IP", "Credentials"], default_tier: "Critical",
    common_services_used: ["EC2", "S3", "RDS", "Lambda", "CloudTrail", "IAM", "VPC"],
    certifications: ["SOC 2 Type II", "ISO 27001", "PCI DSS", "HIPAA BAA available"],
    dpa_available: true, shared_responsibility: true, website: "aws.amazon.com" },

  { id: "VL-002", name: "Google Cloud Platform (GCP)", category: "Cloud Infrastructure",
    description: "Cloud computing services for computing, storage, databases, machine learning, and application development.",
    typical_data_access: ["PII", "PHI", "PCI", "Financial", "IP"], default_tier: "Critical",
    common_services_used: ["Compute Engine", "Cloud Storage", "BigQuery", "Cloud SQL", "GKE"],
    certifications: ["SOC 2 Type II", "ISO 27001", "PCI DSS", "HIPAA BAA available"],
    dpa_available: true, shared_responsibility: true, website: "cloud.google.com" },

  { id: "VL-003", name: "Microsoft Azure", category: "Cloud Infrastructure",
    description: "Microsoft's cloud platform offering computing, analytics, storage, and networking services.",
    typical_data_access: ["PII", "PHI", "PCI", "Financial", "IP"], default_tier: "Critical",
    common_services_used: ["Virtual Machines", "Azure Blob", "Azure SQL", "Azure AD", "AKS"],
    certifications: ["SOC 2 Type II", "ISO 27001", "PCI DSS", "HIPAA BAA available"],
    dpa_available: true, shared_responsibility: true, website: "azure.microsoft.com" },

  { id: "VL-004", name: "Cloudflare", category: "Cloud Infrastructure",
    description: "CDN, DDoS protection, DNS, firewall, and edge computing services. Sits in front of web traffic.",
    typical_data_access: ["PII", "Credentials"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001", "PCI DSS"],
    dpa_available: true, shared_responsibility: false, website: "cloudflare.com" },

  { id: "VL-005", name: "DigitalOcean", category: "Cloud Infrastructure",
    description: "Cloud infrastructure provider offering virtual machines, managed databases, and storage for developers and startups.",
    typical_data_access: ["PII", "IP", "Credentials"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: true, website: "digitalocean.com" },

  { id: "VL-006", name: "Vercel", category: "Cloud Infrastructure",
    description: "Frontend cloud platform for deploying web applications. Handles hosting, CI/CD, and edge functions.",
    typical_data_access: ["PII", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "vercel.com" },

  { id: "VL-007", name: "Heroku", category: "Cloud Infrastructure",
    description: "Platform as a service for deploying and managing applications. Owned by Salesforce.",
    typical_data_access: ["PII", "IP", "Credentials"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "heroku.com" },

  // ─── IDENTITY AND ACCESS MANAGEMENT ────────────────────────────
  { id: "VL-008", name: "Okta", category: "Identity and Access Management",
    description: "Identity provider offering single sign-on, MFA, and user lifecycle management across all company applications.",
    typical_data_access: ["PII", "Credentials"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "okta.com" },

  { id: "VL-009", name: "Google Workspace", category: "Identity and Access Management",
    description: "Productivity suite and identity provider including Gmail, Drive, Docs, Meet, and admin directory. Often the primary SSO provider for startups.",
    typical_data_access: ["PII", "IP", "Financial"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "workspace.google.com" },

  { id: "VL-010", name: "Microsoft 365", category: "Identity and Access Management",
    description: "Microsoft productivity suite including Outlook, Teams, SharePoint, OneDrive, and Azure Active Directory for identity management.",
    typical_data_access: ["PII", "IP", "Financial"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "microsoft.com/microsoft-365" },

  { id: "VL-011", name: "Auth0", category: "Identity and Access Management",
    description: "Authentication and authorisation platform for applications. Handles login, MFA, and user identity for customer-facing products.",
    typical_data_access: ["PII", "Credentials"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "auth0.com" },

  { id: "VL-012", name: "1Password", category: "Identity and Access Management",
    description: "Password manager and secrets vault for teams. Stores credentials, API keys, and sensitive documents.",
    typical_data_access: ["Credentials", "IP"], default_tier: "Critical",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "1password.com" },

  { id: "VL-013", name: "LastPass", category: "Identity and Access Management",
    description: "Password management platform for storing and sharing credentials securely across teams.",
    typical_data_access: ["Credentials"], default_tier: "Critical",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "lastpass.com" },

  // ─── SOURCE CODE AND DEVELOPMENT ────────────────────────────────
  { id: "VL-014", name: "GitHub", category: "Source Code Management",
    description: "Source code hosting, version control, CI/CD pipelines, and developer collaboration platform. Stores the company's codebase.",
    typical_data_access: ["IP", "Credentials"], default_tier: "Critical",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "github.com" },

  { id: "VL-015", name: "GitLab", category: "Source Code Management",
    description: "DevOps platform offering source control, CI/CD, security scanning, and project management in one tool.",
    typical_data_access: ["IP", "Credentials"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "gitlab.com" },

  { id: "VL-016", name: "Bitbucket", category: "Source Code Management",
    description: "Atlassian's source code repository and CI/CD platform. Integrates with Jira for development workflows.",
    typical_data_access: ["IP", "Credentials"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "bitbucket.org" },

  { id: "VL-017", name: "CircleCI", category: "CI/CD",
    description: "Continuous integration and deployment platform that automates building, testing, and deploying code.",
    typical_data_access: ["IP", "Credentials"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "circleci.com" },

  { id: "VL-018", name: "Snyk", category: "Security Tooling",
    description: "Developer security platform that scans code, dependencies, containers, and infrastructure for vulnerabilities.",
    typical_data_access: ["IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "snyk.io" },

  // ─── COMMUNICATION AND COLLABORATION ────────────────────────────
  { id: "VL-019", name: "Slack", category: "Communication",
    description: "Team messaging and collaboration platform. Often contains sensitive business discussions, credentials shared in channels, and customer data.",
    typical_data_access: ["PII", "IP", "Financial"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "slack.com" },

  { id: "VL-020", name: "Zoom", category: "Communication",
    description: "Video conferencing platform used for internal meetings and customer calls. May process sensitive conversations.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "zoom.us" },

  { id: "VL-021", name: "Microsoft Teams", category: "Communication",
    description: "Microsoft's collaboration platform for messaging, video calls, and file sharing. Part of Microsoft 365.",
    typical_data_access: ["PII", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "microsoft.com/teams" },

  { id: "VL-022", name: "Notion", category: "Collaboration",
    description: "All-in-one workspace for notes, wikis, project management, and documentation. Often stores internal processes and sensitive business information.",
    typical_data_access: ["IP", "PII"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "notion.so" },

  { id: "VL-023", name: "Confluence", category: "Collaboration",
    description: "Atlassian's wiki and documentation platform for teams. Stores internal processes, policies, and technical documentation.",
    typical_data_access: ["IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "atlassian.com/confluence" },

  // ─── PROJECT MANAGEMENT ─────────────────────────────────────────
  { id: "VL-024", name: "Jira", category: "Project Management",
    description: "Issue tracking and project management tool. May contain details about security vulnerabilities, incidents, and internal processes.",
    typical_data_access: ["IP"], default_tier: "Medium",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "atlassian.com/jira" },

  { id: "VL-025", name: "Asana", category: "Project Management",
    description: "Work management platform for tracking tasks, projects, and team workflows.",
    typical_data_access: ["IP"], default_tier: "Low",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "asana.com" },

  { id: "VL-026", name: "Linear", category: "Project Management",
    description: "Issue tracking and project management tool built for software teams. Stores development tasks and roadmaps.",
    typical_data_access: ["IP"], default_tier: "Low",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "linear.app" },

  { id: "VL-027", name: "Monday.com", category: "Project Management",
    description: "Work operating system for project tracking, team collaboration, and workflow automation.",
    typical_data_access: ["PII", "IP"], default_tier: "Medium",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "monday.com" },

  // ─── CRM AND SALES ───────────────────────────────────────────────
  { id: "VL-028", name: "Salesforce", category: "CRM",
    description: "Customer relationship management platform storing customer data, sales pipelines, contracts, and business communications.",
    typical_data_access: ["PII", "Financial"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "salesforce.com" },

  { id: "VL-029", name: "HubSpot", category: "CRM",
    description: "CRM, marketing, and sales platform storing customer contact data, email campaigns, and deal pipelines.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "hubspot.com" },

  { id: "VL-030", name: "Pipedrive", category: "CRM",
    description: "Sales-focused CRM for managing deals, contacts, and sales pipelines.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "pipedrive.com" },

  // ─── PAYMENTS AND FINANCE ────────────────────────────────────────
  { id: "VL-031", name: "Stripe", category: "Payments",
    description: "Payment processing platform handling card transactions, subscriptions, and financial data. PCI DSS certified processor.",
    typical_data_access: ["PCI", "PII", "Financial"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "PCI DSS Level 1"],
    dpa_available: true, shared_responsibility: false, website: "stripe.com" },

  { id: "VL-032", name: "PayPal", category: "Payments",
    description: "Online payment platform for processing transactions and managing financial transfers.",
    typical_data_access: ["PCI", "PII", "Financial"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "PCI DSS Level 1"],
    dpa_available: true, shared_responsibility: false, website: "paypal.com" },

  { id: "VL-033", name: "Braintree", category: "Payments",
    description: "PayPal-owned payment gateway for processing credit cards, PayPal, and digital wallets.",
    typical_data_access: ["PCI", "PII", "Financial"], default_tier: "Critical",
    certifications: ["PCI DSS Level 1"],
    dpa_available: true, shared_responsibility: false, website: "braintreepayments.com" },

  { id: "VL-034", name: "Xero", category: "Finance and Accounting",
    description: "Cloud accounting software for managing invoices, payroll, expenses, and financial reporting.",
    typical_data_access: ["Financial", "PII"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "xero.com" },

  { id: "VL-035", name: "QuickBooks", category: "Finance and Accounting",
    description: "Accounting software for managing business finances, payroll, invoicing, and tax reporting.",
    typical_data_access: ["Financial", "PII"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "quickbooks.intuit.com" },

  { id: "VL-036", name: "Brex", category: "Finance and Accounting",
    description: "Corporate card and spend management platform for startups and growth companies.",
    typical_data_access: ["Financial", "PII"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "brex.com" },

  // ─── HR AND PEOPLE ───────────────────────────────────────────────
  { id: "VL-037", name: "Workday", category: "HR and People",
    description: "Enterprise HR platform managing payroll, benefits, talent, and workforce data.",
    typical_data_access: ["PII", "Financial"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "workday.com" },

  { id: "VL-038", name: "BambooHR", category: "HR and People",
    description: "HR software for managing employee records, onboarding, performance reviews, and time tracking.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "bamboohr.com" },

  { id: "VL-039", name: "Rippling", category: "HR and People",
    description: "HR, IT, and finance platform managing payroll, device management, app provisioning, and employee lifecycle.",
    typical_data_access: ["PII", "Financial", "Credentials"], default_tier: "Critical",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "rippling.com" },

  { id: "VL-040", name: "Gusto", category: "HR and People",
    description: "Payroll, benefits, and HR platform primarily for small and medium businesses.",
    typical_data_access: ["PII", "Financial"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "gusto.com" },

  { id: "VL-041", name: "Greenhouse", category: "HR and People",
    description: "Applicant tracking system for managing recruitment, candidates, and hiring workflows.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "greenhouse.io" },

  { id: "VL-042", name: "Lattice", category: "HR and People",
    description: "Performance management platform for employee reviews, goal setting, and engagement surveys.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "lattice.com" },

  // ─── MONITORING AND OBSERVABILITY ───────────────────────────────
  { id: "VL-043", name: "Datadog", category: "Monitoring and Observability",
    description: "Cloud monitoring, logging, APM, and security platform. Receives logs and metrics from production infrastructure — may contain sensitive data.",
    typical_data_access: ["PII", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "datadoghq.com" },

  { id: "VL-044", name: "PagerDuty", category: "Monitoring and Observability",
    description: "Incident management and alerting platform that notifies on-call engineers of production issues.",
    typical_data_access: ["IP"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "pagerduty.com" },

  { id: "VL-045", name: "Sentry", category: "Monitoring and Observability",
    description: "Application error tracking and performance monitoring. May capture stack traces containing user data.",
    typical_data_access: ["PII", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "sentry.io" },

  { id: "VL-046", name: "New Relic", category: "Monitoring and Observability",
    description: "Observability platform for application performance monitoring, infrastructure monitoring, and log management.",
    typical_data_access: ["PII", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "newrelic.com" },

  { id: "VL-047", name: "Splunk", category: "Monitoring and Observability",
    description: "Security information and event management platform for log aggregation, threat detection, and compliance reporting.",
    typical_data_access: ["PII", "IP", "Financial"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "splunk.com" },

  // ─── CUSTOMER SUPPORT ────────────────────────────────────────────
  { id: "VL-048", name: "Zendesk", category: "Customer Support",
    description: "Customer support platform managing tickets, live chat, and customer communications. Stores customer PII and support history.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "zendesk.com" },

  { id: "VL-049", name: "Intercom", category: "Customer Support",
    description: "Customer messaging platform for live chat, product tours, and support. Stores customer conversations and PII.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "intercom.com" },

  { id: "VL-050", name: "Freshdesk", category: "Customer Support",
    description: "Cloud-based customer support software for ticketing, knowledge base, and multi-channel support.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "freshdesk.com" },

  // ─── EMAIL AND MARKETING ─────────────────────────────────────────
  { id: "VL-051", name: "Mailchimp", category: "Email Marketing",
    description: "Email marketing platform for managing subscriber lists, campaigns, and automations. Stores customer email addresses and engagement data.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "mailchimp.com" },

  { id: "VL-052", name: "SendGrid", category: "Email Marketing",
    description: "Transactional and marketing email delivery service. Sends emails on behalf of the company to customers.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "sendgrid.com" },

  { id: "VL-053", name: "Postmark", category: "Email Marketing",
    description: "Transactional email delivery service focused on reliability and deliverability for application emails.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "postmarkapp.com" },

  { id: "VL-054", name: "Klaviyo", category: "Email Marketing",
    description: "Email and SMS marketing platform for e-commerce and direct-to-consumer brands.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "klaviyo.com" },

  // ─── ANALYTICS ──────────────────────────────────────────────────
  { id: "VL-055", name: "Google Analytics", category: "Analytics",
    description: "Web analytics platform tracking user behaviour, traffic sources, and conversion data. Subject to GDPR scrutiny.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "analytics.google.com" },

  { id: "VL-056", name: "Mixpanel", category: "Analytics",
    description: "Product analytics platform tracking user events, funnels, and retention within applications.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "mixpanel.com" },

  { id: "VL-057", name: "Amplitude", category: "Analytics",
    description: "Digital analytics platform for understanding user behaviour, product usage, and growth metrics.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "amplitude.com" },

  { id: "VL-058", name: "Segment", category: "Analytics",
    description: "Customer data platform that collects, unifies, and routes user data to analytics and marketing tools.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "segment.com" },

  // ─── SECURITY TOOLING ────────────────────────────────────────────
  { id: "VL-059", name: "CrowdStrike", category: "Security Tooling",
    description: "Endpoint detection and response platform providing antivirus, threat hunting, and device security monitoring.",
    typical_data_access: ["IP", "Credentials"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "crowdstrike.com" },

  { id: "VL-060", name: "Qualys", category: "Security Tooling",
    description: "Cloud-based vulnerability management, compliance monitoring, and web application scanning platform.",
    typical_data_access: ["IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "qualys.com" },

  { id: "VL-061", name: "Tenable", category: "Security Tooling",
    description: "Vulnerability management platform for scanning infrastructure, cloud environments, and applications.",
    typical_data_access: ["IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "tenable.com" },

  { id: "VL-062", name: "HackerOne", category: "Security Tooling",
    description: "Bug bounty and vulnerability disclosure platform connecting companies with security researchers.",
    typical_data_access: ["IP"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "hackerone.com" },

  // ─── DATA AND DATABASES ──────────────────────────────────────────
  { id: "VL-063", name: "Snowflake", category: "Data and Analytics",
    description: "Cloud data warehouse platform for storing, processing, and analysing large datasets.",
    typical_data_access: ["PII", "Financial", "PHI"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "snowflake.com" },

  { id: "VL-064", name: "Databricks", category: "Data and Analytics",
    description: "Unified analytics platform for big data processing and machine learning workloads.",
    typical_data_access: ["PII", "Financial", "IP"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "databricks.com" },

  { id: "VL-065", name: "MongoDB Atlas", category: "Data and Analytics",
    description: "Managed cloud database service for MongoDB. Stores application data in document format.",
    typical_data_access: ["PII", "Financial", "PHI"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "mongodb.com/atlas" },

  { id: "VL-066", name: "PlanetScale", category: "Data and Analytics",
    description: "Serverless MySQL-compatible database platform for scaling application databases.",
    typical_data_access: ["PII", "Financial"], default_tier: "Critical",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "planetscale.com" },

  { id: "VL-067", name: "Supabase", category: "Data and Analytics",
    description: "Open source Firebase alternative providing database, authentication, storage, and edge functions.",
    typical_data_access: ["PII", "IP"], default_tier: "Critical",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "supabase.com" },

  // ─── DOCUMENT MANAGEMENT ────────────────────────────────────────
  { id: "VL-068", name: "DocuSign", category: "Document Management",
    description: "Electronic signature and contract management platform. Stores signed legal agreements and sensitive documents.",
    typical_data_access: ["PII", "Financial", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "docusign.com" },

  { id: "VL-069", name: "HelloSign", category: "Document Management",
    description: "Electronic signature platform for signing and managing documents online.",
    typical_data_access: ["PII", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "hellosign.com" },

  { id: "VL-070", name: "Box", category: "Document Management",
    description: "Cloud content management and file sharing platform for storing and collaborating on business documents.",
    typical_data_access: ["PII", "Financial", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "box.com" },

  { id: "VL-071", name: "Dropbox", category: "Document Management",
    description: "Cloud file storage and sharing platform used for storing and syncing business files.",
    typical_data_access: ["PII", "IP", "Financial"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "dropbox.com" },

  // ─── COMMUNICATION APIS ──────────────────────────────────────────
  { id: "VL-072", name: "Twilio", category: "Communication APIs",
    description: "Cloud communications platform for SMS, voice, video, and email APIs. Processes customer phone numbers and messages.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "twilio.com" },

  { id: "VL-073", name: "Vonage", category: "Communication APIs",
    description: "Cloud communications APIs for voice, SMS, and video. Used for customer-facing communication features.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "vonage.com" },

  { id: "VL-074", name: "Fastly", category: "Cloud Infrastructure",
    description: "Edge cloud platform providing CDN, DDoS mitigation, and edge computing for high-traffic applications.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "fastly.com" },

  // ─── ENDPOINT MANAGEMENT ─────────────────────────────────────────
  { id: "VL-075", name: "Jamf", category: "Endpoint Management",
    description: "Apple device management platform for managing and securing MacOS and iOS devices across the company.",
    typical_data_access: ["PII", "Credentials"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "jamf.com" },

  { id: "VL-076", name: "Microsoft Intune", category: "Endpoint Management",
    description: "Cloud-based mobile device and application management platform for managing Windows, MacOS, iOS, and Android devices.",
    typical_data_access: ["PII", "Credentials"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "microsoft.com/intune" },

  { id: "VL-077", name: "Kandji", category: "Endpoint Management",
    description: "Apple device management and security platform with automated compliance enforcement.",
    typical_data_access: ["PII", "Credentials"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "kandji.io" },

  // ─── LEGAL AND COMPLIANCE ────────────────────────────────────────
  { id: "VL-078", name: "Ironclad", category: "Legal and Compliance",
    description: "Contract lifecycle management platform for creating, negotiating, and managing legal agreements.",
    typical_data_access: ["PII", "Financial", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "ironcladapp.com" },

  { id: "VL-079", name: "Vanta", category: "Legal and Compliance",
    description: "Automated compliance and security monitoring platform for SOC 2, ISO 27001, and HIPAA.",
    typical_data_access: ["IP", "PII", "Credentials"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "vanta.com" },

  { id: "VL-080", name: "OneTrust", category: "Legal and Compliance",
    description: "Privacy, security, and data governance platform for GDPR, CCPA, and consent management.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "onetrust.com" },

  // ─── AI SERVICES ────────────────────────────────────────────────
  { id: "VL-081", name: "OpenAI", category: "AI Services",
    description: "AI platform providing language models via API. Data sent to OpenAI may be used for training unless opted out. Careful handling required for sensitive data.",
    typical_data_access: ["PII", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "openai.com" },

  { id: "VL-082", name: "Hugging Face", category: "AI Services",
    description: "AI model hosting and deployment platform for machine learning models and datasets.",
    typical_data_access: ["IP"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "huggingface.co" },

  // ─── BACKGROUND CHECKS ──────────────────────────────────────────
  { id: "VL-083", name: "Checkr", category: "HR and People",
    description: "Background check platform for verifying employee identity, criminal history, and employment history.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "checkr.com" },

  { id: "VL-084", name: "Sterling", category: "HR and People",
    description: "Employment background screening and identity verification services.",
    typical_data_access: ["PII"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "sterlingcheck.com" },

  // ─── SECURITY TRAINING ──────────────────────────────────────────
  { id: "VL-085", name: "KnowBe4", category: "Security Training",
    description: "Security awareness training and phishing simulation platform for employee education.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "knowbe4.com" },

  { id: "VL-086", name: "Proofpoint Security Awareness", category: "Security Training",
    description: "Security awareness training platform with phishing simulations and compliance training modules.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "proofpoint.com" },

  // ─── PENETRATION TESTING ────────────────────────────────────────
  { id: "VL-087", name: "Cobalt", category: "Security Testing",
    description: "Penetration testing as a service platform connecting companies with vetted security researchers.",
    typical_data_access: ["IP"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "cobalt.io" },

  { id: "VL-088", name: "Synack", category: "Security Testing",
    description: "Managed crowdsourced security testing platform for continuous penetration testing.",
    typical_data_access: ["IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "synack.com" },

  // ─── IT SERVICE MANAGEMENT ──────────────────────────────────────
  { id: "VL-089", name: "ServiceNow", category: "IT Service Management",
    description: "Enterprise IT service management platform for incident management, change management, and CMDB.",
    typical_data_access: ["PII", "IP"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "servicenow.com" },

  { id: "VL-090", name: "Freshservice", category: "IT Service Management",
    description: "IT service management tool for helpdesk, asset tracking, and change management.",
    typical_data_access: ["PII", "IP"], default_tier: "Medium",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "freshservice.com" },

  // ─── DESIGN AND PRODUCT ─────────────────────────────────────────
  { id: "VL-091", name: "Figma", category: "Design and Product",
    description: "Collaborative design and prototyping platform. May contain UI designs showing product features and unreleased functionality.",
    typical_data_access: ["IP"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "figma.com" },

  { id: "VL-092", name: "Miro", category: "Design and Product",
    description: "Online collaborative whiteboard platform used for product planning, workshops, and visual collaboration.",
    typical_data_access: ["IP"], default_tier: "Low",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "miro.com" },

  // ─── DEVOPS ─────────────────────────────────────────────────────
  { id: "VL-093", name: "Docker Hub", category: "DevOps",
    description: "Container image registry for storing and distributing Docker container images.",
    typical_data_access: ["IP"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "hub.docker.com" },

  { id: "VL-094", name: "HashiCorp Vault", category: "Security Tooling",
    description: "Secrets management and data encryption platform for managing credentials, certificates, and sensitive configuration.",
    typical_data_access: ["Credentials", "IP"], default_tier: "Critical",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "vaultproject.io" },

  { id: "VL-095", name: "Terraform Cloud", category: "DevOps",
    description: "Infrastructure as code platform for managing and provisioning cloud infrastructure. Contains infrastructure configuration and state.",
    typical_data_access: ["IP", "Credentials"], default_tier: "High",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "terraform.io" },

  // ─── SURVEY AND FEEDBACK ────────────────────────────────────────
  { id: "VL-096", name: "Typeform", category: "Survey and Feedback",
    description: "Online form and survey platform. May collect customer PII through intake and feedback forms.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "typeform.com" },

  { id: "VL-097", name: "SurveyMonkey", category: "Survey and Feedback",
    description: "Survey platform for collecting employee and customer feedback. Stores survey responses and PII.",
    typical_data_access: ["PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "surveymonkey.com" },

  // ─── SCHEDULING ─────────────────────────────────────────────────
  { id: "VL-098", name: "Calendly", category: "Scheduling",
    description: "Meeting scheduling platform that accesses calendar data and collects contact information from meeting invitees.",
    typical_data_access: ["PII"], default_tier: "Low",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "calendly.com" },

  // ─── EXPENSE MANAGEMENT ─────────────────────────────────────────
  { id: "VL-099", name: "Expensify", category: "Finance and Accounting",
    description: "Expense management and reporting platform for tracking employee expenses and receipts.",
    typical_data_access: ["Financial", "PII"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "expensify.com" },

  { id: "VL-100", name: "Deel", category: "HR and People",
    description: "Global payroll and contractor management platform for hiring and paying international employees and contractors.",
    typical_data_access: ["PII", "Financial"], default_tier: "High",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    dpa_available: true, shared_responsibility: false, website: "deel.com" },

  // ─── ADDITIONAL ─────────────────────────────────────────────────
  { id: "VL-101", name: "Airtable", category: "Collaboration",
    description: "Low-code database and collaboration platform used for tracking data, projects, and workflows. Often holds operational data including customer records.",
    typical_data_access: ["PII", "IP"], default_tier: "Medium",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "airtable.com" },

  { id: "VL-102", name: "Loom", category: "Communication",
    description: "Async video messaging platform for recording and sharing screen and camera recordings internally and with customers.",
    typical_data_access: ["IP"], default_tier: "Low",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "loom.com" },

  { id: "VL-103", name: "Webflow", category: "Cloud Infrastructure",
    description: "No-code website builder and CMS platform. Used for marketing sites and landing pages.",
    typical_data_access: ["PII"], default_tier: "Low",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "webflow.com" },

  { id: "VL-104", name: "Chargebee", category: "Payments",
    description: "Subscription billing and revenue management platform for SaaS businesses.",
    typical_data_access: ["PCI", "PII", "Financial"], default_tier: "Critical",
    certifications: ["SOC 2 Type II", "PCI DSS"],
    dpa_available: true, shared_responsibility: false, website: "chargebee.com" },

  { id: "VL-105", name: "Plaid", category: "Payments",
    description: "Financial data network connecting applications to bank accounts for account verification and payment initiation.",
    typical_data_access: ["Financial", "PII"], default_tier: "Critical",
    certifications: ["SOC 2 Type II"],
    dpa_available: true, shared_responsibility: false, website: "plaid.com" }
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function vlNorm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function vlGetCustom() {
  try { return JSON.parse(localStorage.getItem("db_agent_custom_vendors") || "[]"); }
  catch (_) { return []; }
}

function vlSaveCustom(vendor) {
  const customs = vlGetCustom();
  const norm = vlNorm(vendor.name);
  if (!customs.find(v => vlNorm(v.name) === norm)) {
    const entry = Object.assign({}, vendor, {
      custom: true,
      id: "CUSTOM-" + Date.now(),
      added_at: new Date().toISOString()
    });
    customs.push(entry);
    localStorage.setItem("db_agent_custom_vendors", JSON.stringify(customs));
    return entry;
  }
  return customs.find(v => vlNorm(v.name) === norm);
}

function vlGetAll() {
  return [...VL_LIBRARY, ...vlGetCustom()];
}

function vlSearch(query, limit) {
  limit = limit || 30;
  const q = vlNorm(query);
  if (!q) return [];
  const all = vlGetAll();
  const results = [];
  // Exact name match first
  for (const v of all) {
    if (vlNorm(v.name) === q) { results.push({ v, score: 0 }); continue; }
    if (vlNorm(v.name).startsWith(q)) { results.push({ v, score: 1 }); continue; }
    if (vlNorm(v.name).includes(q)) { results.push({ v, score: 2 }); continue; }
    if (vlNorm(v.category || "").includes(q)) { results.push({ v, score: 3 }); continue; }
    if (vlNorm(v.description || "").includes(q)) { results.push({ v, score: 4 }); }
  }
  results.sort((a, b) => a.score - b.score);
  return results.map(r => r.v).slice(0, limit);
}

function vlGetPopular() {
  return VL_POPULAR_IDS.map(id => VL_LIBRARY.find(v => v.id === id)).filter(Boolean);
}

function vlFindByName(name) {
  const q = vlNorm(name);
  return vlGetAll().find(v => vlNorm(v.name) === q) || null;
}

function vlCount() {
  return VL_LIBRARY.length;
}
