import { NextRequest, NextResponse } from "next/server";
import { ftpService } from "@/lib/ftp";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path") || "/";

    try {
        const files = await ftpService.listRecursive(path);
        return NextResponse.json({ files });
    } catch (err) {
        console.error("FTP List API Error:", err);
        return NextResponse.json(
            { error: "Failed to list files from FTP server" },
            { status: 500 }
        );
    }
}
