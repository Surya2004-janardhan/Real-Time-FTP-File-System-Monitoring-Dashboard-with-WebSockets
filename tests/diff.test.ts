import { diffSnapshots } from "../src/lib/diff";
import { FtpFile } from "../src/lib/ftp";

describe("diffSnapshots", () => {
    const file1: FtpFile = {
        path: "/file1.txt",
        name: "file1.txt",
        type: "file",
        size: 100,
        modifiedAt: "2023-01-01T00:00:00.000Z",
    };
    const file2: FtpFile = {
        path: "/file2.txt",
        name: "file2.txt",
        type: "file",
        size: 200,
        modifiedAt: "2023-01-01T00:00:00.000Z",
    };

    test("initial load (empty to populated)", () => {
        const diff = diffSnapshots([], [file1, file2]);
        expect(diff.added).toHaveLength(2);
        expect(diff.added).toContainEqual(file1);
        expect(diff.added).toContainEqual(file2);
        expect(diff.modified).toHaveLength(0);
        expect(diff.deleted).toHaveLength(0);
    });

    test("no changes", () => {
        const diff = diffSnapshots([file1], [file1]);
        expect(diff.added).toHaveLength(0);
        expect(diff.modified).toHaveLength(0);
        expect(diff.deleted).toHaveLength(0);
    });

    test("file added", () => {
        const diff = diffSnapshots([file1], [file1, file2]);
        expect(diff.added).toHaveLength(1);
        expect(diff.added[0]).toEqual(file2);
        expect(diff.modified).toHaveLength(0);
        expect(diff.deleted).toHaveLength(0);
    });

    test("file modified (size changed)", () => {
        const file1Modified = { ...file1, size: 150 };
        const diff = diffSnapshots([file1], [file1Modified]);
        expect(diff.added).toHaveLength(0);
        expect(diff.modified).toHaveLength(1);
        expect(diff.modified[0]).toEqual(file1Modified);
        expect(diff.deleted).toHaveLength(0);
    });

    test("file deleted", () => {
        const diff = diffSnapshots([file1, file2], [file1]);
        expect(diff.added).toHaveLength(0);
        expect(diff.modified).toHaveLength(0);
        expect(diff.deleted).toHaveLength(1);
        expect(diff.deleted[0]).toEqual(file2);
    });

    test("mixed scenario", () => {
        const file1Modified = { ...file1, size: 150 };
        const file3: FtpFile = {
            path: "/file3.txt",
            name: "file3.txt",
            type: "file",
            size: 300,
            modifiedAt: "2023-01-01T00:00:00.000Z",
        };
        const diff = diffSnapshots([file1, file2], [file1Modified, file3]);
        expect(diff.added).toHaveLength(1);
        expect(diff.added[0].path).toBe("/file3.txt");
        expect(diff.modified).toHaveLength(1);
        expect(diff.modified[0].path).toBe("/file1.txt");
        expect(diff.deleted).toHaveLength(1);
        expect(diff.deleted[0].path).toBe("/file2.txt");
    });
});
