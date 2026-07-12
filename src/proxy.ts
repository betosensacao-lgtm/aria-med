import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "admin_session";
const JWT_SECRET_RAW = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "medbook-dev-secret-key-change-in-production";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

interface SessionPayload {
  userId: string;
  email: string;
  role: "admin" | "super_admin";
  clinicId: string | null;
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/admin/login" ||
    pathname === "/admin/signup" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password"
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(cookie.value);
  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-user-id", session.userId);
  response.headers.set("x-user-email", session.email);
  response.headers.set("x-user-role", session.role);
  if (session.clinicId) {
    response.headers.set("x-clinic-id", session.clinicId);
  }

  return response;
}

export const config = {
  matcher: "/admin/:path*",
};
