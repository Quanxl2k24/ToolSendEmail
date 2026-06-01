import { Search, Edit2, Check, AlertCircle } from 'lucide-react';
import { TableContainer, Table, Th, Tr, Td, SearchInput, InlineInput } from '../ui';
import type { Recipient } from '../../types';

interface Props {
  recipients: Recipient[];
  editingCell: { id: number; field: 'name' | 'email' | 'phone' } | null;
  tempValue: string;
  onlyErrors: boolean;
  searchQuery: string;
  onToggleErrors: () => void;
  onSearchChange: (val: string) => void;
  onStartEditing: (id: number, field: 'name' | 'email' | 'phone', val: string) => void;
  onTempValueChange: (val: string) => void;
  onSaveCell: (id: number, field: 'name' | 'email' | 'phone') => void;
}

export function RecipientTable({
  recipients, editingCell, tempValue, onlyErrors, searchQuery,
  onToggleErrors, onSearchChange, onStartEditing, onTempValueChange, onSaveCell,
}: Props) {
  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold">
          <input type="checkbox" checked={onlyErrors} onChange={onToggleErrors} className="w-4 h-4 cursor-pointer" />
          Chỉ hiển thị dòng lỗi (Errors only)
        </label>
        <div className="relative w-full max-w-[300px]">
          <Search size={16} color="#707070" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <SearchInput value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Tìm kiếm liên hệ..." />
        </div>
      </div>
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th className="!w-[60px]">STT</Th>
              <Th>Họ Tên (Nhấp đúp để sửa)</Th>
              <Th>Email người nhận</Th>
              <Th>Số điện thoại</Th>
              <Th className="!w-[220px]">Trạng thái</Th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((row) => (
              <Tr key={row.id} status={row.status}>
                <Td>{row.id}</Td>
                <EditableCell row={row} field="name" value={row.name} editingCell={editingCell} tempValue={tempValue} onStartEditing={onStartEditing} onTempChange={onTempValueChange} onSave={onSaveCell} />
                <EditableCell row={row} field="email" value={row.email || '(Trống)'} editingCell={editingCell} tempValue={tempValue} onStartEditing={onStartEditing} onTempChange={onTempValueChange} onSave={onSaveCell} />
                <EditableCell row={row} field="phone" value={row.phone} editingCell={editingCell} tempValue={tempValue} onStartEditing={onStartEditing} onTempChange={onTempValueChange} onSave={onSaveCell} />
                <Td>
                  {row.status === 'valid' ? (
                    <div className="inline-flex items-center gap-1.5 text-midnight-ink font-semibold">
                      <Check size={14} /> Hợp lệ
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-midnight-ink font-semibold">
                      <AlertCircle size={14} /> {row.errorMessage}
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
            {recipients.length === 0 && (
              <tr>
                <Td colSpan={5} className="!text-center !py-6 !text-graphite">Không tìm thấy dữ liệu liên hệ nào khớp với bộ lọc.</Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableContainer>
    </>
  );
}

interface CellProps {
  row: Recipient;
  field: 'name' | 'email' | 'phone';
  value: string;
  editingCell: { id: number; field: string } | null;
  tempValue: string;
  onStartEditing: (id: number, field: 'name' | 'email' | 'phone', val: string) => void;
  onTempChange: (val: string) => void;
  onSave: (id: number, field: 'name' | 'email' | 'phone') => void;
}

function EditableCell({ row, field, value, editingCell, tempValue, onStartEditing, onTempChange, onSave }: CellProps) {
  const isEditing = editingCell?.id === row.id && editingCell?.field === field;
  return (
    <Td onDoubleClick={() => onStartEditing(row.id, field, row[field])}>
      {isEditing ? (
        <InlineInput value={tempValue} onChange={(e) => onTempChange(e.target.value)} onBlur={() => onSave(row.id, field)} onKeyDown={(e) => e.key === 'Enter' && onSave(row.id, field)} autoFocus />
      ) : (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          <Edit2 size={12} className="opacity-30" />
        </div>
      )}
    </Td>
  );
}
