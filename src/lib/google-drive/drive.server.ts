import { google } from 'googleapis';

let cachedClient: ReturnType<typeof google.drive> | null = null;

export async function getDriveClient() {
  if (cachedClient) return cachedClient;

  const clientId = process.env['GOOGLE_OAUTH_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_OAUTH_CLIENT_SECRET'];
  const refreshToken = process.env['GOOGLE_OAUTH_REFRESH_TOKEN'];

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN'
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  cachedClient = google.drive({ version: 'v3', auth: oauth2Client as any });
  return cachedClient;
}

export async function getRootFolderId(drive: any) {
  const response = await drive.files.list({
    q: "name = 'StudyHive' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  const folderMetadata = {
    name: 'StudyHive',
    mimeType: 'application/vnd.google-apps.folder',
  };
  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  await drive.permissions.create({
    fileId: folder.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return folder.data.id;
}
