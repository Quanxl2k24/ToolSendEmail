import type { Request, Response, NextFunction } from "express";
import { AppError } from "../exceptions/appError.js";

// 1. Trả về lỗi chi tiết cho môi trường Dev
const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

// 2. Trả về lỗi an toàn cho môi trường Prod
const sendErrorProd = (err: any, res: Response) => {
  // Nếu là lỗi mình đã dự trù (Operational) -> Gửi cho Client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Nếu là lỗi hệ thống (Third-party, DB sập, cú pháp...) -> Giấu đi
  else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau!",
    });
  }
};

// 3. Bắt lỗi Prisma phổ biến và chuyển sang AppError
const handlePrismaError = (err: any): AppError => {
  // Unique constraint violation (P2002)
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] ?? "field";
    return new AppError(`Giá trị của '${field}' đã tồn tại.`, 409);
  }
  // Record not found (P2025)
  if (err.code === "P2025") {
    return new AppError("Không tìm thấy bản ghi yêu cầu.", 404);
  }
  return new AppError("Lỗi cơ sở dữ liệu.", 500);
};

// 4. Main Global Error Handler Middleware
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Bắt các lỗi Prisma đặc thù
    if (err.constructor?.name === "PrismaClientKnownRequestError") {
      error = handlePrismaError(err);
    }

    sendErrorProd(error, res);
  }
};
