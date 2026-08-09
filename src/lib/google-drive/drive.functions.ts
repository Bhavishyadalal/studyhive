import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDriveClient, getRootFolderId } from "./drive.server";

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
      fields: 'files(id, name, description)',
    });

    const folders = response.data.files || [];

    const foldersWithCounts = await Promise.all(folders.map(async (f: any) => {
      let isLocked = false;
      try {
        if (f.description) {
          const desc = JSON.parse(f.description);
          isLocked = !!desc.protected;
        }
      } catch (e) {}

      const fileCountResponse = await (drive as any).files.list({
        q: `'${f.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
        pageSize: 1000,
      });

      return {
        id: f.id,
        name: f.name,
        isLocked,
        fileCount: fileCountResponse.data.files?.length || 0
      };
    }));

    return foldersWithCounts;
  });

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string() }))
  .handler(async ({ data }) => {
    const adminPassword = process.env['ADMIN_PASSWORD'] || "studyhive2026";
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
      fields: 'files(id, name, createdTime, description, parents)',
      orderBy: 'modifiedTime desc',
      pageSize: 6,
    });

    const files = response.data.files || [];

    const filesWithParentName = await Promise.all(files.map(async (f: any) => {
      let subjectName = "General";
      if (f.parents && f.parents.length > 0) {
        try {
          const parentResponse = await (drive as any).files.get({
            fileId: f.parents[0],
            fields: 'name',
          });
          subjectName = parentResponse.data.name;
        } catch (e) {}
      }

      return {
        id: f.id!,
        name: f.name!,
        date: f.createdTime ? new Date(f.createdTime).toLocaleDateString() : 'Unknown',
        uploader: f.description || 'Anonymous',
        subjectName,
      };
    }));

    return filesWithParentName;
  });

export const deleteFile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ fileId: z.string() }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    await (drive as any).files.update({
      fileId: data.fileId,
      requestBody: { trashed: true }
    });
    return { success: true };
  });

export const getFiles = createServerFn({ method: "GET" })
  .inputValidator(z.object({ folderId: z.string() }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    const response = await (drive as any).files.list({
      q: `'${data.folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, size, createdTime, description, webViewLink)',
    });

    return response.data.files?.map((f: any) => ({
      id: f.id!,
      name: f.name!,
      size: f.size ? `${(parseInt(f.size) / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
      date: f.createdTime ? new Date(f.createdTime).toLocaleDateString() : 'Unknown',
      uploader: f.description || 'Anonymous',
      previewLink: f.webViewLink!
    })) || [];
  });

export const createFolder = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string(),
    parentId: z.string().optional(),
    isPrivate: z.boolean().optional(),
    password: z.string().optional()
  }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();
    let parentId = data.parentId;
    if (!parentId) {
      parentId = await getRootFolderId(drive);
    }

    const description = data.isPrivate ? JSON.stringify({ protected: true, password: data.password }) : "";

    const fileMetadata = {
      name: data.name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
      description
    };

    const folder = await (drive as any).files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    await (drive as any).permissions.create({
      fileId: folder.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return { id: folder.data.id };
  });

export const uploadFile = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    fileBase64: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    folderId: z.string(),
    uploaderName: z.string().optional()
  }))
  .handler(async ({ data }) => {
    const drive = await getDriveClient();

    const buffer = Buffer.from(data.fileBase64, 'base64');

    const fileMetadata = {
      name: data.fileName,
      parents: [data.folderId],
      description: data.uploaderName || 'Anonymous'
    };

    const media = {
      mimeType: data.mimeType,
      body: buffer,
    };

    const response = await (drive as any).files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    await (drive as any).permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return { id: response.data.id };
  });
