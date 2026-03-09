import { NextRequest, NextResponse } from "next/server";
import { webSocketService } from "@/lib/socket";

export async function GET() {
    return NextResponse.json({
        pollingIntervalMs: webSocketService.getPollingInterval(),
    });
}

export async function POST(req: NextRequest) {
    try {
        const { pollingIntervalMs } = await req.json();
        if (typeof pollingIntervalMs !== "number" || pollingIntervalMs < 1000) {
            return NextResponse.json(
                { error: "Invalid polling interval. Must be a number >= 1000ms" },
                { status: 400 }
            );
        }
        webSocketService.setPollingInterval(pollingIntervalMs);
        return NextResponse.json({ pollingIntervalMs });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to update configuration" },
            { status: 500 }
        );
    }
}
