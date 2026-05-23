export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  role: 'Admin' | 'Doctor' | 'Patient';
  userId: string;
};

export type OtpResponse = {
  message: string;
  expiresAt: string;
};
