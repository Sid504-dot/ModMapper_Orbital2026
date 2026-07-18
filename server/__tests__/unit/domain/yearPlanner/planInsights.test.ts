import { describe, expect, test } from '@jest/globals';
import { planInsights } from '../../../../domain/yearPlanner/planInsights';
import { RuleBook, YearPlan, YearPlanSems } from '../../../../types/ruleBookYearPlanner';
import { PrereqTree } from '../../../../types/prereq';

function emptyRuleBook(): RuleBook {
    return {
        liveGroupIds: new Set<number>(),
        prereqDAG: new Map<string, PrereqTree>(),
        groups: [],
        groupModules: new Map<number, string[]>(),
        descriptions: new Map<string, string>(),
        unitsByCode: new Map<string, number>()
    };
}

describe('planInsights', () => {

    test('returns empty insights for an empty plan', () => {
        const insights = planInsights([], [], emptyRuleBook());

        expect(insights).toEqual({
            prereqHints: [],
            capHints: [],
            groupProgress: [],
            stillToPlace: []
        });
    });

    test('detects prerequisite violations', () => {
        const rulebook = emptyRuleBook();

        rulebook.prereqDAG.set('CS2040', {
            and: [
                {
                    or: ['CS1010']
                }
            ]
        } as PrereqTree);

        const plan: YearPlan[] = [
            {
                module_code: 'CS2040',
                sem_index: 1,
                placed_for_group_id: null
            }
        ];

        const insights = planInsights(plan, [], rulebook);

        expect(insights.prereqHints).toHaveLength(1);
        expect(insights.prereqHints[0].code).toBe('CS2040');
    });

    test('does not report satisfied prerequisites', () => {
        const rulebook = emptyRuleBook();

        rulebook.prereqDAG.set('CS2040', {
            and: [
                {
                    or: ['CS1010']
                }
            ]
        } as PrereqTree);

        const plan: YearPlan[] = [
            {
                module_code: 'CS1010',
                sem_index: 1,
                placed_for_group_id: null
            },
            {
                module_code: 'CS2040',
                sem_index: 2,
                placed_for_group_id: null
            }
        ];

        const insights = planInsights(plan, [], rulebook);

        expect(insights.prereqHints).toEqual([]);
    });

    test('reports semester over budget', () => {
        const rulebook = emptyRuleBook();

        rulebook.unitsByCode.set('CS1010', 4);
        rulebook.unitsByCode.set('MA1521', 4);

        const plan: YearPlan[] = [
            {
                module_code: 'CS1010',
                sem_index: 1,
                placed_for_group_id: null
            },
            {
                module_code: 'MA1521',
                sem_index: 1,
                placed_for_group_id: null
            }
        ];

        const budgets: YearPlanSems[] = [
            {
                sem_index: 1,
                max_units: 8
            }
        ];

        const insights = planInsights(plan, budgets, rulebook);

        expect(insights.capHints).toEqual([
            {
                sem: 1,
                used: 8,
                cap: 8
            }
        ]);
    });

    test('reports semester with no budget', () => {
        const rulebook = emptyRuleBook();

        rulebook.unitsByCode.set('CS1010', 4);

        const plan: YearPlan[] = [
            {
                module_code: 'CS1010',
                sem_index: 1,
                placed_for_group_id: null
            }
        ];

        const insights = planInsights(plan, [], rulebook);

        expect(insights.capHints).toEqual([
            {
                sem: 1,
                used: 4,
                cap: null
            }
        ]);
    });

    test('tracks ALL_OF group progress', () => {
        const rulebook = emptyRuleBook();

        rulebook.groups.push({
            id: 1,
            kind: 'ALL_OF',
            label: 'Core',
            n: null,
            units_required: null,
            programme_id: 1
        });

        rulebook.groupModules.set(1, ['CS1010', 'MA1521']);

        const plan: YearPlan[] = [
            {
                module_code: 'CS1010',
                sem_index: 1,
                placed_for_group_id: 1
            }
        ];

        const insights = planInsights(plan, [], rulebook);

        expect(insights.groupProgress).toEqual([
            {
                groupId: 1,
                label: 'Core',
                kind: 'ALL_OF',
                placed: 1,
                required: 2,
                isUnitBased: false
            }
        ]);
    });

    test('tracks MC_FROM group progress by units', () => {
        const rulebook = emptyRuleBook();

        rulebook.groups.push({
            id: 1,
            kind: 'MC_FROM',
            label: 'Technical Electives',
            n: null,
            units_required: 12,
            programme_id: 1
        });

        rulebook.groupModules.set(1, [
            'CS2100',
            'CS2103'
        ]);

        rulebook.unitsByCode.set('CS2100', 4);
        rulebook.unitsByCode.set('CS2103', 4);

        const plan: YearPlan[] = [
            {
                module_code: 'CS2100',
                sem_index: 1,
                placed_for_group_id: 1
            }
        ];

        const insights = planInsights(plan, [], rulebook);

        expect(insights.groupProgress).toEqual([
            {
                groupId: 1,
                label: 'Technical Electives',
                kind: 'MC_FROM',
                placed: 4,
                required: 12,
                isUnitBased: true
            }
        ]);
    });

    test('reports compulsory modules still to place', () => {
        const rulebook = emptyRuleBook();

        rulebook.groups.push({
            id: 1,
            kind: 'ALL_OF',
            label: 'Core',
            n: null,
            units_required: null,
            programme_id: 1
        });

        rulebook.groupModules.set(1, [
            'CS1010',
            'MA1521'
        ]);

        const plan: YearPlan[] = [
            {
                module_code: 'CS1010',
                sem_index: 1,
                placed_for_group_id: 1
            }
        ];

        const insights = planInsights(plan, [], rulebook);

        expect(insights.stillToPlace).toEqual([
            {
                groupId: 1,
                label: 'Core',
                modules: ['MA1521']
            }
        ]);
    });

});