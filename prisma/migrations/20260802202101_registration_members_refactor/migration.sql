/*
  Warnings:

  - You are about to drop the column `participantId` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the `participants` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[eventId,sportId,title]` on the table `competitions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId,sportId,createdAt]` on the table `registrations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_collegeId_fkey";

-- DropForeignKey
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_participantId_fkey";

-- DropIndex
DROP INDEX "registrations_participantId_eventId_sportId_key";

-- DropIndex
DROP INDEX "registrations_participantId_idx";

-- DropIndex
DROP INDEX "teams_eventId_idx";

-- AlterTable
ALTER TABLE "registrations" DROP COLUMN "participantId";

-- DropTable
DROP TABLE "participants";

-- CreateTable
CREATE TABLE "registration_members" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "fatherMotherName" TEXT NOT NULL,
    "rollNo" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "mobile" TEXT NOT NULL,
    "alternateMobile" TEXT,
    "email" TEXT NOT NULL,
    "aadhaarNumber" TEXT,
    "course" TEXT NOT NULL,
    "yearSemester" TEXT NOT NULL,
    "gender" "GenderCategory" NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registration_members_registrationId_idx" ON "registration_members"("registrationId");

-- CreateIndex
CREATE INDEX "registration_members_rollNo_idx" ON "registration_members"("rollNo");

-- CreateIndex
CREATE INDEX "announcements_publishedAt_idx" ON "announcements"("publishedAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "competitions_eventId_sportId_title_key" ON "competitions"("eventId", "sportId", "title");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "payments_registrationId_idx" ON "payments"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_eventId_sportId_createdAt_key" ON "registrations"("eventId", "sportId", "createdAt");

-- CreateIndex
CREATE INDEX "teams_eventId_collegeId_idx" ON "teams"("eventId", "collegeId");

-- AddForeignKey
ALTER TABLE "registration_members" ADD CONSTRAINT "registration_members_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
