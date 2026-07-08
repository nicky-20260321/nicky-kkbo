# 🏠 家族向け簡易家計簿アプリ (Kakeibo Web App)

## 🎯 プロジェクトの概要と目的
家族（特定の許可されたGoogleアカウント）のみが利用する、シンプルでセキュリティが確保されたWeb家計簿アプリケーション。
外部APIサーバーは構築せず、フロントエンドからFirebase SDKを用いて直接Firestoreに接続するJamstack/2-Tier構成を採用している。

---

## 🛠️ 技術スタック
- **フロントエンド:** React (Vite / JavaScript or TypeScript)
- **ホスティング想定:** Vercel または GitHub Pages
- **バックエンド / データベース:** Firebase (Firestore)
- **認証 (Auth):** Firebase Authentication (Google Identity Provider)

---

## 🏗️ アーキテクチャ & セキュリティ方針

### 1. APIレスアーキテクチャ
- 従来のGET/POST APIサーバーは作成せず、React上のFirebase SDK (`firebase/firestore`) から直接データを読み書きする。

### 2. セキュリティ & アクセス制限（メールアドレスホワイトリスト方式）
- ユーザー認証はGoogleログイン（`signInWithPopup`）を使用。
- Firestoreの「セキュリティルール」により、許可された特定のメールアドレス（ホワイトリスト）以外のすべてのアクセス（Read/Write）を完全に遮断する。

#### Firestore セキュリティルール（運用中）
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /households/{householdId}/{document=**} {
      allow read, write: if 
        request.auth != null && 
        request.auth.token.email_verified == true &&
        request.auth.token.email in [
          'YOUR_EMAIL@gmail.com',
          'FAMILY_EMAIL@gmail.com'
        ];
    }
  }
}