/* Human → Builder / interactions. No API keys, accounts, or background jobs. */
(function () {
  "use strict";
  const data = window.PORTFOLIO_DATA;
  if (!data || !Array.isArray(data.projects) || !Array.isArray(data.chapters)) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escape = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const safeUrl = (value) => {
    try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; } catch (_) { return ""; }
  };
  const readPreference = () => { try { return window.localStorage.getItem("htb-motion"); } catch (_) { return null; } };
  const media = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  let motionEnabled = !media.matches && readPreference() !== "off";
  let recruiterMode = false;
  let activeChapter = -1;
  let toastTimer = 0;
  let opener = null;
  const visual = window.JourneyVisual || { setProgress() {}, setMotionEnabled() {} };
  const shortTitles = ["Hello, new world.", "A prompt. A possibility.", "Build the pipeline.", "Design the system.", "Connect the ecosystem."];

  function announce(message) {
    const toast = $("#toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function applyMotion() {
    document.documentElement.classList.toggle("motion-paused", !motionEnabled);
    const button = $("#motion-toggle");
    if (button) {
      button.setAttribute("aria-pressed", String(!motionEnabled));
      button.setAttribute("aria-label", motionEnabled ? "Pause decorative motion" : "Enable decorative motion");
      $(".motion-icon", button).textContent = motionEnabled ? "Ⅱ" : "▶";
      $(".motion-label", button).textContent = motionEnabled ? "Motion on" : "Motion paused";
    }
    visual.setMotionEnabled(motionEnabled && !recruiterMode);
  }
  $("#motion-toggle")?.addEventListener("click", () => {
    motionEnabled = !motionEnabled;
    try { window.localStorage.setItem("htb-motion", motionEnabled ? "on" : "off"); } catch (_) {}
    applyMotion();
    announce(motionEnabled ? "Decorative motion enabled." : "Decorative motion paused.");
  });
  if (media.addEventListener) media.addEventListener("change", (event) => {
    if (event.matches) { motionEnabled = false; applyMotion(); }
    else if (readPreference() !== "off") { motionEnabled = true; applyMotion(); }
  });

  function illustration(id) {
    if (id === "factory") return '<div class="factory-art" aria-hidden="true"><span>INTENT</span><span>ASSETS</span><span>RENDER</span><span>REVIEW</span></div>';
    if (id === "studio-v2") return '<div class="system-art" aria-hidden="true"><span>STRATEGY</span><span>PREPARE</span><span>EXPORT</span><span>HUMAN</span></div>';
    if (id === "commerce") return '<div class="commerce-art" aria-hidden="true"><div class="mini-store"><b>Yula.</b>JOURNAL</div><div class="mini-store"><b>Finds.</b>DISCOVER</div><div class="mini-store"><b>Aria.</b>EXPLORE</div></div>';
    return '<div class="publisher-art" aria-hidden="true"><div class="browser-line">YULA ARIA / PUBLISHER</div><strong>A clear foundation.</strong><div class="paper-links"><span>PRIVACY</span><span>TERMS</span><span>DATA DELETION</span></div></div>';
  }

  const projectGrid = $("#project-grid");
  if (projectGrid) projectGrid.innerHTML = data.projects.map((project, index) => {
    return '<article class="project-card reveal" id="project-' + escape(project.id) + '">' +
      '<div class="project-visual"><span class="visual-label">WORKFLOW ILLUSTRATION</span><span class="project-no">0' + (index + 1) + '</span>' + illustration(project.id) + '</div>' +
      '<div class="project-info"><p class="project-kicker">' + escape(project.kicker) + '</p><h3>' + escape(project.title) + '</h3><p>' + escape(project.summary) + '</p>' +
      '<div class="project-tags">' + project.stack.map((tag) => '<span>' + escape(tag) + '</span>').join("") + '</div>' +
      '<div class="project-bottom"><span class="project-status">' + escape(project.status) + '</span><button class="case-button" type="button" data-project="' + escape(project.id) + '" aria-label="Open case file: ' + escape(project.title) + '">Open case file <span aria-hidden="true">↗</span></button></div></div></article>';
  }).join("");

  const skills = $("#skills-list");
  if (skills) skills.innerHTML = data.skills.map((skill, index) =>
    '<article class="skill-row reveal"><span class="skill-number">0' + (index + 1) + '</span><div><h3 class="skill-name">' + escape(skill.name) + '</h3><div class="skill-tools">' + skill.tools.map((tool) => '<span>' + escape(tool) + '</span>').join("") + '</div></div><p class="skill-evidence">' + escape(skill.evidence) + '</p></article>'
  ).join("");
  if (data.recruiter?.summary && $("#recruiter-intro")) $("#recruiter-intro").textContent = data.recruiter.summary;

  const chapterList = $("#chapter-list");
  if (chapterList) chapterList.innerHTML = data.chapters.map((chapter, index) =>
    '<button class="chapter-step" type="button" data-chapter="' + index + '" aria-pressed="' + String(index === 0) + '" aria-label="Chapter ' + (index + 1) + ': ' + escape(chapter.label) + '" title="' + escape(chapter.label) + '">0' + (index + 1) + '</button>'
  ).join("");

  function setChapter(index) {
    if (index === activeChapter || !data.chapters[index]) return;
    activeChapter = index;
    const chapter = data.chapters[index];
    const fields = { "#chapter-era": chapter.era, "#chapter-title": shortTitles[index] || chapter.title, "#chapter-summary": chapter.summary, "#chapter-detail": chapter.detail, "#chapter-unlock": chapter.unlock, "#journey-counter": String(index + 1).padStart(2, "0") + " / " + String(data.chapters.length).padStart(2, "0") };
    for (const [selector, value] of Object.entries(fields)) { const element = $(selector); if (element) element.textContent = value; }
    $$(".chapter-step").forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    if ($("#signal-journey")) $("#signal-journey").dataset.scene = chapter.scene;
  }

  let scrollQueued = false;
  const journey = $("#signal-journey");
  const scrub = $("#journey-scrub");
  function updateJourney() {
    scrollQueued = false;
    if (!journey || recruiterMode) return;
    const rect = journey.getBoundingClientRect();
    const distance = Math.max(1, journey.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / distance);
    visual.setProgress(progress);
    setChapter(Math.min(data.chapters.length - 1, Math.floor(progress * data.chapters.length)));
    if (scrub && document.activeElement !== scrub) scrub.value = String(Math.round(progress * 100));
    if ($("#journey-progress")) $("#journey-progress").textContent = String(Math.round(progress * 100)).padStart(2, "0") + "%";
    if (scrub) scrub.setAttribute("aria-valuetext", Math.round(progress * 100) + "%, " + data.chapters[activeChapter].label);
  }
  function queueJourney() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateJourney);
  }
  function goToProgress(progress, smooth) {
    if (!journey) return;
    const rect = journey.getBoundingClientRect();
    const distance = Math.max(1, journey.offsetHeight - window.innerHeight);
    const top = window.scrollY + rect.top + clamp(progress) * distance;
    window.scrollTo({ top, behavior: smooth && motionEnabled ? "smooth" : "instant" });
    visual.setProgress(clamp(progress));
    setChapter(Math.min(data.chapters.length - 1, Math.floor(clamp(progress) * data.chapters.length)));
    queueJourney();
  }
  chapterList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chapter]");
    if (!button) return;
    const index = Number(button.dataset.chapter);
    goToProgress(index / Math.max(1, data.chapters.length - 1), true);
  });
  scrub?.addEventListener("input", () => goToProgress(Number(scrub.value) / 100, false));
  window.addEventListener("scroll", queueJourney, { passive: true });
  window.addEventListener("resize", queueJourney, { passive: true });

  const dialog = $("#case-dialog");
  function openCase(id, button) {
    const project = data.projects.find((item) => item.id === id);
    if (!project || !dialog) return;
    opener = button;
    const source = project.source ? safeUrl(project.source) : "";
    $("#case-content").innerHTML = '<p class="eyebrow orange">' + escape(project.kicker) + '</p><h2 id="case-title">' + escape(project.title) + '</h2>' +
      '<p class="case-summary">' + escape(project.summary) + '</p><div class="project-tags">' + project.stack.map((tag) => '<span>' + escape(tag) + '</span>').join("") + '</div>' +
      '<h3>The problem</h3><p>' + escape(project.problem) + '</p><h3>The approach</h3><ul>' + project.approach.map((step) => '<li>' + escape(step) + '</li>').join("") + '</ul>' +
      '<h3>What exists</h3><p>' + escape(project.outcome) + '</p><div class="case-boundary"><strong>CURRENT BOUNDARY / ' + escape(project.status.toUpperCase()) + '</strong><p>' + escape(project.boundary) + '</p></div>' +
      (source ? '<a class="text-link" href="' + escape(source) + '" target="_blank" rel="noopener noreferrer">Explore the public source <span aria-hidden="true">↗</span></a>' : "");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.body.classList.add("dialog-open");
    $("#close-case").focus();
  }
  function closeCase() {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    document.body.classList.remove("dialog-open");
    if (opener?.isConnected) opener.focus();
  }
  projectGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-project]");
    if (button) openCase(button.dataset.project, button);
  });
  $("#close-case")?.addEventListener("click", closeCase);
  dialog?.addEventListener("cancel", (event) => { event.preventDefault(); closeCase(); });
  dialog?.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeCase();
  });
  dialog?.addEventListener("close", () => document.body.classList.remove("dialog-open"));

  const terminalReplies = {
    hello: { human: "Do I… introduce myself?", system: "Name accepted. Confidence optional. Curiosity looks promising." },
    automate: { human: "Can you automate this?", system: "First tell me what “this” is. A surprisingly useful first requirement." },
    build: { human: "Let's build something.", system: "Now we're getting somewhere. Start with one useful problem." }
  };
  $$(".terminal-prompts button").forEach((button) => button.addEventListener("click", () => {
    const reply = terminalReplies[button.dataset.prompt];
    if (!reply) return;
    $("#terminal-log").innerHTML = '<p><span class="terminal-human">HUMAN &gt;</span> ' + escape(reply.human) + '</p><p><span class="terminal-system">SYSTEM &gt;</span> ' + escape(reply.system) + '</p>';
  }));

  let scenario = "happy";
  let labTimers = [];
  let runId = 0;
  const nodes = $$("#pipeline li");
  const labStatus = $("#lab-status");
  const runButton = $("#run-lab");
  function resetLab(message) {
    runId += 1;
    labTimers.forEach((timer) => window.clearTimeout(timer));
    labTimers = [];
    nodes.forEach((node) => { node.classList.remove("is-active", "is-done", "is-blocked"); });
    if (runButton) { runButton.disabled = false; runButton.innerHTML = 'Run simulation <span aria-hidden="true">↗</span>'; }
    if (message && labStatus) labStatus.textContent = message;
  }
  function markNode(index, status) {
    if (!nodes[index]) return;
    nodes[index].classList.remove("is-active", "is-done", "is-blocked");
    nodes[index].classList.add("is-" + status);
  }
  $$(".scenario-options button").forEach((button) => button.addEventListener("click", () => {
    scenario = button.dataset.scenario;
    $$(".scenario-options button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    resetLab("Scenario selected: " + button.textContent + ". Ready to simulate.");
  }));
  runButton?.addEventListener("click", () => {
    resetLab();
    const thisRun = runId;
    runButton.disabled = true;
    runButton.textContent = "Simulating…";
    const delay = motionEnabled ? 650 : 300;
    const events = [
      () => { markNode(0, "active"); labStatus.textContent = "01 / Intent becomes a structured JSON job with a defined output."; },
      () => { markNode(0, "done"); markNode(1, "active"); labStatus.textContent = "02 / Assets and metadata are prepared; source details stay with the files."; }
    ];
    if (scenario === "recover") {
      events.push(
        () => { markNode(1, "blocked"); labStatus.textContent = "02 / Simulated interruption. The job state is retained instead of starting blindly again."; },
        () => { markNode(1, "active"); labStatus.textContent = "02 / Retry resumes the interrupted step and reuses valid cached outputs."; }
      );
    }
    events.push(() => { markNode(1, "done"); markNode(2, "active"); labStatus.textContent = "03 / Validate required assets, metadata and output quality."; });
    if (scenario === "review") {
      events.push(() => { markNode(2, "blocked"); labStatus.textContent = "HOLD / A required media asset is missing. Export stays blocked until the issue is corrected and reviewed."; });
    } else {
      events.push(
        () => { markNode(2, "done"); markNode(3, "active"); labStatus.textContent = "04 / A human checks the result. Approval is explicit; it is not inferred from a timer."; },
        () => { markNode(3, "done"); markNode(4, "active"); labStatus.textContent = "05 / For this demo, assume owner approval. Package the reviewable output."; },
        () => { markNode(4, "done"); labStatus.textContent = scenario === "recover" ? "COMPLETE / The simulated retry recovered without repeating valid preparation. Output is ready for handoff." : "COMPLETE / A simulated output package is ready for handoff. Publishing remains a separate decision."; }
      );
    }
    events.forEach((event, index) => {
      labTimers.push(window.setTimeout(() => {
        if (runId !== thisRun) return;
        event();
        if (index === events.length - 1) {
          runButton.disabled = false;
          runButton.innerHTML = 'Run again <span aria-hidden="true">↗</span>';
        }
      }, index * delay));
    });
  });

  function setRecruiterMode(enabled, move = true) {
    recruiterMode = enabled;
    document.body.classList.toggle("recruiter-mode", enabled);
    $("#recruiter-summary").hidden = !enabled;
    const button = $("#recruiter-toggle");
    button.setAttribute("aria-pressed", String(enabled));
    button.innerHTML = enabled ? 'Full experience <span aria-hidden="true">↗</span>' : 'Recruiter view <span aria-hidden="true">↗</span>';
    applyMotion();
    if (move) window.scrollTo({ top: 0, behavior: "instant" });
    if (!enabled) queueJourney();
  }
  $("#recruiter-toggle")?.addEventListener("click", () => setRecruiterMode(!recruiterMode));
  $("#print-profile")?.addEventListener("click", () => window.print());
  $$('a[href^="#"]').forEach((link) => link.addEventListener("click", () => {
    const target = document.getElementById(link.getAttribute("href").slice(1));
    if (recruiterMode && target?.closest(".experience-only")) setRecruiterMode(false, false);
    if ($("#mobile-nav") && !$("#mobile-nav").hidden) toggleMenu(false);
  }));
  function toggleMenu(enabled) {
    $("#mobile-nav").hidden = !enabled;
    const button = $("#menu-toggle");
    button.setAttribute("aria-expanded", String(enabled));
    button.setAttribute("aria-label", enabled ? "Close navigation" : "Open navigation");
  }
  $("#menu-toggle")?.addEventListener("click", () => toggleMenu($("#mobile-nav").hidden));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !$("#mobile-nav").hidden) toggleMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 760) toggleMenu(false); }, { passive: true });

  $("#play-film")?.addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/wjZofJX0v4M?autoplay=1&rel=0";
    frame.title = "Transformers, the tech behind LLMs — 3Blue1Brown";
    frame.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allowFullscreen = true;
    $("#film-frame").replaceChildren(frame);
    frame.focus();
  });

  const revealElements = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 30px 0px" });
    revealElements.forEach((element) => observer.observe(element));
    const navObserver = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        $$(".desktop-nav a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
      });
    }, { rootMargin: "-15% 0px -55% 0px", threshold: 0 });
    ["journey", "projects", "capabilities"].forEach((id) => { const section = document.getElementById(id); if (section) navObserver.observe(section); });
    document.documentElement.classList.add("js");
  } else revealElements.forEach((element) => element.classList.add("is-visible"));
  applyMotion();
  setChapter(0);
  updateJourney();
  window.addEventListener("pagehide", () => { resetLab(); }, { once: true });
})();
