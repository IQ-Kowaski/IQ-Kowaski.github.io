const USERNAME = "IQ-Kowaski";
const API = "https://api.github.com";
const CACHE_KEY = "loop-portfolio-cache-v1";

const $ = (id) => document.getElementById(id);
const els = {
  avatar: $("avatar"), brandAvatar: $("brandAvatar"), displayName: $("displayName"),
  brandName: $("brandName"), brandSub: $("brandSub"), profileLink: $("profileLink"),
  bioText: $("bioText"), locationText: $("locationText"), lastPush: $("lastPush"),
  blogText: $("blogText"), syncLabel: $("syncLabel"), lastSync: $("lastSync"),
  footSync: $("footSync"), statRepos: $("statRepos"), statStars: $("statStars"),
  statForks: $("statForks"), statFollowers: $("statFollowers"), statFollowingSub: $("statFollowingSub"),
  statReposSub: $("statReposSub"), accountAge: $("accountAge"), spotName: $("spotName"),
  spotDesc: $("spotDesc"), spotLang: $("spotLang"), spotDot: $("spotDot"),
  spotStars: $("spotStars"), spotUpdated: $("spotUpdated"), spotLink: $("spotLink"),
  repoGrid: $("repoGrid"), repoCount: $("repoCount"), langFilter: $("langFilter"),
  sortSelect: $("sortSelect"), searchInput: $("searchInput"), forkToggle: $("forkToggle"),
  langBars: $("langBars"), topicRow: $("topicRow"), timeline: $("timeline"),
  eventCount: $("eventCount"), emptyState: $("emptyState"), toast: $("toast"),
  aboutText: $("aboutText"), ossLine: $("ossLine"),
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
    els.syncLabel.textContent = manual ? "Syncing…" : "Connecting to GitHub…";
    const [profile, repos, events] = await Promise.all([
      fetchJSON(`${API}/users/${USERNAME}`),
      fetchJSON(`${API}/users/${USERNAME}/repos?sort=updated&per_page=100`),
      fetchJSON(`${API}/users/${USERNAME}/events/public?per_page=30`).catch(() => []),
    ]);
    state = { ...state, profile, repos, events };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), profile, repos, events }));
    renderProfile(profile); renderRepos(repos); renderEvents(events);
    const when = new Date().toLocaleTimeString();
    els.syncLabel.textContent = "Live — synced just now";
    els.lastSync.textContent = when;
    els.footSync.textContent = `synced ${when}`;
    if (manual) toast("Synced with GitHub — everything is up to date.");
  } catch (err) {
    console.error(err);
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { profile, repos, events } = JSON.parse(cached);
      renderProfile(profile); renderRepos(repos); renderEvents(events || []);
      els.syncLabel.textContent = "Offline — showing last cached sync";
      toast("GitHub API unreachable — showing cached data.");
    } else {
      els.syncLabel.textContent = "Could not reach GitHub API";
      els.repoGrid.innerHTML = `<p class="muted" style="grid-column:1/-1">Rate-limited or offline. Wait a minute and press Sync. (${escapeHtml(err.message)})</p>`;
    }
  }
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
  };
  $("refreshBtn").onclick = () => sync(true);
  $("refreshBtn2").onclick = () => sync(true);
  const mSync = $("mobileSyncBtn");
  if (mSync) mSync.onclick = () => { $("mobileMenu").classList.remove("open"); sync(true); };
  $("copyBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(`https://github.com/${USERNAME}`); toast("Profile URL copied."); }
    catch { toast(`Profile URL: github.com/${USERNAME}`); }
  };
  $("menuBtn").onclick = () => $("mobileMenu").classList.toggle("open");
  document.querySelectorAll("#mobileMenu a").forEach((a) => (a.onclick = () => $("mobileMenu").classList.remove("open")));
  els.searchInput.oninput = applyFilters;
  els.langFilter.onchange = applyFilters;
  els.sortSelect.onchange = applyFilters;
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

initTheme(); initUI(); sync(false);
setInterval(() => sync(false), 5 * 60 * 1000); // background auto-refresh
