import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { ftpService, FtpFile } from "./ftp";
import { diffSnapshots } from "./diff";

export class WebSocketService {
    private io: SocketIOServer | null = null;
    private currentSnapshot: FtpFile[] = [];
    private pollingInterval: number = parseInt(process.env.POLLING_INTERVAL_MS || "5000", 10);
    private pollingTimer: NodeJS.Timeout | null = null;

    init(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*",
            },
        });

        this.io.on("connection", (socket) => {
            console.log("Client connected:", socket.id);

            // Send initial snapshot
            socket.emit("fs:snapshot", { snapshot: this.currentSnapshot });

            socket.on("disconnect", () => {
                console.log("Client disconnected:", socket.id);
            });
        });

        this.startPolling();
    }

    setPollingInterval(interval: number) {
        this.pollingInterval = interval;
        this.startPolling(); // Restart with new interval
    }

    getPollingInterval() {
        return this.pollingInterval;
    }

    private async startPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
        }

        const poll = async () => {
            try {
                const newSnapshot = await ftpService.listRecursive("/");
                const diff = diffSnapshots(this.currentSnapshot, newSnapshot);

                if (diff.added.length > 0 || diff.modified.length > 0 || diff.deleted.length > 0) {
                    console.log("Found changes, broadcasting fs:diff");
                    this.io?.emit("fs:diff", diff);
                    this.currentSnapshot = newSnapshot;
                }
            } catch (err) {
                console.error("Polling Error:", err);
            }
        };

        // Initial poll
        await poll();

        this.pollingTimer = setInterval(poll, this.pollingInterval);
    }
}

export const webSocketService = new WebSocketService();
