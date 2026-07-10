import { describe, expect, test } from '@jest/globals';
import { search } from '../../../../domain/timetableGenerator/timetableOptions';
import { NUSModsLesson, ParsedConstraints} from '../../../../types/timetableGenerator';
import { Candidate, Decision } from '../../../../domain/timetableGenerator/timetableOptions';

const defaultConstraints: ParsedConstraints = {
    hard: {
        freeDays: [],
        earliestStart: null,
        latestEnd: null,
        maxDailyHours: null
    },
    soft: {
        preferBackToBack: null,
        preferEarlyStart: null,
        preferLateStart: null,
        preferFreeDays: [],
        minimizeCampusDays: null
    }
};

const MAX_EXPLORED = 100;
const MAX_SOLUTIONS = 100;

function lesson( day: string, startTime: string, endTime: string, lessonType = 'Lecture', classNo = '1'): NUSModsLesson {
    return {
        lessonType,
        classNo,
        day,
        startTime,
        endTime,
        venue: 'LT19',
        size: 100,
        weeks: [1, 2, 3]
    };
}

function candidate( classNo: string, lessons: NUSModsLesson[]): Candidate {
    return { classNo, lessons };
}

function decision(
    moduleCode: string,
    lessonType: string,
    candidates: Candidate[]
): Decision {
    return {
        moduleCode,
        lessonType,
        candidates
    };
}

const monday09to11 = lesson('Monday', '0900', '1100');
const monday10to12 = lesson('Monday', '1000', '1200');
const monday12to14 = lesson('Monday', '1200', '1400');
const monday14to16 = lesson('Monday', '1400', '1600');
const monday16to18 = lesson('Monday', '1600', '1800');

const tuesday10to12 = lesson('Tuesday', '1000', '1200');
const tuesday12to14 = lesson('Tuesday', '1200', '1400');

const wednesday10to12 = lesson('Wednesday', '1000', '1200');
const thursday10to12 = lesson('Thursday', '1000', '1200');
const friday10to12 = lesson('Friday', '1000', '1200');

describe('search', () => {

    test('Empty decisions', () => {

        const decisions: Decision[] = [];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(1);
        expect(result.solutions[0]).toEqual([]);
    });


    test('Single valid candidate', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(1);

        expect(result.solutions[0][0].moduleCode).toBe('CS1010');
        expect(result.solutions[0][0].lessonType).toBe('Lecture');
        expect(result.solutions[0][0].classNo).toBe('1');
    });


    test('Multiple candidates', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12]),
                    candidate('2', [tuesday10to12]),
                    candidate('3', [wednesday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(3);

        expect(result.solutions[0][0].classNo).toBe('1');
        expect(result.solutions[1][0].classNo).toBe('2');
        expect(result.solutions[2][0].classNo).toBe('3');
    });


    test('Multiple modules', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12]),
                    candidate('2', [tuesday10to12])
                ]
            ),
            decision(
                'MA1521',
                'Lecture',
                [
                    candidate('A', [wednesday10to12]),
                    candidate('B', [thursday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(4);
    });


    test('Clashing combinations are rejected', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12])
                ]
            ),
            decision(
                'MA1521',
                'Lecture',
                [
                    candidate('A', [monday10to12]),
                    candidate('B', [monday12to14])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(1);

        expect(result.solutions[0][0].classNo).toBe('1');
        expect(result.solutions[0][1].classNo).toBe('B');
    });


    test('No valid timetable', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12])
                ]
            ),
            decision(
                'MA1521',
                'Lecture',
                [
                    candidate('A', [monday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });


    test('Free day constraint rejects timetable', () => {

        const constraints: ParsedConstraints = {
            ...defaultConstraints,
            hard: {
                ...defaultConstraints.hard,
                freeDays: ['Friday']
            }
        };

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [friday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            constraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });

        test('Earliest start constraint rejects timetable', () => {

        const constraints: ParsedConstraints = {
            ...defaultConstraints,
            hard: {
                ...defaultConstraints.hard,
                earliestStart: '1000'
            }
        };

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday09to11])
                ]
            )
        ];

        const result = search(
            decisions,
            constraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });


    test('Latest end constraint rejects timetable', () => {

        const constraints: ParsedConstraints = {
            ...defaultConstraints,
            hard: {
                ...defaultConstraints.hard,
                latestEnd: '1700'
            }
        };

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate(
                        '1',
                        [
                            lesson(
                                'Monday',
                                '1600',
                                '1800'
                            )
                        ]
                    )
                ]
            )
        ];

        const result = search(
            decisions,
            constraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });


    test('Max daily hours exceeded', () => {

        const constraints: ParsedConstraints = {
            ...defaultConstraints,
            hard: {
                ...defaultConstraints.hard,
                maxDailyHours: 2
            }
        };

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12])
                ]
            ),
            decision(
                'CS1231',
                'Lecture',
                [
                    candidate('1', [monday12to14])
                ]
            )
        ];

        const result = search(
            decisions,
            constraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });


    test('Max daily hours exactly equal to limit is allowed', () => {

        const constraints: ParsedConstraints = {
            ...defaultConstraints,
            hard: {
                ...defaultConstraints.hard,
                maxDailyHours: 4
            }
        };

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12])
                ]
            ),
            decision(
                'CS1231',
                'Lecture',
                [
                    candidate('1', [monday12to14])
                ]
            )
        ];

        const result = search(
            decisions,
            constraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(1);
    });


    test('Candidate containing multiple lesson rows is accepted', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Tutorial',
                [
                    candidate(
                        '01',
                        [
                            monday10to12,
                            wednesday10to12
                        ]
                    )
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.solutions).toHaveLength(1);
        expect(result.solutions[0][0].lessons).toHaveLength(2);
    });


    test('MAX_SOLUTIONS truncates search', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12]),
                    candidate('2', [tuesday10to12]),
                    candidate('3', [wednesday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            2
        );

        expect(result.solutions).toHaveLength(2);
        expect(result.truncated).toBe(true);
    });


    test('MAX_EXPLORED truncates search', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12]),
                    candidate('2', [tuesday10to12]),
                    candidate('3', [wednesday10to12]),
                    candidate('4', [thursday10to12]),
                    candidate('5', [friday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            2,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(true);
    });

        test('Invalid candidate is skipped in favour of a valid candidate', () => {

        const constraints: ParsedConstraints = {
            ...defaultConstraints,
            hard: {
                ...defaultConstraints.hard,
                earliestStart: '1000'
            }
        };

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday09to11]),
                    candidate('2', [monday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            constraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(1);
        expect(result.solutions[0][0].classNo).toBe('2');
    });


    test('Mixed valid and invalid combinations', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12]),
                    candidate('2', [tuesday10to12])
                ]
            ),
            decision(
                'MA1521',
                'Lecture',
                [
                    candidate('A', [monday10to12]),
                    candidate('B', [monday12to14])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(3);
    });


    test('Decision with zero candidates produces no solutions', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                []
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });


    test('Multiple lesson types generate every combination', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('L1', [monday10to12]),
                    candidate('L2', [tuesday10to12])
                ]
            ),
            decision(
                'CS1010',
                'Tutorial',
                [
                    candidate('T1', [wednesday10to12]),
                    candidate('T2', [thursday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(4);
    });


    test('Three modules generate every valid combination', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12]),
                    candidate('2', [tuesday10to12])
                ]
            ),
            decision(
                'MA1521',
                'Lecture',
                [
                    candidate('A', [wednesday10to12]),
                    candidate('B', [thursday10to12])
                ]
            ),
            decision(
                'ST2334',
                'Lecture',
                [
                    candidate('X', [friday10to12]),
                    candidate('Y', [monday14to16])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.truncated).toBe(false);
        expect(result.solutions).toHaveLength(8);
    });


    test('Returned Picked objects contain the correct data', () => {

        const decisions: Decision[] = [
            decision(
                'CS1010',
                'Lecture',
                [
                    candidate('1', [monday10to12])
                ]
            )
        ];

        const result = search(
            decisions,
            defaultConstraints,
            MAX_EXPLORED,
            MAX_SOLUTIONS
        );

        expect(result.solutions).toHaveLength(1);

        const picked = result.solutions[0][0];

        expect(picked.moduleCode).toBe('CS1010');
        expect(picked.lessonType).toBe('Lecture');
        expect(picked.classNo).toBe('1');
        expect(picked.lessons).toEqual([monday10to12]);
    });

});
