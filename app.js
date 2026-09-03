const USERNAME = "IQ-Kowaski";
const API = "https://api.github.com";
const CACHE_KEY = "loop-portfolio-cache-v1";

const $ = (id) => document.getElementById(id);
const els = {
  avatar: $("avatar"), brandAvatar: $("brandAvatar"), displayName: $("displayName"),
  brandName: $("brandName"), brandSub: $("brandSub"), profileLink: $("profileLink"),
  bioText: $("bioText"), locationText: $("locationText"), lastPush: $("lastPush"),
  blogText: $("blogText"), lastSync: $("lastSync"),
  footSync: $("footSync"), statRepos: $("statRepos"), statStars: $("statStars"),
  statForks: $("statForks"), statFollowers: $("statFollowers"), statFollowingSub: $("statFollowingSub"),
  statReposSub: $("statReposSub"), accountAge: $("accountAge"), spotName: $("spotName"),
  spotDesc: $("spotDesc"), spotLang: $("spotLang"), spotDot: $("spotDot"),
  spotStars: $("spotStars"), spotUpdated: $("spotUpdated"), spotLink: $("spotLink"),
  repoGrid: $("repoGrid"), repoCount: $("repoCount"), langFilter: $("langFilter"),
  sortSelect: $("sortSelect"), searchInput: $("searchInput"), forkToggle: $("forkToggle"),
  langBars: $("langBars"), topicRow: $("topicRow"), timeline: $("timeline"),
  eventCount: $("eventCount"), emptyState: $("emptyState"), toast: $("toast"),
  aboutText: $("aboutText"), ossLine: $("ossLine"), contactGrid: $("contactGrid"),
};

let state = { profile: null, repos: [], events: [], includeForks: true };

const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26", CSS: "#563d7c",
  Python: "#3572A5", Java: "#b07219", "C++": "#f34b7d", Go: "#00ADD8",
  Rust: "#dea584", Shell: "#89e051", Dockerfile: "#384d54",
};
const langColor = (l) => LANG_COLORS[l] || "#6d8bff";

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.add("hidden"), 2600);
}
function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 2592000) return Math.floor(s / 86400) + "d ago";
  return new Date(iso).toLocaleDateString();
}
function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
}
async function fetchJSON(url) {
  const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error(`GitHub API ${r.status} for ${url}`);
  const remaining = r.headers.get("x-ratelimit-remaining");
  if (remaining !== null && Number(remaining) < 5) toast("GitHub rate limit nearly exhausted — showing cached data soon.");
  return r.json();
}

/* ---------- renderers ---------- */
function renderProfile(p) {
  const name = p.name || p.login;
  els.displayName.textContent = name;
  els.brandName.textContent = name;
  els.brandSub.textContent = `@${p.login} · live`;
  document.title = `${name} (@${p.login}) — Developer Portfolio`;
  els.profileLink.textContent = `@${p.login}`;
  els.profileLink.href = p.html_url;
  $("githubBtn").href = p.html_url;
  $("followBtn").href = p.html_url;
  els.avatar.src = `${p.avatar_url}&s=320`;
  els.avatar.alt = `GitHub profile photo of ${name}`;
  els.brandAvatar.src = `${p.avatar_url}&s=64`;
  $("favicon").href = `${p.avatar_url}&s=64`;
  els.bioText.textContent = p.bio || "Building practical, real-world software — downloader tools, cross-platform desktop apps, and utilities people actually keep using.";
  els.aboutText.textContent = p.bio || els.aboutText.textContent;
  els.locationText.textContent = p.location || "Working from anywhere";
  els.blogText.textContent = (p.blog || "github.com/" + p.login).replace(/^https?:\/\//, "");
  els.statFollowers.textContent = p.followers ?? 0;
  els.statFollowingSub.textContent = `${p.following ?? 0} following`;
  els.statRepos.textContent = p.public_repos ?? state.repos.length;
  els.statReposSub.textContent = `updated ${timeAgo(p.updated_at)}`;
  els.accountAge.textContent = `on GitHub since ${new Date(p.created_at).getFullYear()}`;
  els.ossLine.textContent = `${p.public_repos} public repositories and counting.`;
  renderContact(p);
}

const CONTACT_ICONS = {
  github: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.14c0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>',
  web: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.9 5.7 3.9 9S14.5 18.4 12 21c-2.5-2.6-3.9-5.7-3.9-9S9.5 5.6 12 3z"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.6 2H8l4.4 5.9L18.9 2zm-1.1 17.8h1.7L7.1 3.9H5.3l12.5 15.9z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></svg>',
};
function contactCard({ icon, title, sub, href }) {
  return `<a class="contact-card" href="${href}" ${href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>
    <span class="contact-icon">${CONTACT_ICONS[icon]}</span>
    <span class="contact-text"><strong>${title}</strong><small>${escapeHtml(sub)}</small></span>
    <svg class="contact-go" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
  </a>`;
}
function renderContact(p) {  if (!els.contactGrid) return;
  const cards = [{ icon: "github", title: "GitHub", sub: `@${p.login}`, href: p.html_url }];
  if (p.blog) {
    const url = p.blog.startsWith("http") ? p.blog : `https://${p.blog}`;
    cards.push({ icon: "web", title: "Website", sub: p.blog.replace(/^https?:\/\//, ""), href: url });
  }
  if (p.twitter_username) {
    cards.push({ icon: "x", title: "X (Twitter)", sub: `@${p.twitter_username}`, href: `https://x.com/${p.twitter_username}` });
  }
  if (p.email) {
    cards.push({ icon: "mail", title: "Email", sub: p.email, href: `mailto:${p.email}` });
  }
  els.contactGrid.innerHTML = cards.map(contactCard).join("");
}

function repoCard(r) {
  const desc = r.description || "No description yet — check the code, it speaks for itself.";
  const lang = r.language ? `<span class="tag"><span class="lang-dot" style="background:${langColor(r.language)};width:8px;height:8px"></span> ${r.language}</span>` : "";
  const topics = (r.topics || []).slice(0, 3).map((t) => `<span class="tag">#${t}</span>`).join("");
  return `<article class="repo-card neu-flat">
    <div class="repo-top">
      <h3 class="repo-name"><a href="${r.html_url}" target="_blank" rel="noopener">${r.name}</a></h3>
      ${r.fork ? `<span class="badge">Fork</span>` : r.stargazers_count > 0 ? `<span class="badge">★ ${r.stargazers_count}</span>` : `<span class="badge">${r.visibility || "Public"}</span>`}
    </div>
    <p class="repo-desc">${escapeHtml(desc)}</p>
    <div class="repo-tags">${lang}${topics}</div>
    <div class="repo-foot">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>${r.stargazers_count}</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M8 7h5a3 3 0 0 1 3 3v1M8 17h5a3 3 0 0 0 3-3v-1"/></svg>${r.forks_count}</span>
      <span>Updated ${timeAgo(r.pushed_at || r.updated_at)}</span>
    </div>
    <div class="repo-links">
      <a class="mini-btn primary" href="${r.html_url}" target="_blank" rel="noopener">Code</a>
      <button class="mini-btn" data-readme="${escapeHtml(r.name)}" data-url="${r.html_url}">Details</button>
      ${r.homepage ? `<a class="mini-btn" href="${r.homepage.startsWith("http") ? r.homepage : "https://" + r.homepage}" target="_blank" rel="noopener">Live demo</a>` : `<a class="mini-btn" href="${r.html_url}/archive/refs/heads/${r.default_branch}.zip">Download</a>`}
    </div>
  </article>`;
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function applyFilters() {
  const q = els.searchInput.value.trim().toLowerCase();
  const lang = els.langFilter.value;
  const sort = els.sortSelect.value;
  let list = [...state.repos];
  if (!state.includeForks) list = list.filter((r) => !r.fork);
  if (lang) list = list.filter((r) => r.language === lang);
  if (q) list = list.filter((r) => (r.name + " " + (r.description || "")).toLowerCase().includes(q));
  list.sort((a, b) => {
    if (sort === "stars") return b.stargazers_count - a.stargazers_count;
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "size") return b.size - a.size;
    return new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
  });
  els.repoCount.textContent = list.length;
  els.repoGrid.innerHTML = list.length ? list.map(repoCard).join("") : "";
  els.emptyState.classList.toggle("hidden", list.length > 0);
}

function renderRepos(repos) {
  const stars = repos.reduce((n, r) => n + r.stargazers_count, 0);
  const forks = repos.reduce((n, r) => n + r.forks_count, 0);
  els.statStars.textContent = stars;
  els.statForks.textContent = forks;
  const latest = [...repos].sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at))[0];
  if (latest) {
    els.spotName.textContent = latest.name;
    els.spotDesc.textContent = latest.description || "Most recently pushed repository — open it to see what's inside.";
    els.spotLang.textContent = latest.language || "Mixed";
    els.spotDot.style.background = langColor(latest.language);
    els.spotStars.textContent = `★ ${latest.stargazers_count} · ⑂ ${latest.forks_count}`;
    els.spotUpdated.textContent = timeAgo(latest.pushed_at);
    els.spotLink.href = latest.html_url;
    els.lastPush.textContent = timeAgo(latest.pushed_at);
  }
  const langs = {};
  repos.forEach((r) => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
  const entries = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = entries.reduce((n, [, c]) => n + c, 0) || 1;
  els.langBars.innerHTML = entries.length ? entries.map(([l, c]) => {
    const pct = Math.round((c / total) * 100);
    return `<div class="lang-row"><strong>${l}</strong><div class="lang-bar"><div class="lang-fill" style="width:${pct}%;background:${langColor(l)}"></div></div><span>${pct}%</span></div>`;
  }).join("") : `<p class="muted">No language data yet.</p>`;
  const langSet = [...new Set(repos.map((r) => r.language).filter(Boolean))].sort();
  els.langFilter.innerHTML = `<option value="">All languages</option>` + langSet.map((l) => `<option>${l}</option>`).join("");
  const topics = [...new Set(repos.flatMap((r) => r.topics || []))].slice(0, 10);
  els.topicRow.innerHTML = topics.map((t) => `<span class="tag">#${t}</span>`).join("") || `<span class="tag">open-source</span><span class="tag">live-from-github</span>`;
  applyFilters();
}

function renderEvents(events) {
  els.eventCount.textContent = `${events.length} events`;
  if (!events.length) { els.timeline.innerHTML = `<li>No public activity in the last 90 days.</li>`; return; }
  els.timeline.innerHTML = events.slice(0, 9).map((e) => {
    const repo = e.repo ? e.repo.name.replace(USERNAME + "/", "") : "unknown";
    let action = e.type.replace("Event", "");
    if (e.type === "PushEvent") action = `Pushed ${e.payload.commits?.length || 1} commit${(e.payload.commits?.length || 1) > 1 ? "s" : ""} to <strong>${repo}</strong>`;
    else if (e.type === "CreateEvent") action = `Created <strong>${repo}</strong>`;
    else if (e.type === "WatchEvent") action = `Starred <strong>${repo}</strong>`;
    else if (e.type === "ForkEvent") action = `Forked <strong>${repo}</strong>`;
    else if (e.type === "IssuesEvent") action = `${e.payload.action} issue in <strong>${repo}</strong>`;
    else if (e.type === "PullRequestEvent") action = `${e.payload.action} PR in <strong>${repo}</strong>`;
    else action = `${action} · <strong>${repo}</strong>`;
    return `<li>${action}<time>${timeAgo(e.created_at)} · ${fmtDate(e.created_at)}</time></li>`;
  }).join("");
}

/* ---------- sync ---------- */
async function sync(manual = false) {
  try {
    const [profile, repos, events] = await Promise.all([
      fetchJSON(`${API}/users/${USERNAME}`),
      fetchJSON(`${API}/users/${USERNAME}/repos?sort=updated&per_page=100`),
      fetchJSON(`${API}/users/${USERNAME}/events/public?per_page=30`).catch(() => []),
    ]);
    state = { ...state, profile, repos, events };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), profile, repos, events }));
    renderProfile(profile); renderRepos(repos); renderEvents(events);
    const when = new Date().toLocaleTimeString();
    els.lastSync.textContent = when;
    els.footSync.textContent = `synced ${when}`;
    if (manual) toast("Synced with GitHub — everything is up to date.");
  } catch (err) {
    console.error(err);
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { profile, repos, events } = JSON.parse(cached);
      renderProfile(profile); renderRepos(repos); renderEvents(events || []);
      toast("GitHub API unreachable — showing cached data.");
    } else {
      els.repoGrid.innerHTML = `<p class="muted" style="grid-column:1/-1">Rate-limited or offline. Wait a minute and press Sync. (${escapeHtml(err.message)})</p>`;
    }
  }
}

/* ---------- github stat images (theme-aware) ---------- */
const STAT_THEMES = {
  light: { bg: "e0e5ec", title: "2f54eb", text: "263040", icon: "2f54eb", border: "a8b5c9" },
  dark: { bg: "171b22", title: "8fa4ff", text: "eef2f8", icon: "8fa4ff", border: "232a36" },
};
function renderStatImages() {
  const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const c = STAT_THEMES[theme];
  const base = `bg_color=${c.bg}&title_color=${c.title}&text_color=${c.text}&icon_color=${c.icon}&border_color=${c.border}&hide_border=true`;
  const urls = {
    stats: `https://github-readme-stats.vercel.app/api?username=${USERNAME}&show_icons=true&include_all_commits=true&${base}`,
    streak: `https://github-readme-streak-stats.herokuapp.com?user=${USERNAME}&hide_border=true&background=${c.bg}&ring=${c.title}&fire=${c.title}&currStreakNum=${c.text}&sideNums=${c.text}&currStreakLabel=${c.title}&sideLabels=${c.text}&dates=${c.text}`,
    langs: `https://github-readme-stats.vercel.app/api/top-langs/?username=${USERNAME}&layout=compact&${base}`,
  };
  document.querySelectorAll("img[data-stat]").forEach((img) => {
    const kind = img.getAttribute("data-stat");
    if (urls[kind] && img.src !== urls[kind]) img.src = urls[kind];
    img.onerror = () => { const fig = img.closest(".stat-img"); if (fig) fig.style.display = "none"; };
  });
}

/* ---------- readme deep-dive ---------- */
const readmeCache = {};
function sanitizeReadme(html) {
  return html.replace(/<script[\s\S]*?<\/script\s*>/gi, "").replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
}
function renderMarkdown(md) {
  if (window.marked) return sanitizeReadme(window.marked.parse(md));
  return `<pre style="white-space:pre-wrap">${escapeHtml(md.slice(0, 4000))}</pre>`;
}
async function openReadme(name, url) {
  const modal = $("readmeModal");
  if (!modal) return;
  $("readmeTitle").textContent = name;
  $("readmeSub").textContent = `github.com/${USERNAME}/${name}`;
  $("readmeOpen").href = url;
  $("readmeBody").innerHTML = `<p class="muted">Loading README…</p>`;
  modal.classList.remove("hidden");
  document.body.classList.add("readme-open");
  const cached = readmeCache[name] || JSON.parse(localStorage.getItem(`loop-readme-${name}`) || "null");
  if (cached && Date.now() - cached.at < 24 * 3600 * 1000) {
    readmeCache[name] = cached;
    $("readmeBody").innerHTML = renderMarkdown(cached.text);
    return;
  }
  try {
    const r = await fetch(`${API}/repos/${USERNAME}/${name}/readme`, { headers: { Accept: "application/vnd.github.raw" } });
    if (!r.ok) throw new Error(`README ${r.status}`);
    const text = await r.text();
    readmeCache[name] = { at: Date.now(), text };
    try { localStorage.setItem(`loop-readme-${name}`, JSON.stringify(readmeCache[name])); } catch (_) {}
    $("readmeBody").innerHTML = renderMarkdown(text);
    $("readmeBody").scrollTop = 0;
  } catch (err) {
    const repo = state.repos.find((x) => x.name === name);
    const desc = (repo && repo.description) || "No README in this repository yet.";
    $("readmeBody").innerHTML = `<p>${escapeHtml(desc)}</p><p class="muted">Open it on GitHub to see the code.</p>`;
  }
}
function closeReadme() {
  const modal = $("readmeModal");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.classList.remove("readme-open");
}

/* ---------- theme / ui ---------- */
function initTheme() {
  const saved = localStorage.getItem("loop-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = saved;
}
function initUI() {
  $("themeToggle").onclick = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("loop-theme", next);
    renderStatImages();
  };
  $("refreshBtn").onclick = () => sync(true);
  $("refreshBtn2").onclick = () => sync(true);
  const mSync = $("mobileSyncBtn");
  if (mSync) mSync.onclick = () => { $("mobileMenu").classList.remove("open"); sync(true); };
  // avatar lightbox
  const ring = $("avatarRing"), box = $("lightbox");
  const openBox = (e) => {
    if (e) e.stopPropagation();
    if (!box) return;
    const base = (state.profile && state.profile.avatar_url) || (els.avatar && els.avatar.src ? els.avatar.src.split("&s=")[0] : null) || "https://avatars.githubusercontent.com/u/224281476?v=4";
    $("lightboxImg").src = `${base}${base.includes("?") ? "&" : "?"}s=640`;
    const nm = (state.profile && (state.profile.name || state.profile.login)) || "Loop";
    $("lightboxName").textContent = nm;
    $("lightboxSub").textContent = `@${(state.profile && state.profile.login) || USERNAME}`;
    $("lightboxImg").alt = `Enlarged GitHub profile photo of ${nm}`;
    box.classList.remove("hidden");
    document.body.classList.add("lightbox-open");
  };
  const closeBox = () => { if (!box) return; box.classList.add("hidden"); document.body.classList.remove("lightbox-open"); };
  if (ring && box) {
    ring.addEventListener("click", openBox);
    ring.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBox(); } });
    $("lightboxClose").addEventListener("click", closeBox);
    $("lightboxBackdrop").addEventListener("click", closeBox);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.classList.contains("hidden")) closeBox(); });
  }
  const brandMark = $("brandAvatarWrap");
  if (brandMark && box) brandMark.addEventListener("click", (e) => { e.preventDefault(); openBox(e); });
  $("copyBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(`https://github.com/${USERNAME}`); toast("Profile URL copied."); }
    catch { toast(`Profile URL: github.com/${USERNAME}`); }
  };
  $("menuBtn").onclick = () => $("mobileMenu").classList.toggle("open");
  document.querySelectorAll("#mobileMenu a").forEach((a) => (a.onclick = () => $("mobileMenu").classList.remove("open")));
  els.searchInput.oninput = applyFilters;
  els.langFilter.onchange = applyFilters;
  els.sortSelect.onchange = applyFilters;
  els.repoGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-readme]");
    if (btn) openReadme(btn.getAttribute("data-readme"), btn.getAttribute("data-url"));
  });
  $("readmeClose").addEventListener("click", closeReadme);
  $("readmeBackdrop").addEventListener("click", closeReadme);
  document.addEventListener("keydown", (e) => {
    const m = $("readmeModal");
    if (e.key === "Escape" && m && !m.classList.contains("hidden")) closeReadme();
  });
  $("resetFilters").onclick = () => { els.searchInput.value = ""; els.langFilter.value = ""; els.sortSelect.value = "updated"; state.includeForks = true; els.forkToggle.setAttribute("aria-pressed", "true"); applyFilters(); };
  els.forkToggle.onclick = () => {
    state.includeForks = !state.includeForks;
    els.forkToggle.setAttribute("aria-pressed", String(state.includeForks));
    els.forkToggle.classList.toggle("active", !state.includeForks);
    els.forkToggle.textContent = state.includeForks ? "Include forks" : "Hide forks";
    applyFilters();
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("visible")), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

initTheme(); initUI(); renderStatImages(); sync(false);
setInterval(() => sync(false), 5 * 60 * 1000); // background auto-refresh
