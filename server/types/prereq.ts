export type PrereqLeaf = string | { nOf: [number, string[]] };

export type AndGroup = { or: PrereqLeaf[] } | { nOf: [number, string[]] };

export type PrereqTree = { or: PrereqLeaf[] } | { and: AndGroup[] } | { nOf: [number, string[]] };