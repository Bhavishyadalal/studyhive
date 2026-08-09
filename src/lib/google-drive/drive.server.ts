import { google } from "googleapis";

// No module-level cache — cached OAuth2 client reuses expired access
// tokens on warm Vercel instances (tokens expire after 1hr), causing
// silent 401s on upload that never throw and leave the spinner frozen.
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

  // Force fresh access token before every Drive operation.
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
