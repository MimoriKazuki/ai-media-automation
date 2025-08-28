import Anthropic from '@anthropic-ai/sdk';

export interface TrendAnalysis {
  trend_score: number;
  keywords: string[];
  summary: string;
  should_write_article: boolean;
  urgency: 'high' | 'medium' | 'low';
  predicted_performance: {
    estimated_views: number;
    engagement_score: number;
  };
}

export interface ArticleGeneration {
  title: string;
  content: string;
  meta_description: string;
  keywords: string[];
  estimated_reading_time: number;
}

export interface QualityEvaluation {
  total_score: number;
  seo_score: number;
  readability_score: number;
  accuracy_score: number;
  originality_score: number;
  engagement_score: number;
  improvements: string[];
  strengths: string[];
}

export interface LearningAnalysis {
  success_patterns: {
    title_patterns: string[];
    content_patterns: string[];
    optimal_length: number;
    best_posting_time: string;
  };
  failure_patterns: string[];
  prompt_improvements: {
    generation: string;
    evaluation: string;
  };
}

class ClaudeClient {
  private client: Anthropic | null = null;
  private useMockMode: boolean;
  private models = {
    analysis: 'claude-3-5-sonnet-20241022',
    generation: 'claude-3-5-sonnet-20241022',
    evaluation: 'claude-3-5-sonnet-20241022',
    learning: 'claude-3-5-haiku-20241022',
  };

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.useMockMode = !apiKey || apiKey === 'sk-ant-test-key';
    
    if (!this.useMockMode) {
      this.client = new Anthropic({
        apiKey: apiKey!,
      });
    }
  }

  async analyzeTrend(data: any[]): Promise<TrendAnalysis> {
    const prompt = `
    Analyze the following information for AI industry trends.
    
    Data: ${JSON.stringify(data)}
    
    Respond in JSON format:
    {
      "trend_score": (0-10 numeric value),
      "keywords": ["keyword1", "keyword2"],
      "summary": "trend summary",
      "should_write_article": true/false,
      "urgency": "high/medium/low",
      "predicted_performance": {
        "estimated_views": numeric,
        "engagement_score": 0-10
      }
    }
    `;

    const response = await this.callClaude(prompt, 'analysis');
    return JSON.parse(response);
  }

  async generateArticle(trend: TrendAnalysis, template: string): Promise<ArticleGeneration> {
    if (this.useMockMode) {
      return this.getMockArticle(trend);
    }

    const prompt = `
    以下のAIトレンド情報に基づいて、包括的で魅力的な日本語の記事を生成してください。
    
    トレンド情報: ${JSON.stringify(trend)}
    
    要件:
    - 文字数: 3000-4000文字
    - トーン: プロフェッショナルでありながら親しみやすい日本語
    - 構成: ${template}
    - 実践的な例と実用的な洞察を含める
    - SEO最適化された自然なキーワード配置
    - 全て日本語で記述すること
    
    必ず以下の形式の有効なJSONのみを返してください。前後に追加のテキストを含めないでください:
    {
      "title": "日本語の記事タイトル",
      "content": "Markdown形式の日本語記事内容",
      "meta_description": "日本語のメタ説明（最大160文字）",
      "keywords": ["キーワード1", "キーワード2"],
      "estimated_reading_time": 読了時間（分）
    }
    `;

    const response = await this.callClaude(prompt, 'generation');
    
    try {
      // JSONレスポンスの抽出を試みる
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse Claude response:', response);
      // フォールバックとしてモックデータを返す
      return this.getMockArticle(trend);
    }
  }

  async evaluateQuality(article: ArticleGeneration): Promise<QualityEvaluation> {
    if (this.useMockMode) {
      return this.getMockEvaluation();
    }

    const prompt = `
    以下の記事の品質を包括的に評価してください。
    
    記事: ${JSON.stringify(article)}
    
    評価基準:
    1. SEO最適化 (0-100)
    2. 読みやすさ (0-100)
    3. 情報の正確性 (0-100)
    4. 独創性 (0-100)
    5. 予測されるエンゲージメント (0-100)
    
    必ず以下の形式の有効なJSONのみを返してください。前後に追加のテキストを含めないでください:
    {
      "total_score": 0-100の総合スコア,
      "seo_score": 0-100のSEOスコア,
      "readability_score": 0-100の読みやすさスコア,
      "accuracy_score": 0-100の正確性スコア,
      "originality_score": 0-100の独創性スコア,
      "engagement_score": 0-100のエンゲージメントスコア,
      "improvements": ["改善点1（日本語）", "改善点2（日本語）"],
      "strengths": ["強み1（日本語）", "強み2（日本語）"]
    }
    `;

    const response = await this.callClaude(prompt, 'evaluation');
    
    try {
      // JSONレスポンスの抽出を試みる
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse evaluation response:', response);
      // フォールバックとしてモック評価を返す
      return this.getMockEvaluation();
    }
  }

  async learnFromPerformance(performanceData: any[]): Promise<LearningAnalysis> {
    const prompt = `
    Analyze article performance data to extract success patterns and improvement suggestions.
    
    Performance Data: ${JSON.stringify(performanceData)}
    
    Extract:
    1. Common patterns in successful articles
    2. Common issues in underperforming articles
    3. Improvement suggestions for prompts
    
    Respond in JSON format:
    {
      "success_patterns": {
        "title_patterns": ["pattern1", "pattern2"],
        "content_patterns": ["pattern1", "pattern2"],
        "optimal_length": numeric,
        "best_posting_time": "HH:MM"
      },
      "failure_patterns": ["issue1", "issue2"],
      "prompt_improvements": {
        "generation": "improved generation prompt",
        "evaluation": "improved evaluation prompt"
      }
    }
    `;

    const response = await this.callClaude(prompt, 'learning');
    return JSON.parse(response);
  }

  async improveArticle(article: ArticleGeneration, improvements: string[]): Promise<ArticleGeneration> {
    const prompt = `
    Improve the following article based on the provided feedback.
    
    Original Article: ${JSON.stringify(article)}
    Improvements Needed: ${JSON.stringify(improvements)}
    
    Generate an improved version maintaining the same structure but addressing all improvement points.
    
    Respond in JSON format with the same structure as the original.
    `;

    const response = await this.callClaude(prompt, 'generation');
    return JSON.parse(response);
  }

  private async callClaude(prompt: string, modelType: keyof typeof this.models): Promise<string> {
    if (!this.client) {
      throw new Error('Claude client not initialized. Please set ANTHROPIC_API_KEY.');
    }

    try {
      const message = await this.client.messages.create({
        model: this.models[modelType],
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      throw new Error('Unexpected response type from Claude');
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  }

  private getMockArticle(trend: TrendAnalysis): ArticleGeneration {
    const title = trend.summary || 'AIの未来を切り開く革新的な技術トレンド';
    // keywords が文字列の場合は配列に変換
    const keywordsArray = Array.isArray(trend.keywords) 
      ? trend.keywords 
      : typeof trend.keywords === 'string' 
        ? trend.keywords.split(',').map(k => k.trim())
        : ['AI', '機械学習', 'ディープラーニング', '自動化'];
    
    return {
      title,
      content: `# ${title}

## はじめに

人工知能（AI）の世界は日々進化を続けています。${trend.summary || 'このトピック'}は、業界に大きな影響を与える可能性を秘めています。

## 主要なポイント

### 1. 技術の革新性
最新のAI技術は、従来の限界を超えて新たな可能性を開いています。

### 2. 実用的な応用
- ビジネスプロセスの自動化
- 意思決定の支援
- 創造的な作業の効率化

### 3. 今後の展望
この技術トレンドは、今後数年間で大きな成長が期待されています。

## まとめ

${keywordsArray.join(', ')}の進化は、私たちの働き方と生活を大きく変える可能性があります。

---
*この記事はモックモードで生成されました。実際のAI生成には有効なAPIキーが必要です。*`,
      meta_description: `${title.substring(0, 150)}...`,
      keywords: keywordsArray,
      estimated_reading_time: 5
    };
  }

  private getMockEvaluation(): QualityEvaluation {
    return {
      total_score: 85,
      seo_score: 88,
      readability_score: 82,
      accuracy_score: 90,
      originality_score: 78,
      engagement_score: 85,
      improvements: [
        'より具体的な事例を追加することで説得力が増します',
        'キーワードの配置をより自然にすることでSEOスコアが向上します',
        '見出しをより魅力的にすることで読者の関心を引けます'
      ],
      strengths: [
        '構成が明確で読みやすい',
        '技術的な内容を分かりやすく説明している',
        '実用的な視点が含まれている',
        '日本語として自然で流暢な文章'
      ]
    };
  }
}

export const claude = new ClaudeClient();