import { PrereqTree } from '../../types/prereq';

import { matches, n0f } from './matches';

export function buildUserPrereqTree( moduleCodes: string[], prereqMap: Record<string, PrereqTree | null>): Record<string, string[]> {
    const ans: Record<string, string[]> = {};

    for (const moduleCode of moduleCodes) {
        ans[moduleCode] = [];

        const tree = prereqMap[moduleCode];

        if (!tree || Object.keys(tree).length === 0) {
            continue;
        }


        for (const prereqModule of moduleCodes) {
            let found = false;

            if ('or' in tree) {
                found = tree.or.some(x =>
                    typeof x !== 'string' && x.nOf
                        ? n0f(x, prereqModule)
                        : matches(prereqModule, x)
                );
            } else if ('and' in tree) {
                found = tree.and.some(group => {
                    if ('or' in group) {
                        return group.or.some(x =>
                            typeof x !== 'string' && x.nOf
                                ? n0f(x, prereqModule)
                                : matches(prereqModule, x)
                        );
                    }

                    return n0f(group, prereqModule);
                });
            } else {
                found = n0f(tree, prereqModule);
            }

            if (found) {
                ans[moduleCode].push(prereqModule);
            }
        }
    }

    return ans;
}