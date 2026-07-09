# 🪙 家族向け簡易家計簿アプリ (Kakeibo App)

家族内（許可された特定のGoogleアカウント）でのみ安全・快適に利用することを目的とした、コスト不要・高機能・モダンデザインのWeb家計簿アプリケーションです。

---

## 🛠️ 技術スタック & アーキテクチャ

インフラコストとサーバー管理の手間をゼロにするため、フロントエンドから Firebase SDK を用いて直接 Firestore に接続する **APIレス・2-Tier（Jamstack）アーキテクチャ**を採用しています。

- **フロントエンド**: React (Vite / JavaScript)
- **スタイリング**: Vanilla CSS (ダークテーマ、グラスモーフィズム、レスポンシブ対応)
- **データベース**: Cloud Firestore (`firebase/firestore` によるリアルタイム同期)
- **認証**: Firebase Authentication (Google OAuth ポップアップログイン)
- **CI/CD / ホスティング**: GitHub Actions & GitHub Pages

---

## 📂 ディレクトリ構成と各ファイルの役割

```plaintext
kakeibo-front/
├── .github/
│     └── workflows/
│           └── deploy.yml      # GitHub Pages への自動デプロイ用ワークフロー
├── src/
│     ├── assets/               # 静的アセット（画像やアイコンなど）
│     ├── components/           # UIコンポーネント
│     │     ├── Login.jsx       # ログイン & 未承認ユーザー向けアクセス制限画面
│     │     ├── Dashboard.jsx   # 今月の残高・収入・支出を表示するカード
│     │     ├── Charts.jsx      # SVGによるカテゴリ円グラフと日別推移エリアグラフ
│     │     ├── TransactionForm.jsx # ネイティブ <dialog> を用いた取引登録/編集モーダル
│     │     └── TransactionList.jsx # 日付グループ化された取引履歴、月別ナビゲーション
│     ├── App.jsx               # メインステート管理、リアルタイム同期、CRUD処理
│     ├── firebase.js           # Firebase SDK の初期化・モジュールエクスポート
│     ├── index.css             # グローバルデザインシステム（CSS変数、ダークテーマ、バリデーション等）
│     └── main.jsx              # アプリケーションのエントリーポイント（CSSインポートを含む）
├── .env.local                  # [ローカル専用] Firebase の接続設定（環境変数）
├── index.html                  # メイン HTML5 テンプレート
├── vite.config.js              # Vite の設定ファイル（本番用ベースパス nicky-kkbo 解決）
└── README.md                   # このドキュメント
```

---

## 🔒 セキュリティ & アクセス制御

ご家族以外の不正アクセスやデータの混入を防ぐため、Firestoreのサーバーサイド（セキュリティルール）およびクライアント側（Permission Denied キャッチ）で強力なアクセス制御を敷いています。

### 1. Firestore セキュリティルール（運用中）
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
*※リストに登録されていないGoogleアカウントは、認証が成功したとしても Firestore への読み書きがクラウド側で完全に遮断されます。*

### 2. クライアント側のエラー制御
Firestore からのデータ取得時に `permission-denied` エラーを検知した場合、アプリは即座に「アクセス制限」画面を表示して操作をロックし、別のアカウントでの再ログインやログアウトを促します。

---

## 🔑 環境変数の設定

Firebaseのキー情報はGitリポジトリにコミットせず、環境変数として管理します。

### 1. ローカル開発環境 (`.env.local`)
プロジェクトのルート直下に `.env.local` ファイルを作成し、以下の値を設定します（このファイルはGit管理から除外されます）。

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

### 2. 本番環境（GitHub Actions Secrets）
GitHubリポジトリの **Settings** > **Secrets and variables** > **Actions** の **Repository secrets** に、`.env.local` と同一の 6 つの変数を登録してください。GitHub Actions がビルド時にこれを自動で注入します。

---

## 🚀 ローカル開発手順

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. 開発用サーバーの起動
```bash
npm run dev
```
起動後、ブラウザで `http://localhost:5173` にアクセスします。

### 3. リンター（静的検証）の実行
```bash
npm run lint
```

### 4. 本番用成果物のビルド
```bash
npm run build
```
ビルド完了後、`dist/` ディレクトリに配備用の静的アセットが出力されます。

---

## 🚢 デプロイ & 公開（GitHub Pages）

本プロジェクトは GitHub Actions を利用して、GitHub へのコードプッシュ時に自動的に GitHub Pages へ公開される仕組みが整っています。

### 1. デプロイ実行
`main` ブランチへプッシュするか、GitHub上の Actions タブから手動実行（`workflow_dispatch`）することでデプロイが起動します。

```bash
git add .
git commit -m "feat: implement feature"
git push origin main
```

### 2. 初回公開時のGitHubリポジトリ設定
1. GitHub リポジトリ（`nicky-kkbo`）の **Settings** > **Pages** に移動します。
2. **Build and deployment** > **Source** で **`GitHub Actions`** を選択します。

### 3. Firebase Console の設定（必須）
Googleログインのポップアップを有効にするため、公開先のドメインをFirebaseの許可リストに追加する必要があります。
1. **Firebase Console** > **Authentication** > **設定 (Settings)** > **承認済みドメイン (Authorized domains)** に移動します。
2. **ドメインの追加 (Add domain)** から、**`nicky-20260321.github.io`** を登録します。

---

## 📜 開発の決まり事 (開発者へのガイドライン)

1. **イミュータビリティ（不変性）の遵守**:
   - React のレンダリング処理（JSXの出力ループなど）の中で、変数を再代入（`currentOffset += ...` など）してはいけません。イミュータビリティを保つため、ループの外部で事前に `map` や `reduce` を用いて累積データを計算してからJSXに渡してください。
2. **同期的な setState を Effect 内で行わない**:
   - 親コンポーネントからの `editTransaction` やモーダルの開閉に合わせて子フォームのステートをリセットする際は、`useEffect` の中で同期的に `setState` を呼び出すのではなく、コンポーネントに適切な `key`（例: `key={isFormOpen ? editTransaction.id : 'new'}`）を設定して再マウントさせ、初期値としてロードしてください。
3. **Vanilla CSS によるデザイン統一**:
   - 新しいUI要素を追加する際は、`src/index.css` に定義されている CSS 変数（`--bg-main`, `--color-primary`, `--radius-lg` など）を使用し、グラスモーフィズム (`.glass-panel`) を踏襲してください。