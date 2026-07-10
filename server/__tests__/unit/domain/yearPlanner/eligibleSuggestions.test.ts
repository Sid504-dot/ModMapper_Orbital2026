import { describe, expect, test, afterEach, jest } from '@jest/globals';

import { eligibleSuggestions } from '../../../../domain/yearPlanner/eligibleSuggestions';
import * as eligibility from '../../../../domain/yearPlanner/eligibiltyCheck';

import { RuleBook } from '../../../../types/ruleBookYearPlanner';

describe('eligibleSuggestions', () => {

    const rulebook: RuleBook = {
        liveGroupIds: new Set([1]),
        prereqDAG: new Map(),
        descriptions: new Map(),
        unitsByCode: new Map(),
        groups: [
            {
                id: 1,
                kind: 'N_OF',
                n: 1,
                units_required: null,
                programme_id: 1,
                label: 'Core'
            },
            {
                id: 2,
                kind: 'ALL_OF',
                n: null,
                units_required: null,
                programme_id: 1,
                label: 'Required'
            }
        ],
        groupModules: new Map([
            [1, ['CS2030', 'CS2040']],
            [2, ['CS2030', 'CS2040']]
        ])
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('returns eligible modules for an N_OF group', () => {

        jest.spyOn(eligibility, 'isEligible')
            .mockReturnValue(true);

        const result = eligibleSuggestions(
            1,
            1,
            [],
            rulebook
        );

        expect(result.groupKind).toBe('N_OF');

        expect(result.eligible).toEqual([
            'CS2030',
            'CS2040'
        ]);
    });

    test('returns eligible modules for an ALL_OF group', () => {

        jest.spyOn(eligibility, 'isEligible')
            .mockReturnValue(true);

        const result = eligibleSuggestions(
            2,
            1,
            [],
            rulebook
        );

        expect(result.groupKind).toBe('ALL_OF');

        expect(result.eligible).toEqual([
            'CS2030',
            'CS2040'
        ]);
    });

    test('filters out already placed modules', () => {

        jest.spyOn(eligibility, 'isEligible')
            .mockReturnValue(true);

        const result = eligibleSuggestions(
            1,
            2,
            [
                {
                    module_code: 'CS2030',
                    sem_index: 1,
                    placed_for_group_id: 1
                }
            ],
            rulebook
        );

        expect(result.groupKind).toBe('N_OF');

        expect(result.eligible).toEqual([
            'CS2040'
        ]);
    });

    test('filters out ineligible modules', () => {

        jest.spyOn(eligibility, 'isEligible')
            .mockImplementation((code) => code === 'CS2030');

        const result = eligibleSuggestions(
            1,
            2,
            [],
            rulebook
        );

        expect(result.eligible).toEqual([
            'CS2030'
        ]);
    });

    test('returns empty eligible list when group has no modules', () => {

        const result = eligibleSuggestions(
            999,
            1,
            [],
            rulebook
        );

        expect(result.groupKind).toBeUndefined();

        expect(result.eligible).toEqual([]);
    });

});