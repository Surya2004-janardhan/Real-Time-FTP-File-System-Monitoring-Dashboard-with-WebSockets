Objective
Build a web dashboard that monitors a remote FTP server, detects file system changes via periodic polling, and broadcasts these changes in real-time to all connected clients using WebSockets. You will learn polling strategies, in-memory state diffing, WebSocket communication, and how to build a responsive, real-time user interface. This project simulates real-world scenarios like building system monitoring tools, data synchronization services, or collaborative platforms where real-time state tracking is critical.

Description
Background
In many legacy and modern systems, File Transfer Protocol (FTP) remains a common method for exchanging files. However, FTP itself does not provide a native mechanism for notifying clients of changes. This creates a need for bridge services that can monitor an FTP server and translate file system events into modern, real-time notifications. This project involves building such a bridge.

You will implement a polling-based change detection system. The backend service will periodically connect to an FTP server, recursively list its files to create a "snapshot" of the file system state (paths, sizes, modification times), and compare it to the previous snapshot. This comparison, or "diffing," is a core algorithmic challenge. The resulting diff (added, modified, deleted files) is then broadcast to clients.

WebSockets are the ideal technology for pushing these updates from the server to connected web clients without requiring the client to repeatedly poll the server. This ensures low latency and efficient use of network resources. Your application will consist of three main parts: an FTP client manager, a polling and diffing service, and a WebSocket server integrated into a Next.js application, which also serves the frontend dashboard.

Implementation Details
This section provides a step-by-step guide to building the application. You are expected to manage credentials securely and ensure the application is robust against connection failures.

Step 1: Project Setup and FTP Server
First, set up your Next.js project with TypeScript. Your entire application, including the FTP server, must be orchestrated using Docker Compose for a one-command setup, as specified in req-docker-compose.

You will need a local FTP server for development and testing. The provided fauria/vsftpd Docker image is suitable for this. Your docker-compose.yml file should define both this FTP service and your Next.js application service.

Here is a template for your docker-compose.yml file:

# docker-compose.yml
version: '3.8'

services:
  # Your Next.js application service
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      # Pass FTP connection details from .env file
      - FTP_HOST=ftp
      - FTP_USER=${FTP_USER}
      - FTP_PASS=${FTP_PASS}
      - FTP_SECURE=false
    depends_on:
      ftp:
        condition: service_healthy
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules # Mount a volume for node_modules to avoid overwriting
      - /usr/src/app/.next
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # FTP Server for testing
  ftp:
    image: fauria/vsftpd
    ports:
      - "20:20"
      - "21:21"
      - "21100-21110:21100-21110"
    environment:
      - FTP_USER=${FTP_USER}
      - FTP_PASS=${FTP_PASS}
      - PASV_ADDRESS=127.0.0.1 # Important for local Docker setup
      - PASV_MIN_PORT=21100
      - PASV_MAX_PORT=21110
    volumes:
      - ./ftp-data:/home/vsftpd/${FTP_USER} # Mount a local directory to the FTP server
    healthcheck:
      # A basic healthcheck for vsftpd is tricky; a simple port check is a start.
      # A more robust check would involve trying to connect.
      # For this task, we'll rely on the app's dependency healthcheck.
      test: "exit 0" # Placeholder, as vsftpd lacks a simple health command
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  ftp-data:
Create a .env.example file as per req-env-example to document your environment variables. Never commit your actual .env file.

# .env.example
# FTP Server Credentials
FTP_USER=testuser
FTP_PASS=testpass

# Application Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3000
POLLING_INTERVAL_MS=5000
Step 2: Backend API and FTP Service
Implement the backend logic for interacting with the FTP server and managing the application's state. This includes the API endpoints for listing and previewing files, the WebSocket server, and the polling service.

Your API will expose endpoints defined in req-api-list-directory and req-api-preview-file. You will also need the health check endpoint (req-health-check) used by Docker Compose.

For the real-time functionality, you will integrate a WebSocket server (e.g., using socket.io) into your Next.js custom server. This server will handle client connections and broadcast the fs:snapshot and fs:diff events detailed in req-ws-initial-snapshot, req-ws-diff-added, req-ws-diff-modified, and req-ws-diff-deleted.

Step 3: Snapshot Diffing and Polling
The core of the change detection is the snapshot diffing algorithm (req-testing-diff-function). This should be a pure function that takes two snapshots (arrays of file metadata) and returns an object detailing the changes. A snapshot should be an array of objects, each containing at least path, size, and modifiedAt properties.

// Example type definitions in your project
interface FtpFile {
  path: string;
  size: number;
  modifiedAt: Date;
}

type FileSnapshot = FtpFile[];

interface SnapshotDiff {
  added: FtpFile[];
  modified: FtpFile[];
  deleted: FtpFile[];
}

function diffSnapshots(previous: FileSnapshot, current: FileSnapshot): SnapshotDiff {
  // Your implementation here
  return { added: [], modified: [], deleted: [] };
}
This function must be covered by unit tests. Create a tests/ directory for these tests.

Step 4: Frontend Dashboard
Build the user interface using React and a styling library like Tailwind CSS. The dashboard should connect to the WebSocket server upon loading. It will have three main components:

File Tree: A hierarchical view of the FTP server's file system, built from the fs:snapshot and updated with fs:diff events. Ensure elements have data-test-id attributes as per req-frontend-file-tree.
Activity Feed: A list of the most recent file changes. Each entry should show the type of change (Added, Modified, Deleted), the file path, and a timestamp. Add data-test-id attributes as specified in req-frontend-activity-feed.
Preview Panel: Displays the content of a selected file, fetched via the API. This is specified in req-frontend-file-preview.
Step 5: Submission Checklist
Ensure your submission is complete by verifying all the following artifacts are present in your repository:

 README.md: A comprehensive README file with setup instructions, an architecture overview, and a brief explanation of your design decisions.
 docker-compose.yml: The main Docker Compose file to start the entire application stack.
 Dockerfile: The Dockerfile for building your Next.js application image.
 .env.example: File documenting all required environment variables.
 submission.json: (If required by a specific task requirement for evaluation credentials, otherwise optional).
 /src or /app: All source code for your Next.js application.
 /tests: Directory containing unit tests, especially for the diffing function.
Implementation Guidelines
These are suggestions and best practices, not strict requirements. They are intended to guide you toward a more robust and production-ready solution.

Separation of Concerns: Keep your FTP logic, polling service, WebSocket handling, and API routes in separate, well-organized modules. A good structure might be to have a /server directory for all backend-specific code that runs in the custom Next.js server.
FTP Connection Management: FTP connections can be stateful and fragile. Implement a connection manager class that handles establishing, reusing, and gracefully tearing down connections. Avoid creating a new connection for every single operation, as this can lead to errors like "too many connections."
State Management: On the server, the primary state is the latest file system snapshot. This can be stored in memory. On the client, you'll need to manage the UI state derived from the snapshots and diffs. Using a state management library like Redux, Zustand, or even React Context can help manage this complexity, especially for keeping the file tree and activity feed in sync.
Performance: For the frontend, avoid re-rendering the entire file tree on every update. Use React's key prop correctly on your list items and consider using React.memo or useMemo to prevent unnecessary re-renders of unchanged components.
Error Handling: Besides handling FTP connection loss, consider other failure modes. What if an FTP command fails? What if the file system is temporarily unreadable? Log these errors and provide clear feedback in the UI.
Security: While this task uses a local test server, in a real-world scenario, you would use FTPS (FTP over SSL/TLS) and store credentials securely using a secrets management service, not in environment variables.
FAQ
Q: Do I have to use the recommended libraries like basic-ftp or socket.io?

A: No, you are free to use any libraries you prefer for FTP, WebSockets, or UI components. The recommendations are just starting points.
Q: How should I handle very large directories on the FTP server?

A: A production-grade solution might involve paginating the FTP LIST command or using a more advanced protocol. For this task, a simple recursive listing is acceptable. You can add a configurable recursion depth limit as a safeguard.
Q: My FTP connection inside Docker isn't working. What's wrong?

A: This is almost always an issue with FTP's passive mode (PASV). Ensure the PASV_ADDRESS in your FTP server's environment configuration points to an address accessible from your application container (or 127.0.0.1 for local-only setups). The port range (PASV_MIN_PORT, PASV_MAX_PORT) must also be exposed in your docker-compose.yml.
Q: How do I implement the custom Next.js server for WebSockets?

A: The official Next.js documentation has a guide on creating a custom server.js file. You will integrate your WebSocket server logic there, attaching it to the Node.js http server that Next.js creates.
Q: How can I test the connection loss and reconnection logic?

A: You can simulate a connection loss by manually stopping the FTP Docker container (docker stop <ftp_container_id>) and then restarting it. Your application should detect the disconnection and attempt to reconnect, which you can verify through your health check endpoint (req-health-check).
Q: Should the polling interval be configurable at runtime?

A: Yes, req-config-polling-interval specifies that this should be configurable via an API endpoint. This allows for dynamic adjustment without restarting the application.
Core Requirements
1.
The entire application stack, including the Next.js application and the VSFTPD test server, must be defined in a docker-compose.yml file at the root of the repository. The application service must have a health check that depends on the FTP service being available. Running docker-compose up must start all services without any manual intervention.

Contract Specification:

Services
app: Your Next.js application service.
ftp: The fauria/vsftpd service.
app Service Requirements
Must build from a Dockerfile in the repository.
Must depend on the ftp service (depends_on).
Must include a healthcheck that verifies the application is running and can connect to other services (see req-health-check).
ftp Service Requirements
Must use the image fauria/vsftpd.
Must expose ports 21 and a passive port range (e.g., 21100-21110).
Must be configured with a user and password via environment variables.
Must mount a local directory (e.g., ./ftp-data) to the user's home directory to persist files.
Verification:

Run docker-compose up -d --build from the repository root.
Verify that both app and ftp containers start and become healthy.
Verify that creating a file in the local ./ftp-data directory makes it appear on the FTP server.
2.
A .env.example file must be present at the root of the repository, documenting all environment variables required to run the application.

Contract Specification:

File Location
.env.example
Required Variables
FTP_USER: Username for the FTP server.
FTP_PASS: Password for the FTP server.
POLLING_INTERVAL_MS: The interval in milliseconds for polling the FTP server.
NEXT_PUBLIC_WS_URL: The public URL for the WebSocket server for client-side connection.
Verification:

Check for the existence of the .env.example file.
Parse the file and verify that all specified keys are present.
Verify that no actual secrets are present; values should be placeholders (e.g., testuser, testpass).
3.
The backend must expose an API endpoint to recursively list the contents of a directory on the FTP server.

Contract Specification:

Endpoint
GET /api/ftp/list
Query Parameter: path (string, e.g., /)
Success Response (200 OK)
Content-Type: application/json
Body Schema:
{
  "files": [
    {
      "path": "string",
      "name": "string",
      "type": "file" | "directory",
      "size": "number",
      "modifiedAt": "string (ISO 8601)"
    }
  ]
}
Verification:

Ensure a test file and a test directory exist on the FTP server.
Send a GET request to /api/ftp/list?path=/.
Verify the status code is 200.
Verify the response body matches the specified JSON schema and contains the test file and directory.
4.
The backend must provide an endpoint to fetch and stream the content of a specific file from the FTP server.

Contract Specification:

Endpoint
GET /api/ftp/preview
Query Parameter: path (string, e.g., /test.txt)
Success Response (200 OK)
The response body should be the raw content of the file.
The Content-Type header should be set appropriately (e.g., text/plain, image/png, application/json). For unknown types, use application/octet-stream.
Error Response (404 Not Found)
If the file does not exist.
Verification:

Create a text file (test.txt) on the FTP server with known content.
Send a GET request to /api/ftp/preview?path=/test.txt.
Verify the status code is 200 and the response body matches the file's content.
Send a GET request for a non-existent file.
Verify the status code is 404.
5.
When a new client connects to the WebSocket server, the server must immediately send an fs:snapshot event containing the current state of the entire monitored directory.

Contract Specification:

Event Name
fs:snapshot
Payload Schema
{
  "snapshot": [
    {
      "path": "string",
      "name": "string",
      "type": "file" | "directory",
      "size": "number",
      "modifiedAt": "string (ISO 8601)"
    }
  ]
}
Verification:

Place a known set of files on the FTP server.
Start the application and connect a WebSocket client.
Listen for the fs:snapshot event.
Verify the event is received within 2 seconds of connection.
Verify its payload matches the schema and reflects the files on the FTP server.
6.
When a new file is added to the monitored FTP directory, the server must broadcast an fs:diff event indicating the added file.

Contract Specification:

Event Name
fs:diff
Payload Schema
{
  "added": [
    {
      "path": "string",
      "name": "string",
      "type": "file" | "directory",
      "size": "number",
      "modifiedAt": "string (ISO 8601)"
    }
  ],
  "modified": [],
  "deleted": []
}
Verification:

Connect a WebSocket client.
Add a new file to the FTP server's monitored directory.
Verify that an fs:diff event is received within one polling interval.
Verify the added array contains the metadata for the new file and that modified and deleted are empty.
7.
When an existing file is modified, the server must broadcast an fs:diff event identifying the modified file.

Contract Specification:

Event Name
fs:diff
Payload Schema
{
  "added": [],
  "modified": [
    {
      "path": "string",
      "name": "string",
      "type": "file",
      "size": "number",
      "modifiedAt": "string (ISO 8601)"
    }
  ],
  "deleted": []
}
Verification:

Ensure a file exists on the FTP server.
Connect a WebSocket client.
Modify the content of the existing file.
Verify that an fs:diff event is received within one polling interval.
Verify the modified array contains the updated metadata and that added and deleted are empty.
8.
When a file is deleted from the FTP server, an fs:diff event must be broadcast with the details of the deleted file.

Contract Specification:

Event Name
fs:diff
Payload Schema
{
  "added": [],
  "modified": [],
  "deleted": [
    {
      "path": "string",
      "name": "string",
      "type": "file" | "directory",
      "size": "number",
      "modifiedAt": "string (ISO 8601)"
    }
  ]
}
Verification:

Ensure a file exists on the FTP server.
Connect a WebSocket client.
Delete the file from the FTP server.
Verify that an fs:diff event is received within one polling interval.
Verify the deleted array contains the metadata of the deleted file.
9.
The application must expose a health check endpoint that reports the status of its connection to the FTP server.

Contract Specification:

Endpoint
GET /api/health
Success Response (200 OK)
Body Schema:
{
  "status": "ok",
  "ftpConnection": "connected" | "disconnected"
}
Verification:

With the FTP server running, send a GET request to /api/health. Verify the response body is {"status": "ok", "ftpConnection": "connected"}.
Stop the FTP server container.
Send another GET request to /api/health. Verify the response body is {"status": "ok", "ftpConnection": "disconnected"}.
10.
The application must provide API endpoints to get and set the polling interval at runtime.

Contract Specification:

Get Configuration Endpoint
GET /api/config
Response (200 OK):
{
  "pollingIntervalMs": 5000 
}
Set Configuration Endpoint
POST /api/config
Request Body:
{
  "pollingIntervalMs": 10000
}
Response (200 OK):
{
  "pollingIntervalMs": 10000
}
Verification:

Send a GET request to /api/config and verify the default interval is returned.
Send a POST request to /api/config with a new interval value.
Send another GET request to verify the new interval has been set.
11.
The project must include a suite of unit tests for the snapshot diffing function. A script must be provided to run these tests.

Contract Specification:

Test Location
A tests/ or __tests__/ directory at the project root.
Test Runner Script
The package.json file must contain a test script (e.g., "test": "jest").
Required Test Scenarios
Comparing an empty snapshot to a populated one (initial load).
Comparing identical snapshots (no changes).
A scenario with only added files.
A scenario with only modified files.
A scenario with only deleted files.
A mixed scenario with additions, modifications, and deletions.
Verification:

Run npm install or yarn install.
Run npm test or yarn test.
Verify that the test runner executes and exits with a success code (0).
The test report should show passing tests for all required scenarios.
12.
The frontend dashboard must display a file tree based on the data from the WebSocket server. Each file and directory item in the tree must have a specific data-test-id attribute for verification.

Contract Specification:

data-test-id Attributes
Each file or folder list item in the tree must have a data-test-id attribute formatted as file-tree-item-<file-path-base64>.
The file path should be base64 encoded to ensure it's a valid attribute value.
Example: For a file at /docs/report.pdf, the ID would be file-tree-item-L2RvY3MvcmVwb3J0LnBkZg==.
Verification:

Place a file and a folder on the FTP server.
Load the web application.
Use a DOM inspection tool (like Playwright) to query for the data-test-id attributes corresponding to the file and folder.
Verify both elements exist.
13.
The dashboard must include a live activity feed showing the latest changes. Each item in the feed must be identifiable via a data-test-id.

Contract Specification:

data-test-id Attributes
The container for the activity feed must have data-test-id="activity-feed".
Each entry in the feed must have a data-test-id formatted as activity-item-<change-type>-<file-path-base64>.
change-type must be one of added, modified, or deleted.
Verification:

Load the web application.
Add a new file to the FTP server.
Query the DOM for an element with data-test-id matching activity-item-added-<path-base64> inside the activity-feed container.
Verify the element appears.
14.
When a user clicks on a file in the file tree, a preview panel must appear displaying the file's content.

Contract Specification:

data-test-id Attributes
The preview panel container must have data-test-id="file-preview-panel".
Verification:

Add a text file to the FTP server.
Load the application and wait for the file to appear in the tree.
Simulate a click on the file tree item.
Query the DOM for the element with data-test-id="file-preview-panel".
Verify the element is visible and contains the content of the text file.

Submission Instructions
Submit a link to your Git repository. The repository must contain all application source code and a comprehensive README.md file. For this task, your submission is required to include a docker-compose.yml file, all necessary Dockerfile(s), and a .env.example file documenting all environment variables. Your application must be runnable with a single docker-compose up command. Ensure no secrets or credentials are hardcoded or committed. The tests/ directory with unit tests is also mandatory.

Evaluation Overview
Your submission will be evaluated based on functionality, code quality, and adherence to the specified requirements. The core functional requirements will be verified by a suite of automated tests that interact with your application's API, WebSocket interface, and containerized environment. Your code will undergo automated analysis to assess its structure, maintainability, and use of best practices. Finally, your project setup will be checked to ensure it can be launched easily with the provided docker-compose.yml file.
