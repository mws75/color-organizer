export interface PaletteColor {
  /** User-given name, e.g. "Sunset Peach" */
  name: string;
  /** #RRGGBB */
  hex: string;
}

export interface Palette {
  palette_id: number;
  palette_name: string;
  colors: PaletteColor[];
  created_on: string;
  modified_on: string;
}

export const MAX_COLORS = 20;
export const MAX_PALETTE_NAME = 100;
export const MAX_COLOR_NAME = 60;
export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Validate a palette payload from the client.
 * Returns a cleaned {palette_name, colors} or throws with a user-facing message.
 */
export function validatePalettePayload(body: unknown): {
  palette_name: string;
  colors: PaletteColor[];
} {
  const b = body as { palette_name?: unknown; colors?: unknown };
  const name = typeof b.palette_name === "string" ? b.palette_name.trim() : "";
  if (!name) throw new Error("Palette name is required");
  if (name.length > MAX_PALETTE_NAME) {
    throw new Error(`Palette name must be ${MAX_PALETTE_NAME} characters or fewer`);
  }

  if (!Array.isArray(b.colors) || b.colors.length === 0) {
    throw new Error("Add at least one color");
  }
  if (b.colors.length > MAX_COLORS) {
    throw new Error(`A palette can hold up to ${MAX_COLORS} colors`);
  }

  const colors: PaletteColor[] = b.colors.map((c: unknown, i: number) => {
    const col = c as { name?: unknown; hex?: unknown };
    const colorName = typeof col.name === "string" ? col.name.trim() : "";
    const hex = typeof col.hex === "string" ? col.hex.trim() : "";
    if (!colorName) throw new Error(`Color ${i + 1} needs a name`);
    if (colorName.length > MAX_COLOR_NAME) {
      throw new Error(`Color ${i + 1}: name must be ${MAX_COLOR_NAME} characters or fewer`);
    }
    if (!HEX_RE.test(hex)) {
      throw new Error(`Color ${i + 1}: hex must look like #A1B2C3`);
    }
    return { name: colorName, hex: hex.toUpperCase() };
  });

  return { palette_name: name, colors };
}
