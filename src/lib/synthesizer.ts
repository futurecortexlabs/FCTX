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

  // 5. Default General / Strategic Morphing Workspace
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
];
