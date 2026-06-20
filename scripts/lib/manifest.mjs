import { dirname, basename, join } from "node:path";
import { slugify, dedupe } from "./slugify.mjs";

const DEFAULT_ICON = "📦";

export function buildManifest(projects) {
  const projectSlugs = dedupe(projects.map((p) => slugify(p.config.name)));
  const manifestProjects = [];
  const copies = [];

  projects.forEach((p, i) => {
    const pSlug = projectSlugs[i];
    const pIcon = p.config.icon || DEFAULT_ICON;
    const outSlugs = dedupe(p.config.outputs.map((o) => slugify(o.title)));
    const outputs = p.config.outputs.map((o, j) => {
      const oSlug = outSlugs[j];
      const entry = basename(o.path);
      copies.push({ from: join(p.dir, dirname(o.path)), to: `${pSlug}/${oSlug}` });
      return {
        slug: oSlug,
        title: o.title,
        icon: o.icon || pIcon,
        href: `${pSlug}/${oSlug}/${entry}`,
      };
    });
    manifestProjects.push({
      slug: pSlug,
      name: p.config.name,
      icon: pIcon,
      group: p.config.group || "Other",
      outputs,
    });
  });

  return { manifest: { projects: manifestProjects }, copies };
}
