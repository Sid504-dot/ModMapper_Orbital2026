import { RuleBook, YearPlan, YearPlanSems, GroupKind } from "../../types/ruleBookYearPlanner";
import { PlanInsights, MissingPrereq } from "../../types/planInsights";
import { anyMissingPrereq } from "../prereq/anyMissingPrereq";
import { getPrereqModules } from "../prereq/getPrereqModuleCodes";

export function planInsights(plan: YearPlan[], budgets: YearPlanSems[], rulebook: RuleBook): PlanInsights {

    const placed = new Set<string>(plan.map(p => p.module_code));

    const semMap = new Map<number, string[]>();

    for (const row of plan) {
        if (!semMap.has(row.sem_index)) {
            semMap.set(row.sem_index, []);
        }

        semMap.get(row.sem_index)!.push(row.module_code);
    }

    const prereqHints: {code: string; sem: number; missing: MissingPrereq}[] = [];

    for (const row of plan) {

        const taken = plan
            .filter(p => p.sem_index < row.sem_index)
            .map(p => p.module_code);

        const tree = rulebook.prereqDAG.get(row.module_code);

        if (!tree) {
            continue;
        }

        const required = getPrereqModules(tree);
        const missing = anyMissingPrereq(required, taken);

        if (missing.length > 0) {
            prereqHints.push({
                code: row.module_code,
                sem: row.sem_index,
                missing
            });
        }
    }

    const capHints: {sem: number; used: number; cap: number | null}[] = [];

    for (const [sem, codes] of semMap) {

        const budget = budgets.find(b => b.sem_index === sem);

        let used = 0;

        for (const code of codes) {
            used += rulebook.unitsByCode.get(code) ?? 4;
        }

        if (!budget) {
            capHints.push({
                sem,
                used,
                cap: null
            });
            continue;
        }

        if (used >= budget.max_units) {
            capHints.push({
                sem,
                used,
                cap: budget.max_units
            });
        }
    }

    const groupProgress: {groupId: number; label: string; kind: GroupKind; placed: number; required: number; isUnitBased: boolean}[] = [];

    for (const group of rulebook.groups) {

        const pool = rulebook.groupModules.get(group.id) ?? [];

        const placedCodes = pool.filter(code =>
            placed.has(code)
        );

        switch (group.kind) {

            case 'ALL_OF':
                groupProgress.push({
                    groupId: group.id,
                    label: group.label,
                    kind: group.kind,
                    placed: placedCodes.length,
                    required: pool.length,
                    isUnitBased: false
                });
                break;

            case 'N_OF':
                groupProgress.push({
                    groupId: group.id,
                    label: group.label,
                    kind: group.kind,
                    placed: placedCodes.length,
                    required: group.n ?? 0,
                    isUnitBased: false
                });
                break;

            case 'MC_FROM': {
                let units = 0;

                for (const code of placedCodes) {
                    units += rulebook.unitsByCode.get(code) ?? 4;
                }

                groupProgress.push({
                    groupId: group.id,
                    label: group.label,
                    kind: group.kind,
                    placed: units,
                    required: group.units_required ?? 0,
                    isUnitBased: true
                });

                break;
            }

            case 'UE': {
                let units = 0;

                for (const code of placedCodes) {
                    units += rulebook.unitsByCode.get(code) ?? 4;
                }

                groupProgress.push({
                    groupId: group.id,
                    label: group.label,
                    kind: group.kind,
                    placed: units,
                    required: group.units_required ?? 0,
                    isUnitBased: true
                });

                break;
            }
        }
    }

    const stillToPlace: {groupId: number; label: string; modules: string[]}[] = [];

    for (const group of rulebook.groups) {

        if (group.kind !== 'ALL_OF') {
            continue;
        }

        const pool = rulebook.groupModules.get(group.id) ?? [];

        const remaining = pool.filter(code =>
            !placed.has(code)
        );

        if (remaining.length > 0) {
            stillToPlace.push({
                groupId: group.id,
                label: group.label,
                modules: remaining
            });
        }
    }

    return {
        prereqHints,
        capHints,
        groupProgress,
        stillToPlace
    };
}