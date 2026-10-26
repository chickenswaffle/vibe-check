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
    frame = requestAnimationFrame(advance);
  }
  function syncMotion() {
    const stopped = paused || preference.matches || !visible || document.hidden;
    document.body.classList.toggle("motion-paused", stopped);
    if (stopped && frame !== null) { cancelAnimationFrame(frame); frame = null; lastFrame = null; }
    if (!stopped && frame === null) { lastFrame = null; frame = requestAnimationFrame(advance); }
  }
  function showMotion() {
    syncMotion();
    motion.setAttribute("aria-pressed", String(paused));
    motion.replaceChildren(document.createTextNode(preference.matches ? "Motion off " : paused ? "Play walkthrough " : "Pause walkthrough "));
    const icon = document.createElement("span"); icon.setAttribute("aria-hidden", "true"); icon.textContent = preference.matches ? "○" : paused ? "▶" : "Ⅱ"; motion.append(icon);
    motion.disabled = preference.matches;
    motion.setAttribute("aria-label", preference.matches ? "Animation disabled by your reduced-motion preference" : paused ? "Play illustrated walkthrough" : "Pause illustrated walkthrough");
  }
  preference.addEventListener("change", () => { paused = preference.matches; showMotion(); });
  showStep(0); showMotion();
  motion.addEventListener("click", () => { paused = !paused; showMotion(); });
  stepButtons.forEach(button => button.addEventListener("click", () => {
    paused = true; showStep(Number(button.dataset.step)); showMotion();
  }));
  $("#replay-sequence").addEventListener("click", () => {
    showStep(0); paused = preference.matches; showMotion();
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
