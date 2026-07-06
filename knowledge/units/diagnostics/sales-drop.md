---
id: diagnostics.sales-drop
title: Продажи упали — локализация по воронке
category: diagnostics
agents: [ozonologist]
keywords: [продажи упали, плохо продаётся, мало заказов, спад, выручка, диагностика]
required_metrics: [stock, orders_30d, price, revenue_30d, conversion, stock_days]
# Правила диагноза — машиночитаемы. Движок применяет по убыванию priority,
# первое совпавшее правило = primary. Условия — структурные (без строк-выражений).
diagnosis_rules:
  - id: stockout
    priority: 100                      # критический перебивает всё
    conditions:
      - { metric: stock, op: eq, value: 0 }
    outcome:
      funnel_stage: availability
      primary_unit: inventory.stockout
      severity: critical
      confidence: high
      finding: "Остаток 0 — товар выпал из продажи, это перебивает прочие причины."
  - id: conversion_low
    priority: 50
    conditions:
      - { metric: conversion, op: not_null }
      - { metric: conversion, op: lt, value: 1.0 }
    outcome:
      funnel_stage: conversion
      primary_unit: seo.weak-card-content
      severity: high
      confidence: medium
      finding: "Конверсия ниже порога — трафик есть, проблема в карточке/цене/отзывах."
  - id: inconclusive
    priority: 1
    conditions: []                      # fallback
    outcome:
      funnel_stage: unknown
      primary_unit: null
      severity: low
      confidence: low
      finding: "Данных недостаточно для однозначного диагноза."
---

## problem
Выручка/заказы по товару ниже ожидаемого.

## symptoms
- stock = 0 → критический дефицит (перебивает всё)
- conversion ниже нормы при наличии трафика → проблема карточки/цены/отзывов

## required_metrics
stock, orders_30d, price, revenue_30d, conversion.
Если метрика недоступна (нет подписки) — движок помечает её и не выдумывает.

## diagnosis_logic
См. diagnosis_rules во фронтматтере. Локализуем этап воронки
(показы → клики → корзина → заказ) и выбираем primary-юнит по приоритету.

## recommendation_logic
Не давать финальный совет здесь — уйти в primary_unit с наибольшим денежным эффектом.
Всегда называть конкретный этап воронки.
