"use client";

import { useEffect, useRef, useState } from "react";
import { downloadPalette, type ExportFormat } from "@/lib/exporters";
import type { Palette } from "@/lib/types";

interface Props {
  palette: Palette;
  onToast: (message: string) => void;
}

const FORMATS: { format: ExportFormat; label: string }[] = [
  { format: "css", label: "CSS variables (.css)" },
  { format: "json", label: "JSON object (.json)" },
  { format: "md", label: "Markdown table (.md)" },
];

/** "Generate File" button with a dropdown of download formats. */
export function GenerateFileMenu({ palette, onToast }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (format: ExportFormat) => {
    const filename = downloadPalette(palette, format);
    setOpen(false);
    onToast(`${filename} downloaded!`);
  };

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="btn btn-lilac"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Generate File
      </button>
      {open && (
        <div className="menu" role="menu">
          {FORMATS.map(({ format, label }) => (
            <button
              key={format}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => pick(format)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
