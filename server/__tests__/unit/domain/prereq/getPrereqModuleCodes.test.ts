import { describe, expect, test } from '@jest/globals';
import { getPrereqModules } from '../../../../domain/prereq/getPrereqModuleCodes';

describe('getPrereqModules', () => {

    test('returns empty object for null tree', () => {
        const tree = null as any;
        expect(getPrereqModules(tree)).toEqual({});
    });

    test('returns empty object for empty tree', () => {
        const tree = {} as any;
        expect(getPrereqModules(tree)).toEqual({});
    });

    test('extracts modules from OR prerequisite', () => {
        const tree = { or: ['CS1010', 'MA1521'] };

        expect(getPrereqModules(tree)).toEqual({
            1: ['CS1010', 'MA1521']
        });
    });

    test('extracts wildcard prerequisite', () => {
        const tree = { or: ['CS2%'] };

        expect(getPrereqModules(tree)).toEqual({
            1: ['CS2%']
        });
    });

    test('removes grade suffix from OR prerequisite', () => {
        const tree = { or: ['CS1010:D', 'MA1521:D'] };

        expect(getPrereqModules(tree)).toEqual({
            1: ['CS1010', 'MA1521']
        });
    });

    test('returns root nOf unchanged', () => {
        const tree = { nOf: [2, ['CS2100:D', 'CS3213:D', 'CS3230:D']] as [number, string[]]};

        expect(getPrereqModules(tree)).toEqual({
            1: [{ nOf: [2, ['CS2100:D', 'CS3213:D', 'CS3230:D']]}]
        });
    });

    test('extracts modules from AND prerequisite', () => {
        const tree = {
            and: [
                { or: ['CS1010'] },
                { or: ['MA1521'] }
            ]
        };

        expect(getPrereqModules(tree)).toEqual({
            1: ['CS1010'],
            2: ['MA1521']
        });
    });

    test('extracts nOf inside AND prerequisite', () => {
        const tree = {
            and: [{ nOf: [2, ['CS2100', 'CS3213', 'CS3230']] as [number, string[]]}]
        };

        expect(getPrereqModules(tree)).toEqual({
            1: [{
                nOf: [2, ['CS2100', 'CS3213', 'CS3230']]
            }]
        });
    });

    test('handles mixed AND prerequisite', () => {
        const tree = {
            and: [
                { or: ['CS1010:D', 'CS1101S:D'] },
                { nOf: [2, ['CS2100', 'CS3213', 'CS3230']] as [number, string[]] },
                { or: ['MA1521:D'] }
            ]
        };

        expect(getPrereqModules(tree)).toEqual({
            1: ['CS1010', 'CS1101S'],
            2: [{ nOf: [2, ['CS2100', 'CS3213', 'CS3230']] }],
            3: ['MA1521']
        });
    });

});