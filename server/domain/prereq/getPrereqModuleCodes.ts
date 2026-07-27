import { PrereqTree, PrereqLeaf } from '../../types/prereq';


export function getPrereqModules( tree: PrereqTree | null | undefined ): Record<number, PrereqLeaf[]> {
    const ans: Record<number, PrereqLeaf[]> = {};

    const extract = (x: PrereqLeaf): PrereqLeaf | null => {
        if (typeof x !== 'string') return x;
        return x.match(/[A-Z]{2,4}\d{1,4}[A-Z]{0,3}%?/)?.[0] ?? null;
    };

    if (!tree || (typeof tree === 'object' && Object.keys(tree).length === 0)) return ans;

    if (typeof tree === 'string') {
        const e = extract(tree);
        ans[1] = e !== null ? [e] : [];
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

    const groups = Array.isArray(tree)
        ? tree
        : Array.isArray((tree as any).and) ? tree.and : null;

    if (!groups) {
        console.warn('getPrereqModules: unrecognized node shape', tree);
        return ans;  
    }

    let count = 1;
    for (const group of groups) {
        if (typeof group === 'string') {
            const e = extract(group);
            ans[count] = e !== null ? [e] : [];
        } else if ('or' in group) {
            ans[count] = group.or
                .map(extract)
                .filter((x: PrereqLeaf | null): x is PrereqLeaf => x !== null);
        } else {
            ans[count] = [group];   // nested and/nOf kept as-is
        }
        count++;
    }

    return ans;
}