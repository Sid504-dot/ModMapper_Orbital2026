import { describe, expect, test } from '@jest/globals';
import { countPrereq } from '../../../../domain/prereq/countPrereq';

describe('countPrereq', () => {

    test('returns 0 for null tree', () => {
        expect(countPrereq(null)).toBe(0);
    });

    test('returns 0 for empty tree', () => {
        expect(countPrereq({} as any)).toBe(0);
    });

    test('returns 1 for OR prerequisite', () => {
        const tree = {
            or: ['CS1010', 'CS1231']
        };

        expect(countPrereq(tree)).toBe(1);
    });

    test('returns 1 for root nOf prerequisite', () => {
        const tree = {
            nOf: [2, ['CS2100', 'CS3213', 'CS5432']] as [number, string[]]
        };

        expect(countPrereq(tree)).toBe(1);
    });

    test('returns number of AND groups', () => {
        const tree = {
            and: [
                { or: ['CS1010'] },
                { or: ['MA1521'] },
                { or: ['CS1231'] }
            ]
        };

        expect(countPrereq(tree)).toBe(3);
    });

    test('counts AND groups containing nOf', () => {
        const tree = {
            and: [
                { or: ['CS1010'] },
                { nOf: [2, ['CS2100', 'CS3213']] as [number, string[]] },
                { or: ['MA1521'] }
            ]
        };

        expect(countPrereq(tree)).toBe(3);
    });

});