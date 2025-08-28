import { NextRequest, NextResponse } from 'next/server';
import { DataCollectionOrchestrator } from '@/lib/collectors';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const orchestrator = new DataCollectionOrchestrator();
      await orchestrator.initialize();
      
      // OpenAI APIキーの有無でデータソースを切り替え
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      
      const sources = hasOpenAIKey ? [
        { name: 'ChatGPT 重要情報分析', key: 'openai-analysis' },
        { name: 'ChatGPT 実用情報検索', key: 'openai-search' },
        { name: '日本技術メディア', key: 'japanesetech' },
        { name: 'GitHub Trending', key: 'github' }
      ] : [
        { name: 'Real News (Dev.to/Hashnode)', key: 'realnews' },
        { name: '日本技術メディア', key: 'japanesetech' },
        { name: 'Hacker News', key: 'hackernews' },
        { name: 'Reddit', key: 'reddit' },
        { name: 'Product Hunt', key: 'producthunt' },
        { name: 'GitHub Trending', key: 'github' },
        { name: 'AI Companies', key: 'ai-companies' },
        { name: 'ArXiv', key: 'arxiv' },
        { name: 'TechCrunch', key: 'techcrunch' },
        { name: 'RSS Feeds', key: 'rss' }
      ];
      
      const totalSources = sources.length;
      let completedSources = 0;
      const collectedData: any[] = [];
      const errors: string[] = [];
      
      // 進捗を送信する関数
      const sendProgress = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      // 初期状態を送信（ソースリストも含む）
      sendProgress({
        type: 'start',
        totalSources,
        message: 'データ収集を開始しています...',
        sources: sources // ソースリストを追加
      });
      
      // 各ソースから並列でデータを収集（最大50件まで）
      const MAX_ITEMS = 50;
      let totalCollected = 0;
      
      const promises = sources.map(async (source) => {
        try {
          sendProgress({
            type: 'source_start',
            source: source.name,
            progress: Math.round((completedSources / totalSources) * 100)
          });
          
          // 実際のコレクターを使用
          // 残り枚数を考慮して収集
          const remainingSlots = Math.max(0, MAX_ITEMS - totalCollected);
          if (remainingSlots === 0) {
            return { source: source.name, count: 0, data: [] };
          }
          
          const result = await orchestrator.collectFromSource(source.key);
          
          // 結果を制限する
          const limitedResult = result.slice(0, Math.min(result.length, remainingSlots));
          
          collectedData.push(...limitedResult);
          totalCollected += limitedResult.length;
          completedSources++;
          
          sendProgress({
            type: 'source_complete',
            source: source.name,
            itemsCollected: limitedResult.length,
            progress: Math.round((completedSources / totalSources) * 100),
            totalCollected: collectedData.length,
            message: totalCollected >= MAX_ITEMS ? `上限${MAX_ITEMS}件に到達` : undefined
          });
          
          return { source: source.name, count: limitedResult.length, data: limitedResult };
        } catch (error) {
          completedSources++;
          const errorMsg = `${source.name}の収集に失敗: ${error}`;
          errors.push(errorMsg);
          
          sendProgress({
            type: 'source_error',
            source: source.name,
            error: errorMsg,
            progress: Math.round((completedSources / totalSources) * 100)
          });
          
          return { source: source.name, count: 0, data: [] };
        }
      });
      
      // すべての収集を待つ
      const results = await Promise.all(promises);
      
      // 最終的に50件までに制限（念のため）
      const finalData = collectedData.slice(0, MAX_ITEMS);
      
      // 完了メッセージを送信
      sendProgress({
        type: 'complete',
        totalCollected: finalData.length,
        bySource: results.reduce((acc, r) => ({ ...acc, [r.source]: r.count }), {}),
        data: finalData,
        errors,
        progress: 100,
        message: `高品質な情報${finalData.length}件を収集しました`
      });
      
      // ストリームを終了
      controller.close();
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}