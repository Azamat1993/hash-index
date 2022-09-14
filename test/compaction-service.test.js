const fs = require('fs');
const CompactionService = require('../src/compaction-service');

describe(CompactionService.name, () => {
    const fileName = 'db-test';
    const newFileName = 'db-test-compacted';
    let service;

    beforeEach(() => {
        service = new CompactionService();
    });

    afterEach(() => {
        if (fs.existsSync(fileName))
            fs.unlinkSync(fileName);

        if (fs.existsSync(newFileName))
            fs.unlinkSync(newFileName);
    });

    describe('#compact', () => {
        test('should throw an error, if provided file does not exist', async () => {
            await expect(service.compact(fileName, '')).rejects.toThrow();
        });

        test('should throw an error, if fileName is not provided', async () => {
            await expect(service.compact()).rejects.toThrow();
        });

        test('should throw an error, if newFileName is not provided', async () => {
            await expect(service.compact(fileName)).rejects.toThrow();
        });

        test('should throw an error, if new file is already exists', async () => {
            const expectedContent = 'my-content';
            await fs.promises.writeFile(fileName, expectedContent);
            await fs.promises.writeFile(newFileName, expectedContent);

            await expect(service.compact(fileName, newFileName)).rejects.toThrow();
        });

        test('should return new file name, which exists', async () => {
            const expectedContent = 'my-content';
            await fs.promises.writeFile(fileName, expectedContent);
            await service.compact(fileName, newFileName);
            expect(fs.existsSync(newFileName)).toBe(true);
        });
    });
});