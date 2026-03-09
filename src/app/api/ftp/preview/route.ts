import { NextRequest, NextResponse } from "next/server";
import { ftpService } from "@/lib/ftp";
import { Readable } from "stream";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
        return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    try {
        const stream = await ftpService.getFileStream(path);

        // Determine content type based on extension
        const ext = path.split(".").pop()?.toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === "txt") contentType = "text/plain";
        else if (ext === "json") contentType = "application/json";
        else if (ext === "png") contentType = "image/png";
        else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
        else if (ext === "pdf") contentType = "application/pdf";

        // Convert NodeJS.ReadableStream to Web Stream
        const webStream = new ReadableStream({
            start(controller) {
                (stream as Readable).on("data", (chunk) => controller.enqueue(chunk));
                (stream as Readable).on("end", () => controller.close());
                (stream as Readable).on("error", (err) => controller.error(err));
            }
        });

        return new NextResponse(webStream, {
            headers: {
                "Content-Type": contentType,
            },
        });
    } catch (err) {
        console.error("FTP Preview Error:", err);
        return NextResponse.json({ error: "File not found or unreadable" }, { status: 404 });
    }
}
