# Crypto Store - System Design & Implementation Plan

## 📋 Table of Contents
1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Database Schema Design](#database-schema-design)
3. [Module Structure](#module-structure)
4. [API Design](#api-design)
5. [Implementation Phases](#implementation-phases)

---

## 🏗️ Current Architecture Analysis

### Existing Patterns
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based (access + refresh tokens)
- **Authorization**: Role-based (USER, ADMIN, DEVELOPER)
- **File Storage**: AWS S3 with pre-signed URLs
- **Queue System**: Bull with Redis
- **Caching**: Redis cache manager
- **API Versioning**: URI-based (v1)
- **Documentation**: Swagger/OpenAPI
- **Background Jobs**: Bull processors + Schedulers

### Module Structure Pattern
```
src/modules/{feature}/
├── controllers/
│   ├── {feature}.public.controller.ts    # User-facing APIs
│   └── {feature}.admin.controller.ts     # Admin-only APIs
├── services/
│   └── {feature}.service.ts              # Business logic
├── interfaces/
│   └── {feature}.service.interface.ts    # Service contracts
├── dtos/
│   ├── request/
│   │   └── {feature}.{action}.request.ts
│   └── response/
│       └── {feature}.response.ts
└── {feature}.module.ts
```

---

## 🗄️ Database Schema Design

### New Tables/Models

#### 1. Product Category
```prisma
model ProductCategory {
  id          String    @id @default(uuid())
  name        String    @unique
  slug        String    @unique
  description String?
  icon        String?   // S3 key for category icon
  isActive    Boolean   @default(true) @map("is_active")
  sortOrder   Int       @default(0) @map("sort_order")
  products    Product[]
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  @@map("product_categories")
}
```

#### 2. Product
```prisma
model Product {
  id              String          @id @default(uuid())
  name            String
  slug            String          @unique
  description     String          @db.Text
  price           Decimal         @db.Decimal(20, 8) // Support crypto decimals
  currency        String          @default("USD") // Base currency
  stockQuantity   Int             @default(0) @map("stock_quantity")
  isActive        Boolean         @default(true) @map("is_active")
  isFeatured      Boolean         @default(false) @map("is_featured")
  categoryId      String          @map("category_id")
  category        ProductCategory @relation(fields: [categoryId], references: [id])
  images          ProductImage[]
  deliveryType    DeliveryType    @default(INSTANT) @map("delivery_type")
  deliveryContent String?         @db.Text @map("delivery_content") // For instant delivery
  cartItems       CartItem[]
  orderItems      OrderItem[]
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  deletedAt       DateTime?       @map("deleted_at")

  @@index([categoryId])
  @@index([slug])
  @@index([isActive])
  @@map("products")
}

enum DeliveryType {
  INSTANT   // Digital delivery (sent immediately)
  MANUAL    // Requires admin action
  DOWNLOAD  // File download link
}
```

#### 3. Product Images
```prisma
model ProductImage {
  id        String    @id @default(uuid())
  productId String    @map("product_id")
  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  key       String    // S3 key
  url       String?   // Optional cached URL
  isPrimary Boolean   @default(false) @map("is_primary")
  sortOrder Int       @default(0) @map("sort_order")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@index([productId])
  @@map("product_images")
}
```

#### 4. Shopping Cart
```prisma
model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique @map("user_id")
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  @@map("carts")
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String   @map("cart_id")
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String   @map("product_id")
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int      @default(1)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([cartId, productId])
  @@index([cartId])
  @@map("cart_items")
}
```

#### 5. Orders & Payments
```prisma
model Order {
  id              String           @id @default(uuid())
  orderNumber     String           @unique @map("order_number") // e.g., ORD-20260129-XXXXX
  userId          String           @map("user_id")
  user            User             @relation(fields: [userId], references: [id])
  status          OrderStatus      @default(PENDING)
  totalAmount     Decimal          @db.Decimal(20, 8) @map("total_amount")
  currency        String           // USD, BTC, ETH, etc.
  cryptoPayment   CryptoPayment?
  items           OrderItem[]
  supportTickets  SupportTicket[]
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  completedAt     DateTime?        @map("completed_at")
  cancelledAt     DateTime?        @map("cancelled_at")
  deletedAt       DateTime?        @map("deleted_at")

  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@map("orders")
}

enum OrderStatus {
  PENDING           // Awaiting payment
  PAYMENT_RECEIVED  // Payment confirmed
  PROCESSING        // Admin processing
  COMPLETED         // Order delivered
  CANCELLED         // Order cancelled
  REFUNDED          // Payment refunded
}

model OrderItem {
  id               String   @id @default(uuid())
  orderId          String   @map("order_id")
  order            Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId        String   @map("product_id")
  product          Product  @relation(fields: [productId], references: [id])
  quantity         Int
  priceAtPurchase  Decimal  @db.Decimal(20, 8) @map("price_at_purchase")
  deliveredContent String?  @db.Text @map("delivered_content") // Actual content delivered
  deliveredAt      DateTime? @map("delivered_at")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@index([orderId])
  @@map("order_items")
}
```

#### 6. Crypto Payment System
```prisma
model CryptoPayment {
  id                  String              @id @default(uuid())
  orderId             String              @unique @map("order_id")
  order               Order               @relation(fields: [orderId], references: [id], onDelete: Cascade)
  cryptocurrency      CryptoCurrency
  paymentAddress      String              @map("payment_address") // Generated address
  amount              Decimal             @db.Decimal(20, 8) // Amount in crypto
  amountUsd           Decimal             @db.Decimal(20, 2) @map("amount_usd") // USD value at creation
  exchangeRate        Decimal             @db.Decimal(20, 8) @map("exchange_rate") // Rate at payment time
  status              PaymentStatus       @default(PENDING)
  txHash              String?             @map("tx_hash") // Transaction hash
  confirmations       Int                 @default(0)
  requiredConfirmations Int               @default(3) @map("required_confirmations")
  expiresAt           DateTime            @map("expires_at")
  paidAt              DateTime?           @map("paid_at")
  confirmedAt         DateTime?           @map("confirmed_at")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")

  @@index([paymentAddress])
  @@index([status])
  @@index([txHash])
  @@map("crypto_payments")
}

enum CryptoCurrency {
  BTC         // Bitcoin
  ETH         // Ethereum
  LTC         // Litecoin
  USDT_ERC20  // USDT on Ethereum
  BCH         // Bitcoin Cash
}

enum PaymentStatus {
  PENDING      // Waiting for payment
  PARTIAL      // Partial payment received
  PAID         // Full amount received
  CONFIRMING   // Waiting for confirmations
  CONFIRMED    // Payment confirmed
  EXPIRED      // Payment window expired
  FAILED       // Payment failed
}
```

#### 7. User Wallet/Balance System
```prisma
model UserWallet {
  id              String              @id @default(uuid())
  userId          String              @unique @map("user_id")
  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  balance         Decimal             @default(0) @db.Decimal(20, 2) // USD balance
  transactions    WalletTransaction[]
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  @@map("user_wallets")
}

model WalletTransaction {
  id          String                  @id @default(uuid())
  walletId    String                  @map("wallet_id")
  wallet      UserWallet              @relation(fields: [walletId], references: [id], onDelete: Cascade)
  type        WalletTransactionType
  amount      Decimal                 @db.Decimal(20, 2)
  balance     Decimal                 @db.Decimal(20, 2) // Balance after transaction
  description String
  referenceId String?                 @map("reference_id") // Order ID, etc.
  createdAt   DateTime                @default(now()) @map("created_at")
  updatedAt   DateTime                @updatedAt @map("updated_at")

  @@index([walletId])
  @@index([type])
  @@map("wallet_transactions")
}

enum WalletTransactionType {
  DEPOSIT      // Add funds
  PURCHASE     // Product purchase
  REFUND       // Order refund
  ADMIN_ADJUST // Admin adjustment
}
```

#### 8. Support Ticket System
```prisma
model SupportTicket {
  id          String              @id @default(uuid())
  ticketNumber String             @unique @map("ticket_number") // e.g., TKT-20260129-XXXXX
  orderId     String?             @map("order_id")
  order       Order?              @relation(fields: [orderId], references: [id])
  userId      String              @map("user_id")
  user        User                @relation(fields: [userId], references: [id])
  subject     String
  status      TicketStatus        @default(OPEN)
  priority    TicketPriority      @default(MEDIUM)
  messages    TicketMessage[]
  assignedToId String?            @map("assigned_to_id")
  assignedTo   User?              @relation("AssignedTickets", fields: [assignedToId], references: [id])
  createdAt   DateTime            @default(now()) @map("created_at")
  updatedAt   DateTime            @updatedAt @map("updated_at")
  closedAt    DateTime?           @map("closed_at")
  deletedAt   DateTime?           @map("deleted_at")

  @@index([userId])
  @@index([orderId])
  @@index([status])
  @@index([assignedToId])
  @@map("support_tickets")
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_USER
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model TicketMessage {
  id        String        @id @default(uuid())
  ticketId  String        @map("ticket_id")
  ticket    SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  userId    String        @map("user_id")
  user      User          @relation(fields: [userId], references: [id])
  message   String        @db.Text
  isStaff   Boolean       @default(false) @map("is_staff")
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")

  @@index([ticketId])
  @@map("ticket_messages")
}
```

#### 9. CMS Content System
```prisma
model CmsContent {
  id        String      @id @default(uuid())
  key       String      @unique // faq, terms, privacy, etc.
  type      ContentType
  title     String
  content   String      @db.Text
  isPublished Boolean   @default(true) @map("is_published")
  createdAt DateTime    @default(now()) @map("created_at")
  updatedAt DateTime    @updatedAt @map("updated_at")
  deletedAt DateTime?   @map("deleted_at")

  @@map("cms_contents")
}

enum ContentType {
  FAQ
  TERMS
  PRIVACY
  LANDING_PAGE
  ABOUT
}
```

#### 10. System Settings
```prisma
model SystemSettings {
  id        String   @id @default(uuid())
  key       String   @unique // telegram_channel, telegram_bot_token, etc.
  value     String   @db.Text
  category  String   // social, payment, general, etc.
  isPublic  Boolean  @default(false) @map("is_public") // Can be exposed to frontend
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([category])
  @@map("system_settings")
}
```

#### 11. Analytics/Statistics
```prisma
model Analytics {
  id        String       @id @default(uuid())
  type      AnalyticType
  date      DateTime     @db.Date
  key       String       // product_id, user_id, category_id, etc.
  value     Float
  metadata  Json?        // Additional data
  createdAt DateTime     @default(now()) @map("created_at")

  @@unique([type, date, key])
  @@index([type, date])
  @@map("analytics")
}

enum AnalyticType {
  DAILY_SALES
  PRODUCT_VIEWS
  CATEGORY_VIEWS
  REVENUE
  USER_SIGNUPS
  ORDERS_COUNT
}
```

#### 12. Update User Model
```prisma
// Add to existing User model:
model User {
  // ... existing fields

  // Store related fields
  wallet           UserWallet?
  orders           Order[]
  cart             Cart?
  supportTickets   SupportTicket[]   @relation("UserTickets")
  assignedTickets  SupportTicket[]   @relation("AssignedTickets")
  ticketMessages   TicketMessage[]
  isBanned         Boolean           @default(false) @map("is_banned")
  bannedAt         DateTime?         @map("banned_at")
  bannedReason     String?           @map("banned_reason")

  // Two-factor authentication
  twoFactorEnabled Boolean           @default(false) @map("two_factor_enabled")
  twoFactorSecret  String?           @map("two_factor_secret")

  // ... rest of existing fields
}
```

#### 13. Update Role Enum
```prisma
enum Role {
  USER
  MODERATOR    // Can handle tickets and view orders
  MANAGER      // Can handle tickets, orders, and add stock
  ADMIN        // Full access
  DEVELOPER
}
```

---

## 📦 Module Structure

### 1. Product Module (`src/modules/product/`)

```
product/
├── controllers/
│   ├── product.public.controller.ts
│   └── product.admin.controller.ts
├── services/
│   ├── product.service.ts
│   └── product-category.service.ts
├── interfaces/
│   ├── product.service.interface.ts
│   └── product-category.service.interface.ts
├── dtos/
│   ├── request/
│   │   ├── product.create.request.ts
│   │   ├── product.update.request.ts
│   │   ├── product.search.request.ts
│   │   ├── category.create.request.ts
│   │   └── category.update.request.ts
│   └── response/
│       ├── product.response.ts
│       ├── product.list.response.ts
│       └── category.response.ts
└── product.module.ts
```

**Key Features:**
- Product CRUD with category management
- Search with filters (category, price range, availability)
- Stock management
- Image management with S3

### 2. Cart Module (`src/modules/cart/`)

```
cart/
├── controllers/
│   └── cart.public.controller.ts
├── services/
│   └── cart.service.ts
├── interfaces/
│   └── cart.service.interface.ts
├── dtos/
│   ├── request/
│   │   ├── cart.add-item.request.ts
│   │   └── cart.update-item.request.ts
│   └── response/
│       └── cart.response.ts
└── cart.module.ts
```

**Key Features:**
- Add/remove items
- Update quantities
- Calculate totals
- Clear cart

### 3. Order Module (`src/modules/order/`)

```
order/
├── controllers/
│   ├── order.public.controller.ts
│   └── order.admin.controller.ts
├── services/
│   ├── order.service.ts
│   └── order-delivery.service.ts
├── interfaces/
│   ├── order.service.interface.ts
│   └── order-delivery.service.interface.ts
├── dtos/
│   ├── request/
│   │   ├── order.create.request.ts
│   │   └── order.deliver.request.ts
│   └── response/
│       ├── order.response.ts
│       ├── order.list.response.ts
│       └── order.detail.response.ts
└── order.module.ts
```

**Key Features:**
- Create order from cart
- Order history
- Order detail with items
- Admin order management
- Manual delivery system

### 4. Payment Module (`src/modules/payment/`)

```
payment/
├── controllers/
│   ├── payment.public.controller.ts
│   └── payment.admin.controller.ts
├── services/
│   ├── crypto-payment.service.ts
│   ├── payment-verification.service.ts
│   └── wallet.service.ts
├── interfaces/
│   ├── crypto-payment.service.interface.ts
│   └── wallet.service.interface.ts
├── processors/
│   └── payment-verification.processor.ts
├── dtos/
│   ├── request/
│   │   ├── payment.create.request.ts
│   │   └── wallet.add-balance.request.ts
│   └── response/
│       ├── payment.response.ts
│       ├── wallet.response.ts
│       └── payment-address.response.ts
└── payment.module.ts
```

**Key Features:**
- Generate crypto payment addresses
- Monitor blockchain for payments
- Exchange rate conversion
- Wallet balance management
- Transaction history

### 5. Support Module (`src/modules/support/`)

```
support/
├── controllers/
│   ├── support.public.controller.ts
│   └── support.admin.controller.ts
├── services/
│   ├── ticket.service.ts
│   └── ticket-message.service.ts
├── interfaces/
│   ├── ticket.service.interface.ts
│   └── ticket-message.service.interface.ts
├── dtos/
│   ├── request/
│   │   ├── ticket.create.request.ts
│   │   ├── ticket.reply.request.ts
│   │   └── ticket.assign.request.ts
│   └── response/
│       ├── ticket.response.ts
│       ├── ticket.list.response.ts
│       └── ticket-message.response.ts
└── support.module.ts
```

**Key Features:**
- Create tickets (with optional order reference)
- Reply to tickets
- Admin assignment system
- Ticket status management
- Notification on replies

### 6. CMS Module (`src/modules/cms/`)

```
cms/
├── controllers/
│   ├── cms.public.controller.ts
│   └── cms.admin.controller.ts
├── services/
│   └── cms.service.ts
├── interfaces/
│   └── cms.service.interface.ts
├── dtos/
│   ├── request/
│   │   └── cms.update.request.ts
│   └── response/
│       └── cms.response.ts
└── cms.module.ts
```

**Key Features:**
- Manage FAQ, Terms, Privacy content
- Landing page content
- Public content retrieval

### 7. Analytics Module (`src/modules/analytics/`)

```
analytics/
├── controllers/
│   └── analytics.admin.controller.ts
├── services/
│   ├── analytics.service.ts
│   └── analytics-aggregation.service.ts
├── interfaces/
│   └── analytics.service.interface.ts
├── schedulers/
│   └── analytics.scheduler.ts
├── dtos/
│   ├── request/
│   │   └── analytics.query.request.ts
│   └── response/
│       ├── analytics.dashboard.response.ts
│       └── analytics.report.response.ts
└── analytics.module.ts
```

**Key Features:**
- Daily sales reports
- Stock level monitoring
- Revenue tracking
- User activity stats
- Product performance

### 8. Settings Module (`src/modules/settings/`)

```
settings/
├── controllers/
│   ├── settings.public.controller.ts  # Public settings only
│   └── settings.admin.controller.ts
├── services/
│   └── settings.service.ts
├── interfaces/
│   └── settings.service.interface.ts
├── dtos/
│   ├── request/
│   │   └── settings.update.request.ts
│   └── response/
│       └── settings.response.ts
└── settings.module.ts
```

**Key Features:**
- Telegram integration settings
- Social media links
- Payment gateway settings
- System configuration

### 9. Telegram Module (`src/modules/telegram/`)

```
telegram/
├── services/
│   ├── telegram-bot.service.ts
│   └── telegram-notification.service.ts
├── interfaces/
│   └── telegram-bot.service.interface.ts
└── telegram.module.ts
```

**Key Features:**
- Stock update notifications
- Claim system for drops
- Order notifications
- Integration with orders/products

### 10. User Module Updates

```typescript
// Add to existing user module:
- User ban/unban functionality
- Balance management endpoints
- Purchase history
- Two-factor authentication setup
```

---

## 🔌 API Design

### Public APIs

#### Authentication & User Management
```
POST   /v1/auth/signup                    # Register
POST   /v1/auth/login                     # Login (with optional 2FA)
POST   /v1/auth/2fa/setup                 # Setup 2FA
POST   /v1/auth/2fa/verify                # Verify 2FA code
GET    /v1/user/profile                   # Get profile
PUT    /v1/user/profile                   # Update profile
DELETE /v1/user/account                   # Delete account
GET    /v1/user/purchases                 # Purchase history
GET    /v1/user/wallet                    # Wallet balance
POST   /v1/user/wallet/deposit            # Request deposit address
```

#### Products & Categories
```
GET    /v1/products                       # List products (with filters)
GET    /v1/products/search                # Search products
GET    /v1/products/:id                   # Product detail
GET    /v1/categories                     # List categories
GET    /v1/categories/:id/products        # Products by category
```

#### Shopping Cart
```
GET    /v1/cart                           # Get cart
POST   /v1/cart/items                     # Add item
PUT    /v1/cart/items/:id                 # Update quantity
DELETE /v1/cart/items/:id                 # Remove item
DELETE /v1/cart                           # Clear cart
```

#### Orders & Payments
```
POST   /v1/orders                         # Create order from cart
GET    /v1/orders                         # List user orders
GET    /v1/orders/:id                     # Order detail
POST   /v1/orders/:id/payment             # Create crypto payment
GET    /v1/orders/:id/payment/status      # Check payment status
GET    /v1/orders/:id/delivery            # Get delivered content
```

#### Support Tickets
```
GET    /v1/support/tickets                # List user tickets
POST   /v1/support/tickets                # Create ticket
GET    /v1/support/tickets/:id            # Ticket detail
POST   /v1/support/tickets/:id/messages   # Reply to ticket
PUT    /v1/support/tickets/:id/close      # Close ticket
```

#### CMS Content
```
GET    /v1/cms/faq                        # Get FAQ content
GET    /v1/cms/terms                      # Get Terms
GET    /v1/cms/privacy                    # Get Privacy Policy
GET    /v1/cms/landing                    # Get landing page content
```

#### Public Settings
```
GET    /v1/settings/public                # Get public settings (social links, etc.)
```

### Admin APIs

#### Product Management
```
POST   /v1/admin/products                 # Create product
PUT    /v1/admin/products/:id             # Update product
DELETE /v1/admin/products/:id             # Delete product
PUT    /v1/admin/products/:id/stock       # Update stock
POST   /v1/admin/categories               # Create category
PUT    /v1/admin/categories/:id           # Update category
DELETE /v1/admin/categories/:id           # Delete category
```

#### Order Management
```
GET    /v1/admin/orders                   # List all orders
GET    /v1/admin/orders/:id               # Order detail
PUT    /v1/admin/orders/:id/status        # Update order status
POST   /v1/admin/orders/:id/deliver       # Manually deliver order
POST   /v1/admin/orders/:id/refund        # Refund order
```

#### User Management
```
GET    /v1/admin/users                    # List users
GET    /v1/admin/users/:id                # User detail
PUT    /v1/admin/users/:id                # Update user
POST   /v1/admin/users/:id/ban            # Ban user
POST   /v1/admin/users/:id/unban          # Unban user
POST   /v1/admin/users/:id/balance        # Add balance
DELETE /v1/admin/users/:id                # Delete user
```

#### Support Management
```
GET    /v1/admin/support/tickets          # List all tickets
GET    /v1/admin/support/tickets/:id      # Ticket detail
PUT    /v1/admin/support/tickets/:id/assign # Assign ticket
PUT    /v1/admin/support/tickets/:id/status # Update status
POST   /v1/admin/support/tickets/:id/messages # Reply to ticket
```

#### Analytics & Reports
```
GET    /v1/admin/analytics/dashboard      # Dashboard stats
GET    /v1/admin/analytics/sales          # Sales reports
GET    /v1/admin/analytics/products       # Product performance
GET    /v1/admin/analytics/revenue        # Revenue reports
GET    /v1/admin/analytics/users          # User statistics
```

#### CMS Management
```
GET    /v1/admin/cms                      # List all content
PUT    /v1/admin/cms/:key                 # Update content
```

#### Settings Management
```
GET    /v1/admin/settings                 # Get all settings
PUT    /v1/admin/settings/:key            # Update setting
POST   /v1/admin/telegram/test            # Test telegram integration
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation & Core Setup (Week 1)

#### 1.1 Database Schema
- [ ] Create Prisma schema for all new models
- [ ] Generate and run migrations
- [ ] Seed initial data (categories, settings, CMS content)
- [ ] Update User model with store-related fields

#### 1.2 Update User Module
- [ ] Add 2FA functionality
  - [ ] Setup endpoint
  - [ ] Verification endpoint
  - [ ] Login with 2FA flow
- [ ] Add user ban/unban functionality
- [ ] Add purchase history endpoint
- [ ] Update DTOs and interfaces

#### 1.3 Update Role System
- [ ] Add MODERATOR and MANAGER roles
- [ ] Update role guards
- [ ] Add role-based decorators for new roles

---

### Phase 2: Product & Category System (Week 1-2)

#### 2.1 Product Category Module
- [ ] Create module structure
- [ ] Implement CategoryService
  - [ ] CRUD operations
  - [ ] List with sorting
  - [ ] Toggle active status
- [ ] Create public controller (list, get)
- [ ] Create admin controller (CRUD)
- [ ] Create DTOs (request/response)

#### 2.2 Product Module
- [ ] Create module structure
- [ ] Implement ProductService
  - [ ] CRUD operations
  - [ ] Stock management
  - [ ] Search with filters (category, price, name)
  - [ ] Featured products
- [ ] Implement image management
  - [ ] Upload multiple images
  - [ ] Set primary image
  - [ ] Integration with S3
- [ ] Create public controller
  - [ ] List products (with pagination)
  - [ ] Search products
  - [ ] Get product detail
  - [ ] Filter by category
- [ ] Create admin controller
  - [ ] CRUD operations
  - [ ] Stock updates
  - [ ] Bulk operations
- [ ] Create DTOs and interfaces

---

### Phase 3: Shopping Cart System (Week 2)

#### 3.1 Cart Module
- [ ] Create module structure
- [ ] Implement CartService
  - [ ] Get or create cart for user
  - [ ] Add item to cart
  - [ ] Update item quantity
  - [ ] Remove item
  - [ ] Clear cart
  - [ ] Calculate cart total
  - [ ] Validate stock availability
- [ ] Create public controller
  - [ ] All cart operations
- [ ] Create DTOs and interfaces
- [ ] Add cart validation
  - [ ] Stock availability check
  - [ ] Product active status check
  - [ ] Price validation

---

### Phase 4: Wallet & Balance System (Week 2-3)

#### 4.1 Wallet Module
- [ ] Create module structure
- [ ] Implement WalletService
  - [ ] Create wallet on user registration
  - [ ] Get wallet balance
  - [ ] Add balance (admin only)
  - [ ] Deduct balance (internal)
  - [ ] Transaction history
- [ ] Create public controller
  - [ ] Get balance
  - [ ] Transaction history
- [ ] Create admin controller
  - [ ] Add balance to user
  - [ ] View user wallet
  - [ ] Adjust balance
- [ ] Create DTOs and interfaces
- [ ] Add transaction tracking

---

### Phase 5: Order System (Week 3-4)

#### 5.1 Order Module
- [ ] Create module structure
- [ ] Implement OrderService
  - [ ] Create order from cart
  - [ ] Generate unique order number
  - [ ] Calculate totals
  - [ ] Update order status
  - [ ] Get order history
  - [ ] Get order detail
  - [ ] Cancel order
- [ ] Implement OrderDeliveryService
  - [ ] Instant delivery logic
  - [ ] Manual delivery by admin
  - [ ] Download link generation
  - [ ] Delivery notification
- [ ] Create public controller
  - [ ] Create order
  - [ ] List user orders
  - [ ] Get order detail
  - [ ] View delivered content
- [ ] Create admin controller
  - [ ] List all orders
  - [ ] Order detail with user info
  - [ ] Update order status
  - [ ] Manual delivery
  - [ ] Refund handling
- [ ] Create DTOs and interfaces
- [ ] Add order validation
  - [ ] Stock validation
  - [ ] Payment validation

---

### Phase 6: Crypto Payment System (Week 4-5)

#### 6.1 Payment Module Setup
- [ ] Research crypto payment APIs
  - [ ] Blockchain.com API
  - [ ] BTCPay Server
  - [ ] Coinbase Commerce
  - [ ] NOWPayments
- [ ] Choose and integrate payment provider
- [ ] Setup API credentials

#### 6.2 Crypto Payment Service
- [ ] Create module structure
- [ ] Implement CryptoPaymentService
  - [ ] Generate payment address
  - [ ] Calculate crypto amount from USD
  - [ ] Get exchange rates
  - [ ] Create payment record
  - [ ] Check payment expiration
- [ ] Implement PaymentVerificationService
  - [ ] Monitor blockchain for transactions
  - [ ] Verify transaction amount
  - [ ] Count confirmations
  - [ ] Update payment status
- [ ] Create payment verification worker (Bull)
  - [ ] Queue payment verification jobs
  - [ ] Process payment confirmations
  - [ ] Trigger order completion
  - [ ] Send notifications
- [ ] Create public controller
  - [ ] Initiate payment
  - [ ] Get payment status
  - [ ] Get exchange rates
- [ ] Create admin controller
  - [ ] List payments
  - [ ] Payment details
  - [ ] Manual payment verification
- [ ] Create DTOs and interfaces

#### 6.3 Payment Integration
- [ ] Integrate with Order module
- [ ] Integrate with Wallet module
- [ ] Add payment notifications
- [ ] Add payment expiration handling
- [ ] Add refund logic

---

### Phase 7: Support Ticket System (Week 5-6)

#### 7.1 Support Module
- [ ] Create module structure
- [ ] Implement TicketService
  - [ ] Create ticket
  - [ ] List tickets (user/admin)
  - [ ] Get ticket detail
  - [ ] Update ticket status
  - [ ] Assign ticket to staff
  - [ ] Close ticket
  - [ ] Ticket statistics
- [ ] Implement TicketMessageService
  - [ ] Add message to ticket
  - [ ] List messages
  - [ ] Mark as read
  - [ ] File attachments support
- [ ] Create public controller
  - [ ] Create ticket
  - [ ] List user tickets
  - [ ] Get ticket detail
  - [ ] Reply to ticket
  - [ ] Close ticket
- [ ] Create admin controller
  - [ ] List all tickets
  - [ ] Assign tickets
  - [ ] Update status
  - [ ] Reply to tickets
  - [ ] Filter by status/priority
- [ ] Create DTOs and interfaces
- [ ] Add ticket notifications
  - [ ] Email notification
  - [ ] Push notification
  - [ ] Telegram notification (optional)

---

### Phase 8: CMS Content System (Week 6)

#### 8.1 CMS Module
- [ ] Create module structure
- [ ] Implement CMSService
  - [ ] Get content by key
  - [ ] Update content
  - [ ] List all content
  - [ ] Publish/unpublish content
- [ ] Create public controller
  - [ ] Get FAQ
  - [ ] Get Terms
  - [ ] Get Privacy Policy
  - [ ] Get landing page content
- [ ] Create admin controller
  - [ ] List all content
  - [ ] Update content
  - [ ] Preview content
- [ ] Create DTOs and interfaces
- [ ] Seed default content
  - [ ] Sample FAQ
  - [ ] Terms template
  - [ ] Privacy template
  - [ ] Landing page template

---

### Phase 9: Settings & Configuration (Week 6-7)

#### 9.1 Settings Module
- [ ] Create module structure
- [ ] Implement SettingsService
  - [ ] Get setting by key
  - [ ] Get settings by category
  - [ ] Update setting
  - [ ] Get public settings
- [ ] Create public controller
  - [ ] Get public settings
- [ ] Create admin controller
  - [ ] List all settings
  - [ ] Update settings
  - [ ] Test integrations
- [ ] Create DTOs and interfaces
- [ ] Seed default settings
  - [ ] Telegram settings
  - [ ] Social media links
  - [ ] Payment settings
  - [ ] System settings

---

### Phase 10: Telegram Integration (Week 7)

#### 10.1 Telegram Module
- [ ] Create module structure
- [ ] Setup Telegram Bot
  - [ ] Create bot via BotFather
  - [ ] Get bot token
  - [ ] Configure webhook (optional)
- [ ] Implement TelegramBotService
  - [ ] Send message to channel
  - [ ] Format message templates
  - [ ] Handle bot commands
- [ ] Implement TelegramNotificationService
  - [ ] Stock update notifications
  - [ ] Claim system for drops
  - [ ] Order notifications
- [ ] Create admin controller
  - [ ] Test notification
  - [ ] Send custom message
  - [ ] Configure bot settings
- [ ] Integrate with Product module
  - [ ] Auto-notify on stock update
- [ ] Integrate with Order module
  - [ ] Notify on new order
- [ ] Create claim system
  - [ ] Generate claim codes
  - [ ] Publish to Telegram
  - [ ] Claim redemption endpoint

---

### Phase 11: Analytics & Reporting (Week 7-8)

#### 11.1 Analytics Module
- [ ] Create module structure
- [ ] Implement AnalyticsService
  - [ ] Track daily sales
  - [ ] Track product views
  - [ ] Track revenue
  - [ ] Track user signups
  - [ ] Track orders count
- [ ] Implement AnalyticsAggregationService
  - [ ] Calculate daily metrics
  - [ ] Generate reports
  - [ ] Product performance analysis
  - [ ] Revenue breakdown
- [ ] Create analytics scheduler
  - [ ] Daily aggregation job
  - [ ] Weekly summary
  - [ ] Monthly reports
- [ ] Create admin controller
  - [ ] Dashboard stats
  - [ ] Sales reports
  - [ ] Product performance
  - [ ] Revenue reports
  - [ ] User statistics
  - [ ] Export reports (CSV/Excel)
- [ ] Create DTOs and interfaces
- [ ] Add caching for frequent queries

---

### Phase 12: Background Workers & Schedulers (Week 8)

#### 12.1 Payment Verification Worker
- [ ] Create payment verification processor
- [ ] Schedule periodic checks for pending payments
- [ ] Handle payment confirmations
- [ ] Send payment confirmation emails
- [ ] Update order status on successful payment

#### 12.2 Order Processing Worker
- [ ] Create order processing processor
- [ ] Auto-deliver instant delivery orders
- [ ] Send order confirmation emails
- [ ] Handle failed deliveries
- [ ] Retry logic

#### 12.3 Notification Scheduler
- [ ] Payment expiration reminders
- [ ] Ticket reply notifications
- [ ] Order status updates
- [ ] Stock low alerts (admin)

#### 12.4 Analytics Scheduler
- [ ] Daily metrics aggregation
- [ ] Generate daily reports
- [ ] Cleanup old analytics data

---

### Phase 13: Testing & Quality Assurance (Week 9)

#### 13.1 Unit Tests
- [ ] Product service tests
- [ ] Cart service tests
- [ ] Order service tests
- [ ] Payment service tests
- [ ] Wallet service tests
- [ ] Support service tests
- [ ] CMS service tests
- [ ] Analytics service tests

#### 13.2 Integration Tests
- [ ] Complete purchase flow
  - [ ] Add to cart → Create order → Payment → Delivery
- [ ] Support ticket flow
  - [ ] Create ticket → Reply → Admin response → Close
- [ ] User account flow
  - [ ] Signup → 2FA setup → Purchase → View history
- [ ] Admin flows
  - [ ] Product management
  - [ ] Order management
  - [ ] User management

#### 13.3 E2E Tests
- [ ] Critical user journeys
- [ ] Payment verification
- [ ] Order delivery
- [ ] Refund process

---

### Phase 14: Security & Optimization (Week 9-10)

#### 14.1 Security Hardening
- [ ] Add rate limiting
  - [ ] Login attempts
  - [ ] API endpoints
  - [ ] Payment creation
- [ ] Add request validation
  - [ ] Input sanitization
  - [ ] SQL injection prevention
  - [ ] XSS prevention
- [ ] Implement CSRF protection
- [ ] Add API key authentication for Telegram bot
- [ ] Secure crypto payment endpoints
- [ ] Add admin action logging
- [ ] Implement IP whitelisting for admin (optional)

#### 14.2 Performance Optimization
- [ ] Add caching
  - [ ] Product listings
  - [ ] Categories
  - [ ] CMS content
  - [ ] Public settings
  - [ ] Exchange rates
- [ ] Optimize database queries
  - [ ] Add missing indexes
  - [ ] Optimize N+1 queries
  - [ ] Use query builder for complex queries
- [ ] Implement pagination best practices
- [ ] Add database connection pooling
- [ ] Optimize image delivery
  - [ ] CDN integration
  - [ ] Image compression
  - [ ] Lazy loading support

#### 14.3 Monitoring & Logging
- [ ] Add Sentry error tracking
- [ ] Implement structured logging
  - [ ] Payment events
  - [ ] Order events
  - [ ] Admin actions
  - [ ] Critical errors
- [ ] Add health check endpoints
  - [ ] Database connectivity
  - [ ] Redis connectivity
  - [ ] External APIs status
- [ ] Setup alerting
  - [ ] Payment failures
  - [ ] Low stock alerts
  - [ ] System errors

---

### Phase 15: Documentation & Deployment (Week 10)

#### 15.1 API Documentation
- [ ] Complete Swagger documentation
- [ ] Add API examples
- [ ] Document authentication flow
- [ ] Document payment flow
- [ ] Add response samples

#### 15.2 Admin Documentation
- [ ] Admin user guide
- [ ] Product management guide
- [ ] Order fulfillment guide
- [ ] Support ticket handling guide
- [ ] Telegram integration guide
- [ ] Analytics interpretation guide

#### 15.3 User Documentation
- [ ] User guide
- [ ] Purchase guide
- [ ] Payment guide
- [ ] Support guide
- [ ] FAQ

#### 15.4 Deployment
- [ ] Setup production environment
  - [ ] Database
  - [ ] Redis
  - [ ] S3 buckets
  - [ ] Environment variables
- [ ] Configure CI/CD pipeline
- [ ] Setup SSL certificates
- [ ] Configure domain
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Deploy application
- [ ] Verify all integrations
- [ ] Load testing
- [ ] Backup strategy

#### 15.5 Post-Deployment
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Performance tuning

---

## 🔧 Technical Considerations

### 1. Crypto Payment Integration Options

#### Option A: NOWPayments (Recommended)
- **Pros**: Easy integration, supports all required cryptocurrencies, automatic conversion
- **Cons**: Transaction fees, dependency on third-party
- **Setup**: API key, webhook configuration

#### Option B: BTCPay Server (Self-hosted)
- **Pros**: No fees, full control, open source
- **Cons**: Requires server management, more complex setup
- **Setup**: Docker deployment, node synchronization

#### Option C: Custom Implementation
- **Pros**: Full control, no middleman
- **Cons**: Complex, requires blockchain node management, security risks
- **Setup**: Blockchain nodes, wallet generation, transaction monitoring

**Recommendation**: Start with NOWPayments for faster implementation, can migrate to BTCPay Server later if needed.

### 2. Background Job Processing

Use Bull/Redis for:
- Payment verification (every 5 minutes for pending payments)
- Order delivery automation
- Email notifications
- Analytics aggregation (daily at midnight)
- Telegram notifications

### 3. Caching Strategy

Use Redis cache for:
- Product listings (5 minutes TTL)
- Categories (1 hour TTL)
- CMS content (30 minutes TTL)
- Exchange rates (1 minute TTL)
- Public settings (1 hour TTL)
- User session data

### 4. Security Best Practices

- Rate limiting on all public endpoints
- 2FA for user accounts (optional but recommended)
- API key rotation for external services
- Regular security audits
- Input validation and sanitization
- SQL injection prevention (Prisma handles this)
- XSS prevention (class-validator)
- HTTPS only in production
- Secure cookie settings
- CORS configuration

### 5. Database Optimization

- Add indexes for frequently queried fields
- Use database transactions for multi-step operations (order creation + stock update)
- Implement soft deletes (already done with deletedAt)
- Regular database backups
- Database query performance monitoring

### 6. File Storage

Use existing AWS S3 integration for:
- Product images
- Category icons
- User avatars
- Support ticket attachments (optional)
- Order delivery files (for download type)

### 7. Email System

Use existing AWS SES integration for:
- Order confirmation emails
- Payment confirmation emails
- Delivery notification emails
- Support ticket notifications
- Admin notifications

### 8. Role-Based Access Control

```typescript
// Permission matrix
USER:
  - Browse products
  - Manage cart
  - Create orders
  - View own orders
  - Create support tickets
  - Manage own account

MODERATOR:
  - All USER permissions
  - View all tickets
  - Reply to tickets
  - Assign tickets

MANAGER:
  - All MODERATOR permissions
  - View all orders
  - Update order status
  - Update stock
  - View analytics

ADMIN:
  - All MANAGER permissions
  - Manage products
  - Manage categories
  - Manage users
  - Ban/unban users
  - Add user balance
  - Manage CMS content
  - Manage settings
  - Full analytics access

DEVELOPER:
  - Full system access
  - Debug endpoints
```

---

## 📊 Database Migration Strategy

### Migration Order

1. **Update User table** (add store-related fields)
2. **Add new enums** (Role, OrderStatus, PaymentStatus, etc.)
3. **Create core tables** (ProductCategory, Product, ProductImage)
4. **Create cart tables** (Cart, CartItem)
5. **Create wallet tables** (UserWallet, WalletTransaction)
6. **Create order tables** (Order, OrderItem)
7. **Create payment tables** (CryptoPayment)
8. **Create support tables** (SupportTicket, TicketMessage)
9. **Create content tables** (CmsContent, SystemSettings)
10. **Create analytics tables** (Analytics)

### Seed Data Priority

1. **System Settings** (Telegram, social links, payment settings)
2. **CMS Content** (FAQ, Terms, Privacy Policy templates)
3. **Product Categories** (Sample categories)
4. **Sample Products** (For testing)
5. **Admin User** (If not exists)

---

## 🎯 Success Metrics

### User Metrics
- User registration rate
- Purchase conversion rate
- Average order value
- Repeat purchase rate
- Cart abandonment rate
- Support ticket resolution time

### Technical Metrics
- API response time (<200ms for 95% of requests)
- Payment verification time (<5 minutes average)
- Order delivery time (instant for auto-delivery)
- System uptime (99.9% target)
- Error rate (<0.1% target)

### Business Metrics
- Total revenue
- Revenue by cryptocurrency
- Revenue by product category
- Top-selling products
- Customer acquisition cost
- Customer lifetime value

---

## 🔄 Future Enhancements (Post-MVP)

1. **Advanced Features**
   - Product reviews and ratings
   - Wishlist functionality
   - Product bundles/packages
   - Discount codes and promotions
   - Loyalty program
   - Referral rewards system (extend existing spark system)

2. **Payment System**
   - Lightning Network support for Bitcoin
   - More cryptocurrency options
   - Fiat payment integration (credit cards)
   - Subscription products
   - Installment payments

3. **User Experience**
   - Live chat support
   - Product recommendations
   - Advanced search with AI
   - Mobile app
   - PWA support

4. **Admin Tools**
   - Bulk product import/export
   - Advanced analytics dashboard
   - Automated fraud detection
   - Inventory forecasting
   - Customer segmentation

5. **Integrations**
   - Discord bot integration
   - Stripe payment gateway
   - Email marketing integration
   - SMS notifications
   - Social media integration

---

## 📝 Notes

- All timestamps use UTC
- All monetary values stored in database with appropriate precision (Decimal)
- All crypto amounts stored with 8 decimal places
- Order numbers and ticket numbers are auto-generated with timestamp prefix
- Soft deletes implemented for all major entities
- All file uploads go through existing AWS S3 service
- All emails sent through existing AWS SES service
- Existing authentication and authorization system will be extended
- Existing pagination helper will be used throughout
- Existing logger service will be used for all logging

---

## ✅ Checklist for Each Module

When implementing each module, ensure:

- [ ] Module structure follows existing pattern
- [ ] Service implements interface
- [ ] Proper error handling with HttpException
- [ ] DTOs with validation decorators
- [ ] Swagger documentation on all endpoints
- [ ] Role-based guards where needed
- [ ] Unit tests for services
- [ ] Integration tests for controllers
- [ ] Database queries optimized with indexes
- [ ] Response DTOs match documentation
- [ ] Proper logging for important operations
- [ ] Caching implemented where appropriate
- [ ] Background jobs for async operations
- [ ] Internationalization keys for messages

---

**End of Document**

_This design follows the existing Bluemoon backend architecture and extends it with a comprehensive crypto store system. All new modules integrate seamlessly with existing common services (Auth, Database, File, AWS, Logger, etc.)._
