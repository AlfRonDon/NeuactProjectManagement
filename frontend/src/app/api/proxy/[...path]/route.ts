import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8420";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/api/${path}/${request.nextUrl.search}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = request.headers.get("Authorization");
  if (auth) headers["Authorization"] = auth;

  try {
    const res = await fetch(url, { headers });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/api/${path}/`;
  const body = await request.json();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = request.headers.get("Authorization");
  if (auth) headers["Authorization"] = auth;

  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/api/${path}/`;
  const body = await request.json();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = request.headers.get("Authorization");
  if (auth) headers["Authorization"] = auth;

  try {
    const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
