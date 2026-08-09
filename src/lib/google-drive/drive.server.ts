import { google } from "googleapis";

// ✅ FIX #2: Remove module-level cachedClient.
// Cached OAuth2 client reuses an expired access token after 1hr on warm
// Vercel instances. googleapis swallows the 401 internally on uploads
// instead of throwing — causing the same silent hang.
// getDriveClient() is cheap (no network call until first API hit), so
// recreating per-invocation is the correct move here.

export async function getDriveClient() {
  const clientId = process.env["GOOGLE_OAUTH_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];
  const refreshToken = process.env["GOOGLE_OAUTH_REFRESH_TOKEN"];

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN"
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // Force a fresh access token on every invocation.
  // This call hits Google's token endpoint (~100ms) but guarantees
  // the token is valid for the upload that follows.
  await oauth2Client.getAccessToken();

  return google.drive({ version: "v3", auth: oauth2Client as any });
}

export async function getRootFolderId(drive: any) {
  const response = await drive.files.list({
    q: "name = 'StudyHive' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: "files(id)",
    spaces: "drive",
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: "StudyHive",
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  await drive.permissions.create({
    fileId: folder.data.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  return folder.data.id;
}
