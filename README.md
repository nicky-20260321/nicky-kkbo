これまでの開発の背景、技術スタック、そしてセキュリティ要件をすべて網羅した、そのままプロジェクトのルートに配置できる完成版の `README.md` を作成しました！

エージェント（Antigravity）がこのファイルを読み込むだけで、過去の経緯をすべて理解してスムーズに開発を引き継げる構成にしています。

---

```markdown
# 🪙 家族限定・簡易家計簿アプリ (Kakeibo App)

家族内でのみ安全・快適に利用することを目的とした、最小構成・低コスト運用のWeb家計簿アプリケーションです。

---

## 🛠️ 技術スタック & アーキテクチャ

本プロジェクトでは、インフラ維持コストと管理の手間を完全にゼロにするため、**APIサーバーを持たない 2-Tier（Jamstack）アーキテクチャ**を採用しています。

- **フロントエンド**: React (Vite)
- **ホスティング**: Vercel / GitHub Pages（予定）
- **バックエンド/DB**: Cloud Firestore (Firebase SDK経由でダイレクトに操作)
- **認証**: Firebase Authentication (Google Auth)

---

## 📂 Firestore データ構造（スキーマ）

NoSQLの特性を活かし、家族（グループ）単位のサブコレクション構造を採用しています。※現在は開発用の仮グループIDとして `family_a` を指定して検証中。

```plaintext
/households (コレクション)
    └── {householdId} (ドキュメント: 例 "family_a")
          │
          ├── /transactions (サブコレクション: 収支データ)
          │     └── {transactionId} (ドキュメント)
          │           ├── type: string ("expense" | "income")
          │           ├── amount: number (金額)
          │           ├── categoryId: string (カテゴリ識別子)
          │           ├── description: string (メモ・品名)
          │           ├── date: Timestamp (サーバータイムスタンプ)
          │           └── createdBy: string (登録者のユーザーUID)
          │
          └── /categories (サブコレクション: カテゴリデータ)
                └── {categoryId} (ドキュメント)
                      ├── name: string (例: "食費", "給与")
                      └── type: string ("expense" | "income")

```

---

## 🔒 セキュリティ & アクセス制御

不正アクセスや家族以外のデータ混入を防ぐため、Firestoreのサーバーサイドで強力な「メールアドレスによるホワイトリスト制（アプローチB）」を敷いています。

### Firestore セキュリティルール設定

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /households/{householdId}/{document=**} {
      allow read, write: if 
        request.auth != null && 
        request.auth.token.email_verified == true &&
        request.auth.token.email in [
          'your-own-email@gmail.com',
          'family-member@gmail.com'
        ];
    }
  }
}

```

*※ホワイトリストに登録されていないGoogleアカウントは、ログインはできてもFirestoreへのデータの読み書きはすべてクラウド側で完全遮断（Missing or insufficient permissions）されます。*

---

## 🚀 完了済みのステップ

* [x] Vite + React プロジェクトの初期セットアップ
* [x] Firebase SDK (`src/firebase.js`) の設定とインスタンス化
* [x] Google Auth を用いたログイン・ログアウト機能実装
* [x] Firestore セキュリティルールの適用（特定Googleアカウントのみの完全アクセス許可）
* [x] 収支データ（`transactions`）の基本Read/Write確認 (PoC完了)

---

## 📋 今後実装予定の機能 (バックログ)

### 1. 収支（Expense / Income）のタイプ別登録 & 表示UI

* 支出（`expense`）と収入（`income`）をフォームで切り替えて登録できるようにする。
* 一覧表示のフィルタリング（支出のみ、収入のみ、合計金額の計算）。

### 2. カテゴリ機能 (Categories)

* カテゴリ一覧の取得 (GET) および追加 (POST)。
* トランザクション登録時にカテゴリを選択できるドロップダウンの実装。

### 3. データ詳細取得・更新・削除 (CRUDの拡張)

* 1件のデータ詳細取得・編集・削除機能の追加。

### 4. 日付範囲・月別フィルター機能

* 当月分の収支のみを表示・集計するクエリの最適化。

### 5. UI/UXのブラッシュアップ & コンポーネント分割

* 現在の `App.jsx` に集中しているロジックをコンポーネントやカスタムフック（`useAuth` など）に分離。
* Tailwind CSS または UIライブラリ（MUI, shadcn/ui等）の導入によるスマホ対応コンポーネント化。

---

## 🤖 エージェント（AI）への指示方針

AIエージェントがコードの追加・修正を行う際は、以下のルールを厳格に遵守してください。

1. **Firebase SDKの適切な利用**: コード生成時、`firebase/firestore` のモジュール (`collection`, `addDoc`, `getDocs`, `query`, `where` 等) を適切に使用すること。
2. **2-Tier アーキテクチャの維持**: 不要なバックエンドサーバー（Express API等）を絶対に提案・構築しないこと。すべてフロントエンドのカスタムフックやFirebase SDKの操作で完結させること。
3. **データ構造の厳守**: データ構造は指定された `/households/{householdId}/...` のサブコレクション構成を絶対に崩さないこと（外れるとセキュリティルールで弾かれます）。
4. **データの整合性**: 金額（`amount`）を保存する際は必ず数値型（`Number()`）にキャストし、日時の記録には必ず `serverTimestamp()` を使用すること。

```

```