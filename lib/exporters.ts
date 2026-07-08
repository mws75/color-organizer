import { hexToRgb, type Palette } from "./types";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "color"
  );
}

/** Slugify color names, de-duplicating repeats (peach, peach-2, ...). */
function slugColors(palette: Palette): { slug: string; name: string; hex: string }[] {
  const seen = new Map<string, number>();
  return palette.colors.map((c) => {
    const base = slugify(c.name);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { slug: count === 1 ? base : `${base}-${count}`, name: c.name, hex: c.hex };
  });
}

export function buildCss(palette: Palette): string {
  const lines = slugColors(palette).map((c) => `  --${c.slug}: ${c.hex.toLowerCase()};`);
  return `/* ${palette.palette_name} */\n:root {\n${lines.join("\n")}\n}\n`;
}

export function buildJson(palette: Palette): string {
  return JSON.stringify(
    {
      name: palette.palette_name,
      colors: palette.colors.map((c) => ({
        name: c.name,
        hex: c.hex,
        rgb: hexToRgb(c.hex),
      })),
    },
    null,
    2,
  );
}

export function buildMarkdown(palette: Palette): string {
  const rows = palette.colors.map(
    (c) => `| ${c.name} | \`${c.hex}\` | \`${hexToRgb(c.hex)}\` |`,
  );
  return [
    `# ${palette.palette_name}`,
    "",
    "| Name | Hex | RGB |",
    "| --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

export type ExportFormat = "css" | "json" | "md";

export function downloadPalette(palette: Palette, format: ExportFormat): string {
  const builders: Record<ExportFormat, { build: (p: Palette) => string; mime: string }> = {
    css: { build: buildCss, mime: "text/css" },
    json: { build: buildJson, mime: "application/json" },
    md: { build: buildMarkdown, mime: "text/markdown" },
  };

  const { build, mime } = builders[format];
  const filename = `${slugify(palette.palette_name)}.${format}`;
  const blob = new Blob([build(palette)], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return filename;
}
