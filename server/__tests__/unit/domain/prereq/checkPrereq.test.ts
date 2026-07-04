import { describe, expect, test } from '@jest/globals';
import { checkPrereq } from '../../../../domain/prereq/checkPrereq';

describe('checkPrereq', () => {

    test('matches simple OR prerequisite', () => {
        const tree = { or: ['CS1010']};
        expect(checkPrereq(tree, 'CS1010')).toBe(true);
    });

    test('returns false when OR prerequisite does not match', () => {
        const tree = { or: ['CS1010'] };
        expect(checkPrereq(tree, 'CS1231')).toBe(false);
    });

    test('matches wildcard prerequisite', () => {
        const tree = { or: ['CS2%'] };
        expect(checkPrereq(tree, 'CS2103')).toBe(true);
    });

    test('matches nOf inside OR', () => {
        const tree = { or: [{ nOf: [2, ['CS2100', 'CS3213', 'CS5432']] as [number, string[]] }]};
        expect(checkPrereq(tree, 'CS3213')).toBe(true);
    });

    test('returns false for nOf inside OR when module not included', () => {
        const tree = { or: [{ nOf: [2, ['CS2100', 'CS3213', 'CS5432']] as [number, string[]] }]};
        expect(checkPrereq(tree, 'CS1010')).toBe(false);
    });

    test('matches simple AND prerequisite', () => {
        const tree = { and: [{ or: ['CS1010'] }, { or: ['MA1521'] }]};
        expect(checkPrereq(tree, 'MA1521')).toBe(true);
    });

    test('returns false when module is not in any AND group', () => {
        const tree = {and: [{ or: ['CS1010'] }, { or: ['MA1521'] }]};
        expect(checkPrereq(tree, 'CS2100')).toBe(false);
    });

    test('matches nOf inside AND group', () => {
        const tree = {and: [{ nOf: [2, ['CS2100', 'CS3213', 'CS5432']] as [number, string[]] }]};
        expect(checkPrereq(tree, 'CS5432')).toBe(true);
    });

    test('returns false for nOf inside AND group when module not included', () => {
        const tree = {and: [{ nOf: [2, ['CS2100', 'CS3213', 'CS5432']] as [number, string[]] }]};
        expect(checkPrereq(tree, 'CS1010')).toBe(false);
    });

    test('matches root nOf prerequisite', () => {
        const tree = {nOf: [2, ['CS2100', 'CS3213', 'CS5432']] as [number, string[]]};
        expect(checkPrereq(tree, 'CS2100')).toBe(true);
    });

    test('returns false for root nOf when module not included', () => {
        const tree = {nOf: [2, ['CS2100', 'CS3213', 'CS5432']] as [number, string[]]};
        expect(checkPrereq(tree, 'CS1010')).toBe(false);
    });

});