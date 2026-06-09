import {
  Mail,
  LayoutDashboard,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/cn";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  activePage: "dashboard" | "wizard" | "detail";
  onGoToDashboard: () => void;
  onGoToWizard: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  activePage,
  onGoToDashboard,
  onGoToWizard,
}: Props) {
  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-white border-r border-fog z-20 transition-all duration-300 overflow-hidden whitespace-nowrap",
        collapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      <div
        className={cn(
          "flex items-center h-16 py-6 border-b border-fog shrink-0",
          collapsed ? "justify-center px-0" : "px-5 gap-3",
        )}
      >
        <div className="bg-midnight-ink text-white p-1.5 rounded-lg shrink-0">
          <Mail size={18} />
        </div>
        {!collapsed && (
          <span className="font-[652] text-sm tracking-tight text-midnight-ink truncate">
            Email Automation
          </span>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        <button
          onClick={onGoToDashboard}
          className={cn(
            "flex items-center gap-3 rounded-full text-sm font-[440] cursor-pointer transition-all duration-200 outline-none border-none",
            collapsed
              ? "justify-center w-10 h-10 mx-auto"
              : "px-4 py-2.5 w-full",
            activePage === "dashboard"
              ? "bg-midnight-ink text-white"
              : "bg-transparent text-midnight-ink hover:bg-mist",
          )}
          title="Danh sách các chiến dịch"
        >
          <LayoutDashboard size={18} className="shrink-0" />
          {!collapsed && <span>Chiến dịch</span>}
        </button>

        <button
          onClick={onGoToWizard}
          className={cn(
            "flex items-center gap-3 rounded-full text-sm font-[440] cursor-pointer transition-all duration-200 outline-none border-none",
            collapsed
              ? "justify-center w-10 h-10 mx-auto"
              : "px-4 py-2.5 w-full",
            activePage === "wizard"
              ? "bg-midnight-ink text-white"
              : "bg-transparent text-midnight-ink hover:bg-mist",
          )}
          title="Chiến dịch mới"
        >
          <Plus size={18} className="shrink-0" />
          {!collapsed && <span>Chiến dịch mới</span>}
        </button>
      </nav>

      <div
        className={cn(
          "border-t border-fog py-3",
          collapsed ? "px-0 flex justify-center" : "px-3",
        )}
      >
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center gap-2 rounded-full text-xs font-[440] text-graphite hover:text-midnight-ink hover:bg-mist cursor-pointer transition-all duration-200 outline-none border-none",
            collapsed ? "w-10 h-10" : "px-4 py-2.5 w-full",
          )}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} /> Thu gọn
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
