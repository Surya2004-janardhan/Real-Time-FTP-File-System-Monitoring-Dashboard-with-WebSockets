# Task Plan - Real-Time FTP File System Monitoring Dashboard

This plan outlines the 7 key steps to build the real-time FTP monitoring dashboard, satisfying all requirements.

### Step 1: Project Scaffolding & Dockerization
Establish the foundation with a Next.js (TypeScript) project and a `docker-compose.yml` for the `app` and `ftp` (vsftpd) services. Create a `.env.example` with standard placeholders.

### Step 2: Backend Infrastructure & Health Check
Design a robust FTP connection manager and a custom Next.js server to handle API and WebSocket traffic. Implement `/api/health` for service readiness verification.

### Step 3: Polling Service & Pure Diffing Algorithm
Develop a background worker for periodic FTP polling. Implement a pure `diffSnapshots` function to identify Added, Modified, and Deleted entries, maintaining state in server memory.

### Step 4: Unit Testing (Diff Logic)
Establish a `tests/` directory with Jest/Vitest. Write comprehensive unit tests for `diffSnapshots`, covering all edge cases (initial load, no changes, mixed updates).

### Step 5: WebSocket Real-Time Broadcasting
Integrate `socket.io` to manage client connections. Implement immediate `fs:snapshot` emission on connection and `fs:diff` broadcasts upon change detection.

### Step 6: FTP API Extensions & Dynamic Configuration
Expose `/api/ftp/list` (recursive listing) and `/api/ftp/preview` (file streaming). Implement `/api/config` (GET/POST) to allow runtime adjustment of the polling interval.

### Step 7: Frontend Dashboard & Testing IDs
Build the UI (React/Tailwind) featuring a File Tree, Activity Feed, and Preview Panel. Crucially, apply all required `data-test-id` attributes for automated verification.
