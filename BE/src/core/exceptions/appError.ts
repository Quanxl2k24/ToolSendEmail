export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    // Nếu lỗi 4xx -> status là 'fail', lỗi 5xx -> status là 'error'
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Đánh dấu đây là lỗi do lập trình viên chủ động ném ra (Operational Error)
    this.isOperational = true;

    // Bỏ qua class này trong stack trace để log lỗi gọn gàng hơn
    Error.captureStackTrace(this, this.constructor);
  }
}
