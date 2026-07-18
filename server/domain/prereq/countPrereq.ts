import { PrereqTree } from '../../types/prereq';

export function countPrereq(tree: PrereqTree | null | undefined): number {
    if (!tree) {
        return 0;
    }

    if (Object.keys(tree).length === 0) {
        return 0;
    }

    if ('or' in tree) {
        return 1;
    }

    if ('nOf' in tree) {
        return 1;
    }

    return tree.and.length;
}