/* ============ Desi Resume — app logic ============
   Free ATS-friendly resume builder. All data stays in localStorage.
*/
"use strict";

const LS_KEY = "desiResume.v1";
const ACTION_VERBS = [
  "built", "developed", "designed", "led", "managed", "created", "launched",
  "improved", "increased", "reduced", "automated", "delivered", "owned",
  "shipped", "optimized", "grew", "drove", "implemented", "founded", "organized",
];
const FONTS = {
  classic: `Georgia, "Times New Roman", serif`,
  modern: `"Inter", "Segoe UI", system-ui, sans-serif`,
  elegant: `"Palatino Linotype", "Book Antiqua", Palatino, serif`,
  compact: `"Helvetica Neue", Arial, sans-serif`,
};
const SKILL_BANK = [
  "python", "javascript", "typescript", "java", "c++", "sql", "excel", "power bi",
  "tableau", "html", "css", "react", "node.js", "nodejs", "git", "github",
  "financial modeling", "data analysis", "machine learning", "ai", "communication",
  "leadership", "marketing", "seo", "content writing", "photoshop", "figma",
  "ms office", "powerpoint", "accounting", "tally", "statistics", "r programming",
];

let store = { accent: "#1a56db", font: "classic", watermark: { data: "", opacity: 12, enabled: false } };

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function loadStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) store = Object.assign(store, JSON.parse(raw));
  } catch (e) {}
}
function saveStore() {
  try {
    // persist form snapshot
    store.form = readForm();
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch (e) {}
}

/* ---------- dynamic entries ---------- */
const ENTRY_DEFS = {
  exp: {
    list: "exp-list", title: "Experience",
    fields: [
      ["role", "Job title *", "e.g. Marketing Intern"],
      ["company", "Company *", "e.g. Acme Pvt Ltd"],
      ["location", "Location", "e.g. Chandigarh"],
      ["start", "Start", "e.g. Jun 2024"],
      ["end", "End (or 'Present')", "e.g. Present"],
      ["bullets", "Achievements (one per line)", "Increased Instagram engagement by 40%\nBuilt weekly report automation in Excel", "textarea"],
    ],
  },
  proj: {
    list: "proj-list", title: "Project",
    fields: [
      ["name", "Project name *", "e.g. Desi Invoice"],
      ["tech", "Tech / tools", "e.g. JavaScript, HTML, CSS"],
      ["link", "Link", "e.g. github.com/you/repo"],
      ["bullets", "What it does (one per line)", "Free GST invoice generator for freelancers\n500+ lines of vanilla JS", "textarea"],
    ],
  },
  edu: {
    list: "edu-list", title: "Education",
    fields: [
      ["degree", "Degree *", "e.g. BBA FinTech & AI"],
      ["school", "Institution *", "e.g. Chandigarh University"],
      ["year", "Year", "e.g. 2024 – 2027"],
      ["details", "Details", "e.g. CGPA 8.5, Finance Club lead"],
    ],
  },
  cert: {
    list: "cert-list", title: "Certification",
    fields: [
      ["name", "Name *", "e.g. Google Data Analytics"],
      ["issuer", "Issuer & year", "e.g. Coursera, 2025"],
    ],
  },
};

function addEntry(kind, data) {
  data = data || {};
  const def = ENTRY_DEFS[kind];
  const box = document.createElement("div");
  box.className = "entry";
  box.dataset.kind = kind;
  let inner = `<button class="entry-del" title="Remove">×</button><h4>${def.title}</h4>`;
  def.fields.forEach(([key, label, ph, type]) => {
    const val = esc(data[key] || "");
    inner += type === "textarea"
      ? `<label>${label}<textarea data-k="${key}" rows="3" placeholder="${esc(ph)}">${val}</textarea></label>`
      : `<label>${label}<input data-k="${key}" placeholder="${esc(ph)}" value="${val}" /></label>`;
  });
  box.innerHTML = inner;
  box.querySelector(".entry-del").addEventListener("click", () => { box.remove(); refresh(); });
  box.querySelectorAll("input,textarea").forEach((el) => el.addEventListener("input", refresh));
  $(def.list).appendChild(box);
}

function readEntries(kind) {
  const out = [];
  document.querySelectorAll(`#${ENTRY_DEFS[kind].list} .entry`).forEach((box) => {
    const obj = {};
    box.querySelectorAll("[data-k]").forEach((el) => { obj[el.dataset.k] = el.value.trim(); });
    out.push(obj);
  });
  return out;
}

/* ---------- form ---------- */
function readForm() {
  const v = (id) => $(id).value.trim();
  return {
    name: v("p-name"), title: v("p-title"), email: v("p-email"), phone: v("p-phone"),
    location: v("p-location"), linkedin: v("p-linkedin"), github: v("p-github"),
    portfolio: v("p-portfolio"), summary: v("p-summary"), skills: v("p-skills"),
    exp: readEntries("exp"), proj: readEntries("proj"),
    edu: readEntries("edu"), cert: readEntries("cert"),
    accent: store.accent, font: store.font, watermark: store.watermark,
  };
}

function bulletsHTML(text) {
  const lines = String(text || "").split("\n").map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return "";
  return "<ul>" + lines.map((l) => `<li>${esc(l)}</li>`).join("") + "</ul>";
}

/* ---------- preview ---------- */
function renderPreview() {
  const f = readForm();
  document.documentElement.style.setProperty("--resume-accent", f.accent);
  document.documentElement.style.setProperty("--resume-font", FONTS[f.font] || FONTS.classic);

  const wm = store.watermark;
  const wmHTML = (wm.enabled && wm.data)
    ? `<div class="wm-layer"><img src="${wm.data}" alt="" /></div>`
    : "";
  document.documentElement.style.setProperty("--wm-opacity", (wm.opacity / 100).toFixed(2));

  const contact = [f.email, f.phone, f.location, f.linkedin, f.github, f.portfolio]
    .filter(Boolean).map(esc).join(" &nbsp;•&nbsp; ");

  const exp = f.exp.filter((e) => e.role || e.company).map((e) => `
    <div class="r-item">
      <div class="r-item-head"><b>${esc(e.role) || "—"}</b><span class="r-date">${esc(e.start)}${e.start || e.end ? " – " : ""}${esc(e.end)}</span></div>
      <div class="r-item-sub">${esc(e.company)}${e.location ? " — " + esc(e.location) : ""}</div>
      ${bulletsHTML(e.bullets)}
    </div>`).join("");

  const proj = f.proj.filter((p) => p.name).map((p) => `
    <div class="r-item">
      <div class="r-item-head"><b>${esc(p.name)}</b>${p.link ? `<span class="r-date">${esc(p.link)}</span>` : ""}</div>
      ${p.tech ? `<div class="r-item-sub">${esc(p.tech)}</div>` : ""}
      ${bulletsHTML(p.bullets)}
    </div>`).join("");

  const edu = f.edu.filter((e) => e.degree || e.school).map((e) => `
    <div class="r-item">
      <div class="r-item-head"><b>${esc(e.degree) || "—"}</b><span class="r-date">${esc(e.year)}</span></div>
      <div class="r-item-sub">${esc(e.school)}</div>
      ${e.details ? `<div>${esc(e.details)}</div>` : ""}
    </div>`).join("");

  const cert = f.cert.filter((c) => c.name).map((c) =>
    `<div class="r-item"><b>${esc(c.name)}</b>${c.issuer ? ` — <span class="r-item-sub">${esc(c.issuer)}</span>` : ""}</div>`).join("");

  const skills = f.skills.split(",").map((s) => s.trim()).filter(Boolean);

  $("resume-preview").innerHTML = `
    ${wmHTML}
    <div class="r-name">${esc(f.name) || "Your Name"}</div>
    ${f.title ? `<div class="r-title">${esc(f.title)}</div>` : ""}
    <div class="r-contact">${contact || "email • phone • location"}</div>
    ${f.summary ? `<div class="r-section"><h3>Summary</h3><div>${esc(f.summary)}</div></div>` : ""}
    ${exp ? `<div class="r-section"><h3>Experience</h3>${exp}</div>` : ""}
    ${proj ? `<div class="r-section"><h3>Projects</h3>${proj}</div>` : ""}
    ${edu ? `<div class="r-section"><h3>Education</h3>${edu}</div>` : ""}
    ${skills.length ? `<div class="r-section"><h3>Skills</h3><div class="r-skills">${skills.map(esc).join(" &nbsp;•&nbsp; ")}</div></div>` : ""}
    ${cert ? `<div class="r-section"><h3>Certifications</h3>${cert}</div>` : ""}
  `;
  $("print-area").innerHTML = `<div class="resume-sheet">${$("resume-preview").innerHTML}</div>`;
  renderATS(f);
}

/* ---------- ATS checklist ---------- */
function renderATS(f) {
  const checks = [];
  const allText = [f.summary, ...f.exp.flatMap((e) => [e.role, e.company, e.bullets]),
    ...f.proj.flatMap((p) => [p.name, p.bullets]), f.skills].join("\n").toLowerCase();

  checks.push({
    label: "Contact info complete (email + phone) — recruiters need both",
    pass: !!(f.email && f.phone),
  });
  checks.push({
    label: "Professional summary present (50+ characters)",
    pass: f.summary.length >= 50,
  });
  const skillCount = f.skills.split(",").map((s) => s.trim()).filter(Boolean).length;
  checks.push({
    label: `Skills section has ${skillCount} skill${skillCount === 1 ? "" : "s"} (aim for 8+)`,
    pass: skillCount >= 8,
  });
  checks.push({
    label: "Quantified achievements — numbers like 40%, ₹50K, 5+ prove impact",
    pass: /\d/.test(allText) && allText.length > 200,
  });
  checks.push({
    label: "Strong action verbs (built, led, improved…) — not just 'responsible for'",
    pass: ACTION_VERBS.some((v) => allText.includes(v)),
  });
  checks.push({
    label: "Experience or projects section filled — empty sections get skipped",
    pass: f.exp.some((e) => e.role) || f.proj.some((p) => p.name),
  });

  const passed = checks.filter((c) => c.pass).length;
  $("ats-list").innerHTML = checks.map((c) =>
    `<li class="${c.pass ? "pass" : "fail"}">${esc(c.label)}</li>`).join("") +
    `<div class="ats-score">ATS readiness: <b>${passed}/${checks.length}</b></div>`;
}

/* ---------- smart autofill (local parser, no server) ---------- */
function smartAutofill() {
  const text = $("autofill-text").value;
  const found = [];
  const setIfEmpty = (id, val, label) => {
    if (val && !$(id).value.trim()) { $(id).value = val; found.push(label); }
  };

  const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0];
  setIfEmpty("p-email", email, "email");

  const phone = (text.match(/(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/) || [])[0];
  setIfEmpty("p-phone", phone, "phone");

  const li = (text.match(/linkedin\.com\/in\/[\w-]+/i) || [])[0];
  setIfEmpty("p-linkedin", li, "LinkedIn");

  const gh = (text.match(/github\.com\/[\w-]+/i) || [])[0];
  setIfEmpty("p-github", gh, "GitHub");

  // name: first line that looks like a 2-3 word person name
  const firstLine = (text.split("\n").map((s) => s.trim()).find(Boolean) || "");
  if (/^[A-Z][a-z]+(\s[A-Z][a-z]+){1,2}$/.test(firstLine)) {
    setIfEmpty("p-name", firstLine, "name");
  }

  // skills: match against known skill bank (drop substrings of longer matches, e.g. "java" inside "javascript")
  const low = text.toLowerCase();
  let hits = SKILL_BANK.filter((s) => low.includes(s));
  hits = hits.filter((s) => !hits.some((o) => o !== s && o.includes(s)));
  if (hits.length) {
    const pretty = hits.map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase()));
    const cur = $("p-skills").value.trim();
    $("p-skills").value = cur ? cur : pretty.join(", ");
    if (!cur) found.push(hits.length + " skills");
  }

  // summary: first 2 sentences if summary empty
  if (!$("p-summary").value.trim()) {
    const sentences = text.replace(/\n+/g, " ").match(/[^.!?]+[.!?]/g) || [];
    const summary = sentences.slice(0, 2).join(" ").trim().slice(0, 400);
    if (summary.length > 40) { $("p-summary").value = summary; found.push("summary"); }
  }

  const msg = found.length
    ? "✨ Detected & filled: " + found.join(", ") + ". Review karke adjust kar lena!"
    : "Kuch detect nahi hua — text me email/phone/name jaisi details add karke retry kar.";
  $("autofill-result").textContent = msg;
  refresh();
}

/* ---------- actions ---------- */
function refresh() { renderPreview(); saveStore(); }

function newResume() {
  if (!confirm("Start a fresh resume? Current content stays saved in this browser.")) return;
  ["p-name", "p-title", "p-email", "p-phone", "p-location", "p-linkedin",
   "p-github", "p-portfolio", "p-summary", "p-skills"].forEach((id) => { $(id).value = ""; });
  ["exp", "proj", "edu", "cert"].forEach((k) => { $(ENTRY_DEFS[k].list).innerHTML = ""; });
  addEntry("exp"); addEntry("edu");
  refresh();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function restore() {
  const f = store.form;
  if (!f) return;
  const set = (id, v) => { if (v != null) $(id).value = v; };
  set("p-name", f.name); set("p-title", f.title); set("p-email", f.email);
  set("p-phone", f.phone); set("p-location", f.location); set("p-linkedin", f.linkedin);
  set("p-github", f.github); set("p-portfolio", f.portfolio);
  set("p-summary", f.summary); set("p-skills", f.skills);
  store.accent = f.accent || "#1a56db";
  store.font = f.font || "classic";
  if (f.watermark) store.watermark = Object.assign({ data: "", opacity: 12, enabled: false }, f.watermark);
  ["exp", "proj", "edu", "cert"].forEach((k) => {
    $(ENTRY_DEFS[k].list).innerHTML = "";
    const items = (f[k] && f[k].length ? f[k] : [{}]);
    items.forEach((it) => addEntry(k, it));
  });
  document.querySelectorAll(".swatch").forEach((s) =>
    s.classList.toggle("active", s.dataset.color === store.accent));
  document.querySelectorAll(".font-pill").forEach((p) =>
    p.classList.toggle("active", p.dataset.font === store.font));
  $("wm-enabled").checked = !!store.watermark.enabled;
  $("wm-opacity").value = store.watermark.opacity;
  $("wm-opacity-val").textContent = store.watermark.opacity + "%";
}

/* ---------- init ---------- */
function init() {
  loadStore();

  document.querySelectorAll("[data-add]").forEach((btn) =>
    btn.addEventListener("click", () => { addEntry(btn.dataset.add); refresh(); }));

  document.querySelectorAll(".swatch").forEach((s) =>
    s.addEventListener("click", () => {
      store.accent = s.dataset.color;
      document.querySelectorAll(".swatch").forEach((x) => x.classList.remove("active"));
      s.classList.add("active");
      refresh();
    }));

  document.querySelectorAll(".font-pill").forEach((p) =>
    p.addEventListener("click", () => {
      store.font = p.dataset.font;
      document.querySelectorAll(".font-pill").forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      refresh();
    }));

  // watermark controls
  $("wm-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 500 * 1024) { alert("Watermark image should be under 500KB."); return; }
    const r = new FileReader();
    r.onload = () => {
      store.watermark.data = r.result;
      store.watermark.enabled = true;
      $("wm-enabled").checked = true;
      refresh();
    };
    r.readAsDataURL(f);
  });
  $("wm-opacity").addEventListener("input", (e) => {
    store.watermark.opacity = Number(e.target.value);
    $("wm-opacity-val").textContent = e.target.value + "%";
    refresh();
  });
  $("wm-enabled").addEventListener("change", (e) => {
    store.watermark.enabled = e.target.checked;
    refresh();
  });
  $("btn-wm-clear").addEventListener("click", () => {
    store.watermark = { data: "", opacity: 12, enabled: false };
    $("wm-file").value = ""; $("wm-enabled").checked = false;
    $("wm-opacity").value = 12; $("wm-opacity-val").textContent = "12%";
    refresh();
  });

  $("btn-autofill").addEventListener("click", smartAutofill);

  ["p-name", "p-title", "p-email", "p-phone", "p-location", "p-linkedin",
   "p-github", "p-portfolio", "p-summary", "p-skills"].forEach((id) =>
    $(id).addEventListener("input", refresh));

  $("btn-new").addEventListener("click", newResume);
  $("btn-print").addEventListener("click", () => window.print());

  if (store.form) restore();
  else { addEntry("exp"); addEntry("proj"); addEntry("edu"); }

  document.querySelector(`.swatch[data-color="${store.accent}"]`)?.classList.add("active");
  refresh();
}

document.addEventListener("DOMContentLoaded", init);
