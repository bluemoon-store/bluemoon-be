# Phase 6: Quick Reference Guide

> **One-page reference** for crypto payment implementation

---

## 🎯 Goal

Integrate **non-custodial, zero-fee, no-KYC** crypto payment system supporting BTC, ETH, LTC, BCH, USDT.

---

## 🏗️ Architecture Summary

```
Order Created → Generate Address (HD Wallet) → User Pays → Monitor Blockchain (60s)
→ Detect Payment → Wait Confirmations → Update Order → Auto-Deliver
```

**Key Components:**
1. **System Wallet Service** - Generate unique addresses (BIP44)
2. **Exchange Rate Service** - Convert USD ↔ Crypto
3. **Blockchain Monitor** - Check payments via RPC
4. **Payment Processor** - Bull worker (runs every 60s)
5. **Payment Forwarding** - Transfer to platform wallet (optional)

---

## 📊 Database Models

### CryptoPayment
```prisma
- id, orderId
- cryptocurrency (BTC/ETH/LTC/BCH/USDT)
- paymentAddress (generated)
- derivationIndex, derivationPath
- encryptedPrivateKey
- amount (crypto), amountUsd
- status (PENDING/PAID/CONFIRMING/CONFIRMED/FORWARDED/EXPIRED/FAILED)
- txHash, confirmations, requiredConfirmations
- expiresAt (15 min), paidAt, confirmedAt
```

### SystemWalletIndex
```prisma
- cryptocurrency
- nextIndex (auto-increment)
```

### CryptoExchangeRate
```prisma
- cryptocurrency, fiatCurrency
- rate, provider
- expiresAt (cache)
```

---

## 🔑 Key Services

### 1. SystemWalletService
```typescript
generatePaymentAddress(orderId, crypto, amount)
  → { address, derivationIndex, expiresAt }

getNextIndex(crypto)
  → atomic increment

decryptPrivateKey(encryptedKey)
  → privateKey (for forwarding)
```

### 2. ExchangeRateService
```typescript
getRate(crypto, fiat)
  → rate (cached 5 min)

convertToCrypto(fiatAmount, crypto)
  → cryptoAmount
```

### 3. CryptoPaymentService
```typescript
createPayment(orderId, crypto)
  → { paymentId, address, amount, qrCode, expiresAt }

getPaymentStatus(paymentId)
  → { status, confirmations, timeRemaining }
```

### 4. BlockchainMonitorService
```typescript
checkPayment(paymentId)
  → detect payment, update status

checkConfirmations(paymentId)
  → count confirmations, confirm if >= required

expirePayment(paymentId)
  → mark expired after 15 min
```

---

## 🔄 Payment Status Flow

```
PENDING (address generated, waiting for payment)
   ↓ (payment detected)
PAID (payment received, but not confirmed)
   ↓ (waiting for confirmations)
CONFIRMING (confirmations: 1/3, 2/3, ...)
   ↓ (confirmations >= required)
CONFIRMED (order updated to PAYMENT_RECEIVED)
   ↓ (optional: forwarding enabled)
FORWARDING (transferring to platform wallet)
   ↓
FORWARDED (complete)

// Alternative paths:
PENDING → EXPIRED (15 minutes passed, no payment)
PENDING/PAID → FAILED (error occurred)
```

---

## 📝 Implementation Checklist

### Phase 1: Foundation (Days 1-2)
- [ ] Create database models + migrations
- [ ] Setup module structure
- [ ] Install dependencies: `@scure/bip39`, `@scure/bip32`, `bitcoinjs-lib`, `ethers`, `qrcode`
- [ ] Implement HD wallet derivation (BIP44)
- [ ] Implement private key encryption (AES-256-GCM)

### Phase 2: Exchange Rates (Day 3)
- [ ] Integrate CoinGecko API
- [ ] Add CoinBase fallback
- [ ] Implement Redis caching (5 min TTL)
- [ ] Add conversion methods

### Phase 3: Payment Creation (Days 4-5)
- [ ] Implement `createPayment()` method
- [ ] Generate QR codes (bitcoin:, ethereum:)
- [ ] Create DTOs and controllers
- [ ] Add 15-minute expiration

### Phase 4: Blockchain Monitoring (Days 5-7)
- [ ] Create blockchain providers (BTC, ETH, LTC)
- [ ] Implement RPC integration (Infura, Alchemy, Blockchain.info)
- [ ] Implement `checkPayment()` - detect incoming
- [ ] Implement `checkConfirmations()` - count confirmations
- [ ] Handle payment confirmation

### Phase 5: Background Worker (Day 7)
- [ ] Create Bull processor
- [ ] Add cron job (runs every 60s)
- [ ] Implement job handlers (verify, check-confirmations, expire)
- [ ] Add retry logic

### Phase 6: Order Integration (Days 8-9)
- [ ] Update `OrderService.createOrder()` to support crypto
- [ ] Trigger auto-delivery on confirmation
- [ ] Send notifications

### Phase 7: APIs (Day 10)
- [ ] Public: Create payment, check status, get rates
- [ ] Admin: List payments, manual verify, manual forward
- [ ] Add Swagger docs

### Phase 8: Testing (Days 11-12)
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests (E2E flow)
- [ ] Testnet validation (BTC testnet, Sepolia)
- [ ] Load testing (100+ concurrent payments)

### Phase 9: Deployment
- [ ] Generate production mnemonics (OFFLINE!)
- [ ] Store in AWS Secrets Manager
- [ ] Configure RPC endpoints
- [ ] Run migrations
- [ ] Deploy and smoke test

---

## ⚙️ Environment Variables

```env
# Blockchain RPCs
BITCOIN_RPC_URL=
ETHEREUM_RPC_URL=
LITECOIN_RPC_URL=

# System Mnemonics (NEVER COMMIT!)
SYSTEM_MNEMONIC_BTC=
SYSTEM_MNEMONIC_ETH=
SYSTEM_MNEMONIC_LTC=

# Platform Wallets
PLATFORM_WALLET_BTC=
PLATFORM_WALLET_ETH=
PLATFORM_WALLET_LTC=

# Encryption
WALLET_ENCRYPTION_KEY=

# Exchange Rate
COINGECKO_API_KEY=
COINBASE_API_KEY=

# Settings
PAYMENT_EXPIRATION_MINUTES=15
PAYMENT_MONITOR_INTERVAL_SECONDS=60
MIN_CONFIRMATIONS_BTC=3
MIN_CONFIRMATIONS_ETH=12
MIN_CONFIRMATIONS_LTC=6
```

---

## 🔒 Security Checklist

- [ ] ✅ Private keys encrypted at rest (AES-256-GCM)
- [ ] ✅ Mnemonics stored in AWS Secrets Manager
- [ ] ✅ Never log private keys or mnemonics
- [ ] ✅ Decrypt only when needed (forwarding)
- [ ] ✅ Use authenticated RPC endpoints
- [ ] ✅ Rate limiting on APIs
- [ ] ✅ Input validation with DTOs
- [ ] ✅ HTTPS only in production
- [ ] ✅ Audit logging for sensitive operations

---

## 🧪 Test Checklist

### Unit Tests
- [ ] HD wallet derivation (all cryptos)
- [ ] Private key encryption/decryption
- [ ] Exchange rate service (with mocks)
- [ ] Payment creation logic
- [ ] Blockchain monitoring logic

### Integration Tests
- [ ] Complete payment flow (order → payment → confirm → deliver)
- [ ] Payment expiration (15 min)
- [ ] Multiple cryptocurrencies
- [ ] Concurrent payments (no index collision)

### Testnet Validation
- [ ] Bitcoin testnet payment
- [ ] Ethereum Sepolia payment
- [ ] QR code scanning with real wallet
- [ ] Payment detection timing (<60s)
- [ ] Auto-delivery after confirmation

---

## 📊 Monitoring & Alerts

### Key Metrics
- Payment creation rate
- Payment detection latency (target: <60s)
- Payment confirmation time
- Failed payment rate
- Expired payment rate

### Critical Alerts
- 🚨 Payment detection failing (>5 min delay)
- 🚨 RPC endpoint down
- 🚨 Payment queue stuck (>100 jobs)
- 🚨 High error rate (>5% of payments)
- 🚨 Low platform wallet balance (for forwarding)

---

## 🔧 Troubleshooting

### Payment Not Detected
1. Check RPC endpoint status
2. Verify payment address correct
3. Check blockchain explorer (txHash)
4. Manually trigger verification: `POST /admin/crypto-payments/:id/verify`
5. Check queue health: `bull-board`

### Payment Stuck in CONFIRMING
1. Check current confirmations
2. Check required confirmations (3 BTC, 12 ETH, 6 LTC)
3. Wait for network (can be slow during congestion)
4. Check blockchain explorer for confirmation count

### Payment Expired
1. User must create new order
2. Old payment address won't be monitored
3. Refund if user paid to expired address (manual process)

### Queue Not Processing
1. Check Redis connection
2. Check Bull dashboard
3. Restart worker process
4. Check logs for errors

---

## 📚 Quick Links

- **Detailed Plan**: [PHASE6_CRYPTO_PAYMENT_PLAN.md](./PHASE6_CRYPTO_PAYMENT_PLAN.md)
- **Task Breakdown**: [PHASE6_TASK_BREAKDOWN.md](./PHASE6_TASK_BREAKDOWN.md)
- **CoinPay Reference**: [COINPAY_ARCHITECTURE.md](./COINPAY_ARCHITECTURE.md)
- **Store Design**: [CRYPTO_STORE_DESIGN.md](./CRYPTO_STORE_DESIGN.md)

---

## 🎯 Success Criteria

Phase 6 is **DONE** when:
1. ✅ Can create order and pay with BTC/ETH/LTC
2. ✅ Payment detected within 60 seconds
3. ✅ Order auto-completes after confirmations
4. ✅ Handles 100+ concurrent payments
5. ✅ <1% failure rate
6. ✅ Zero security incidents
7. ✅ 99.9% uptime
8. ✅ All tests passing
9. ✅ Deployed to production
10. ✅ First real payment processed 🚀

---

## 📞 Need Help?

**Critical Issues:**
- Payment not detected: Check [Troubleshooting](#troubleshooting)
- Security incident: Escalate immediately
- RPC endpoint down: Switch to fallback provider

**Documentation:**
- Read detailed plan for architecture details
- Check CoinPay reference for best practices
- Review blockchain provider docs (ethers.js, bitcoinjs-lib)

---

**Version**: 1.0
**Last Updated**: January 30, 2026
**Status**: Ready for Implementation 🚀
