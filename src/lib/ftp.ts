import * as ftp from "basic-ftp";

export interface FtpFile {
  path: string;
  name: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: string;
}

export class FtpService {
  private client: ftp.Client;
  private config: ftp.AccessOptions;

  constructor() {
    this.client = new ftp.Client();
    this.client.ftp.verbose = false;
    this.config = {
      host: process.env.FTP_HOST || "ftp",
      user: process.env.FTP_USER || "testuser",
      password: process.env.FTP_PASS || "testpass",
      secure: process.env.FTP_SECURE === "true",
    };
  }

  async connect() {
    if (!this.client.closed) return;
    try {
      await this.client.access(this.config);
    } catch (err) {
      console.error("FTP Connection Error:", err);
      throw err;
    }
  }

  async disconnect() {
    if (!this.client.closed) {
      this.client.close();
    }
  }

  async isConnected(): Promise<boolean> {
    return !this.client.closed;
  }

  async listRecursive(rootPath: string = "/"): Promise<FtpFile[]> {
    await this.connect();
    const files: FtpFile[] = [];

    const scan = async (currentPath: string) => {
      const list = await this.client.list(currentPath);
      for (const item of list) {
        const fullPath = currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`;
        const type = item.isDirectory ? "directory" : "file";
        
        files.push({
          path: fullPath,
          name: item.name,
          type: type as "file" | "directory",
          size: item.size,
          modifiedAt: item.modifiedAt ? new Date(item.modifiedAt).toISOString() : new Date().toISOString(),
        });

        if (item.isDirectory) {
          await scan(fullPath);
        }
      }
    };

    try {
      await scan(rootPath);
      return files;
    } catch (err) {
      console.error("FTP List Error:", err);
      throw err;
    }
  }

  async getFileStream(path: string): Promise<NodeJS.ReadableStream> {
    await this.connect();
    const stream = new (require("stream").PassThrough)();
    await this.client.downloadTo(stream, path);
    return stream;
  }
}

export const ftpService = new FtpService();
