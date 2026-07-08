import { currentUser, clerkClient } from "@clerk/nextjs/server";
import type { User as ClerkUser } from "@clerk/nextjs/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { executeQuery } from "./db";

export class UnauthenticatedError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

/**
 * Resolve the cp_users.user_id for the signed-in Clerk user.
 * Fast path: the id is cached in Clerk publicMetadata (cpUserId).
 * Slow path (first request): create/find the row and cache the id.
 */
export async function getAuthenticatedUserId(): Promise<number> {
  const user = await currentUser();
  if (!user) {
    throw new UnauthenticatedError();
  }

  const cpUserId = user.publicMetadata?.cpUserId as number | undefined;
  if (cpUserId) {
    return cpUserId;
  }

  return await createUserAndSyncMetadata(user);
}

async function createUserAndSyncMetadata(clerkUser: ClerkUser): Promise<number> {
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const userName =
    clerkUser.username || clerkUser.firstName || email?.split("@")[0] || "User";
  const profilePicUrl = clerkUser.imageUrl || null;

  if (!email) {
    throw new Error("User email not found");
  }

  // INSERT IGNORE handles race conditions — if the user exists, it's a no-op.
  await executeQuery<ResultSetHeader>(
    `INSERT IGNORE INTO cp_users (user_name, email, plan_tier, profile_pic_url)
     VALUES (?, ?, ?, ?)`,
    [userName, email, "free", profilePicUrl],
  );

  const users = await executeQuery<RowDataPacket[]>(
    "SELECT user_id FROM cp_users WHERE email = ? LIMIT 1",
    [email],
  );
  if (users.length === 0) {
    throw new Error("Failed to create or find user");
  }
  const userId = users[0].user_id as number;

  // Cache in Clerk metadata so future requests skip the DB lookup.
  const client = await clerkClient();
  await client.users.updateUserMetadata(clerkUser.id, {
    publicMetadata: { cpUserId: userId },
  });

  return userId;
}
