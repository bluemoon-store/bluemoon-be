# Crypto Payment Environment Variables

## Required Configuration

Copy these to your `.env` file and update with your actual values:

```bash
# ============================================
# CRYPTO PAYMENT SYSTEM CONFIGURATION
# ============================================

# ---------------------------------------------
# Payment Settings
# ---------------------------------------------

# How long payment address is valid (minutes)
PAYMENT_EXPIRATION_MINUTES=15

# Grace period to check for late payments after expiration (minutes)
PAYMENT_EXPIRATION_GRACE_PERIOD_MINUTES=30

# Payment monitoring interval (seconds)
PAYMENT_MONITOR_INTERVAL_SECONDS=60

# Enable automatic forwarding to platform wallet (true/false)
ENABLE_PAYMENT_FORWARDING=true

# Enable automatic delivery for digital products (true/false)
ENABLE_AUTO_DELIVERY=true

# Partial payment tolerance (percentage)
# Payments within this % of expected amount are accepted
# Example: 1.0 means 99% - 101% of expected amount is acceptable
PARTIAL_PAYMENT_TOLERANCE_PERCENT=1.0

# Maximum forwarding retry attempts before admin alert
MAX_FORWARDING_RETRIES=5

# ---------------------------------------------
# Blockchain RPC Endpoints
# ---------------------------------------------

# Bitcoin RPC (optional - uses Tatum by default)
BITCOIN_RPC_URL=

# Ethereum RPC (required for ethers.js)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Litecoin RPC (optional - uses Tatum by default)
LITECOIN_RPC_URL=

# Bitcoin Cash RPC (optional - uses Tatum by default)
BITCOIN_CASH_RPC_URL=

# Tron RPC (optional - uses Tatum by default)
TRON_RPC_URL=

# ---------------------------------------------
# Tatum API Configuration
# ---------------------------------------------

# Tatum API Key (required)
TATUM_API_KEY=your_tatum_api_key_here

# Tatum Base URL
TATUM_BASE_URL=https://api.tatum.io/v3

# Use testnet for development (true/false)
TATUM_TESTNET=false

# ---------------------------------------------
# Kraken API (for exchange rates)
# ---------------------------------------------

KRAKEN_API_KEY=your_kraken_api_key
KRAKEN_API_SECRET=your_kraken_api_secret
KRAKEN_BASE_URL=https://api.kraken.com/0/public

# ---------------------------------------------
# HD Wallet Mnemonics (HIGHLY SENSITIVE!)
# ---------------------------------------------
# ⚠️ NEVER commit these to git!
# ⚠️ Use secrets manager in production!

# Bitcoin wallet mnemonic (12 or 24 words)
SYSTEM_MNEMONIC_BTC=your twelve word mnemonic phrase for bitcoin wallet here

# Ethereum wallet mnemonic (12 or 24 words)
SYSTEM_MNEMONIC_ETH=your twelve word mnemonic phrase for ethereum wallet here

# Litecoin wallet mnemonic (12 or 24 words)
SYSTEM_MNEMONIC_LTC=your twelve word mnemonic phrase for litecoin wallet here

# Bitcoin Cash wallet mnemonic (12 or 24 words)
SYSTEM_MNEMONIC_BCH=your twelve word mnemonic phrase for bitcoin cash wallet here

# Tron wallet mnemonic (12 or 24 words)
SYSTEM_MNEMONIC_TRX=your twelve word mnemonic phrase for tron wallet here

# ---------------------------------------------
# Platform Wallet Addresses
# ---------------------------------------------
# These are the final destination addresses where funds are forwarded

PLATFORM_WALLET_BTC=bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PLATFORM_WALLET_ETH=0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PLATFORM_WALLET_LTC=LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX
PLATFORM_WALLET_BCH=bitcoincash:qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PLATFORM_WALLET_TRX=TxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX

# ---------------------------------------------
# Wallet Encryption
# ---------------------------------------------

# 32-character encryption key for private keys (HIGHLY SENSITIVE!)
# Generate with: openssl rand -hex 32
WALLET_ENCRYPTION_KEY=your_64_character_hex_encryption_key_here

# ---------------------------------------------
# Confirmation Requirements
# ---------------------------------------------

# Minimum confirmations before accepting payment
MIN_CONFIRMATIONS_BTC=3
MIN_CONFIRMATIONS_ETH=12
MIN_CONFIRMATIONS_LTC=6
MIN_CONFIRMATIONS_BCH=6
MIN_CONFIRMATIONS_USDT_ERC20=12
MIN_CONFIRMATIONS_USDT_TRC20=19
MIN_CONFIRMATIONS_USDC_ERC20=12

# ---------------------------------------------
# Gas Settings (Ethereum)
# ---------------------------------------------

# Maximum gas price in Gwei (prevents excessive fees)
MAX_GAS_PRICE=100

# Gas limit for transactions
GAS_LIMIT=21000

# ---------------------------------------------
# Exchange Rate Cache
# ---------------------------------------------

# How long to cache exchange rates (seconds)
EXCHANGE_RATE_CACHE_TTL=300

# ---------------------------------------------
# Network Configuration
# ---------------------------------------------

# Bitcoin network (mainnet/testnet)
BITCOIN_NETWORK=mainnet

# Ethereum network (mainnet/sepolia)
ETHEREUM_NETWORK=mainnet

# Litecoin network (mainnet/testnet)
LITECOIN_NETWORK=mainnet

# Tron network (mainnet/shasta)
TRON_NETWORK=mainnet
```

---

## Security Best Practices

### 🔐 Mnemonics and Private Keys
1. **Never** commit mnemonics to version control
2. Use secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) in production
3. Rotate keys regularly
4. Use different mnemonics for each cryptocurrency
5. Back up mnemonics securely offline

### 🏦 Platform Wallets
1. Use hardware wallets or cold storage for platform addresses
2. Monitor platform wallet balances regularly
3. Set up alerts for large incoming transfers
4. Consider multi-signature wallets for additional security

### 🔑 Encryption Keys
1. Generate strong random encryption keys
2. Never reuse encryption keys across environments
3. Store separately from mnemonics
4. Rotate periodically

---

## Environment-Specific Settings

### Development
```bash
TATUM_TESTNET=true
BITCOIN_NETWORK=testnet
ETHEREUM_NETWORK=sepolia
PAYMENT_EXPIRATION_MINUTES=60  # Longer for testing
ENABLE_PAYMENT_FORWARDING=false  # Disable forwarding in dev
```

### Staging
```bash
TATUM_TESTNET=true
ENABLE_PAYMENT_FORWARDING=true
MAX_FORWARDING_RETRIES=3  # Lower for faster feedback
```

### Production
```bash
TATUM_TESTNET=false
ENABLE_PAYMENT_FORWARDING=true
PAYMENT_EXPIRATION_MINUTES=15
ENABLE_AUTO_DELIVERY=true
```

---

## Quick Start

1. **Copy template**:
   ```bash
   cp documents/CRYPTO_ENV_TEMPLATE.md .env.crypto
   ```

2. **Generate encryption key**:
   ```bash
   openssl rand -hex 32
   ```

3. **Generate test mnemonics** (for development):
   ```bash
   npm install -g bip39
   bip39 generate
   ```

4. **Update values** in `.env.crypto`

5. **Append to main `.env`**:
   ```bash
   cat .env.crypto >> .env
   ```

6. **Verify configuration**:
   ```bash
   npm run start:dev
   # Check logs for "Crypto payment system initialized"
   ```

---

## Troubleshooting

### "Mnemonic not configured" error
- Ensure `SYSTEM_MNEMONIC_*` variables are set
- Verify mnemonic has 12 or 24 words
- Check for extra spaces or newlines

### "Platform wallet address not configured" error
- Set `PLATFORM_WALLET_*` for each cryptocurrency you support
- Verify address format is correct for each blockchain

### "Failed to encrypt private key" error
- Verify `WALLET_ENCRYPTION_KEY` is exactly 64 hexadecimal characters
- Regenerate if corrupted: `openssl rand -hex 32`

### Ethereum RPC errors
- Update `ETHEREUM_RPC_URL` with valid Infura/Alchemy endpoint
- Check API key is active and has sufficient quota

---

## Migration from Old Config

If upgrading from a previous version:

1. **New required variables**:
   - `PAYMENT_EXPIRATION_GRACE_PERIOD_MINUTES`
   - `PARTIAL_PAYMENT_TOLERANCE_PERCENT`
   - `MAX_FORWARDING_RETRIES`

2. **Default values** (if not set):
   - Grace period: 30 minutes
   - Tolerance: 1.0%
   - Max retries: 5

3. **No database migration** required (uses existing JSON metadata field)

---

## Health Check

After configuration, verify:
- [ ] Application starts without errors
- [ ] Test payment creation works
- [ ] Exchange rates load successfully
- [ ] Blockchain providers initialize correctly
- [ ] Admin can view payment metadata

```bash
# Test exchange rates endpoint
curl http://localhost:3000/v1/crypto/exchange-rates

# Test supported currencies
curl http://localhost:3000/v1/crypto/supported-currencies
```
