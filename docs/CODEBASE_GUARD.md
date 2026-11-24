# Codebase Guardian & Engineering Standards

## Guardian Principles
As the codebase grows, maintaining system stability while extending functionality is critical. The following rules protect existing production systems.

---

## Critical Protected Systems
The following systems are implemented and must not be broken or rewritten:

1. **Authentication System:** Registration, login, JWT validation, password hashing.
2. **Messaging System:** Delivery, persistence, read receipts, reactions, replies, edits, deletions.
3. **Real-Time System:** Socket.IO event contracts, presence tracking, typing indicators.
4. **Media System:** Upload validation, storage directories, voice messages.
5. **Communication System:** WebRTC voice/video calling signaling.
6. **Social System:** Stories, status expiration, user mentions.

---

## Guardian Rules
1. **NEVER rewrite working systems** without an explicit migration plan.
2. **NEVER modify existing APIs or rename routes** unless backward-compatible aliases are maintained.
3. **NEVER remove or rename existing Socket.IO events.**
4. **NEVER alter authentication logic** in ways that invalidate existing clients.
5. **NEVER modify message schema fields** destructively; only add optional fields with defaults.
6. **NEVER delete existing database fields** or change field types.
7. **Prefer adding new modules instead of editing legacy ones.**

---

## Safe Extension Strategy
When implementing new features:
* Create new domain modules under `src/modules/<feature>/` (e.g., `community/`, `channel/`, `invite/`).
* Each module should encapsulate:
  * Model (`*.model.js`)
  * Controller (`*.controller.js`)
  * Routes (`*.routes.js`)
  * Service (`*.service.js`)
* Keep existing controllers focused on core 1:1 and group chat functionality.

---

## Database Safety Rules
* Schemas must remain backward-compatible with legacy records.
* **Allowed:** Adding optional fields, creating new collections, adding compound indexes.
* **Prohibited:** Renaming fields, dropping fields, changing types of existing fields.

---

## Real-Time Event Guidelines
* Existing socket events must remain untouched.
* Only ADD new events with distinct, descriptive names (e.g. `community_update`, `channel_message`).
