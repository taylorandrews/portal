async function load() {
  const grid = document.getElementById("grid");
  let manifest;
  try {
    manifest = await (await fetch("/manifest.json", { cache: "no-cache" })).json();
  } catch {
    grid.innerHTML = `<p class="empty">No content yet. Run <code>npm run sync</code>.</p>`;
    grid.setAttribute("aria-busy", "false");
    return;
  }

  const groups = new Map();
  for (const p of manifest.projects) {
    if (!groups.has(p.group)) groups.set(p.group, []);
    groups.get(p.group).push(p);
  }

  const tile = (icon, title, href) => `
    <a class="tile" href="/${href}">
      <span class="tile-icon">${icon}</span>
      <span class="tile-title">${title}</span>
    </a>`;

  let html = "";
  for (const [group, projects] of groups) {
    html += `<h2 class="group-label">${group}</h2><div class="tiles">`;
    for (const p of projects) {
      // One tile per output; single-output projects read as one app icon.
      for (const o of p.outputs) {
        const title = p.outputs.length > 1 ? `${p.name} · ${o.title}` : p.name;
        html += tile(o.icon, title, o.href);
      }
    }
    html += `</div>`;
  }
  grid.innerHTML = html || `<p class="empty">No projects registered yet.</p>`;
  grid.setAttribute("aria-busy", "false");
}
load();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
