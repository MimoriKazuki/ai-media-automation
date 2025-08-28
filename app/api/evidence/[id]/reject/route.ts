import { NextRequest, NextResponse } from "next/server";
import { sbServer } from "@/lib/supabase/server";
import type { FeedbackInsert } from "@/types/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sb = sbServer();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason } = body;
    
    // Evidence のステータスを更新
    const updateData: any = { 
      status: "rejected",
      note: reason || null
    };
    
    const { error: updateError } = await sb
      .from("evidence")
      .update(updateData)
      .eq("id", id);
    
    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }
    
    // フィードバックを記録
    const feedback: FeedbackInsert = {
      target_type: "evidence",
      target_id: id,
      action: "reject",
      reason: reason || null,
      // user_id は認証実装後に追加
    };
    
    await sb.from("feedback").insert(feedback);
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "却下中にエラーが発生しました"
      },
      { status: 500 }
    );
  }
}