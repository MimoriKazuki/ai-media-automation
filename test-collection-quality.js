// データ収集の品質テスト

async function testCollectionQuality() {
  console.log('🧪 データ収集品質テスト開始...\n');
  
  try {
    const response = await fetch('http://localhost:3003/api/collect-with-progress');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let collectedData = [];
    let totalCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'source_complete') {
              console.log(`✅ ${data.source}: ${data.itemsCollected}件`);
              totalCount = data.totalCollected;
            } else if (data.type === 'complete') {
              collectedData = data.data;
              console.log(`\n📊 収集完了: 合計${data.totalCollected}件`);
              
              // ソース別の内訳
              console.log('\n📈 ソース別内訳:');
              Object.entries(data.bySource).forEach(([source, count]) => {
                console.log(`  - ${source}: ${count}件`);
              });
            }
          } catch (e) {
            // JSON パースエラーは無視
          }
        }
      }
    }
    
    // 品質分析
    console.log('\n🔍 品質分析:');
    
    // スコアの高いデータを抽出
    const highQualityData = collectedData.filter(item => {
      const score = item.metadata?.relevance_score || 
                   item.metadata?.quality_score || 
                   item.metadata?.score || 0;
      return score >= 7;
    });
    
    console.log(`  - 高品質データ(スコア7以上): ${highQualityData.length}件 (${Math.round(highQualityData.length / collectedData.length * 100)}%)`);
    
    // 具体的な数字を含むデータ
    const withNumbers = collectedData.filter(item => 
      /\d/.test(item.title) || /\d/.test(item.content || '')
    );
    console.log(`  - 具体的な数字を含む: ${withNumbers.length}件 (${Math.round(withNumbers.length / collectedData.length * 100)}%)`);
    
    // 日本関連のコンテンツ
    const japaneseContent = collectedData.filter(item => {
      const text = (item.title + ' ' + (item.content || '')).toLowerCase();
      return text.includes('日本') || text.includes('japan') || 
             /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text);
    });
    console.log(`  - 日本関連コンテンツ: ${japaneseContent.length}件 (${Math.round(japaneseContent.length / collectedData.length * 100)}%)`);
    
    // トップ5の高品質データを表示
    console.log('\n🏆 トップ5高品質データ:');
    const top5 = collectedData
      .sort((a, b) => {
        const scoreA = a.metadata?.relevance_score || a.metadata?.quality_score || a.metadata?.score || 0;
        const scoreB = b.metadata?.relevance_score || b.metadata?.quality_score || b.metadata?.score || 0;
        return scoreB - scoreA;
      })
      .slice(0, 5);
    
    top5.forEach((item, i) => {
      const score = item.metadata?.relevance_score || 
                   item.metadata?.quality_score || 
                   item.metadata?.score || 0;
      console.log(`\n  ${i + 1}. [スコア: ${score}] ${item.title}`);
      console.log(`     ソース: ${item.source}`);
      if (item.content) {
        console.log(`     内容: ${item.content.substring(0, 100)}...`);
      }
    });
    
    console.log('\n✨ テスト完了！');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

// テスト実行
testCollectionQuality();