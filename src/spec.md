# Specification

## Summary
**Goal:** Add a Light/Dark theme toggle in the Profile tab so users can switch the app appearance and have the choice persist across reloads.

**Planned changes:**
- Add an “Appearance” (or equivalent) section in the Profile tab with theme controls for “Light” and “Dark” (English labels).
- Apply the selected theme immediately across the UI using the existing Tailwind/CSS variable theme setup.
- Persist the selected theme in client storage (e.g., localStorage) and restore/apply it on app load.
- Remove any unconditional runtime forcing of dark mode so Light theme is not overridden; update `document.documentElement` `dark` class and document `color-scheme` to match the selected theme.

**User-visible outcome:** Users can select Light or Dark theme from the Profile tab, see the UI update instantly, and keep their preferred theme after refreshing or reopening the app.
