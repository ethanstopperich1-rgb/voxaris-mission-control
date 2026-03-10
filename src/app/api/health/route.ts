import { NextResponse } from "next/server";

export async function GET() {
  const services = {
    supabase: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    vapi: !!process.env.VAPI_API_KEY,
    tavus: !!process.env.TAVUS_API_KEY,
  };

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services,
  });
}
