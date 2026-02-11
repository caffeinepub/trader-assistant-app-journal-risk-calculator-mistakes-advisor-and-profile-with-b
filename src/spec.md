# Specification

## Summary
**Goal:** Update the risk/lot size calculator to support separate Funded Account vs Own Capital flows, using stop-loss in pips and a USD risk amount to compute lot size with improved in-page validation.

**Planned changes:**
- Add an initial mode selector to the Risk Calculator: “Funded Account” vs “Own Capital”, and conditionally show/reset inputs based on the selected mode.
- For Funded Account mode, add an “Account Size (USD)” selector with presets ($1k, $2k, $5k, $10k, $25k, $50k, $100k, $200k) plus “Other” to enter a custom size.
- For Own Capital mode, add an “Account Size (USD)” selector with presets ($50, $100) plus “Other” to enter a custom size.
- Replace entry/price-based stop-loss inputs with a single “Stop Loss (pips)” numeric input and update result display accordingly.
- Add a required “Risk Amount (USD)” numeric input and compute lot size using riskUSD, stop-loss pips, and pip value (using existing pip-value lookup/custom pip value rules where applicable).
- Keep the trading pair selection behavior, including requiring “Custom Pip Value (USD)” for XAUUSD, XAGUSD, and OTHER.
- Replace `window.alert(...)` validation with in-page error messaging within the calculator UI.
- Add a non-blocking warning when Risk Amount (USD) exceeds the selected account size.

**User-visible outcome:** Users can choose Funded Account or Own Capital, pick/enter account size, select a trading pair (and custom pip value when required), enter stop loss in pips and risk amount in USD, then calculate a recommended lot size with clear on-page errors and a warning if risk exceeds account size.
