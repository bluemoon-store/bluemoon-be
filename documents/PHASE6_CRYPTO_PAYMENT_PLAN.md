# Phase 6: Crypto Payment System - Implementation Plan

> **Project**: Bluemoon Backend - Crypto Store
> **Phase**: 6 - Crypto Payment Integration (Non-custodial, Zero-Fee, No-KYC)
> **Reference Architecture**: CoinPay
> **Timeline**: Week 4-5
> **Date**: January 30, 2026

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [System Design](#system-design)
4. [Database Schema](#database-schema)
5. [Module Structure](#module-structure)
6. [Implementation Tasks](#implementation-tasks)
7. [Testing Strategy](#testing-strategy)
8. [Security Considerations](#security-considerations)
9. [Deployment Checklist](#deployment-checklist)

---

## 📊 Executive Summary

### Objectives

Integrate a **non-custodial cryptocurrency payment system** into Bluemoon backend that:
- ✅ Generates unique payment addresses using HD wallet derivation
- ✅ Monitors blockchain for incoming payments (zero-fee from user perspective)
- ✅ Automatically forwards payments to merchant wallets
- ✅ Supports multiple blockchains (BTC, ETH, LTC, BCH, USDT)
- ✅ No KYC requirements
- ✅ 15-minute payment window with expiration handling
- ✅ Real-time payment verification
- ✅ Automatic order completion on payment confirmation

### Key Features from CoinPay Reference

1. **System HD Wallet**: Platform controls HD wallets and generates unique addresses per payment
2. **Automatic Monitoring**: Background job monitors blockchain every minute
3. **Payment Forwarding**: Splits and forwards payments (platform fee + merchant amount)
4. **15-Minute Window**: Creates urgency and reduces monitoring overhead
5. **Multi-blockchain Support**: BTC, ETH, LTC, BCH, USDT (ERC-20)
6. **Webhook Notifications**: Real-time payment status updates

### Integration Points with Existing System

- **Order Module**: Extend to create crypto payment when order is created
- **Wallet Module**: Extend to credit wallet balance on confirmed payment
- **Notification Module**: Send push notifications on payment events
- **Queue System**: Use existing Bull/Redis for payment monitoring jobs

---

## 🏗️ Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Bluemoon Crypto Payment Flow                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. User Creates Order (from Cart)                                  │
│     ↓                                                                │
│  2. System Generates Unique Crypto Address (HD Wallet)              │
│     - Derives from master mnemonic                                  │
│     - Stores encrypted private key                                  │
│     - Creates CryptoPayment record                                  │
│     ↓                                                                │
│  3. User Sends Crypto to Generated Address                          │
│     - 15-minute payment window                                      │
│     - QR code displayed                                             │
│     ↓                                                                │
│  4. Background Monitor Detects Payment (Every 60s)                  │
│     - Checks blockchain via RPC                                     │
│     - Waits for required confirmations                              │
│     ↓                                                                │
│  5. Payment Confirmed                                                │
│     - Update order status: PAYMENT_RECEIVED                         │
│     - Trigger auto-delivery if instant                              │
│     - Send push notification                                        │
│     ↓                                                                │
│  6. Payment Forwarding (Optional)                                   │
│     - Decrypt private key                                           │
│     - Forward to platform wallet                                    │
│     - Update payment status: FORWARDED                              │
│     ↓                                                                │
│  7. Order Processing                                                │
│     - Status: PROCESSING → COMPLETED                                │
│     - Deliver digital content                                       │
│     - Send completion notification                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Payment Status Lifecycle

```
PENDING (order created, address generated)
   ↓
PAID (payment detected on blockchain)
   ↓
CONFIRMING (waiting for N confirmations)
   ↓
CONFIRMED (confirmations met, order updated)
   ↓
FORWARDING (transferring to platform wallet)
   ↓
FORWARDED (payment forwarding complete)

// Alternative paths:
PENDING → EXPIRED (15 minutes passed, no payment)
PENDING → FAILED (error during processing)
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Crypto Payment Module                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. System Wallet Service                          │    │
│  │     - HD Wallet Derivation (BIP44)                 │    │
│  │     - Address Generation                           │    │
│  │     - Private Key Encryption/Decryption            │    │
│  │     - Mnemonic Management                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  2. Crypto Payment Service                         │    │
│  │     - Create Payment Record                        │    │
│  │     - Calculate Crypto Amount (Exchange Rate)      │    │
│  │     - Generate QR Code                             │    │
│  │     - Check Payment Status                         │    │
│  │     - Handle Expiration                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  3. Blockchain Monitor Service                     │    │
│  │     - RPC Provider Integration                     │    │
│  │     - Balance Checking                             │    │
│  │     - Transaction Verification                     │    │
│  │     - Confirmation Counting                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  4. Payment Forwarding Service                     │    │
│  │     - Transaction Signing                          │    │
│  │     - Fund Distribution                            │    │
│  │     - Gas Fee Management                           │    │
│  │     - Retry Logic                                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  5. Exchange Rate Service                          │    │
│  │     - Price Feed Integration (CoinGecko/CoinBase)  │    │
│  │     - Rate Caching (5 min TTL)                     │    │
│  │     - Fallback Providers                           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  6. Payment Verification Processor (Bull Worker)   │    │
│  │     - Queue: payment-verification                  │    │
│  │     - Runs every 60 seconds                        │    │
│  │     - Checks pending payments                      │    │
│  │     - Updates payment status                       │    │
│  │     - Triggers order updates                       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### 1. Update Existing Models

#### Update `Order` Model
```prisma
model Order {
  // ... existing fields

  // Add crypto payment relation
  cryptoPayment   CryptoPayment?

  // ... rest of fields
}
```

### 2. New Models

#### CryptoPayment
```prisma
model CryptoPayment {
  id                    String              @id @default(uuid())
  orderId               String              @unique @map("order_id")
  order                 Order               @relation(fields: [orderId], references: [id], onDelete: Cascade)

  // Cryptocurrency info
  cryptocurrency        CryptoCurrency
  network               String?             // e.g., "mainnet", "ERC20", "BEP20"

  // Payment address (generated from system HD wallet)
  paymentAddress        String              @map("payment_address")
  derivationIndex       Int                 @map("derivation_index")
  derivationPath        String              @map("derivation_path")
  encryptedPrivateKey   String              @map("encrypted_private_key") @db.Text

  // Amount info
  amount                Decimal             @db.Decimal(30, 18) // Crypto amount
  amountUsd             Decimal             @db.Decimal(20, 2) @map("amount_usd") // USD value at creation
  exchangeRate          Decimal?            @db.Decimal(20, 8) @map("exchange_rate") // Rate at payment time

  // Platform wallet info
  platformWalletAddress String              @map("platform_wallet_address")

  // Payment status
  status                PaymentStatus       @default(PENDING)

  // Transaction info
  txHash                String?             @map("tx_hash") // Incoming transaction hash
  forwardTxHash         String?             @map("forward_tx_hash") // Outgoing transaction hash
  confirmations         Int                 @default(0)
  requiredConfirmations Int                 @default(3) @map("required_confirmations")

  // Timestamps
  expiresAt             DateTime            @map("expires_at")
  paidAt                DateTime?           @map("paid_at")
  confirmedAt           DateTime?           @map("confirmed_at")
  forwardedAt           DateTime?           @map("forwarded_at")
  createdAt             DateTime            @default(now()) @map("created_at")
  updatedAt             DateTime            @updatedAt @map("updated_at")

  // Metadata
  metadata              Json?               // Additional info (network fee, etc.)

  @@index([paymentAddress])
  @@index([status])
  @@index([txHash])
  @@index([cryptocurrency])
  @@index([expiresAt])
  @@map("crypto_payments")
}

enum CryptoCurrency {
  BTC         // Bitcoin
  ETH         // Ethereum
  LTC         // Litecoin
  BCH         // Bitcoin Cash
  USDT_ERC20  // USDT on Ethereum
  USDT_TRC20  // USDT on Tron
  USDC_ERC20  // USDC on Ethereum
}

enum PaymentStatus {
  PENDING      // Waiting for payment
  PAID         // Payment detected (but not confirmed)
  CONFIRMING   // Waiting for confirmations
  CONFIRMED    // Payment confirmed (order can proceed)
  FORWARDING   // Forwarding to platform wallet
  FORWARDED    // Successfully forwarded
  EXPIRED      // Payment window expired (15 min)
  FAILED       // Payment processing failed
}
```

#### SystemWalletIndex
```prisma
model SystemWalletIndex {
  id             String   @id @default(uuid())
  cryptocurrency CryptoCurrency @unique
  nextIndex      Int      @default(0) @map("next_index")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@map("system_wallet_indexes")
}
```

#### CryptoExchangeRate (Cache)
```prisma
model CryptoExchangeRate {
  id             String         @id @default(uuid())
  cryptocurrency CryptoCurrency
  fiatCurrency   String         @default("USD") @map("fiat_currency")
  rate           Decimal        @db.Decimal(20, 8)
  provider       String         // "coingecko", "coinbase", etc.
  expiresAt      DateTime       @map("expires_at")
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")

  @@unique([cryptocurrency, fiatCurrency])
  @@index([cryptocurrency])
  @@index([expiresAt])
  @@map("crypto_exchange_rates")
}
```

---

## 📦 Module Structure

### Directory Structure

```
src/modules/crypto-payment/
├── controllers/
│   ├── crypto-payment.public.controller.ts     # User payment endpoints
│   └── crypto-payment.admin.controller.ts      # Admin payment management
├── services/
│   ├── crypto-payment.service.ts               # Main payment logic
│   ├── system-wallet.service.ts                # HD wallet management
│   ├── blockchain-monitor.service.ts           # Blockchain monitoring
│   ├── payment-forwarding.service.ts           # Payment forwarding
│   ├── exchange-rate.service.ts                # Rate fetching/caching
│   └── blockchain-provider/
│       ├── blockchain-provider.interface.ts
│       ├── bitcoin-provider.service.ts
│       ├── ethereum-provider.service.ts
│       ├── litecoin-provider.service.ts
│       └── usdt-provider.service.ts
├── processors/
│   ├── payment-verification.processor.ts       # Bull worker for monitoring
│   └── payment-forwarding.processor.ts         # Bull worker for forwarding
├── schedulers/
│   └── payment-expiration.scheduler.ts         # Expire old payments
├── interfaces/
│   ├── crypto-payment.service.interface.ts
│   ├── system-wallet.service.interface.ts
│   ├── blockchain-monitor.service.interface.ts
│   └── exchange-rate.service.interface.ts
├── dtos/
│   ├── request/
│   │   ├── crypto-payment.create.request.ts
│   │   └── crypto-payment.verify.request.ts
│   └── response/
│       ├── crypto-payment.response.ts
│       ├── payment-address.response.ts
│       └── exchange-rate.response.ts
├── utils/
│   ├── crypto.util.ts                          # HD wallet derivation
│   ├── encryption.util.ts                      # Key encryption
│   └── qr-code.util.ts                         # QR code generation
└── crypto-payment.module.ts
```

---

## 🔧 Implementation Tasks

### Phase 6.1: Foundation & Setup (Days 1-2)

#### Task 6.1.1: Database Schema
- [ ] Create Prisma migration for new models
  - [ ] `CryptoPayment` model
  - [ ] `SystemWalletIndex` model
  - [ ] `CryptoExchangeRate` model
  - [ ] Add enums: `CryptoCurrency`, `PaymentStatus`
  - [ ] Update `Order` model with `cryptoPayment` relation
- [ ] Run migration and verify schema
- [ ] Seed initial `SystemWalletIndex` records (one per cryptocurrency)

**Acceptance Criteria:**
- ✅ All tables created successfully
- ✅ Indexes applied correctly
- ✅ Foreign key constraints working
- ✅ Can create test records in database

#### Task 6.1.2: Module Setup
- [ ] Create `crypto-payment` module directory structure
- [ ] Setup module imports and providers
- [ ] Add BullMQ queue configuration for payment verification
- [ ] Configure environment variables
  ```env
  # Blockchain RPC URLs
  BITCOIN_RPC_URL=
  ETHEREUM_RPC_URL=
  LITECOIN_RPC_URL=

  # System HD Wallet Mnemonics (HIGHLY SENSITIVE)
  SYSTEM_MNEMONIC_BTC=
  SYSTEM_MNEMONIC_ETH=
  SYSTEM_MNEMONIC_LTC=

  # Platform Wallet Addresses
  PLATFORM_WALLET_BTC=
  PLATFORM_WALLET_ETH=
  PLATFORM_WALLET_LTC=

  # Encryption
  WALLET_ENCRYPTION_KEY=

  # Exchange Rate API
  COINGECKO_API_KEY=
  COINBASE_API_KEY=

  # Payment Settings
  PAYMENT_EXPIRATION_MINUTES=15
  PAYMENT_MONITOR_INTERVAL_SECONDS=60
  ```

**Acceptance Criteria:**
- ✅ Module structure follows NestJS best practices
- ✅ Bull queue configured for payment jobs
- ✅ Environment variables documented

---

### Phase 6.2: System Wallet Service (Days 2-3)

#### Task 6.2.1: HD Wallet Derivation
- [ ] Install dependencies
  ```bash
  yarn add @scure/bip39 @scure/bip32 bitcoinjs-lib ethers
  ```
- [ ] Implement `crypto.util.ts`
  - [ ] BIP39 mnemonic validation
  - [ ] BIP44 path derivation
  - [ ] Address generation for each blockchain
    - [ ] Bitcoin (P2PKH)
    - [ ] Ethereum (EIP-55 checksum)
    - [ ] Litecoin
    - [ ] USDT (ERC-20)
- [ ] Implement `encryption.util.ts`
  - [ ] AES-256-GCM encryption for private keys
  - [ ] PBKDF2 key derivation
  - [ ] Secure random salt/IV generation

**Code Example:**
```typescript
// src/modules/crypto-payment/utils/crypto.util.ts
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { ethers } from 'ethers';

const DERIVATION_PATHS = {
  BTC: "m/44'/0'/0'/0",
  ETH: "m/44'/60'/0'/0",
  LTC: "m/44'/2'/0'/0",
  BCH: "m/44'/145'/0'/0",
};

export async function deriveAddress(
  mnemonic: string,
  cryptocurrency: string,
  index: number
): Promise<{ address: string; privateKey: string }> {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const basePath = DERIVATION_PATHS[cryptocurrency];
  const fullPath = `${basePath}/${index}`;
  const child = hdKey.derive(fullPath);

  switch (cryptocurrency) {
    case 'BTC':
      return deriveBitcoinAddress(child);
    case 'ETH':
    case 'USDT_ERC20':
      return deriveEthereumAddress(child);
    case 'LTC':
      return deriveLitecoinAddress(child);
    default:
      throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`);
  }
}

function deriveBitcoinAddress(hdKey: HDKey) {
  const { address } = bitcoin.payments.p2pkh({
    pubkey: Buffer.from(hdKey.publicKey!),
    network: bitcoin.networks.bitcoin,
  });
  return {
    address: address!,
    privateKey: Buffer.from(hdKey.privateKey!).toString('hex'),
  };
}

function deriveEthereumAddress(hdKey: HDKey) {
  const privateKeyHex = '0x' + Buffer.from(hdKey.privateKey!).toString('hex');
  const wallet = new ethers.Wallet(privateKeyHex);
  return {
    address: wallet.address,
    privateKey: Buffer.from(hdKey.privateKey!).toString('hex'),
  };
}
```

**Acceptance Criteria:**
- ✅ Can derive unique addresses for each cryptocurrency
- ✅ Addresses are valid and can receive payments
- ✅ Private keys are correctly encrypted/decrypted
- ✅ Unit tests pass for all derivation paths

#### Task 6.2.2: System Wallet Service Implementation
- [ ] Implement `SystemWalletService`
  - [ ] `getNextIndex(cryptocurrency)`: Get and increment index
  - [ ] `generatePaymentAddress(orderId, cryptocurrency, amount)`: Create new address
  - [ ] `getPaymentAddress(paymentId)`: Retrieve address info
  - [ ] `decryptPrivateKey(encryptedKey)`: Decrypt for forwarding
- [ ] Implement atomic index increment (use database transaction)
- [ ] Add logging for all wallet operations

**Interface:**
```typescript
export interface ISystemWalletService {
  generatePaymentAddress(
    orderId: string,
    cryptocurrency: CryptoCurrency,
    amountCrypto: number,
    amountUsd: number
  ): Promise<{
    address: string;
    derivationIndex: number;
    derivationPath: string;
    expiresAt: Date;
  }>;

  getPaymentAddress(paymentId: string): Promise<CryptoPayment>;

  decryptPrivateKey(encryptedKey: string): Promise<string>;
}
```

**Acceptance Criteria:**
- ✅ Unique address generated for each payment
- ✅ Index increments atomically (no collisions)
- ✅ Private keys encrypted before storage
- ✅ Can decrypt keys for forwarding

---

### Phase 6.3: Exchange Rate Service (Day 3)

#### Task 6.3.1: Exchange Rate Integration
- [ ] Install HTTP client
  ```bash
  yarn add axios
  ```
- [ ] Implement `ExchangeRateService`
  - [ ] Primary provider: CoinGecko API
  - [ ] Fallback provider: CoinBase API
  - [ ] Cache rates in Redis (5-minute TTL)
  - [ ] Database cache as fallback (CryptoExchangeRate table)
- [ ] Implement rate conversion
  - [ ] `getRate(crypto, fiat)`: Get current exchange rate
  - [ ] `convertToFiat(cryptoAmount, crypto, fiat)`: Convert to fiat
  - [ ] `convertToCrypto(fiatAmount, crypto, fiat)`: Convert to crypto

**Code Example:**
```typescript
@Injectable()
export class ExchangeRateService implements IExchangeRateService {
  private readonly CACHE_TTL = 300; // 5 minutes

  async getRate(
    cryptocurrency: CryptoCurrency,
    fiatCurrency: string = 'USD'
  ): Promise<number> {
    // 1. Check Redis cache
    const cached = await this.cacheService.get(
      `rate:${cryptocurrency}:${fiatCurrency}`
    );
    if (cached) return parseFloat(cached);

    // 2. Fetch from CoinGecko
    try {
      const rate = await this.fetchFromCoinGecko(cryptocurrency, fiatCurrency);
      await this.cacheService.set(
        `rate:${cryptocurrency}:${fiatCurrency}`,
        rate.toString(),
        this.CACHE_TTL
      );
      await this.saveRateToDatabase(cryptocurrency, fiatCurrency, rate);
      return rate;
    } catch (error) {
      // 3. Fallback to CoinBase
      try {
        const rate = await this.fetchFromCoinBase(cryptocurrency, fiatCurrency);
        await this.cacheService.set(
          `rate:${cryptocurrency}:${fiatCurrency}`,
          rate.toString(),
          this.CACHE_TTL
        );
        return rate;
      } catch (fallbackError) {
        // 4. Use database cache
        return this.getRateFromDatabase(cryptocurrency, fiatCurrency);
      }
    }
  }

  async convertToCrypto(
    fiatAmount: number,
    cryptocurrency: CryptoCurrency,
    fiatCurrency: string = 'USD'
  ): Promise<number> {
    const rate = await this.getRate(cryptocurrency, fiatCurrency);
    const cryptoAmount = fiatAmount / rate;

    // Round to 8 decimal places (standard for crypto)
    return Math.round(cryptoAmount * 100000000) / 100000000;
  }
}
```

**Acceptance Criteria:**
- ✅ Fetches live rates from CoinGecko
- ✅ Falls back to CoinBase on failure
- ✅ Uses database cache when APIs unavailable
- ✅ Rates cached in Redis with 5-min TTL
- ✅ Conversion calculations accurate to 8 decimals

---

### Phase 6.4: Crypto Payment Service (Days 4-5)

#### Task 6.4.1: Payment Creation
- [ ] Implement `CryptoPaymentService.createPayment()`
  - [ ] Get exchange rate for selected cryptocurrency
  - [ ] Calculate crypto amount from order total
  - [ ] Generate unique payment address via SystemWalletService
  - [ ] Create `CryptoPayment` record
  - [ ] Set expiration time (15 minutes)
  - [ ] Generate QR code
  - [ ] Return payment details

**Flow:**
```typescript
async createPayment(
  orderId: string,
  cryptocurrency: CryptoCurrency
): Promise<CryptoPaymentResponseDto> {
  // 1. Get order details
  const order = await this.orderService.getOrderDetail(orderId);

  if (order.status !== OrderStatus.PENDING) {
    throw new HttpException('Order already paid', HttpStatus.BAD_REQUEST);
  }

  // 2. Get exchange rate and calculate crypto amount
  const amountUsd = parseFloat(order.totalAmount.toString());
  const cryptoAmount = await this.exchangeRateService.convertToCrypto(
    amountUsd,
    cryptocurrency
  );

  // 3. Generate payment address
  const { address, derivationIndex, derivationPath, expiresAt } =
    await this.systemWalletService.generatePaymentAddress(
      orderId,
      cryptocurrency,
      cryptoAmount,
      amountUsd
    );

  // 4. Get platform wallet address
  const platformWalletAddress = this.configService.get(
    `PLATFORM_WALLET_${cryptocurrency}`
  );

  // 5. Determine required confirmations
  const requiredConfirmations = this.getRequiredConfirmations(cryptocurrency);

  // 6. Create payment record
  const payment = await this.databaseService.cryptoPayment.create({
    data: {
      orderId,
      cryptocurrency,
      paymentAddress: address,
      derivationIndex,
      derivationPath,
      encryptedPrivateKey: '...', // From SystemWalletService
      amount: cryptoAmount.toString(),
      amountUsd: amountUsd.toString(),
      platformWalletAddress,
      status: PaymentStatus.PENDING,
      requiredConfirmations,
      expiresAt,
    },
  });

  // 7. Generate QR code
  const qrCode = await this.generateQRCode(address, cryptoAmount, cryptocurrency);

  // 8. Queue verification job
  await this.paymentQueue.add('verify-payment', { paymentId: payment.id });

  return {
    paymentId: payment.id,
    cryptocurrency,
    paymentAddress: address,
    amount: cryptoAmount,
    amountUsd,
    qrCode,
    expiresAt,
    status: payment.status,
  };
}
```

**Acceptance Criteria:**
- ✅ Payment created successfully for order
- ✅ Unique address generated
- ✅ Crypto amount calculated correctly
- ✅ QR code generated with payment URI
- ✅ Expiration time set to 15 minutes
- ✅ Verification job queued

#### Task 6.4.2: Payment Status Checking
- [ ] Implement `getPaymentStatus(paymentId)`
  - [ ] Return current payment status
  - [ ] Include time remaining
  - [ ] Include confirmations count
  - [ ] Include transaction hash if available

**Acceptance Criteria:**
- ✅ Returns accurate payment status
- ✅ Shows remaining time before expiration
- ✅ Shows confirmation progress

---

### Phase 6.5: Blockchain Monitor Service (Days 5-7)

#### Task 6.5.1: Blockchain Provider Implementation
- [ ] Create `IBlockchainProvider` interface
  ```typescript
  export interface IBlockchainProvider {
    getBalance(address: string): Promise<string>;
    getTransactionByAddress(address: string): Promise<Transaction | null>;
    getTransactionConfirmations(txHash: string): Promise<number>;
    sendTransaction(
      from: string,
      to: string,
      amount: string,
      privateKey: string
    ): Promise<string>;
  }
  ```
- [ ] Implement `BitcoinProvider`
  - [ ] Use Blockchain.info API or Bitcoin Core RPC
  - [ ] Handle UTXO model
- [ ] Implement `EthereumProvider`
  - [ ] Use ethers.js with Infura/Alchemy
  - [ ] Handle ERC-20 tokens (USDT)
- [ ] Implement `LitecoinProvider`
  - [ ] Similar to Bitcoin provider

**Acceptance Criteria:**
- ✅ Can check balance for any address
- ✅ Can retrieve transaction details
- ✅ Can count confirmations
- ✅ Can send transactions (for forwarding)

#### Task 6.5.2: Blockchain Monitor Service
- [ ] Implement `BlockchainMonitorService`
  - [ ] `checkPayment(paymentId)`: Check single payment
  - [ ] `checkPendingPayments()`: Check all pending
  - [ ] `updatePaymentStatus()`: Update status based on blockchain data
  - [ ] Handle different confirmation requirements per blockchain

**Logic:**
```typescript
async checkPayment(paymentId: string): Promise<void> {
  const payment = await this.databaseService.cryptoPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment || payment.status !== PaymentStatus.PENDING) {
    return;
  }

  // Check if expired
  if (new Date() > payment.expiresAt) {
    await this.expirePayment(paymentId);
    return;
  }

  // Get blockchain provider
  const provider = this.getProvider(payment.cryptocurrency);

  // Check balance
  const balance = await provider.getBalance(payment.paymentAddress);
  const balanceNumber = parseFloat(balance);
  const expectedAmount = parseFloat(payment.amount.toString());

  if (balanceNumber >= expectedAmount) {
    // Payment detected!
    const tx = await provider.getTransactionByAddress(payment.paymentAddress);

    await this.databaseService.cryptoPayment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        txHash: tx?.hash,
      },
    });

    // Queue confirmation checking
    await this.paymentQueue.add('check-confirmations', { paymentId });

    // Send notification
    await this.notificationService.sendPaymentDetected(payment.orderId);
  }
}

async checkConfirmations(paymentId: string): Promise<void> {
  const payment = await this.databaseService.cryptoPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment || !payment.txHash) return;

  const provider = this.getProvider(payment.cryptocurrency);
  const confirmations = await provider.getTransactionConfirmations(payment.txHash);

  await this.databaseService.cryptoPayment.update({
    where: { id: paymentId },
    data: { confirmations },
  });

  if (confirmations >= payment.requiredConfirmations) {
    // Payment confirmed!
    await this.confirmPayment(paymentId);
  }
}

async confirmPayment(paymentId: string): Promise<void> {
  const payment = await this.databaseService.cryptoPayment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
    include: { order: true },
  });

  // Update order status
  await this.orderService.updateOrderStatus(payment.orderId, {
    status: OrderStatus.PAYMENT_RECEIVED,
  });

  // Trigger order processing
  await this.orderQueue.add('process-order', { orderId: payment.orderId });

  // Send notification
  await this.notificationService.sendPaymentConfirmed(payment.orderId);

  // Queue forwarding (if enabled)
  if (this.shouldForwardPayment(payment)) {
    await this.paymentQueue.add('forward-payment', { paymentId });
  }
}
```

**Acceptance Criteria:**
- ✅ Detects incoming payments within 60 seconds
- ✅ Tracks confirmation count correctly
- ✅ Updates payment status appropriately
- ✅ Triggers order processing after confirmation

---

### Phase 6.6: Payment Verification Processor (Day 7)

#### Task 6.6.1: Bull Worker Implementation
- [ ] Create `payment-verification.processor.ts`
- [ ] Implement job handlers
  - [ ] `verify-payment`: Initial payment check
  - [ ] `check-confirmations`: Monitor confirmations
  - [ ] `expire-payment`: Handle expired payments
- [ ] Setup cron job to check all pending payments every 60 seconds

**Code:**
```typescript
@Processor('payment-verification')
export class PaymentVerificationProcessor {
  constructor(
    private readonly monitorService: BlockchainMonitorService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentVerificationProcessor.name);
  }

  @Process('verify-payment')
  async handleVerifyPayment(job: Job<{ paymentId: string }>) {
    const { paymentId } = job.data;
    this.logger.info({ paymentId }, 'Verifying payment');

    await this.monitorService.checkPayment(paymentId);
  }

  @Process('check-confirmations')
  async handleCheckConfirmations(job: Job<{ paymentId: string }>) {
    const { paymentId } = job.data;
    this.logger.info({ paymentId }, 'Checking confirmations');

    await this.monitorService.checkConfirmations(paymentId);

    // Re-queue if not confirmed yet
    const payment = await this.getPayment(paymentId);
    if (payment.confirmations < payment.requiredConfirmations) {
      await job.queue.add('check-confirmations', { paymentId }, {
        delay: 60000, // Check again in 60 seconds
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePendingPayments() {
    this.logger.info('Checking all pending payments');
    await this.monitorService.checkPendingPayments();
  }
}
```

**Acceptance Criteria:**
- ✅ Worker processes jobs correctly
- ✅ Cron job runs every minute
- ✅ Failed jobs retry with exponential backoff
- ✅ Logs all payment state changes

---

### Phase 6.7: Payment Forwarding Service (Days 8-9) [Optional]

> **Note**: Forwarding is optional. For "zero-fee" model, users pay directly to platform wallet, no forwarding needed.

#### Task 6.7.1: Implement Forwarding Logic
- [ ] Create `PaymentForwardingService`
  - [ ] Decrypt private key
  - [ ] Calculate gas/network fees
  - [ ] Send transaction to platform wallet
  - [ ] Handle errors and retries
  - [ ] Update payment status

**Acceptance Criteria:**
- ✅ Successfully forwards payments to platform wallet
- ✅ Handles gas fee estimation correctly
- ✅ Retries failed forwards with backoff
- ✅ Logs all forwarding attempts

---

### Phase 6.8: QR Code & UI Integration (Day 9)

#### Task 6.8.1: QR Code Generation
- [ ] Install QR code library
  ```bash
  yarn add qrcode
  ```
- [ ] Implement `qr-code.util.ts`
  - [ ] Generate payment URI
    - Bitcoin: `bitcoin:address?amount=0.001`
    - Ethereum: `ethereum:address?value=1000000000000000000`
  - [ ] Generate QR code as PNG base64

**Code:**
```typescript
import QRCode from 'qrcode';

export async function generatePaymentQR(
  address: string,
  amount: number,
  cryptocurrency: string
): Promise<string> {
  const uri = generatePaymentURI(address, amount, cryptocurrency);
  return await QRCode.toDataURL(uri, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

function generatePaymentURI(
  address: string,
  amount: number,
  cryptocurrency: string
): string {
  switch (cryptocurrency) {
    case 'BTC':
    case 'LTC':
      return `${cryptocurrency.toLowerCase()}:${address}?amount=${amount}`;
    case 'ETH':
    case 'USDT_ERC20':
      // Convert to Wei for Ethereum
      const wei = (amount * 1e18).toString();
      return `ethereum:${address}?value=${wei}`;
    default:
      return address;
  }
}
```

**Acceptance Criteria:**
- ✅ QR codes scannable by wallets
- ✅ Amount pre-filled when scanned
- ✅ Works for all supported cryptocurrencies

---

### Phase 6.9: API Endpoints (Day 10)

#### Task 6.9.1: Public Endpoints
- [ ] Implement `crypto-payment.public.controller.ts`
  ```typescript
  POST   /v1/orders/:orderId/crypto-payment        # Create crypto payment
  GET    /v1/crypto-payments/:paymentId/status    # Check payment status
  GET    /v1/crypto/exchange-rates                # Get current rates
  GET    /v1/crypto/supported-currencies          # List supported cryptos
  ```

**Example:**
```typescript
@ApiTags('Crypto Payment')
@Controller({ version: '1', path: 'orders/:orderId/crypto-payment' })
export class CryptoPaymentPublicController {
  constructor(
    private readonly cryptoPaymentService: CryptoPaymentService,
  ) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiOperation({ summary: 'Create crypto payment for order' })
  async createPayment(
    @Param('orderId') orderId: string,
    @Body() dto: CreateCryptoPaymentDto,
    @CurrentUser() user: UserPayload,
  ): Promise<ApiDataResponseDto<CryptoPaymentResponseDto>> {
    const payment = await this.cryptoPaymentService.createPayment(
      orderId,
      dto.cryptocurrency,
      user.id,
    );
    return { data: payment };
  }

  @Get('status')
  @UseGuards(JwtAccessGuard)
  @ApiOperation({ summary: 'Check payment status' })
  async getStatus(
    @Param('orderId') orderId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<ApiDataResponseDto<PaymentStatusResponseDto>> {
    const status = await this.cryptoPaymentService.getPaymentStatus(
      orderId,
      user.id,
    );
    return { data: status };
  }
}
```

**Acceptance Criteria:**
- ✅ All endpoints documented in Swagger
- ✅ Proper authentication/authorization
- ✅ Input validation with DTOs
- ✅ Error handling

#### Task 6.9.2: Admin Endpoints
- [ ] Implement `crypto-payment.admin.controller.ts`
  ```typescript
  GET    /v1/admin/crypto-payments                    # List all payments
  GET    /v1/admin/crypto-payments/:id                # Payment detail
  POST   /v1/admin/crypto-payments/:id/verify         # Manual verification
  POST   /v1/admin/crypto-payments/:id/forward        # Manual forward
  GET    /v1/admin/crypto/wallet-indexes              # Check wallet indexes
  ```

**Acceptance Criteria:**
- ✅ Admin can view all payments
- ✅ Admin can manually verify payments
- ✅ Admin can trigger forwarding
- ✅ Proper role guards (ADMIN only)

---

### Phase 6.10: Integration with Order Module (Day 10)

#### Task 6.10.1: Update Order Controller
- [ ] Add crypto payment option to order creation flow
- [ ] Return payment details with order response
- [ ] Add payment status to order detail endpoint

**Changes:**
```typescript
// In order.service.ts
async createOrder(userId: string, dto: OrderCreateDto) {
  // ... existing order creation logic

  // After order created, check if crypto payment requested
  if (dto.paymentMethod === 'CRYPTO') {
    const payment = await this.cryptoPaymentService.createPayment(
      order.id,
      dto.cryptocurrency,
      userId,
    );

    return {
      ...order,
      cryptoPayment: payment,
    };
  }

  return order;
}
```

**Acceptance Criteria:**
- ✅ Order creation includes crypto payment option
- ✅ Order response includes payment details
- ✅ Order status updates when payment confirmed

---

## 🧪 Testing Strategy

### Test Environment Setup

1. **Testnet Configuration**
   ```env
   # Use testnet RPCs
   BITCOIN_RPC_URL=https://testnet.blockchain.info
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   ```

2. **Test Wallet Setup**
   - Generate test mnemonics (DO NOT use production mnemonics!)
   - Fund testnet wallets with faucets
   - Create test platform wallets

### Test Scenarios

#### Scenario 1: Successful Payment Flow
1. User creates order ($100)
2. User selects BTC as payment method
3. System generates payment address
4. User sends BTC to address (testnet)
5. System detects payment within 60 seconds
6. System waits for 3 confirmations
7. Order status updated to PAYMENT_RECEIVED
8. Order auto-delivered (if instant delivery)
9. Notification sent to user

**Expected Result:** ✅ Order completed successfully

#### Scenario 2: Payment Expiration
1. User creates order
2. User selects ETH as payment method
3. System generates payment address
4. User does NOT send payment
5. After 15 minutes, payment expires
6. Order remains PENDING
7. User receives expiration notification

**Expected Result:** ✅ Payment expired, order still pending

#### Scenario 3: Partial Payment
1. User creates order ($100 = 0.001 BTC)
2. User sends only 0.0005 BTC (50%)
3. System detects partial payment
4. Payment status: PAID (but not confirmed)
5. System does NOT update order (insufficient amount)

**Expected Result:** ✅ Payment detected but not confirmed

#### Scenario 4: Multiple Concurrent Payments
1. Create 10 orders simultaneously
2. Generate 10 unique payment addresses
3. Send payments to all addresses
4. All payments detected and confirmed
5. No index collisions

**Expected Result:** ✅ All payments processed correctly

---

## 🔒 Security Considerations

### 1. Private Key Management

**Critical Security Measures:**
- ✅ **Never log private keys or mnemonics**
- ✅ **Encrypt private keys at rest** (AES-256-GCM)
- ✅ **Decrypt only when needed** (forwarding)
- ✅ **Use environment variables** for mnemonics
- ✅ **Restrict access** to encryption keys
- ✅ **Implement key rotation** strategy

**Encryption Implementation:**
```typescript
// Strong encryption settings
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits
const SALT_LENGTH = 16;
const ITERATIONS = 100000; // PBKDF2 iterations

// NEVER commit this to git
const MASTER_KEY = process.env.WALLET_ENCRYPTION_KEY;
```

### 2. Mnemonic Security

**Best Practices:**
- Store mnemonics in **AWS Secrets Manager** or **HashiCorp Vault**
- Never store mnemonics in code or config files
- Use different mnemonics for testnet vs production
- Implement mnemonic rotation policy
- Backup mnemonics securely (offline)

### 3. RPC Endpoint Security

**Recommendations:**
- Use authenticated RPC endpoints (API keys)
- Implement rate limiting
- Use HTTPS only
- Monitor for unusual activity
- Have fallback RPC providers

### 4. Payment Verification Security

**Validation Checks:**
- ✅ Verify payment amount exactly matches expected
- ✅ Wait for required confirmations (3+ for BTC, 12+ for ETH)
- ✅ Check transaction is actually confirmed on blockchain
- ✅ Prevent double-spending attacks
- ✅ Validate addresses before sending

### 5. API Security

**Implementation:**
- Rate limiting (10 requests/minute per user)
- Authentication required for all endpoints
- Input validation and sanitization
- CORS configuration
- Audit logging for sensitive operations

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Generate production mnemonics securely
- [ ] Store mnemonics in Secrets Manager
- [ ] Create platform wallet addresses
- [ ] Fund platform wallets with gas/fees (for forwarding)
- [ ] Configure RPC endpoints (Infura, Alchemy)
- [ ] Set up monitoring and alerting
- [ ] Test all payment flows on testnet
- [ ] Review security audit checklist

### Environment Variables

```env
# Production Configuration
NODE_ENV=production

# Blockchain RPCs (Use production endpoints)
BITCOIN_RPC_URL=https://mainnet.blockchain.info
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
LITECOIN_RPC_URL=...

# System Wallets (Store in AWS Secrets Manager)
SYSTEM_MNEMONIC_BTC=<fetch from secrets manager>
SYSTEM_MNEMONIC_ETH=<fetch from secrets manager>
SYSTEM_MNEMONIC_LTC=<fetch from secrets manager>

# Platform Wallets
PLATFORM_WALLET_BTC=<your BTC address>
PLATFORM_WALLET_ETH=<your ETH address>
PLATFORM_WALLET_LTC=<your LTC address>

# Encryption
WALLET_ENCRYPTION_KEY=<strong 32-byte key>

# Exchange Rate APIs
COINGECKO_API_KEY=<your key>
COINBASE_API_KEY=<your key>

# Payment Settings
PAYMENT_EXPIRATION_MINUTES=15
PAYMENT_MONITOR_INTERVAL_SECONDS=60
MIN_CONFIRMATIONS_BTC=3
MIN_CONFIRMATIONS_ETH=12
MIN_CONFIRMATIONS_LTC=6

# Features
ENABLE_PAYMENT_FORWARDING=false  # Set true if using forwarding
ENABLE_AUTO_DELIVERY=true
```

### Database Migration

```bash
# Generate migration
npm run prisma:migrate:dev --name add_crypto_payment

# Review migration SQL
cat prisma/migrations/<timestamp>_add_crypto_payment/migration.sql

# Apply to production
npm run prisma:migrate:deploy
```

### Post-Deployment

- [ ] Monitor payment queue health
- [ ] Check blockchain monitoring cron job
- [ ] Verify payment detection (test with small amount)
- [ ] Monitor error logs
- [ ] Set up alerts for:
  - Failed payment detections
  - Payment queue backlog
  - RPC endpoint failures
  - Low platform wallet balance (for forwarding)

### Monitoring Metrics

**Key Metrics to Track:**
- Payment creation rate
- Payment detection latency (target: <60s)
- Payment confirmation time
- Order completion time after payment
- Failed payment rate
- Expired payment rate
- RPC endpoint uptime

**Alerts:**
- 🚨 Payment detection failing (>5 min delay)
- 🚨 RPC endpoint down
- 🚨 Payment queue stuck (>100 jobs pending)
- 🚨 High error rate (>5% of payments)

---

## 📊 Success Metrics

### Phase 6 Success Criteria

- ✅ Can create payment for any supported cryptocurrency
- ✅ Payment address generated uniquely for each payment
- ✅ Payment detected within 60 seconds of blockchain confirmation
- ✅ Confirmation counting accurate
- ✅ Order status updated automatically after payment confirmed
- ✅ Auto-delivery works for instant delivery products
- ✅ Payment expiration handled correctly (15 min)
- ✅ No private key leaks or security issues
- ✅ System handles 100+ concurrent payments
- ✅ <1% payment detection failure rate
- ✅ 99.9% uptime for payment system

### Performance Targets

- **Payment Creation**: <500ms
- **Payment Detection**: <60s after blockchain confirmation
- **Confirmation Check**: <60s interval
- **Order Update**: <5s after confirmation
- **Auto-Delivery**: <10s after order completion

---

## 🔄 Future Enhancements (Post-Phase 6)

1. **Additional Cryptocurrencies**
   - Solana (SOL)
   - Polygon (MATIC)
   - Binance Smart Chain (BNB)
   - Tron (TRX)
   - Dogecoin (DOGE)

2. **Lightning Network**
   - Instant BTC payments
   - Lower fees
   - Better user experience

3. **Payment Forwarding Optimization**
   - Batch forwarding (multiple payments in one transaction)
   - Dynamic gas fee estimation
   - Retry with higher gas on failure

4. **Advanced Features**
   - Partial payment support (pay 50% now, 50% later)
   - Subscription payments (recurring)
   - Refund handling (return crypto to user)
   - Multi-signature wallets for platform wallets

5. **Analytics & Reporting**
   - Payment success rate dashboard
   - Revenue by cryptocurrency
   - Average confirmation time
   - Gas fee analytics

---

## 📚 References

### External Documentation

- [CoinPay Architecture Reference](./COINPAY_ARCHITECTURE.md)
- [Crypto Store Design](./CRYPTO_STORE_DESIGN.md)
- [BIP39 - Mnemonic Code](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP44 - Multi-Account Hierarchy](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [Ethers.js Documentation](https://docs.ethers.io/)
- [Bitcoin.js Documentation](https://github.com/bitcoinjs/bitcoinjs-lib)

### APIs

- [CoinGecko API](https://www.coingecko.com/en/api)
- [Infura Ethereum RPC](https://infura.io/)
- [Alchemy Blockchain APIs](https://www.alchemy.com/)
- [Blockchain.info API](https://www.blockchain.com/api)

---

## 📝 Notes

### Design Decisions

1. **Why HD Wallets?**
   - Generate unlimited unique addresses from single mnemonic
   - Secure and deterministic
   - Easy backup and recovery
   - Industry standard (BIP44)

2. **Why 15-Minute Expiration?**
   - Limits exchange rate volatility exposure
   - Creates urgency for users
   - Reduces monitoring overhead
   - Standard in crypto payment gateways

3. **Why System-Controlled Wallets?**
   - Enables payment forwarding
   - Platform can collect fees
   - No need for merchant to manage wallets
   - Simplifies user experience

4. **Why Not Use Third-Party Gateway?**
   - **Control**: Full control over payment flow
   - **Fees**: No third-party fees (true zero-fee)
   - **No KYC**: Direct blockchain integration
   - **Privacy**: No data shared with third parties
   - **Flexibility**: Can customize for specific needs

### Trade-offs

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Self-hosted** | Full control, no fees, privacy | Complex, requires blockchain expertise | ✅ **Chosen** - Best for long-term |
| **Third-party (NOWPayments)** | Easy integration, low maintenance | 1-2% fees, KYC for large volumes | ❌ Rejected - User pays fees |
| **BTCPay Server** | Open source, self-hosted, no fees | Complex setup, server management | 🤔 Consider for future |

### Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Private key leak** | Critical | Low | Strong encryption, secrets management, no logging |
| **Payment not detected** | High | Medium | Multiple RPC providers, alerting, manual verification |
| **Exchange rate volatility** | Medium | High | Short expiration window (15 min) |
| **Blockchain congestion** | Medium | Medium | Adjustable confirmations, gas fee monitoring |
| **RPC endpoint downtime** | High | Low | Multiple fallback providers |
| **Low platform wallet balance** | Medium | Low | Balance monitoring, auto-top-up alerts |

---

## ✅ Phase 6 Completion Checklist

### Core Features
- [ ] HD wallet system with BIP44 derivation
- [ ] Unique address generation per payment
- [ ] Private key encryption (AES-256-GCM)
- [ ] Exchange rate service with caching
- [ ] Blockchain monitoring (60s interval)
- [ ] Payment detection and verification
- [ ] Confirmation counting
- [ ] Payment expiration handling (15 min)
- [ ] QR code generation
- [ ] Order integration
- [ ] Notification integration

### Supported Cryptocurrencies
- [ ] Bitcoin (BTC)
- [ ] Ethereum (ETH)
- [ ] Litecoin (LTC)
- [ ] Bitcoin Cash (BCH)
- [ ] USDT (ERC-20)

### Security
- [ ] Private keys encrypted at rest
- [ ] Mnemonics stored in secrets manager
- [ ] No sensitive data in logs
- [ ] Rate limiting on APIs
- [ ] Input validation
- [ ] Security audit completed

### Testing
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] E2E payment flow tests
- [ ] Testnet validation
- [ ] Load testing (100+ concurrent payments)

### Documentation
- [ ] API documentation (Swagger)
- [ ] Admin guide
- [ ] Deployment guide
- [ ] Security best practices
- [ ] Troubleshooting guide

### Deployment
- [ ] Production mnemonics generated
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Initial testing completed

---

**Document Version**: 1.0
**Last Updated**: January 30, 2026
**Status**: Planning Complete - Ready for Implementation 🚀
