# CBT Session Player (Mobile-First) Implementation

## Component hierarchy

- `CBTSessionPlayerPage`
  - `PlayerHeader`
  - `SaveStatusPill`
  - `QuestionRenderer`
  - `StickySessionNav`
- Hooks
  - `useSessionPlayerEngine` (controlled state + validation + branch prediction)
  - `useAutoSave` (30s interval + on question change + beforeunload)
  - `useNetworkStatus` (online/offline detection)
  - `useOfflineQueue` (IndexedDB outbox queue + retries)
  - `sessionPlayerIdb` (draft + outbox stores)

## Layout wireframe

```text
┌─────────────────────────────────┐
│ Header: title + progress bar    │
├─────────────────────────────────┤
│ SaveStatus + Pause              │
│                                 │
│ Question Card (single focus)    │
│ - Prompt                         │
│ - Help text                      │
│ - Touch-friendly controls        │
│ - Validation message             │
│                                 │
│ Pending sync note (optional)    │
├─────────────────────────────────┤
│ Sticky Bottom Nav               │
│ [Previous] [Skip] [Next]        │
└─────────────────────────────────┘
```

## Tailwind strategy

- Mobile-first shell: `min-h-dvh`, `max-w-md`, `px-4`, `pb-28`
- Touch targets: `min-h-12`, rounded controls, high hit area
- Sticky nav safe area: `pb-[env(safe-area-inset-bottom)]`
- Fast transitions: `duration-100 ease-out`
- Low cognitive load: single card, limited CTAs, consistent typography

## Question renderer behavior

- Supported: `multiple_choice`, `text`, `slider`, `checkbox`
- Controlled inputs bound to reducer state
- Required validation through `getQuestionValidation`
- Branch compatibility via question `branchingRules`
- Re-render optimization via memoized `QuestionRenderer`

## Navigation logic

- Next: blocked for required unanswered questions
- Previous: stack-based (visited order)
- Skip: enabled only for non-required questions
- Branch-aware next prediction using local rules
- Online mode: server response (`nextQuestionId`) is authoritative
- Offline mode: queue response + use local branch prediction

## Progress model

- `visited/total` progress bar with smooth width animation
- Dynamic updates from reducer state
- Required answered counters included in engine output

## Auto-save + offline

- Autosave every 30 seconds (`useAutoSave`)
- Save on question transition (`question-change`)
- Save on browser close (`before-unload`)
- Draft persistence in IndexedDB (`drafts` store)
- Outbox queue in IndexedDB (`outbox` store)
- Online reconnect triggers queue drain automatically
- Retry with backoff + jitter, no data loss by design

## API contracts used

- `GET /api/cbt-sessions/:id/summary`
- `GET /api/cbt-sessions/templates/:id`
- `GET /api/cbt-sessions/:id/current-question`
- `POST /api/cbt-sessions/:id/respond`
- `PUT /api/cbt-sessions/:id/status`

Request sample (`respond`):

```json
{
  "questionId": "q_123",
  "responseData": { "value": "Often" },
  "timeSpentSeconds": 12
}
```

## Accessibility checklist

- Semantic header/nav/section structure
- `aria-live` for save/offline/sync statuses
- Focus handoff to new question on navigation
- Keyboard-operable buttons
- Inline validation with alert semantics
- Motion kept minimal

## Security notes

- Player route is inside patient protected route
- Session data fetched via authenticated cookies only
- Client never requests therapist encrypted notes for player flow
- Outbox includes idempotency key for replay-safe synchronization

## Edge case matrix

- Required unanswered + Next => blocked with inline error
- Network loss during play => local queue + offline banner
- Browser close mid-answer => draft restored from IndexedDB
- Reconnect after offline => queue drains in order with retries
- Unknown branch target => falls back to sequential next
- Session complete from server => navigates to session summary
