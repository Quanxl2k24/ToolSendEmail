interface SheetCellUpdate {
    rowIndex: number;
    status: string;
}
export declare function ensureStatusColumn(spreadsheetId: string, sheetName: string, accessToken: string): Promise<number>;
export declare function updateSheetCellStatus(spreadsheetId: string, sheetName: string, accessToken: string, rowIndex: number, status: string): Promise<void>;
export declare function batchUpdateSheetStatuses(spreadsheetId: string, sheetName: string, accessToken: string, updates: SheetCellUpdate[]): Promise<void>;
export {};
//# sourceMappingURL=googleSheetsWriter.util.d.ts.map