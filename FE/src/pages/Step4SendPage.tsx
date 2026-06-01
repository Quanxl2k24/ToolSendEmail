import { CommandCenter } from '../components/campaign/CommandCenter';
import type { LogEntry } from '../types';

interface Props {
  totalCount: number;
  successCount: number;
  failedCount: number;
  progress: number;
  isSending: boolean;
  logs: LogEntry[];
  error: string | null;
  campaignId: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onViewDetail: (id: string) => void;
}

export function Step4SendPage(props: Props) {
  return <CommandCenter {...props} />;
}
