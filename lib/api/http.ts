import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}
export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
export function unauthorized(message = "Not authenticated") {
  return NextResponse.json({ error: message }, { status: 401 });
}
export function demoNotice(message: string) {
  return NextResponse.json({ demo: true, message }, { status: 501 });
}

export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }
  try {
    return schema.parse(json);
  } catch (e) {
    if (e instanceof ZodError) throw badRequest("Invalid data", e.flatten());
    throw e;
  }
}

export function parseQuery<T>(request: Request, schema: ZodSchema<T>): T {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  try {
    return schema.parse(params);
  } catch (e) {
    if (e instanceof ZodError) throw badRequest("Invalid parameters", e.flatten());
    throw e;
  }
}
