import { hashStockLineContent } from 'src/modules/stock-line/utils/stock-line-hash.util';

describe('hashStockLineContent', () => {
    it('hashes trimmed content deterministically', () => {
        const a = hashStockLineContent('user:pass');
        const b = hashStockLineContent('  user:pass  ');
        expect(a).toBe(b);
        expect(a).toHaveLength(64);
    });

    it('differs for different lines', () => {
        expect(hashStockLineContent('a')).not.toBe(hashStockLineContent('b'));
    });
});
