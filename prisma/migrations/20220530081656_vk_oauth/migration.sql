/*
  Warnings:

  - You are about to drop the column `password_reset_code` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "password_reset_code";

-- CreateTable
CREATE TABLE "Vk" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "screen_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "userId" INTEGER,

    CONSTRAINT "Vk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vk_userId_key" ON "Vk"("userId");

-- AddForeignKey
ALTER TABLE "Vk" ADD CONSTRAINT "Vk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
