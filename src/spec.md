# Specification

## Summary
**Goal:** Convert the existing Calculator tab into an Account/Lot Size Calculator experience (matching older wording/structure) while keeping the current inputs and calculation behavior, and improve validation UX.

**Planned changes:**
- Update Calculator tab UI copy/structure to present as “Lot Size Calculator” (or “Account Lot Size Calculator”), including header, descriptions, primary button text, and results labels, while preserving the existing inputs and calculation logic.
- Replace browser `alert(...)` validation with inline validation messaging within the calculator view (e.g., page-level alert and/or per-field helper text) that clears once inputs are corrected.
- Refactor pip value logic so the calculator uses the shared `frontend/src/lib/pipValues.ts` utility and remove any separate hardcoded pip table from `frontend/src/lib/riskCalculator.ts`, keeping results consistent.
- Change the bottom navigation label from “Calculator” to “Lot Size” (or equivalent) without changing the existing tab id/routing (`calculator`).

**User-visible outcome:** The calculator tab and bottom nav read as a Lot Size calculator, validation errors appear inline instead of via popups, and calculations behave the same while using a single shared pip-value source.
