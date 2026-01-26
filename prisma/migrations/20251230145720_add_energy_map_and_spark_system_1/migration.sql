/*
  Warnings:

  - You are about to drop the column `map_type` on the `energy_maps` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "energy_maps" DROP COLUMN "map_type";

-- DropEnum
DROP TYPE "EnergyMapType";
