import { Search, LogOut } from "lucide-react";
import type { User } from "../../types";

interface Props {
  title: string;
  user: User;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSignOut: () => void;
}

export function TopBar({
  title,
  user,
  searchValue,
  onSearchChange,
  onSignOut,
}: Props) {
  return (
    <header className="flex items-center justify-between h-16 px-8 py-10 bg-white shrink-0">
      <h1 className="text-[20px] font-[600] tracking-[0.014em] text-midnight-ink">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {typeof searchValue !== "undefined" && (
          <div className="relative w-[240px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-ash pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-4 py-2 bg-mist border border-transparent rounded-full text-xs outline-none transition-all duration-200 focus:bg-white focus:border-midnight-ink text-midnight-ink placeholder-ash"
            />
          </div>
        )}

        <div className="flex items-center gap-3 pl-4 border-l border-fog">
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name}
              className="w-9 h-9 rounded-full border border-fog shrink-0"
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
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-full text-graphite hover:text-midnight-ink hover:bg-mist cursor-pointer transition-all duration-200 bg-transparent border-none outline-none"
            title="Đăng xuất"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
