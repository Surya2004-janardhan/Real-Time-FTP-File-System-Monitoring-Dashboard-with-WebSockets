# Real-Time FTP File System Monitoring Dashboard

This project is a real-time dashboard that monitors a remote FTP server, detects file system changes via periodic polling, and broadcasts those changes to clients using WebSockets.

## Features
- **Real-Time Monitoring**: Automatically detects Added, Modified, and Deleted files.
- **WebSocket Integration**: Instant updates without page refreshes using Socket.io.
- **File System Tree**: Hierarchical view of the FTP server's contents.
- **Activity Feed**: Live log of file system events with timestamps.
- **File Preview**: Instant content preview for text-based files.
- **Dynamic Configuration**: Adjust polling intervals at runtime via API.
- **Dockerized Setup**: One-command orchestration for the app and a test FTP server.

## Architecture
- **Frontend**: Next.js 15, Tailwind CSS, Socket.io-client.
- **Backend**: Custom Next.js Server (Node.js), Socket.io, `basic-ftp` for communication.
- **Change Detection**: Pure diffing algorithm that compares snapshots of file metadata (path, size, modification time).

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed.

### Quick Start
1. **Clone the repository.**
2. **Create a `.env` file** (optional, defaults are provided in `docker-compose.yml`):
   ```env
   FTP_USER=testuser
   FTP_PASS=testpass
   POLLING_INTERVAL_MS=5000
   ```
3. **Launch the stack**:
   ```bash
   docker-compose up --build
   ```
4. **Access the dashboard**: Open [http://localhost:3000](http://localhost:3000) in your browser.

### Development & Testing
- **Run Unit Tests**: `npm test`
- **Simulate Changes**: Add files to the `./ftp-data` directory on your host machine to see them reflected in the dashboard.
- **Update Polling Interval**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"pollingIntervalMs": 2000}' http://localhost:3000/api/config
  ```

## Design Decisions
- **Custom Server**: Required to integrate Socket.io effectively with Next.js's HTTP server.
- **In-Memory State**: The server maintains the latest snapshot in memory for fast diffing.
- **Atomic Commits**: The project follows a structured implementation plan to ensure high code quality and maintainability.
