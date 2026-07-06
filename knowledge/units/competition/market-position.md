---
id: competition.market-position
title: Позиция товара относительно конкурентов
category: diagnostics
agents: [ozonologist]
keywords: [конкуренты, рынок, цена выше рынка, отзывы, позиция товара]
required_metrics: [price, reviews_count, competitor_avg_price, competitor_avg_rating, competitor_avg_reviews, price_vs_market]
diagnosis_rules:
  - id: overpriced_low_reviews
    priority: 100
    conditions:
      - { metric: price_vs_market, op: gt, value: 15 }
      - { metric: reviews_count, op: lt, value_metric: competitor_avg_reviews }
    outcome:
      funnel_stage: market_position
      primary_unit: competition.market-position
      severity: high
      confidence: medium
      finding: "Цена выше рынка более чем на 15%, а отзывов меньше, чем у конкурентов — товар проигрывает в сравнении перед покупкой."
  - id: inconclusive
    priority: 1
    conditions: []
    outcome:
      funnel_stage: unknown
      primary_unit: null
      severity: low
      confidence: low
      finding: "Данных рынка недостаточно для вывода о конкурентной позиции."
---

## problem
Товар может проигрывать конкурентам по сочетанию цены и социального доказательства.

## symptoms
- price_vs_market > 15% → товар заметно дороже среднего предложения.
- reviews_count < competitor_avg_reviews → у конкурентов сильнее доверие через отзывы.

## required_metrics
price, reviews_count, competitor_avg_price, competitor_avg_rating, competitor_avg_reviews, price_vs_market.

## diagnosis_logic
Если товар дороже рынка больше чем на 15% и отзывов меньше, чем в среднем у конкурентов, primary_unit = competition.market-position.
