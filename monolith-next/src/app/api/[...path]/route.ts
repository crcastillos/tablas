import { NextResponse } from "next/server";

export const runtime = "nodejs";

function notFound() {
  return NextResponse.json(
    {
      success: false,
      message: "Endpoint no encontrado.",
    },
    { status: 404 },
  );
}

export async function GET() {
  return notFound();
}

export async function POST() {
  return notFound();
}

export async function PUT() {
  return notFound();
}

export async function PATCH() {
  return notFound();
}

export async function DELETE() {
  return notFound();
}
