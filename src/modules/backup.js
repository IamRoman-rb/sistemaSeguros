import { createReadStream } from "node:fs";
import { readdir, readFile, writeFile } from "fs/promises";
import { resolve } from "node:path";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";

const CREDENTIALS_PATH = resolve(process.cwd(), "src/modules", "credentials.json");
const TOKEN_PATH = resolve(process.cwd(), "src/modules", "token.json");

const loadCredentials = async function () {
    try {
        const content = await readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

async function saveCredentials(client) {
    const content = await readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await writeFile(TOKEN_PATH, payload);
}

const uploadToDrive = async () => {
    const uploadFiles = async (auth = null) => {
        const DATA_PATH = resolve(process.cwd(), "src/data");
        const results = await readdir(DATA_PATH);
        const responses = await Promise.all(results.map(async (file) => {
            const FILE_PATH = resolve(DATA_PATH, file);
            const drive = google.drive({ version: 'v3', auth });
            const fileMetadata = {
                name: file,
                parents: ["1c0pzSnwklGqVgmuGiCCPZKYObuiBOMq8"], // Reemplaza con el ID de tu carpeta de Google Drive
            };

            const media = {
                mimeType: "application/json",
                body: createReadStream(FILE_PATH),
            };

            const response = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: "id",
            });

            console.log(`Archivo subido: ${file} - ID: ${response.data.id}`);
        }));
    }

    const authorize = async (cb) => {
        let client = await loadCredentials();
        if (client) {
            return cb(client);
        }
        client = await authenticate({
            scopes: ["https://www.googleapis.com/auth/drive.file"],
            keyfilePath: CREDENTIALS_PATH,
        });
        if (client.credentials) {
            await saveCredentials(client);
        }
        return cb(client);
    }

    return await authorize(uploadFiles);
}
export default uploadToDrive