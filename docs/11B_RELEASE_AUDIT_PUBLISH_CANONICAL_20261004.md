# 11B 監査・公開 作業工程 正本

更新日: 2026-10-04
対象: PathFlow 11B / Izzy
初回確立対象: lead_id=1839 / Frais Tout
適用: 11A通過済み成果物を11Bで監査・公開する工程

## 1. 最上位原則

- 11A成果物（正本）を保持する。
- 11Bは11Aの意味を変更しない。
- 許可されるのは「伝わり方の改善」とIntegration/Technical修正。
- 11B成果物を別Artifactとして作成し、監査後にそのArtifactを公開する。
- 公開対象は11A成果物ではなく、監査済み11B成果物。
- DB/Artifact/Repoの正本を推定で書き換えない。未確認はUNKNOWNとして停止する。

共通原則:
「意味を変える変更は禁止。伝わり方を改善する変更は許可。」

## 2. 正式フロー

11A成果物（APPROVED_11A）
↓
11B Diagnosis統合
↓
11B成果物を独立保存
↓
11B Release Gate監査
↓
全7項目PASS
↓
RELEASE_READY_11B
↓
監査済み11B成果物をFreeze
↓
公開Repoへ配置
↓
Git mainへcommit/push
↓
Vercel Production Deploy
↓
公開URL実機確認
↓
公開完了

## 3. 11B Release Gate

以下7項目を1項目ずつ確認する。

1. 11A Intent Fidelity
2. Visitor Self-Relevance
3. Flow Coherence
4. Mobile Presentation / Visual Rhythm
5. Integration Integrity
6. Technical Reliability
7. Safety / Isolation

全項目PASSで `RELEASE_READY_11B`。

独自Gateを追加しない。

## 4. Artifact保存

11A正本:
`C:\PathFlow\generated\approved-lp\{lead_id}\`

11B統合済み成果物:
`C:\PathFlow\generated\integrated-lp\{lead_id}\`

構成:
- `audit\`
- `diagnosis_spec\`
- `product\`
- `source_11a_snapshot\`
- `11b-integration.json`

公開対象:
`product\`

既存公開後に表示修正等のRevisionを作る場合:
`C:\PathFlow\generated\integrated-lp\{lead_id}_v2\`
のように旧版を保持し、新版を別保存する。

Revisionには `CHANGELOG.md` を置き、変更対象・変更しない対象を明記する。

## 5. 公開Repo

Repo:
`C:\Nexcess\pathflow-master-lp`

GitHub:
`Nexccess/pathflow-master-lp`

branch:
`main`

公開配置:
`p\{lead_id}\`

公開URL:
`https://sample.pathflow.org/p/{lead_id}/`

Diagnosis:
`https://sample.pathflow.org/p/{lead_id}/diagnosis/`

新規店舗の初回配置には:
`C:\Nexcess\pathflow-master-lp\scripts\publish-store.ps1`

を使用可能。

このscriptは既存destinationがある場合に停止するため、Revision更新時は監査済み変更ファイルのみを明示的に差し替える。

## 6. Git運用

公開前:
- `git status --short`
- 対象差分だけ確認
- `git add .` は使用しない
- 対象ファイルのみstage

remote mainが先行している場合:
1. `git fetch origin`
2. remote/local差分確認
3. `git rebase origin/main`
4. conflictがあれば停止
5. force pushしない

commit後:
- `git push origin main`
- working tree clean確認
- HEADとorigin/main一致確認

## 7. Vercel

Project:
`pathflow-master-lp`

Production Domain:
`sample.pathflow.org`

main push後にProduction Deployが自動開始する。

確認:
- target = production
- commit SHA = 今回のcommit
- state = READY

READY後に公開URLを実機確認する。

## 8. 実機確認

最低確認:
- LP表示
- Floating Diagnosis CTA
- LPは残したままDiagnosisが別タブで開く
- Diagnosis開始
- 全設問操作
- Result表示
- CTA遷移
- mobile表示
- console上の重大errorなし

Amplitude:
- 内部の `result_type` 等は内部値を保持する。
- 顧客向け表示文言と内部イベント値を混同しない。

## 9. 顧客向け内部用語

内部変数・内部分類は保持してよい。

顧客画面では内部用語を露出しない。

1839 v2で確定した例:

- `STORE EVIDENCE RESONANCE` → `お店との相性`
- `DIRECT_RESONANCE` → `今回の相談ポイント`
- `PARTIAL_RESONANCE` → `一緒に整理したいポイント`
- `CONSULTATION_REQUIRED` → `お店で確認したいポイント`
- 顧客向け `Evidence` → `情報` または文脈に応じて `口コミ・店舗情報`

内部:
- evidence_key
- evidence_mode
- resonanceEvidence
- DIRECT_RESONANCE等の内部値

は変更しない。

## 10. 1839 実績

lead_id:
1839

store:
Frais Tout

variant:
STANDARD

公開URL:
`https://sample.pathflow.org/p/1839/`

Diagnosis:
`https://sample.pathflow.org/p/1839/diagnosis/`

初回Production commit:
`155412b Add production PathFlow store 1839 and reusable publish script`

v2表示修正:
`2d5ce2e Refine customer-facing diagnosis wording for store 1839 v2`

Evidence顧客表示修正:
`88803aa Remove customer-facing Evidence wording from store 1839 v2`

v2保存:
`C:\PathFlow\generated\integrated-lp\1839_v2\`

v1→v2 product差分:
- `diagnosis/app.js`
- `diagnosis/index.html`

CTA/CSS/Diagnosis判定ロジック/11Aの意味は変更していない。

## 11. Canonical DB / sales_ready

Teams正式仕様:
- sales_readyはOffer Revisionにのみ存在する。
- Canonical上の唯一の営業Gate。
- 11A側や旧pipeline stateのsales_ready相当をCanonical Gateとして使わない。
- Current PointerはFormal Statusのみを指す。
- Revision変更は上書きではなく、新Revision INSERT → Validation → Formal Status → Current Pointer UPDATEを同一Transactionで行う。

したがって公開ArtifactのJSONだけを更新してCanonical DB更新の代替にしない。

DB更新前に必ず実体確認する:
- DB絶対パス
- lead_id
- 対象table
- current revision
- current pointer
- Offer / Offer Revision / Offer Item
- backup

未確認時はDBを書き込まない。

## 12. 明日の運用

11A通過分について店舗ごとに:

1. 11A正本確認
2. Diagnosis統合成果物確認
3. 7 Gate監査
4. NGなら11B許可範囲のみ修正
5. PASSならRELEASE_READY_11B
6. integrated-lpへFreeze
7. 公開Repoへ配置
8. targeted git add
9. commit / push
10. Vercel READY確認
11. 実機公開確認
12. Canonical DBは正式Offer Revision/current pointerを実体確認後に更新

以上を11B監査・公開の正本工程とする。
