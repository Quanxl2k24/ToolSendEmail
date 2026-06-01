import { Mail, LogOut, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "../ui";
import type { User } from "../../types";

interface Props {
  user: User;
  page: "dashboard" | "wizard" | "detail";
  onSignOut: () => void;
  onGoToDashboard: () => void;
  onGoToWizard: () => void;
}

export function AppHeader({
  user,
  page,
  onSignOut,
  onGoToDashboard,
  onGoToWizard,
}: Props) {
  return (
    <header className="flex items-center justify-between px-10 py-4 border-b border-fog bg-white sticky top-0 z-10 max-md:px-5">
      <div className="flex items-center gap-3">
        <div className="bg-midnight-ink text-white p-1.5 rounded-lg">
          <Mail size={20} />
        </div>
        <span className="font-[652] text-base tracking-tight">
          Email Marketing Automation
        </span>
      </div>
      <div className="flex items-center gap-2">
        {page !== "dashboard" && (
          <Button variant="ghost" onClick={onGoToDashboard}>
            <LayoutDashboard size={14} /> Dashboard
          </Button>
        )}
        {page !== "wizard" && (
          <Button variant="primary" onClick={onGoToWizard}>
            <Plus size={14} /> Tạo chiến dịch
          </Button>
        )}
        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-fog">
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name}
              className="w-10 h-10 rounded-full border border-fog"
            />
          )}
          <div className="flex flex-col max-md:hidden">
            <span className="text-xs font-[600] text-midnight-ink">
              {user.name}
            </span>
            <span className="text-[10px] text-graphite font-[440] mt-0.5">
              {user.email}
            </span>
          </div>
          <Button variant="ghost" onClick={onSignOut} className="!p-1.5 !h-8">
            <LogOut size={14} />
          </Button>
        </div>
      </div>
    </header>
  );
}
