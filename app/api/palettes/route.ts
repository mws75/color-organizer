import { NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { executeQuery } from "@/lib/db";
import { getAuthenticatedUserId, UnauthenticatedError } from "@/lib/auth";
import { validatePalettePayload, type PaletteColor } from "@/lib/types";

interface PaletteRow extends RowDataPacket {
  palette_id: number;
  palette_name: string;
  colors_json: string | PaletteColor[];
  created_on: string;
  modified_on: string;
}

function parseColors(raw: string | PaletteColor[]): PaletteColor[] {
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

/** GET /api/palettes — list the signed-in user's palettes */
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    const rows = await executeQuery<PaletteRow[]>(
      `SELECT palette_id, palette_name, colors_json, created_on, modified_on
       FROM cp_color_palettes
       WHERE user_id = ?
       ORDER BY created_on DESC`,
      [userId],
    );

    const palettes = rows.map((r) => ({
      palette_id: r.palette_id,
      palette_name: r.palette_name,
      colors: parseColors(r.colors_json),
      created_on: r.created_on,
      modified_on: r.modified_on,
    }));

    return NextResponse.json({ palettes });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    console.error("GET /api/palettes failed:", error);
    return NextResponse.json({ error: "Failed to load palettes" }, { status: 500 });
  }
}

/** POST /api/palettes — create a palette */
export async function POST(request: Request) {
  let userId: number;
  try {
    userId = await getAuthenticatedUserId();
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    throw error;
  }

  let payload: { palette_name: string; colors: PaletteColor[] };
  try {
    payload = validatePalettePayload(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid palette";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await executeQuery<ResultSetHeader>(
      `INSERT INTO cp_color_palettes (user_id, palette_name, colors_json)
       VALUES (?, ?, ?)`,
      [userId, payload.palette_name, JSON.stringify(payload.colors)],
    );

    return NextResponse.json(
      {
        palette: {
          palette_id: result.insertId,
          palette_name: payload.palette_name,
          colors: payload.colors,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/palettes failed:", error);
    return NextResponse.json({ error: "Failed to save palette" }, { status: 500 });
  }
}
