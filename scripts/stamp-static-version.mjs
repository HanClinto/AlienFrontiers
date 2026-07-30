import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const [rootDirectory, version] = process.argv.slice(2);
if (!rootDirectory || !version || !/^[A-Za-z0-9._-]+$/.test(version)) {
  throw new Error("Usage: node stamp-static-version.mjs <directory> <version>");
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

function stampUrl(url) {
  const [path] = url.split(/[?#]/, 1);
  return `${path}?v=${version}`;
}

function stampJavaScript(source) {
  return source.replace(
    /(\b(?:from\s+|import\s*\(\s*)["'])(\.{1,2}\/[^"']+\.js(?:[?#][^"']*)?)(["'])/g,
    (_match, prefix, url, suffix) => `${prefix}${stampUrl(url)}${suffix}`,
  );
}

function stampHtml(source) {
  return source.replace(
    /((?:src|href)=["'])(\.\/[^"']+\.(?:js|css)(?:[?#][^"']*)?)(["'])/g,
    (_match, prefix, url, suffix) => `${prefix}${stampUrl(url)}${suffix}`,
  );
}

function stampCss(source) {
  return source.replace(
    /(url\(["']?)(\.\/[^)'"?]+)(?:\?[^)'" ]*)?(["']?\))/g,
    (_match, prefix, url, suffix) => `${prefix}${stampUrl(url)}${suffix}`,
  );
}

for (const filePath of await filesUnder(rootDirectory)) {
  const extension = extname(filePath);
  if (![".js", ".html", ".css"].includes(extension)) {
    continue;
  }
  const source = await readFile(filePath, "utf8");
  const stamped = extension === ".js"
    ? stampJavaScript(source)
    : extension === ".html" ? stampHtml(source) : stampCss(source);
  if (stamped !== source) {
    await writeFile(filePath, stamped);
  }
}

await writeFile(
  join(rootDirectory, "version.json"),
  `${JSON.stringify({ version })}\n`,
);
