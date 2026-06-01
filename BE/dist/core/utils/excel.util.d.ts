export interface ParsedContact {
    email: string;
    [key: string]: any;
}
/**
 * Parses a CSV buffer into a JSON array using csv-parser.
 */
export declare const parseCsv: (buffer: Buffer) => Promise<any[]>;
/**
 * Parses an Excel (XLSX/XLS) buffer into a JSON array using xlsx.
 */
export declare const parseExcel: (buffer: Buffer) => any[];
/**
 * Parses either a file buffer or a remote URL (CSV/Excel) into a JSON array.
 * Delegates to parseCsv or parseExcel based on file extension or content-type.
 */
export declare const parseFileBuffer: (options: {
    buffer?: Buffer;
    fileName?: string;
    url?: string;
}) => Promise<any[]>;
//# sourceMappingURL=excel.util.d.ts.map