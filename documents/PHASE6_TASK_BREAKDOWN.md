# Phase 6: Task Breakdown & Timeline

> **Quick Reference**: Detailed task breakdown for implementing crypto payment system
> **Total Duration**: 10-12 days
> **Team Size**: 1-2 developers

---

## 📅 Sprint Overview

```
Week 4: Days 1-5  → Core Implementation (Wallet + Monitoring)
Week 5: Days 6-10 → Integration + Testing
Week 5: Days 11-12 → Deployment + Go-Live
```

---

## Day 1-2: Foundation (16 hours)

### Database Schema (4 hours)
- [ ] Create Prisma models: `CryptoPayment`, `SystemWalletIndex`, `CryptoExchangeRate`
- [ ] Add enums: `CryptoCurrency`, `PaymentStatus`
- [ ] Update `Order` model with crypto payment relation
- [ ] Generate and run migration
- [ ] Seed initial wallet indexes

**Deliverable:** ✅ Database ready with all tables

### Module Setup (4 hours)
- [ ] Create `crypto-payment` module directory structure
- [ ] Setup controllers (public + admin)
- [ ] Create base services with interfaces
- [ ] Configure Bull queue for payment verification
- [ ] Add environment variables to `.env`

**Deliverable:** ✅ Module scaffold complete

### HD Wallet Foundation (8 hours)
- [ ] Install: `@scure/bip39`, `@scure/bip32`, `bitcoinjs-lib`, `ethers`
- [ ] Implement `crypto.util.ts` - BIP44 derivation
  - Bitcoin address derivation
  - Ethereum address derivation
  - Litecoin address derivation
- [ ] Implement `encryption.util.ts` - AES-256-GCM
- [ ] Write unit tests for derivation + encryption
- [ ] Implement `SystemWalletService`
  - `generatePaymentAddress()`
  - `getNextIndex()` with transaction
  - `decryptPrivateKey()`

**Deliverable:** ✅ Can generate unique addresses for BTC/ETH/LTC

---

## Day 3: Exchange Rate Service (8 hours)

### Rate Provider Integration (6 hours)
- [ ] Install: `axios`
- [ ] Implement `ExchangeRateService`
  - CoinGecko API integration
  - CoinBase API fallback
  - Redis cache (5-min TTL)
  - Database cache fallback
- [ ] Implement conversion methods
  - `getRate(crypto, fiat)`
  - `convertToCrypto(fiatAmount, crypto)`
  - `convertToFiat(cryptoAmount, crypto)`

**Deliverable:** ✅ Can fetch and convert crypto prices

### Testing (2 hours)
- [ ] Unit tests for rate service
- [ ] Test fallback mechanism
- [ ] Test caching behavior

**Deliverable:** ✅ Rate service tested and working

---

## Day 4-5: Crypto Payment Service (16 hours)

### Payment Creation (10 hours)
- [ ] Implement `CryptoPaymentService.createPayment()`
  - Get order details
  - Fetch exchange rate
  - Calculate crypto amount
  - Generate payment address
  - Create payment record
  - Set 15-min expiration
  - Queue verification job
- [ ] Install: `qrcode`
- [ ] Implement `qr-code.util.ts`
  - Generate payment URIs (bitcoin:, ethereum:)
  - Generate QR code as base64 PNG
- [ ] Implement `getPaymentStatus()`
- [ ] Write unit tests

**Deliverable:** ✅ Can create payment with QR code

### DTOs & Validation (3 hours)
- [ ] Create request DTOs
  - `CreateCryptoPaymentDto`
  - `VerifyPaymentDto`
- [ ] Create response DTOs
  - `CryptoPaymentResponseDto`
  - `PaymentStatusResponseDto`
  - `ExchangeRateResponseDto`
- [ ] Add class-validator decorators
- [ ] Add Swagger documentation

**Deliverable:** ✅ DTOs with validation ready

### Basic Controller (3 hours)
- [ ] Implement public controller
  - `POST /orders/:id/crypto-payment`
  - `GET /crypto-payments/:id/status`
- [ ] Add guards and decorators
- [ ] Add error handling

**Deliverable:** ✅ Can create payment via API

---

## Day 5-7: Blockchain Monitoring (24 hours)

### Blockchain Providers (12 hours)
- [ ] Create `IBlockchainProvider` interface
- [ ] Implement `BitcoinProvider`
  - RPC integration (Blockchain.info API)
  - `getBalance(address)`
  - `getTransactionByAddress(address)`
  - `getTransactionConfirmations(txHash)`
- [ ] Implement `EthereumProvider`
  - ethers.js integration (Infura/Alchemy)
  - `getBalance(address)`
  - Handle ERC-20 tokens (USDT)
  - `getTransactionConfirmations(txHash)`
- [ ] Implement `LitecoinProvider`
- [ ] Write unit tests with mocks

**Deliverable:** ✅ Can check balances on BTC/ETH/LTC

### Monitor Service (8 hours)
- [ ] Implement `BlockchainMonitorService`
  - `checkPayment(paymentId)` - Check single payment
  - `checkPendingPayments()` - Check all pending
  - `checkConfirmations(paymentId)` - Count confirmations
  - `confirmPayment(paymentId)` - Mark as confirmed
  - `expirePayment(paymentId)` - Handle expiration
- [ ] Integration with order service
- [ ] Integration with notification service

**Deliverable:** ✅ Can detect and confirm payments

### Testing (4 hours)
- [ ] Unit tests for monitor service
- [ ] Integration tests with testnet
- [ ] Test payment detection flow
- [ ] Test confirmation counting

**Deliverable:** ✅ Monitor service tested

---

## Day 7: Payment Verification Worker (8 hours)

### Bull Processor (6 hours)
- [ ] Create `payment-verification.processor.ts`
- [ ] Implement job handlers
  - `@Process('verify-payment')` - Initial check
  - `@Process('check-confirmations')` - Monitor confirmations
  - `@Cron(EVERY_MINUTE)` - Check all pending
- [ ] Add retry logic (exponential backoff)
- [ ] Add comprehensive logging

**Deliverable:** ✅ Background worker running

### Testing (2 hours)
- [ ] Test job processing
- [ ] Test cron schedule
- [ ] Test error handling and retries
- [ ] Monitor queue health

**Deliverable:** ✅ Worker tested and stable

---

## Day 8-9: Payment Forwarding [OPTIONAL] (16 hours)

> **Note**: Only if implementing payment forwarding. Skip if users pay directly to platform wallet.

### Forwarding Service (12 hours)
- [ ] Implement `PaymentForwardingService`
  - `forwardPayment(paymentId)`
  - Decrypt private key
  - Estimate gas fees
  - Build transaction
  - Sign and broadcast
  - Handle errors
- [ ] Create `payment-forwarding.processor.ts`
- [ ] Implement retry logic

**Deliverable:** ✅ Can forward payments to platform wallet

### Testing (4 hours)
- [ ] Test forwarding on testnet
- [ ] Test gas estimation
- [ ] Test error handling
- [ ] Test retry mechanism

**Deliverable:** ✅ Forwarding works reliably

---

## Day 9: Order Integration (8 hours)

### Update Order Module (6 hours)
- [ ] Update `OrderService.createOrder()`
  - Add crypto payment option
  - Call `CryptoPaymentService.createPayment()`
  - Return payment details with order
- [ ] Update order DTOs
  - Add `paymentMethod` field (WALLET | CRYPTO)
  - Add `cryptocurrency` field
- [ ] Update order responses to include payment info
- [ ] Update `OrderDetailResponseDto`

**Deliverable:** ✅ Orders support crypto payments

### Auto-Delivery Integration (2 hours)
- [ ] Update order processor to trigger delivery on payment confirmation
- [ ] Test instant delivery flow
- [ ] Test notification flow

**Deliverable:** ✅ Orders auto-complete after payment

---

## Day 10: API Completion (8 hours)

### Public API (4 hours)
- [ ] Complete public controller
  - `GET /crypto/exchange-rates` - Current rates
  - `GET /crypto/supported-currencies` - List supported
- [ ] Add Swagger documentation
- [ ] Add examples and descriptions

**Deliverable:** ✅ Public API complete

### Admin API (4 hours)
- [ ] Implement admin controller
  - `GET /admin/crypto-payments` - List all
  - `GET /admin/crypto-payments/:id` - Payment detail
  - `POST /admin/crypto-payments/:id/verify` - Manual verify
  - `POST /admin/crypto-payments/:id/forward` - Manual forward
  - `GET /admin/crypto/wallet-indexes` - Check indexes
- [ ] Add ADMIN role guards
- [ ] Add Swagger documentation

**Deliverable:** ✅ Admin API complete

---

## Day 11-12: Testing & Deployment (16 hours)

### Comprehensive Testing (10 hours)
- [ ] **Unit Tests** (4 hours)
  - All services covered (>80%)
  - Mock external dependencies
  - Edge cases tested
- [ ] **Integration Tests** (4 hours)
  - Complete payment flow (order → payment → confirm → deliver)
  - Expiration flow
  - Multiple cryptocurrencies
  - Concurrent payments
- [ ] **Testnet Validation** (2 hours)
  - Test with real testnet BTC
  - Test with Sepolia ETH
  - Test QR code scanning
  - Test payment detection timing

**Deliverable:** ✅ All tests passing

### Deployment (6 hours)
- [ ] **Pre-Deployment** (3 hours)
  - Generate production mnemonics (OFFLINE!)
  - Store in AWS Secrets Manager
  - Create platform wallet addresses
  - Configure production RPC endpoints
  - Setup monitoring/alerting
- [ ] **Deploy** (2 hours)
  - Run database migration
  - Deploy to production
  - Smoke test with small amount
- [ ] **Post-Deployment** (1 hour)
  - Monitor error logs
  - Verify cron job running
  - Test payment detection
  - Check queue health

**Deliverable:** ✅ Production ready and deployed

---

## 🎯 Critical Path

```
Day 1-2: Foundation (Database + Module Setup + HD Wallet)
         ↓
Day 3:   Exchange Rate Service
         ↓
Day 4-5: Payment Creation Service
         ↓
Day 5-7: Blockchain Monitoring (CRITICAL)
         ↓
Day 7:   Payment Verification Worker (CRITICAL)
         ↓
Day 9:   Order Integration
         ↓
Day 10:  API Completion
         ↓
Day 11-12: Testing & Deployment
```

**Critical Path Items** (Cannot be parallelized):
1. HD Wallet → Payment Service → Blockchain Monitor → Verification Worker

**Parallelizable**:
- Exchange Rate Service (can develop alongside HD Wallet)
- QR Code generation (can develop alongside Payment Service)
- Admin API (can develop alongside testing)

---

## 📊 Progress Tracking

### Week 4 Goals (Days 1-5)
- [x] Database schema ✅
- [x] HD Wallet system ✅
- [x] Exchange rate service ✅
- [x] Payment creation ✅
- [x] QR code generation ✅

### Week 5 Goals (Days 6-10)
- [ ] Blockchain monitoring ⏳
- [ ] Payment verification worker ⏳
- [ ] Order integration ⏳
- [ ] API completion ⏳
- [ ] Testing ⏳

### Week 5 Final (Days 11-12)
- [ ] Testnet validation ⏳
- [ ] Production deployment ⏳

---

## 🚨 Risk Mitigation

### High-Priority Risks

| Risk | Mitigation | Owner |
|------|-----------|-------|
| **Blockchain RPC downtime** | Setup 2-3 fallback providers | Backend Dev |
| **Payment not detected** | Multiple checks, manual verification endpoint | Backend Dev |
| **Mnemonic leak** | Never commit to git, use secrets manager | DevOps |
| **Exchange rate volatility** | Short 15-min window, cache rates | Backend Dev |
| **Queue failure** | Redis persistence, dead letter queue | DevOps |

---

## 📝 Daily Standup Template

```markdown
### Yesterday
- Completed: [list completed tasks]
- Blockers: [any issues]

### Today
- Working on: [current tasks]
- Expected completion: [task IDs]

### Blockers
- [any blockers or dependencies]

### Metrics
- Tests passing: X/Y
- Code coverage: XX%
- Tasks completed: X/Y (XX%)
```

---

## ✅ Definition of Done

### For Each Task:
- [ ] Code implemented and follows style guide
- [ ] Unit tests written and passing
- [ ] Code reviewed (if team size > 1)
- [ ] Swagger documentation added
- [ ] No console.log statements (use logger)
- [ ] Error handling implemented
- [ ] Sensitive data not logged

### For Each Feature:
- [ ] Integration tests passing
- [ ] Tested on testnet (if applicable)
- [ ] Admin can manually trigger if needed
- [ ] Monitoring/alerting setup
- [ ] Documentation updated

### For Phase 6 Complete:
- [ ] All tasks marked complete
- [ ] All tests passing (>80% coverage)
- [ ] Testnet validation successful
- [ ] Deployed to production
- [ ] Post-deployment verification passed
- [ ] Team trained on new features
- [ ] Runbook created for on-call

---

## 🎉 Success Criteria

Phase 6 is considered **SUCCESSFUL** when:

1. ✅ User can create order and pay with BTC/ETH/LTC
2. ✅ Payment detected within 60 seconds
3. ✅ Order auto-completes after confirmations
4. ✅ Handles 100+ concurrent payments
5. ✅ <1% payment detection failure rate
6. ✅ Zero security incidents
7. ✅ 99.9% uptime
8. ✅ All tests passing
9. ✅ Production deployment successful
10. ✅ First real payment processed successfully 🚀

---

## 📞 Contacts

### Escalation Path

| Issue Type | Contact | SLA |
|-----------|---------|-----|
| **Critical payment failure** | On-call engineer | 15 min |
| **RPC endpoint down** | DevOps team | 30 min |
| **Security incident** | Security team | Immediate |
| **Blockchain congestion** | Engineering lead | 1 hour |

---

**Document Version**: 1.0
**Last Updated**: January 30, 2026
**Next Review**: After Day 5 (Mid-sprint checkpoint)
