// app/api/get-logs/route.ts

import { NextResponse } from "next/server";
export { dynamic } from "@/lib/dynamic";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const userEmail = session?.user?.email
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const fastapiUrl = `http://localhost:8000/logs/?user_email=${encodeURIComponent(userEmail)}`;

  const res = await fetch(fastapiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
