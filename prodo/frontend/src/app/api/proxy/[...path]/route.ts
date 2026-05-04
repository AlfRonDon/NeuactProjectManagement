import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8420";

type RouteContext = { params: { path: string[] } };

function buildBackendUrl(request: NextRequest, params: RouteContext["params"]) {
  const path = params.path.join("/");
  return `${BACKEND_URL}/api/${path}/${request.nextUrl.search}`;
}

function forwardHeaders(request: NextRequest) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = request.headers.get("Authorization");
  if (auth) headers.Authorization = auth;
  return headers;
}

async function parseBackendResponse(res: Response) {
  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const text = await res.text();
  if (!text) return NextResponse.json(null, { status: res.status });

  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "text/plain" },
    });
  }
}

async function proxy(request: NextRequest, context: RouteContext, method: "GET" | "POST" | "PATCH" | "DELETE") {
  const init: RequestInit = { method, headers: forwardHeaders(request) };

  if (method === "POST" || method === "PATCH") {
    init.body = JSON.stringify(await request.json());
  }

  try {
    const res = await fetch(buildBackendUrl(request, context.params), init);
    return parseBackendResponse(res);
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context, "POST");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context, "PATCH");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context, "DELETE");
}
