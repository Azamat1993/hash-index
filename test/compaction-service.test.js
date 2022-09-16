const fs = require('fs');
const CompactionService = require('../src/compaction-service');

describe(CompactionService.name, () => {
    const fileName = 'db-test-c';
    const fileName2 = 'db-test-c-2';
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

        test('should remove compacted file', async () => {
            const expectedContent = 'my-content';
            await fs.promises.writeFile(fileName, expectedContent);
            await service.compact(fileName, newFileName);
            expect(fs.existsSync(fileName)).toBe(false);
        });

        test('should create new file as is, if no duplicated values exist', async () => {
            const expectedContent = 'key:value\\nkey2:value2';
            await fs.promises.writeFile(fileName, expectedContent);
            await service.compact(fileName, newFileName);
            const newFileContent = await fs.promises.readFile(newFileName, 'utf-8');
            expect(newFileContent).toBe(expectedContent);
        });

        test('should create new file without duplicates', async () => {
            const initialContent = 'key:value\\nkey2:value2\\nkey:value4';
            const expectedContent = 'key2:value2\\nkey:value4';
            await fs.promises.writeFile(fileName, initialContent);
            await service.compact(fileName, newFileName);
            const newFileContent = await fs.promises.readFile(newFileName, 'utf-8');
            expect(newFileContent).toBe(expectedContent);
        });
    });

    describe('#compactAndMerge', () => {
        test('should throw an error, if provided files does not exist', async () => {
            await expect(service.compactAndMerge([fileName, fileName2], '')).rejects.toThrow();
        });

        test('should throw an error, if provided files array is empty', async () => {
            await expect(service.compactAndMerge([], '')).rejects.toThrow();
        });

        test('should throw an error, if provided files array is not an array', async () => {
            await expect(service.compactAndMerge(true, '')).rejects.toThrow();
        });

        test('should throw an error, if newFileName is not provided', async () => {
            await expect(service.compactAndMerge([fileName])).rejects.toThrow();
        });

        test('should throw an error, if new file is already exists', async () => {
            const expectedContent = 'my-content';
            await fs.promises.writeFile(fileName, expectedContent);
            await fs.promises.writeFile(newFileName, expectedContent);

            await expect(service.compactAndMerge([fileName], newFileName)).rejects.toThrow();
        });

        test('should return new file name, which exists', async () => {
            const expectedContent = 'my-content';
            await fs.promises.writeFile(fileName, expectedContent);
            await service.compactAndMerge([fileName], newFileName);
            expect(fs.existsSync(newFileName)).toBe(true);
        });

        test('should remove compacted file', async () => {
            const expectedContent = 'my-content';
            await fs.promises.writeFile(fileName, expectedContent);
            await service.compactAndMerge([fileName], newFileName);
            expect(fs.existsSync(fileName)).toBe(false);
        });
    });
});