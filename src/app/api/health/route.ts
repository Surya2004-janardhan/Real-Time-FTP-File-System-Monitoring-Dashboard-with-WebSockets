import { NextResponse } from "next/server";
import { ftpService } from "@/lib/ftp";

export async function GET() {
    try {
        const isConnected = await ftpService.isConnected();
        return NextResponse.json({
            status: "ok",
            ftpConnection: isConnected ? "connected" : "disconnected",
        });
    } catch (err) {
        return NextResponse.json(
            { status: "error", message: (err as Error).message },
            { status: 500 }
        );
    }
}
