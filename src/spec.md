# Specification

## Summary
**Goal:** Limit Admin Panel access to a single admin account (yug553496@gmail.com) without any separate admin password prompt, while enforcing admin-only operations on the backend.

**Planned changes:**
- Update the frontend so Admin Panel entry points (links/buttons/routes/sections) are only visible and accessible when logged in as yug553496@gmail.com.
- Remove the admin password verification/prompt flow for Admin Panel access and update any related user-facing English copy to eliminate references to an admin password.
- Add/verify server-side authorization checks so all admin-only backend queries/mutations reject non-admin callers even if the frontend is bypassed.
- Ensure the Admin Panel supports per-user admin actions: activate a subscription plan for a selected user, manage payment methods/options, manage discount options, and kick out a selected user (force session end on next interaction).

**User-visible outcome:** Non-admin users no longer see or can access the Admin Panel. The admin user (yug553496@gmail.com) can open Admin Panel directly (no password prompt) and perform user-specific subscription activation, manage payment/discount options, and kick out users, with all admin actions protected server-side.
