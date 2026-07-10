import { RuleBook, YearPlan, GroupKind } from "../../types/ruleBookYearPlanner";
import { isEligible } from "./eligibiltyCheck";

export function eligibleSuggestions(
    groupId: number,
    semIndex: number,
    plan: YearPlan[],
    rulebook: RuleBook
): {
    groupKind: GroupKind | undefined;
    eligible: string[];
} {

    const pool = rulebook.groupModules.get(groupId) ?? [];

    const taken = plan
        .filter(p => p.sem_index < semIndex)
        .map(p => p.module_code);

    const placed = new Set(
        plan.map(p => p.module_code)
    );

    const eligible = pool.filter(code =>
        !placed.has(code) &&
        isEligible(code, rulebook.prereqDAG, taken)
    );

    const groupKind = rulebook.groups.find(g => g.id === groupId)?.kind;

    return {
        groupKind,
        eligible
    };
}