import { getPrereqModules } from '../prereq/getPrereqModuleCodes';
import { anyMissingPrereq } from '../prereq/anyMissingPrereq';
import { PrereqTree } from '../../types/prereq';

export function isEligible(code: string, prereqDAG: Map<string, PrereqTree>, taken: string[]): boolean {
    const tree = prereqDAG.get(code);
    if (!tree) {
        return true;
    }
    const need = getPrereqModules(tree);
    return anyMissingPrereq(need, taken).length === 0;
}