import { google } from "googleapis";
import { logger } from "./logger.js";
const STATUS_COLUMN = "Status";
function columnLetter(colIndex) {
    let letter = "";
    let n = colIndex;
    while (n >= 0) {
        letter = String.fromCharCode((n % 26) + 65) + letter;
        n = Math.floor(n / 26) - 1;
    }
    return letter;
}
export async function ensureStatusColumn(spreadsheetId, sheetName, accessToken) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const range = `'${sheetName}'!1:1`;
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });
    const headers = response.data.values?.[0] ?? [];
    const existingIndex = headers.findIndex((h) => h.trim().toLowerCase() === STATUS_COLUMN.toLowerCase());
    if (existingIndex >= 0)
        return existingIndex;
    const newColIndex = headers.length;
    const newColLetter = columnLetter(newColIndex);
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!${newColLetter}1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[STATUS_COLUMN]],
        },
    });
    logger.info("Created Status column in sheet", {
        spreadsheetId,
        sheetName,
        column: newColLetter,
    });
    return newColIndex;
}
export async function updateSheetCellStatus(spreadsheetId, sheetName, accessToken, rowIndex, status) {
    try {
        const colIndex = await ensureStatusColumn(spreadsheetId, sheetName, accessToken);
        const colLetter = columnLetter(colIndex);
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const sheets = google.sheets({ version: "v4", auth: oauth2Client });
        const sheetRow = rowIndex + 2;
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!${colLetter}${sheetRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[status]],
            },
        });
    }
    catch (err) {
        logger.error("Failed to update sheet cell status", {
            spreadsheetId,
            sheetName,
            rowIndex,
            status,
            err: String(err),
        });
    }
}
export async function batchUpdateSheetStatuses(spreadsheetId, sheetName, accessToken, updates) {
    if (updates.length === 0)
        return;
    try {
        const colIndex = await ensureStatusColumn(spreadsheetId, sheetName, accessToken);
        const colLetter = columnLetter(colIndex);
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const sheets = google.sheets({ version: "v4", auth: oauth2Client });
        const values = updates.map((u) => ({
            range: `'${sheetName}'!${colLetter}${u.rowIndex + 2}`,
            values: [[u.status]],
        }));
        const batch = [];
        for (let i = 0; i < values.length; i += 1000) {
            batch.push(values.slice(i, i + 1000));
        }
        for (const chunk of batch) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: {
                    valueInputOption: "USER_ENTERED",
                    data: chunk,
                },
            });
        }
        logger.info("Batch updated sheet statuses", {
            spreadsheetId,
            sheetName,
            count: updates.length,
        });
    }
    catch (err) {
        logger.error("Failed to batch update sheet statuses", {
            spreadsheetId,
            sheetName,
            count: updates.length,
            err: String(err),
        });
    }
}
//# sourceMappingURL=googleSheetsWriter.util.js.map