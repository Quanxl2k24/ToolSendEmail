import { ArrowLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "../ui";

interface Props {
  step: number;
  hasData: boolean;
  onBack: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function WizardFooter({
  step,
  hasData,
  onBack,
  onNext,
  onReset,
}: Props) {
  return (
    <div className="px-10 py-5 flex justify-between items-center bg-white fixed bottom-0 left-0 right-0 z-10 max-md:px-5">
      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft size={16} /> Quay lại
          </Button>
        )}
        {step === 4 && (
          <Button variant="ghost" onClick={onReset}>
            <RefreshCw size={14} /> Quay lại Dashboard
          </Button>
        )}
      </div>
      <div>
        {step < 4 && (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={step === 1 && !hasData}
          >
            Tiếp tục <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
