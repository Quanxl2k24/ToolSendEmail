import { UploadCloud, Check, AlertCircle, Loader, Mail } from "lucide-react";
import {
  Card,
  CardTitle,
  InputField,
  InputGroup,
  Button,
  TableContainer,
  Table,
  Th,
  Tr,
  Td,
} from "../ui";

interface Props {
  fileUploaded: boolean;
  fileName: string;
  googleSheetLink: string;
  recipientCount: number;
  loading?: boolean;
  error?: string | null;
  emailColumn: string;
  sheetPreview?: {
    headers: string[];
    rows: Record<string, string>[];
    total: number;
  } | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGoogleSheetLinkChange: (val: string) => void;
  onConnectGoogleSheet: () => void;
  onEmailColumnChange: (val: string) => void;
}

export function FileUploadZone({
  fileUploaded,
  fileName,
  googleSheetLink,
  recipientCount,
  loading,
  error,
  emailColumn,
  sheetPreview,
  onFileUpload,
  onGoogleSheetLinkChange,
  onConnectGoogleSheet,
  onEmailColumnChange,
}: Props) {
  return (
    <Card>
      <CardTitle>
        <UploadCloud size={20} /> Tải Danh Sách Nhận Tin (.xlsx, .csv)
      </CardTitle>
      <input
        type="file"
        id="file-upload-input"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={onFileUpload}
      />
      <div
        className="border-2 border-dashed border-silver rounded-3xl py-10 px-5 text-center cursor-pointer transition-all duration-200 bg-white hover:border-midnight-ink hover:bg-mist"
        onClick={() => document.getElementById("file-upload-input")?.click()}
      >
        <div className="text-graphite mb-4 inline-flex items-center justify-center">
          <UploadCloud size={48} />
        </div>
        <p className="text-sm text-midnight-ink font-medium mb-1">
          {loading ? (
            "Đang xử lý file..."
          ) : fileUploaded ? (
            <span className="truncate inline-block max-w-full align-middle">{`Đã nạp file: ${fileName}`}</span>
          ) : (
            "Kéo thả file dữ liệu vào đây hoặc Click để chọn"
          )}
        </p>
        <p className="text-xs text-graphite">
          Hỗ trợ tệp tin Excel (.xlsx) hoặc tệp CSV lên đến 10MB
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-4 p-3 border border-midnight-ink bg-mist rounded-xl text-midnight-ink text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center my-6 text-silver text-xs font-semibold uppercase tracking-widest before:flex-1 before:h-px before:bg-fog before:mr-4 after:flex-1 after:h-px after:bg-fog after:ml-4">
        Hoặc kết nối Google Sheet
      </div>
      <InputGroup>
        <InputField
          value={googleSheetLink}
          onChange={(e) => onGoogleSheetLinkChange(e.target.value)}
          placeholder="Dán đường dẫn Google Sheet tại đây..."
        />
        <Button
          variant="primary"
          onClick={onConnectGoogleSheet}
          disabled={loading}
        >
          {loading ? <Loader size={16} className="animate-spin" /> : null}
          {loading ? "Đang tải..." : "Kết nối"}
        </Button>
      </InputGroup>

      {loading && !sheetPreview && (
        <div className="flex items-center gap-2 mt-5 text-graphite text-sm">
          <Loader size={16} className="animate-spin" />
          <span>Đang tải dữ liệu...</span>
        </div>
      )}

      {sheetPreview && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-2 text-midnight-ink text-sm font-semibold">
            <Check size={18} />
            <span>Đã tải {sheetPreview.total} liên hệ.</span>
          </div>

          <div className="flex items-center gap-3">
            <Mail size={16} className="text-graphite shrink-0" />
            <label className="text-xs font-semibold text-graphite shrink-0">
              Cột email:
            </label>
            <select
              value={emailColumn}
              onChange={(e) => onEmailColumnChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-fog rounded-xl text-sm text-midnight-ink bg-white outline-none focus:border-midnight-ink cursor-pointer"
            >
              {sheetPreview.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-graphite">
            Các cột dữ liệu sẽ có sẵn dưới dạng biến {"{{tên_cột}}"} khi soạn
            template ở bước 2.
          </p>

          {sheetPreview.rows.length > 0 && (
            <div className="max-h-[260px] overflow-auto border border-fog rounded-xl">
              <TableContainer>
                <Table>
                  <thead>
                    <Tr>
                      {sheetPreview.headers.map((h) => (
                        <Th
                          key={h}
                          className={h === emailColumn ? "bg-mist" : ""}
                        >
                          {h}
                          {h === emailColumn ? " 📧" : ""}
                        </Th>
                      ))}
                    </Tr>
                  </thead>
                  <tbody>
                    {sheetPreview.rows.map((row, i) => (
                      <Tr key={i}>
                        {sheetPreview.headers.map((h) => (
                          <Td
                            key={h}
                            className={
                              h === emailColumn ? "bg-mist font-medium" : ""
                            }
                          >
                            {row[h]}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            </div>
          )}
        </div>
      )}

      {fileUploaded && !sheetPreview && recipientCount > 0 && (
        <div className="flex items-center gap-2 mt-5 text-midnight-ink text-sm font-semibold">
          <Check size={18} />
          <span>
            Dữ liệu đã được nạp thành công ({recipientCount} liên hệ).
          </span>
        </div>
      )}
    </Card>
  );
}
