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
    $("#graph-phase").textContent = retest ? "Original rule re-checked" : view === "evidence" ? "Inspecting sample evidence" : "Surface mapped";
    $("#inspector-kicker").textContent = retest ? "ILLUSTRATED REPAIR" : view === "evidence" ? "EVIDENCE INSPECTOR" : "REVIEW SIGNALS";
    $("#inspector-count").textContent = retest ? "01" : "03";
    $("#detail-status").textContent = retest ? "ILLUSTRATIVE RE-TEST / ACCESS RULE" : sample.status;
    $("#detail-title").textContent = retest ? "The owner can read. The forbidden reader cannot." : sample.title;
    $("#detail-copy").textContent = retest ? "This example illustrates repeated denials, the original private marker still available to its owner, and fresh supplied account-health checks. A missing finding alone is not repair evidence." : sample.copy;
    rows(retest ? [["Owner account", "200 · original marker"], ["Forbidden reader", "403 · twice"], ["Account context", "Re-checked"]] : sample.rows);
    $("#status-text").textContent = retest ? "Repair credit needs the original condition and context" : view === "evidence" ? "Review the response, the rule and the limits together" : "Choose a review signal, then inspect its evidence";
    $("#inspector-footer").textContent = finding === "reset" && !retest ? "A candidate stays unverified until context supports it." : retest ? "No automatic fix credit for disappearance or failure." : "A signal starts a review. It never replaces one.";
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => render(tab.dataset.view, tab.dataset.view === "retest" ? "access" : panel.dataset.finding));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); tabs[next].focus(); tabs[next].click(); }
    });
  });
  cases.forEach(button => button.addEventListener("click", () => render(panel.dataset.view === "retest" ? "evidence" : panel.dataset.view, button.dataset.finding)));
  const motion = $("#motion-toggle");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = preference.matches;
  let visible = true;
  const syncMotion = () => document.body.classList.toggle("motion-paused", paused || !visible || document.hidden);
  function showMotion() {
    syncMotion();
    motion.setAttribute("aria-pressed", String(paused));
    motion.replaceChildren(document.createTextNode(preference.matches ? "Motion off " : paused ? "Resume motion " : "Pause motion "));
    const icon = document.createElement("span"); icon.setAttribute("aria-hidden", "true"); icon.textContent = preference.matches ? "○" : paused ? "▶" : "Ⅱ"; motion.append(icon);
    motion.disabled = preference.matches;
    motion.setAttribute("aria-label", preference.matches ? "Animation disabled by your reduced-motion preference" : paused ? "Resume preview animation" : "Pause preview animation");
  }
  preference.addEventListener("change", () => { paused = preference.matches; showMotion(); });
  showMotion();
  motion.addEventListener("click", () => { paused = !paused; showMotion(); });
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
