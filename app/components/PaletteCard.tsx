"use client";

import { useEffect, useRef, useState } from "react";
import type { Palette } from "@/lib/types";
import { ColorSwatch } from "./ColorSwatch";
import { GenerateFileMenu } from "./GenerateFileMenu";

interface Props {
  palette: Palette;
  onEdit: (palette: Palette) => void;
  onDelete: (palette: Palette) => void;
  onToast: (message: string) => void;
}

/**
 * One palette row on the main page:
 * [swatch strip] [Generate File] [name — click to edit] [− delete]
 * Delete is two-step: first click arms it ("Sure?"), second click deletes.
 */
export function PaletteCard({ palette, onEdit, onDelete, onToast }: Props) {
  const [armed, setArmed] = useState(false);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (disarmTimer.current) clearTimeout(disarmTimer.current);
    };
  }, []);

  const handleDelete = () => {
    if (!armed) {
      setArmed(true);
      disarmTimer.current = setTimeout(() => setArmed(false), 2500);
      return;
    }
    if (disarmTimer.current) clearTimeout(disarmTimer.current);
    onDelete(palette);
  };

  return (
    <article className="palette-card">
      <div className="swatch-strip">
        {palette.colors.map((color, i) => (
          <ColorSwatch key={`${color.hex}-${i}`} color={color} onToast={onToast} />
        ))}
      </div>

      <GenerateFileMenu palette={palette} onToast={onToast} />

      <button
        type="button"
        className="palette-name"
        onClick={() => onEdit(palette)}
        title="Edit this palette"
      >
        {palette.palette_name}
      </button>

      <div className="spacer" />

      <button
        type="button"
        className={`btn icon-btn ${armed ? "btn-blush" : ""}`}
        style={armed ? { width: "auto", padding: "0 0.75rem", fontSize: "0.85rem" } : undefined}
        onClick={handleDelete}
        aria-label={
          armed
            ? `Really delete ${palette.palette_name}?`
            : `Delete ${palette.palette_name}`
        }
      >
        {armed ? "Sure?" : "−"}
      </button>
    </article>
  );
}
