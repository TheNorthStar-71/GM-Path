import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeWeaknesses } from "@/lib/weakness-analyzer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const report = await analyzeWeaknesses(userId);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze weaknesses" },
      { status: 500 }
    );
  }
}
