import { anyMissingPrereq } from "../domain/prereq/anyMissingPrereq";

export interface PlanInsights {
    prereqHints: {
        code: string;
        sem: number;
        missing: ReturnType<typeof anyMissingPrereq>;
    }[];
    capHints: {
        sem: number;
        used: number;
        cap: number | null;
    }[];
    groupProgress: {
        groupId: number;
        label: string;
        kind: string;
        placed: number;
        total?: number;
        needed?: number;
        units?: number;
        unitsRequired?: number | null;
    }[];
    stillToPlace: {
        groupId: number;
        label: string;
        modules: string[];
    }[];
}


export type MissingPrereq =
    Array<
        Array<
            string |
            {
                need: number;
                choices: string[];
            }
        >
    >;