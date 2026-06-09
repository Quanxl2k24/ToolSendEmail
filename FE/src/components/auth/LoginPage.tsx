import { Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../ui";

interface Props {
  loading: boolean;
  error: string | null;
  onSignIn: () => void;
}

export function LoginPage({ loading, error, onSignIn }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-[440px] p-10 rounded-3xl border border-fog bg-white text-center">
        <div className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-midnight-ink text-white mb-6">
          <Mail size={32} />
        </div>
        <h1 className="text-[28px] font-[652] tracking-tight text-midnight-ink mb-1">
          EMAIL AUTOMATION
        </h1>
        <p className="text-sm text-graphite mb-10 leading-relaxed">
          Tối ưu hóa tiếp thị và quản lý danh sách nội bộ với độ trễ tối thiểu.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl border border-midnight-ink bg-mist text-midnight-ink text-sm text-left">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Button
            variant="primary"
            onClick={onSignIn}
            disabled={loading}
            className="!w-full"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginRight: "8px" }}
              >
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 018 12.527a5.99 5.99 0 015.99-5.99c2.457 0 4.542 1.34 5.624 3.32l3.418-2.61C20.61 3.513 17.514 1.5 13.99 1.5 8.196 1.5 3.5 6.196 3.5 12s4.696 10.5 10.49 10.5c5.787 0 10.13-4.01 10.13-9.89 0-.61-.06-1.2-.18-1.78l-11.7 1.455z" />
              </svg>
            )}
            {loading ? "Đang đăng nhập..." : "Đăng nhập với Google Accounts"}
          </Button>

          <button
            type="button"
            onClick={() => {
              const mockUser = {
                email: "sandbox-dev@example.com",
                name: "Developer Sandbox",
                picture:
                  "https://lh3.googleusercontent.com/a/default-user=s96-c",
                accessToken: "mock_sandbox-dev@example.com",
              };
              localStorage.setItem("google_user", JSON.stringify(mockUser));
              localStorage.setItem(
                "google_jwt",
                "mock_sandbox-dev@example.com",
              );
              window.location.reload();
            }}
            className="text-xs text-graphite hover:text-midnight-ink underline decoration-1 underline-offset-4 cursor-pointer transition-colors mt-2"
          >
            Sử dụng tài khoản giả lập nhà phát triển (Bypass Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
