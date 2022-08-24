const CompactionService = require('../src/compaction-service');

describe(CompactionService.name, () => {
    let service;

    beforeEach(() => {
        service = new CompactionService();
    });

    describe('#compact', () => {
        test('should be true', () => {
            expect(1).toBe(1);
        });
    });
});