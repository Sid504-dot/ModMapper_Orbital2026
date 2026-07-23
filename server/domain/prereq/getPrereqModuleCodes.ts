import { PrereqTree, PrereqLeaf } from '../../types/prereq';


export function getPrereqModules( tree: PrereqTree | null | undefined ): Record<number, PrereqLeaf[]> {
    const ans: Record<number, PrereqLeaf[]> = {};

    const extract = (x: PrereqLeaf): PrereqLeaf | null => {
        if (typeof x !== 'string') {
            return x;
        }

        return x.match(/[A-Z]{2,4}\d{1,4}[A-Z]{0,3}%?/)?.[0] ?? null;
    };

    if (!tree || (typeof tree === 'object' && Object.keys(tree).length === 0)) {
        return ans;
    }

    // Handle bare leaf strings (e.g. "CS3230:D") passed in place of a tree object.
    if (typeof tree === 'string') {
        const extracted = extract(tree);
        ans[1] = extracted !== null ? [extracted] : [];
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
        if (typeof group === 'string') {
            const extracted = extract(group);
            ans[count] = extracted !== null ? [extracted] : [];
        } else if ('or' in group) {
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