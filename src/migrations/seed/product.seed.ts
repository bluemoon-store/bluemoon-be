import { Injectable } from '@nestjs/common';
import { DeliveryType, Prisma, Product, ProductCategory } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { Command } from 'nestjs-command';
import { DatabaseService } from 'src/common/database/services/database.service';

type CategorySlug =
    | 'gaming-gift-cards'
    | 'streaming-music'
    | 'shopping-retail'
    | 'food-dining'
    | 'software-services'
    | 'travel-experience';

type ProductSlug =
    | 'steam'
    | 'playstation'
    | 'xbox'
    | 'nintendo'
    | 'roblox'
    | 'netflix'
    | 'spotify'
    | 'youtube-premium'
    | 'apple-music'
    | 'amazon'
    | 'ebay'
    | 'starbucks'
    | 'doordash'
    | 'uber-eats'
    | 'microsoft-365'
    | 'adobe-creative-cloud'
    | 'airbnb'
    | 'booking-com';

type ProductSeedDef = {
    slug: ProductSlug;
    name: string;
    categorySlug: CategorySlug;
    description: string;
    isHot: boolean;
    isNew: boolean;
    isRestocked: boolean;
    isFeatured: boolean;
    sortOrder: number;
    shortNotice: string;
    deliveryContent: string;
    redeemProcess: string;
    warrantyText: string;
    countryOfOrigin: string;
    launchedAt: Date | null;
    restockedAt: Date | null;
};

const CATEGORY_SEEDS: Array<{
    slug: CategorySlug;
    name: string;
    icon: string;
    description: string;
    sortOrder: number;
}> = [
    {
        slug: 'gaming-gift-cards',
        name: 'Gaming Gift Cards',
        icon: 'IconDeviceGamepad2',
        description:
            'Console and PC store credit, subscriptions, and in-game currency.',
        sortOrder: 1,
    },
    {
        slug: 'streaming-music',
        name: 'Streaming & Music',
        icon: 'IconBrandSpotify',
        description: 'Streaming video and premium music subscriptions.',
        sortOrder: 2,
    },
    {
        slug: 'shopping-retail',
        name: 'Shopping & Retail',
        icon: 'IconShoppingBag',
        description: 'Major retail and marketplace gift cards.',
        sortOrder: 3,
    },
    {
        slug: 'food-dining',
        name: 'Food & Dining',
        icon: 'IconToolsKitchen2',
        description: 'Food delivery and coffeehouse gift cards.',
        sortOrder: 4,
    },
    {
        slug: 'software-services',
        name: 'Software & Services',
        icon: 'IconDeviceLaptop',
        description: 'Productivity suites and creative software.',
        sortOrder: 5,
    },
    {
        slug: 'travel-experience',
        name: 'Travel & Experience',
        icon: 'IconPlaneDeparture',
        description: 'Stays, experiences, and travel bookings.',
        sortOrder: 6,
    },
];

const REDEEM_HTML =
    '<p>Complete checkout, then open your order confirmation email. Copy the code and redeem it in the brand’s official app or website within the validity window shown on the card.</p>';

const WARRANTY_HTML =
    '<p>Codes are guaranteed at the time of delivery. If a code fails to redeem, contact support within 7 days with your order ID for a replacement or refund per store policy.</p>';

const PRODUCT_DEFS: ProductSeedDef[] = [
    {
        slug: 'steam',
        name: 'Steam',
        categorySlug: 'gaming-gift-cards',
        description:
            'Add funds to your Steam Wallet to buy games, DLC, and in-game items on the Steam store.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: true,
        sortOrder: 1,
        shortNotice:
            'Instant Steam Wallet credit — redeem on desktop or mobile app.',
        deliveryContent:
            'Steam Wallet codes are delivered instantly after payment. Redeem in the Steam client under Games → Redeem a Steam Wallet Code.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: new Date('2026-04-16T10:00:00.000Z'),
    },
    {
        slug: 'playstation',
        name: 'PlayStation',
        categorySlug: 'gaming-gift-cards',
        description:
            'PlayStation Store gift cards for games, add-ons, and subscriptions on PS4 and PS5.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: false,
        sortOrder: 2,
        shortNotice: 'Top up your PSN wallet for games and PlayStation Plus.',
        deliveryContent:
            'Redeem your code on console: Settings → Users and Accounts → Payment and Subscriptions → Redeem Codes.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: new Date('2026-04-16T11:00:00.000Z'),
    },
    {
        slug: 'xbox',
        name: 'Xbox',
        categorySlug: 'gaming-gift-cards',
        description:
            'Microsoft Xbox gift card for games, Game Pass, and content on Xbox and Windows.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: false,
        sortOrder: 3,
        shortNotice: 'Works for Xbox games, DLC, and subscriptions.',
        deliveryContent:
            'Redeem at microsoft.com/redeem or on your Xbox under Store → Use a code.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: new Date('2026-04-16T12:00:00.000Z'),
    },
    {
        slug: 'nintendo',
        name: 'Nintendo',
        categorySlug: 'gaming-gift-cards',
        description:
            'Nintendo eShop funds for Switch games, DLC, and Nintendo Switch Online.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: false,
        sortOrder: 4,
        shortNotice: 'eShop credit for digital Nintendo Switch titles.',
        deliveryContent:
            'On Switch: Nintendo eShop → Enter Code on the left sidebar, then confirm.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'Japan',
        launchedAt: null,
        restockedAt: new Date('2026-04-16T13:00:00.000Z'),
    },
    {
        slug: 'roblox',
        name: 'Roblox',
        categorySlug: 'gaming-gift-cards',
        description:
            'Roblox credit for Robux and premium experiences. Redeem on web or in-app.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: false,
        sortOrder: 5,
        shortNotice: 'Credit for Robux and avatar upgrades.',
        deliveryContent:
            'Visit roblox.com/redeem, sign in, and enter your PIN from the order email.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: new Date('2026-04-16T14:00:00.000Z'),
    },
    {
        slug: 'netflix',
        name: 'Netflix',
        categorySlug: 'streaming-music',
        description:
            'Stream thousands of TV shows and movies. Apply balance toward any Netflix plan.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: true,
        sortOrder: 6,
        shortNotice:
            'Apply to new or existing Netflix accounts in supported regions.',
        deliveryContent:
            'Redeem at netflix.com/redeem — enter the code and the value applies to your next bills.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: new Date('2026-04-15T08:00:00.000Z'),
    },
    {
        slug: 'spotify',
        name: 'Spotify',
        categorySlug: 'streaming-music',
        description:
            'Spotify Premium gift subscription — ad-free music and offline downloads.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: false,
        sortOrder: 7,
        shortNotice: 'Premium listening without ads.',
        deliveryContent:
            'Redeem at spotify.com/redeem using the code from your order confirmation.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'Sweden',
        launchedAt: null,
        restockedAt: new Date('2026-04-15T09:00:00.000Z'),
    },
    {
        slug: 'youtube-premium',
        name: 'YouTube Premium',
        categorySlug: 'streaming-music',
        description:
            'YouTube Premium for ad-free video, background play, and YouTube Music.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: false,
        sortOrder: 8,
        shortNotice: 'Includes YouTube Music Premium where available.',
        deliveryContent:
            'Redeem the offer code in the YouTube app under Paid memberships.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: new Date('2026-04-15T10:00:00.000Z'),
    },
    {
        slug: 'apple-music',
        name: 'Apple Music',
        categorySlug: 'streaming-music',
        description:
            'Apple Gift Card usable for Apple Music, apps, games, and more in the Apple ecosystem.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: false,
        sortOrder: 9,
        shortNotice: 'Redeem in App Store or Apple Music settings.',
        deliveryContent:
            'On iPhone: App Store → your profile → Redeem Gift Card or Code.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: new Date('2026-04-15T11:00:00.000Z'),
    },
    {
        slug: 'amazon',
        name: 'Amazon',
        categorySlug: 'shopping-retail',
        description:
            'Amazon.com balance for millions of products, Kindle books, and digital content.',
        isHot: true,
        isNew: false,
        isRestocked: true,
        isFeatured: true,
        sortOrder: 10,
        shortNotice: 'Applies to your Amazon account balance at checkout.',
        deliveryContent:
            'Redeem at amazon.com/gc/redeem — funds never expire for US accounts.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: new Date('2026-04-15T12:00:00.000Z'),
    },
    {
        slug: 'ebay',
        name: 'eBay',
        categorySlug: 'shopping-retail',
        description:
            'Shop auctions and Buy It Now listings across eBay with gift card balance.',
        isHot: false,
        isNew: true,
        isRestocked: true,
        isFeatured: false,
        sortOrder: 11,
        shortNotice: 'Use toward eligible purchases on eBay.',
        deliveryContent:
            'Redeem during checkout or at ebay.com/sh/giftcard — one-time use per card.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: new Date('2026-04-12T10:00:00.000Z'),
        restockedAt: new Date('2026-04-14T16:00:00.000Z'),
    },
    {
        slug: 'starbucks',
        name: 'Starbucks',
        categorySlug: 'food-dining',
        description:
            'Reload your Starbucks Card for drinks, food, and merchandise at participating stores.',
        isHot: false,
        isNew: true,
        isRestocked: false,
        isFeatured: false,
        sortOrder: 12,
        shortNotice: 'Scan in the Starbucks app or pay in-store.',
        deliveryContent:
            'Add the card number and security code in the Starbucks mobile app under Pay.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: new Date('2026-04-11T10:00:00.000Z'),
        restockedAt: null,
    },
    {
        slug: 'doordash',
        name: 'DoorDash',
        categorySlug: 'food-dining',
        description:
            'DoorDash credit for delivery and pickup from local restaurants and stores.',
        isHot: false,
        isNew: true,
        isRestocked: false,
        isFeatured: false,
        sortOrder: 13,
        shortNotice: 'Valid for eligible DoorDash orders in your region.',
        deliveryContent:
            'In the DoorDash app: Account → Gift Card → enter the code from your email.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: new Date('2026-04-10T10:00:00.000Z'),
        restockedAt: null,
    },
    {
        slug: 'uber-eats',
        name: 'Uber Eats',
        categorySlug: 'food-dining',
        description:
            'Uber Eats balance for food delivery from thousands of restaurants.',
        isHot: false,
        isNew: true,
        isRestocked: false,
        isFeatured: false,
        sortOrder: 14,
        shortNotice:
            'Applies to Uber Eats orders where gift cards are accepted.',
        deliveryContent:
            'Wallet → Add payment method → Gift card, then enter the code.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: new Date('2026-04-09T10:00:00.000Z'),
        restockedAt: null,
    },
    {
        slug: 'microsoft-365',
        name: 'Microsoft 365',
        categorySlug: 'software-services',
        description:
            'Microsoft 365 Personal or Family — Word, Excel, PowerPoint, Outlook, and cloud storage.',
        isHot: false,
        isNew: true,
        isRestocked: false,
        isFeatured: true,
        sortOrder: 15,
        shortNotice: 'Subscription activation via Microsoft account.',
        deliveryContent:
            'Redeem at microsoft.com/redeem and sign in with the Microsoft account you want to activate.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: new Date('2026-04-08T10:00:00.000Z'),
        restockedAt: null,
    },
    {
        slug: 'adobe-creative-cloud',
        name: 'Adobe Creative Cloud',
        categorySlug: 'software-services',
        description:
            'Creative Cloud prepaid for Photoshop, Illustrator, Premiere Pro, and the full Adobe suite.',
        isHot: false,
        isNew: false,
        isRestocked: false,
        isFeatured: false,
        sortOrder: 16,
        shortNotice: 'Redeem for Creative Cloud membership months.',
        deliveryContent:
            'Visit adobe.com/redeem, sign in with your Adobe ID, and enter the subscription code.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: null,
    },
    {
        slug: 'airbnb',
        name: 'Airbnb',
        categorySlug: 'travel-experience',
        description:
            'Airbnb credit toward stays and Experiences worldwide where gift cards are supported.',
        isHot: false,
        isNew: false,
        isRestocked: false,
        isFeatured: false,
        sortOrder: 17,
        shortNotice: 'Applied to your Airbnb account for future bookings.',
        deliveryContent:
            'Redeem at airbnb.com/gift — credit appears in your payment methods.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'United States',
        launchedAt: null,
        restockedAt: null,
    },
    {
        slug: 'booking-com',
        name: 'Booking.com',
        categorySlug: 'travel-experience',
        description:
            'Booking.com travel credit for hotels, homes, and attractions in supported markets.',
        isHot: false,
        isNew: false,
        isRestocked: false,
        isFeatured: false,
        sortOrder: 18,
        shortNotice: 'Use at checkout on Booking.com where cards are accepted.',
        deliveryContent:
            'Add the gift card in your Booking.com account under Payment methods before you book.',
        redeemProcess: REDEEM_HTML,
        warrantyText: WARRANTY_HTML,
        countryOfOrigin: 'Netherlands',
        launchedAt: null,
        restockedAt: null,
    },
];

const VARIANT_DENOMS = [
    { label: '$10', price: '10.00', sortOrder: 0 },
    { label: '$25', price: '25.00', sortOrder: 1 },
    { label: '$50', price: '50.00', sortOrder: 2 },
] as const;

const REGION_ROWS = [
    { label: 'Global', countryCode: 'US', sortOrder: 0 },
    { label: 'North America', countryCode: 'CA', sortOrder: 1 },
    { label: 'Europe', countryCode: 'GB', sortOrder: 2 },
] as const;

const GAMING_RELATED: ProductSlug[] = [
    'steam',
    'playstation',
    'xbox',
    'nintendo',
    'roblox',
];
const STREAMING_RELATED: ProductSlug[] = [
    'netflix',
    'spotify',
    'youtube-premium',
    'apple-music',
];
const FOOD_RELATED: ProductSlug[] = ['starbucks', 'doordash', 'uber-eats'];

@Injectable()
export class ProductSeedService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly databaseService: DatabaseService
    ) {
        this.logger.setContext(ProductSeedService.name);
    }

    @Command({
        command: 'seed:products',
        describe:
            'Seed product categories and products for testing payment flow',
    })
    async seed(): Promise<void> {
        this.logger.info('Starting product seeding...');

        try {
            const categories = await this.createCategories();
            this.logger.info(
                `Ensured ${Object.keys(categories).length} categories`
            );

            const products = await this.createProducts(categories);
            this.logger.info(`Ensured ${products.length} products`);

            await this.seedRelatedProducts();
            this.logger.info('Related product links ensured');

            this.logger.info('Product seeding completed successfully');
        } catch (error) {
            this.logger.error(`Error seeding products: ${error.message}`);
            throw error;
        }
    }

    private async createCategories(): Promise<
        Record<CategorySlug, ProductCategory>
    > {
        const map = {} as Record<CategorySlug, ProductCategory>;

        for (const row of CATEGORY_SEEDS) {
            const existing =
                await this.databaseService.productCategory.findUnique({
                    where: { slug: row.slug },
                });

            if (existing) {
                this.logger.info(`Category ${row.slug} already exists`);
                map[row.slug] = existing;
            } else {
                const created =
                    await this.databaseService.productCategory.create({
                        data: {
                            name: row.name,
                            slug: row.slug,
                            description: row.description,
                            icon: row.icon,
                            sortOrder: row.sortOrder,
                        },
                    });
                map[row.slug] = created;
                this.logger.info(`Created category: ${row.name}`);
            }
        }

        return map;
    }

    private async createProducts(
        categories: Record<CategorySlug, ProductCategory>
    ): Promise<Product[]> {
        const products: Product[] = [];

        for (const def of PRODUCT_DEFS) {
            const existing = await this.databaseService.product.findUnique({
                where: { slug: def.slug },
            });

            if (existing) {
                this.logger.info(`Product ${def.slug} already exists`);
                products.push(existing);
                continue;
            }

            const category = categories[def.categorySlug];
            const imageUrl = `https://picsum.photos/seed/${def.slug}/640/360`;
            const basePrice = VARIANT_DENOMS[0].price;

            const product = await this.databaseService.product.create({
                data: {
                    name: def.name,
                    slug: def.slug,
                    description: def.description,
                    price: new Prisma.Decimal(basePrice),
                    currency: 'USD',
                    stockQuantity: 10_000,
                    categoryId: category.id,
                    deliveryType: DeliveryType.INSTANT,
                    deliveryContent: def.deliveryContent,
                    isFeatured: def.isFeatured,
                    sortOrder: def.sortOrder,
                    shortNotice: def.shortNotice,
                    isHot: def.isHot,
                    isNew: def.isNew,
                    isNFA: false,
                    isRestocked: def.isRestocked,
                    launchedAt: def.launchedAt,
                    restockedAt: def.restockedAt,
                    redeemProcess: def.redeemProcess,
                    warrantyText: def.warrantyText,
                    countryOfOrigin: def.countryOfOrigin,
                    images: {
                        create: [
                            {
                                key: imageUrl,
                                url: imageUrl,
                                isPrimary: true,
                                sortOrder: 0,
                            },
                        ],
                    },
                    variants: {
                        create: VARIANT_DENOMS.map(v => ({
                            label: v.label,
                            price: new Prisma.Decimal(v.price),
                            currency: 'USD',
                            stockQuantity: 5000,
                            sortOrder: v.sortOrder,
                        })),
                    },
                    regions: {
                        createMany: {
                            data: REGION_ROWS.map(r => ({
                                label: r.label,
                                countryCode: r.countryCode,
                                sortOrder: r.sortOrder,
                            })),
                        },
                    },
                },
            });

            products.push(product);
            this.logger.info(`Created product: ${def.name}`);
        }

        return products;
    }

    private async seedRelatedProducts(): Promise<void> {
        const slugToId = new Map<string, string>();
        for (const def of PRODUCT_DEFS) {
            const row = await this.databaseService.product.findUnique({
                where: { slug: def.slug },
            });
            if (row) slugToId.set(def.slug, row.id);
        }

        const pairs: Array<{ productId: string; relatedProductId: string }> =
            [];

        const addCluster = (slugs: ProductSlug[]) => {
            for (const a of slugs) {
                for (const b of slugs) {
                    if (a === b) continue;
                    const idA = slugToId.get(a);
                    const idB = slugToId.get(b);
                    if (!idA || !idB) continue;
                    pairs.push({ productId: idA, relatedProductId: idB });
                }
            }
        };

        addCluster(GAMING_RELATED);
        addCluster(STREAMING_RELATED);
        addCluster(FOOD_RELATED);

        if (pairs.length === 0) return;

        await this.databaseService.productRelated.createMany({
            data: pairs,
            skipDuplicates: true,
        });
    }
}
