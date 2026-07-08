"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { PaletteBoard } from "./components/PaletteBoard";

const CANDY_WORD = "Color";

function CandyTitle() {
  return (
    <h1 className="page-title">
      {CANDY_WORD.split("").map((ch, i) => (
        <span key={i} className={`candy-${i % 5}`}>
          {ch}
        </span>
      ))}{" "}
      Palette Organizer
    </h1>
  );
}

export default function Home() {
  return (
    <main className="container">
      <SignedIn>
        <PaletteBoard
          renderCreateButton={(open) => (
            <div className="page-header">
              <CandyTitle />
              <div className="header-actions">
                <button type="button" className="btn btn-mint" onClick={open}>
                  + Create New
                </button>
                <UserButton />
              </div>
            </div>
          )}
        />
      </SignedIn>

      <SignedOut>
        <div className="page-header">
          <CandyTitle />
        </div>
        <div className="state-card">
          <div className="demo-chips">
            <span className="demo-chip" style={{ backgroundColor: "#FFB5C2" }} />
            <span className="demo-chip" style={{ backgroundColor: "#B8E8C8" }} />
            <span className="demo-chip" style={{ backgroundColor: "#AECBFA" }} />
            <span className="demo-chip" style={{ backgroundColor: "#FFE18A" }} />
            <span className="demo-chip" style={{ backgroundColor: "#E3D0FF" }} />
          </div>
          <h2>Every color you love, in one place</h2>
          <p>
            Name your colors, group them into palettes, and export them as CSS,
            JSON, or Markdown whenever you need them.
          </p>
          <SignInButton mode="modal">
            <button type="button" className="btn btn-mint">
              Sign in to start collecting
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </main>
  );
}
