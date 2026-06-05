/**
 * Extracts the spreadsheet ID and optional gid from a Google Sheets URL.
 */
export declare const parseGoogleSheetUrl: (url: string) => {
    spreadsheetId: string | null | undefined;
    gid: string | null | undefined;
};
export interface SheetParseResult {
    rows: any[];
    sheetName: string;
    sheetId: number;
}
/**
 * Parses a Google Sheet using the user's OAuth2 access token.
 * Requires the user to have already authenticated via Google OAuth2.
 *
 * @param url - Full Google Sheets URL
 * @param accessToken - User's Google OAuth2 access token (from req.user.accessToken)
 */
export declare const parseGoogleSheet: (url: string, accessToken: string) => Promise<SheetParseResult>;
//# sourceMappingURL=googleSheets.util.d.ts.map