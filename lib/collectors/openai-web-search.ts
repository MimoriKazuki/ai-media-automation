import { BaseCollector, CollectedData } from './base';

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export class OpenAIWebSearchCollector extends BaseCollector {
  private apiKey: string;

  constructor() {
    super('OpenAI Web Search', 'technology');
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async collect(): Promise<CollectedData[]> {
    if (!this.apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return [];
    }

    const allData: CollectedData[] = [];
    
    try {
      // 日本人が最も関心を持つ重要トピック2つに絞る（質重視）
      const searchQueries = [
        'ChatGPT Claude 日本企業 導入事例 成功 ROI 2025年 最新',
        'AI 副業 稼ぐ 具体的方法 月収 実績 日本人'
      ];

      // タイムアウトを設定（最大30秒）
      const timeoutPromise = new Promise<CollectedData[]>((resolve) => {
        setTimeout(() => {
          console.log('OpenAI Web Search timeout after 20 seconds');
          resolve([]);
        }, 20000);
      });

      const searchPromise = (async () => {
        for (const query of searchQueries) {
          try {
            const results = await this.searchWithGPT(query);
            allData.push(...results);
            // API rate limitを考慮して少し待つ
            await this.delay(1000);
          } catch (error) {
            console.error(`Error searching for query: ${query}`, error);
          }
        }
        return allData;
      })();

      // タイムアウトか検索完了のどちらか早い方を返す
      const finalData = await Promise.race([searchPromise, timeoutPromise]);

      console.log(`✅ Collected ${finalData.length} articles using OpenAI Web Search`);
      return finalData;
    } catch (error) {
      console.error('Error collecting with OpenAI:', error);
      return allData;
    }
  }

  private async searchWithGPT(query: string): Promise<CollectedData[]> {
    try {
      const systemPrompt = `あなたは日本のAIメディア編集者です。
日本人読者が最も関心を持つ、実用的で具体的なAI情報を収集してください。
特に以下の観点を重視してください：
- 日本企業や日本人個人が実際に活用できる情報
- 収益化や副業につながる実践的な内容
- 日本の法規制や文化に適した情報
- 初心者でも理解できる具体例`;

      const userPrompt = `以下のトピックについて、日本人読者が「今すぐ知りたい！」と思う情報を3件収集してください：
"${query}"

各情報について以下の形式でJSONとして返してください：
{
  "results": [
    {
      "title": "キャッチーで興味を引く記事タイトル（日本語、40文字以内）",
      "url": "実際のURL（存在する場合のみ）",
      "source": "情報源の名前",
      "summary": "日本人にとってのメリットや具体的な活用方法を含む要約（300文字程度）",
      "relevance_score": 1-10の重要度スコア（日本市場での重要度）,
      "date": "YYYY-MM-DD形式の日付",
      "japanese_impact": "日本人/日本企業への具体的な影響や活用例",
      "quality_indicators": {
        "has_numbers": "具体的な数字があるか",
        "has_case_study": "事例があるか",
        "actionable": "実行可能な内容か"
      }
    }
  ]
}

収集基準（重要度順）：
1. 具体的な数字（収益額、効率化％、ROI等）が必須
2. 実際の成功事例や失敗事例がある
3. 日本市場に特化した情報（日本企業、日本人の事例）
4. 今すぐ実行可能なアクションプランがある
5. 信頼性の高い情報源（大手企業、公的機関、実績ある個人）

重要度スコア7以上の良質な情報を2件提供してください。`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 1500,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);
      const results = parsed.results || [];

      // 品質の高い情報をフィルタリング（スコア7以上）
      const highQualityResults = results.filter((item: any) => 
        item.relevance_score >= 7
      );

      return highQualityResults.map((item: any) => ({
        source: `OpenAI Search - ${item.source || 'Web'}`,
        category: 'technology',
        title: item.title,
        url: item.url || `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
        content: item.summary || '',
        author: item.source || 'OpenAI Web Search',
        collected_at: new Date().toISOString(),
        external_id: `openai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          relevance_score: item.relevance_score || 5,
          search_query: query,
          estimated_date: item.date || new Date().toISOString(),
          ai_generated: true,
          quality_indicators: item.quality_indicators,
          japanese_impact: item.japanese_impact
        },
        processed: false
      }));
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
      return [];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}