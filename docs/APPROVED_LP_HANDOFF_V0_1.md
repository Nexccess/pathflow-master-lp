# 11A Approved LP / 11B Handoff Contract v0.1

## Purpose
11AでHard Gate / Asset Gate / Design QA / Commercial QAを通過した店舗別LPを、11B診断AI統合へ安全に引き渡す。

## Boundary
11A APPROVEDはLP品質承認であり、Sales Ready / Live Send承認ではない。
11Bで診断AI、5問、回答処理、結果表示、問い合わせ、Trackingを実装する。

## Approval Preconditions
- LP Generator report.status = PASS
- Visual Evidence Guard report.status = PASS
- Design QA = PASS
- Commercial QA = PASS
- Asset Manifest status = READY_FOR_LP_GENERATOR
- GENERATED visualはILLUSTRATIVE / NOT_STORE_EVIDENCE
- Human approverを明示

## Package
- `index.html` : Approved LP artifact
- `approved-lp.json` : 11A approval record and hashes
- `11b-handoff.json` : 11B integration contract

## 11B Contract
`11b-handoff.json` は以下を固定する。
- `sourceStage = 11A_APPROVED_LP`
- `diagnosisIntegration.status = NOT_IMPLEMENTED_11A`
- `diagnosisIntegration.owner = 11B`
- `salesReady = BLOCKED`
- `liveSend = BLOCKED`
- Kei本人によるLP→診断→結果→問い合わせのE2E確認前にSales Ready / Live Sendへ進めない。

## Integrity
Approved LP HTMLはSHA-256を記録する。11B側でHTMLを変更した場合は11A Approved artifactとは別revisionとして扱う。
