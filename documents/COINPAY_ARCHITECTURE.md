# Cryptocurrency Payment Gateway Architecture & Implementation Guide

> **Project**: CoinPay - Non-custodial Cryptocurrency Payment Gateway
> **Purpose**: Complete reference for implementing a crypto payment system
> **Target**: NestJS implementation or any backend framework
> **Date**: January 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Core Components](#3-core-components)
4. [Database Schema](#4-database-schema)
5. [Payment Flow](#5-payment-flow)
6. [Blockchain Integration](#6-blockchain-integration)
7. [Security Implementation](#7-security-implementation)
8. [API Design](#8-api-design)
9. [Webhook System](#9-webhook-system)
10. [Business Logic](#10-business-logic)
11. [Implementation Guidelines](#11-implementation-guidelines-for-nestjs)

---

## 1. System Overview

### 1.1 What is CoinPay?

CoinPay is a **non-custodial cryptocurrency payment gateway** that enables e-commerce merchants to accept crypto payments with:
- **Automatic fee handling** (tiered commission: 0.5% for paid tier, 1% for free tier)
- **Real-time transaction monitoring** via blockchain RPC
- **Automatic payment forwarding** to merchant wallets
- **Multi-blockchain support** (BTC, BCH, ETH, POL, SOL, USDC, DOGE, XRP, ADA, BNB, USDT)
- **15-minute payment window** with countdown timer
- **Webhook notifications** for payment events

### 1.2 Key Features

**For Merchants:**
- ✅ Multi-business support (one account, multiple businesses)
- ✅ Non-custodial (merchants control their funds)
- ✅ Real-time payment processing
- ✅ Automatic tiered fee handling (1% free tier, 0.5% paid tier)
- ✅ Webhook notifications
- ✅ Multiple wallet connections
- ✅ Payment analytics

**For Customers:**
- ✅ QR code payments
- ✅ Multiple blockchain support
- ✅ Real-time exchange rates
- ✅ Simple payment flow (15-minute window)
- ✅ No account required

**For Developers:**
- ✅ RESTful API
- ✅ CLI tool
- ✅ SDK/ESM module
- ✅ Webhook integration
- ✅ Comprehensive documentation

### 1.3 Supported Blockchains

| Blockchain | Symbol | Confirmations Required | Network Type |
|------------|--------|------------------------|--------------|
| Bitcoin | BTC | 3 | UTXO |
| Bitcoin Cash | BCH | 6 | UTXO |
| Ethereum | ETH | 12 | EVM |
| Polygon | POL | 128 | EVM |
| Solana | SOL | 32 | Solana |
| USDC (Ethereum) | USDC_ETH | 12 | ERC-20 |
| USDC (Polygon) | USDC_POL | 128 | ERC-20 |
| USDC (Solana) | USDC_SOL | 32 | SPL Token |
| Dogecoin | DOGE | 6 | UTXO |
| XRP | XRP | 10 | XRP Ledger |
| Cardano | ADA | 15 | Cardano |
| BNB | BNB | 12 | EVM |
| Tether | USDT | 12 | ERC-20 |

---

## 2. High-Level Architecture

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CoinPay Payment Gateway                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                                                   │
│  │   Customer   │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │           Payment Request (API)                           │      │
│  │  POST /api/payments/create                                │      │
│  │  {                                                         │      │
│  │    business_id, amount, blockchain,                       │      │
│  │    merchant_wallet_address                                │      │
│  │  }                                                         │      │
│  └──────────────────┬───────────────────────────────────────┘      │
│                     │                                                │
│                     ▼                                                │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │        SYSTEM WALLET (HD Wallet Derivation)             │       │
│  │  - Generate unique address from system mnemonic         │       │
│  │  - Derive path: m/44'/coin_type'/0'/0/index             │       │
│  │  - Encrypt & store private key                          │       │
│  │  - Calculate commission split:                           │       │
│  │    * Free tier (Starter): 1% platform, 99% merchant     │       │
│  │    * Paid tier (Pro): 0.5% platform, 99.5% merchant     │       │
│  └──────────────────┬──────────────────────────────────────┘       │
│                     │                                                │
│                     ▼                                                │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │         Payment Record Created                           │       │
│  │  - ID: pay_abc123                                        │       │
│  │  - Status: pending                                       │       │
│  │  - Expires: +15 minutes                                  │       │
│  │  - Address: generated from system wallet                │       │
│  └──────────────────┬──────────────────────────────────────┘       │
│                     │                                                │
│                     ▼                                                │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │      Customer Pays to System Address                     │       │
│  │  - QR code displayed                                     │       │
│  │  - Countdown timer (15 minutes)                          │       │
│  │  - Customer sends crypto                                 │       │
│  └──────────────────┬──────────────────────────────────────┘       │
│                     │                                                │
│                     ▼                                                │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │   BLOCKCHAIN MONITOR (Edge Function / Cron)             │       │
│  │  - Runs every 1 minute                                   │       │
│  │  - Checks blockchain balance via RPC                     │       │
│  │  - Detects incoming transactions                         │       │
│  │  - Waits for required confirmations                      │       │
│  │  - Expires payments after 15 minutes                     │       │
│  └──────────────────┬──────────────────────────────────────┘       │
│                     │                                                │
│         ┌───────────┴────────────┐                                  │
│         │                        │                                   │
│         ▼                        ▼                                   │
│  ┌─────────────┐         ┌──────────────┐                          │
│  │ No Payment  │         │ Payment      │                          │
│  │ Received    │         │ Detected     │                          │
│  └──────┬──────┘         └──────┬───────┘                          │
│         │                       │                                   │
│         ▼                       ▼                                   │
│  ┌─────────────┐         ┌──────────────────────────────────┐     │
│  │ Check       │         │ Status: confirmed                 │     │
│  │ Expiration  │         │ Send webhook: payment.confirmed   │     │
│  └──────┬──────┘         └──────┬───────────────────────────┘     │
│         │                       │                                   │
│         ▼                       ▼                                   │
│  ┌─────────────┐         ┌──────────────────────────────────┐     │
│  │ Expired?    │         │ FORWARDING SERVICE                │     │
│  │ Status:     │         │ - Decrypt private key             │     │
│  │ expired     │         │ - Split payment based on tier:    │     │
│  └─────────────┘         │   * Professional: 99.5% + 0.5%   │     │
│                          │   * Starter: 99% + 1%             │     │
│                          │ - Send to merchant wallet         │     │
│                          │ - Send to platform wallet         │     │
│                          │ - Update status: forwarded        │     │
│                          │ - Send webhook: payment.forwarded │     │
│                          └───────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Payment Status Flow

```
pending ──► confirmed ──► forwarding ──► forwarded
   │              ║             │
   │              ║             ▼
   │              ║       forwarding_failed
   │              ║             │
   │              ║             ▼
   │              ║        (retry) ──► forwarded
   │              ║
   │              ▼
   │        webhook: payment.confirmed
   │
   ▼
expired (after 15 min)
   │
   ▼
webhook: payment.expired
```

### 2.3 Commission System

**Two-Tier Pricing Model:**

| Tier | Monthly Cost | Transaction Limit | Platform Fee | Merchant Receives |
|------|--------------|-------------------|--------------|-------------------|
| **Starter (Free)** | $0 | 100 transactions | **1.0%** | **99.0%** |
| **Professional** | $49/month | Unlimited | **0.5%** | **99.5%** |

**Commission Calculation:**
```typescript
// Free tier (Starter): 1% platform fee
const commissionRateFree = 0.01;
const platformFeeFree = totalAmount * 0.01;  // 1%
const merchantAmountFree = totalAmount * 0.99;  // 99%

// Paid tier (Professional): 0.5% platform fee
const commissionRatePaid = 0.005;
const platformFeePaid = totalAmount * 0.005;  // 0.5%
const merchantAmountPaid = totalAmount * 0.995;  // 99.5%
```

---

## 3. Core Components

### 3.1 System Wallet Service

**Purpose:** Generate unique payment addresses from system's HD wallet for receiving customer payments.

**Key Concepts:**
- **System Controls Keys**: The platform (CoinPay) owns the HD wallet, NOT merchants
- **Unique Address per Payment**: Each payment gets a fresh address
- **Commission Collection**: System takes 0.5-1% fee before forwarding to merchant
- **Security**: Private keys encrypted at rest with AES-256-GCM

```typescript
/**
 * System Wallet Service
 *
 * This service manages the SYSTEM's HD wallet for generating unique payment addresses.
 * The system (CoinPay) owns these wallets, NOT the merchants.
 *
 * Payment Flow:
 * 1. Customer initiates payment
 * 2. System generates unique address from its HD wallet
 * 3. Customer pays to system's address
 * 4. After confirmation:
 *    - System takes commission (0.5% paid tier, 1% free tier)
 *    - System forwards remainder to merchant's wallet
 */

// BIP44 Derivation Paths
const DERIVATION_PATHS = {
  BTC: "m/44'/0'/0'/0/{index}",      // Bitcoin
  BCH: "m/44'/145'/0'/0/{index}",    // Bitcoin Cash
  ETH: "m/44'/60'/0'/0/{index}",     // Ethereum (also for POL, BNB)
  SOL: "m/44'/501'/{index}'/0'",     // Solana
  DOGE: "m/44'/3'/0'/0/{index}",     // Dogecoin
  XRP: "m/44'/144'/0'/0/{index}",    // XRP
  ADA: "m/44'/1815'/{index}'/0'",    // Cardano
};

// Commission rates by tier
const COMMISSION_RATE_FREE = 0.01;   // 1% for free tier
const COMMISSION_RATE_PAID = 0.005;  // 0.5% for paid tier

interface SystemWalletConfig {
  cryptocurrency: string;
  mnemonic: string;  // Encrypted mnemonic for system wallet
  commission_wallet: string;  // Platform's wallet address
  next_index: number;  // Next derivation index
}

interface PaymentAddressInfo {
  payment_id: string;
  address: string;
  cryptocurrency: string;
  derivation_index: number;
  encrypted_private_key: string;
  merchant_wallet: string;  // Where to forward funds
  commission_wallet: string;  // Platform's fee wallet
  amount_expected: number;
  commission_amount: number;  // Based on subscription tier
  merchant_amount: number;
}

async function generatePaymentAddress(
  paymentId: string,
  businessId: string,
  cryptocurrency: string,
  merchantWallet: string,
  amountCrypto: number,
  isPaidTier: boolean  // Determines commission rate
): Promise<PaymentAddressInfo> {
  // 1. Get next available index for this cryptocurrency
  const index = await getNextIndex(cryptocurrency);

  // 2. Derive address from system mnemonic
  const mnemonic = getSystemMnemonic(cryptocurrency);
  const { address, privateKey } = await deriveAddress(mnemonic, cryptocurrency, index);

  // 3. Encrypt private key for storage
  const encryptedKey = await encrypt(privateKey, ENCRYPTION_KEY);

  // 4. Calculate commission split based on tier
  const commissionRate = isPaidTier ? COMMISSION_RATE_PAID : COMMISSION_RATE_FREE;
  const commissionAmount = amountCrypto * commissionRate;
  const merchantAmount = amountCrypto - commissionAmount;

  // 5. Store payment address record
  return {
    payment_id: paymentId,
    address,
    cryptocurrency,
    derivation_index: index,
    encrypted_private_key: encryptedKey,
    merchant_wallet: merchantWallet,
    commission_wallet: getPlatformWallet(cryptocurrency),
    amount_expected: amountCrypto,
    commission_amount: commissionAmount,
    merchant_amount: merchantAmount,
  };
}
```

### 3.2 Blockchain Monitor

**Purpose:** Monitor blockchain for incoming payments and track confirmations.

**Implementation Options:**
1. **Supabase Edge Function** (current): Runs every minute via cron
2. **Serverless Function** (Vercel, AWS Lambda): Scheduled execution
3. **Background Job** (Bull, BullMQ): Queue-based processing
4. **Dedicated Service**: Standalone monitoring service

```typescript
/**
 * Blockchain Monitor
 *
 * Monitors pending payments for incoming transactions
 * and updates payment status when funds are detected.
 */

interface MonitoringConfig {
  checkInterval: number;  // 60 seconds (1 minute)
  expirationMinutes: number;  // 15 minutes
  maxPaymentsPerRun: number;  // 100 payments
}

async function monitorPayments() {
  // 1. Expire old pending payments (>15 minutes)
  await expirePendingPayments();

  // 2. Get active pending payments
  const pendingPayments = await getPendingPayments({
    limit: 100,
    notExpired: true,
  });

  // 3. Check each payment on blockchain
  for (const payment of pendingPayments) {
    try {
      // Get balance from blockchain via RPC
      const balance = await checkBalance(
        payment.blockchain,
        payment.payment_address
      );

      if (balance >= payment.crypto_amount) {
        // 4. Payment detected! Update status
        await updatePaymentStatus(payment.id, {
          status: 'confirmed',
          customer_paid_amount: balance,
          confirmed_at: new Date(),
        });

        // 5. Send webhook notification
        await sendWebhook(payment.business_id, payment.id, 'payment.confirmed', {
          amount_crypto: balance,
          payment_address: payment.payment_address,
          tx_hash: await getTxHash(payment.blockchain, payment.payment_address),
        });

        // 6. Trigger forwarding
        await triggerForwarding(payment.id);
      }
    } catch (error) {
      console.error(`Error monitoring payment ${payment.id}:`, error);
    }
  }
}

async function checkBalance(blockchain: string, address: string): Promise<number> {
  const rpcUrl = getRpcUrl(blockchain);
  const provider = getProvider(blockchain, rpcUrl);

  const balance = await provider.getBalance(address);
  return parseFloat(balance);
}
```

### 3.3 Payment Forwarding Service

**Purpose:** Split and forward payments to merchant and platform wallets after confirmation.

```typescript
/**
 * Payment Forwarding Service
 *
 * Splits confirmed payments and forwards to:
 * 1. Merchant wallet (99% or 99.5% depending on tier)
 * 2. Platform fee wallet (1% or 0.5% depending on tier)
 */

interface ForwardingInput {
  paymentId: string;
  paymentAddress: string;
  merchantWalletAddress: string;
  platformWalletAddress: string;
  totalAmount: number;
  blockchain: string;
  privateKey: string;
  isPaidTier: boolean;  // Determines commission split
}

async function forwardPayment(input: ForwardingInput): Promise<ForwardingResult> {
  // 1. Calculate split amounts based on subscription tier
  const commissionRate = input.isPaidTier ? 0.005 : 0.01;  // 0.5% or 1%
  const platformFee = input.totalAmount * commissionRate;
  const merchantAmount = input.totalAmount - platformFee;

  // 2. Update status to forwarding
  await updatePaymentStatus(input.paymentId, 'forwarding');

  try {
    // 3. Send to merchant wallet
    const merchantTxHash = await sendTransaction({
      from: input.paymentAddress,
      to: input.merchantWalletAddress,
      amount: merchantAmount,
      privateKey: input.privateKey,
      blockchain: input.blockchain,
    });

    // 4. Send platform fee
    const platformTxHash = await sendTransaction({
      from: input.paymentAddress,
      to: input.platformWalletAddress,
      amount: platformFee,
      privateKey: input.privateKey,
      blockchain: input.blockchain,
    });

    // 5. Update payment record
    await updatePaymentForwarded(input.paymentId, {
      status: 'forwarded',
      merchant_amount: merchantAmount,
      fee_amount: platformFee,
      forward_tx_hash: merchantTxHash,
      forwarded_at: new Date(),
    });

    // 6. Send webhook
    await sendWebhook(businessId, input.paymentId, 'payment.forwarded', {
      merchant_amount: merchantAmount,
      platform_fee: platformFee,
      merchant_tx_hash: merchantTxHash,
      platform_tx_hash: platformTxHash,
    });

    return {
      success: true,
      merchantTxHash,
      platformTxHash,
      merchantAmount,
      platformFee,
    };
  } catch (error) {
    // Mark as failed for retry
    await updatePaymentStatus(input.paymentId, 'forwarding_failed', {
      error: error.message,
    });
    throw error;
  }
}
```

### 3.4 Webhook Service

**Purpose:** Notify merchants of payment events via HTTP callbacks.

```typescript
/**
 * Webhook Service
 *
 * Sends signed webhook notifications to merchant endpoints
 * for payment lifecycle events.
 */

type WebhookEvent =
  | 'payment.confirmed'
  | 'payment.forwarded'
  | 'payment.expired'
  | 'payment.failed';

interface WebhookPayload {
  id: string;  // Event ID
  type: WebhookEvent;
  data: {
    payment_id: string;
    status: string;
    amount_crypto: string;
    amount_usd: string;
    currency: string;
    // ... additional event-specific fields
  };
  created_at: string;
  business_id: string;
}

function signWebhookPayload(payload: WebhookPayload, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;

  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

async function sendWebhook(
  businessId: string,
  paymentId: string,
  event: WebhookEvent,
  data: any
): Promise<void> {
  // 1. Get business webhook config
  const business = await getBusinessWebhookConfig(businessId);
  if (!business.webhook_url) return;

  // 2. Build payload
  const payload: WebhookPayload = {
    id: `evt_${paymentId}_${Date.now()}`,
    type: event,
    data: {
      payment_id: paymentId,
      ...data,
    },
    created_at: new Date().toISOString(),
    business_id: businessId,
  };

  // 3. Sign payload
  const signature = signWebhookPayload(payload, business.webhook_secret);

  // 4. Deliver with retries (exponential backoff: 1s, 2s, 4s)
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(business.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CoinPay-Signature': signature,
          'User-Agent': 'CoinPay-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        await logWebhookAttempt({
          business_id: businessId,
          payment_id: paymentId,
          event,
          success: true,
          status_code: response.status,
          attempt: attempt + 1,
        });
        return;
      }
    } catch (error) {
      await logWebhookAttempt({
        business_id: businessId,
        payment_id: paymentId,
        event,
        success: false,
        error_message: error.message,
        attempt: attempt + 1,
      });

      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
    attempt++;
  }
}
```

### 3.5 Exchange Rate Service

**Purpose:** Get real-time cryptocurrency prices from external APIs.

```typescript
/**
 * Exchange Rate Service
 *
 * Fetches real-time crypto prices from:
 * - Primary: Tatum API (requires API key)
 * - Fallback: Kraken API (free, no key required)
 */

const CACHE_TTL = 5 * 60 * 1000;  // 5 minutes
const rateCache = new Map<string, CachedRate>();

async function getExchangeRate(from: string, to: string): Promise<number> {
  // 1. Check cache
  const cacheKey = `${from}_${to}`;
  const cached = rateCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.value;
  }

  // 2. Fetch from API
  let rate: number;
  try {
    // Primary: Tatum
    rate = await getExchangeRateFromTatum(from, to);
  } catch (error) {
    // Fallback: Kraken
    console.warn('Tatum failed, using Kraken:', error.message);
    rate = await getExchangeRateFromKraken(from, to);
  }

  // 3. Cache result
  rateCache.set(cacheKey, {
    value: rate,
    timestamp: Date.now(),
  });

  return rate;
}

async function getCryptoPrice(
  fiatAmount: number,
  fiatCurrency: string,
  cryptoCurrency: string
): Promise<number> {
  const rate = await getExchangeRate(cryptoCurrency, fiatCurrency);
  const cryptoAmount = fiatAmount / rate;

  // Round to 8 decimal places (crypto standard)
  return Math.round(cryptoAmount * 100000000) / 100000000;
}
```

---

## 4. Database Schema

### 4.1 Core Tables

#### merchants
```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchants_email ON merchants(email);
```

#### businesses
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_events JSONB DEFAULT '["payment.confirmed", "payment.forwarded"]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_merchant_id ON businesses(merchant_id);
CREATE INDEX idx_businesses_active ON businesses(active);
```

#### payment_addresses
```sql
CREATE TABLE payment_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  cryptocurrency TEXT NOT NULL CHECK (cryptocurrency IN (
    'BTC', 'BCH', 'ETH', 'POL', 'SOL',
    'USDC_ETH', 'USDC_POL', 'USDC_SOL',
    'DOGE', 'XRP', 'ADA', 'BNB', 'USDT'
  )),
  address TEXT UNIQUE NOT NULL,
  derivation_index INTEGER NOT NULL,
  derivation_path TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  merchant_wallet TEXT NOT NULL,
  commission_wallet TEXT NOT NULL,
  amount_expected NUMERIC(30, 18) NOT NULL,
  commission_amount NUMERIC(30, 18) NOT NULL,
  merchant_amount NUMERIC(30, 18) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_addresses_payment_id ON payment_addresses(payment_id);
CREATE INDEX idx_payment_addresses_cryptocurrency ON payment_addresses(cryptocurrency);
CREATE UNIQUE INDEX idx_payment_addresses_address ON payment_addresses(address);
```

#### payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Fiat amount info
  amount NUMERIC(20, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Crypto amount info
  blockchain TEXT NOT NULL,
  crypto_amount NUMERIC(30, 18),
  crypto_currency TEXT,
  payment_address TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'forwarding', 'forwarded',
    'forwarding_failed', 'failed', 'expired'
  )),

  -- Payment amounts
  customer_paid_amount NUMERIC(30, 18),
  merchant_amount NUMERIC(30, 18),
  fee_amount NUMERIC(30, 18),

  -- Transaction hashes
  tx_hash TEXT,  -- Incoming transaction
  forward_tx_hash TEXT,  -- Merchant payment transaction

  -- Confirmations
  confirmations INTEGER DEFAULT 0,

  -- Merchant wallet
  merchant_wallet_address TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
  confirmed_at TIMESTAMPTZ,
  forwarded_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_blockchain ON payments(blockchain);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_expires_at ON payments(expires_at);
CREATE INDEX idx_payments_status_expires ON payments(status, expires_at) WHERE status = 'pending';
```

#### webhook_logs
```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  status_code INTEGER,
  error_message TEXT,
  attempt_number INTEGER DEFAULT 1,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_business_id ON webhook_logs(business_id);
CREATE INDEX idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
```

#### system_wallet_indexes
```sql
CREATE TABLE system_wallet_indexes (
  cryptocurrency TEXT PRIMARY KEY,
  next_index INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Database Functions

#### Auto-expire pending payments
```sql
CREATE OR REPLACE FUNCTION expire_pending_payments()
RETURNS TABLE (expired_count INTEGER)
AS $$
BEGIN
  UPDATE payments
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
```

#### Get pending payments for monitoring
```sql
CREATE OR REPLACE FUNCTION get_pending_payments_for_monitoring(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  blockchain TEXT,
  crypto_amount NUMERIC,
  payment_address TEXT,
  expires_at TIMESTAMPTZ,
  time_remaining INTERVAL
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.blockchain, p.crypto_amount, p.payment_address, p.expires_at,
    (p.expires_at - NOW()) AS time_remaining
  FROM payments p
  WHERE p.status = 'pending'
  AND p.expires_at > NOW()
  AND p.payment_address IS NOT NULL
  ORDER BY p.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Payment Flow

### 5.1 Complete Payment Lifecycle

```
┌────────────────────────────────────────────────────────────────────┐
│                    PAYMENT CREATION FLOW                            │
└────────────────────────────────────────────────────────────────────┘

1. Merchant sends POST /api/payments/create
   {
     business_id: "biz_123",
     amount: 100.00,
     currency: "USD",
     blockchain: "ETH",
     merchant_wallet_address: "0xmerchant...",
     metadata: { order_id: "ORDER-123" }
   }

2. System fetches real-time exchange rate
   - getCryptoPrice(100, "USD", "ETH") → 0.0456 ETH
   - Adds estimated network fee (~$2-5 USD in crypto)

3. System creates payment record
   - Status: pending
   - Expires: NOW() + 15 minutes
   - Crypto amount: 0.0456 ETH (includes network fee)

4. System generates unique payment address
   - Get next index for ETH: 42
   - Derive address from system mnemonic: m/44'/60'/0'/0/42
   - Generated address: 0x1234...5678
   - Encrypt private key with AES-256-GCM
   - Calculate split (check subscription tier):
     * If Professional (paid): 99.5% merchant, 0.5% platform
     * If Starter (free): 99% merchant, 1% platform

5. Store payment address record
   - Links payment_id to address
   - Stores encrypted private key
   - Records merchant & commission wallets
   - Saves split amounts based on tier

6. Generate QR code
   - Format: ethereum:0x1234...5678?value=0.0456
   - Encode as PNG image (data URL)

7. Return payment details to merchant
   {
     payment: {
       id: "pay_abc123",
       payment_address: "0x1234...5678",
       crypto_amount: "0.0456",
       qr_code: "data:image/png;base64,...",
       expires_at: "2024-01-01T00:15:00Z",
       status: "pending"
     }
   }

8. Merchant displays to customer
   - QR code for scanning
   - Address for manual entry
   - Countdown timer (15:00)
   - Amount and blockchain

┌────────────────────────────────────────────────────────────────────┐
│                    PAYMENT MONITORING FLOW                          │
└────────────────────────────────────────────────────────────────────┘

9. Monitor function runs (every 1 minute)
   - Get all pending payments not expired
   - For each payment:
     a. Check blockchain balance via RPC
     b. If balance >= crypto_amount:
        - Update status: confirmed
        - Record customer_paid_amount
        - Send webhook: payment.confirmed
        - Trigger forwarding
     c. If expires_at < NOW():
        - Update status: expired
        - Send webhook: payment.expired

┌────────────────────────────────────────────────────────────────────┐
│                    PAYMENT FORWARDING FLOW                          │
└────────────────────────────────────────────────────────────────────┘

10. Forwarding triggered for confirmed payment
    - Get payment address record
    - Decrypt private key
    - Check subscription tier for split calculation:
      * Professional: platformFee = amount * 0.005 (0.5%)
      * Starter: platformFee = amount * 0.01 (1%)

11. Send merchant portion
    - From: 0x1234...5678 (system address)
    - To: merchant_wallet_address
    - Amount: merchant_amount (99% or 99.5%)
    - Get tx hash: 0xmerchant...

12. Send platform fee
    - From: 0x1234...5678 (system address)
    - To: commission_wallet (platform)
    - Amount: commission_amount (1% or 0.5%)
    - Get tx hash: 0xplatform...

13. Update payment record
    - Status: forwarded
    - merchant_amount: 0.0453 ETH (for paid tier)
    - fee_amount: 0.0003 ETH (for paid tier)
    - forward_tx_hash: 0xmerchant...
    - forwarded_at: NOW()

14. Send webhook: payment.forwarded
    {
      type: "payment.forwarded",
      data: {
        payment_id: "pay_abc123",
        merchant_amount: 0.0453,
        platform_fee: 0.0003,
        merchant_tx_hash: "0xmerchant...",
        platform_tx_hash: "0xplatform...",
        status: "forwarded"
      }
    }

15. Merchant fulfills order
    - Receives webhook
    - Verifies signature
    - Updates order status: paid
    - Ships product / activates service
```

### 5.2 15-Minute Payment Window

**Why 15 minutes?**
1. **Cryptocurrency volatility**: Limits exposure to price fluctuations
2. **User experience**: Creates urgency without being too restrictive
3. **Resource efficiency**: Prevents indefinite address monitoring
4. **Security**: Reduces window for potential attacks

**Implementation:**
```typescript
// When creating payment
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 15);

// In monitor function
async function checkExpiration() {
  const expiredPayments = await database.payments
    .update({ status: 'expired', updated_at: NOW() })
    .where('status', '=', 'pending')
    .where('expires_at', '<', NOW())
    .returning('*');

  for (const payment of expiredPayments) {
    await sendWebhook(payment.business_id, payment.id, 'payment.expired', {
      reason: 'Payment window expired (15 minutes)',
      expired_at: new Date().toISOString(),
    });
  }
}
```

**Frontend countdown timer:**
```typescript
function PaymentCountdown({ expiresAt, onExpired }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(expiresAt);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={timeLeft < 60 ? 'text-red-500 animate-pulse' : ''}>
      ⏰ {formatTime(timeLeft)} remaining
    </div>
  );
}
```

---

## 6. Blockchain Integration

### 6.1 HD Wallet Derivation

**BIP39 Mnemonic:**
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

**BIP44 Derivation Paths:**
```
Bitcoin (BTC):     m/44'/0'/0'/0/{index}
Bitcoin Cash (BCH): m/44'/145'/0'/0/{index}
Ethereum (ETH):    m/44'/60'/0'/0/{index}
Polygon (POL):     m/44'/60'/0'/0/{index}  (same as ETH)
Solana (SOL):      m/44'/501'/{index}'/0'
Dogecoin (DOGE):   m/44'/3'/0'/0/{index}
XRP:               m/44'/144'/0'/0/{index}
Cardano (ADA):     m/44'/1815'/{index}'/0'
```

**Implementation:**
```typescript
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { ethers } from 'ethers';

// Bitcoin address derivation
function deriveBitcoinAddress(mnemonic: string, index: number) {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const path = `m/44'/0'/0'/0/${index}`;
  const child = hdKey.derive(path);

  const { address } = bitcoin.payments.p2pkh({
    pubkey: Buffer.from(child.publicKey!),
    network: bitcoin.networks.bitcoin,
  });

  return {
    address,
    privateKey: Buffer.from(child.privateKey!).toString('hex'),
  };
}

// Ethereum address derivation
function deriveEthereumAddress(mnemonic: string, index: number) {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const path = `m/44'/60'/0'/0/${index}`;
  const child = hdKey.derive(path);

  const privateKeyHex = '0x' + Buffer.from(child.privateKey!).toString('hex');
  const wallet = new ethers.Wallet(privateKeyHex);

  return {
    address: wallet.address,
    privateKey: Buffer.from(child.privateKey!).toString('hex'),
  };
}
```

### 6.2 RPC Provider Integration

```typescript
/**
 * Blockchain providers for monitoring and transactions
 */

interface BlockchainProvider {
  getBalance(address: string): Promise<string>;
  sendTransaction(from: string, to: string, amount: string, privateKey: string): Promise<string>;
  getTransactionReceipt(txHash: string): Promise<any>;
}

// Bitcoin provider
class BitcoinProvider implements BlockchainProvider {
  constructor(private rpcUrl: string) {}

  async getBalance(address: string): Promise<string> {
    // Use BlockCypher or similar API
    const response = await fetch(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`
    );
    const data = await response.json();
    return (data.balance / 100000000).toString();  // Convert satoshis to BTC
  }

  async sendTransaction(from: string, to: string, amount: string, privateKey: string): Promise<string> {
    // Build and sign Bitcoin transaction
    // Broadcast to network
    // Return transaction hash
  }
}

// Ethereum provider
class EthereumProvider implements BlockchainProvider {
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async sendTransaction(from: string, to: string, amount: string, privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey, this.provider);

    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });

    await tx.wait();
    return tx.hash;
  }

  async getTransactionReceipt(txHash: string) {
    return await this.provider.getTransactionReceipt(txHash);
  }
}

// Factory function
function getProvider(blockchain: string, rpcUrl: string): BlockchainProvider {
  switch (blockchain) {
    case 'BTC':
    case 'BCH':
      return new BitcoinProvider(rpcUrl);
    case 'ETH':
    case 'POL':
      return new EthereumProvider(rpcUrl);
    case 'SOL':
      return new SolanaProvider(rpcUrl);
    default:
      throw new Error(`Unsupported blockchain: ${blockchain}`);
  }
}
```

### 6.3 Network Fee Handling

```typescript
/**
 * Network fee estimation and inclusion
 *
 * The payment amount includes estimated network fees so merchants
 * receive the full requested amount after forwarding.
 */

const STATIC_NETWORK_FEES_USD = {
  BTC: 5.0,    // ~$5 for Bitcoin
  ETH: 3.0,    // ~$3 for Ethereum
  POL: 0.5,    // ~$0.50 for Polygon
  SOL: 0.01,   // ~$0.01 for Solana
  BCH: 0.1,    // ~$0.10 for Bitcoin Cash
};

async function getEstimatedNetworkFee(blockchain: string): Promise<number> {
  // Use static fees or fetch from Tatum/Etherscan
  return STATIC_NETWORK_FEES_USD[blockchain] || 1.0;
}

// Add network fee to payment amount
const networkFeeUsd = await getEstimatedNetworkFee(blockchain);
const totalAmountUsd = requestedAmount + networkFeeUsd;
const cryptoAmount = await getCryptoPrice(totalAmountUsd, currency, cryptoCurrency);

// Store in metadata
metadata: {
  network_fee_usd: networkFeeUsd,
  total_amount_usd: totalAmountUsd,
  requested_amount_usd: requestedAmount,
}
```

---

## 7. Security Implementation

### 7.1 Private Key Encryption

**AES-256-GCM with PBKDF2:**
```typescript
import crypto from 'crypto';

function encryptPrivateKey(privateKey: string, masterKey: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);

  // Derive encryption key from master key
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');

  // Encrypt with AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: salt:iv:authTag:ciphertext
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptPrivateKey(encryptedKey: string, masterKey: string): string {
  const [saltHex, ivHex, authTagHex, encrypted] = encryptedKey.split(':');

  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  // Derive decryption key
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');

  // Decrypt
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 7.2 Password Hashing

**Bcrypt with cost factor 12:**
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 7.3 JWT Token Security

```typescript
import jwt from 'jsonwebtoken';

function generateToken(merchantId: string, email: string): string {
  return jwt.sign(
    { merchantId, email },
    process.env.JWT_SECRET!,
    {
      expiresIn: '24h',
      issuer: 'coinpayportal.com',
      audience: 'coinpayportal-api'
    }
  );
}

function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuer: 'coinpayportal.com',
    audience: 'coinpayportal-api'
  });
}
```

### 7.4 Webhook Signature Verification

```typescript
import crypto from 'crypto';

function signWebhookPayload(payload: object, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;

  const signature = crypto.createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

function verifyWebhookSignature(
  payload: object,
  signature: string,
  secret: string,
  tolerance: number = 300
): boolean {
  // Parse signature header (format: t=timestamp,v1=signature)
  const parts = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts['t'];
  const receivedSig = parts['v1'];

  // Check timestamp tolerance (prevent replay attacks)
  const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (Math.abs(timestampAge) > tolerance) return false;

  // Compute expected signature
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const expectedSig = crypto.createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(receivedSig, 'hex'),
    Buffer.from(expectedSig, 'hex')
  );
}
```

---

## 8. API Design

### 8.1 Core Endpoints

#### POST /api/payments/create
```typescript
// Request
{
  business_id: string;
  amount: number;
  currency: string;
  blockchain: string;
  merchant_wallet_address?: string;  // Optional
  metadata?: Record<string, any>;
}

// Response
{
  success: true,
  payment: {
    id: string;
    payment_address: string;
    crypto_amount: string;
    qr_code: string;  // Base64 PNG
    expires_at: string;
    status: 'pending';
  }
}
```

#### GET /api/payments/:id
```typescript
// Response
{
  success: true,
  payment: {
    id: string;
    status: 'pending' | 'confirmed' | 'forwarded' | 'expired';
    amount: number;
    crypto_amount: string;
    payment_address: string;
    merchant_wallet_address: string;
    tx_hash?: string;
    forward_tx_hash?: string;
    merchant_amount?: number;
    fee_amount?: number;
    expires_at: string;
    created_at: string;
    confirmed_at?: string;
    forwarded_at?: string;
  }
}
```

#### GET /api/supported-coins
```typescript
// Response
{
  success: true,
  coins: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      is_active: true,
      has_wallet: true
    },
    // ... more coins
  ]
}
```

### 8.2 Authentication

**API Key (for merchants):**
```
Authorization: Bearer cp_live_xxxxxxxxxxxxxxxxxxxxx
```

**JWT Token (for dashboard):**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 8.3 Error Handling

```typescript
{
  success: false,
  error: {
    code: 'PAYMENT_EXPIRED',
    message: 'Payment request has expired',
    details: {
      expires_at: '2024-01-01T00:15:00Z'
    }
  }
}
```

---

## 9. Webhook System

### 9.1 Webhook Events

| Event | Description | When Sent |
|-------|-------------|-----------|
| `payment.confirmed` | Payment confirmed on blockchain | After required confirmations |
| `payment.forwarded` | Funds forwarded to merchant | After successful forwarding |
| `payment.expired` | Payment request expired | After 15 minutes without payment |
| `payment.failed` | Payment or forwarding failed | On error |

### 9.2 Webhook Payload Format

```typescript
{
  id: string;  // Event ID: evt_payment123_timestamp
  type: 'payment.confirmed' | 'payment.forwarded' | 'payment.expired';
  data: {
    payment_id: string;
    status: string;
    amount_crypto: string;
    amount_usd: string;
    currency: string;
    // Event-specific fields
    merchant_amount?: number;
    platform_fee?: number;
    tx_hash?: string;
    metadata?: Record<string, any>;
  };
  created_at: string;
  business_id: string;
}
```

### 9.3 Webhook Security

**Headers:**
```
Content-Type: application/json
X-CoinPay-Signature: t=1702234567,v1=5d41402abc4b2a76b9719d911017c592
User-Agent: CoinPay-Webhook/1.0
```

**Verification:**
```typescript
import crypto from 'crypto';

function verifyWebhook(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  // Parse signature
  const parts = signature.split(',');
  const timestamp = parts[0].split('=')[1];
  const receivedSig = parts[1].split('=')[1];

  // Check timestamp (5 min tolerance)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (Math.abs(age) > 300) return false;

  // Compute expected signature
  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(receivedSig, 'hex'),
    Buffer.from(expectedSig, 'hex')
  );
}
```

### 9.4 Webhook Retry Strategy

**Exponential Backoff:**
- Attempt 1: Immediate
- Attempt 2: Wait 1 second
- Attempt 3: Wait 2 seconds
- Max 3 attempts

```typescript
async function deliverWebhookWithRetry(url: string, payload: object, secret: string) {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CoinPay-Signature': signWebhookPayload(payload, secret),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        return { success: true, attempts: attempt + 1 };
      }
    } catch (error) {
      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  return { success: false, attempts: maxRetries };
}
```

---

## 10. Business Logic

### 10.1 Commission Calculation

**Tiered Commission System:**
```typescript
// Subscription tiers
enum SubscriptionTier {
  STARTER = 'starter',        // Free tier
  PROFESSIONAL = 'professional'  // Paid tier ($49/month)
}

// Fee percentages
const FEE_PERCENTAGE_FREE = 0.01;   // 1% for Starter
const FEE_PERCENTAGE_PAID = 0.005;  // 0.5% for Professional

function calculateCommission(
  totalAmount: number,
  isPaidTier: boolean
): { commission: number; merchant: number; rate: number } {
  const rate = isPaidTier ? FEE_PERCENTAGE_PAID : FEE_PERCENTAGE_FREE;
  const commission = totalAmount * rate;
  const merchant = totalAmount - commission;

  return { commission, merchant, rate };
}

// Example calculations
// Professional tier (paid):
const paidExample = calculateCommission(1.0, true);
// { commission: 0.005 (0.5%), merchant: 0.995 (99.5%), rate: 0.005 }

// Starter tier (free):
const freeExample = calculateCommission(1.0, false);
// { commission: 0.01 (1%), merchant: 0.99 (99%), rate: 0.01 }
```

### 10.2 Entitlements & Limits

**Transaction Limits:**
```typescript
interface EntitlementLimits {
  monthly_transactions: number | null;  // null = unlimited
  is_unlimited: boolean;
}

const PLAN_LIMITS = {
  starter: {
    monthly_transactions: 100,
    is_unlimited: false,
  },
  professional: {
    monthly_transactions: null,
    is_unlimited: true,
  },
};

async function checkTransactionLimit(businessId: string): Promise<boolean> {
  const plan = await getBusinessPlan(businessId);

  if (plan.limits.is_unlimited) return true;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const count = await database.payments
    .count()
    .where('business_id', businessId)
    .where('created_at', '>=', `${currentMonth}-01`)
    .first();

  return count < plan.limits.monthly_transactions;
}
```

### 10.3 Payment Expiration

**15-Minute Window:**
```typescript
const PAYMENT_EXPIRATION_MINUTES = 15;

function calculateExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + PAYMENT_EXPIRATION_MINUTES);
  return expiresAt;
}

function isPaymentExpired(payment: Payment): boolean {
  if (!payment.expires_at) return false;
  return new Date(payment.expires_at) < new Date();
}

function getTimeRemaining(payment: Payment): number {
  if (!payment.expires_at) return 0;
  const expiresAt = new Date(payment.expires_at);
  const now = new Date();
  const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  return remaining;
}
```

---

## 11. Implementation Guidelines for NestJS

### 11.1 Project Structure

```
src/
├── app.module.ts
├── main.ts
├── config/
│   ├── database.config.ts
│   ├── blockchain.config.ts
│   └── security.config.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── api-key.guard.ts
│   │   └── strategies/
│   │       ├── jwt.strategy.ts
│   │       └── api-key.strategy.ts
│   ├── payments/
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── dto/
│   │   │   ├── create-payment.dto.ts
│   │   │   └── payment-response.dto.ts
│   │   └── entities/
│   │       └── payment.entity.ts
│   ├── blockchain/
│   │   ├── blockchain.module.ts
│   │   ├── blockchain.service.ts
│   │   ├── monitor.service.ts
│   │   ├── forwarding.service.ts
│   │   └── providers/
│   │       ├── bitcoin.provider.ts
│   │       ├── ethereum.provider.ts
│   │       └── solana.provider.ts
│   ├── wallet/
│   │   ├── wallet.module.ts
│   │   ├── wallet.service.ts
│   │   └── system-wallet.service.ts
│   ├── webhooks/
│   │   ├── webhooks.module.ts
│   │   ├── webhooks.service.ts
│   │   └── webhook-delivery.service.ts
│   ├── business/
│   │   ├── business.module.ts
│   │   ├── business.controller.ts
│   │   └── business.service.ts
│   ├── entitlements/
│   │   ├── entitlements.module.ts
│   │   ├── entitlements.service.ts
│   │   └── guards/
│   │       └── entitlement.guard.ts
│   └── rates/
│       ├── rates.module.ts
│       └── rates.service.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
│       ├── encryption.util.ts
│       └── crypto.util.ts
└── database/
    ├── migrations/
    └── seeds/
```

### 11.2 Module Implementation Examples

#### Payments Module

**payments.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { WalletModule } from '../wallet/wallet.module';
import { RatesModule } from '../rates/rates.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    BlockchainModule,
    WalletModule,
    RatesModule,
    WebhooksModule,
    EntitlementsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
```

**payments.service.ts:**
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { SystemWalletService } from '../wallet/system-wallet.service';
import { RatesService } from '../rates/rates.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private systemWalletService: SystemWalletService,
    private ratesService: RatesService,
    private entitlementsService: EntitlementsService,
  ) {}

  async createPayment(dto: CreatePaymentDto) {
    // 1. Check transaction limits
    const canCreate = await this.entitlementsService.checkTransactionLimit(dto.business_id);
    if (!canCreate) {
      throw new BadRequestException('Monthly transaction limit reached');
    }

    // 2. Get exchange rate and calculate crypto amount
    const cryptoCurrency = dto.blockchain.startsWith('USDC_')
      ? 'USDC'
      : dto.blockchain;

    // Add network fee to amount
    const networkFee = await this.getNetworkFee(dto.blockchain);
    const totalAmountUsd = dto.amount + networkFee;

    const cryptoAmount = await this.ratesService.getCryptoPrice(
      totalAmountUsd,
      dto.currency,
      cryptoCurrency
    );

    // 3. Create payment record
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const payment = this.paymentsRepository.create({
      business_id: dto.business_id,
      amount: dto.amount,
      currency: dto.currency,
      blockchain: dto.blockchain,
      crypto_amount: cryptoAmount,
      crypto_currency: cryptoCurrency,
      merchant_wallet_address: dto.merchant_wallet_address,
      status: 'pending',
      expires_at: expiresAt,
      metadata: {
        ...dto.metadata,
        network_fee_usd: networkFee,
        total_amount_usd: totalAmountUsd,
      },
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    // 4. Generate unique payment address
    const isPaidTier = await this.entitlementsService.isBusinessPaidTier(dto.business_id);

    const addressResult = await this.systemWalletService.generatePaymentAddress(
      savedPayment.id,
      dto.business_id,
      dto.blockchain,
      dto.merchant_wallet_address || '',
      cryptoAmount,
      isPaidTier
    );

    if (!addressResult.success) {
      throw new BadRequestException(addressResult.error);
    }

    // 5. Update payment with address
    savedPayment.payment_address = addressResult.address;
    await this.paymentsRepository.save(savedPayment);

    // 6. Generate QR code
    const qrCode = await this.generateQRCode(
      addressResult.address,
      cryptoAmount,
      dto.blockchain
    );

    return {
      success: true,
      payment: {
        ...savedPayment,
        payment_address: addressResult.address,
        qr_code: qrCode,
      },
    };
  }

  async getPayment(id: string) {
    const payment = await this.paymentsRepository.findOne({ where: { id } });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // Check and update expiration
    if (payment.status === 'pending' && this.isExpired(payment)) {
      payment.status = 'expired';
      await this.paymentsRepository.save(payment);
    }

    return payment;
  }

  private isExpired(payment: Payment): boolean {
    return payment.expires_at && new Date(payment.expires_at) < new Date();
  }
}
```

#### Blockchain Monitor Module

**monitor.service.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { BlockchainService } from './blockchain.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ForwardingService } from './forwarding.service';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private blockchainService: BlockchainService,
    private webhooksService: WebhooksService,
    private forwardingService: ForwardingService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorPayments() {
    this.logger.log('Starting payment monitoring cycle');

    try {
      // 1. Expire old pending payments
      await this.expirePendingPayments();

      // 2. Monitor active pending payments
      const pendingPayments = await this.paymentsRepository.find({
        where: {
          status: 'pending',
          expires_at: LessThan(new Date()),
        },
        take: 100,
      });

      this.logger.log(`Monitoring ${pendingPayments.length} pending payments`);

      for (const payment of pendingPayments) {
        await this.checkPayment(payment);
      }
    } catch (error) {
      this.logger.error('Error in monitoring cycle:', error);
    }
  }

  private async checkPayment(payment: Payment) {
    try {
      // Check blockchain balance
      const balance = await this.blockchainService.getBalance(
        payment.blockchain,
        payment.payment_address
      );

      if (parseFloat(balance) >= payment.crypto_amount) {
        // Payment confirmed!
        payment.status = 'confirmed';
        payment.customer_paid_amount = parseFloat(balance);
        payment.confirmed_at = new Date();
        await this.paymentsRepository.save(payment);

        // Send webhook
        await this.webhooksService.sendPaymentWebhook(
          payment.business_id,
          payment.id,
          'payment.confirmed',
          {
            amount_crypto: balance,
            payment_address: payment.payment_address,
          }
        );

        // Trigger forwarding
        await this.forwardingService.processConfirmedPayment(payment.id);
      }
    } catch (error) {
      this.logger.error(`Error checking payment ${payment.id}:`, error);
    }
  }

  private async expirePendingPayments() {
    const now = new Date();

    const expiredPayments = await this.paymentsRepository.find({
      where: {
        status: 'pending',
        expires_at: LessThan(now),
      },
    });

    for (const payment of expiredPayments) {
      payment.status = 'expired';
      await this.paymentsRepository.save(payment);

      await this.webhooksService.sendPaymentWebhook(
        payment.business_id,
        payment.id,
        'payment.expired',
        {
          reason: 'Payment window expired (15 minutes)',
        }
      );
    }

    this.logger.log(`Expired ${expiredPayments.length} payments`);
  }
}
```

### 11.3 Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=coinpay
DATABASE_PASSWORD=secure_password
DATABASE_NAME=coinpay

# Security
ENCRYPTION_KEY=your-32-byte-hex-key
JWT_SECRET=your-jwt-secret

# Blockchain RPC URLs
BITCOIN_RPC_URL=https://...
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# System Wallet Mnemonics (HIGHLY SENSITIVE - NEVER COMMIT)
SYSTEM_MNEMONIC_BTC=your 24 word mnemonic for bitcoin
SYSTEM_MNEMONIC_ETH=your 24 word mnemonic for ethereum
SYSTEM_MNEMONIC_SOL=your 24 word mnemonic for solana

# Platform Fee Wallets
PLATFORM_FEE_WALLET_BTC=your-btc-address
PLATFORM_FEE_WALLET_ETH=your-eth-address
PLATFORM_FEE_WALLET_POL=your-pol-address
PLATFORM_FEE_WALLET_SOL=your-sol-address

# Exchange Rates API
TATUM_API_KEY=your-tatum-api-key

# Webhook
WEBHOOK_SIGNING_SECRET=your-webhook-secret

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### 11.4 Database Setup (TypeORM)

**app.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,  // Use migrations in production
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    // ... other modules
  ],
})
export class AppModule {}
```

### 11.5 Testing

**payments.service.spec.ts:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockRepository,
        },
        // ... mock other dependencies
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should create a payment', async () => {
    const dto = {
      business_id: 'biz-123',
      amount: 100,
      currency: 'USD',
      blockchain: 'ETH',
      merchant_wallet_address: '0xmerchant...',
    };

    mockRepository.create.mockReturnValue({ id: 'pay-123', ...dto });
    mockRepository.save.mockResolvedValue({ id: 'pay-123', ...dto });

    const result = await service.createPayment(dto);

    expect(result.success).toBe(true);
    expect(result.payment).toBeDefined();
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: dto.business_id,
        amount: dto.amount,
      })
    );
  });
});
```

---

## Conclusion

This document provides a comprehensive reference for implementing a cryptocurrency payment gateway. Key takeaways:

1. **System Wallet Architecture**: Platform controls HD wallets and generates unique addresses per payment
2. **Tiered Commission Model**: 0.5% for paid tier, 1% for free tier - automatic split on forwarding
3. **15-Minute Payment Window**: Creates urgency and reduces monitoring overhead
4. **Robust Security**: AES-256-GCM encryption, bcrypt hashing, JWT tokens, webhook signatures
5. **Multi-Blockchain Support**: Unified interface for BTC, ETH, SOL, and more
6. **Automatic Forwarding**: Split payments between merchant and platform wallets
7. **Real-time Monitoring**: Edge function or cron job checks blockchain every minute
8. **Webhook Notifications**: Signed HTTP callbacks for payment lifecycle events
9. **Subscription Tiers**: Transaction limits and tiered pricing model

**For NestJS Implementation:**
- Use TypeORM for database with PostgreSQL
- Implement scheduled jobs with `@nestjs/schedule`
- Use Guards for authentication and entitlements
- Modular architecture with clear separation of concerns
- Comprehensive error handling and logging

**Security Considerations:**
- Never commit mnemonics or private keys
- Use environment variables for all secrets
- Implement rate limiting on all endpoints
- Enable Row Level Security in database
- Regular security audits and penetration testing

---

**Project**: CoinPay
**Documentation Version**: 1.0
**Last Updated**: January 2026
