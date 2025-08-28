import { NextRequest, NextResponse } from "next/server";
import { sbServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const sb = sbServer();
    const { searchParams } = new URL(req.url);
    
    // クエリパラメータ
    const status = searchParams.get("status") || "pending";
    const limit = Number(searchParams.get("limit") || 50);
    const from = searchParams.get("from");
    const domain = searchParams.get("domain");
    const tags = searchParams.get("tags");
    
    // クエリ構築
    let query = sb
      .from("evidence")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    // フィルタ条件
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    
    if (from) {
      query = query.gte("published_at", from);
    }
    
    if (domain) {
      query = query.eq("domain", domain);
    }
    
    if (tags) {
      const tagArray = tags.split(",");
      query = query.contains("tags", tagArray);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      ok: true, 
      items: data || [],
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error("Evidence fetch error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "取得中にエラーが発生しました"
      },
      { status: 500 }
    );
  }
}