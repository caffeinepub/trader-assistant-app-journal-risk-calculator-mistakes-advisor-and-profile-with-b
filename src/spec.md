# Specification

## Summary
**Goal:** Roll back the deployed application to the previously working Version 35 so the UI and behavior match that version.

**Planned changes:**
- Restore the codebase to the Version 35 state (full rollback), removing any Version 38+ behavior/UI changes.
- Fix the restore/rollback workflow so a Version 35 restore completes successfully through build and deploy, and provides clear actionable errors if prerequisites are missing.

**User-visible outcome:** The running app matches Version 35 functionality and UI, and the Version 35 restore process completes without build/deploy failures.
