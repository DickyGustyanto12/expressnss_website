import { cookies } from "next/headers";
import { pool } from "./db";

export interface AdminUser {
  id: number;
  username: string;
  role: string;
}

export async function getSessionAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("admin_session");

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const token = sessionCookie.value;

    const [rows] = await pool.execute(
      `SELECT a.id, a.username, a.role 
       FROM admin_users a
       JOIN admin_sessions s ON a.id = s.admin_id
       WHERE s.session_token = ? AND s.expires_at > NOW()`,
      [token],
    );

    const admins = rows as AdminUser[];
    if (admins.length > 0) {
      return admins[0];
    }

    return null;
  } catch (error) {
    console.error("Gagal melakukan lookup sesi admin:", error);
    return null;
  }
}
