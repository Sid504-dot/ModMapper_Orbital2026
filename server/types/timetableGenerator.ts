

export interface NUSModsLesson {
    day: string;
    size: number;
    venue: string;
    weeks: number[];
    classNo: string;
    endTime: string;   // "HHMM" 24hr, e.g. "1400"
    startTime: string; // "HHMM" 24hr, e.g. "1000"
    lessonType: string;
    covidZone?: string;
}

export interface SemesterData {
    semester: number;
    timetable: NUSModsLesson[];
    examDate?: string;
    examDuration?: number;
}

export interface ModuleRecord {
    moduleCode: string;
    title: string;
    moduleCredit?: string;
    semesterData: SemesterData[];
}

export interface ParsedConstraints {
    hard: {
        freeDays: string[];            // days that MUST have zero classes
        earliestStart: string | null;  // "HHMM", no class may start before this
        latestEnd: string | null;      // "HHMM", no class may end after this
        maxDailyHours: number | null;  // max total contact hours on any single day
    };
    soft: {
        preferBackToBack: boolean | null;  // true = bunch classes together, false = spread out
        preferEarlyStart: boolean | null;  // true = likes starting the day early
        preferLateStart: boolean | null;   // true = likes starting the day late
        preferFreeDays: string[];          // nice-to-have (not mandatory) free days
        minimizeCampusDays: boolean | null; // true = compress into fewer days on campus
    };
}

export interface TimetableOption {
    rank: number;
    score: number;
    scoreBreakdown: Record<string, number>;
    selectedSlots: Record<string, Record<string, string>>; // moduleCode -> lessonType -> classNo
    daysUsed: string[];
    totalWeeklyHours: number;
}

export interface GenerateTimetableResult {
    semester: number;
    constraints: ParsedConstraints;
    options: TimetableOption[];
}


export const constraintdefaults: ParsedConstraints = {
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