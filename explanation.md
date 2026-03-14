# Project Explanation & Core Logic

This document provides a deep dive into the architecture, core logic, and individual files of the Real-Time FTP File System Monitoring Dashboard.

## Architecture & Workflow

The system is composed of three primary layers:

1. **FTP Server (`vsftpd` container)**
   - Acts as the source of truth for the file system.
   - Files are mounted from the host (`./ftp-data`) into the container so local edits trigger remote changes.

2. **Backend Engine (Next.js Custom Server + Node.js)**
   - **Poller**: Runs at a configurable interval (e.g., every 5000ms), recursively fetching the file list from the FTP server.
   - **Differ**: Compares the new snapshot against the previous one stored in memory using an algorithmic diff function.
   - **WebSocket Broadcaster**: If the Differ finds additions, modifications, or deletions, the changes are emitted to all connected clients via Socket.io.

3. **Frontend Dashboard (Next.js React Client)**
   - Listens to WebSocket events (`fs:snapshot`, `fs:diff`).
   - Updates the React state dynamically, rendering the File Tree and Activity Feed.
   - Fetches file contents on-demand via the `/api/ftp/preview` REST endpoint.

---

## File-by-File Breakdown

### Root Configuration & Setup

- **`Dockerfile`**: Defines the Node 20 environment, installs dependencies (including `curl` for healthchecks and `tsx` for execution), and builds the Next.js production app.
- **`docker-compose.yml`**: Orchestrates the multi-container setup. It defines the `app` service (Next.js) and the `ftp` service (`fauria/vsftpd`). It manages networking, environment variables passing, and robust healthchecks using `pgrep`.
- **`.env.example`** / **`.env`**: Stores configuration constants like `FTP_USER`, `FTP_PASS`, `FTP_HOST`, and polling intervals.
- **`package.json`**: Manages project dependencies including `basic-ftp`, `socket.io`, `socket.io-client`, and script execution engines like `tsx`.
- **`server.ts`**: The custom Next.js server entry point. It bootstraps the HTTP server, attaches the Socket.io WebSocket server, initializes the file system poller, and routes Next.js pages. This file allows us to combine WebSockets and Server-Side Rendering in one process.

### Backend Logic (`src/lib/`)

- **`src/lib/ftp.ts`**: Contains the `FtpService` class. It wraps the `basic-ftp` library.
  - `listRecursive(path)`: Recursively traverses the FTP server, extracting `name`, `type`, `size`, and `modifiedAt`.
  - `getFileStream(path)`: Downloads a specific file stream for the preview panel.
- **`src/lib/diff.ts`**: Contains the pure algorithmic core of the change detection: `diffSnapshots()`.
  - It takes two arrays (previous and current snapshot).
  - Uses `Map` data structures (O(1) lookups) to identify `added` files, `deleted` files, and `modified` files based on byte `size` or `modifiedAt` timestamp divergence.
- **`src/lib/socket.ts`**: The `WebSocketService` singleton. It manages the `SocketIOServer` instance, handles client connections/disconnections, and maintains the `setInterval` timer that physically triggers the FTP polling flow.

### Backend API Routes (`src/app/api/`)

- **`src/app/api/health/route.ts`**: Returns a 200 OK status containing overall application health and specifically verifies if the FTP connection is alive.
- **`src/app/api/ftp/list/route.ts`**: A manual REST endpoint to recursively list a specific folder via GET parameters.
- **`src/app/api/ftp/preview/route.ts`**: Streams a raw file buffer directly from the FTP server back to the browser.
- **`src/app/api/config/route.ts`**: Exposes GET and POST methods to dynamically read or mutate the `POLLING_INTERVAL_MS` without restarting the server.

### Frontend (`src/app/`)

- **`src/app/page.tsx`**: The main React Dashboard UI.
  - Registers `useEffects` to manage WebSocket listeners.
  - Maintains `snapshot` and `activities` arrays in state.
  - Dynamically calculates file deepness based on path `/` counts to render a hierarchical file tree.
  - Uses a second `useEffect` to watch the `snapshot` data. If the user is currently previewing a file, and an `fs:diff` modifying that exact file arrives, the frontend automatically re-fetches the preview from the backend.
