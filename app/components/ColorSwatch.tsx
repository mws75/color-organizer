"use client";

import { hexToRgb, type PaletteColor } from "@/lib/types";

interface Props {
  color: PaletteColor;
  onToast: (message: string) => void;
}

/**
 * A single color chip. Hover shows a speech-bubble with name/hex/rgb;
 * click copies the hex code to the clipboard.
 */
export function ColorSwatch({ color, onToast }: Props) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
      onToast("Hex copied to clipboard!");
    } catch {
      onToast("Couldn't copy — clipboard blocked");
    }
  };

  return (
    <button
      type="button"
      className="swatch"
      style={{ backgroundColor: color.hex }}
      onClick={copy}
      aria-label={`${color.name}, ${color.hex}. Copy hex code`}
    >
      <span className="swatch-tip" role="presentation">
        <span className="tip-name">{color.name}</span>
        <br />
        <span className="tip-code">{color.hex}</span>
        <br />
        <span className="tip-code">{hexToRgb(color.hex)}</span>
      </span>
    </button>
  );
}
