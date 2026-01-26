/*
  Warnings:

  - The `core_pattern` column on the `energy_maps` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `pattern_explanation` column on the `energy_maps` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `timing_insights` column on the `energy_maps` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `evolution_path` column on the `energy_maps` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "energy_maps" DROP COLUMN "core_pattern",
ADD COLUMN     "core_pattern" TEXT[],
DROP COLUMN "pattern_explanation",
ADD COLUMN     "pattern_explanation" TEXT[],
DROP COLUMN "timing_insights",
ADD COLUMN     "timing_insights" TEXT[],
DROP COLUMN "evolution_path",
ADD COLUMN     "evolution_path" TEXT[];
