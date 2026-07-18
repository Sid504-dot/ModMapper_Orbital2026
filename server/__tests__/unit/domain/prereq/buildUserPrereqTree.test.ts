import { describe, expect, test } from '@jest/globals';
import { buildUserPrereqTree } from '../../../../domain/prereq/buildUserPrereqTree';

type PrereqLeaf = string | { nOf: [number, string[]] };

type AndGroup = { or: PrereqLeaf[] } | { nOf: [number, string[]] };

type PrereqTree = { or: PrereqLeaf[] } | { and: AndGroup[] } | { nOf: [number, string[]] };

describe('buildUserPrereqTree', () => {
    test('returns empty tree when no modules are taken', () => {
        expect(buildUserPrereqTree([], {})).toEqual({});
    });

    test('returns modules with no prerequisites', () => {
        const prereqMap: Record<string, PrereqTree> = {
            CS1010: {} as PrereqTree,
            CS1231: {} as PrereqTree
        };

        expect(buildUserPrereqTree(['CS1010', 'CS1231'], prereqMap)).toEqual({
            CS1010: [],
            CS1231: []
        });
    });

    test('handles simple OR prerequisite', () => {
        const prereqMap: Record<string, PrereqTree> = {
            CS1010: {} as PrereqTree,
            CS1231: { or: ['CS1010'] }
        };

        expect(buildUserPrereqTree(['CS1010', 'CS1231'], prereqMap)).toEqual({
            CS1010: [],
            CS1231: ['CS1010']
        });
    });

    test('handles AND prerequisites', () => {
        const prereqMap: Record<string, PrereqTree> = {
            CS1010: {} as PrereqTree,
            CS1231: {} as PrereqTree,
            CS2100: {
                and: [
                    { or: ['CS1010'] },
                    { or: ['CS1231'] }
                ]
            }
        };

        expect(buildUserPrereqTree(['CS1010', 'CS1231', 'CS2100'], prereqMap)).toEqual({
            CS1010: [],
            CS1231: [],
            CS2100: ['CS1010', 'CS1231']
        });
    });

    test('handles root nOf prerequisite', () => {
        const prereqMap: Record<string, PrereqTree> = {
            CS1010: {} as PrereqTree,
            CS1231: {} as PrereqTree,
            CS2040: {} as PrereqTree,
            CS9999: {
                nOf: [2, ['CS1010', 'CS1231', 'CS2040']]
            }
        };

        expect(buildUserPrereqTree(['CS1010', 'CS1231', 'CS9999'], prereqMap)).toEqual({
            CS1010: [],
            CS1231: [],
            CS9999: ['CS1010', 'CS1231']
        });
    });

    test('handles nOf inside AND group', () => {
        const prereqMap: Record<string, PrereqTree> = {
            CS1010: {} as PrereqTree,
            CS1231: {} as PrereqTree,
            CS2040: {} as PrereqTree,
            CS9999: {
                and: [
                    { nOf: [2, ['CS1010', 'CS1231', 'CS2040']] }
                ]
            }
        };

        expect(buildUserPrereqTree(['CS1010', 'CS1231', 'CS9999'], prereqMap)).toEqual({
            CS1010: [],
            CS1231: [],
            CS9999: ['CS1010', 'CS1231']
        });
    });

    test('handles wildcard prerequisites', () => {
        const prereqMap: Record<string, PrereqTree> = {
            CS2100: {} as PrereqTree,
            CS2103T: {} as PrereqTree,
            MA1521: {} as PrereqTree,
            CS3000: {
                or: ['CS2%']
            }
        };

        expect(buildUserPrereqTree(['CS2100', 'CS2103T', 'MA1521', 'CS3000'], prereqMap)).toEqual({
            CS2100: [],
            CS2103T: [],
            MA1521: [],
            CS3000: ['CS2100', 'CS2103T']
        });
    });

    test('handles complex prerequisite graph', () => {
        const prereqMap: Record<string, PrereqTree> = {
            CS1010: {} as PrereqTree,
            CS1231: {
                or: ['CS1010']
            },
            MA1521: {
                and: [
                    { or: ['CS1010'] }
                ]
            },
            CS2100: {
                and: [
                    { or: ['CS1231'] },
                    { or: ['MA1521'] }
                ]
            },
            EE2021: {
                nOf: [1, ['CS2100', 'EE2028']]
            }
        };

        expect(buildUserPrereqTree(['CS1010', 'CS1231', 'MA1521', 'CS2100', 'EE2021'], prereqMap)).toEqual({
            CS1010: [],
            CS1231: ['CS1010'],
            MA1521: ['CS1010'],
            CS2100: ['CS1231', 'MA1521'],
            EE2021: ['CS2100']
        });
    });
});