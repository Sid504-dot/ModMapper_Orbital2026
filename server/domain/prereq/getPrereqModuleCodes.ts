import { PrereqTree, PrereqLeaf } from '../../types/prereq';


export function getPrereqModules( tree: PrereqTree | null | undefined ): Record<number, PrereqLeaf[]> {
    const ans: Record<number, PrereqLeaf[]> = {};

    const extract = (x: PrereqLeaf): PrereqLeaf | null => {
        if (typeof x !== 'string') {
            return x;
        }

        return x.match(/[A-Z]{2,4}\d{1,4}[A-Z]{0,3}%?/)?.[0] ?? null;
        // Extracts the module code from a prerequisite string.
        // Matches NUS module codes such as:
        // CS1010
        // MA1511:D   -> MA1511
        // CS1010%:D  -> CS1010%
        // CS2%       -> CS2%
        // The trailing ":D" or other grade requirements are ignored.
    };

    if (!tree || Object.keys(tree).length === 0) {
        return ans;
    }

    if ('or' in tree) {
        ans[1] = tree.or
            .map(extract)
            .filter((x): x is PrereqLeaf => x !== null);

        return ans;
    }

    if ('nOf' in tree) {
        ans[1] = [tree];
        return ans;
    }

    let count = 1;

    for (const group of tree.and) {
        if ('or' in group) {
            ans[count] = group.or
                .map(extract)
                .filter((x): x is PrereqLeaf => x !== null);
        } else {
            ans[count] = [group];
        }

        count++;
    }

    return ans;
}