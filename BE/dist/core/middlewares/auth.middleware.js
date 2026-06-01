import { google } from "googleapis";
import { AppError } from "../exceptions/appError.js";
export const googleAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Chưa xác thực. Vui lòng đăng nhập bằng Google.", 401));
    }
    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
        return next(new AppError("Access token không hợp lệ.", 401));
    }
    try {
        // Verify token via Google's OAuth2 API
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();
        if (!data.id || !data.email) {
            return next(new AppError("Không thể lấy thông tin người dùng từ Google.", 401));
        }
        const user = {
            sub: data.id,
            email: data.email,
            name: data.name ?? data.email,
            accessToken,
        };
        if (data.picture)
            user.picture = data.picture;
        req.user = user;
        next();
    }
    catch (error) {
        next(new AppError("Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.", 401));
    }
};
//# sourceMappingURL=auth.middleware.js.map