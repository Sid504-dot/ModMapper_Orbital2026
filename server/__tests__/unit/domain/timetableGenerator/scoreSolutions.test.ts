import { describe, expect, test } from '@jest/globals';
import { scoreSolution, Picked } from '../../../../domain/timetableGenerator/timetableOptions';
import { NUSModsLesson, ParsedConstraints } from '../../../../types/timetableGenerator';

const defaultSoft: ParsedConstraints['soft'] = {
    preferBackToBack: null,
    preferEarlyStart: null,
    preferLateStart: null,
    preferFreeDays: [],
    minimizeCampusDays: null
};

function lesson(
    day: string,
    startTime: string,
    endTime: string,
    lessonType = 'Lecture',
    classNo = '1'
): NUSModsLesson {
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

function picked(
    moduleCode: string,
    lessonType: string,
    classNo: string,
    lessons: NUSModsLesson[]
): Picked {
    return {
        moduleCode,
        lessonType,
        classNo,
        lessons
    };
}

const monday10to12 = lesson('Monday', '1000', '1200');
const monday12to14 = lesson('Monday', '1200', '1400');
const monday15to17 = lesson('Monday', '1500', '1700');

const tuesday09to11 = lesson('Tuesday', '0900', '1100');
const tuesday10to12 = lesson('Tuesday', '1000', '1200');
const tuesday16to18 = lesson('Tuesday', '1600', '1800');

const friday10to12 = lesson('Friday', '1000', '1200');

describe('scoreSolution', () => {

    test('Empty timetable', () => {

        const result = scoreSolution([], defaultSoft);

        expect(result.score).toBe(0);

        expect(result.breakdown).toEqual({
            backToBack: 0,
            startTimePreference: 0,
            freeDayBonus: 0,
            campusDaysPenalty: 0
        });
    });


    test('Back-to-back preference rewards adjacent lessons', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [monday10to12]
            ),
            picked(
                'MA1521',
                'Lecture',
                '1',
                [monday12to14]
            )
        ];

        const result = scoreSolution(solution, {
            ...defaultSoft,
            preferBackToBack: true
        });

        expect(Math.abs(result.breakdown.backToBack)).toBe(0);
    });

    test('Back-to-back preference penalises gaps', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [monday10to12]
            ),
            picked(
                'MA1521',
                'Lecture',
                '1',
                [monday15to17]
            )
        ];

        const result = scoreSolution(solution, {
            ...defaultSoft,
            preferBackToBack: true
        });

        expect(result.breakdown.backToBack).toBeLessThan(0);
    });


    test('Spread-out preference rewards gaps', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [monday10to12]
            ),
            picked(
                'MA1521',
                'Lecture',
                '1',
                [monday15to17]
            )
        ];

        const result = scoreSolution(solution, {
            ...defaultSoft,
            preferBackToBack: false
        });

        expect(result.breakdown.backToBack).toBeGreaterThan(0);
    });


    test('Early start preference rewards early timetable', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [tuesday09to11]
            )
        ];

        const result = scoreSolution(solution, {
            ...defaultSoft,
            preferEarlyStart: true
        });

        expect(result.breakdown.startTimePreference).toBeLessThan(0);
    });


    test('Late start preference rewards late timetable', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [tuesday16to18]
            )
        ];

        const result = scoreSolution(solution, {
            ...defaultSoft,
            preferLateStart: true
        });

        expect(result.breakdown.startTimePreference).toBeGreaterThan(0);
    });

        test('Early start and late start together cancel out', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [tuesday10to12]
            )
        ];

        const result = scoreSolution(solution, {
            ...defaultSoft,
            preferEarlyStart: true,
            preferLateStart: true
        });

        expect(result.breakdown.startTimePreference).toBe(0);
    });


    test('Free day bonus awarded when preferred free day is unused', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [monday10to12]
            )
        ];

        const result = scoreSolution(solution, {
            ...defaultSoft,
            preferFreeDays: ['Friday']
        });

        expect(result.breakdown.freeDayBonus).toBeGreaterThan(0);
    });


    test('No free day bonus when preferred free day contains lessons', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [friday10to12]
            )
        ];

        const result = scoreSolution(solution, {
            ...defaultSoft,
            preferFreeDays: ['Friday']
        });

        expect(result.breakdown.freeDayBonus).toBe(0);
    });


    test('Minimize campus days penalises multiple campus days', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [monday10to12]
            ),
            picked(
                'MA1521',
                'Lecture',
                '1',
                [tuesday10to12]
            )
        ];

        const result = scoreSolution(solution, {
            ...defaultSoft,
            minimizeCampusDays: true
        });

        expect(result.breakdown.campusDaysPenalty).toBeLessThan(0);
    });


    test('Single campus day has smaller penalty than multiple campus days', () => {

        const oneDay = scoreSolution(
            [
                picked('CS1010', 'Lecture', '1', [monday10to12]),
                picked('MA1521', 'Lecture', '1', [monday12to14])
            ],
            {
                ...defaultSoft,
                minimizeCampusDays: true
            }
        );

        const twoDays = scoreSolution(
            [
                picked('CS1010', 'Lecture', '1', [monday10to12]),
                picked('MA1521', 'Lecture', '1', [tuesday10to12])
            ],
            {
                ...defaultSoft,
                minimizeCampusDays: true
            }
        );

        expect(oneDay.breakdown.campusDaysPenalty)
            .toBeGreaterThan(twoDays.breakdown.campusDaysPenalty);
    });


    test('Multiple soft constraints combine into one score', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [monday10to12]
            ),
            picked(
                'MA1521',
                'Lecture',
                '1',
                [monday12to14]
            )
        ];

        const result = scoreSolution(solution, {
            preferBackToBack: true,
            preferEarlyStart: true,
            preferLateStart: null,
            preferFreeDays: ['Friday'],
            minimizeCampusDays: true
        });

        expect(result.score).not.toBe(0);
    });


    test('Score equals sum of breakdown components', () => {

        const solution = [
            picked(
                'CS1010',
                'Lecture',
                '1',
                [monday10to12]
            )
        ];

        const result = scoreSolution(solution, defaultSoft);

        expect(result.score).toBe(
            result.breakdown.backToBack +
            result.breakdown.startTimePreference +
            result.breakdown.freeDayBonus +
            result.breakdown.campusDaysPenalty
        );
    });

});