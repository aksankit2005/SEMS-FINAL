/*
  Warnings:

  - You are about to drop the column `eventId` on the `announcements` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `announcements` table. All the data in the column will be lost.
  - You are about to drop the column `coordinatorId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `competitions` table. All the data in the column will be lost.
  - The `status` column on the `competitions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `gender` column on the `competitions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `matchType` column on the `competitions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `events` table. All the data in the column will be lost.
  - The `id` column on the `events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `remarks` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `team1Score` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `team2Score` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `winnerTeamId` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `gatewayOrderId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `gatewayPaymentId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payments` table. All the data in the column will be lost.
  - The `method` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `generatedAt` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `receiptNumber` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `alternateMobile` on the `registration_members` table. All the data in the column will be lost.
  - You are about to drop the column `fatherMotherName` on the `registration_members` table. All the data in the column will be lost.
  - You are about to drop the column `yearSemester` on the `registration_members` table. All the data in the column will be lost.
  - The `gender` column on the `registration_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `joinedAt` on the `team_members` table. All the data in the column will be lost.
  - You are about to drop the `college_rankings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coordinator_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coordinators` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `individual_rankings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `match_participants` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tournamentId,sportId,title]` on the table `competitions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[receipt_number]` on the table `receipts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `sports` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationId]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tournamentId` to the `competitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cover_image` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_date` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_name` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receipt_number` to the `receipts` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `registrationType` on the `registrations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `slug` to the `sports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPER_COORDINATOR', 'COLLEGE_HEAD', 'SPORTS_COORDINATOR', 'PR_COORDINATOR');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "CommitteeMemberType" AS ENUM ('EXECUTIVE', 'ADVISOR');

-- AlterEnum
ALTER TYPE "RegistrationStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_eventId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_coordinatorId_fkey";

-- DropForeignKey
ALTER TABLE "college_rankings" DROP CONSTRAINT "college_rankings_collegeId_fkey";

-- DropForeignKey
ALTER TABLE "college_rankings" DROP CONSTRAINT "college_rankings_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "competitions" DROP CONSTRAINT "competitions_eventId_fkey";

-- DropForeignKey
ALTER TABLE "coordinator_assignments" DROP CONSTRAINT "coordinator_assignments_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "coordinator_assignments" DROP CONSTRAINT "coordinator_assignments_coordinatorId_fkey";

-- DropForeignKey
ALTER TABLE "coordinators" DROP CONSTRAINT "coordinators_collegeId_fkey";

-- DropForeignKey
ALTER TABLE "gallery" DROP CONSTRAINT "gallery_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "gallery" DROP CONSTRAINT "gallery_eventId_fkey";

-- DropForeignKey
ALTER TABLE "individual_rankings" DROP CONSTRAINT "individual_rankings_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "individual_rankings" DROP CONSTRAINT "individual_rankings_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "match_participants" DROP CONSTRAINT "match_participants_matchId_fkey";

-- DropForeignKey
ALTER TABLE "match_participants" DROP CONSTRAINT "match_participants_teamId_fkey";

-- DropForeignKey
ALTER TABLE "match_scores" DROP CONSTRAINT "match_scores_matchId_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_venueId_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_winnerTeamId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_eventId_fkey";

-- DropForeignKey
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_sportId_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_teamId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_captainRegistrationId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_collegeId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_eventId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_sportId_fkey";

-- DropIndex
DROP INDEX "announcements_eventId_idx";

-- DropIndex
DROP INDEX "announcements_publishedAt_idx";

-- DropIndex
DROP INDEX "audit_logs_coordinatorId_idx";

-- DropIndex
DROP INDEX "audit_logs_createdAt_idx";

-- DropIndex
DROP INDEX "audit_logs_entity_idx";

-- DropIndex
DROP INDEX "competitions_eventId_idx";

-- DropIndex
DROP INDEX "competitions_eventId_sportId_title_key";

-- DropIndex
DROP INDEX "competitions_sportId_idx";

-- DropIndex
DROP INDEX "events_name_year_key";

-- DropIndex
DROP INDEX "match_scores_matchId_key";

-- DropIndex
DROP INDEX "matches_competitionId_idx";

-- DropIndex
DROP INDEX "matches_status_idx";

-- DropIndex
DROP INDEX "matches_venueId_idx";

-- DropIndex
DROP INDEX "payments_registrationId_idx";

-- DropIndex
DROP INDEX "payments_status_idx";

-- DropIndex
DROP INDEX "payments_transactionId_idx";

-- DropIndex
DROP INDEX "receipts_receiptNumber_key";

-- DropIndex
DROP INDEX "registration_members_rollNo_idx";

-- DropIndex
DROP INDEX "registrations_eventId_idx";

-- DropIndex
DROP INDEX "registrations_eventId_sportId_createdAt_key";

-- DropIndex
DROP INDEX "registrations_sportId_idx";

-- DropIndex
DROP INDEX "team_members_registrationId_key";

-- DropIndex
DROP INDEX "teams_captainRegistrationId_key";

-- DropIndex
DROP INDEX "teams_collegeId_idx";

-- DropIndex
DROP INDEX "teams_eventId_collegeId_idx";

-- DropIndex
DROP INDEX "teams_eventId_sportId_collegeId_name_key";

-- DropIndex
DROP INDEX "teams_sportId_idx";

-- AlterTable
ALTER TABLE "announcements" DROP COLUMN "eventId",
DROP COLUMN "publishedAt",
ADD COLUMN     "audience" TEXT DEFAULT 'PUBLIC',
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "publishDate" TIMESTAMP(3),
ADD COLUMN     "sportSlug" TEXT;

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "coordinatorId",
DROP COLUMN "createdAt",
DROP COLUMN "entityId",
DROP COLUMN "metadata",
ADD COLUMN     "actor_name" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "userId" UUID,
ALTER COLUMN "entity" DROP NOT NULL;

-- AlterTable
ALTER TABLE "colleges" ADD COLUMN     "address" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "competitions" DROP COLUMN "eventId",
ADD COLUMN     "tournamentId" UUID NOT NULL,
ALTER COLUMN "registrationFee" SET DEFAULT 0,
ALTER COLUMN "registrationStart" DROP NOT NULL,
ALTER COLUMN "registrationEnd" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT',
DROP COLUMN "gender",
ADD COLUMN     "gender" TEXT,
DROP COLUMN "matchType",
ADD COLUMN     "matchType" TEXT;

-- AlterTable
ALTER TABLE "events" DROP CONSTRAINT "events_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "endDate",
DROP COLUMN "name",
DROP COLUMN "startDate",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
DROP COLUMN "year",
ADD COLUMN     "cover_image" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT DEFAULT '',
ADD COLUMN     "event_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "event_name" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "match_scores" DROP COLUMN "remarks",
DROP COLUMN "team1Score",
DROP COLUMN "team2Score",
ADD COLUMN     "awayScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "homeScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "period" INTEGER;

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "winnerTeamId",
ADD COLUMN     "awayTeamName" TEXT,
ADD COLUMN     "homeTeamName" TEXT,
ADD COLUMN     "matchNumber" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "scoreSummary" TEXT,
ADD COLUMN     "winnerName" TEXT,
ALTER COLUMN "venueId" DROP NOT NULL,
ALTER COLUMN "scheduledAt" DROP NOT NULL,
ALTER COLUMN "round" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "createdAt",
DROP COLUMN "gatewayOrderId",
DROP COLUMN "gatewayPaymentId",
DROP COLUMN "paidAt",
DROP COLUMN "transactionId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gateway_payment_id" TEXT,
ADD COLUMN     "order_id" TEXT,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_id" TEXT,
ADD COLUMN     "transaction_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "method",
ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "receipts" DROP COLUMN "generatedAt",
DROP COLUMN "receiptNumber",
DROP COLUMN "receiptUrl",
ADD COLUMN     "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "receipt_number" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "registration_members" DROP COLUMN "alternateMobile",
DROP COLUMN "fatherMotherName",
DROP COLUMN "yearSemester",
ADD COLUMN     "alternate_mobile" TEXT,
ADD COLUMN     "branch" TEXT,
ADD COLUMN     "enrollmentNo" TEXT,
ADD COLUMN     "father_mother_name" TEXT,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "year_semester" TEXT,
ALTER COLUMN "rollNo" DROP NOT NULL,
ALTER COLUMN "mobile" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "course" DROP NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" TEXT;

-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "collegeId" UUID,
ADD COLUMN     "competitionId" UUID,
ADD COLUMN     "submittedData" JSONB,
ADD COLUMN     "teamName" TEXT,
ADD COLUMN     "tournamentId" UUID,
ALTER COLUMN "eventId" DROP NOT NULL,
ALTER COLUMN "sportId" DROP NOT NULL,
ALTER COLUMN "sportId" SET DATA TYPE TEXT,
DROP COLUMN "registrationType",
ADD COLUMN     "registrationType" TEXT NOT NULL,
ALTER COLUMN "amount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "sports" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "team_members" DROP COLUMN "joinedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "enrollmentNo" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "isCaptain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "registrationMemberId" UUID,
ADD COLUMN     "rollNo" TEXT,
ALTER COLUMN "registrationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "captainName" TEXT,
ADD COLUMN     "registrationId" UUID,
ALTER COLUMN "eventId" DROP NOT NULL,
ALTER COLUMN "sportId" DROP NOT NULL,
ALTER COLUMN "sportId" SET DATA TYPE TEXT,
ALTER COLUMN "collegeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "college_rankings";

-- DropTable
DROP TABLE "coordinator_assignments";

-- DropTable
DROP TABLE "coordinators";

-- DropTable
DROP TABLE "gallery";

-- DropTable
DROP TABLE "individual_rankings";

-- DropTable
DROP TABLE "match_participants";

-- DropEnum
DROP TYPE "CompetitionStatus";

-- DropEnum
DROP TYPE "CoordinatorRole";

-- DropEnum
DROP TYPE "EventStatus";

-- DropEnum
DROP TYPE "GenderCategory";

-- DropEnum
DROP TYPE "MatchType";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "RankingType";

-- DropEnum
DROP TYPE "RegistrationType";

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_events" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "officials" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "sportSlug" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "officials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "collegeCode" TEXT,
    "sportSlug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_coordinators" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "assigned_sport" TEXT NOT NULL,
    "sport_name" TEXT NOT NULL,
    "coordinator_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_coordinators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_head_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "college_id" UUID,
    "faculty_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "college_head_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pr_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'pr_coordinator',
    "name" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pr_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "collegeId" UUID,
    "fullName" TEXT NOT NULL,
    "rollNo" TEXT,
    "enrollmentNo" TEXT,
    "email" TEXT,
    "mobile" TEXT,
    "gender" TEXT,
    "course" TEXT,
    "branch" TEXT,
    "yearSemester" TEXT,
    "section" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_registrations" (
    "id" TEXT NOT NULL,
    "registrationId" UUID,
    "event_id" TEXT NOT NULL,
    "sport_id" TEXT NOT NULL,
    "student_name" TEXT NOT NULL,
    "team_name" TEXT,
    "college" TEXT NOT NULL,
    "department" TEXT,
    "enrollment_no" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "gender" TEXT NOT NULL,
    "emergency_contact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fee_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_id" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "members_count" INTEGER NOT NULL DEFAULT 1,
    "participant_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "college_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_registration_rules" (
    "id" UUID NOT NULL,
    "sportId" UUID NOT NULL,
    "registrationType" TEXT NOT NULL,
    "gender" TEXT,
    "minMembers" INTEGER NOT NULL DEFAULT 1,
    "maxMembers" INTEGER NOT NULL DEFAULT 1,
    "eligibility" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_registration_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_results" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "winnerName" TEXT,
    "runnerUpName" TEXT,
    "winnerScore" TEXT,
    "runnerUpScore" TEXT,
    "notes" TEXT,
    "declaredBy" TEXT,
    "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_matches" (
    "id" TEXT NOT NULL,
    "sport_id" TEXT,
    "format" TEXT,
    "status" TEXT,
    "team1" TEXT,
    "team2" TEXT,
    "match_title" TEXT,
    "table_number" TEXT,
    "time" TEXT,
    "score1" INTEGER NOT NULL DEFAULT 0,
    "score2" INTEGER NOT NULL DEFAULT 0,
    "winner" TEXT,
    "youtube_video_id" TEXT,
    "stream_url" TEXT,
    "is_live_streaming" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,
    "sets_history" TEXT,
    "current_set" INTEGER NOT NULL DEFAULT 1,
    "sets_won1" INTEGER NOT NULL DEFAULT 0,
    "sets_won2" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" SERIAL NOT NULL,
    "sport_id" TEXT,
    "match_format" TEXT,
    "gender" TEXT,
    "sub_event" TEXT,
    "winner_name" TEXT,
    "winner_team" TEXT,
    "winner_college" TEXT,
    "runner_up_name" TEXT,
    "runner_up_team" TEXT,
    "runner_up_college" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,
    "declared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_attachments" (
    "id" UUID NOT NULL,
    "announcementId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "media_type" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_sessions" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committee_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_members" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "type" "CommitteeMemberType" NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "photo_url" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "coordinator_event_items" (
    "id" TEXT NOT NULL,
    "sport_id" TEXT NOT NULL,
    "sport_name" TEXT,
    "title" TEXT NOT NULL,
    "cover_image" TEXT,
    "description" TEXT,
    "reg_start_date" TEXT,
    "reg_end_date" TEXT,
    "tourn_start_date" TEXT,
    "tourn_end_date" TEXT,
    "entry_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "singles_fee" DECIMAL(10,2),
    "doubles_fee" DECIMAL(10,2),
    "team_size" TEXT,
    "max_registrations" INTEGER NOT NULL DEFAULT 64,
    "registered_count" INTEGER NOT NULL DEFAULT 0,
    "venue" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "rules" JSONB,
    "required_documents" JSONB,
    "contact_info" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinator_event_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_name_year_key" ON "tournaments"("name", "year");

-- CreateIndex
CREATE INDEX "tournament_events_status_idx" ON "tournament_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_events_name_year_key" ON "tournament_events"("name", "year");

-- CreateIndex
CREATE INDEX "officials_sportSlug_idx" ON "officials"("sportSlug");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "users_collegeCode_idx" ON "users"("collegeCode");

-- CreateIndex
CREATE INDEX "users_sportSlug_idx" ON "users"("sportSlug");

-- CreateIndex
CREATE UNIQUE INDEX "sport_coordinators_username_key" ON "sport_coordinators"("username");

-- CreateIndex
CREATE INDEX "sport_coordinators_assigned_sport_status_idx" ON "sport_coordinators"("assigned_sport", "status");

-- CreateIndex
CREATE UNIQUE INDEX "college_head_users_username_key" ON "college_head_users"("username");

-- CreateIndex
CREATE INDEX "college_head_users_college_status_idx" ON "college_head_users"("college", "status");

-- CreateIndex
CREATE INDEX "college_head_users_college_id_idx" ON "college_head_users"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "pr_users_username_key" ON "pr_users"("username");

-- CreateIndex
CREATE INDEX "students_collegeId_enrollmentNo_idx" ON "students"("collegeId", "enrollmentNo");

-- CreateIndex
CREATE INDEX "students_rollNo_idx" ON "students"("rollNo");

-- CreateIndex
CREATE INDEX "college_registrations_college_sport_id_idx" ON "college_registrations"("college", "sport_id");

-- CreateIndex
CREATE INDEX "college_registrations_status_payment_status_idx" ON "college_registrations"("status", "payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "sports_registration_rules_sportId_registrationType_gender_key" ON "sports_registration_rules"("sportId", "registrationType", "gender");

-- CreateIndex
CREATE UNIQUE INDEX "match_results_matchId_key" ON "match_results"("matchId");

-- CreateIndex
CREATE INDEX "live_matches_sport_id_status_idx" ON "live_matches"("sport_id", "status");

-- CreateIndex
CREATE INDEX "live_matches_updated_at_idx" ON "live_matches"("updated_at");

-- CreateIndex
CREATE INDEX "leaderboard_entries_sport_id_declared_at_idx" ON "leaderboard_entries"("sport_id", "declared_at");

-- CreateIndex
CREATE INDEX "announcement_attachments_announcementId_idx" ON "announcement_attachments"("announcementId");

-- CreateIndex
CREATE INDEX "media_event_id_uploaded_at_idx" ON "media"("event_id", "uploaded_at");

-- CreateIndex
CREATE UNIQUE INDEX "committee_sessions_label_key" ON "committee_sessions"("label");

-- CreateIndex
CREATE INDEX "committee_members_sessionId_type_sort_order_idx" ON "committee_members"("sessionId", "type", "sort_order");

-- CreateIndex
CREATE INDEX "coordinator_event_items_sport_id_status_idx" ON "coordinator_event_items"("sport_id", "status");

-- CreateIndex
CREATE INDEX "coordinator_event_items_created_at_idx" ON "coordinator_event_items"("created_at");

-- CreateIndex
CREATE INDEX "announcements_isPublished_publishDate_idx" ON "announcements"("isPublished", "publishDate");

-- CreateIndex
CREATE INDEX "audit_logs_userId_created_at_idx" ON "audit_logs"("userId", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "competitions_sportId_status_idx" ON "competitions"("sportId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "competitions_tournamentId_sportId_title_key" ON "competitions"("tournamentId", "sportId", "title");

-- CreateIndex
CREATE INDEX "events_event_date_idx" ON "events"("event_date");

-- CreateIndex
CREATE INDEX "match_scores_matchId_idx" ON "match_scores"("matchId");

-- CreateIndex
CREATE INDEX "matches_competitionId_status_idx" ON "matches"("competitionId", "status");

-- CreateIndex
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "registration_members_enrollmentNo_idx" ON "registration_members"("enrollmentNo");

-- CreateIndex
CREATE INDEX "registrations_sportId_status_idx" ON "registrations"("sportId", "status");

-- CreateIndex
CREATE INDEX "registrations_collegeId_createdAt_idx" ON "registrations"("collegeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sports_slug_key" ON "sports"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "teams_registrationId_key" ON "teams"("registrationId");

-- CreateIndex
CREATE INDEX "teams_collegeId_sportId_idx" ON "teams"("collegeId", "sportId");

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_head_users" ADD CONSTRAINT "college_head_users_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_registrations" ADD CONSTRAINT "college_registrations_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sports_registration_rules" ADD CONSTRAINT "sports_registration_rules_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_attachments" ADD CONSTRAINT "announcement_attachments_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "committee_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
