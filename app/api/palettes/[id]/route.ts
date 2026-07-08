import { NextResponse } from "next/server";
import { ResultSetHeader } from "mysql2";
import { executeQuery } from "@/lib/db";
import { getAuthenticatedUserId, UnauthenticatedError } from "@/lib/auth";
import { validatePalettePayload, type PaletteColor } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

async function resolveIds(context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  const { id } = await context.params;
  const paletteId = Number(id);
  if (!Number.isInteger(paletteId) || paletteId <= 0) {
    return { userId, paletteId: null };
  }
  return { userId, paletteId };
}

/** PUT /api/palettes/:id — update a palette the user owns */
export async function PUT(request: Request, context: RouteContext) {
  let userId: number;
  let paletteId: number | null;
  try {
    ({ userId, paletteId } = await resolveIds(context));
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    throw error;
  }
  if (!paletteId) {
    return NextResponse.json({ error: "Invalid palette id" }, { status: 400 });
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
      `UPDATE cp_color_palettes
       SET palette_name = ?, colors_json = ?
       WHERE palette_id = ? AND user_id = ?`,
      [payload.palette_name, JSON.stringify(payload.colors), paletteId, userId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 });
    }

    return NextResponse.json({
      palette: {
        palette_id: paletteId,
        palette_name: payload.palette_name,
        colors: payload.colors,
      },
    });
  } catch (error) {
    console.error(`PUT /api/palettes/${paletteId} failed:`, error);
    return NextResponse.json({ error: "Failed to update palette" }, { status: 500 });
  }
}

/** DELETE /api/palettes/:id — delete a palette the user owns */
export async function DELETE(_request: Request, context: RouteContext) {
  let userId: number;
  let paletteId: number | null;
  try {
    ({ userId, paletteId } = await resolveIds(context));
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    throw error;
  }
  if (!paletteId) {
    return NextResponse.json({ error: "Invalid palette id" }, { status: 400 });
  }

  try {
    const result = await executeQuery<ResultSetHeader>(
      `DELETE FROM cp_color_palettes WHERE palette_id = ? AND user_id = ?`,
      [paletteId, userId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error(`DELETE /api/palettes/${paletteId} failed:`, error);
    return NextResponse.json({ error: "Failed to delete palette" }, { status: 500 });
  }
}
