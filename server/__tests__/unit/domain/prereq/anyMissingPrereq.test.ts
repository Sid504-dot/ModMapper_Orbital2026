import { describe, expect, test } from '@jest/globals';
import { anyMissingPrereq } from '../../../../domain/prereq/anyMissingPrereq';

type PrereqLeaf = string | { nOf: [number, string[]] };

describe('anyMissingPrereq', () => {
    test('returns empty array when prerequisite is satisfied', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: ['CS1010'] };
        expect(anyMissingPrereq(need, ['CS1010'])).toEqual([]);
    });

    test('returns missing module when prerequisite is not satisfied', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: ['CS1010'] };
        expect(anyMissingPrereq(need, ['CS1231'])).toEqual([['CS1010']]);
    });

    test('OR prerequisite is satisfied if one module is taken', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: ['CS1010', 'CS1101S'] };
        expect(anyMissingPrereq(need, ['CS1101S'])).toEqual([]);
    });

    test('OR prerequisite returns all choices when none are taken', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: ['CS1010', 'CS1101S'] };
        expect(anyMissingPrereq(need, [])).toEqual([['CS1010', 'CS1101S']]);
    });

    test('AND prerequisite with one missing group', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: ['CS1010'], 2: ['MA1521'] };
        expect(anyMissingPrereq(need, ['CS1010'])).toEqual([['MA1521']]);
    });

    test('AND prerequisite fully satisfied', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: ['CS1010'], 2: ['MA1521'] };
        expect(anyMissingPrereq(need, ['CS1010', 'MA1521'])).toEqual([]);
    });

    test('root nOf prerequisite satisfied', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: [{ nOf: [2, ['CS2100', 'CS3213', 'CS5432']] }] };
        expect(anyMissingPrereq(need, ['CS2100', 'CS3213'])).toEqual([]);
    });

    test('root nOf prerequisite missing one module', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: [{ nOf: [2, ['CS2100', 'CS3213', 'CS5432']] }] };
        expect(anyMissingPrereq(need, ['CS2100'])).toEqual([[{ need: 1, choices: ['CS3213', 'CS5432'] }]]);
    });

    test('root nOf prerequisite with no completed modules', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: [{ nOf: [2, ['CS2100', 'CS3213', 'CS5432']] }] };
        expect(anyMissingPrereq(need, [])).toEqual([[{ need: 2, choices: ['CS2100', 'CS3213', 'CS5432'] }]]);
    });

    test('supports wildcard prerequisites', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: ['CS2%'] };
        expect(anyMissingPrereq(need, ['CS2103'])).toEqual([]);
    });

    test('AND group containing nOf is satisfied', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: [{ nOf: [2, ['CS2100', 'CS3213', 'CS5432']] }], 2: ['MA1521'] };
        expect(anyMissingPrereq(need, ['CS2100', 'CS3213', 'MA1521'])).toEqual([]);
    });

    test('AND group containing nOf is missing', () => {
        const need: Record<number, PrereqLeaf[]> = { 1: [{ nOf: [2, ['CS2100', 'CS3213', 'CS5432']] }], 2: ['MA1521'] };
        expect(anyMissingPrereq(need, ['CS2100', 'MA1521'])).toEqual([[{ need: 1, choices: ['CS3213', 'CS5432'] }]]);
    });
});