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

export const envConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'sems_pr_coordinator_secret_key_2026',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS || '',
  prAdminUsername: process.env.PR_ADMIN_USERNAME || 'pr_admin',
  passPrAdmin: process.env.PASS_PR_ADMIN || process.env.PR_ADMIN_PASSWORD || '',
  commonPassword: process.env.COMMON_PASSWORD || '',
  databaseUrl: process.env.DATABASE_URL || '',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  passAdmin: process.env.PASS_ADMIN || 'admin123',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  superCoordUsername: process.env.SUPER_COORD_USERNAME || 'super_coordinator',
  passSuperCoord: process.env.PASS_SUPER_COORD || 'super#2026',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'lnrkt6qp',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '996182763949582',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || 'qKiT0FnkGNvtjBveU3Tu_psg2QI',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'sems_gallery',
};

export const headPasswords = {
  head_mpec: process.env.PASS_HEAD_MPEC || '',
  head_mips: process.env.PASS_HEAD_MIPS || '',
  head_mpcps: process.env.PASS_HEAD_MPCPS || '',
  head_mpcp: process.env.PASS_HEAD_MPCP || '',
  head_mpdc: process.env.PASS_HEAD_MPDC || '',
  head_mpcnps: process.env.PASS_HEAD_MPCNPS || '',
  head_mpamc: process.env.PASS_HEAD_MPAMC || '',
  head_mpcams: process.env.PASS_HEAD_MPCAMS || '',
};

export const coordinatorPasswords = {
  coord_cricket: process.env.PASS_COORD_CRICKET || '',
  coord_table_tennis: process.env.PASS_COORD_TABLE_TENNIS || '',
  coord_badminton: process.env.PASS_COORD_BADMINTON || '',
  coord_chess: process.env.PASS_COORD_CHESS || '',
  coord_football: process.env.PASS_COORD_FOOTBALL || '',
  coord_basketball: process.env.PASS_COORD_BASKETBALL || '',
  coord_volleyball: process.env.PASS_COORD_VOLLEYBALL || '',
  coord_kabaddi: process.env.PASS_COORD_KABADDI || '',
  coord_kho_kho: process.env.PASS_COORD_KHO_KHO || '',
  coord_athletics: process.env.PASS_COORD_ATHLETICS || '',
  coord_tug_of_war: process.env.PASS_COORD_TUG_OF_WAR || '',
  coord_gully_cricket: process.env.PASS_COORD_GULLY_CRICKET || '',
};
