-- AlterTable
ALTER TABLE "QrCode" DROP COLUMN IF EXISTS "estimatedValuePerScan";
ALTER TABLE "QrCode" DROP COLUMN IF EXISTS "campaignCost";

-- DropTable
DROP TABLE IF EXISTS "Subscription";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "plan";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeCustomerId";

-- DropEnum
DROP TYPE IF EXISTS "Plan";
