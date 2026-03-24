"use strict";

// ─── State ────────────────────────────────────────────────────────────────────
let _vpOnSelect = null;
let _vpContainer = null;
let _vpSourceInput = null;
let _vpCustomName = "";

// ─── Tier colours ─────────────────────────────────────────────────────────────
const VP_TIER_CLASS = {
  Critical: "vp-tier-critical",
  High:     "vp-tier-high",
  Medium:   "vp-tier-medium",
  Low:      "vp-tier-low"
};

const VP_TAG_CLASS = {
  PII:         "vp-tag-pii",
  PHI:         "vp-tag-phi",
  PCI:         "vp-tag-pci",
  Financial:   "vp-tag-financial",
  IP:          "vp-tag-ip",
  Credentials: "vp-tag-cred"
};

// ─── Open / Close ─────────────────────────────────────────────────────────────
function vpOpen(sourceInput, container, initialQuery, onSelect) {
  _vpOnSelect    = onSelect;
  _vpContainer   = container;
  _vpSourceInput = sourceInput;
  _vpCustomName  = "";

  // Remove any stale panel
  vpClose(false);

  const overlay = document.createElement("div");
  overlay.id = "vp-overlay";
  overlay.className = "vp-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Select a vendor");
  overlay.innerHTML = _vpBuildShell();
  document.body.appendChild(overlay);

  // Bind close button
  overlay.querySelector(".vp-close-btn").addEventListener("click", () => vpClose());

  // Keyboard close
  overlay.addEventListener("keydown", e => { if (e.key === "Escape") vpClose(); });

  // Click outside modal body
  overlay.addEventListener("click", e => { if (e.target === overlay) vpClose(); });

  // Search input
  const searchEl = overlay.querySelector(".vp-search-input");
  const query = initialQuery || "";
  searchEl.value = query;
  setTimeout(() => searchEl.focus(), 50);

  if (query) {
    _vpShowResults(overlay, query);
  } else {
    _vpShowPopular(overlay);
  }

  searchEl.addEventListener("input", () => {
    const q = searchEl.value.trim();
    if (q.length >= 1) {
      _vpShowResults(overlay, q);
    } else {
      _vpShowPopular(overlay);
    }
  });

  // Allow active overlay to be closed from elsewhere
  requestAnimationFrame(() => overlay.classList.add("vp-overlay-visible"));
}

function vpClose(restoreFocus) {
  if (restoreFocus !== false && _vpSourceInput) {
    try { _vpSourceInput.focus(); } catch (_) {}
  }
  const el = document.getElementById("vp-overlay");
  if (el) el.remove();
}

// ─── Shell HTML ───────────────────────────────────────────────────────────────
function _vpBuildShell() {
  const total = typeof vlCount === "function" ? vlCount() : 105;
  return `
  <div class="vp-modal" role="document">
    <div class="vp-modal-head">
      <div>
        <p class="section-label">Vendor Library</p>
        <h3 class="vp-modal-title">Select a vendor</h3>
      </div>
      <button class="vp-close-btn" aria-label="Close vendor picker" type="button">&#x2715;</button>
    </div>
    <div class="vp-search-bar">
      <span class="vp-search-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </span>
      <input class="vp-search-input" type="text" placeholder="Search ${total} vendors..." autocomplete="new-password" spellcheck="false" name="vp-search-${Date.now()}" />
    </div>
    <div class="vp-body" id="vp-body">
      <div id="vp-popular-section"></div>
      <div id="vp-results-section" class="hidden"></div>
      <div id="vp-notfound-section" class="hidden"></div>
    </div>
  </div>`;
}

// ─── Popular view ─────────────────────────────────────────────────────────────
function _vpShowPopular(overlay) {
  const popularEl   = overlay.querySelector("#vp-popular-section");
  const resultsEl   = overlay.querySelector("#vp-results-section");
  const notFoundEl  = overlay.querySelector("#vp-notfound-section");

  resultsEl.classList.add("hidden");
  notFoundEl.classList.add("hidden");
  popularEl.classList.remove("hidden");

  if (popularEl.dataset.built) return;
  popularEl.dataset.built = "1";

  const popular = typeof vlGetPopular === "function" ? vlGetPopular() : [];
  const customs = typeof vlGetCustom === "function" ? vlGetCustom() : [];

  let html = `<p class="vp-section-label">Popular vendors</p><div class="vp-chips">`;
  popular.forEach(v => {
    html += `<button class="vp-chip" type="button" data-vp-id="${v.id}">${v.name}</button>`;
  });
  html += `</div>`;

  if (customs.length > 0) {
    html += `<p class="vp-section-label vp-section-label-mt">Your custom vendors</p><div class="vp-chips">`;
    customs.forEach(v => {
      html += `<button class="vp-chip vp-chip-custom" type="button" data-vp-id="${v.id}">${v.name} <span class="vp-custom-inline-badge">CUSTOM</span></button>`;
    });
    html += `</div>`;
  }

  popularEl.innerHTML = html;

  popularEl.querySelectorAll(".vp-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.vpId;
      const vendor = (typeof vlGetAll === "function" ? vlGetAll() : []).find(v => v.id === id);
      if (vendor) _vpHandleSelect(vendor);
    });
  });
}

// ─── Results view ─────────────────────────────────────────────────────────────
function _vpShowResults(overlay, query) {
  const popularEl   = overlay.querySelector("#vp-popular-section");
  const resultsEl   = overlay.querySelector("#vp-results-section");
  const notFoundEl  = overlay.querySelector("#vp-notfound-section");

  popularEl.classList.add("hidden");

  const results = typeof vlSearch === "function" ? vlSearch(query, 20) : [];

  if (results.length === 0) {
    resultsEl.classList.add("hidden");
    notFoundEl.classList.remove("hidden");
    _vpBuildNotFound(notFoundEl, query, overlay);
  } else {
    notFoundEl.classList.add("hidden");
    resultsEl.classList.remove("hidden");
    _vpBuildResultsList(resultsEl, results, query);
  }
}

function _vpBuildResultsList(container, vendors, query) {
  let html = `<p class="vp-section-label">${vendors.length} result${vendors.length !== 1 ? "s" : ""} for &ldquo;${_escHtml(query)}&rdquo;</p><div class="vp-results-list">`;
  vendors.forEach(v => {
    html += _vpVendorCardHtml(v);
  });
  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll(".vp-select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.vpId;
      const vendor = (typeof vlGetAll === "function" ? vlGetAll() : []).find(v => v.id === id);
      if (vendor) _vpHandleSelect(vendor);
    });
  });
}

function _vpVendorCardHtml(v) {
  const tierClass = VP_TIER_CLASS[v.default_tier] || "vp-tier-medium";
  const isCustom = v.custom;

  // Data access tags
  const dataTags = (v.typical_data_access || []).map(t =>
    `<span class="vp-tag ${VP_TAG_CLASS[t] || ""}">${_escHtml(t)}</span>`
  ).join("");

  // Certification tags (max 3 shown)
  const certs = (v.certifications || []).slice(0, 3).map(c =>
    `<span class="vp-cert">${_escHtml(c)}</span>`
  ).join("");

  const dpa = v.dpa_available
    ? `<span class="vp-dpa-pill vp-dpa-yes">DPA available</span>`
    : `<span class="vp-dpa-pill vp-dpa-no">No DPA</span>`;

  const customBadge = isCustom ? `<span class="vp-custom-badge">CUSTOM</span>` : "";

  return `
  <div class="vp-vendor-card">
    <div class="vp-vendor-head">
      <div class="vp-vendor-name-wrap">
        <span class="vp-vendor-name">${_escHtml(v.name)}</span>
        ${customBadge}
      </div>
      <div class="vp-vendor-meta-right">
        <span class="vp-tier-badge ${tierClass}">${_escHtml(v.default_tier || "")}</span>
        <span class="vp-category-label">${_escHtml(v.category || "")}</span>
      </div>
    </div>
    <p class="vp-vendor-desc">${_escHtml(v.description || "")}</p>
    <div class="vp-vendor-tags">
      ${dataTags}
    </div>
    <div class="vp-vendor-certs">
      ${certs}
    </div>
    <div class="vp-vendor-footer">
      ${dpa}
      <button class="vp-select-btn action-button" type="button" data-vp-id="${_escHtml(v.id)}">Select vendor</button>
    </div>
  </div>`;
}

// ─── Not-found view ───────────────────────────────────────────────────────────
function _vpBuildNotFound(container, query, overlay) {
  _vpCustomName = query;
  container.innerHTML = `
  <div class="vp-notfound-body">
    <div class="vp-notfound-icon" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" opacity=".3"/>
        <path d="M20 12v9M20 25v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <p class="vp-notfound-title">&ldquo;${_escHtml(query)}&rdquo; is not in the vendor library</p>
    <p class="vp-notfound-sub">Fill in the details manually. The vendor will be saved to your library for reuse.</p>
    <button class="vp-add-custom-btn action-button" type="button">+ Add &ldquo;${_escHtml(query)}&rdquo; as a custom vendor</button>
  </div>`;

  container.querySelector(".vp-add-custom-btn").addEventListener("click", () => {
    _vpHandleCustomAdd(query, overlay);
  });
}

function _vpHandleCustomAdd(name, overlay) {
  // Switch not-found view to a mini custom form
  const notFoundEl = overlay.querySelector("#vp-notfound-section");
  notFoundEl.innerHTML = `
  <div class="vp-custom-form">
    <p class="vp-section-label">New custom vendor</p>
    <h4 class="vp-custom-form-title">${_escHtml(name)}</h4>
    <div class="field full">
      <label for="vp-cf-category">Category</label>
      <input id="vp-cf-category" class="vp-cf-input" type="text" placeholder="e.g. Analytics, Security Tooling" />
    </div>
    <div class="field full">
      <label for="vp-cf-description">What does this vendor do?</label>
      <textarea id="vp-cf-description" class="vp-cf-input" rows="3" placeholder="Describe the vendor's service in plain language."></textarea>
    </div>
    <div class="field full">
      <label for="vp-cf-tier">Default risk tier</label>
      <select id="vp-cf-tier" class="vp-cf-input">
        <option value="">Select tier</option>
        <option value="Critical">Critical</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    </div>
    <div class="field full">
      <label for="vp-cf-data">Typical data access (comma-separated)</label>
      <input id="vp-cf-data" class="vp-cf-input" type="text" placeholder="PII, Financial, IP" />
    </div>
    <div class="field full">
      <label for="vp-cf-certs">Certifications (comma-separated)</label>
      <input id="vp-cf-certs" class="vp-cf-input" type="text" placeholder="SOC 2 Type II, ISO 27001" />
    </div>
    <div class="field full">
      <label for="vp-cf-website">Website</label>
      <input id="vp-cf-website" class="vp-cf-input" type="text" placeholder="example.com" />
    </div>
    <div class="vp-custom-form-actions">
      <button class="vp-cf-cancel" type="button">Cancel</button>
      <button class="vp-cf-save action-button" type="button">Save &amp; select vendor</button>
    </div>
  </div>`;

  notFoundEl.querySelector(".vp-cf-cancel").addEventListener("click", () => vpClose());

  notFoundEl.querySelector(".vp-cf-save").addEventListener("click", () => {
    const category    = notFoundEl.querySelector("#vp-cf-category").value.trim();
    const description = notFoundEl.querySelector("#vp-cf-description").value.trim();
    const tier        = notFoundEl.querySelector("#vp-cf-tier").value;
    const dataRaw     = notFoundEl.querySelector("#vp-cf-data").value;
    const certsRaw    = notFoundEl.querySelector("#vp-cf-certs").value;
    const website     = notFoundEl.querySelector("#vp-cf-website").value.trim();

    const typical_data_access = dataRaw.split(",").map(s => s.trim()).filter(Boolean);
    const certifications       = certsRaw.split(",").map(s => s.trim()).filter(Boolean);

    const vendor = {
      name: name,
      category: category,
      description: description,
      default_tier: tier,
      typical_data_access,
      certifications,
      website,
      dpa_available: false,
      shared_responsibility: false
    };

    if (typeof vlSaveCustom === "function") {
      const saved = vlSaveCustom(vendor);
      _vpHandleSelect(saved);
    } else {
      _vpHandleSelect(vendor);
    }
  });
}

// ─── Selection handler ────────────────────────────────────────────────────────
function _vpHandleSelect(vendor) {
  vpClose(false);
  if (typeof _vpOnSelect === "function") {
    _vpOnSelect(vendor);
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function _escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
