# API設定ガイド

## Anthropic Claude API キーの設定

記事自動生成機能を使用するには、Anthropic Claude APIキーが必要です。

### 1. APIキーの取得

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. アカウントを作成またはログイン
3. API Keys セクションに移動
4. 新しいAPIキーを作成

### 2. 環境変数の設定

`.env.local` ファイルを編集して、APIキーを設定：

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx
```

**重要**: 
- `sk-ant-test-key` はダミーキーです
- 実際のAPIキーに置き換えてください
- APIキーは絶対に公開しないでください
- `.env.local` はGitにコミットされません（.gitignoreに含まれています）

### 3. APIキーなしでのテスト

APIキーがない場合でも、以下の機能は利用可能です：
- データ収集機能
- 記事管理画面のUI
- ダミーデータでの動作確認

### 4. モックモードの使用

開発時はモックモードを使用できます：

```typescript
// lib/claude.ts にモックモードを追加
export const useMockMode = process.env.ANTHROPIC_API_KEY === 'sk-ant-test-key';
```

## トラブルシューティング

### エラー: "invalid x-api-key"
- APIキーが正しく設定されているか確認
- APIキーの前後に空白がないか確認
- APIキーが有効期限内か確認

### エラー: "rate limit exceeded"
- APIの使用制限に達しています
- しばらく待ってから再試行してください

### エラー: "insufficient credits"
- APIクレジットが不足しています
- Anthropic Consoleでクレジットを追加してください

## セキュリティのベストプラクティス

1. **環境変数を使用**: ハードコードは避ける
2. **権限の最小化**: 必要最小限のAPIキーのみ使用
3. **定期的な更新**: APIキーを定期的にローテーション
4. **監視**: API使用量を定期的に確認

## 参考リンク

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Next.js Environment Variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)