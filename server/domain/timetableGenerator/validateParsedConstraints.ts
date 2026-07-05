import { ParsedConstraints } from '../../types/timetableGenerator';
import { constraintdefaults } from '../../types/timetableGenerator';

interface ValidationResult {
    constraints: ParsedConstraints;
    valid: boolean;
    issues: string[]
}

const validDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

const hhmmRegex = /^([01]\d|2[0-3])[0-5]\d$/;

export function validateParsedConstraints(raw: unknown): ValidationResult {

    let issues: string[] = [];

    const constraints: ParsedConstraints = {
        hard: { ...constraintdefaults.hard },
        soft: { ...constraintdefaults.soft }
    };

    if (typeof raw !== 'object' || raw === null) {
        issues.push('Constraints must be an object');
        return { constraints, valid: false, issues };
    }

    const obj = raw as Record<string, unknown>;

    if (obj.hard === undefined) {
        issues.push('hard: missing');
    } else if (typeof obj.hard !== 'object' || obj.hard === null) {
        issues.push('hard: invalid type, expected object');
    }

    if (obj.soft === undefined) {
        issues.push('soft: missing');
    } else if (typeof obj.soft !== 'object' || obj.soft === null) {
        issues.push('soft: invalid type, expected object');
    }

    const hard = typeof obj.hard === 'object' && obj.hard !== null ? obj.hard as Record<string, unknown> : {};

    const soft = typeof obj.soft === 'object' && obj.soft !== null ? obj.soft as Record<string, unknown> : {};

    // Validate hard constraints

    if (Array.isArray(hard.freeDays)) {
        constraints.hard.freeDays = hard.freeDays.filter(day => {
            if (typeof day !== 'string' || !validDays.includes(day)) {
                issues.push(`Invalid hard.freeDays entry: ${String(day)}`);
                return false;
            }
            return true;
        });
    } else if (hard.freeDays !== undefined) {
        issues.push('hard.freeDays must be an array of strings');
    }

    if (hard.earliestStart === null || hard.earliestStart === undefined) {
        constraints.hard.earliestStart = null;
    } else if (
        typeof hard.earliestStart === 'string' &&
        hhmmRegex.test(hard.earliestStart)
    ) {
        constraints.hard.earliestStart = hard.earliestStart;
    } else {
        issues.push('hard.earliestStart must be a valid HHMM string or null');
    }

    if (hard.latestEnd === null || hard.latestEnd === undefined) {
        constraints.hard.latestEnd = null;
    } else if (
        typeof hard.latestEnd === 'string' &&
        hhmmRegex.test(hard.latestEnd)
    ) {
        constraints.hard.latestEnd = hard.latestEnd;
    } else {
        issues.push('hard.latestEnd must be a valid HHMM string or null');
    }

    if (
        constraints.hard.earliestStart !== null &&
        constraints.hard.latestEnd !== null &&
        constraints.hard.earliestStart >= constraints.hard.latestEnd
    ) {
        issues.push('hard.earliestStart must be earlier than hard.latestEnd');
        constraints.hard.earliestStart = null;
        constraints.hard.latestEnd = null;
    }

    if (hard.maxDailyHours === null || hard.maxDailyHours === undefined) {
        constraints.hard.maxDailyHours = null;
    } else if (
        typeof hard.maxDailyHours === 'number' &&
        hard.maxDailyHours > 0 &&
        hard.maxDailyHours <= 24
    ) {
        constraints.hard.maxDailyHours = hard.maxDailyHours;
    } else {
        issues.push('hard.maxDailyHours must be a number between 1 and 24 or null');
    }

    // Validate soft constraints

    if (soft.preferBackToBack === null || soft.preferBackToBack === undefined) {
        constraints.soft.preferBackToBack = null;
    } else if (typeof soft.preferBackToBack === 'boolean') {
        constraints.soft.preferBackToBack = soft.preferBackToBack;
    } else {
        issues.push('soft.preferBackToBack must be a boolean or null');
    }

    if (soft.preferEarlyStart === null || soft.preferEarlyStart === undefined) {
        constraints.soft.preferEarlyStart = null;
    } else if (typeof soft.preferEarlyStart === 'boolean') {
        constraints.soft.preferEarlyStart = soft.preferEarlyStart;
    } else {
        issues.push('soft.preferEarlyStart must be a boolean or null');
    }

    if (soft.preferLateStart === null || soft.preferLateStart === undefined) {
        constraints.soft.preferLateStart = null;
    } else if (typeof soft.preferLateStart === 'boolean') {
        constraints.soft.preferLateStart = soft.preferLateStart;
    } else {
        issues.push('soft.preferLateStart must be a boolean or null');
    }

    if (Array.isArray(soft.preferFreeDays)) {
        constraints.soft.preferFreeDays = soft.preferFreeDays.filter(day => {
            if (typeof day !== 'string' || !validDays.includes(day)) {
                issues.push(`Invalid soft.preferFreeDays entry: ${String(day)}`);
                return false;
            }
            return true;
        });
    } else if (soft.preferFreeDays !== undefined) {
        issues.push('soft.preferFreeDays must be an array of strings');
    }

    if (soft.minimizeCampusDays === null || soft.minimizeCampusDays === undefined) {
        constraints.soft.minimizeCampusDays = null;
    } else if (typeof soft.minimizeCampusDays === 'boolean') {
        constraints.soft.minimizeCampusDays = soft.minimizeCampusDays;
    } else {
        issues.push('soft.minimizeCampusDays must be a boolean or null');
    }

    const valid = issues.length === 0;

    return { constraints, valid, issues };
}