# Specification

## Summary
**Goal:** Rebuild the app so it deploys cleanly, fix overlapping option menus, and refresh the UI + branding to match the provided gold/charcoal logo style.

**Planned changes:**
- Rebuild and resolve any build/runtime issues so the app deploys successfully and loads without fatal errors.
- Fix dropdown/popover/option-panel layering and positioning so menus are fully visible (not clipped or covered by fixed UI) on mobile and desktop.
- Apply a cohesive gold/charcoal visual theme across the app (header, tabs, forms, tables, dialogs, admin screens), avoiding default blue/purple styling.
- Replace the app logo with new generated assets and update all logo placements (header and connecting/initializing/error states) to reference the new files from `/assets/generated/`.

**User-visible outcome:** The app deploys and opens normally, all option menus are readable and accessible without overlap, and the UI/branding is refreshed with the new gold/charcoal theme and updated logo.
