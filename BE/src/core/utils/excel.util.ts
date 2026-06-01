import { Readable } from "stream";
import csvParser from "csv-parser";
import * as xlsx from "xlsx";

export interface ParsedContact {
  email: string;
  [key: string]: any;
}

/**
 * Parses a CSV buffer into a JSON array using csv-parser.
 */
export const parseCsv = (buffer: Buffer): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(buffer);
    stream
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

/**
 * Parses an Excel (XLSX/XLS) buffer into a JSON array using xlsx.
 */
export const parseExcel = (buffer: Buffer): any[] => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];
  return xlsx.utils.sheet_to_json(worksheet);
};

/**
 * Parses either a file buffer or a remote URL (CSV/Excel) into a JSON array.
 * Delegates to parseCsv or parseExcel based on file extension or content-type.
 */
export const parseFileBuffer = async (options: {
  buffer?: Buffer;
  fileName?: string;
  url?: string;
}): Promise<any[]> => {
  const { buffer, fileName, url } = options;

  if (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${url}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const lowercaseUrl = url.toLowerCase();
    if (
      lowercaseUrl.endsWith(".csv") ||
      response.headers.get("content-type")?.includes("csv")
    ) {
      return parseCsv(fileBuffer);
    } else {
      return parseExcel(fileBuffer);
    }
  }

  if (buffer) {
    const lowercaseName = fileName?.toLowerCase() ?? "";
    if (lowercaseName.endsWith(".csv")) {
      return parseCsv(buffer);
    } else {
      return parseExcel(buffer);
    }
  }

  throw new Error("Either a file buffer or a URL must be provided");
};
