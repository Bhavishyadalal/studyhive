import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDriveClient, getRootFolderId } from "./drive.server";
import { Readable } from "stream";

// ... keep all other exports unchanged above this ...

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

    // ✅ FIX #1: Drive SDK needs a Readable stream, not a raw Buffer.
    // Passing Buffer causes the multipart upload to hang silently on Vercel.
    const readableStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null); // signal EOF
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
        body: readableStream, // ← was: buffer
      },
      fields: "id",
    });

    if (!response.data.id) {
      throw new Error("Drive returned no file ID — upload failed silently");
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
