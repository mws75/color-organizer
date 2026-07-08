"use client";

import { useEffect, useRef, useState } from "react";
import {
  HEX_RE,
  MAX_COLORS,
  validatePalettePayload,
  type Palette,
  type PaletteColor,
} from "@/lib/types";

interface Props {
  /** Palette to edit, or null to create a new one. */
  palette: Palette | null;
  onClose: () => void;
  onSaved: (palette: Palette, mode: "create" | "edit") => void;
}

interface ColorRow {
  key: number;
  name: string;
  hex: string;
}

/** Normalize free-typed hex ("ffb59e" / "#FFB59E") to #RRGGBB, or return input unchanged. */
function normalizeHex(raw: string): string {
  const t = raw.trim();
  const withHash = t.startsWith("#") ? t : `#${t}`;
  return HEX_RE.test(withHash) ? withHash.toUpperCase() : raw;
}

/**
 * RecipeCard-style overlay for creating or editing a palette.
 * Backdrop click and Escape both close; "+" on the last row adds a color (max 20).
 */
export function PaletteOverlay({ palette, onClose, onSaved }: Props) {
  const nextKey = useRef(0);
  const makeRow = (name = "", hex = ""): ColorRow => ({
    key: nextKey.current++,
    name,
    hex,
  });

  const [name, setName] = useState(palette?.palette_name ?? "");
  const [rows, setRows] = useState<ColorRow[]>(() =>
    palette && palette.colors.length > 0
      ? palette.colors.map((c) => makeRow(c.name, c.hex))
      : [makeRow()],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = palette !== null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updateRow = (key: number, patch: Partial<ColorRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((rs) => (rs.length >= MAX_COLORS ? rs : [...rs, makeRow()]));
  };

  const removeRow = (key: number) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  };

  const save = async () => {
    let payload: { palette_name: string; colors: PaletteColor[] };
    try {
      payload = validatePalettePayload({
        palette_name: name,
        colors: rows.map((r) => ({ name: r.name, hex: normalizeHex(r.hex) })),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please check the form");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/palettes/${palette.palette_id}` : "/api/palettes",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong — try again");
        return;
      }
      onSaved(
        {
          ...(palette ?? { created_on: "", modified_on: "" }),
          ...data.palette,
        },
        isEdit ? "edit" : "create",
      );
    } catch {
      setError("Couldn't reach the server — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div
        className="overlay-card"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit palette" : "Create palette"}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="overlay-title">
          {isEdit ? "Edit palette" : "New palette"}
        </h2>

        <label className="field-label" htmlFor="palette-name">
          Palette name
        </label>
        <input
          id="palette-name"
          className="input"
          placeholder="Color palette name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div className="color-rows">
          {rows.map((row, i) => {
            const pickerValue = HEX_RE.test(normalizeHex(row.hex))
              ? normalizeHex(row.hex)
              : "#CCCCCC";
            return (
              <div className="color-row" key={row.key}>
                <input
                  className="input input-name"
                  placeholder="Color name"
                  aria-label={`Color ${i + 1} name`}
                  value={row.name}
                  onChange={(e) => updateRow(row.key, { name: e.target.value })}
                />
                <input
                  className="input input-hex"
                  placeholder="#A1B2C3"
                  aria-label={`Color ${i + 1} hex code`}
                  value={row.hex}
                  onChange={(e) => updateRow(row.key, { hex: e.target.value })}
                  onBlur={(e) => updateRow(row.key, { hex: normalizeHex(e.target.value) })}
                />
                <span
                  className="picker-chip"
                  style={{ backgroundColor: pickerValue }}
                  title="Pick a color"
                >
                  <input
                    type="color"
                    aria-label={`Color ${i + 1} picker`}
                    value={pickerValue}
                    onChange={(e) =>
                      updateRow(row.key, { hex: e.target.value.toUpperCase() })
                    }
                  />
                </span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    className="btn icon-btn"
                    aria-label={`Remove color ${i + 1}`}
                    onClick={() => removeRow(row.key)}
                  >
                    ×
                  </button>
                )}
                {i === rows.length - 1 && rows.length < MAX_COLORS && (
                  <button
                    type="button"
                    className="btn icon-btn btn-butter"
                    aria-label="Add another color"
                    onClick={addRow}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="row-count">
          {rows.length}/{MAX_COLORS} colors
        </p>

        {error && <div className="form-error">{error}</div>}

        <div className="overlay-actions">
          <button type="button" className="btn btn-blush" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-mint"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "+ Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
