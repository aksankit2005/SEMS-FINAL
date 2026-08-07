import dotenv from 'dotenv';

// Load .env directly without dotenvx
const result = dotenv.config({ path: '.env', override: true });

console.log('PASS_HEAD_MPEC from process.env:', process.env.PASS_HEAD_MPEC);
console.log('COMMON_PASSWORD from process.env:', process.env.COMMON_PASSWORD);
console.log('PASS_PR_ADMIN from process.env:', process.env.PASS_PR_ADMIN);
