import { FtpFile } from "./ftp";

export interface SnapshotDiff {
    added: FtpFile[];
    modified: FtpFile[];
    deleted: FtpFile[];
}

export function diffSnapshots(
    previous: FtpFile[],
    current: FtpFile[]
): SnapshotDiff {
    const previousMap = new Map(previous.map((f) => [f.path, f]));
    const currentMap = new Map(current.map((f) => [f.path, f]));

    const added: FtpFile[] = [];
    const modified: FtpFile[] = [];
    const deleted: FtpFile[] = [];

    // Check for added and modified
    for (const [path, currentFile] of currentMap) {
        const previousFile = previousMap.get(path);
        if (!previousFile) {
            added.push(currentFile);
        } else if (
            previousFile.size !== currentFile.size ||
            previousFile.modifiedAt !== currentFile.modifiedAt
        ) {
            modified.push(currentFile);
        }
    }

    // Check for deleted
    for (const [path, previousFile] of previousMap) {
        if (!currentMap.has(path)) {
            deleted.push(previousFile);
        }
    }

    return { added, modified, deleted };
}
