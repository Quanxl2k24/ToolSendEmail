import { cn } from '../../lib/cn';

interface Props {
  total: number;
  valid: number;
  error: number;
}

const statClasses: Record<string, string> = {
  total: 'bg-mist',
  valid: 'bg-white border-fog',
  error: 'bg-mist border-fog',
};

export function RecipientStats({ total, valid, error }: Props) {
  const items = [
    { label: 'Tổng số liên hệ', value: total, type: 'total' },
    { label: 'Hợp Lệ (Sẵn Sàng Gửi)', value: valid, type: 'valid' },
    { label: 'Bị Lỗi Cần Sửa', value: error, type: 'error' },
  ];
  return (
    <div className="grid grid-cols-3 gap-4 mb-6 max-sm:grid-cols-1">
      {items.map(item => (
        <div key={item.type} className={cn('border border-fog rounded-xl p-4 text-center', statClasses[item.type])}>
          <div className="text-[28px] font-[652] mb-1">{item.value}</div>
          <div className="text-xs font-semibold uppercase text-graphite">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
