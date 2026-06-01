import { google } from "googleapis";
import { parseCsv } from "./excel.util.js";
/**
 * Extracts the spreadsheet ID and optional gid from a Google Sheets URL.
 */
export const parseGoogleSheetUrl = (url) => {
    const spreadsheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    return {
        spreadsheetId: spreadsheetIdMatch ? spreadsheetIdMatch[1] : null,
        gid: gidMatch ? gidMatch[1] : null,
    };
};
/**
 * Parses a Google Sheet using the user's OAuth2 access token.
 * Requires the user to have already authenticated via Google OAuth2.
 *
 * @param url - Full Google Sheets URL
 * @param accessToken - User's Google OAuth2 access token (from req.user.accessToken)
 */
export const parseGoogleSheet = async (url, accessToken) => {
    const { spreadsheetId, gid } = parseGoogleSheetUrl(url);
    if (!spreadsheetId) {
        throw new Error("URL Google Sheets không hợp lệ.");
    }
    // Method 1: Use the user's OAuth2 access token (preferred for private sheets)
    try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const sheets = google.sheets({ version: "v4", auth: oauth2Client });
        let range = "A1:ZZ10000";
        if (gid) {
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
            const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.sheetId?.toString() === gid);
            if (sheet?.properties?.title) {
                range = `'${sheet.properties.title}'!A1:ZZ10000`;
            }
        }
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        const rows = response.data.values;
        if (!rows || rows.length === 0)
            return [];
        const headers = rows[0];
        if (!headers)
            return [];
        return rows.slice(1).map((row) => {
            const item = {};
            headers.forEach((header, index) => {
                item[header] = row[index] !== undefined ? row[index] : "";
            });
            return item;
        });
    }
    catch (apiError) {
        console.warn("Google Sheets API (OAuth2) failed, falling back to public export URL", apiError);
    }
    // Method 2: Fallback - public CSV export (works for public sheets without auth)
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gid ? `&gid=${gid}` : ""}`;
    const fetchResponse = await fetch(exportUrl);
    if (!fetchResponse.ok) {
        throw new Error(`Không thể tải Google Sheet. Hãy đảm bảo sheet có quyền "Anyone with the link can view". Status: ${fetchResponse.status}`);
    }
    const csvText = await fetchResponse.text();
    const buffer = Buffer.from(csvText);
    return parseCsv(buffer);
};
//# sourceMappingURL=googleSheets.util.js.map