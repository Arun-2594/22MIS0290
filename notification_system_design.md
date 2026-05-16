# Notification System Design

## Stage 1 Heading

---

## 1. Architecture Overview

The Campus Notifications Microservice is split into three logical layers:

```
┌─────────────────────────────────────┐
│         Notification API            │
│  GET /evaluation-service/           │
│       notifications                 │
└────────────────┬────────────────────┘
                 │ HTTP GET (with query params)
                 ▼
┌─────────────────────────────────────┐
│       notification_app_be           │
│  - Fetch from API                   │
│  - Score each notification          │
│  - Return top N sorted by priority  │
└────────────────┬────────────────────┘
                 │ Scored notifications
                 ▼
┌─────────────────────────────────────┐
│       notification_app_fe           │
│  - All Notifications (paginated)    │
│  - Priority Inbox (top N)           │
│  - Filter by type                   │
│  - Read/Unread tracking             │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│       logging_middleware            │
│  - Centralized logger               │
│  - Used by BE and FE                │
│  - Levels: INFO, ERROR, DEBUG, WARN │
└─────────────────────────────────────┘
```

---

## 2. Priority Scoring Algorithm

### Formula

```
Priority Score = type_weight × recency_factor
```

### Type Weights

| Notification Type | Weight | Justification                                              |
|-------------------|--------|------------------------------------------------------------|
| Placement         | 3      | Highest impact — directly affects student career outcomes  |
| Result            | 2      | Academic results are time-sensitive and personally relevant|
| Event             | 1      | General interest, less urgency                             |

### Recency Factor

```
age_in_minutes = (now - notification.timestamp) / (1000 * 60)
recency_factor = 1 - (age_in_minutes / max_age_minutes)
```

- `max_age_minutes` defaults to 60 (configurable).
- Notifications older than `max_age_minutes` receive a minimum recency factor of `0.01`.
- More recent notifications score closer to `1.0`.

### Example

| Notification  | Type      | Age (min) | Type Weight | Recency Factor | Final Score |
|---------------|-----------|-----------|-------------|----------------|-------------|
| Placement A   | Placement | 2         | 3           | 0.97           | 2.90        |
| Result B      | Result    | 5         | 2           | 0.92           | 1.83        |
| Event C       | Event     | 1         | 1           | 0.98           | 0.98        |
| Result D      | Result    | 60+       | 2           | 0.01           | 0.02        |

---

## 3. Handling New Notifications Efficiently

### Problem
New notifications will keep arriving. How do we maintain the top N list efficiently without re-sorting the entire list every time?

### Approach: Polling + Client-Side Priority Queue

1. **Polling**: The frontend polls the API at a configurable interval (e.g. every 30 seconds) using the `page=1&limit=20` query params to fetch only the most recent notifications.

2. **Incremental Merge**: New notifications fetched are merged into the existing list. Since we sort by priority (not just timestamp), we re-score and re-sort only when new data arrives.

3. **Read/Unread Tracking**: Notification IDs are stored in `localStorage`. Any ID not in localStorage is treated as "new/unread" and highlighted in the UI.

4. **Pagination for older notifications**: Older notifications are lazily loaded via pagination (using `page` and `limit` query params) only when the user scrolls to the All Notifications page — not fetched eagerly.

### Trade-off: Polling vs WebSockets

| Approach   | Pros                            | Cons                              |
|------------|---------------------------------|-----------------------------------|
| Polling    | Simple, no server changes needed| Slight delay, extra API calls     |
| WebSockets | Real-time, efficient             | Requires server-side support      |

Since the provided API is a REST endpoint (not a WebSocket server), **polling** is the appropriate choice for this implementation.

---

## 4. Trade-offs Considered

| Decision                          | Chosen Approach         | Alternative           | Reason                                      |
|-----------------------------------|-------------------------|-----------------------|---------------------------------------------|
| Styling                           | Material UI + Vanilla CSS| Tailwind / ShadCN    | As per evaluation constraints               |
| State management                  | React useState/useEffect | Redux                | Simpler, sufficient for this scale           |
| Data persistence                  | localStorage (read state)| Database             | No backend DB required per instructions     |
| Priority recalculation            | On each fetch            | Background worker     | Simpler, low overhead for expected data size|
| Authentication                    | Pre-authorized (assumed) | JWT/OAuth            | Per evaluation instructions                 |
