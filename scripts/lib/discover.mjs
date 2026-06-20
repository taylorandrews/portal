import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";

function validate(config) {
  if (typeof config?.name !== "string" || !config.name.trim()) return "missing 'name'";
  if (!Array.isArray(config.outputs) || config.outputs.length === 0) return "missing 'outputs'";
  for (const o of config.outputs) {
    if (typeof o?.title !== "string" || !o.title.trim()) return "an output is missing 'title'";
    if (typeof o?.path !== "string" || !o.path.trim()) return "an output is missing 'path'";
    // The whole directory containing the entry file is copied, so a root-level
    // entry would copy the entire repo (incl. .git). Require a subdirectory and
    // forbid path traversal.
    if (o.path.startsWith("/") || o.path.split(/[\\/]/).includes(".."))
      return `output '${o.title}' path must be a relative path without '..' (got '${o.path}')`;
    if (dirname(o.path) === ".")
      return `output '${o.title}' must live in a subdirectory, not the repo root (got '${o.path}')`;
  }
  return null;
}

export function discoverProjects(rootDir) {
  const projects = [];
  const warnings = [];
  for (const entry of readdirSync(rootDir)) {
    const dir = join(rootDir, entry);
    if (!statSync(dir).isDirectory()) continue;
    const cfgPath = join(dir, "portal.json");
    if (!existsSync(cfgPath)) continue;
    let config;
    try {
      config = JSON.parse(readFileSync(cfgPath, "utf8"));
    } catch {
      warnings.push(`${entry}: invalid JSON in portal.json — skipped`);
      continue;
    }
    const err = validate(config);
    if (err) {
      warnings.push(`${entry}: ${err} — skipped`);
      continue;
    }
    projects.push({ dir, config });
  }
  return { projects, warnings };
}
