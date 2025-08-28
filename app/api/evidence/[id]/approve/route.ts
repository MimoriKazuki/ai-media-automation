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
    const { tags, note } = body;
    
    // Evidence のステータスを更新
    const updateData: any = { status: "approved" };
    if (tags && Array.isArray(tags)) {
      updateData.tags = tags;
    }
    if (note) {
      updateData.note = note;
    }
    
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
      action: "approve",
      reason: note || null,
      // user_id は認証実装後に追加
    };
    
    await sb.from("feedback").insert(feedback);
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "承認中にエラーが発生しました"
      },
      { status: 500 }
    );
  }
}