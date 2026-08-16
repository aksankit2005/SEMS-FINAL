-- AlterTable
ALTER TABLE "college_registrations" DROP COLUMN IF EXISTS "enrollment_no";

-- AlterTable
ALTER TABLE "registration_members" DROP COLUMN IF EXISTS "alternate_mobile",
DROP COLUMN IF EXISTS "branch",
DROP COLUMN IF EXISTS "enrollmentNo",
DROP COLUMN IF EXISTS "section";

-- AlterTable
ALTER TABLE "students" DROP COLUMN IF EXISTS "branch",
DROP COLUMN IF EXISTS "enrollmentNo",
DROP COLUMN IF EXISTS "section";
