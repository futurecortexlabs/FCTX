// FCTX Autonomous Cognitive Synthesizer
import type { MorphicWidget, ThoughtPreset } from '../types/morphic';

export function synthesizeWidgetsFromPrompt(
  prompt: string,
  _existingWidgets: MorphicWidget[] = []
): { widgets: MorphicWidget[]; reasoning: string } {
  const p = prompt.toLowerCase();
  const widgets: MorphicWidget[] = [];
  const timestamp = Date.now();

  let reasoning = '文脈から思考パターンを抽出し、最適な自己変形ツール群を生成しました。';

  // 1. Financial / SaaS / Pricing / Revenue / Cost / Investment
  if (
    p.includes('価格') ||
    p.includes('料金') ||
    p.includes('売上') ||
    p.includes('コスト') ||
    p.includes('シミュレーション') ||
    p.includes('pricing') ||
    p.includes('revenue') ||
    p.includes('finance') ||
    p.includes('投資') ||
    p.includes('予算')
  ) {
    reasoning = '数値予測と感度分析の要求を検知。変数パラメータ・シミュレーターと投資回収パイプラインを合成しました。';
    widgets.push({
      id: `sim_${timestamp}_1`,
      title: '収益モデル & 価格弾力性シミュレーター',
      type: 'simulation',
      category: 'Finance & Strategy',
      description: '月間アクティブユーザー数、コンバージョン率、単価からMRR/ARRおよび年間利益をリアルタイム算出',
      iconName: 'Sliders',
      accentColor: 'indigo',
      size: 'wide',
      createdAt: timestamp,
      outputKey: 'annual_profit',
      data: {
        variables: [
          { id: 'mau', name: 'mau', label: '月間訪問者 (MAU)', value: 25000, min: 1000, max: 200000, step: 1000, unit: '人' },
          { id: 'cvr', name: 'cvr', label: 'CVR (有料転換率)', value: 3.5, min: 0.1, max: 15.0, step: 0.1, unit: '%' },
          { id: 'price', name: 'price', label: 'プラン月額料金', value: 2980, min: 500, max: 20000, step: 100, unit: '円' },
          { id: 'churn', name: 'churn', label: '月次解約率 (Churn)', value: 2.0, min: 0.5, max: 10.0, step: 0.5, unit: '%' },
          { id: 'opex', name: 'opex', label: '月次運用原価 (OPEX)', value: 850000, min: 100000, max: 5000000, step: 50000, unit: '円' },
        ],
        formulas: [
          { id: 'mrr', label: '推定 MRR (月次経常収益)', unit: '円', calculate: '(mau * (cvr / 100)) * price' },
          { id: 'arr', label: '推定 ARR (年換算)', unit: '円', calculate: '((mau * (cvr / 100)) * price) * 12' },
          { id: 'profit', label: '月間純営業利益 (EBIT)', unit: '円', calculate: '((mau * (cvr / 100)) * price) - opex' },
        ],
      },
    });

    widgets.push({
      id: `matrix_${timestamp}_2`,
      title: '獲得チャネル別 コスト対効果マトリクス',
      type: 'matrix',
      category: 'Marketing',
      description: '各プロモーション施策の獲得単価(CAC)とLTV予測を2軸プロット',
      iconName: 'Compass',
      accentColor: 'emerald',
      size: 'normal',
      createdAt: timestamp + 1,
      data: {
        matrixAxes: {
          xLabel: '獲得効率 (低CAC → 高CAC)',
          yLabel: '長期価値 (LTV)',
          quadrants: ['即時獲得・高収益', '高コストだが優良顧客', '低コスト小粒', '見直し対象'],
        },
        matrixItems: [
          { id: 'm1', label: 'SEO/オウンドメディア', x: 25, y: 78, category: 'Organic' },
          { id: 'm2', label: '検索連動型広告', x: 65, y: 60, category: 'Paid' },
          { id: 'm3', label: '紹介・リファラル', x: 20, y: 88, category: 'Organic' },
          { id: 'm4', label: 'SNSインフルエンサー', x: 75, y: 45, category: 'Paid' },
        ],
      },
    });
  }

  // 2. Risk, Crisis, Security, Incident, Bug
  else if (
    p.includes('リスク') ||
    p.includes('危機') ||
    p.includes('セキュリティ') ||
    p.includes('障害') ||
    p.includes('バグ') ||
    p.includes('脆弱性') ||
    p.includes('risk') ||
    p.includes('incident') ||
    p.includes('security')
  ) {
    reasoning = '危機対応とリスク優先度分析を検知。影響度対発生確率マトリクスと、インシデント封じ込めパイプラインを即時生成しました。';
    widgets.push({
      id: `matrix_${timestamp}_1`,
      title: 'リスク脅威度 & 影響評価レーダー',
      type: 'matrix',
      category: 'Risk Management',
      description: '発生確率と被害深刻度による優先順位付けマトリクス',
      iconName: 'Compass',
      accentColor: 'rose',
      size: 'normal',
      createdAt: timestamp,
      data: {
        matrixAxes: {
          xLabel: '発生確率 (低 → 高)',
          yLabel: '被害規模 (軽微 → 致命的)',
          quadrants: ['警戒・要監視', '即時対応最優先 (Critical)', '受容可能リスク', '早期対策推奨'],
        },
        matrixItems: [
          { id: 'r1', label: '認証トークン漏洩リスク', x: 30, y: 92, category: 'Security' },
          { id: 'r2', label: 'DBフェイルオーバー遅延', x: 45, y: 80, category: 'Infra' },
          { id: 'r3', label: '外部決済APIの障害', x: 60, y: 70, category: 'External' },
          { id: 'r4', label: 'UI軽微表示崩れ', x: 80, y: 20, category: 'Frontend' },
        ],
      },
    });

    widgets.push({
      id: `pipe_${timestamp}_2`,
      title: 'インシデント封じ込め & 復旧パイプライン',
      type: 'pipeline',
      category: 'Emergency Ops',
      description: '初動トリアージから原因究明、事後検証までの標準対応フロー',
      iconName: 'GitBranch',
      accentColor: 'amber',
      size: 'wide',
      createdAt: timestamp + 1,
      data: {
        stages: [
          {
            id: 's1',
            title: '1. 初動・検知',
            items: [
              { id: 'i1', text: 'ログ隔離と影響範囲の特定', done: true, priority: 'high' },
              { id: 'i2', text: '全社緊急チャネルの立ち上げ', done: true, priority: 'high' },
            ],
          },
          {
            id: 's2',
            title: '2. 封じ込め',
            items: [
              { id: 'i3', text: '該当APIエンドポイントの一時レート制限', done: false, priority: 'high' },
              { id: 'i4', text: 'セッショントークンの強制失効', done: false, priority: 'med' },
            ],
          },
          {
            id: 's3',
            title: '3. 根本改修 & 事後報告',
            items: [
              { id: 'i5', text: '修正パッチのステージング検証', done: false, priority: 'med' },
              { id: 'i6', text: 'ポストモーテム(再発防止録)の執筆', done: false, priority: 'low' },
            ],
          },
        ],
      },
    });
  }

  // 3. Dilemma / Decision / Tradeoff / Comparison (A/B)
  else if (
    p.includes('比較') ||
    p.includes('意思決定') ||
    p.includes('どちら') ||
    p.includes('トレードオフ') ||
    p.includes('選ぶ') ||
    p.includes('迷う') ||
    p.includes('tradeoff') ||
    p.includes('decision') ||
    p.includes('compare') ||
    p.includes('alternative')
  ) {
    reasoning = '複数選択肢の比較検討と重み付け評価を検知。客観的スコアリング・ディレンマ評価エンジンを展開しました。';
    widgets.push({
      id: `trade_${timestamp}_1`,
      title: 'マルチクライテリア意思決定エンジン',
      type: 'tradeoff',
      category: 'Decision Science',
      description: '重み付け評価基準により、直感バイアスを排した定量スコアを算出',
      iconName: 'Scale',
      accentColor: 'purple',
      size: 'wide',
      createdAt: timestamp,
      data: {
        criteria: [
          { id: 'c1', name: '開発スピード・工期短縮', weight: 5 },
          { id: 'c2', name: '長期スケーラビリティ', weight: 4 },
          { id: 'c3', name: '初期ランニングコスト', weight: 3 },
          { id: 'c4', name: 'チームの学習コスト', weight: 4 },
        ],
        options: [
          {
            id: 'o1',
            title: 'アプローチA: フルマネージドSaaS統合',
            pros: ['最短2週間でMVPローンチ可能', 'インフラ保守の負担ゼロ'],
            cons: ['スケール時のコスト跳ね上がり', 'ベンダーロックインのリスク'],
            scores: { c1: 9, c2: 5, c3: 4, c4: 8 },
          },
          {
            id: 'o2',
            title: 'アプローチB: 自社OSSマイクロサービス構築',
            pros: ['完全なカスタマイズ性とデータ主権', '大規模時のコスト最適'],
            cons: ['初期工期が3ヶ月必要', '専任DevOps人員の確保が必須'],
            scores: { c1: 4, c2: 9, c3: 7, c4: 3 },
          },
        ],
      },
    });

    widgets.push({
      id: `note_${timestamp}_2`,
      title: '意思決定の根拠メモ & 前提条件',
      type: 'synapse_notes',
      category: 'Cognitive Notes',
      description: '決定の背景にある仮説と、見直すべきトリガー条件の記録',
      iconName: 'FileText',
      accentColor: 'indigo',
      size: 'normal',
      createdAt: timestamp + 1,
      data: {
        content: `### 意思決定のチェックポイント
- **再評価フラグ**: 月間リクエスト数が100万件を超えた時点でインフラ構成を再レビューする。
- **不可逆性の判定**: この決定は不可逆な「片道切符」か、それとも「後戻り可能」か？
- **直感との乖離**: 定量スコアと直感に乖離がある場合、どの基準の重み付けが暗黙的に重視されているかを自己問診すること。`,
      },
    });
  }

  // 4. Creative / Worldbuilding / Brainstorming / Story
  else if (
    p.includes('物語') ||
    p.includes('世界観') ||
    p.includes('創作') ||
    p.includes('アイデア') ||
    p.includes('ブレスト') ||
    p.includes('クリエイティブ') ||
    p.includes('novel') ||
    p.includes('creative') ||
    p.includes('story')
  ) {
    reasoning = '物語・世界観設定の創作文脈を検知。設定の整合性メモ、登場勢力相関プロット、集中環境用アンビエント音響を合成しました。';
    widgets.push({
      id: `note_${timestamp}_1`,
      title: '世界観コア設定 & 禁則事項 (Codex)',
      type: 'synapse_notes',
      category: 'Worldbuilding',
      description: '魔法・科学の基本法則、世界の歴史的転換点、絶対ルール',
      iconName: 'FileText',
      accentColor: 'purple',
      size: 'wide',
      createdAt: timestamp,
      data: {
        content: `## 世界の理 (Fundamental Axioms)
1. **エネルギー保存の歪み**: 記憶を対価として事象を書き換える現象が観測されている。
2. **中心機関**: 〈統治知性アルケミスト〉が都市の代謝を完全に予測制御している。
3. **対立軸**: 完全予測を信奉する内環都市群 vs 偶発性と肉体を信仰する外延棄民。`,
      },
    });

    widgets.push({
      id: `matrix_${timestamp}_2`,
      title: '勢力・キャラクター力学マップ',
      type: 'matrix',
      category: 'Characters',
      description: '秩序/混沌、理念的/功利主義の2軸における主要勢力の配置',
      iconName: 'Compass',
      accentColor: 'cyan',
      size: 'normal',
      createdAt: timestamp + 1,
      data: {
        matrixAxes: {
          xLabel: '行動規範 (利己・生存優先 → 理想・利他優先)',
          yLabel: '体制への態度 (反乱・破壊 → 秩序・維持)',
          quadrants: ['体制の守護聖徒', '理想主義の革命軍', '現実主義の傭兵連合', '破壊衝動のアナキスト'],
        },
        matrixItems: [
          { id: 'w1', label: '中央執行機関', x: 80, y: 90 },
          { id: 'w2', label: '地下レジスタンス', x: 85, y: 25 },
          { id: 'w3', label: '闇市場の商人ギルド', x: 20, y: 55 },
        ],
      },
    });

    widgets.push({
      id: `audio_${timestamp}_3`,
      title: '深層意識シータ波 (創作フロー音響)',
      type: 'ambient_audio',
      category: 'Audio Immersion',
      description: '集中力と連想記憶を高める6Hzシータ波バイノーラルビート',
      iconName: 'Activity',
      accentColor: 'indigo',
      size: 'normal',
      createdAt: timestamp + 2,
      data: {
        soundPreset: 'theta',
        volume: 0.35,
      },
    });
  }

  // 5. Product Launch, OKR, Roadmap, Feature Delivery
  else if (
    p.includes('プロダクト') ||
    p.includes('ローンチ') ||
    p.includes('okr') ||
    p.includes('ロードマップ') ||
    p.includes('リリース') ||
    p.includes('launch') ||
    p.includes('feature') ||
    p.includes('product')
  ) {
    reasoning = '新プロダクトのローンチ戦略とOKR進行管理を検知。ノーススター指標シミュレーター、機能価値対複雑度レーダー、ゲートウェイ進行パイプラインを展開しました。';
    widgets.push({
      id: `sim_${timestamp}_1`,
      title: 'ノーススター指標 & 成長ループ予測',
      type: 'simulation',
      category: 'Product & OKR',
      description: '初期獲得数、初回オンボーディング突破率、リテンション率から月間アクティブ率とLTVを即時試算',
      iconName: 'Sliders',
      accentColor: 'indigo',
      size: 'wide',
      createdAt: timestamp,
      outputKey: 'projected_dau',
      data: {
        variables: [
          { id: 'signups', name: 'signups', label: '月間新規登録者数', value: 8000, min: 500, max: 100000, step: 500, unit: '人' },
          { id: 'activation', name: 'activation', label: '初回オンボーディング突破率', value: 45, min: 10, max: 90, step: 1, unit: '%' },
          { id: 'w1_retention', name: 'w1_retention', label: '1週後リテンション率 (W1)', value: 38, min: 5, max: 80, step: 1, unit: '%' },
          { id: 'k_factor', name: 'k_factor', label: 'バイラル拡散係数 (K-Factor)', value: 1.2, min: 0.1, max: 3.0, step: 0.1, unit: '係数' },
        ],
        formulas: [
          { id: 'activated_users', label: '月間コア定着ユーザー数', unit: '人', calculate: 'signups * (activation / 100)' },
          { id: 'viral_spread', label: 'バイラル経由の二次流入数', unit: '人', calculate: '(signups * (activation / 100)) * k_factor' },
          { id: 'projected_dau', label: '推定DAUベースライン', unit: '人', calculate: '((signups * (activation / 100)) * (w1_retention / 100)) * 30' },
        ],
      },
    });

    widgets.push({
      id: `matrix_${timestamp}_2`,
      title: '機能優先度 (価値 vs 実装複雑度)',
      type: 'matrix',
      category: 'Product Prioritization',
      description: '顧客へのインパクトとエンジニアリング工数を2軸マッピング',
      iconName: 'Compass',
      accentColor: 'cyan',
      size: 'normal',
      createdAt: timestamp + 1,
      data: {
        matrixAxes: {
          xLabel: '実装複雑度 (低工数 → 高工数)',
          yLabel: '顧客価値・インパクト (低 → 極大)',
          quadrants: ['即時着手 (Quick Wins)', '戦略的コア機能 (Big Bets)', '空き時間対応 (Fill-ins)', '見送り・スコープ外'],
        },
        matrixItems: [
          { id: 'okr_f1', label: 'ワンクリックOAuth登録', x: 25, y: 85, category: 'Growth' },
          { id: 'okr_f2', label: 'リアルタイム共同編集エンジン', x: 80, y: 92, category: 'Core' },
          { id: 'okr_f3', label: 'Slack/Discord通知連携', x: 30, y: 70, category: 'Integration' },
          { id: 'okr_f4', label: 'ダークモード微調整', x: 20, y: 35, category: 'Polish' },
        ],
      },
    });

    widgets.push({
      id: `pipe_${timestamp}_3`,
      title: 'ローンチ・ステージゲート進行管理',
      type: 'pipeline',
      category: 'Launch Gates',
      description: 'アルファ検証からグローバル一般公開までの必須チェックポイント',
      iconName: 'GitBranch',
      accentColor: 'emerald',
      size: 'wide',
      createdAt: timestamp + 2,
      data: {
        stages: [
          {
            id: 'gate_1',
            title: 'Gate 1: Private Alpha (クローズド)',
            items: [
              { id: 'g1_1', text: '選定した友好企業20社でのDogfooding検証', done: true, priority: 'high' },
              { id: 'g1_2', text: 'コア利用シナリオのP99レイテンシ150ms未満達成', done: true, priority: 'high' },
            ],
          },
          {
            id: 'gate_2',
            title: 'Gate 2: Public Beta (事前登録解放)',
            items: [
              { id: 'g2_1', text: 'Stripe従量課金および自動インボイス発行の疎通', done: false, priority: 'high' },
              { id: 'g2_2', text: 'ランディングページCVR 5%以上への最適化', done: false, priority: 'med' },
            ],
          },
          {
            id: 'gate_3',
            title: 'Gate 3: General Availability (一般公開)',
            items: [
              { id: 'g3_1', text: 'プロダクトハント & テックプレス一斉ローンチ', done: false, priority: 'high' },
              { id: 'g3_2', text: '24/7オンコール体制とSLA 99.9%監視確立', done: false, priority: 'med' },
            ],
          },
        ],
      },
    });
  }

  // 6. Agile Sprint, Velocity & Daily Retrospective
  else if (
    p.includes('スプリント') ||
    p.includes('アジャイル') ||
    p.includes('レトロ') ||
    p.includes('カンバン') ||
    p.includes('スクラム') ||
    p.includes('sprint') ||
    p.includes('agile') ||
    p.includes('retro') ||
    p.includes('scrum')
  ) {
    reasoning = 'アジャイル開発スプリントの生産性と振り返りを検知。スプリントベロシティ試算、カンバン実行フロー、KPTレトロスペクティブを合成しました。';
    widgets.push({
      id: `sim_${timestamp}_1`,
      title: 'スプリント・キャパシティ & ベロシティ予測',
      type: 'simulation',
      category: 'Agile Velocity',
      description: '開発エンジニア数、稼働日数、割り込み比率からスプリント達成可能ストーリーポイントを算出',
      iconName: 'Sliders',
      accentColor: 'indigo',
      size: 'normal',
      createdAt: timestamp,
      outputKey: 'net_velocity',
      data: {
        variables: [
          { id: 'devs', name: 'devs', label: '開発エンジニア人数', value: 5, min: 1, max: 20, step: 1, unit: '人' },
          { id: 'days', name: 'days', label: 'スプリント日数', value: 10, min: 5, max: 20, step: 1, unit: '日' },
          { id: 'focus_factor', name: 'focus_factor', label: '集中係数 (会議除外)', value: 0.75, min: 0.4, max: 1.0, step: 0.05, unit: '係数' },
          { id: 'pts_per_day', name: 'pts_per_day', label: '1人日あたり消化基準', value: 1.6, min: 0.5, max: 4.0, step: 0.1, unit: 'pt' },
        ],
        formulas: [
          { id: 'gross_pts', label: '総投入可能キャパシティ', unit: 'pt', calculate: 'devs * days * pts_per_day' },
          { id: 'net_velocity', label: '実効コミット可能ポイント', unit: 'pt', calculate: '(devs * days * pts_per_day) * focus_factor' },
        ],
      },
    });

    widgets.push({
      id: `pipe_${timestamp}_2`,
      title: 'スプリント進行カンバン (Current Sprint)',
      type: 'pipeline',
      category: 'Sprint Board',
      description: 'スプリント内タスクのステージ進行とボトルネック可視化',
      iconName: 'GitBranch',
      accentColor: 'cyan',
      size: 'wide',
      createdAt: timestamp + 1,
      data: {
        stages: [
          {
            id: 'sp_backlog',
            title: 'To Do (Ready to Dev)',
            items: [
              { id: 'spt_1', text: 'ユーザー権限ロール(RBAC)のバックエンドAPI実装', done: true, priority: 'high' },
              { id: 'spt_2', text: 'CSV一括インポート時のバリデーション強化', done: true, priority: 'med' },
            ],
          },
          {
            id: 'sp_wip',
            title: 'In Progress / Code Review',
            items: [
              { id: 'spt_3', text: 'WebSocket切断時の自動再接続Exponential Backoff', done: false, priority: 'high' },
              { id: 'spt_4', text: 'E2E Playwrightテストシナリオの拡充', done: false, priority: 'med' },
            ],
          },
          {
            id: 'sp_done',
            title: 'Testing & Deployed',
            items: [
              { id: 'spt_5', text: '本番デプロイ自動化パイプラインの正常稼働', done: false, priority: 'low' },
            ],
          },
        ],
      },
    });

    widgets.push({
      id: `note_${timestamp}_3`,
      title: 'KPT レトロスペクティブ (振り返りノート)',
      type: 'synapse_notes',
      category: 'Agile Retro',
      description: 'スプリント終了時のKeep/Problem/Tryをリアルタイム集約',
      iconName: 'FileText',
      accentColor: 'emerald',
      size: 'normal',
      createdAt: timestamp + 2,
      data: {
        content: `### Sprint #42 KPT 共有事項
- **Keep (良かったこと・継続)**:
  - PRレビューの初回応答時間が平均2時間以内に短縮された。
  - シナプス配線機能のプロトタイプが予定より2日前倒しで動作した。
- **Problem (課題・困りごと)**:
  - スプリント中盤で突発的な仕様変更が入り、ベロシティが15%低下した。
- **Try (次回スプリントでの挑戦)**:
  - 次回から変更要請には「同等工数の別チケットのトレードオフ」を即時適用する。`,
      },
    });
  }

  // 7. Technical Debt, Refactoring & Modernization ROI
  else if (
    p.includes('負債') ||
    p.includes('リファクタ') ||
    p.includes('モダン') ||
    p.includes('アーキテクチャ') ||
    p.includes('技術') ||
    p.includes('debt') ||
    p.includes('refactor') ||
    p.includes('migration')
  ) {
    reasoning = '技術的負債の返済投資とリアーキテクチャROIを検知。負債による工数損失シミュレーター、脆性対影響度レーダー、リファクタリング方針評価エンジンを合成しました。';
    widgets.push({
      id: `sim_${timestamp}_1`,
      title: '技術的負債 返済投資 & ROIシミュレーター',
      type: 'simulation',
      category: 'Tech Debt ROI',
      description: '負債による週次開発遅延時間と、リファクタ投資による工数回収期間を試算',
      iconName: 'Sliders',
      accentColor: 'rose',
      size: 'wide',
      createdAt: timestamp,
      outputKey: 'annual_hours_saved',
      data: {
        variables: [
          { id: 'team_size', name: 'team_size', label: 'エンジニア組織規模', value: 12, min: 2, max: 80, step: 1, unit: '人' },
          { id: 'friction_hours', name: 'friction_hours', label: '負債/手作業による週次損失', value: 6.5, min: 1.0, max: 20.0, step: 0.5, unit: 'h/週/人' },
          { id: 'refactor_investment', name: 'refactor_investment', label: 'リファクタ専任工数投資', value: 160, min: 40, max: 1000, step: 20, unit: '人時' },
          { id: 'reduction_rate', name: 'reduction_rate', label: '改修後の損失削減率', value: 70, min: 20, max: 95, step: 5, unit: '%' },
        ],
        formulas: [
          { id: 'weekly_lost', label: '現状の組織全体損失工数', unit: 'h/週', calculate: 'team_size * friction_hours' },
          { id: 'annual_hours_saved', label: '改修後の年間創出可能時間', unit: '時間/年', calculate: '(team_size * friction_hours * 48) * (reduction_rate / 100)' },
          { id: 'payback_weeks', label: '投資回収完了所要期間', unit: '週', calculate: 'refactor_investment / ((team_size * friction_hours) * (reduction_rate / 100))' },
        ],
      },
    });

    widgets.push({
      id: `trade_${timestamp}_2`,
      title: 'リアーキテクチャ手法 選択トレードオフ',
      type: 'tradeoff',
      category: 'Architecture Decision',
      description: '全面リプレイス vs ストラングラー・フィグ移行パターンの定量比較',
      iconName: 'Scale',
      accentColor: 'purple',
      size: 'wide',
      createdAt: timestamp + 1,
      data: {
        criteria: [
          { id: 'c_speed', name: '新機能追加への影響最小化', weight: 5 },
          { id: 'c_safety', name: '本番無停止・低リスク性', weight: 5 },
          { id: 'c_elegance', name: '将来的な設計純度・美しさ', weight: 3 },
          { id: 'c_cost', name: '初期工数投資の抑制', weight: 4 },
        ],
        options: [
          {
            id: 'opt_strangler',
            title: '案1: ストラングラー・フィグ段階的置換',
            pros: ['常に本番稼働しつつ高頻度デプロイ可能', '途中でのロールバックが容易'],
            cons: ['新旧両システムの暫定同期アダプターが必要', '移行完了まで期間を要する'],
            scores: { c_speed: 8, c_safety: 9, c_elegance: 6, c_cost: 7 },
          },
          {
            id: 'opt_bigbang',
            title: '案2: 完全新規リライト (Big Bang Rewrite)',
            pros: ['旧遺産に引きずられない完全なクリーンアーキテクチャ', '最新フレームワークの恩恵をフル活用'],
            cons: ['リリースまで半年以上機能開発が凍結', '初回切り替え時の未知バグリスクが極大'],
            scores: { c_speed: 2, c_safety: 3, c_elegance: 10, c_cost: 3 },
          },
        ],
      },
    });
  }

  // 8. Startup Runway, Burn Rate & Valuation Model
  else if (
    p.includes('資金調達') ||
    p.includes('バーンレート') ||
    p.includes('ランウェイ') ||
    p.includes('投資家') ||
    p.includes('vc') ||
    p.includes('pitch') ||
    p.includes('runway') ||
    p.includes('burn') ||
    p.includes('fundraising')
  ) {
    reasoning = 'スタートアップ資金調達とランウェイ生存予測を検知。月次バーンレート/残存月数シミュレーター、投資家ファンネルパイプライン、調達ターム評価メモを合成しました。';
    widgets.push({
      id: `sim_${timestamp}_1`,
      title: 'バーンレート & ランウェイ (生存可能月数) 試算',
      type: 'simulation',
      category: 'Capital & Runway',
      description: '現預金残高、月次支出、売上成長率からランウェイ月数と次回調達デッドラインを算出',
      iconName: 'Sliders',
      accentColor: 'amber',
      size: 'wide',
      createdAt: timestamp,
      outputKey: 'runway_months',
      data: {
        variables: [
          { id: 'cash', name: 'cash', label: '現在の手元預金残高', value: 45000000, min: 5000000, max: 200000000, step: 5000000, unit: '円' },
          { id: 'burn', name: 'burn', label: '月間総支出 (OPEX+人件費)', value: 3800000, min: 1000000, max: 20000000, step: 200000, unit: '円' },
          { id: 'mrr_in', name: 'mrr_in', label: '月次売上入金 (MRR)', value: 1200000, min: 0, max: 15000000, step: 100000, unit: '円' },
        ],
        formulas: [
          { id: 'net_burn', label: '実質月次キャッシュアウト (Net Burn)', unit: '円', calculate: 'burn - mrr_in' },
          { id: 'runway_months', label: '残存ランウェイ (生存可能月数)', unit: 'ヶ月', calculate: 'cash / (burn - mrr_in)' },
        ],
      },
    });

    widgets.push({
      id: `pipe_${timestamp}_2`,
      title: '資金調達ファンネル (Series A Gate)',
      type: 'pipeline',
      category: 'Fundraising Pipeline',
      description: 'ピッチデック準備からタームシート締結、着金までのフェーズ管理',
      iconName: 'GitBranch',
      accentColor: 'indigo',
      size: 'wide',
      createdAt: timestamp + 1,
      data: {
        stages: [
          {
            id: 'fr_1',
            title: '1. 準備 & ロングリスト (15社)',
            items: [
              { id: 'fr_i1', text: 'データルームおよび財務トラクションモデル完成', done: true, priority: 'high' },
              { id: 'fr_i2', text: 'エンジェル投資家からの温かい紹介(Warm Intro)獲得', done: true, priority: 'high' },
            ],
          },
          {
            id: 'fr_2',
            title: '2. パートナーミーティング',
            items: [
              { id: 'fr_i3', text: 'トップティアVC 3社での本ミーティング登壇', done: false, priority: 'high' },
              { id: 'fr_i4', text: '既存顧客5社へのリファレンスコール実施', done: false, priority: 'med' },
            ],
          },
          {
            id: 'fr_3',
            title: '3. タームシート & クロージング',
            items: [
              { id: 'fr_i5', text: 'リード投資家とのバリュエーション合意 & 締結', done: false, priority: 'high' },
              { id: 'fr_i6', text: '法務デューデリジェンス通過と登記・着金完了', done: false, priority: 'high' },
            ],
          },
        ],
      },
    });
  }

  // 9. Default General / Strategic Morphing Workspace
  else {
    reasoning = `思考テーマ「${prompt}」を解析。多角的な検討を可能にする【仮説パラメータ試算】【マイルストーン進行管理】【思考共生ノート】を動的合成しました。`;
    widgets.push({
      id: `sim_${timestamp}_1`,
      title: '主要KPI & 仮説インパクト試算',
      type: 'simulation',
      category: 'Core Metrics',
      description: '思考の根底にある仮説の変数を動かし、全体成果への感度を即時シミュレート',
      iconName: 'Sliders',
      accentColor: 'indigo',
      size: 'normal',
      createdAt: timestamp,
      data: {
        variables: [
          { id: 'effort', name: 'effort', label: '投入リソース/工数', value: 40, min: 10, max: 100, step: 5, unit: 'h/週' },
          { id: 'efficiency', name: 'efficiency', label: 'AI協調レバレッジ倍率', value: 3.2, min: 1.0, max: 10.0, step: 0.2, unit: 'x' },
          { id: 'iterations', name: 'iterations', label: '検証サイクル頻度', value: 4, min: 1, max: 12, step: 1, unit: '回/月' },
        ],
        formulas: [
          { id: 'throughput', label: '実効生産キャパシティ', unit: 'pt', calculate: '(effort * efficiency)' },
          { id: 'discovery_rate', label: '月間知見蓄積指数', unit: 'pt', calculate: '(effort * efficiency) * (iterations * 0.5)' },
        ],
      },
    });

    widgets.push({
      id: `pipe_${timestamp}_2`,
      title: '思考実行パイプライン & マイルストーン',
      type: 'pipeline',
      category: 'Execution Flow',
      description: '抽象的な思考を実行可能な単位に分解したフェーズ進行ボード',
      iconName: 'GitBranch',
      accentColor: 'cyan',
      size: 'wide',
      createdAt: timestamp + 1,
      data: {
        stages: [
          {
            id: 'stg1',
            title: 'フェーズ1: 概念化・仮説定義',
            items: [
              { id: 'it1', text: '核心課題のシャープな1行定義', done: true, priority: 'high' },
              { id: 'it2', text: '競合・既存代替手段の限界調査', done: true, priority: 'med' },
            ],
          },
          {
            id: 'stg2',
            title: 'フェーズ2: プロトタイプ & 検証',
            items: [
              { id: 'it3', text: '最速の動く実証モデルの作成', done: false, priority: 'high' },
              { id: 'it4', text: '定性フィードバックの収集', done: false, priority: 'med' },
            ],
          },
          {
            id: 'stg3',
            title: 'フェーズ3: 結晶化 & スケール',
            items: [
              { id: 'it5', text: '持続可能なオペレーションへの移行', done: false, priority: 'low' },
            ],
          },
        ],
      },
    });

    widgets.push({
      id: `note_${timestamp}_3`,
      title: 'シナプス思考ノート (Living Synapse)',
      type: 'synapse_notes',
      category: 'Cognitive Synthesis',
      description: '断片的な気づきやひらめきを自動的に結びつける自己進化ノート',
      iconName: 'FileText',
      accentColor: 'purple',
      size: 'normal',
      createdAt: timestamp + 2,
      data: {
        content: `### 思考の核 (Core Insight)
- テーマ: **${prompt}**
- 直感を恐れずに言語化し、各ウィジェットのスライダーや項目を動かして思考の弾力性をテストしてください。
- 画面上のピン留め、削除、再合成はいつでも自由に行えます。`,
      },
    });
  }

  return { widgets, reasoning };
}

// Curated Showcase Presets for Instant Wow-factor
export const SHOWCASE_PRESETS: ThoughtPreset[] = [
  {
    id: 'preset_startup_strategy',
    name: '次世代AIスタートアップ成長戦略',
    tagline: '価格弾力性シミュレーター × チャネルROI × 最短スケールロードマップ',
    prompt: '新規AIプロダクトのローンチ戦略を策定したい。価格設定のシミュレーションと獲得チャネルのマトリクス',
    icon: 'Rocket',
    widgets: [
      {
        id: 'p_sim_1',
        title: '価格弾力性 & ユニットエコノミクス',
        type: 'simulation',
        category: 'Finance',
        description: 'ユーザー数・有料化率・プライシングから月次MRRと年間利益を即時試算',
        iconName: 'Sliders',
        accentColor: 'indigo',
        size: 'wide',
        createdAt: 1,
        outputKey: 'annual_profit',
        data: {
          variables: [
            { id: 'mau', name: 'mau', label: '月間訪問ユーザー (MAU)', value: 45000, min: 5000, max: 200000, step: 5000, unit: '人' },
            { id: 'cvr', name: 'cvr', label: '有料会員転換率 (CVR)', value: 4.2, min: 0.5, max: 15.0, step: 0.1, unit: '%' },
            { id: 'price', name: 'price', label: 'Pro月額プラン単価', value: 3980, min: 980, max: 19800, step: 200, unit: '円' },
            { id: 'opex', name: 'opex', label: '月間インフラ&AI推論原価', value: 1200000, min: 200000, max: 5000000, step: 100000, unit: '円' },
          ],
          formulas: [
            { id: 'mrr', label: '推定 MRR (月次売上)', unit: '円', calculate: '(mau * (cvr / 100)) * price' },
            { id: 'arr', label: '推定 ARR (年商換算)', unit: '円', calculate: '((mau * (cvr / 100)) * price) * 12' },
            { id: 'profit', label: '推定 月間営業利益', unit: '円', calculate: '((mau * (cvr / 100)) * price) - opex' },
          ],
        },
      },
      {
        id: 'p_mat_2',
        title: 'ユーザー獲得チャネル別 投資効率マトリクス',
        type: 'matrix',
        category: 'Growth',
        description: '獲得単価(CAC)と顧客生涯価値(LTV)の2次元ポジショニング',
        iconName: 'Compass',
        accentColor: 'emerald',
        size: 'normal',
        createdAt: 2,
        data: {
          matrixAxes: {
            xLabel: '獲得コスト CAC (低 → 高)',
            yLabel: '長期価値 LTV (低 → 高)',
            quadrants: ['即効高収益', '高コスト大口顧客', 'オーガニック安定層', '撤退・要改善'],
          },
          matrixItems: [
            { id: 'pm1', label: 'オープンソースコミュニティ', x: 15, y: 90, category: 'Community' },
            { id: 'pm2', label: 'テック系インフルエンサー提携', x: 60, y: 75, category: 'Influencer' },
            { id: 'pm3', label: 'Google検索広告 (SEM)', x: 70, y: 55, category: 'Paid' },
            { id: 'pm4', label: '招待制バイラルループ', x: 20, y: 85, category: 'Product' },
          ],
        },
      },
      {
        id: 'p_pipe_3',
        title: 'Go-to-Market (GTM) 実行パイプライン',
        type: 'pipeline',
        category: 'Execution',
        description: 'プライベートベータからグローバル一般公開までのステップ',
        iconName: 'GitBranch',
        accentColor: 'cyan',
        size: 'wide',
        createdAt: 3,
        data: {
          stages: [
            {
              id: 'ps1',
              title: 'Alpha (非公開検証)',
              items: [
                { id: 'pi1', text: '初期50人のパワーユーザーインタビュー', done: true, priority: 'high' },
                { id: 'pi2', text: '基盤LLMのレイテンシを300ms以下に短縮', done: true, priority: 'high' },
              ],
            },
            {
              id: 'ps2',
              title: 'Public Beta (拡大期)',
              items: [
                { id: 'pi3', text: 'Product Hunt / Hacker Newsローンチ', done: false, priority: 'high' },
                { id: 'pi4', text: 'Stripe決済 & 自動チーム課金の実装', done: false, priority: 'med' },
              ],
            },
            {
              id: 'ps3',
              title: 'Scale (定着期)',
              items: [
                { id: 'pi5', text: 'エンタープライズSSO & SOC2準拠', done: false, priority: 'low' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: 'preset_incident_warroom',
    name: 'サイバーセキュリティ緊急事案 対策本部 (War Room)',
    tagline: '脆弱性リスク評価レーダー × トリアージ封じ込めパイプライン × 初動Codex',
    prompt: 'システム障害とセキュリティインシデントのリスク分析と封じ込め対応',
    icon: 'ShieldAlert',
    widgets: [
      {
        id: 'p_mat_sec',
        title: '脅威レベル & 損害影響度レーダー',
        type: 'matrix',
        category: 'Security Radar',
        description: '攻撃ベクトルの確度と事業継続へのインパクト評価',
        iconName: 'Compass',
        accentColor: 'rose',
        size: 'normal',
        createdAt: 1,
        data: {
          matrixAxes: {
            xLabel: '攻撃成立性 (低 → 高)',
            yLabel: '事業影響度 (軽微 → 破滅的)',
            quadrants: ['警戒・要監視', '即時封じ込め最優先 (Critical)', '許容範囲', '早期パッチ適用'],
          },
          matrixItems: [
            { id: 's1', label: 'セッションハイジャック脆弱性', x: 35, y: 95 },
            { id: 's2', label: '決済基盤へのDDoS攻撃', x: 80, y: 75 },
            { id: 's3', label: 'テスト環境APIキーの公開リポジトリ露出', x: 50, y: 85 },
            { id: 's4', label: '軽微なログフォーマット不正', x: 90, y: 15 },
          ],
        },
      },
      {
        id: 'p_pipe_sec',
        title: '緊急インシデントレスポンス (SIRT)',
        type: 'pipeline',
        category: 'Incident Response',
        description: '初動30分以内の遮断措置から根本再発防止までの統制',
        iconName: 'GitBranch',
        accentColor: 'amber',
        size: 'wide',
        createdAt: 2,
        data: {
          stages: [
            {
              id: 'sec_s1',
              title: 'Triage & Isolation (0〜30分)',
              items: [
                { id: 'si1', text: '被害ノードのVPCネットワーク隔離', done: true, priority: 'high' },
                { id: 'si2', text: '全APIキーおよびマスターシークレットの無効化', done: true, priority: 'high' },
              ],
            },
            {
              id: 'sec_s2',
              title: 'Remediation (30分〜3時間)',
              items: [
                { id: 'si3', text: '影響を受けたデータベースのトランザクション監査', done: false, priority: 'high' },
                { id: 'si4', text: 'ホットフィックスパッチの緊急デプロイ', done: false, priority: 'high' },
              ],
            },
            {
              id: 'sec_s3',
              title: 'Post-Mortem & Disclosure',
              items: [
                { id: 'si5', text: 'ステータスページおよび顧客への第一報公表', done: false, priority: 'med' },
                { id: 'si6', text: '再発防止策レポートの策定', done: false, priority: 'low' },
              ],
            },
          ],
        },
      },
      {
        id: 'p_note_sec',
        title: 'インシデント指令司令ログ',
        type: 'synapse_notes',
        category: 'War Room Log',
        description: '意思決定のタイムスタンプと外部報告ステータス',
        iconName: 'FileText',
        accentColor: 'indigo',
        size: 'normal',
        createdAt: 3,
        data: {
          content: `### 対策本部 共有事項
- **指揮官**: セキュリティリード / CTO
- **基本方針**: 完全復旧を急ぐあまり証跡ログを上書きしないこと（フォレンジック保全最優先）。
- **ステークホルダー**: 広報、法務へのエスカレーション済み。`,
        },
      },
    ],
  },
  {
    id: 'preset_deep_focus',
    name: 'ディープワーク & 認知同期スペース',
    tagline: 'ガンマ波40Hzバイノーラル音響 × 思考断片シンナプスノート × スプリント集中タイマー',
    prompt: '思考に没頭して難問を解決するためのアンビエント音響と直感メモ',
    icon: 'Brain',
    widgets: [
      {
        id: 'p_audio_focus',
        title: 'ガンマ波 40Hz バイノーラル共鳴',
        type: 'ambient_audio',
        category: 'Cognitive Flow',
        description: '脳の知覚同期と超集中状態を促進する音響エンジン',
        iconName: 'Activity',
        accentColor: 'cyan',
        size: 'normal',
        createdAt: 1,
        data: {
          soundPreset: 'gamma',
          volume: 0.28,
        },
      },
      {
        id: 'p_notes_focus',
        title: '生きた思考キャンバス (Living Thoughts)',
        type: 'synapse_notes',
        category: 'Synthesis',
        description: '構造化を後回しにし、直感的な気づきを即座に投下する思考の受容器',
        iconName: 'FileText',
        accentColor: 'purple',
        size: 'wide',
        createdAt: 2,
        data: {
          content: `## 閃きと未解決の問い (Open Questions)
- 「アプリケーションが固定された画面を持たないとしたら、UIとは何になるのか？」
- → 答え: **意図を流し込むと、その瞬間に最もふさわしい器が自ら結晶化する「可変的インターフェース」**。
- 人間の思考スピードにツールが遅れをとらないための条件とは？
- → 設定を強要せず、思考の文脈を先回りして道具を揃えること。`,
        },
      },
    ],
  },
  {
    id: 'preset_product_okr',
    name: '新規事業ローンチ & OKR管理エンジン',
    tagline: 'ノーススター指標シミュレーション × 機能優先度マトリクス × ローンチゲート',
    prompt: '新プロダクトのローンチ戦略とOKR進行管理',
    icon: 'Rocket',
    widgets: [
      {
        id: 'p_okr_sim',
        title: 'ノーススター指標 & 成長ループ予測',
        type: 'simulation',
        category: 'Product & OKR',
        description: '初期獲得数、初回オンボーディング突破率、リテンション率から月間アクティブ率とLTVを即時試算',
        iconName: 'Sliders',
        accentColor: 'indigo',
        size: 'wide',
        createdAt: 1,
        outputKey: 'projected_dau',
        data: {
          variables: [
            { id: 'signups', name: 'signups', label: '月間新規登録者数', value: 8000, min: 500, max: 100000, step: 500, unit: '人' },
            { id: 'activation', name: 'activation', label: '初回オンボーディング突破率', value: 45, min: 10, max: 90, step: 1, unit: '%' },
            { id: 'w1_retention', name: 'w1_retention', label: '1週後リテンション率 (W1)', value: 38, min: 5, max: 80, step: 1, unit: '%' },
            { id: 'k_factor', name: 'k_factor', label: 'バイラル拡散係数 (K-Factor)', value: 1.2, min: 0.1, max: 3.0, step: 0.1, unit: '係数' },
          ],
          formulas: [
            { id: 'activated_users', label: '月間コア定着ユーザー数', unit: '人', calculate: 'signups * (activation / 100)' },
            { id: 'viral_spread', label: 'バイラル経由の二次流入数', unit: '人', calculate: '(signups * (activation / 100)) * k_factor' },
            { id: 'projected_dau', label: '推定DAUベースライン', unit: '人', calculate: '((signups * (activation / 100)) * (w1_retention / 100)) * 30' },
          ],
        },
      },
      {
        id: 'p_okr_mat',
        title: '機能優先度 (価値 vs 実装複雑度)',
        type: 'matrix',
        category: 'Product Prioritization',
        description: '顧客へのインパクトとエンジニアリング工数を2軸マッピング',
        iconName: 'Compass',
        accentColor: 'cyan',
        size: 'normal',
        createdAt: 2,
        data: {
          matrixAxes: {
            xLabel: '実装複雑度 (低工数 → 高工数)',
            yLabel: '顧客価値・インパクト (低 → 極大)',
            quadrants: ['即時着手 (Quick Wins)', '戦略的コア機能 (Big Bets)', '空き時間対応 (Fill-ins)', '見送り・スコープ外'],
          },
          matrixItems: [
            { id: 'okr_f1', label: 'ワンクリックOAuth登録', x: 25, y: 85, category: 'Growth' },
            { id: 'okr_f2', label: 'リアルタイム共同編集エンジン', x: 80, y: 92, category: 'Core' },
            { id: 'okr_f3', label: 'Slack/Discord通知連携', x: 30, y: 70, category: 'Integration' },
            { id: 'okr_f4', label: 'ダークモード微調整', x: 20, y: 35, category: 'Polish' },
          ],
        },
      },
      {
        id: 'p_okr_pipe',
        title: 'ローンチ・ステージゲート進行管理',
        type: 'pipeline',
        category: 'Launch Gates',
        description: 'アルファ検証からグローバル一般公開までの必須チェックポイント',
        iconName: 'GitBranch',
        accentColor: 'emerald',
        size: 'wide',
        createdAt: 3,
        data: {
          stages: [
            {
              id: 'gate_1',
              title: 'Gate 1: Private Alpha (クローズド)',
              items: [
                { id: 'g1_1', text: '選定した友好企業20社でのDogfooding検証', done: true, priority: 'high' },
                { id: 'g1_2', text: 'コア利用シナリオのP99レイテンシ150ms未満達成', done: true, priority: 'high' },
              ],
            },
            {
              id: 'gate_2',
              title: 'Gate 2: Public Beta (事前登録解放)',
              items: [
                { id: 'g2_1', text: 'Stripe従量課金および自動インボイス発行の疎通', done: false, priority: 'high' },
                { id: 'g2_2', text: 'ランディングページCVR 5%以上への最適化', done: false, priority: 'med' },
              ],
            },
            {
              id: 'gate_3',
              title: 'Gate 3: General Availability (一般公開)',
              items: [
                { id: 'g3_1', text: 'プロダクトハント & テックプレス一斉ローンチ', done: false, priority: 'high' },
                { id: 'g3_2', text: '24/7オンコール体制とSLA 99.9%監視確立', done: false, priority: 'med' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: 'preset_agile_sprint',
    name: 'アジャイル・スプリント & デイリーレトロ',
    tagline: 'スプリントベロシティ試算 × カンバン実行フロー × KPTレトロスペクティブ',
    prompt: 'アジャイル開発スプリントの生産性と振り返り',
    icon: 'GitBranch',
    widgets: [
      {
        id: 'p_sp_sim',
        title: 'スプリント・キャパシティ & ベロシティ予測',
        type: 'simulation',
        category: 'Agile Velocity',
        description: '開発エンジニア数、稼働日数、割り込み比率からスプリント達成可能ストーリーポイントを算出',
        iconName: 'Sliders',
        accentColor: 'indigo',
        size: 'normal',
        createdAt: 1,
        outputKey: 'net_velocity',
        data: {
          variables: [
            { id: 'devs', name: 'devs', label: '開発エンジニア人数', value: 5, min: 1, max: 20, step: 1, unit: '人' },
            { id: 'days', name: 'days', label: 'スプリント日数', value: 10, min: 5, max: 20, step: 1, unit: '日' },
            { id: 'focus_factor', name: 'focus_factor', label: '集中係数 (会議除外)', value: 0.75, min: 0.4, max: 1.0, step: 0.05, unit: '係数' },
            { id: 'pts_per_day', name: 'pts_per_day', label: '1人日あたり消化基準', value: 1.6, min: 0.5, max: 4.0, step: 0.1, unit: 'pt' },
          ],
          formulas: [
            { id: 'gross_pts', label: '総投入可能キャパシティ', unit: 'pt', calculate: 'devs * days * pts_per_day' },
            { id: 'net_velocity', label: '実効コミット可能ポイント', unit: 'pt', calculate: '(devs * days * pts_per_day) * focus_factor' },
          ],
        },
      },
      {
        id: 'p_sp_pipe',
        title: 'スプリント進行カンバン (Current Sprint)',
        type: 'pipeline',
        category: 'Sprint Board',
        description: 'スプリント内タスクのステージ進行とボトルネック可視化',
        iconName: 'GitBranch',
        accentColor: 'cyan',
        size: 'wide',
        createdAt: 2,
        data: {
          stages: [
            {
              id: 'sp_backlog',
              title: 'To Do (Ready to Dev)',
              items: [
                { id: 'spt_1', text: 'ユーザー権限ロール(RBAC)のバックエンドAPI実装', done: true, priority: 'high' },
                { id: 'spt_2', text: 'CSV一括インポート時のバリデーション強化', done: true, priority: 'med' },
              ],
            },
            {
              id: 'sp_wip',
              title: 'In Progress / Code Review',
              items: [
                { id: 'spt_3', text: 'WebSocket切断時の自動再接続Exponential Backoff', done: false, priority: 'high' },
                { id: 'spt_4', text: 'E2E Playwrightテストシナリオの拡充', done: false, priority: 'med' },
              ],
            },
            {
              id: 'sp_done',
              title: 'Testing & Deployed',
              items: [
                { id: 'spt_5', text: '本番デプロイ自動化パイプラインの正常稼働', done: false, priority: 'low' },
              ],
            },
          ],
        },
      },
      {
        id: 'p_sp_note',
        title: 'KPT レトロスペクティブ (振り返りノート)',
        type: 'synapse_notes',
        category: 'Agile Retro',
        description: 'スプリント終了時のKeep/Problem/Tryをリアルタイム集約',
        iconName: 'FileText',
        accentColor: 'emerald',
        size: 'normal',
        createdAt: 3,
        data: {
          content: `### Sprint #42 KPT 共有事項
- **Keep (良かったこと・継続)**:
  - PRレビューの初回応答時間が平均2時間以内に短縮された。
  - シナプス配線機能のプロトタイプが予定より2日前倒しで動作した。
- **Problem (課題・困りごと)**:
  - スプリント中盤で突発的な仕様変更が入り、ベロシティが15%低下した。
- **Try (次回スプリントでの挑戦)**:
  - 次回から変更要請には「同等工数の別チケットのトレードオフ」を即時適用する。`,
        },
      },
    ],
  },
  {
    id: 'preset_techdebt_roi',
    name: '技術的負債ROI評価 & モダナイゼーション戦略',
    tagline: '負債工数損失シミュレーター × リアーキテクチャ選択トレードオフ × 移行計画',
    prompt: '技術的負債の返済投資とリアーキテクチャROI',
    icon: 'Scale',
    widgets: [
      {
        id: 'p_td_sim',
        title: '技術的負債 返済投資 & ROIシミュレーター',
        type: 'simulation',
        category: 'Tech Debt ROI',
        description: '負債による週次開発遅延時間と、リファクタ投資による工数回収期間を試算',
        iconName: 'Sliders',
        accentColor: 'rose',
        size: 'wide',
        createdAt: 1,
        outputKey: 'annual_hours_saved',
        data: {
          variables: [
            { id: 'team_size', name: 'team_size', label: 'エンジニア組織規模', value: 12, min: 2, max: 80, step: 1, unit: '人' },
            { id: 'friction_hours', name: 'friction_hours', label: '負債/手作業による週次損失', value: 6.5, min: 1.0, max: 20.0, step: 0.5, unit: 'h/週/人' },
            { id: 'refactor_investment', name: 'refactor_investment', label: 'リファクタ専任工数投資', value: 160, min: 40, max: 1000, step: 20, unit: '人時' },
            { id: 'reduction_rate', name: 'reduction_rate', label: '改修後の損失削減率', value: 70, min: 20, max: 95, step: 5, unit: '%' },
          ],
          formulas: [
            { id: 'weekly_lost', label: '現状の組織全体損失工数', unit: 'h/週', calculate: 'team_size * friction_hours' },
            { id: 'annual_hours_saved', label: '改修後の年間創出可能時間', unit: '時間/年', calculate: '(team_size * friction_hours * 48) * (reduction_rate / 100)' },
            { id: 'payback_weeks', label: '投資回収完了所要期間', unit: '週', calculate: 'refactor_investment / ((team_size * friction_hours) * (reduction_rate / 100))' },
          ],
        },
      },
      {
        id: 'p_td_trade',
        title: 'リアーキテクチャ手法 選択トレードオフ',
        type: 'tradeoff',
        category: 'Architecture Decision',
        description: '段階的置換 (ストラングラー・フィグ) vs 完全リライトの定量比較',
        iconName: 'Scale',
        accentColor: 'purple',
        size: 'wide',
        createdAt: 2,
        data: {
          criteria: [
            { id: 'c_speed', name: '新機能追加への影響最小化', weight: 5 },
            { id: 'c_safety', name: '本番無停止・低リスク性', weight: 5 },
            { id: 'c_elegance', name: '将来的な設計純度・美しさ', weight: 3 },
            { id: 'c_cost', name: '初期工数投資の抑制', weight: 4 },
          ],
          options: [
            {
              id: 'opt_strangler',
              title: '案1: ストラングラー・フィグ段階的置換',
              pros: ['常に本番稼働しつつ高頻度デプロイ可能', '途中でのロールバックが容易'],
              cons: ['新旧両システムの暫定同期アダプターが必要', '移行完了まで期間を要する'],
              scores: { c_speed: 8, c_safety: 9, c_elegance: 6, c_cost: 7 },
            },
            {
              id: 'opt_bigbang',
              title: '案2: 完全新規リライト (Big Bang Rewrite)',
              pros: ['旧遺産に引きずられない完全なクリーンアーキテクチャ', '最新フレームワークの恩恵をフル活用'],
              cons: ['リリースまで半年以上機能開発が凍結', '初回切り替え時の未知バグリスクが極大'],
              scores: { c_speed: 2, c_safety: 3, c_elegance: 10, c_cost: 3 },
            },
          ],
        },
      },
    ],
  },
  {
    id: 'preset_startup_runway',
    name: 'スタートアップ資金調達・バーンレート予測',
    tagline: '月次バーンレート/残存ランウェイ試算 × 投資家ファンネル × 資本政策ノート',
    prompt: 'スタートアップ資金調達とランウェイ生存予測',
    icon: 'Compass',
    widgets: [
      {
        id: 'p_rw_sim',
        title: 'バーンレート & ランウェイ (生存可能月数) 試算',
        type: 'simulation',
        category: 'Capital & Runway',
        description: '現預金残高、月次支出、売上成長率からランウェイ月数と次回調達デッドラインを算出',
        iconName: 'Sliders',
        accentColor: 'amber',
        size: 'wide',
        createdAt: 1,
        outputKey: 'runway_months',
        data: {
          variables: [
            { id: 'cash', name: 'cash', label: '現在の手元預金残高', value: 45000000, min: 5000000, max: 200000000, step: 5000000, unit: '円' },
            { id: 'burn', name: 'burn', label: '月間総支出 (OPEX+人件費)', value: 3800000, min: 1000000, max: 20000000, step: 200000, unit: '円' },
            { id: 'mrr_in', name: 'mrr_in', label: '月次売上入金 (MRR)', value: 1200000, min: 0, max: 15000000, step: 100000, unit: '円' },
          ],
          formulas: [
            { id: 'net_burn', label: '実質月次キャッシュアウト (Net Burn)', unit: '円', calculate: 'burn - mrr_in' },
            { id: 'runway_months', label: '残存ランウェイ (生存可能月数)', unit: 'ヶ月', calculate: 'cash / (burn - mrr_in)' },
          ],
        },
      },
      {
        id: 'p_rw_pipe',
        title: '資金調達ファンネル (Series A Gate)',
        type: 'pipeline',
        category: 'Fundraising Pipeline',
        description: 'ピッチデック準備からタームシート締結、着金までのフェーズ管理',
        iconName: 'GitBranch',
        accentColor: 'indigo',
        size: 'wide',
        createdAt: 2,
        data: {
          stages: [
            {
              id: 'fr_1',
              title: '1. 準備 & ロングリスト (15社)',
              items: [
                { id: 'fr_i1', text: 'データルームおよび財務トラクションモデル完成', done: true, priority: 'high' },
                { id: 'fr_i2', text: 'エンジェル投資家からの温かい紹介(Warm Intro)獲得', done: true, priority: 'high' },
              ],
            },
            {
              id: 'fr_2',
              title: '2. パートナーミーティング',
              items: [
                { id: 'fr_i3', text: 'トップティアVC 3社での本ミーティング登壇', done: false, priority: 'high' },
                { id: 'fr_i4', text: '既存顧客5社へのリファレンスコール実施', done: false, priority: 'med' },
              ],
            },
            {
              id: 'fr_3',
              title: '3. タームシート & クロージング',
              items: [
                { id: 'fr_i5', text: 'リード投資家とのバリュエーション合意 & 締結', done: false, priority: 'high' },
                { id: 'fr_i6', text: '法務デューデリジェンス通過と登記・着金完了', done: false, priority: 'high' },
              ],
            },
          ],
        },
      },
    ],
  },
];
