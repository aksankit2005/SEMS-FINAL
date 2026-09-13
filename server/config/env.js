import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

// Strict validation in production mode
if (isProduction) {
  const missingVars = [];
  if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');
  if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');

  if (missingVars.length > 0) {
    console.error(`🔴 [FATAL SECURITY ERROR] Missing required environment variables in production: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}

if (!process.env.JWT_SECRET && !isProduction) {
  console.warn('⚠️ [SECURITY WARNING] JWT_SECRET is not set in environment. Please set JWT_SECRET in your .env file.');
}

export const envConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'sems_development_jwt_secret_key_unsecure',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS || '',
  prAdminUsername: process.env.PR_ADMIN_USERNAME || 'pr_admin',
  passPrAdmin: process.env.PASS_PR_ADMIN || process.env.PR_ADMIN_PASSWORD || '',
  commonPassword: process.env.COMMON_PASSWORD || '',
  databaseUrl: process.env.DATABASE_URL || '',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  passAdmin: process.env.PASS_ADMIN || '',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  superCoordUsername: process.env.SUPER_COORD_USERNAME || 'super_coordinator',
  passSuperCoord: process.env.PASS_SUPER_COORD || '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'sems_gallery',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'MPGI Sports <noreply@mpgisports.in>',
  appUrl: process.env.APP_URL || process.env.VITE_APP_URL || 'https://mpgisports.in',
};

export const headPasswords = {
  head_mpec: process.env.PASS_HEAD_MPEC || 'mpec#2026',
  head_mips: process.env.PASS_HEAD_MIPS || 'mips#2026',
  head_mpcps: process.env.PASS_HEAD_MPCPS || 'mpcps#2026',
  head_mpcp: process.env.PASS_HEAD_MPCP || 'mpcp#2026',
  head_mpdc: process.env.PASS_HEAD_MPDC || 'mpdc#2026',
  head_mpcnps: process.env.PASS_HEAD_MPCNPS || 'mpcnps#2026',
  head_mpamc: process.env.PASS_HEAD_MPAMC || 'mpamc#2026',
  head_mpcams: process.env.PASS_HEAD_MPCAMS || 'mpcams#2026',
  head_mpcps_bpharm: process.env.PASS_HEAD_MPCPS_BPHARM || 'mpcps#2026',
};

export const coordinatorPasswords = {
  coord_cricket: process.env.PASS_COORD_CRICKET || 'cricket#2026',
  coord_table_tennis: process.env.PASS_COORD_TABLE_TENNIS || 'table_tennis#2026',
  coord_badminton: process.env.PASS_COORD_BADMINTON || 'badminton#2026',
  coord_chess: process.env.PASS_COORD_CHESS || 'chess#2026',
  coord_football: process.env.PASS_COORD_FOOTBALL || 'football#2026',
  coord_basketball: process.env.PASS_COORD_BASKETBALL || 'basketball#2026',
  coord_volleyball: process.env.PASS_COORD_VOLLEYBALL || 'volleyball#2026',
  coord_kabaddi: process.env.PASS_COORD_KABADDI || 'kabaddi#2026',
  coord_kho_kho: process.env.PASS_COORD_KHO_KHO || 'kho_kho#2026',
  coord_athletics: process.env.PASS_COORD_ATHLETICS || 'athletics#2026',
  coord_tug_of_war: process.env.PASS_COORD_TUG_OF_WAR || 'tug_of_war#2026',
  coord_gully_cricket: process.env.PASS_COORD_GULLY_CRICKET || 'gully_cricket#2026',
};
