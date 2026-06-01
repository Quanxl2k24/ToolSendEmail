export const QUOTA = {
  DAILY_LIMIT: 800,
  RATE_LIMIT: 14,
};

export const VARIABLES = {
  NAME: 'Họ Tên',
  PHONE: 'SĐT',
  COMPANY: 'Tên Công Ty',
  SENDER: 'Sender',
};

export const AUTH = {
  STORAGE_KEY: 'google_user',
  SCOPE: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/spreadsheets',
  ].join(' '),
};

export const GOOGLE_SHEET_PREFIX = 'https://docs.google.com';
