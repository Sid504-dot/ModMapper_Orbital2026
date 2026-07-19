import { PrereqTree } from '../../types/prereq';

import { n0f, matches } from "./matches";

export function checkPrereq(tree: PrereqTree, prereqModule: string): boolean {
    if (typeof tree === 'string') {
        return matches(prereqModule, tree);
    }

    if ('or' in tree) {
        return tree.or.some(x =>
            typeof x !== 'string' && x.nOf
                ? n0f(x, prereqModule)
                : matches(prereqModule, x)
        );
    }

    if ('and' in tree) {
        return tree.and.some(group => {
            if (typeof group === 'string') {
                return matches(prereqModule, group);
            }

            if ('or' in group) {
                return group.or.some(x =>
                    typeof x !== 'string' && x.nOf
                        ? n0f(x, prereqModule)
                        : matches(prereqModule, x)
                );
            }

            return n0f(group, prereqModule);
        });
    }

    return n0f(tree, prereqModule);
}