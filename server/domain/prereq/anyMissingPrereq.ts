import { PrereqLeaf } from '../../types/prereq';
import { matches } from './matches'

export function anyMissingPrereq (need: Record<number, PrereqLeaf[]>, taken: string[]): (string | { need: number; choices: string[] })[][] {
    const ans: (string | { need: number; choices: string[] })[][] = [];

    for (const group of Object.values(need)) {
        let satisfied = false;
        const missing: (string | { need: number; choices: string[] })[] = [];

        for (const t of group) {
            if (typeof t !== 'string') {
                const [required, modules] = t.nOf;

                const completed = modules.filter(m =>
                    taken.some(mod => matches(mod, m))
                ).length;

                if (completed >= required) {
                    satisfied = true;
                    break;
                }

                const remaining = modules
                    .filter(m => !taken.some(mod => matches(mod, m)))
                    .map(m => m.replace(':D', ''));

                missing.push({
                    need: required - completed,
                    choices: remaining
                });

                continue;
            }

            if (taken.some(mod => matches(mod, t))) {
                satisfied = true;
                break;
            }

            missing.push(t);
        }

        if (!satisfied) {
            ans.push(missing);
        }
    }

    return ans;
}