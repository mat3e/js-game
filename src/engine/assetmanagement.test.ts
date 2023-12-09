import {getImage, loading, submitImage} from "./assetmanagement";

describe('submitImage & getImage', () => {
    const src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    it('throws when no loading performed', () => {
        expect(() => getImage(src)).toThrow('load');

        submitImage(src);

        expect(() => getImage(src)).toThrow('load');
    });

    it('returns image when loaded', async () => {
        submitImage(src);

        await loading();

        expect(getImage(src)).toBeInstanceOf(HTMLImageElement);
    });
});
