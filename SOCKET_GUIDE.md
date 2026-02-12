# WebSocket (Socket.IO) Guide

> **Purpose**: Frontend reference for connecting to and using the Socket.IO WebSocket layer. This guide covers authentication, namespaces, events, and code examples.

---

## Quick Start

### 1. Install Client Library

```bash
npm install socket.io-client
```

### 2. Connect to Notifications

```typescript
import { io, Socket } from "socket.io-client";

const API_URL = "http://localhost:3000"; // your backend URL

const socket: Socket = io(`${API_URL}/notifications`, {
  auth: {
    token: "your-jwt-access-token", // same JWT used for REST API
  },
  // Reconnect automatically
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

---

## Authentication

All WebSocket connections require a valid **JWT access token** (the same token used for REST API `Authorization: Bearer <token>` header).

Pass it via the `auth` option:

```typescript
const socket = io(`${API_URL}/notifications`, {
  auth: {
    token: accessToken,
  },
});
```

If the token is invalid or expired, the connection will be rejected with an error event.

### Handling Token Refresh

When your token refreshes, disconnect and reconnect with the new token:

```typescript
function reconnectWithNewToken(newToken: string) {
  socket.auth = { token: newToken };
  socket.disconnect().connect();
}
```

---

## Architecture: Namespaces

The backend uses **Socket.IO namespaces** to isolate different features:

| Namespace | Purpose | Status |
|-----------|---------|--------|
| `/notifications` | Real-time notification delivery | ✅ Active |
| `/chat` | Real-time chat (future) | 🔜 Planned |
| `/collab` | Real-time collaboration (future) | 🔜 Planned |

Each namespace has its own connection, events, and auth. Connect to each namespace separately:

```typescript
const notifSocket = io(`${API_URL}/notifications`, { auth: { token } });
const chatSocket = io(`${API_URL}/chat`, { auth: { token } });  // future
```

---

## Notification Events Reference

### Server → Client Events (you listen to these)

| Event | Payload | Description |
|-------|---------|-------------|
| `new-notification` | `Notification` | A new notification was created for you |
| `unread-count` | `{ count: number }` | Updated unread count (sent on connect & after changes) |
| `notification-read` | `{ notificationId: string }` | Confirms a notification was marked as read |
| `all-notifications-read` | — | Confirms all notifications were marked as read |
| `error` | `{ message: string }` | Error from a client action |

### Client → Server Events (you emit these)

| Event | Payload | Description |
|-------|---------|-------------|
| `mark-as-read` | `{ notificationId: string }` | Mark a single notification as read |
| `mark-all-read` | — | Mark all notifications as read |

### Notification Object Shape

```typescript
interface Notification {
  id: string;
  userId: string;
  type: string;        // e.g. "MEMBER_INVITED", "ORDER_CREATED"
  title: string;
  message: string;
  metadata?: any;      // flexible JSON payload per type
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
```

---

## Full Example (React / Next.js)

### Hook: `useNotifications.ts`

```typescript
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useNotifications(accessToken: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${API_URL}/notifications`, {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to notifications");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from notifications");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Notification connection error:", err.message);
    });

    // Notification events
    socket.on("new-notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    socket.on("unread-count", (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    socket.on("notification-read", (data: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.notificationId ? { ...n, isRead: true } : n,
        ),
      );
    });

    socket.on("all-notifications-read", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  const markAsRead = useCallback((notificationId: string) => {
    socketRef.current?.emit("mark-as-read", { notificationId });
  }, []);

  const markAllAsRead = useCallback(() => {
    socketRef.current?.emit("mark-all-read");
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
}
```

### Usage in a Component

```tsx
function NotificationBell() {
  const { accessToken } = useAuth(); // your auth hook
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(accessToken);

  return (
    <div>
      <button>
        🔔 {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>

      <div>
        <button onClick={markAllAsRead}>Mark all read</button>
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markAsRead(n.id)}
            style={{ opacity: n.isRead ? 0.6 : 1 }}
          >
            <strong>{n.title}</strong>
            <p>{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## REST API Endpoints

For initial data loading, pagination, and non-real-time operations, use the REST API alongside WebSocket:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/notifications?page=1&limit=20&isRead=false` | List notifications (paginated) |
| `GET` | `/api/v1/notifications/unread-count` | Get unread count |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark as read |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all as read |
| `DELETE` | `/api/v1/notifications/:id` | Delete notification |

All REST endpoints require `Authorization: Bearer <token>` header.

---

## Connection Lifecycle

```
1. User logs in → gets accessToken
2. Connect to /notifications with token
3. Server authenticates → joins user to personal room
4. Server sends initial "unread-count"
5. When new notification is created → server pushes "new-notification"
6. Client can emit "mark-as-read" / "mark-all-read"
7. On token refresh → reconnect with new token
8. On logout → disconnect
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `connect_error: Authentication required` | Token not provided in `auth.token` |
| `connect_error: Invalid or expired token` | Token expired — refresh and reconnect |
| Not receiving notifications | Check you're connected to `/notifications` namespace, not root `/` |
| Events stop arriving | Check `isConnected` state, Socket.IO auto-reconnects by default |

---

**Last Updated**: 2026-02-12
