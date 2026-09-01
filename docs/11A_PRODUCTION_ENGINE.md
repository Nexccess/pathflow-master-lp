# 11A-Production Engine

## Purpose
Generate store-specific Approved Creative Packages at production scale while preserving the quality bar established by Violet Reference Case #01.

## Input
- Lead / Store Data
- Store Intelligence
- Public evidence / customer voice inputs

## Pipeline
Store Intelligence
→ Customer Voice
→ Message Strategy
→ Information Priority
→ Visual Direction
→ Creative Assets
→ LP Creative Generation
→ AI QA
→ AUTO_PASS / REVIEW_REQUIRED / REJECTED
→ Kei Review when required
→ Approved Creative Package

## Output Contract
Only Approved Creative Packages may flow to 11B-Integration.

Required package fields:
- LP Design
- Message Strategy
- Information Priority
- Visual Direction
- Creative Assets
- Evidence Map
- CTA Placement
- Diagnosis Entry Point
- creative_status
- creative_version
- QA result
- approval_type (HUMAN_APPROVED / AUTO_APPROVED)

## Quality Rule
Reference Case #01 fixes the quality standard, decision criteria, and QA standard. It does not force identical design templates across stores.

## Initial Validation
Run several stores to approximately 10 stores through AI QA + human review. Measure agreement before expanding AUTO_PASS.

## Final Connection
11A-Production → Approved Creative Package → 11B-Integration
