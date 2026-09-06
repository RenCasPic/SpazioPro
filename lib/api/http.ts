import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "No encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function unauthorized(message = "No autenticado") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function serverError(message = "Error del servidor") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Parse + validate a JSON body; throws a Response on failure. */
export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw badRequest("Cuerpo JSON no válido");
  }
  try {
    return schema.parse(json);
  } catch (e) {
    if (e instanceof ZodError) throw badRequest("Datos no válidos", e.flatten());
    throw e;
  }
}

export function parseQuery<T>(request: Request, schema: ZodSchema<T>): T {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  try {
    return schema.parse(params);
  } catch (e) {
    if (e instanceof ZodError) throw badRequest("Parámetros no válidos", e.flatten());
    throw e;
  }
}
