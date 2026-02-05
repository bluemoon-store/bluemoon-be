import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Command } from 'nestjs-command';
import { DatabaseService } from 'src/common/database/services/database.service';
import { DeliveryType } from '@prisma/client';

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
            // 1. Create Categories
            const categories = await this.createCategories();
            this.logger.info(`Created ${categories.length} categories`);

            // 2. Create Products
            const products = await this.createProducts(categories);
            this.logger.info(`Created ${products.length} products`);

            this.logger.info('Product seeding completed successfully');
        } catch (error) {
            this.logger.error(`Error seeding products: ${error.message}`);
            throw error;
        }
    }

    private async createCategories() {
        const categoriesData = [
            {
                name: 'Digital Products',
                slug: 'digital-products',
                description: 'Instant digital delivery products',
                sortOrder: 1,
            },
            {
                name: 'Software Licenses',
                slug: 'software-licenses',
                description: 'Software license keys and activations',
                sortOrder: 2,
            },
            {
                name: 'Gaming Items',
                slug: 'gaming-items',
                description: 'Gaming accounts, items, and services',
                sortOrder: 3,
            },
            {
                name: 'Accounts & Services',
                slug: 'accounts-services',
                description: 'Premium accounts and subscription services',
                sortOrder: 4,
            },
        ];

        const categories = [];
        for (const catData of categoriesData) {
            const existing =
                await this.databaseService.productCategory.findUnique({
                    where: { slug: catData.slug },
                });

            if (existing) {
                this.logger.info(`Category ${catData.slug} already exists`);
                categories.push(existing);
            } else {
                const category =
                    await this.databaseService.productCategory.create({
                        data: catData,
                    });
                categories.push(category);
                this.logger.info(`Created category: ${catData.name}`);
            }
        }

        return categories;
    }

    private async createProducts(categories: any[]) {
        const productsData = [
            // Digital Products Category
            {
                name: 'Premium Digital Content Pack',
                slug: 'premium-digital-content-pack',
                description:
                    'Instant delivery digital content including ebooks, guides, and resources. Delivered immediately after payment confirmation.',
                price: '1.99',
                currency: 'USD',
                stockQuantity: 1000,
                categoryId: categories[0].id,
                deliveryType: DeliveryType.INSTANT,
                deliveryContent:
                    'Thank you for your purchase! Your digital content pack includes:\n\n1. Premium Ebook Collection (PDF)\n2. Video Tutorial Series Access\n3. Resource Library Access\n4. Bonus Materials\n\nAccess your content at: https://example.com/content/[ORDER_ID]',
                isFeatured: true,
            },
            {
                name: 'Digital Art Collection',
                slug: 'digital-art-collection',
                description:
                    'High-resolution digital art files for commercial use. Instant download after payment.',
                price: '1.99',
                currency: 'USD',
                stockQuantity: 500,
                categoryId: categories[0].id,
                deliveryType: DeliveryType.INSTANT,
                deliveryContent:
                    'Your digital art collection download link:\nhttps://example.com/downloads/art/[ORDER_ID]\n\nPassword: ART2024',
                isFeatured: false,
            },
            // Software Licenses Category
            {
                name: 'Premium Software License Key',
                slug: 'premium-software-license-key',
                description:
                    'One-year license key for premium software. License key delivered instantly via email.',
                price: '1.99',
                currency: 'USD',
                stockQuantity: 200,
                categoryId: categories[1].id,
                deliveryType: DeliveryType.INSTANT,
                deliveryContent:
                    'Your software license key:\n\nLicense Key: PREM-XXXX-XXXX-XXXX-XXXX\n\nActivation Instructions:\n1. Open the software\n2. Go to Settings > License\n3. Enter the license key above\n4. Click Activate\n\nSupport: support@example.com',
                isFeatured: true,
            },
            {
                name: 'Lifetime Software License',
                slug: 'lifetime-software-license',
                description:
                    'Lifetime license for premium software with all future updates included.',
                price: '1.99',
                currency: 'USD',
                stockQuantity: 100,
                categoryId: categories[1].id,
                deliveryType: DeliveryType.INSTANT,
                deliveryContent:
                    'Congratulations! Your lifetime license key:\n\nLicense: LIFETIME-XXXX-XXXX-XXXX\n\nThis license includes:\n- Lifetime access\n- All future updates\n- Priority support\n\nActivate at: https://example.com/activate',
                isFeatured: false,
            },
            // Gaming Items Category
            {
                name: 'Gaming Account Premium',
                slug: 'gaming-account-premium',
                description:
                    'Premium gaming account with high-level characters and items. Account credentials delivered instantly.',
                price: '1.99',
                currency: 'USD',
                stockQuantity: 50,
                categoryId: categories[2].id,
                deliveryType: DeliveryType.INSTANT,
                deliveryContent:
                    'Your gaming account details:\n\nUsername: premium_gamer_XXXX\nPassword: SecurePass123!\n\nAccount Features:\n- Level 100 Character\n- Premium Items\n- Unlocked Content\n\nPlease change password after first login.',
                isFeatured: true,
            },
            {
                name: 'In-Game Currency Pack',
                slug: 'in-game-currency-pack',
                description:
                    'Large pack of in-game currency. Credits added to your account instantly.',
                price: '1.99',
                currency: 'USD',
                stockQuantity: 1000,
                categoryId: categories[2].id,
                deliveryType: DeliveryType.INSTANT,
                deliveryContent:
                    'Your in-game currency has been added!\n\nAmount: 10,000 Credits\n\nTo claim:\n1. Log into your game account\n2. Go to Inventory\n3. Check your balance\n\nCredits are already added to account: [USER_ID]',
                isFeatured: false,
            },
            // Accounts & Services Category
            {
                name: 'Premium Streaming Account',
                slug: 'premium-streaming-account',
                description:
                    'Premium streaming service account with 6 months access. Account details delivered instantly.',
                price: '1.99',
                currency: 'USD',
                stockQuantity: 300,
                categoryId: categories[3].id,
                deliveryType: DeliveryType.INSTANT,
                deliveryContent:
                    'Your premium streaming account:\n\nEmail: premium.streamer@example.com\nPassword: Stream2024!\n\nAccount Details:\n- 6 Months Premium Access\n- 4K Streaming\n- Multiple Device Support\n\nPlease change password after first login.',
                isFeatured: true,
            },
            {
                name: 'VPN Service Premium',
                slug: 'vpn-service-premium',
                description:
                    'One-year premium VPN service subscription. Access credentials delivered instantly.',
                price: '1.99',
                currency: 'USD',
                stockQuantity: 500,
                categoryId: categories[3].id,
                deliveryType: DeliveryType.INSTANT,
                deliveryContent:
                    'Your VPN Premium account:\n\nUsername: vpn_user_XXXX\nPassword: SecureVPN2024!\nServer: premium.example.com\n\nFeatures:\n- Unlimited Bandwidth\n- 50+ Server Locations\n- No Logs Policy\n\nDownload client: https://example.com/vpn/download',
                isFeatured: false,
            },
        ];

        const products = [];
        for (const prodData of productsData) {
            const existing = await this.databaseService.product.findUnique({
                where: { slug: prodData.slug },
            });

            if (existing) {
                this.logger.info(`Product ${prodData.slug} already exists`);
                products.push(existing);
            } else {
                const product = await this.databaseService.product.create({
                    data: prodData,
                });
                products.push(product);
                this.logger.info(`Created product: ${prodData.name}`);
            }
        }

        return products;
    }
}
