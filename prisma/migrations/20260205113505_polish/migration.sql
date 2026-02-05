-- AlterTable
ALTER TABLE "crypto_payments" ALTER COLUMN "derivation_index" DROP DEFAULT,
ALTER COLUMN "derivation_path" DROP DEFAULT,
ALTER COLUMN "encrypted_private_key" DROP DEFAULT,
ALTER COLUMN "platform_wallet_address" DROP DEFAULT;
