// 記事生成APIのテスト
const testData = [
  {
    title: "ChatGPT-5が2025年春にリリース予定 - 日本企業も続々導入準備",
    content: "OpenAIは次世代のChatGPT-5を2025年春にリリースする計画を発表。日本の大手企業も導入に向けた準備を開始している。特に業務効率化の観点から注目が集まっており、月額3000円程度で使い放題になる見込み。",
    source: "OpenAI Analysis",
    url: "https://example.com/news1",
    collected_at: new Date().toISOString(),
    selected: true,
    metadata: {
      score: 9,
      relevance_score: 9
    }
  },
  {
    title: "AIで月収100万円！個人でも始められる副業ツール5選",
    content: "ChatGPTやClaudeを使った副業で月収100万円を達成した事例が続出。ライティング代行、画像生成、コンサルティングなど、初心者でも今すぐ始められる具体的な方法を紹介。必要な初期投資は月額2000円のみ。",
    source: "ChatGPT Web検索",
    url: "https://example.com/news2",
    collected_at: new Date().toISOString(),
    selected: true,
    metadata: {
      score: 8.5,
      relevance_score: 9
    }
  },
  {
    title: "日本企業のAI導入率が50%突破 - 業務効率が平均40%改善",
    content: "経済産業省の最新調査で、日本企業のAI導入率が初めて50%を突破。導入企業では平均40%の業務効率改善を実現。特に事務作業の自動化で大幅なコスト削減に成功している。",
    source: "日本技術メディア",
    url: "https://example.com/news3",
    collected_at: new Date().toISOString(),
    selected: true,
    metadata: {
      score: 8,
      relevance_score: 8
    }
  }
];

async function testArticleGeneration() {
  console.log('🧪 記事生成APIテスト開始...\n');
  
  try {
    const response = await fetch('http://localhost:3003/api/articles/generate-from-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: testData })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 記事生成成功！\n');
      
      const article = result.article;
      console.log('📰 タイトル:', article.title);
      console.log('📊 品質スコア:', article.quality_score || article.evaluation?.total_score || 'N/A');
      console.log('🔗 ソース数:', article.source_count || 'N/A');
      console.log('\n📝 記事の冒頭:');
      console.log(article.content.substring(0, 500) + '...\n');
      
      if (article.evaluation) {
        console.log('📈 評価詳細:');
        console.log('  - SEOスコア:', article.evaluation.seo_score);
        console.log('  - 読みやすさ:', article.evaluation.readability_score);
        console.log('  - 独創性:', article.evaluation.originality_score);
      }
    } else {
      console.error('❌ エラー:', result.error);
      if (result.details) {
        console.error('詳細:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ リクエストエラー:', error.message);
  }
}

// テスト実行
testArticleGeneration();