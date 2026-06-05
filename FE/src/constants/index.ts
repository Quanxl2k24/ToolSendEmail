export const QUOTA = {
  DAILY_LIMIT: Number(import.meta.env.VITE_DAILY_LIMIT ?? 400),
  RATE_LIMIT: Number(import.meta.env.VITE_RATE_LIMIT ?? 1),
};

export const VARIABLES = {
  NAME: "Họ Tên",
  PHONE: "SĐT",
  COMPANY: "Tên Công Ty",
  SENDER: "Sender",
};

export const AUTH = {
  STORAGE_KEY: "google_user",
  SCOPE: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/spreadsheets",
  ].join(" "),
};

export const GOOGLE_SHEET_PREFIX = "https://docs.google.com";
