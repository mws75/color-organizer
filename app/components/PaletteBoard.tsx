"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Palette } from "@/lib/types";
import { PaletteCard } from "./PaletteCard";
import { PaletteOverlay } from "./PaletteOverlay";

type OverlayState = { mode: "create" } | { mode: "edit"; palette: Palette } | null;

interface Props {
  /** Render prop so the page can place the Create button in the header. */
  renderCreateButton: (open: () => void) => React.ReactNode;
}

const LOADING_CHIP_COLORS = ["#FFB5C2", "#B8E8C8", "#AECBFA", "#FFE18A"];

export function PaletteBoard({ renderCreateButton }: Props) {
  const [palettes, setPalettes] = useState<Palette[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/palettes");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error ?? "Failed to load palettes");
          return;
        }
        setPalettes(data.palettes);
      } catch {
        if (!cancelled) setLoadError("Couldn't reach the server");
      }
    })();
    return () => {
      cancelled = true;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleSaved = (saved: Palette, mode: "create" | "edit") => {
    setPalettes((ps) => {
      const list = ps ?? [];
      return mode === "create"
        ? [saved, ...list]
        : list.map((p) => (p.palette_id === saved.palette_id ? saved : p));
    });
    setOverlay(null);
    showToast(mode === "create" ? "Palette created!" : "Palette updated!");
  };

  const handleDelete = async (palette: Palette) => {
    const res = await fetch(`/api/palettes/${palette.palette_id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPalettes((ps) => (ps ?? []).filter((p) => p.palette_id !== palette.palette_id));
      showToast(`"${palette.palette_name}" deleted`);
    } else {
      showToast("Couldn't delete — try again");
    }
  };

  return (
    <>
      {renderCreateButton(() => setOverlay({ mode: "create" }))}

      {loadError ? (
        <div className="state-card">
          <h2>Paint spill!</h2>
          <p>{loadError}</p>
          <button type="button" className="btn" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      ) : palettes === null ? (
        <div className="state-card" aria-label="Loading palettes">
          <div className="demo-chips loading-chips">
            {LOADING_CHIP_COLORS.map((c) => (
              <span key={c} className="demo-chip" style={{ backgroundColor: c }} />
            ))}
          </div>
          <p>Mixing paints...</p>
        </div>
      ) : palettes.length === 0 ? (
        <div className="state-card">
          <div className="demo-chips">
            {LOADING_CHIP_COLORS.map((c) => (
              <span key={c} className="demo-chip" style={{ backgroundColor: c }} />
            ))}
          </div>
          <h2>No palettes yet</h2>
          <p>Save your first set of colors and it will show up here.</p>
          <button
            type="button"
            className="btn btn-mint"
            onClick={() => setOverlay({ mode: "create" })}
          >
            + Create your first palette
          </button>
        </div>
      ) : (
        <div className="palette-list">
          {palettes.map((p) => (
            <PaletteCard
              key={p.palette_id}
              palette={p}
              onEdit={(palette) => setOverlay({ mode: "edit", palette })}
              onDelete={handleDelete}
              onToast={showToast}
            />
          ))}
        </div>
      )}

      {overlay && (
        <PaletteOverlay
          palette={overlay.mode === "edit" ? overlay.palette : null}
          onClose={() => setOverlay(null)}
          onSaved={handleSaved}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
