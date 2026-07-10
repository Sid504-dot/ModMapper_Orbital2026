import { NUSModsLesson, ParsedConstraints, ModuleRecord, TimetableOption } from "../../types/timetableGenerator";

export type Candidate = { classNo: string; lessons: NUSModsLesson[] };
export type Decision = { moduleCode: string; lessonType: string; candidates: Candidate[] };
export type Picked = { moduleCode: string; lessonType: string; classNo: string; lessons: NUSModsLesson[] };

function toMinutes(time: string): number {
    return parseInt(time.slice(0, 2)) * 60 + parseInt(time.slice(2));
}

function lessonsClash(a: NUSModsLesson, b: NUSModsLesson): boolean {
    if (a.day !== b.day) return false;

    let commonWeek = false;
    for (const week of a.weeks) {
        if (b.weeks.includes(week)) {
            commonWeek = true;
            break;
        }
    }

    if (!commonWeek) return false;

    const aStart = parseInt(a.startTime);
    const aEnd = parseInt(a.endTime);
    const bStart = parseInt(b.startTime);
    const bEnd = parseInt(b.endTime);

    return (aStart < bEnd && bStart < aEnd);
}

function violatesHard(lesson: NUSModsLesson, hard: ParsedConstraints['hard']): boolean {
    if (hard.freeDays.includes(lesson.day)) return true;

    const start = parseInt(lesson.startTime);
    const end = parseInt(lesson.endTime);

    if (hard.earliestStart && start < parseInt(hard.earliestStart)) return true;
    if (hard.latestEnd && end > parseInt(hard.latestEnd)) return true;

    return false;
}

export function search(
    decisions: Decision[],
    constraints: ParsedConstraints,
    MAX_EXPLORED: number,
    MAX_SOLUTIONS: number
): {
    solutions: Picked[][];
    truncated: boolean;
} {

    let solutions: Picked[][] = [];
    let explored: number = 0;
    let picked: Picked[] = [];
    let pickedLessons: NUSModsLesson[] = [];
    let dailyMinutes: Record<string, number> = {};
    let truncated = false;

    function backtrack(index: number): boolean {
        if (explored >= MAX_EXPLORED || solutions.length >= MAX_SOLUTIONS) {
            truncated = true;
            return true;
        }

        if (index === decisions.length) {
            solutions.push([...picked]);
            return false;
        }

        const decision = decisions[index];

        for (const candidate of decision.candidates) {
            explored++;

            if (explored >= MAX_EXPLORED) {
                truncated = true;
                return true;
            }

            let ok = true;

            for (const lesson of candidate.lessons) {
                if (violatesHard(lesson, constraints.hard)) {
                    ok = false;
                    break;
                }

                for (const pickedLesson of pickedLessons) {
                    if (lessonsClash(lesson, pickedLesson)) {
                        ok = false;
                        break;
                    }
                }

                if (!ok) {
                    break;
                }
            }

            if (!ok) {
                continue;
            }

            const addedMinutes: Record<string, number> = {};

            for (const lesson of candidate.lessons) {
                const minutes =
                    toMinutes(lesson.endTime) -
                    toMinutes(lesson.startTime);

                addedMinutes[lesson.day] =
                    (addedMinutes[lesson.day] || 0) + minutes;
            }

            if (constraints.hard.maxDailyHours) {
                let exceed = false;

                for (const day in addedMinutes) {
                    const total =
                        (dailyMinutes[day] || 0) + addedMinutes[day];

                    if (total > constraints.hard.maxDailyHours * 60) {
                        exceed = true;
                        break;
                    }
                }

                if (exceed) {
                    continue;
                }
            }

            picked.push({
                moduleCode: decision.moduleCode,
                lessonType: decision.lessonType,
                classNo: candidate.classNo,
                lessons: candidate.lessons
            });

            for (const lesson of candidate.lessons) {
                pickedLessons.push(lesson);
            }

            for (const day in addedMinutes) {
                dailyMinutes[day] =
                    (dailyMinutes[day] || 0) + addedMinutes[day];
            }

            const stop = backtrack(index + 1);

            picked.pop();

            for (let i = 0; i < candidate.lessons.length; i++) {
                pickedLessons.pop();
            }

            for (const day in addedMinutes) {
                dailyMinutes[day] -= addedMinutes[day];
            }

            if (stop === true) {
                return true;
            }
        }

        return false;
    }

    backtrack(0);

    return {
        solutions,
        truncated
    };
}


export type LessonGroups = Record<string, Record<string, Record<string, NUSModsLesson[]>>>;

export function buildLessonGroups( modules: ModuleRecord[], semester: number ): LessonGroups {

    const result: LessonGroups = {};

    for (const module of modules) {
        const semesterData = module.semesterData.find(
            (data) => data.semester === semester
        );

        if (!semesterData) {
            continue;
        }

        result[module.moduleCode] = {};

        for (const lesson of semesterData.timetable) {
            if (!result[module.moduleCode][lesson.lessonType]) {
                result[module.moduleCode][lesson.lessonType] = {};
            }

            if (!result[module.moduleCode][lesson.lessonType][lesson.classNo]) {
                result[module.moduleCode][lesson.lessonType][lesson.classNo] = [];
            }

            result[module.moduleCode][lesson.lessonType][lesson.classNo].push(lesson);
        }
    }

    return result;
}

export function buildDecisions( groups: LessonGroups ): Decision[] {

    const decisions: Decision[] = [];

    for (const moduleCode of Object.keys(groups)) {
        for (const lessonType of Object.keys(groups[moduleCode])) {

            const candidates: Candidate[] = [];

            for (const classNo of Object.keys(groups[moduleCode][lessonType])) {
                candidates.push({
                    classNo: classNo,
                    lessons: groups[moduleCode][lessonType][classNo]
                });
            }

            decisions.push({
                moduleCode,
                lessonType,
                candidates
            });
        }
    }

    decisions.sort((a, b) => a.candidates.length - b.candidates.length);

    return decisions;
}

type ScoreBreakdown = {
    backToBack: number;
    startTimePreference: number;
    freeDayBonus: number;
    campusDaysPenalty: number;
};

const FREE_DAY_BONUS = 100;
const CAMPUS_DAY_WEIGHT = 50;
const BACK_TO_BACK_WEIGHT = 0.4;
const START_TIME_WEIGHT = 0.2;

export function scoreSolution(
    solution: Picked[],
    soft: ParsedConstraints['soft']
): { score: number; breakdown: ScoreBreakdown } {

    const allLessons: NUSModsLesson[] = [];

    for (const picked of solution) {
        for (const lesson of picked.lessons) {
            allLessons.push(lesson);
        }
    }

    const byDay: Record<string, NUSModsLesson[]> = {};

    for (const lesson of allLessons) {
        if (!byDay[lesson.day]) {
            byDay[lesson.day] = [];
        }

        byDay[lesson.day].push(lesson);
    }

    for (const day of Object.keys(byDay)) {
        byDay[day].sort(
            (a, b) => parseInt(a.startTime) - parseInt(b.startTime)
        );
    }

    const daysUsed = Object.keys(byDay);

    let gapMinutesTotal = 0;

    for (const day of daysUsed) {
        const lessons = byDay[day];

        for (let i = 1; i < lessons.length; i++) {
            const gap =
                toMinutes(lessons[i].startTime) -
                toMinutes(lessons[i - 1].endTime);

            gapMinutesTotal += Math.max(gap, 0);
        }
    }

    let backToBack = 0;

    if (soft.preferBackToBack === true) {
        backToBack = -gapMinutesTotal;
    } else if (soft.preferBackToBack === false) {
        backToBack = gapMinutesTotal;
    }

    let totalStartMinutes = 0;

    for (const lesson of allLessons) {
        totalStartMinutes += toMinutes(lesson.startTime);
    }

    const avgStart =
        totalStartMinutes / (allLessons.length || 1);

    let startTimePreference = 0;

    if (soft.preferEarlyStart === true && soft.preferLateStart !== true) {
        startTimePreference = -avgStart;
    } else if (soft.preferLateStart === true && soft.preferEarlyStart !== true) {
        startTimePreference = avgStart;
    }

    let freeDayBonus = 0;

    for (const day of soft.preferFreeDays) {
        if (!daysUsed.includes(day)) {
            freeDayBonus += FREE_DAY_BONUS;
        }
    }

    let campusDaysPenalty = 0;

    if (soft.minimizeCampusDays) {
        campusDaysPenalty = -daysUsed.length * CAMPUS_DAY_WEIGHT;
    }

    const breakdown: ScoreBreakdown = {
        backToBack,
        startTimePreference,
        freeDayBonus,
        campusDaysPenalty
    };

    const score =
        breakdown.backToBack * BACK_TO_BACK_WEIGHT +
        breakdown.startTimePreference * START_TIME_WEIGHT +
        breakdown.freeDayBonus +
        breakdown.campusDaysPenalty;

    return {
        score,
        breakdown
    };
}

export function generateTimetableOptions(
    modules: ModuleRecord[],
    semester: number,
    constraints: ParsedConstraints,
    opts?: { maxResults?: number }
): { options: TimetableOption[]; truncated: boolean } {

    const MAX_EXPLORED = 150_000;
    const MAX_SOLUTIONS = 500;
    const maxResults = opts?.maxResults ?? 5;

    const groups = buildLessonGroups(modules, semester);
    const decisions = buildDecisions(groups);

    if (decisions.length === 0) {
        return {
            options: [],
            truncated: false
        };
    }

    const { solutions, truncated } = search(
        decisions,
        constraints,
        MAX_EXPLORED,
        MAX_SOLUTIONS
    );

    const scored = solutions.map(solution => {

        const { score, breakdown } = scoreSolution(
            solution,
            constraints.soft
        );

        const selectedSlots: Record<string, Record<string, string>> = {};

        const daysSet = new Set<string>();
        let totalMinutes = 0;

        for (const picked of solution) {

            if (!selectedSlots[picked.moduleCode]) {
                selectedSlots[picked.moduleCode] = {};
            }

            selectedSlots[picked.moduleCode][picked.lessonType] = picked.classNo;

            for (const lesson of picked.lessons) {
                daysSet.add(lesson.day);

                totalMinutes +=
                    toMinutes(lesson.endTime) -
                    toMinutes(lesson.startTime);
            }
        }

        return {
            score,
            breakdown,
            selectedSlots,
            daysUsed: Array.from(daysSet),
            totalWeeklyHours:
                Math.round((totalMinutes / 60) * 10) / 10
        };
    });

    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, maxResults);

    const options: TimetableOption[] = top.map((solution, index) => ({
        rank: index + 1,
        score: Math.round(solution.score * 100) / 100,
        scoreBreakdown: solution.breakdown,
        selectedSlots: solution.selectedSlots,
        daysUsed: solution.daysUsed,
        totalWeeklyHours: solution.totalWeeklyHours
    }));

    return {
        options,
        truncated
    };
}