# SELF vs SELF

自分との戦い。タスク管理＆モチベーション管理アプリ。

PWA（Progressive Web App）として動作し、スマホのホーム画面に追加するとアプリとして使えます。オフラインでも完全動作します。

## 機能

- ⚔️ タスク管理（4カテゴリ・タイマー付き）
- 🎯 ポイントシステム（基本ポイント＋ボーナス）
- 🔥 連続継続コンボボーナス
- 🌅 起床/就寝時刻ボーナス
- ⏱️ 過去最長時間更新ボーナス
- 📅 明日のタスク予約（+5 PWR）
- ⚡ 前倒し実行ボーナス（+15 PWR）
- 🏆 自己ベスト更新トラッキング
- ⚠️ ダメな行為の事前宣言式記録
- 💪 コーチが厳しい言葉で煽る
- 💾 完全オフライン動作（localStorage）

## セットアップ

### 1. ローカルで動作確認

```bash
npm install
npm run dev
```

http://localhost:3000 を開く

### 2. Vercelにデプロイ

#### 方法A: GitHub経由（推奨）

1. GitHubに新規リポジトリを作成（例: `self-vs-self`）
2. このフォルダ内で:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/self-vs-self.git
   git push -u origin main
   ```
3. [Vercel](https://vercel.com)にログイン → 「New Project」
4. GitHubリポジトリを選択 → Deploy
5. 数分後、`https://self-vs-self.vercel.app` のようなURLが生成される

#### 方法B: Vercel CLI

```bash
npm install -g vercel
vercel
```

### 3. カスタムドメイン（オプション）

`sarge.daiyamondo.jp` のようなサブドメインを使う場合:

1. Vercelのプロジェクト設定 → Domains → カスタムドメイン追加
2. DNSプロバイダーで CNAME レコード追加: `sarge` → `cname.vercel-dns.com`

### 4. スマホにインストール（PWA）

#### Android

1. Chromeで公開URLを開く
2. 右上のメニュー → 「ホーム画面に追加」
3. アイコンがホーム画面に追加される
4. タップするとフルスクリーンアプリとして起動

#### iPhone

1. Safariで公開URLを開く
2. 共有ボタン → 「ホーム画面に追加」
3. アイコンがホーム画面に追加される

## ファイル構成

```
self-vs-self/
├── app/
│   ├── globals.css      # Tailwind + ベーススタイル
│   ├── layout.tsx       # ルートレイアウト（PWAメタデータ）
│   └── page.tsx         # メインページ
├── components/
│   └── SelfVsSelf.jsx   # アプリ本体（約2000行）
├── public/
│   ├── manifest.json    # PWAマニフェスト
│   ├── icon-192.png     # アプリアイコン（小）
│   └── icon-512.png     # アプリアイコン（大）
├── next.config.js       # Next.js + PWA設定
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## データの保存場所

すべてのデータは**スマホ内のlocalStorage**に保存されます。
- 機種変更時はデータ消失（バックアップ機能を実装予定）
- 同じURLでも別のブラウザで開くと別データになる
- ブラウザのキャッシュ削除でデータが消える

## ライセンス

個人利用向け。
