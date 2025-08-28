import { BaseCollector, CollectedData } from './base';

export class OpenAIAnalysisCollector extends BaseCollector {
  private apiKey: string;

  constructor() {
    super('OpenAI Analysis', 'analysis');
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async collect(): Promise<CollectedData[]> {
    if (!this.apiKey) {
      console.error('OpenAI API key not found');
      return [];
    }

    try {
      // 最も重要な分析を実行（タイムアウト付き）
      const timeoutPromise = new Promise<CollectedData[]>((resolve) => {
        setTimeout(() => {
          console.log('OpenAI Analysis timeout after 10 seconds');
          resolve([]);
        }, 10000);
      });

      const analysisPromise = this.analyzeJapaneseMarket();
      const allData = await Promise.race([analysisPromise, timeoutPromise]);

      // 品質スコア7以上の高品質データのみを返す
      const highQualityData = allData.filter(item => {
        const score = item.metadata?.score || item.metadata?.relevance || 0;
        return score >= 7;
      });

      console.log(`✅ Collected ${highQualityData.length} high-quality insights using OpenAI Analysis`);
      return highQualityData;
    } catch (error) {
      console.error('Error in OpenAI Analysis:', error);
      return [];
    }
  }

  private async analyzeCurrentTrends(): Promise<CollectedData[]> {
    const prompt = `日本人が今最も知るべきAIトレンドを分析してください。
「これを知らないと損する」「今始めないと手遅れ」というレベルの重要情報を5つ選んでください。

形式：
{
  "trends": [
    {
      "title": "衝撃的でクリック必須のタイトル（30文字以内）",
      "category": "収益化/効率化/スキル/投資",
      "description": "なぜ日本人が今すぐ知るべきか、具体的なメリットと数字を含む説明（400文字）",
      "impact_score": 1-10（日本での緊急度）,
      "key_players": ["日本で使えるサービス名"],
      "future_outlook": "始めるなら今！の理由",
      "action_items": ["今日からできる3つのステップ"]
    }
  ]
}`;

    return await this.callGPTForAnalysis(prompt, 'trends');
  }

  private async getIndustryInsights(): Promise<CollectedData[]> {
    const prompt = `日本人が今すぐ活用すべきAI業界の「お金になる」「時短になる」情報を分析してください。
特に個人でも始められる、中小企業でも導入できる実践的な情報に焦点を当ててください。

JSON形式で5つの即効性のある情報を提供してください：
{
  "insights": [
    {
      "title": "今すぐ試せる！系のキャッチーなタイトル",
      "area": "副業/業務効率化/コスト削減/スキルアップ/投資",
      "summary": "具体的な金額や時間削減の数字を含む要約（200文字）",
      "details": "実際の導入手順、必要なツール、期待できる成果の詳細（400文字）",
      "importance": 1-10（すぐ始めるべき緊急度）,
      "sources": ["日本語で使えるツール・サービス名"],
      "cost": "初期費用と月額費用",
      "roi": "投資回収期間や期待収益"
    }
  ]
}`;

    return await this.callGPTForAnalysis(prompt, 'insights');
  }

  private async analyzeJapaneseMarket(): Promise<CollectedData[]> {
    const prompt = `日本人が絶対に見逃せないAI関連の「チャンス」と「脅威」を分析してください。
特に以下の観点から、今すぐ行動すべき情報を提供してください：

1. 今なら間に合う！AIで稼ぐ具体的な方法
2. これをやらないと仕事がなくなる！必須AIスキル
3. 日本企業が今すぐ導入すべきAIツール（ROI付き）
4. AI時代に生き残る職業・消える職業
5. 今買うべきAI関連株・投資先

重要で実用的な情報を2つJSON形式で提供してください：
{
  "japan_market": [
    {
      "title": "緊急性を感じさせる刺激的なタイトル（30文字以内）",
      "sector": "個人副業/転職/企業導入/投資/教育",
      "current_state": "なぜ今すぐ始めるべきか、具体的な数字と事例（300文字）",
      "challenges": "始めない場合のリスク",
      "opportunities": "始めた場合の具体的なメリット（金額・時間）",
      "forecast": "3ヶ月後、1年後の予測",
      "relevance": 1-10（緊急度）,
      "action_plan": "今日から始める具体的な3ステップ"
    }
  ]
}`;

    return await this.callGPTForAnalysis(prompt, 'japan_market');
  }

  private async callGPTForAnalysis(prompt: string, type: string): Promise<CollectedData[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `あなたは日本のAIメディアの編集長です。
読者は以下のような人々です：
- AIで副業を始めたい会社員
- 業務効率化したい中小企業経営者
- AI時代に備えたい個人
- 投資チャンスを探している個人投資家

彼らが「今すぐ行動したくなる」「読まないと損する」と感じる情報を提供してください。
具体的な数字、実例、すぐ使えるツール名を必ず含めてください。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 1500,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);
      const items = parsed[type] || parsed.trends || parsed.insights || parsed.japan_market || [];

      // 最大2件までに制限
      const limitedItems = items.slice(0, 2);

      return limitedItems.map((item: any, index: number) => ({
        source: `OpenAI Analysis - ${type}`,
        category: 'analysis',
        title: item.title,
        url: `#ai-analysis-${type}-${index}`,
        content: item.description || item.details || item.summary || 
                `${item.current_state}\n\n課題: ${item.challenges}\n機会: ${item.opportunities}`,
        author: 'ChatGPT-4 Analysis',
        collected_at: new Date().toISOString(),
        external_id: `openai-analysis-${type}-${Date.now()}-${index}`,
        metadata: {
          analysis_type: type,
          score: item.impact_score || item.importance || item.relevance || 5,
          category: item.category || item.area || item.sector,
          key_players: item.key_players,
          future_outlook: item.future_outlook || item.forecast,
          ai_generated: true,
          action_plan: item.action_plan,
          roi: item.roi,
          urgency: item.urgency || 'medium'
        },
        processed: false
      }));
    } catch (error) {
      console.error(`Error in GPT analysis (${type}):`, error);
      return [];
    }
  }
}