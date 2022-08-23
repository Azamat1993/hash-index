const fs = require('fs');
const testUtils = require('./utils');

const StoreMapManager = require('../src/store-map-manager');

describe(StoreMapManager.name, () => {
    describe('initialize', () => {
        test('exists', () => {
            expect(StoreMapManager).toBeDefined();
        });

        test('should initialize fileName prefix', () => {
            const prefix = 'db';
            const manager = new StoreMapManager(prefix);
            expect(manager.prefix).toBe('db');
        });

        test('prefix should be read only', () => {
            const prefix = 'db';
            const manager = new StoreMapManager(prefix);
            expect(() => manager.prefix = 'newDb').toThrow();
        });

        test('prefix should be required', () => {
            expect(() => new StoreMapManager()).toThrow();
        });

        test('should initialize maxSpacePerStoreMap', () => {
            const prefix = 'db';
            const maxSpacePerStoreMap = 120;
            const manager = new StoreMapManager(prefix, maxSpacePerStoreMap);
            expect(manager.maxSpacePerStoreMap).toBe(maxSpacePerStoreMap);
        });

        test('maxSpacePerStoreMap should be read only', () => {
            const prefix = 'db';
            const maxSpacePerStoreMap = 120;
            const manager = new StoreMapManager(prefix, maxSpacePerStoreMap);
            expect(() => manager.maxSpacePerStoreMap = 300).toThrow();
        });

        test('maxSpacePerStoreMap should be optional', () => {
            expect(new StoreMapManager('db').maxSpacePerStoreMap).toBe(100);
        });
    });

    describe('#store', () => {
        const prefix = 'db';
        const dir = './test';
        const aKey = 'aKey';
        const aValue = 'aValue';
        let storeMapManager;

        beforeEach(() => {
            storeMapManager = new StoreMapManager(dir + '/' + prefix);
        });

        afterEach(() => {
            testUtils.deleteWithPrefix(dir, prefix);
        });

        test('initially no files with prefix should exist', async () => {
            const dbFiles = await testUtils.filesWithPrefix(dir, prefix);
            expect(dbFiles.length).toBe(0);
        });

        test('should create file with prefix', async () => {
            await storeMapManager.store(aKey, aValue);
            const dbFiles = await testUtils.filesWithPrefix(dir, prefix);
            expect(dbFiles.length).toBe(1);
        });

        test('content of file should be of aValue', async () => {
            const expectedContent = `${aKey}:${aValue}\\n`;
            await storeMapManager.store(aKey, aValue);
            const dbFiles = await testUtils.filesWithPrefix(dir, prefix);
            const fileContents = await fs.promises.readFile(dir + '/' + dbFiles[0], 'utf-8');
            expect(fileContents).toBe(expectedContent);
        });

        test('should create new StoreMap, if there is not enough space', async () => {
            const expectedContent = `${aKey}:${aValue}\\n`;

            storeMapManager = new StoreMapManager(dir + '/' + prefix, 30);
            await storeMapManager.store(aKey, aValue);
            let dbFiles = await testUtils.filesWithPrefix(dir, prefix);
            expect(dbFiles.length).toBe(1);
            const oldDbFile = dbFiles[0];
            let fileContents = await fs.promises.readFile(dir + '/' + dbFiles[0], 'utf-8');
            expect(fileContents.length).toBe(expectedContent.length);

            await storeMapManager.store(aKey, aValue);
            dbFiles = await testUtils.filesWithPrefix(dir, prefix);
            expect(dbFiles.length).toBe(1);
            fileContents = await fs.promises.readFile(dir + '/' + dbFiles[0], 'utf-8');
            expect(fileContents.length).toBe(expectedContent.length * 2);

            await storeMapManager.store(aKey, aValue);
            dbFiles = await testUtils.filesWithPrefix(dir, prefix);
            expect(dbFiles.length).toBe(2);
            const newDbFile = dbFiles.filter(x => x != oldDbFile)[0];
            const fileContents1 = await fs.promises.readFile(dir + '/' + oldDbFile, 'utf-8');
            expect(fileContents1.length).toBe(expectedContent.length * 2);
            const fileContents2 = await fs.promises.readFile(dir + '/' + newDbFile, 'utf-8');
            expect(fileContents2.length).toBe(expectedContent.length);
        });
    });

    describe('#retrieve', () => {
        const prefix = 'db';
        const dir = './test';
        const aKey = 'aKey';
        const aValue = 'aValue';
        let storeMapManager;

        beforeEach(() => {
            storeMapManager = new StoreMapManager(dir + '/' + prefix);
        });

        afterEach(() => {
            testUtils.deleteWithPrefix(dir, prefix);
        });

        test('should retrieve, when only one store map exists', async () => {
            await storeMapManager.store(aKey, aValue);
            await storeMapManager.store(`${aKey}2`, `${aValue}2`);
            await storeMapManager.store(`${aKey}3`, `${aValue}3`);

            const result = await storeMapManager.retrieve(`${aKey}2`);
            expect(result).toBe(`${aKey}2:${aValue}2\\n`);
        });

        test('should retrieve from older files, if not present in recent', async () => {
            storeMapManager = new StoreMapManager(dir + '/' + prefix, 30);
            await storeMapManager.store(aKey, aValue);
            await storeMapManager.store(`${aKey}2`, `${aValue}2`);
            await storeMapManager.store(`${aKey}3`, `${aValue}3`);

            const dbFiles = await testUtils.filesWithPrefix(dir, prefix);
            expect(dbFiles.length).toBe(2);

            let result = await storeMapManager.retrieve(`${aKey}3`);
            expect(result).toBe(`${aKey}3:${aValue}3\\n`);

            result = await storeMapManager.retrieve(`${aKey}`);
            expect(result).toBe(`${aKey}:${aValue}\\n`);
        });

        test('should return null, if not found', async () => {
            storeMapManager = new StoreMapManager(dir + '/' + prefix, 30);
            await storeMapManager.store(aKey, aValue);
            await storeMapManager.store(`${aKey}2`, `${aValue}2`);
            await storeMapManager.store(`${aKey}3`, `${aValue}3`);
            
            const result = await storeMapManager.retrieve(`${aKey}4`);
            expect(result).toBeNull();
        });
    });
});