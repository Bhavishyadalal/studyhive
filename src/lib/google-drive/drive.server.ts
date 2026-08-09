import { google } from 'googleapis';

export async function getDriveClient(credentialsJson: string) {
  const credentials = JSON.parse(credentialsJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
  });
  const client = await auth.getClient();
  return google.drive({ version: 'v3', auth: client as any });
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
  
  // Create if not exists
  const folderMetadata = {
    name: 'StudyHive',
    mimeType: 'application/vnd.google-apps.folder',
  };
  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });
  
  // Make root folder public
  await drive.permissions.create({
    fileId: folder.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return folder.data.id;
}
