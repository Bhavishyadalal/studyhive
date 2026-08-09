import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDriveClient, getRootFolderId } from "./drive.server";
import { Readable } from "stream";

export const getFolders = createServerFn({ method: "GET" })
  .inputValidator(z.object({ parentId: z.string().optional() }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    let parentId = data.parentId;

    if (!parentId) {
      parentId = await getRootFolderId(drive);
    }

    const response = await (drive as any).files.list({
      q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, description)",
    });

    const folders = response.data.files || [];

    const foldersWithCounts = await Promise.all(
      folders.map(async (f: any) => {
        let isLocked = false;
        try {
          if (f.description) {
            const desc = JSON.parse(f.description);
            isLocked = !!desc.protected;
          }
        } catch (e) {}

        // Fix Issue 2: Count files inside topic folders for each subject
        let fileCount = 0;
        try {
          // 1. Get all topic subfolders inside this subject folder
          const subfoldersResponse = await (drive as any).files.list({
            q: `'${f.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: "files(id)",
          });
          const subfolders = subfoldersResponse.data.files || [];

          // 2. For each topic subfolder, count its files
          const counts = await Promise.all(
            subfolders.map(async (sf: any) => {
              const res = await (drive as any).files.list({
                q: `'${sf.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
                fields: "files(id)",
                pageSize: 1000,
              });
              return res.data.files?.length || 0;
            })
          );

          // 3. Sum all topic file counts as the subject's fileCount
          fileCount = counts.reduce((acc, c) => acc + c, 0);
        } catch (e) {
          console.error("Error counting files for subject:", f.id, e);
        }

        return {
          id: f.id,
          name: f.name,
          isLocked,
          fileCount,
        };
      })
    );

    return foldersWithCounts;
  });

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string() }))
  .handler(async ({ data }) => {
    const adminPassword = process.env["ADMIN_PASSWORD"];
    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD environment variable is not configured.");
    }
    if (data.password === adminPassword) {
      return { success: true };
    }
    throw new Error("Invalid password");
  });

export const getRecentFiles = createServerFn({ method: "GET" })
  .inputValidator(z.object({}))
  .handler(async () => {
    const drive = await getDriveClient();
    const rootId = await getRootFolderId(drive);
    const response = await (drive as any).files.list({
      q: `mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, createdTime, description, parents)",
      orderBy: "modifiedTime desc",
      pageSize: 100,
    });

    const files = response.data.files || [];

    const filesWithParentName = await Promise.all(
      files.map(async (f: any) => {
        let subjectName = "General";
        if (f.parents && f.parents.length > 0) {
          try {
            const parentResponse = await (drive as any).files.get({
              fileId: f.parents[0],
              fields: "name",
            });
            subjectName = parentResponse.data.name;
          } catch (e) {}
        }

        return {
          id: f.id!,
          name: f.name!,
          date: f.createdTime
            ? new Date(f.createdTime).toLocaleDateString()
            : "Unknown",
          uploader: f.description || "Anonymous",
          subjectName,
        };
      })
    );

    // Filter out files that aren't in a subject (meaning their parent is the root)
    const rootFolderResponse = await (drive as any).files.get({
      fileId: rootId,
      fields: "name",
    });
    const rootName = rootFolderResponse.data.name;

    return filesWithParentName.filter(f => f.subjectName !== rootName);
  });

export const deleteFile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ fileId: z.string() }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    await (drive as any).files.update({
      fileId: data.fileId,
      requestBody: { trashed: true },
    });
    return { success: true };
  });

export const getFiles = createServerFn({ method: "GET" })
  .inputValidator(z.object({ folderId: z.string() }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    const response = await (drive as any).files.list({
      q: `'${data.folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, size, createdTime, description, webViewLink)",
    });

    return (
      response.data.files?.map((f: any) => ({
        id: f.id!,
        name: f.name!,
        size: f.size
          ? `${(parseInt(f.size) / (1024 * 1024)).toFixed(2)} MB`
          : "0 MB",
        date: f.createdTime
          ? new Date(f.createdTime).toLocaleDateString()
          : "Unknown",
        uploader: f.description || "Anonymous",
        previewLink: f.webViewLink!,
      })) || []
    );
  });

export const createFolder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string(),
      parentId: z.string().optional(),
      isPrivate: z.boolean().optional(),
      password: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    let parentId = data.parentId;
    if (!parentId) {
      parentId = await getRootFolderId(drive);
    }

    const description = data.isPrivate
      ? JSON.stringify({ protected: true, password: data.password })
      : "";

    const folder = await (drive as any).files.create({
      requestBody: {
        name: data.name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
        description,
      },
      fields: "id",
    });

    await (drive as any).permissions.create({
      fileId: folder.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return { id: folder.data.id };
  });

export const uploadFile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      fileBase64: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      folderId: z.string(),
      uploaderName: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const drive = await getDriveClient();

    const buffer = Buffer.from(data.fileBase64, "base64");

    // Drive SDK requires a Readable stream — passing a raw Buffer
    // causes the multipart upload to hang silently without throwing.
    const readableStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      },
    });

    const response = await (drive as any).files.create({
      requestBody: {
        name: data.fileName,
        parents: [data.folderId],
        description: data.uploaderName || "Anonymous",
      },
      media: {
        mimeType: data.mimeType,
        body: readableStream,
      },
      fields: "id",
    });

    if (!response.data.id) {
      throw new Error("Drive returned no file ID — upload failed");
    }

    await (drive as any).permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return { id: response.data.id };
  });

export const getFolder = createServerFn({ method: "GET" })
  .inputValidator(z.object({ folderId: z.string() }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    const response = await (drive as any).files.get({
      fileId: data.folderId,
      fields: "id, name, description",
    });
    return response.data;
  });

export const deleteFolder = createServerFn({ method: "POST" })
  .inputValidator(z.object({ folderId: z.string() }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    await (drive as any).files.update({
      fileId: data.folderId,
      requestBody: { trashed: true },
    });
    return { success: true };
  });

export const searchFiles = createServerFn({ method: "GET" })
  .inputValidator(z.object({ query: z.string() }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    const safeQuery = data.query.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const response = await (drive as any).files.list({
      q: `name contains '${safeQuery}' and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, createdTime, description, parents)",
      pageSize: 20,
    });
    return response.data.files || [];
  });

export const getTotalFileCount = createServerFn({ method: "GET" })
  .inputValidator(z.object({}))
  .handler(async () => {
    const drive = await getDriveClient();
    const rootId = await getRootFolderId(drive);

    // 1. Lists all subject folders under root
    const subjectsResponse = await (drive as any).files.list({
      q: `'${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
    });
    const subjects = subjectsResponse.data.files || [];

    let totalSum = 0;

    for (const subject of subjects) {
      // 2. For each subject, lists all topic folders
      const topicsResponse = await (drive as any).files.list({
        q: `'${subject.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id)",
      });
      const topics = topicsResponse.data.files || [];

      for (const topic of topics) {
        // 3. For each topic, counts files
        const filesResponse = await (drive as any).files.list({
          q: `'${topic.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
          fields: "files(id)",
          pageSize: 1000,
        });
        totalSum += filesResponse.data.files?.length || 0;
      }
    }

    // 4. Returns the total sum
    return totalSum;
  });
