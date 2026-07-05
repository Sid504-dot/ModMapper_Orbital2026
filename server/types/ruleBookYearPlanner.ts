export type ProgrammeType = 'major' | 'second_major' | 'minor' | 'common';

export type GroupKind = 'ALL_OF' | 'N_OF' | 'MC_FROM' | 'UE';

import { PrereqTree } from "./prereq";

export interface Group {
    id: number;
    kind: GroupKind;
    n: number | null;
    units_required: number | null;
    programme_id: number;
    label: string;
}

export interface RuleBook {
    liveGroupIds: Set<number>;
    prereqDAG: Map<string, PrereqTree>;
    groups: Group[];
    groupModules: Map<number, string[]>;
    spanByCode: Map<string, number>;
    programmeTypes: Map<number, ProgrammeType>;
}

export interface YearPlan {
    module_code: string;
    sem_index: number; 
    placed_for_group_id: number | null;
    pinned: boolean;
}

export interface YearPlanSems {
    sem_index: number;
    max_units: number;
}