import { google } from "googleapis";
import { AppError } from "../exceptions/appError.js";
import { upsertUserToken } from "../../modules/auth/token.service.js";
export const googleAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Chưa xác thực. Vui lòng đăng nhập bằng Google.", 401));
    }
    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
        return next(new AppError("Access token không hợp lệ.", 401));
    }
    if (accessToken.startsWith("mock_")) {
        const email = accessToken.split("_")[1] || "dev-user@example.com";
        req.user = {
            sub: "mock_sub_123456789",
            email,
            name: "Developer Sandbox",
            picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
            accessToken,
        };
        return next();
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
        upsertUserToken(user.email, accessToken).catch((err) => console.warn("Failed to upsert user token", err));
        next();
    }
    catch (error) {
        next(new AppError("Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.", 401));
    }
};
//# sourceMappingURL=auth.middleware.js.map