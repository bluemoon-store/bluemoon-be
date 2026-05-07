import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

const MAX_DIMENSION = 2000;
const TILE_WIDTH = 400;
const TILE_GAP = 120;
const WATERMARK_OPACITY = 0.5;
const SUPPORTED_INPUTS = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class WatermarkService {
    private cachedSvg: Buffer | null = null;

    private async getWatermarkSvg(): Promise<Buffer> {
        if (this.cachedSvg) {
            return this.cachedSvg;
        }

        const svgPath = path.resolve(
            process.cwd(),
            'assets',
            'jinx-watermark.svg'
        );
        this.cachedSvg = await fs.readFile(svgPath);
        return this.cachedSvg;
    }

    public async applyJinxTile(
        input: Buffer,
        contentType: string
    ): Promise<{ buffer: Buffer; contentType: string }> {
        if (!SUPPORTED_INPUTS.has(contentType)) {
            throw new Error('Unsupported image format');
        }

        const source = sharp(input, { failOn: 'none' });
        const metadata = await source.metadata();
        const resized = source.resize({
            width:
                metadata.width && metadata.width > MAX_DIMENSION
                    ? MAX_DIMENSION
                    : undefined,
            height:
                metadata.height && metadata.height > MAX_DIMENSION
                    ? MAX_DIMENSION
                    : undefined,
            fit: 'inside',
            withoutEnlargement: true,
        });

        const watermarkSvg = await this.getWatermarkSvg();
        const rotatedWatermark = sharp(watermarkSvg, { density: 300 })
            .resize({ width: TILE_WIDTH })
            .rotate(30, {
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .ensureAlpha();

        const { data, info } = await rotatedWatermark
            .raw()
            .toBuffer({ resolveWithObject: true });
        const opacityAlpha = Math.round(255 * WATERMARK_OPACITY);
        for (
            let channelIndex = 3;
            channelIndex < data.length;
            channelIndex += 4
        ) {
            data[channelIndex] = Math.round(
                (data[channelIndex] * opacityAlpha) / 255
            );
        }

        const baseTile = await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: info.channels,
            },
        })
            .png()
            .toBuffer();
        const tileBuffer = await sharp(baseTile)
            .extend({
                top: Math.floor(TILE_GAP / 2),
                bottom: Math.ceil(TILE_GAP / 2),
                left: Math.floor(TILE_GAP / 2),
                right: Math.ceil(TILE_GAP / 2),
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer();

        const composited = resized.composite([
            {
                input: tileBuffer,
                tile: true,
                blend: 'over',
                gravity: 'northwest',
            },
        ]);

        if (contentType === 'image/png') {
            return {
                buffer: await composited.png({ quality: 90 }).toBuffer(),
                contentType: 'image/png',
            };
        }

        return {
            buffer: await composited
                .jpeg({ quality: 85, mozjpeg: true })
                .toBuffer(),
            contentType: 'image/jpeg',
        };
    }
}
