import * as yearPlannerDB from '../../db/yearPlanner';
import * as eligible from '../../domain/yearPlanner/eligibleSuggestions';
import * as rerank from '../../services/rerank';
import { RuleBook } from '../../types/ruleBookYearPlanner';

describe('suggestForSlot', () => {

    const rulebook: RuleBook = {
        liveGroupIds: new Set(),
        prereqDAG: new Map(),
        descriptions: new Map([
            ['CS2030', 'Programming Methodology II'],
            ['CS2040', 'Data Structures']
        ]),
        unitsByCode: new Map(),
        groups: [],
        groupModules: new Map()
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('returns required modules for ALL_OF groups', async () => {

        jest.spyOn(eligible, 'eligibleSuggestions')
            .mockReturnValue({
                groupKind: 'ALL_OF',
                eligible: ['CS2030', 'CS2040']
            });

        const result = await yearPlannerDB.suggestForSlot(
            1,
            1,
            [],
            rulebook,
            'AI'
        );

        expect(result).toEqual({
            required: ['CS2030', 'CS2040'],
            ranked: [],
            others: []
        });
    });

    test('returns eligible modules as others when interest is empty', async () => {

        jest.spyOn(eligible, 'eligibleSuggestions')
            .mockReturnValue({
                groupKind: 'N_OF',
                eligible: ['CS2030', 'CS2040']
            });

        const result = await yearPlannerDB.suggestForSlot(
            1,
            1,
            [],
            rulebook,
            ''
        );

        expect(result).toEqual({
            required: [],
            ranked: [],
            others: ['CS2030', 'CS2040']
        });
    });

    test('reranks modules when interest is provided', async () => {

        jest.spyOn(eligible, 'eligibleSuggestions')
            .mockReturnValue({
                groupKind: 'N_OF',
                eligible: ['CS2030', 'CS2040']
            });

        jest.spyOn(rerank, 'rerankAndRationale')
            .mockResolvedValue([
                {
                    code: 'CS2030',
                    rationale: 'Best match',
                    score: 0.95
                }
            ]);

        const result = await yearPlannerDB.suggestForSlot(
            1,
            1,
            [],
            rulebook,
            'Artificial Intelligence'
        );

        expect(rerank.rerankAndRationale).toHaveBeenCalledWith(
            'Artificial Intelligence',
            [
                {
                    module_code: 'CS2030',
                    description: 'Programming Methodology II'
                },
                {
                    module_code: 'CS2040',
                    description: 'Data Structures'
                }
            ]
        );

        expect(result).toEqual({
            required: [],
            ranked: [
                {
                    code: 'CS2030',
                    rationale: 'Best match',
                    score: 0.95
                }
            ],
            others: ['CS2040']
        });
    });

    test('returns empty suggestions when no modules are eligible', async () => {

        jest.spyOn(eligible, 'eligibleSuggestions')
            .mockReturnValue({
                groupKind: 'N_OF',
                eligible: []
            });

        jest.spyOn(rerank, 'rerankAndRationale')
            .mockResolvedValue([]);

        const result = await yearPlannerDB.suggestForSlot(
            1,
            1,
            [],
            rulebook,
            'AI'
        );

        expect(result).toEqual({
            required: [],
            ranked: [],
            others: []
        });
    });

});