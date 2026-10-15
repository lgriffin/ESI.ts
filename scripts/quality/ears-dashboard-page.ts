/**
 * The EARS dashboard page: one self-contained HTML file, no network, data
 * embedded as a script literal. `ears-dashboard-core.ts` builds the data;
 * this renders it. Three tabs: Overview (totals, patterns, areas, what needs
 * attention), Requirements (every Rule, searchable, with its source, what runs
 * it and its verdict) and Write a requirement (the method, with real examples
 * drawn from the specification).
 *
 * The CSS and browser script are raw strings: they hold no `${…}`, so nothing
 * from the specification reaches the page except through `embedJson`.
 */
import { DashboardData, embedJson } from './ears-dashboard-core';

const STYLE = String.raw`
:root {
  --bg: #f6f6f3; --panel: #ffffff; --ink: #1d1d1b; --muted: #5d5d58; --line: #deddd6; --accent: #2f5bd3;
  --ok: #1f7a4d; --ok-bg: #e3f3ea; --warn: #8a5a00; --warn-bg: #fbf0d9; --bad: #b42318; --bad-bg: #fde8e6;
  --code-bg: #f1f0ec; --kw: #7a3eb1; --tag: #a15c00; --comment: #7c7c75; --str: #1f7a4d;
  --p-event-driven: #2f5bd3; --p-unwanted-behaviour: #b42318; --p-state-driven: #0f7c84;
  --p-optional-feature: #8a4fbf; --p-ubiquitous: #5b6b7a; --p-complex: #a15c00;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #161615; --panel: #1f1f1d; --ink: #ecebe6; --muted: #a8a79f; --line: #34342f; --accent: #8aa8ff;
    --ok: #6fd3a0; --ok-bg: #173527; --warn: #f0c26b; --warn-bg: #3a2e14; --bad: #ff8f84; --bad-bg: #3d1a17;
    --code-bg: #262623; --kw: #c79bf2; --tag: #f0b45c; --comment: #8d8c85; --str: #6fd3a0;
    --p-event-driven: #8aa8ff; --p-unwanted-behaviour: #ff8f84; --p-state-driven: #5fd0d8;
    --p-optional-feature: #c79bf2; --p-ubiquitous: #9aaabb; --p-complex: #f0b45c;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #161615; --panel: #1f1f1d; --ink: #ecebe6; --muted: #a8a79f; --line: #34342f; --accent: #8aa8ff;
  --ok: #6fd3a0; --ok-bg: #173527; --warn: #f0c26b; --warn-bg: #3a2e14; --bad: #ff8f84; --bad-bg: #3d1a17;
  --code-bg: #262623; --kw: #c79bf2; --tag: #f0b45c; --comment: #8d8c85; --str: #6fd3a0;
  --p-event-driven: #8aa8ff; --p-unwanted-behaviour: #ff8f84; --p-state-driven: #5fd0d8;
  --p-optional-feature: #c79bf2; --p-ubiquitous: #9aaabb; --p-complex: #f0b45c;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
a { color: var(--accent); }
code, pre, .mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 13px; }
header, main { max-width: 1180px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
header { padding-top: 24px; }
header h1 { margin: 0 0 4px; font-size: 24px; display: flex; align-items: center; gap: 10px; }
header h1 img.logo { border-radius: 6px; flex: none; }
header p { margin: 0; color: var(--muted); }
header p.home { font-size: 13px; margin-bottom: 4px; }
nav { display: flex; gap: 4px; margin-top: 18px; border-bottom: 1px solid var(--line); overflow-x: auto; }
nav button { background: none; border: 0; border-bottom: 3px solid transparent; padding: 10px 14px; font: inherit; color: var(--muted); cursor: pointer; white-space: nowrap; }
nav button[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--accent); font-weight: 600; }
main { padding-top: 20px; padding-bottom: 64px; }
button:focus-visible, a:focus-visible, summary:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
section[hidden] { display: none; }
h2 { font-size: 19px; margin: 28px 0 10px; }
h2:first-child { margin-top: 4px; }
h3 { font-size: 16px; margin: 0 0 6px; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.tile { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 14px; }
.tile .n { font-size: 28px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.tile .l { color: var(--muted); font-size: 13px; }
.tile.ok .n { color: var(--ok); } .tile.bad .n { color: var(--bad); } .tile.warn .n { color: var(--warn); }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 16px; margin-bottom: 12px; }
.card > p:first-child { margin-top: 0; }
.card > p:last-child { margin-bottom: 0; }
.bars { display: grid; gap: 8px; }
.bar { display: grid; grid-template-columns: 150px 1fr 44px; align-items: center; gap: 10px; }
.bar .track { background: var(--code-bg); border-radius: 4px; height: 14px; overflow: hidden; }
.bar .fill { height: 100%; border-radius: 4px; }
.bar .v { text-align: right; font-variant-numeric: tabular-nums; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 13px; color: var(--muted); font-weight: 600; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.scroll { overflow-x: auto; }
.pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.pill.verified { background: var(--ok-bg); color: var(--ok); }
.pill.unverified, .pill.finding { background: var(--warn-bg); color: var(--warn); }
.pill.failing { background: var(--bad-bg); color: var(--bad); }
.pill.unknown, .pill.excl { background: var(--code-bg); color: var(--muted); border: 1px solid var(--line); }
.pill.change { background: var(--code-bg); color: var(--accent); border: 1px solid var(--accent); }
.pattern { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; color: var(--panel); white-space: nowrap; }
.rid { font-weight: 700; font-variant-numeric: tabular-nums; }
.controls { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; align-items: center; }
.controls input[type=search] { flex: 1 1 260px; min-width: 0; }
.controls input, .controls select, .controls button { font: inherit; padding: 7px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); color: var(--ink); max-width: 100%; }
.controls label { display: inline-flex; gap: 6px; align-items: center; color: var(--muted); }
.count { color: var(--muted); font-size: 13px; margin-bottom: 8px; }
details.feature { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; margin-bottom: 10px; }
details.feature > summary { padding: 12px 14px; cursor: pointer; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
details.feature > summary::-webkit-details-marker { display: none; }
details.feature > summary::before { content: "▸"; color: var(--muted); }
details.feature[open] > summary::before { content: "▾"; }
.fname { font-weight: 650; }
.fpath { color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
.fbody { padding: 0 14px 14px; }
.desc { white-space: pre-wrap; color: var(--muted); margin: 0 0 10px; }
.meta { font-size: 13px; color: var(--muted); margin: 0 0 10px; }
details.rule { border-top: 1px solid var(--line); }
details.rule > summary { padding: 10px 2px; cursor: pointer; display: grid; grid-template-columns: 1fr; gap: 4px; list-style: none; }
details.rule > summary::-webkit-details-marker { display: none; }
.rhead { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.rbody { padding: 0 2px 12px; }
pre.src { background: var(--code-bg); border-radius: 8px; padding: 10px 0; overflow-x: auto; margin: 6px 0 10px; line-height: 1.5; }
pre.src .ln { display: inline-block; width: 46px; padding-right: 10px; text-align: right; color: var(--comment); user-select: none; }
pre.src .ln a { color: inherit; text-decoration: none; }
pre.src .row { display: block; padding-right: 12px; white-space: pre; }
.k { color: var(--kw); font-weight: 600; }
.t { color: var(--tag); }
.c { color: var(--comment); font-style: italic; }
.s { color: var(--str); }
ul.plain { margin: 4px 0 10px; padding-left: 20px; }
ul.plain li { margin: 2px 0; }
.v-bad { color: var(--bad); }
.v-warn { color: var(--warn); }
.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
.anatomy { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 16px; align-items: start; }
@media (max-width: 760px) { .anatomy { grid-template-columns: 1fr; } .bar { grid-template-columns: 120px 1fr 36px; } }
.callout { border-left: 3px solid var(--accent); padding: 4px 12px; margin: 8px 0; }
ol.steps li { margin: 4px 0; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { background: var(--code-bg); border-radius: 6px; padding: 1px 8px; font-size: 13px; }
a.chip { text-decoration: none; color: var(--ink); }
.empty { color: var(--muted); padding: 24px; text-align: center; }
`;

const SCRIPT =
  String.raw`
const D = JSON.parse(document.getElementById("data").textContent);
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const blob = (file, line) => D.repoUrl + "/blob/" + D.ref + "/" + file + (line ? "#L" + line : "");
const link = (file, line, text) => '<a href="' + esc(blob(file, line)) + '" target="_blank" rel="noopener">' + esc(text || (file + (line ? ":" + line : ""))) + "</a>";
const pat = (p) => '<span class="pattern" style="background:var(--p-' + p + ')">' + p + "</span>";
const VERDICT = { verified: "PASS", failing: "FAIL", unverified: "NOT RUN", unknown: "no run" };
const pill = (v) => '<span class="pill ' + v + '">' + VERDICT[v] + "</span>";
const plural = (n, one, many) => n + " " + (n === 1 ? one : (many || one + "s"));
const rulesOf = () => D.features.flatMap((f) => f.rules.map((r) => ({ f, r })));
const hasRun = D.reportFrom !== null;

function highlight(source, start, file) {
  let inDoc = false;
  return source.split("\n").map((raw, i) => {
    const n = start + i;
    let h = esc(raw);
    const t = raw.trim();
    if (/^("""|` +
  '```' +
  String.raw`)/.test(t)) { inDoc = !inDoc; h = '<span class="s">' + h + "</span>"; }
    else if (inDoc) h = '<span class="s">' + h + "</span>";
    else if (t.startsWith("#")) h = '<span class="c">' + h + "</span>";
    else if (t.startsWith("@")) h = h.replace(/@[\w-]+/g, (m) => '<span class="t">' + m + "</span>");
    else h = h.replace(/^(\s*)(Feature|Rule|Background|Scenario Outline|Scenario Template|Scenario|Examples|Example|Given|When|Then|And|But)(:?)/, (_, sp, kw, colon) => sp + '<span class="k">' + kw + colon + "</span>").replace(/&quot;[^&]*?&quot;/g, (m) => '<span class="s">' + m + "</span>");
    const ln = file ? '<a href="' + esc(blob(file, n)) + '" target="_blank" rel="noopener">' + n + "</a>" : String(n);
    return '<span class="row"><span class="ln">' + ln + "</span>" + h + "</span>";
  }).join("");
}

/* ---------- overview ---------- */
function overview() {
  const all = rulesOf();
  const by = (test) => all.filter(({ r }) => test(r)).length;
  const scenarios = all.reduce((n, { r }) => n + r.scenarios.length, 0);
  const tile = (n, l, cls) => '<div class="tile ' + (cls || "") + '"><div class="n">' + n + '</div><div class="l">' + l + "</div></div>";
  const failing = by((r) => r.verdict === "failing"), notRun = by((r) => r.verdict === "unverified"), findings = by((r) => r.findings.length > 0);
  const counts = Object.fromEntries(D.patterns.map((p) => [p, by((r) => r.pattern === p)]));
  const max = Math.max(1, ...Object.values(counts));

  const areas = {};
  for (const f of D.features) {
    const a = (areas[f.area] ||= { features: 0, rules: 0, verified: 0, scenarios: 0, exclusions: 0 });
    a.features++; a.rules += f.rules.length; a.verified += f.rules.filter((r) => r.verdict === "verified").length;
    a.scenarios += f.rules.reduce((n, r) => n + r.scenarios.length, 0); a.exclusions += f.rules.filter((r) => r.exclusion).length;
  }

  const charter = {};
  for (const f of D.features) for (const id of f.charter) (charter[id] ||= new Set()).add(f.file);

  const attention = [];
  for (const { f, r } of all) {
    if (r.verdict === "failing" || r.verdict === "unverified") attention.push('<li class="' + (r.verdict === "failing" ? "v-bad" : "v-warn") + '">' + pill(r.verdict) + ' <a href="#req-' + esc(r.id) + '">' + esc(r.id) + "</a>: " + esc(r.evidence) + "</li>");
    if (r.findings.length) attention.push('<li class="v-bad"><a href="#req-' + esc(r.id) + '">' + esc(r.id) + "</a>: " + esc(r.findings.join(" ")) + "</li>");
  }
  for (const f of D.features) {
    if (!f.boundBy.length) attention.push('<li class="v-bad">' + link(f.file) + ": no spec entry or step file runs this feature.</li>");
    if (f.orphanScenarios) attention.push('<li class="v-bad">' + link(f.file) + ": " + plural(f.orphanScenarios, "scenario") + " outside a Rule.</li>");
  }
  const unwanted = D.features.filter((f) => f.noUnwantedBehaviour);

  let changed = "";
  if (D.since) {
    const rows = [];
    for (const { f, r } of all) if (r.change) rows.push('<tr><td class="rid"><a href="#req-' + esc(r.id) + '">' + esc(r.id) + "</a></td><td>" + r.change + "</td><td>" + pat(r.pattern) + "</td><td>" + pill(r.verdict) + "</td><td>" + esc(r.title) + "</td></tr>");
    for (const r of D.removed) rows.push('<tr><td class="mono">' + esc(r.file.split("/").pop()) + "</td><td>removed</td><td></td><td></td><td>" + esc(r.title) + "</td></tr>");
    changed = "<h2>Changed since " + esc(D.since) + "</h2>" + (rows.length ? '<div class="card scroll"><table><thead><tr><th>Requirement</th><th>Change</th><th>Pattern</th><th>Verdict</th><th>Title</th></tr></thead><tbody>' + rows.join("") + "</tbody></table></div>" : '<div class="card">No requirement was added, changed or removed.</div>');
  }

  const runNote = hasRun
    ? '<p class="meta">Verdicts from <code>npm run ears</code> at ' + esc(D.reportFrom.slice(0, 16).replace("T", " ")) + " UTC. Spec audit: <b>" + esc(D.audit) + "</b>.</p>"
    : '<p class="meta">No <code>npm run ears</code> report was found, so no verdicts are shown. Run <code>npm run ears</code>, then rebuild this page.</p>';

  $("#overview").innerHTML = runNote +
    '<div class="tiles">' + tile(D.features.length, "feature files") + tile(all.length, "requirements (Rules)") + tile(scenarios, "scenarios") +
    (hasRun ? tile(by((r) => r.verdict === "verified"), "verified (PASS)", "ok") + tile(failing, "failing", failing ? "bad" : "") + tile(notRun, "not run", notRun ? "warn" : "") : "") +
    tile(findings, "with audit findings", findings ? "bad" : "") + tile(by((r) => r.exclusion), "exclusions (shall not)") + tile(by((r) => r.scenarios.length === 1), "on a single scenario") + "</div>" +
    changed +
    '<h2>Requirements by EARS pattern</h2><div class="card bars">' + D.patterns.map((p) => '<div class="bar"><span><a href="#" data-pattern="' + p + '">' + pat(p) + '</a></span><div class="track"><div class="fill" style="width:' + (100 * counts[p] / max) + "%;background:var(--p-" + p + ')"></div></div><span class="v">' + counts[p] + "</span></div>").join("") + "</div>" +
    '<h2>By area</h2><div class="card scroll"><table><thead><tr><th>Area (tests/bdd/features/…)</th><th class="num">Features</th><th class="num">Requirements</th>' + (hasRun ? '<th class="num">Verified</th>' : "") + '<th class="num">Scenarios</th><th class="num">Exclusions</th></tr></thead><tbody>' +
    Object.entries(areas).sort().map(([a, v]) => '<tr><td><a href="#" data-area="' + esc(a) + '">' + esc(a) + '</a></td><td class="num">' + v.features + '</td><td class="num">' + v.rules + "</td>" + (hasRun ? '<td class="num">' + v.verified + "</td>" : "") + '<td class="num">' + v.scenarios + '</td><td class="num">' + v.exclusions + "</td></tr>").join("") + "</tbody></table></div>" +
    "<h2>Needs attention</h2>" + (attention.length ? '<div class="card"><ul class="plain">' + attention.join("") + "</ul></div>" : '<div class="card">Nothing: every requirement is well-formed' + (hasRun ? ", verified" : "") + ", and every feature is run by one spec entry or step file.</div>") +
    "<h2>Advisory</h2><div class=\"card\"><p>" + plural(unwanted.length, "feature states", "features state") + " no unwanted behaviour (no <code>If …, then … shall</code> requirement), so their failure paths are unspecified:</p>" +
    (unwanted.length ? '<ul class="plain">' + unwanted.map((f) => "<li>" + esc(f.name) + " (" + link(f.file) + ")</li>").join("") + "</ul>" : "") + "</div>" +
    '<h2>Charter requirements verified here</h2><div class="card"><div class="chips">' + Object.keys(charter).sort().map((id) => '<a class="chip mono" href="#" data-charter="' + esc(id) + '" title="' + charter[id].size + ' feature(s)">@' + esc(id) + " · " + charter[id].size + "</a>").join("") + '</div><p class="meta">Each feature names the <a href="' + esc(D.repoUrl + "/blob/" + D.ref + "/guides/CHARTER.md") + '" target="_blank" rel="noopener">guides/CHARTER.md</a> requirement it verifies; the count is features.</p></div>';

  const jump = (sel, set) => $("#overview").querySelectorAll(sel).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); clearFilters(); set(a); show("rules"); render(); }));
  jump("[data-area]", (a) => ($("#f-area").value = a.dataset.area));
  jump("[data-pattern]", (a) => ($("#f-pattern").value = a.dataset.pattern));
  jump("[data-charter]", (a) => ($("#f-charter").value = a.dataset.charter));
}

/* ---------- requirements ---------- */
function ruleHtml(f, r) {
  const head = '<div class="rhead"><span class="rid">' + esc(r.id) + "</span>" + pat(r.pattern) + pill(r.verdict) +
    (r.exclusion ? '<span class="pill excl">exclusion</span>' : "") + (r.findings.length ? '<span class="pill finding">audit finding</span>' : "") +
    (r.change ? '<span class="pill change">' + r.change + "</span>" : "") + '<span class="meta" style="margin:0">' + plural(r.scenarios.length, "scenario") + "</span></div>";
  const proof = f.boundBy.length ? '<ul class="plain">' + f.boundBy.map((b) => "<li>Run by " + link(b) + "</li>").join("") + "</ul>" : '<p class="meta v-bad">No spec entry or step file runs this feature.</p>';
  const verdict = r.verdict === "unknown" ? "" : r.verdict === "verified" ? '<p class="meta">Every scenario under this Rule ran and passed.</p>' : '<p class="meta ' + (r.verdict === "failing" ? "v-bad" : "v-warn") + '">' + esc(r.evidence) + "</p>";
  const audit = r.findings.length ? '<h3>Audit</h3><ul class="plain">' + r.findings.map((m) => '<li class="v-bad">' + esc(m) + "</li>").join("") + "</ul>" : "";
  return '<details class="rule" id="req-' + esc(r.id) + '"><summary>' + head + "<span>" + esc(r.title) + "</span></summary>" +
    '<div class="rbody"><pre class="src">' + highlight(r.source, r.sourceStart, f.file) + "</pre><h3>Proof</h3>" + proof + verdict + audit + "</div></details>";
}

function featureHtml(f, rules, open) {
  const tags = f.tags.map((t) => '<span class="chip mono">' + esc(t) + "</span> ").join("");
  return '<details class="feature"' + (open ? " open" : "") + '><summary><span class="fname">' + esc(f.name) + '</span><span class="fpath">' + esc(f.file) + "</span>" +
    '<span class="meta" style="margin:0">' + plural(f.rules.length, "requirement") + (rules.length !== f.rules.length ? ", " + rules.length + " shown" : "") + "</span></summary>" +
    '<div class="fbody">' + (f.description ? '<p class="desc">' + esc(f.description) + "</p>" : "") + '<p class="meta">' + tags + link(f.file, 0, "view file") + "</p>" +
    rules.map((r) => ruleHtml(f, r)).join("") + "</div></details>";
}

function clearFilters() {
  $("#q").value = ""; $("#f-pattern").value = ""; $("#f-area").value = ""; $("#f-verdict").value = ""; $("#f-charter").value = ""; $("#f-changed").checked = false;
}

function render() {
  const q = $("#q").value.trim().toLowerCase(), p = $("#f-pattern").value, a = $("#f-area").value, v = $("#f-verdict").value, c = $("#f-charter").value, ch = $("#f-changed").checked;
  const filtering = q || p || v || c || ch;
  let nRules = 0, nFeatures = 0;
  const html = D.features.map((f) => {
    if (a && f.area !== a) return "";
    const rules = f.rules.filter((r) => (!p || r.pattern === p) && (!ch || r.change) &&
      (!c || f.tags.includes("@" + c) || r.tags.includes("@" + c)) &&
      (!v || (v === "exclusion" ? r.exclusion : v === "finding" ? r.findings.length > 0 : v === "single" ? r.scenarios.length === 1 : r.verdict === v)) &&
      (!q || (r.id + " " + r.title + " " + r.scenarios.map((x) => x.title).join(" ") + " " + f.file + " " + f.name + " " + r.tags.join(" ")).toLowerCase().includes(q)));
    if (!rules.length) return "";
    nRules += rules.length; nFeatures++;
    return featureHtml(f, rules, !!filtering);
  }).join("");
  $("#list").innerHTML = html || '<div class="empty">No requirement matches.</div>';
  $("#count").textContent = plural(nRules, "requirement") + " in " + plural(nFeatures, "feature file");
}

/* ---------- guide ---------- */
function guide() {
  const anatomy = [
    "@ARCH-04",
    "Feature: ETag Caching",
    "  The EsiClient can cache GET responses that carry an ETag header, keyed by",
    "  endpoint. Each entry has a TTL derived from the endpoint's cache metadata.",
    "",
    "  # ── Storing responses ─────────────────────────────",
    "",
    "  Rule: When a response carrying an ETag header is received, the ETag cache shall store the response body against the requested endpoint.",
    "    The ETag is the server's own identity for a representation, so its",
    "    presence is what marks a response as re-usable.",
    "",
    "    Scenario: First response carrying an ETag is stored in the cache",
    "      Given ETag caching is enabled",
    "      When the client requests an endpoint that answers with an ETag",
    "      Then the response is stored against that endpoint"
  ].join("\n");
  const ex = (p) => {
    const e = D.examples[p];
    if (!e) return '<p class="meta">No requirement of this pattern is clean and verified yet.</p>';
    const f = D.features[e.feature], r = f.rules[e.rule];
    return '<p class="meta">From ' + link(f.file, r.line) + ' (<a href="#req-' + esc(r.id) + '">' + esc(r.id) + "</a>)</p><pre class=\"src\">" + highlight(r.source, r.sourceStart, f.file) + "</pre>";
  };
  $("#guide").innerHTML =
    '<h2>What a requirement is</h2><div class="card"><p>Every observable behaviour of ESI.ts is written down as a <b>Rule</b> in a Gherkin feature file under <code>tests/bdd/features/&lt;area&gt;/NNNN-name.feature</code>. ' +
    'The Rule\'s title is one requirement in <a href="https://alistairmavin.com/ears/" target="_blank" rel="noopener">EARS</a> form (Easy Approach to Requirements Syntax): one sentence, exactly one <b>shall</b>, ending in a full stop. The scenarios beneath it are the executable proof. ' +
    "A spec entry under <code>tests/bdd/specs/</code> that mirrors the feature's path runs them with Jest against the one-step-per-file library in <code>tests/bdd/steps/</code>; a few domains still use a legacy <code>defineFeature</code> file in <code>tests/bdd/step-definitions/</code>. " +
    'Scenarios mock at the HTTP transport seam, so the whole request pipeline really runs.</p><p>The rules are in ' + link("tests/bdd/README.md", 0, "tests/bdd/README.md") + " and the method in " + link("tests/bdd/GUIDE.md", 0, "tests/bdd/GUIDE.md") + ". <code>npm run spec:audit</code> enforces the shape; <code>npm run ears</code> gives each requirement a verdict.</p></div>" +
    '<h2>Anatomy of a feature file</h2><p class="meta">Illustrative, after ' + link("tests/bdd/features/core/0050-etag-caching.feature", 0, "0050-etag-caching.feature") + '.</p><div class="card anatomy"><pre class="src">' + highlight(anatomy, 1, "") + '</pre><ol class="steps">' +
    "<li><code>@ARCH-04</code>: the charter tag, on the Feature or on a Rule. It names the <code>guides/CHARTER.md</code> requirement the file verifies; the audit fails a feature with none, and an unknown or miscased id.</li>" +
    "<li>The Feature description is required: what the file covers and why, in two or three sentences.</li>" +
    "<li><code>Rule:</code> the requirement itself. Its EARS pattern comes from its first word: When, If, While, Where, or none.</li>" +
    "<li>The prose under the Rule is the rationale, the <i>why</i>. It never says <b>shall</b>: a requirement hidden there is one no scenario traces to.</li>" +
    "<li><code>Scenario:</code> at least one, named after the case, not the requirement. Every scenario sits under the Rule it verifies.</li>" +
    "<li>A requirement's id is <code>&lt;file stem&gt;#R&lt;n&gt;</code>, counting Rules from the top of the file, as <code>npm run ears</code> reports it.</li></ol></div>" +
    "<h2>The patterns</h2>" + D.patterns.map((p) => {
      const g = D.patternGuide[p];
      return '<div class="card"><h3>' + pat(p) + "</h3><p>" + esc(g.use) + '</p><p class="callout mono">' + esc(g.template) + "</p>" + ex(p) + "</div>";
    }).join("") +
    '<div class="card"><p>A decision procedure, in order: is it about something going wrong? <b>If</b>. Does it apply only when a client option is set? <b>Where</b>. Is there a condition that lasts? <b>While</b>. Is there a discrete trigger? <b>When</b>. Otherwise it is ubiquitous.</p></div>' +
    "<h2>Words the audit checks</h2><div class=\"grid2\">" +
    '<div class="card"><h3>Obligation words that are not “shall”</h3><div class="chips">' + D.wrongObligations.map((s) => '<span class="chip">' + esc(s) + "</span>").join("") + "</div></div>" +
    '<div class="card"><h3>Pronouns before “shall”</h3><div class="chips">' + D.pronouns.map((s) => '<span class="chip">' + esc(s) + "</span>").join("") + '</div><p class="meta">Name the system: the Market client, the ETag cache, the rate limiter.</p></div>' +
    Object.entries(D.vagueTerms).map(([cat, terms]) => '<div class="card"><h3>Vague: ' + esc(cat) + '</h3><div class="chips">' + terms.map((s) => '<span class="chip">' + esc(s) + "</span>").join("") + "</div></div>").join("") +
    '</div><p class="meta">Say what is observable instead, and put the real number in: “within 3 attempts”, not “quickly”.</p>' +
    '<h2>Adding a requirement</h2><div class="card"><ol class="steps">' +
    "<li>Find the feature file for the domain. Prefer adding a Rule to an existing file over creating one.</li>" +
    "<li>Choose the pattern and write the title with exactly one “shall” and the system's name before it.</li>" +
    "<li>Write the rationale beneath it, then the scenarios. Tag the Rule with a charter id if it backs a different requirement from the feature.</li>" +
    "<li>Reuse a step from <code>tests/bdd/steps/</code> where its words fit; a new step gets its own file, named after its text. <code>npm run bdd:steps</code> checks each step matches one definition.</li>" +
    "<li>Run the scenarios and watch them fail, then implement until they pass.</li>" +
    "<li>Run <code>npm run spec:audit</code>, then <code>npm run ears</code> and <code>npm run ears:dashboard</code> to see the requirement here as PASS.</li></ol></div>";
}

/* ---------- wiring ---------- */
function show(tab) {
  document.querySelectorAll("nav button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  document.querySelectorAll("main > section").forEach((s) => (s.hidden = s.id !== tab));
}
function goTo(id) {
  if (!id) return;
  clearFilters(); show("rules"); render();
  const el = document.getElementById("req-" + id);
  if (el) { el.open = true; el.closest("details.feature").open = true; el.scrollIntoView({ block: "start" }); }
}

const total = rulesOf().length;
$("#sub").innerHTML = total + " requirements in " + D.features.length + " feature files · built " + esc(D.generatedAt.slice(0, 16).replace("T", " ")) + " UTC from " +
  '<a href="' + esc(D.repoUrl + "/tree/" + D.ref) + '" target="_blank" rel="noopener">' + esc(D.ref.slice(0, 12)) + "</a>" + (D.since ? " · changes since " + esc(D.since) : "");
$("#f-pattern").innerHTML = '<option value="">Any pattern</option>' + D.patterns.map((p) => '<option value="' + p + '">' + p + "</option>").join("");
$("#f-area").innerHTML = '<option value="">Any area</option>' + [...new Set(D.features.map((f) => f.area))].sort().map((a) => "<option>" + esc(a) + "</option>").join("");
$("#f-charter").innerHTML = '<option value="">Any charter id</option>' + [...new Set(D.features.flatMap((f) => f.charter))].sort().map((c) => '<option value="' + esc(c) + '">@' + esc(c) + "</option>").join("");
$("#f-verdict").innerHTML = '<option value="">Any verdict</option>' + (hasRun ? '<option value="verified">PASS</option><option value="failing">FAIL</option><option value="unverified">NOT RUN</option>' : "") +
  '<option value="finding">Has an audit finding</option><option value="exclusion">Exclusions (shall not)</option><option value="single">On a single scenario</option>';
if (D.since) { $("#changed-wrap").hidden = false; $("#changed-label").textContent = "Changed since " + D.since; }
["#q", "#f-pattern", "#f-area", "#f-verdict", "#f-charter", "#f-changed"].forEach((s) => $(s).addEventListener("input", render));
$("#expand").addEventListener("click", () => { const open = $("#expand").textContent === "Expand all"; document.querySelectorAll("#list details").forEach((d) => (d.open = open)); $("#expand").textContent = open ? "Collapse all" : "Expand all"; });
document.querySelectorAll("nav button").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
document.addEventListener("click", (e) => { const a = e.target.closest('a[href^="#req-"]'); if (a) { e.preventDefault(); goTo(decodeURIComponent(a.getAttribute("href").slice(5))); history.replaceState(null, "", a.getAttribute("href")); } });
overview(); guide(); render();
if (location.hash.startsWith("#req-")) goTo(decodeURIComponent(location.hash.slice(5)));
window.addEventListener("hashchange", () => { if (location.hash.startsWith("#req-")) goTo(decodeURIComponent(location.hash.slice(5))); });
`;

const BODY = String.raw`
<header>
  <h1><img class="logo" src="https://lgriffin.github.io/ESI.ts/logo-mark.png" alt="" width="32" height="32">ESI.ts EARS requirements</h1>
  <p class="home"><a href="https://lgriffin.github.io/ESI.ts/">ESI.ts documentation</a> · <a href="https://github.com/lgriffin/ESI.ts">GitHub</a></p>
  <p id="sub"></p>
  <nav role="tablist">
    <button role="tab" data-tab="overview" aria-selected="true">Overview</button>
    <button role="tab" data-tab="rules" aria-selected="false">Requirements</button>
    <button role="tab" data-tab="guide" aria-selected="false">Write a requirement</button>
  </nav>
</header>
<main>
  <section id="overview"></section>
  <section id="rules" hidden>
    <div class="controls">
      <input type="search" id="q" placeholder="Search requirements, scenarios, ids, files" aria-label="Search">
      <select id="f-pattern" aria-label="Pattern"></select>
      <select id="f-area" aria-label="Area"></select>
      <select id="f-verdict" aria-label="Verdict"></select>
      <select id="f-charter" aria-label="Charter id"></select>
      <label id="changed-wrap" hidden><input type="checkbox" id="f-changed"> <span id="changed-label">Changed only</span></label>
      <button id="expand">Expand all</button>
    </div>
    <div class="count" id="count"></div>
    <div id="list"></div>
  </section>
  <section id="guide" hidden></section>
</main>
`;

/** The whole page. Exactly one `</script>` closes each script element. */
export function renderPage(data: DashboardData): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>ESI.ts EARS Dashboard</title>',
    '<link rel="icon" href="https://lgriffin.github.io/ESI.ts/favicon.ico">',
    `<style>${STYLE}</style>`,
    '</head>',
    '<body>',
    BODY,
    `<script type="application/json" id="data">${embedJson(data)}</script>`,
    `<script>${SCRIPT}</script>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}
