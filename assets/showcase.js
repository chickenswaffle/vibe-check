(() => {
  "use strict";
  const panel = document.querySelector("#tour-panel");
  const tabs = [...document.querySelectorAll("[data-view][role=tab]")];
  const cases = [...document.querySelectorAll("button[data-finding]")];
  const $ = (selector) => document.querySelector(selector);
  const samples = {
    access: { status: "EXAMPLE OBSERVATION", title: "A private record crosses an account boundary.", copy: "In this sample, a supplied forbidden reader receives the owner's private marker. Inspect the expectation and the response evidence together.", rows: [["Owner account", "200 · private marker"], ["Forbidden reader", "200 · same marker"]] },
    headers: { status: "EXAMPLE HARDENING REVIEW", title: "An important response protection is missing.", copy: "A missing header is an observed configuration condition. Review its value, the page context and the intended browser protection before deciding impact.", rows: [["Response", "200 · captured"], ["Protection", "Review configuration"]] },
    reset: { status: "UNVERIFIED REVIEW CANDIDATE", title: "Token-shaped output needs real flow context.", copy: "Reset-related output can be a lead. It does not establish a usable token or account takeover. Passive review sends no reset email and redeems no token.", rows: [["Observation", "Existing capture only"], ["Exploitability", "Not established"]] }
  };
  function rows(items) {
    const root = $("#evidence-lines");
    root.replaceChildren();
    items.forEach(([label, value]) => {
      const line = document.createElement("div");
      const name = document.createElement("span");
      const detail = document.createElement("b");
      name.textContent = label; detail.textContent = value;
      line.append(name, detail); root.append(line);
    });
  }
  function render(view, finding) {
    const sample = samples[finding];
    const retest = view === "retest";
    panel.dataset.view = view; panel.dataset.finding = finding;
    panel.setAttribute("aria-labelledby", "tab-" + view);
    tabs.forEach(tab => { const selected = tab.dataset.view === view; tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1; });
    cases.forEach(button => { const selected = button.dataset.finding === finding; button.classList.toggle("active", selected); button.setAttribute("aria-pressed", String(selected)); });
    $("#inspector-kicker").textContent = retest ? "ILLUSTRATED REPAIR" : view === "evidence" ? "EVIDENCE INSPECTOR" : "REVIEW SIGNALS";
    $("#inspector-count").textContent = retest ? "01" : "03";
    $("#detail-status").textContent = retest ? "ILLUSTRATIVE RE-TEST / ACCESS RULE" : sample.status;
    $("#detail-title").textContent = retest ? "The owner can read. The forbidden reader cannot." : sample.title;
    $("#detail-copy").textContent = retest ? "This example illustrates repeated denials, the original private marker still available to its owner, and fresh supplied account-health checks. A missing finding alone is not repair evidence." : sample.copy;
    rows(retest ? [["Owner account", "200 · original marker"], ["Forbidden reader", "403 · twice"], ["Account context", "Re-checked"]] : sample.rows);
    $("#status-text").textContent = retest ? "Repair credit needs the original condition and context" : view === "evidence" ? "Review the response, the rule and the limits together" : "Choose a review signal, then inspect its evidence";
    $("#inspector-footer").textContent = finding === "reset" && !retest ? "A candidate stays unverified until context supports it." : retest ? "No automatic fix credit for disappearance or failure." : "A signal starts a review. It never replaces one.";
  }
  // Each scene is a synthetic explanation, never a scan event or coverage claim.
  const stories = {
    access: [
      ["Establish context", "Establishing context", "The owner account establishes which private record this rule protects.", "out"],
      ["Compare response", "Comparing account boundaries", "In this example, a forbidden reader receives the same private marker. The account boundary did not hold.", "back"],
      ["Review the rule", "Evidence ready for review", "Compare the explicit access rule with both responses. The observation needs the application's business context.", "hold"]
    ],
    headers: [
      ["Observe a page", "Observing the response", "A sample page response is captured so its browser protections can be inspected.", "out"],
      ["Inspect headers", "Inspecting response headers", "The saved response is missing an expected protection header. That is a configuration observation.", "back"],
      ["Assess context", "Context determines impact", "Review the document, browser behavior and deployment before assigning impact. A missing header alone does not prove an exploit.", "hold"]
    ],
    reset: [
      ["Read capture", "Reading existing evidence", "This illustration starts with a saved response. No reset request is sent and no email is triggered.", "back"],
      ["Inspect output", "Inspecting token-shaped output", "Reset-related output is highlighted as a lead. Its shape does not establish that the value is a usable credential.", "hold"],
      ["Keep unverified", "Context still required", "The candidate stays unverified. No token is redeemed and no account-takeover claim is made.", "hold"]
    ],
    retest: [
      ["Owner still reads", "Re-checking the original record", "First, the original owner still receives the private marker. A deleted or unavailable record cannot establish a repair.", "out"],
      ["Reader denied", "Comparing repeated denials", "The forbidden reader is denied twice in this example. A failed request or a missing finding is insufficient.", "back"],
      ["Context healthy", "Checking the account context", "Fresh account-health checks bracket the comparison. Repair credit needs the original rule, healthy identities and complete evidence.", "hold"]
    ]
  };
  // Authored sample events only. No CLI, model or HTTP request runs on this page.
  const traces = {
    access: [
      { command: "access-rule / owner baseline", title: "Establish the expected reader.", why: "A status code is not enough. First, the sample checks that the owner receives the exact private marker.", capture: "OWNER RESPONSE", http: 'GET /api/invoices/demo-42 HTTP/1.1\nHost: example.test\n\nHTTP/1.1 200 OK\n{"marker":"sample-record"}', events: [["scope", "target=example.test · read-only sample"], ["context", "identity=owner · private-record rule"], ["request", "GET /api/invoices/demo-42 [owner]"], ["response", "200 OK · private marker present"], ["compare", "baseline retained for reader comparison"]] },
      { command: "access-rule / forbidden reader", title: "Compare content across identities.", why: "A shared 200 response can be legitimate. Here the same private marker crosses an explicit forbidden-reader boundary.", capture: "FORBIDDEN READER RESPONSE", http: 'GET /api/invoices/demo-42 HTTP/1.1\nHost: example.test\n\nHTTP/1.1 200 OK\n{"marker":"sample-record"}', events: [["context", "identity=forbidden-reader · expected=deny"], ["request", "GET /api/invoices/demo-42 [reader]"], ["response", "200 OK · same private marker returned"], ["compare", "owner marker == reader marker"], ["review", "access-rule mismatch · inspect context"]] },
      { command: "access-rule / evidence review", title: "Keep the proof attached to the rule.", why: "The comparison supports this supplied rule. Business context and human review determine the final finding and impact.", capture: "CAPTURE PAIR / NO NEW REQUEST", http: 'SAVED COMPARISON (synthetic)\nowner  -> 200 · marker present\nreader -> 200 · same marker\nrule   -> reader must be denied\nnext   -> contextual review', events: [["scope", "rule=private-record · same route + object"], ["compare", "owner=200 · reader=200 · marker=equal"], ["context", "business expectation needs review"], ["review", "attach capture pair to access-rule lead"], ["hold", "human review · no automatic risk claim"]] }
    ],
    headers: [
      { command: "response-hardening / capture", title: "Start with the actual response.", why: "Inspect the document response rather than guessing from a framework name. The example uses a saved, read-only page capture.", capture: "DOCUMENT RESPONSE", http: 'GET / HTTP/1.1\nHost: example.test\n\nHTTP/1.1 200 OK\nContent-Type: text/html\nX-Content-Type-Options: nosniff', events: [["scope", "target=example.test · route=/"], ["request", "GET / · document response"], ["response", "200 OK · content-type=text/html"], ["context", "retain response headers for inspection"], ["compare", "evaluate relevant browser protections"]] },
      { command: "response-hardening / header review", title: "Separate absence from exploitation.", why: "This sample lacks a Content-Security-Policy header. That is observable; exploitability still depends on document and browser context.", capture: "SAVED HEADERS / NO NEW REQUEST", http: 'SAVED HEADERS (synthetic)\nContent-Type: text/html\nX-Content-Type-Options: nosniff\n\nContent-Security-Policy: [absent]\nImpact: not established', events: [["context", "inspect saved response · no new request"], ["compare", "Content-Security-Policy header absent"], ["compare", "X-Content-Type-Options=nosniff present"], ["review", "configuration observation · assess context"], ["hold", "missing protection != demonstrated exploit"]] },
      { command: "response-hardening / impact context", title: "Explain what the signal can support.", why: "Document behavior, existing controls and deployment context affect impact. The trace leaves that decision open for review.", capture: "REVIEW RECORD / NO NEW REQUEST", http: 'REVIEW RECORD (synthetic)\nobservation: CSP header absent\ndocument: HTML response\nexploit: not demonstrated\nnext: contextual hardening review', events: [["scope", "review applies to captured document only"], ["context", "browser + document + deployment matter"], ["review", "other controls may affect the impact"], ["review", "record observation and review limits"], ["hold", "hardening review · severity not inferred"]] }
    ],
    reset: [
      { command: "reset-flow / saved capture", title: "Inspect without triggering a reset.", why: "This is passive review of existing output. The walkthrough sends no forgot-password request and triggers no email.", capture: "EXISTING CAPTURE / PASSIVE ONLY", http: 'SAVED OUTPUT (synthetic)\nsource: existing response capture\nroute: /password-reset\nvalue: [token-shaped sample]\nrequest sent: no', events: [["scope", "mode=passive · saved capture only"], ["context", "READ existing /password-reset output"], ["compare", "token-shaped sample value observed"], ["review", "issuance + validity not established"], ["hold", "no email · no redemption · no request"]] },
      { command: "reset-flow / candidate analysis", title: "A token shape is only a lead.", why: "A field can resemble a token without being a credential. Its origin, purpose and usability remain unverified.", capture: "CANDIDATE RECORD / NO HTTP REQUEST", http: 'CANDIDATE (synthetic)\nshape: token-like output\ncredential: not established\nusable: not tested\naccount takeover: not established', events: [["context", "inspect saved output · no active probe"], ["compare", "token-like shape != usable credential"], ["review", "origin + flow context still unknown"], ["hold", "candidate=unverified · no takeover claim"], ["hold", "no token redeemed · no outbound request"]] },
      { command: "reset-flow / review boundary", title: "Preserve uncertainty in the report.", why: "An unverified lead must stay distinct from a confirmed flaw. The sample records the limit without inventing proof.", capture: "REVIEW RECORD / NO HTTP REQUEST", http: 'REVIEW RECORD (synthetic)\nstate: unverified candidate\nevidence: existing capture only\ncredential usability: unknown\nnext: authorized contextual review', events: [["scope", "evidence limited to existing capture"], ["context", "reset flow requires application context"], ["review", "do not promote shape to exploit proof"], ["hold", "report state=unverified candidate"], ["hold", "no account-takeover conclusion"]] }
    ],
    retest: [
      { command: "re-test / original owner baseline", title: "A missing object is not a repair.", why: "The original owner must still receive the private marker. Fresh identity context starts the comparison before the reader is checked.", capture: "ORIGINAL OWNER RESPONSE", http: 'GET /api/invoices/demo-42 HTTP/1.1\nHost: example.test\n\nHTTP/1.1 200 OK\n{"marker":"sample-record"}', events: [["scope", "same rule + route + original object"], ["context", "pre-check: supplied identities healthy"], ["request", "GET /api/invoices/demo-42 [owner]"], ["response", "200 OK · original marker still present"], ["compare", "owner baseline survives the repair"]] },
      { command: "re-test / repeat reader denial", title: "Require an actual denial, twice.", why: "Both sample reader attempts return supported denials. Network errors and an absent finding would leave the repair unverified.", capture: "FORBIDDEN READER / TWO ATTEMPTS", http: 'GET /api/invoices/demo-42 HTTP/1.1\nHost: example.test\n\nHTTP/1.1 403 Forbidden\n{"error":"access denied"}\nrepeat: 403 · marker absent', events: [["context", "same forbidden reader + original rule"], ["request", "GET /api/invoices/demo-42 [reader]"], ["response", "attempt 1: 403 · private marker absent"], ["response", "attempt 2: 403 · private marker absent"], ["compare", "two supported denials · no error credit"]] },
      { command: "re-test / identity-context closure", title: "Check that the accounts still work.", why: "Post-checks keep expired sessions from masquerading as a fix. This illustration completes the comparison with distinct, healthy identities.", capture: "IDENTITY POST-CHECK / TWO CONTEXTS", http: 'GET /api/me HTTP/1.1\nHost: example.test\n\nowner context: 200 · owner identity\nreader context: 200 · reader identity\nidentities: distinct + expected', events: [["request", "GET /api/me [owner + reader contexts]"], ["response", "both healthy · distinct expected identities"], ["compare", "pre/post context stable · rule unchanged"], ["compare", "owner marker retained + reader denied x2"], ["review", "illustrated negative evidence complete"]] }
    ]
  };
  const traceOffsets = [0, 900, 1800, 2900, 4100];
  let traceShown = 0;
  function renderTrace(time) {
    const count = traceOffsets.filter(offset => offset <= time).length;
    if (count <= traceShown) return;
    traceShown = count;
    const key = panel.dataset.view === "retest" ? "retest" : panel.dataset.finding;
    const events = traces[key].slice(0, step + 1).flatMap((scene, stage) => scene.events.slice(0, stage === step ? count : 5).map((event, index) => ({ event, stage, offset: traceOffsets[index] })));
    const lines = document.createDocumentFragment();
    events.slice(-6).forEach(({ event, stage, offset }, index, entries) => {
      const line = document.createElement("li"); line.dataset.kind = event[0];
      if (index === entries.length - 1) line.className = "trace-latest";
      const timestamp = document.createElement("span"); timestamp.className = "trace-time";
      timestamp.textContent = "+" + ((stage * sceneDuration + offset) / 1000).toFixed(2).padStart(5, "0");
      const tag = document.createElement("span"); tag.className = "trace-tag"; tag.textContent = event[0].toUpperCase();
      const message = document.createElement("code"); message.textContent = event[1];
      line.append(timestamp, tag, message); lines.append(line);
    });
    $("#trace-lines").replaceChildren(lines);
    const viewport = $(".trace-scroll"); viewport.scrollTop = viewport.scrollHeight;
    $("#trace-event-count").textContent = String(events.length).padStart(2, "0") + " / 15";
  }
  document.querySelectorAll("[data-trace-view]").forEach(button => button.addEventListener("click", () => {
    const http = button.dataset.traceView === "http";
    $("#trace-why").hidden = http; $("#trace-http").hidden = !http;
    if (http) { paused = true; renderTrace(sceneDuration); showMotion(); }
    document.querySelectorAll("[data-trace-view]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  }));
  const stepButtons = [...document.querySelectorAll("button[data-step]")];
  let step = 0;
  let elapsed = 0;
  const sceneDuration = 6200;
  function showStep(index) {
    step = index; elapsed = 0;
    const key = panel.dataset.view === "retest" ? "retest" : panel.dataset.finding;
    const story = stories[key];
    const scene = story[index];
    panel.dataset.step = String(index); panel.dataset.direction = scene[3];
    panel.style.setProperty("--scene-progress", "0%");
    const destination = key === "headers" ? [578, 230] : key === "reset" ? [174, 350] : [177, 110];
    panel.style.setProperty("--packet-x", (destination[0] - 350) + "px");
    panel.style.setProperty("--packet-y", (destination[1] - 223) + "px");
    document.querySelectorAll(".journey-paths path").forEach(path => path.setAttribute("d", "M350 223 " + destination.join(" ")));
    stepButtons.forEach((button, n) => {
      button.setAttribute("aria-pressed", String(n === index));
      button.querySelector("b").textContent = story[n][0];
    });
    const labels = { access: ["200 · OWNER", "200 · READER", "RULE MISMATCH"], headers: ["200 · CAPTURED", "HEADER MISSING", "REVIEW IMPACT"], reset: ["SAVED CAPTURE", "TOKEN-SHAPED", "UNVERIFIED"], retest: ["200 · OWNER", "403 · TWICE", "CONTEXT CHECK"] };
    $("#response-label").textContent = labels[key][index];
    $(".response-chip").setAttribute("transform", "translate(" + (destination[0] - 57) + " " + (key === "reset" ? destination[1] - 66 : destination[1] + 48) + ")");
    $("#sequence-counter").textContent = "0" + (index + 1) + " / 03";
    $("#sequence-copy").textContent = scene[2];
    $("#graph-phase").textContent = scene[1];
    const trace = traces[key][index];
    $("#trace-command").textContent = trace.command;
    $("#trace-reason-title").textContent = trace.title;
    $("#trace-reason").textContent = trace.why;
    $("#trace-capture-label").textContent = "SYNTHETIC / " + trace.capture;
    $("#trace-payload").textContent = trace.http;
    traceShown = 0;
    renderTrace(paused || preference.matches ? sceneDuration : 0);
  }
  function selectView(view, finding) { render(view, finding); showStep(0); }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectView(tab.dataset.view, tab.dataset.view === "retest" ? "access" : panel.dataset.finding));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); tabs[next].focus(); tabs[next].click(); }
    });
  });
  cases.forEach(button => button.addEventListener("click", () => selectView(panel.dataset.view === "retest" ? "evidence" : panel.dataset.view, button.dataset.finding)));
  const motion = $("#motion-toggle");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = preference.matches;
  let visible = true;
  let frame = null;
  let lastFrame = null;
  function advance(timestamp) {
    // Reset on every pause/resume: time spent hidden never advances the story.
    if (lastFrame !== null) elapsed += Math.min(timestamp - lastFrame, 100);
    lastFrame = timestamp;
    if (elapsed >= sceneDuration) showStep((step + 1) % 3);
    panel.style.setProperty("--scene-progress", (elapsed / sceneDuration * 100) + "%");
    renderTrace(elapsed);
    frame = requestAnimationFrame(advance);
  }
  function syncMotion() {
    const stopped = paused || preference.matches || !visible || document.hidden;
    document.body.classList.toggle("motion-paused", stopped);
    $("#trace-state").textContent = preference.matches ? "Static" : paused ? "Paused" : !visible || document.hidden ? "On hold" : "Playing";
    if (stopped && frame !== null) { cancelAnimationFrame(frame); frame = null; lastFrame = null; }
    if (!stopped && frame === null) { lastFrame = null; frame = requestAnimationFrame(advance); }
  }
  function showMotion() {
    syncMotion();
    motion.setAttribute("aria-pressed", String(paused));
    motion.replaceChildren(document.createTextNode(preference.matches ? "Motion off " : paused ? "Play walkthrough " : "Pause walkthrough "));
    const icon = document.createElement("span"); icon.setAttribute("aria-hidden", "true"); icon.textContent = preference.matches ? "○" : paused ? "▶" : "Ⅱ"; motion.append(icon);
    motion.disabled = preference.matches;
    $("#trace-toggle").disabled = preference.matches;
    $("#trace-toggle").setAttribute("aria-pressed", String(paused));
    $("#trace-toggle").setAttribute("aria-label", preference.matches ? "Sample trace is static for reduced motion" : paused ? "Play sample trace" : "Pause sample trace");
    $("#trace-control-icon").textContent = preference.matches ? "○" : paused ? "▶" : "Ⅱ";
    motion.setAttribute("aria-label", preference.matches ? "Animation disabled by your reduced-motion preference" : paused ? "Play illustrated walkthrough" : "Pause illustrated walkthrough");
  }
  preference.addEventListener("change", () => { paused = preference.matches; showMotion(); });
  showStep(0); showMotion();
  motion.addEventListener("click", () => { paused = !paused; showMotion(); });
  $("#trace-toggle").addEventListener("click", () => { paused = !paused; showMotion(); });
  stepButtons.forEach(button => button.addEventListener("click", () => {
    paused = true; showStep(Number(button.dataset.step)); showMotion();
  }));
  $("#replay-sequence").addEventListener("click", () => {
    paused = preference.matches; showStep(0); showMotion();
  });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; syncMotion();
  }, { threshold: 0.05 });
  observer.observe($(".app-shell"));
  document.addEventListener("visibilitychange", syncMotion);
  $("#copy-command").addEventListener("click", async () => {
    const command = $("#brew-command");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(command.textContent);
      $("#copy-status").textContent = "Install command copied.";
    } catch {
      const selection = window.getSelection();
      const range = document.createRange(); range.selectNodeContents(command);
      selection.removeAllRanges(); selection.addRange(range);
      $("#copy-status").textContent = "Command selected. Copy it with your keyboard.";
    }
  });
})();
