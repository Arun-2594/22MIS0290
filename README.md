# Campus Notifications Microservice

## Project Structure

```
campus-notifications/
├── logging_middleware/
│   └── logger.js               # Shared logging module
├── notification_app_be/
│   ├── priorityInbox.js        # Stage 1 - Priority scoring logic
│   └── package.json
├── notification_app_fe/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── NotificationCard.js
│   │   ├── hooks/
│   │   │   └── useReadNotifications.js
│   │   ├── pages/
│   │   │   ├── AllNotifications.js
│   │   │   └── PriorityInbox.js
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── logger.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── notification_system_design.md
└── .gitignore
```

---

## Stage 1 – Backend (Priority Inbox)

### Requirements
- Node.js 18+

### Run
```bash
cd notification_app_be
node priorityInbox.js        # Top 10 (default)
node priorityInbox.js 15     # Top 15
node priorityInbox.js 20     # Top 20
```

---

## Stage 2 – Frontend (React App)

### Requirements
- Node.js 18+

### Run
```bash
cd notification_app_fe
npm install
npm start
```

App runs at: http://localhost:3000

### Features
- Priority Inbox: top N notifications sorted by priority score
- All Notifications: paginated list with type filter
- Read/Unread tracking (persisted in localStorage)
- Responsive (desktop + mobile)
- Material UI styling

---

## Logging Middleware

Used throughout both Stage 1 and Stage 2.
Levels: INFO, ERROR, DEBUG, WARN
No direct console.log is used anywhere.
