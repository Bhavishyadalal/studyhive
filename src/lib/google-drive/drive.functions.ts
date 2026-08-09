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

    const foldersWithCounts: any[] = [];
    for (const f of folders) {
      let isLocked = false;
      try {
        if (f.description) {
          const desc = JSON.parse(f.description);
          isLocked = !!desc.protected;
        }
      } catch (e) {}

      let fileCount = 0;
      try {
        const subfoldersResponse = await (drive as any).files.list({
          q: `'${f.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: "files(id)",
        });
        const subfolders = subfoldersResponse.data.files || [];

        for (const sf of subfolders) {
          const res = await (drive as any).files.list({
            q: `'${sf.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
            fields: "files(id)",
            pageSize: 1000,
          });
          fileCount += res.data.files?.length || 0;
        }
      } catch (e) {
        console.error("Error counting files for subject:", f.id, e);
      }

      foldersWithCounts.push({
        id: f.id,
        name: f.name,
        isLocked,
        fileCount,
      });
    }

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
    const response = await (drive as any).files.list({
      q: `mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, createdTime, description, parents)",
      orderBy: "modifiedTime desc",
      pageSize: 20,
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

    return filesWithParentName;
  });

export const deleteFile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ fileId: z.string(), password: z.string() }))
  .handler(async ({ data }) => {
    const adminPassword = process.env["ADMIN_PASSWORD"];
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized");
    }
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
  .inputValidator(z.object({ folderId: z.string(), password: z.string() }))
  .handler(async ({ data }) => {
    const adminPassword = process.env["ADMIN_PASSWORD"];
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized");
    }
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

    return filesWithParentName;
  });

export const getTotalFileCount = createServerFn({ method: "GET" })
  .inputValidator(z.object({}))
  .handler(async () => {
    const drive = await getDriveClient();
    const rootId = await getRootFolderId(drive);

    const subjectsResponse = await (drive as any).files.list({
      q: `'${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
    });
    const subjects = subjectsResponse.data.files || [];

    let totalFiles = 0;
    for (const subject of subjects) {
      const topicsResponse = await (drive as any).files.list({
        q: `'${subject.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id)",
      });
      const topics = topicsResponse.data.files || [];

      for (const topic of topics) {
        const filesResponse = await (drive as any).files.list({
          q: `'${topic.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
          fields: "files(id)",
          pageSize: 1000,
        });
        totalFiles += filesResponse.data.files?.length || 0;
      }
    }

    return totalFiles;
  });
