const ICON_DIR = "/icons/projects";
const isImage = (s) => /\.(svg|png|webp)$/i.test(String(s || ""));

/* Each project gets a stable gradient tilt from its slug, so a new project
   looks like part of the set without anyone choosing an angle. Override with
   "angle" in portal.json. */
function angleFor(slug) {
  let h = 0;
  for (const ch of String(slug)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return 135 + (h % 5) * 18;
}

function tile(project, output) {
  const a = document.createElement("a");
  a.className = "tile";
  a.href = "/" + output.href;

  const art = document.createElement("div");
  art.className = "tile-art";
  const angle = output.angle || project.angle || angleFor(project.slug);
  art.style.setProperty("--angle", angle + "deg");

  const src = isImage(output.icon) ? output.icon
    : isImage(project.icon) ? project.icon
    : ICON_DIR + "/" + project.slug + ".svg";
  const img = document.createElement("img");
  img.src = src.startsWith("/") || src.startsWith("http") ? src : "/" + src;
  img.alt = "";
  img.addEventListener("error", () => {
    const span = document.createElement("span");
    span.className = "emoji";
    span.textContent = output.icon || project.icon || "";
    img.replaceWith(span);
  });
  art.appendChild(img);

  const title = document.createElement("span");
  title.className = "tile-title";
  title.textContent = project.outputs.length > 1
    ? project.name + " · " + output.title
    : project.name;

  a.append(art, title);
  return a;
}

async function load() {
  const grid = document.getElementById("grid");
  let manifest;
  try {
    manifest = await (await fetch("/manifest.json", { cache: "no-cache" })).json();
  } catch {
    grid.innerHTML = '<p class="empty">No content yet. Run <code>npm run sync</code>.</p>';
    grid.setAttribute("aria-busy", "false");
    return;
  }

  // One tile per output, in manifest order — no groups.
  const frag = document.createDocumentFragment();
  for (const p of manifest.projects) for (const o of p.outputs) frag.appendChild(tile(p, o));

  grid.replaceChildren(frag);
  if (!grid.childElementCount) grid.innerHTML = '<p class="empty">No projects registered yet.</p>';
  grid.setAttribute("aria-busy", "false");
}
load();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
