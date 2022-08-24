const fs = require('fs');

const StoreMap = require('../src/store-map');

describe('StoreMap', () => {
    const fileName = 'db-test';
    describe('initialize', () => {
        test('exists', () => {
            expect(StoreMap).toBeDefined();
        });
    
        test('accepts fileName attribute', () => {
            const storeMap = new StoreMap(fileName);
            expect(storeMap.fileName).toBe(fileName);
        });
    
        test('fileName is read only', () => {
            const storeMap = new StoreMap(fileName);
            expect(() => storeMap.fileName = 'new-db-test').toThrow();
            expect(storeMap.fileName).toBe(fileName);
        });

        test('fileName is required', () => {
            expect(() => new StoreMap()).toThrow();
        });

        test('hash table is created along with file', () => {
            const storeMap = new StoreMap('db-test');
            expect(storeMap.hashTable).toBeDefined();
            expect(storeMap.hashTable instanceof Map).toBe(true);
        });

        test('hash table is read only', () => {
            const storeMap = new StoreMap(fileName);
            expect(() => storeMap.hashTable = new Map()).toThrow();
        });
    });

    describe('#store', () => {
        const aKey = 'aKey';
        const aValue = 'aValue';
        let storeMap;
        beforeEach(() => {
            storeMap = new StoreMap(fileName);
        });

        afterEach(() => {
            if (fs.existsSync(fileName))
                fs.unlinkSync(fileName);
        });
        test('db file should be absent initially', () => {
            expect(fs.existsSync(fileName)).toBe(false);
        });
        test('key and value parameters should be required', async () => {
            await expect(storeMap.store(aKey)).rejects.toThrow();
            await expect(storeMap.store()).rejects.toThrow();
            await expect(storeMap.store(aKey, aValue)).resolves.toBeUndefined();
        });
        test('should create db file, if not present, when #store called', async () => {
            await storeMap.store(aKey, aValue);
            expect(fs.existsSync(fileName)).toBe(true);
        });

        test('should not override, if already exists', async () => {
            const expectedContent = 'my-content';
            await fs.promises.writeFile(fileName, expectedContent);
            let fileContent = await fs.promises.readFile(fileName, 'utf-8');
            expect(fileContent).toBe(expectedContent);
            await storeMap.store(aKey, aValue);
            fileContent = await fs.promises.readFile(fileName, 'utf-8');
            expect(fileContent.includes(expectedContent)).toBe(true);
        });

        test('should write key and value into file', async () => {
            const expectedContent = `${aKey}:${aValue}\\n`;
            await storeMap.store(aKey, aValue);
            const fileContent = await fs.promises.readFile(fileName, 'utf-8');
            expect(fileContent).toBe(expectedContent);
        });

        test('should store key in hash map', async () => {
            await storeMap.store(aKey, aValue);
            expect(Array.from(storeMap.hashTable.keys())).toEqual([aKey]);
        });

        test('should store byte offset as a value', async () => {
            const expectedContent = `${aKey}:${aValue}\\n`;
            await storeMap.store(aKey, aValue);
            expect(storeMap.hashTable.get(aKey).offset).toBe(0);
            const expectedOffset = expectedContent.length;
            await storeMap.store(aKey + '-2', aValue + '-2');
            expect(storeMap.hashTable.get(aKey + '-2').offset).toBe(expectedOffset);
        });

        test('should append duplicated offset by duplicated key', async () => {
            const expectedContent = `${aKey}:${aValue}\\n`;
            await storeMap.store(aKey, aValue);
            expect(storeMap.hashTable.get(aKey).offset).toBe(0);
            await storeMap.store(aKey, aValue);
            expect(storeMap.hashTable.get(aKey).offset).toBe(expectedContent.length);
            expect(Array.from(storeMap.hashTable.keys()).length).toBe(1);
        });

        test('should append to file by same key', async () => {
            let expectedContent = `${aKey}:${aValue}\\n`;
            await storeMap.store(aKey, aValue);
            let fileContent = await fs.promises.readFile(fileName, 'utf-8');
            expect(fileContent).toBe(expectedContent);
            await storeMap.store(aKey, aValue);
            expectedContent += expectedContent;
            fileContent = await fs.promises.readFile(fileName, 'utf-8');
            expect(fileContent).toBe(expectedContent);
        });

        test('should append to file by different keys', async () => {
            let expectedContent = `${aKey}:${aValue}\\n${aKey}2:${aValue}2\\n`;
            await storeMap.store(aKey, aValue);
            await storeMap.store(`${aKey}2`, `${aValue}2`);
            const fileContent = await fs.promises.readFile(fileName, 'utf-8');
            expect(fileContent).toBe(expectedContent);
        });

        test('should append to file by same keys, different values', async () => {
            let expectedContent = `${aKey}:${aValue}\\n`;
            await storeMap.store(aKey, aValue);
            let fileContent = await fs.promises.readFile(fileName, 'utf-8');
            expect(fileContent).toBe(expectedContent);
            await storeMap.store(aKey, `${aValue}2`);
            expectedContent += `${aKey}:${aValue}2\\n`;;
            fileContent = await fs.promises.readFile(fileName, 'utf-8');
            expect(fileContent).toBe(expectedContent);
        });

        test('should add size of record next to offset', async () => {
            let expectedContent = `${aKey}:${aValue}\\n`;
            await storeMap.store(aKey, aValue);
            expect(storeMap.hashTable.get(aKey).size).toBe(expectedContent.length);
        });

        test('should not store, if (contentSize + fileSize) > maxSpace', async () => {
            const maxSpace = 20;
            storeMap = new StoreMap(fileName, maxSpace);
            let expectedContent = `${aKey}:${aValue}\\n`;
            await storeMap.store(aKey, aValue);
            const fileStat = await fs.promises.stat(fileName);
            expect((expectedContent.length + fileStat.size) > maxSpace).toBe(true);
            await expect(storeMap.store(aKey, aValue)).rejects.toThrow();
            const fileContent = await fs.promises.readFile(fileName, 'utf-8');
            expect(fileContent).toBe(expectedContent);
        });
    });

    describe('maxSpace', () => {
        const maxSpace = 30;
        let storeMap;
        beforeEach(() => {
            storeMap = new StoreMap(fileName, maxSpace);
        });

        afterEach(() => {
            if (fs.existsSync(fileName))
                fs.unlinkSync(fileName);
        });

        test('should accept maxSpace attribute in constructor', () => {
            expect(storeMap.maxSpace).toBe(maxSpace);
        });

        test('maxSpace is read only', () => {
            expect(() => storeMap.maxSpace = 100).toThrow();
            expect(storeMap.maxSpace).toBe(maxSpace);
        });

        test('maxSpace is optional', () => {
            expect(storeMap.maxSpace).not.toBeUndefined();
        });
    });

    describe('#retrieve', () => {
        const aKey = 'aKey';
        const aValue = 'aValue';
        let storeMap;
        beforeEach(() => {
            storeMap = new StoreMap(fileName);
        });

        afterEach(() => {
            if (fs.existsSync(fileName))
                fs.unlinkSync(fileName);
        });

        test('should retrieve value by key', async () => {
            const expectedValue = `${aKey}:${aValue}\\n`;
            await storeMap.store(aKey, aValue);
            const retrievedValue = await storeMap.retrieve(aKey);
            expect(retrievedValue).toBe(expectedValue);
        });

        test('should retrieve only value', async () => {
            const expectedValue = `${aKey}2:${aValue}2\\n`;
            await storeMap.store(aKey, aValue);
            await storeMap.store(`${aKey}2`, `${aValue}2`);
            await storeMap.store(`${aKey}3`, `${aValue}3`);
            const retrievedValue = await storeMap.retrieve(`${aKey}2`);
            expect(retrievedValue).toBe(expectedValue);

        });

        test('should throw an exception, if not found', async () => {
            await storeMap.store(aKey, aValue);
            await expect(storeMap.retrieve(aKey + '2')).rejects.toThrow();
        });
    });

    describe('#buildFromFile', () => {
        const aKey = 'aKey';
        const aValue = 'aValue';

        afterEach(() => {
            if (fs.existsSync(fileName)) {
                fs.unlinkSync(fileName);
            }
        });

        test('should build StoreMap from file', async () => {
            const contentToRead = `${aKey}:${aValue}\\n${aKey}2:${aValue}2\\n`;
            await fs.promises.writeFile(fileName, contentToRead);
            const storeMap = StoreMap.buildFromFile(fileName);

            const value1 = await storeMap.retrieve(aKey);
            expect(value1).toBe(aValue);
        });
    });
});