import { FunctionalDependency, ClosureResult } from '../types/normalization';

export const computeClosure = (attrs: string[], fds: FunctionalDependency[]): string[] => {
  let closure = new Set(attrs);
  let changed = true;

  while (changed) {
    changed = false;
    for (const fd of fds) {
      if (fd.lhs.every(attr => closure.has(attr))) {
        const initialSize = closure.size;
        fd.rhs.forEach(attr => closure.add(attr));
        if (closure.size > initialSize) {
          changed = true;
        }
      }
    }
  }

  return Array.from(closure).sort();
};

export const isSuperkey = (attrs: string[], allAttrs: string[], fds: FunctionalDependency[]): boolean => {
  const closure = computeClosure(attrs, fds);
  return allAttrs.every(attr => closure.includes(attr));
};

export const isCandidateKey = (attrs: string[], allAttrs: string[], fds: FunctionalDependency[]): boolean => {
  if (!isSuperkey(attrs, allAttrs, fds)) return false;

  // Check minimality: no proper subset should be a superkey
  const combinations = (arr: string[]) => {
    const result: string[][] = [];
    const f = (prefix: string[], remaining: string[]) => {
      for (let i = 0; i < remaining.length; i++) {
        result.push([...prefix, remaining[i]]);
        f([...prefix, remaining[i]], remaining.slice(i + 1));
      }
    };
    f([], arr);
    return result;
  };

  // We only care about subsets of size attrs.length - 1 down to 1
  // Actually, we can just check all proper subsets.
  // Using a simpler approach: iterate all subsets of size < attrs.length
  
  // Helper to generate combinations of specific size is better
  const getCombinations = (arr: string[], size: number): string[][] => {
    if (size === 0) return [[]];
    if (arr.length < size) return [];
    const [first, ...rest] = arr;
    const withFirst = getCombinations(rest, size - 1).map(c => [first, ...c]);
    const withoutFirst = getCombinations(rest, size);
    return [...withFirst, ...withoutFirst];
  };

  for (let i = 1; i < attrs.length; i++) {
    const subsets = getCombinations(attrs, i);
    for (const subset of subsets) {
      if (isSuperkey(subset, allAttrs, fds)) {
        return false;
      }
    }
  }

  return true;
};

export const computeAllClosures = (allAttrs: string[], fds: FunctionalDependency[]): ClosureResult[] => {
  const results: ClosureResult[] = [];
  
  // Single attributes
  for (const attr of allAttrs) {
    const closure = computeClosure([attr], fds);
    results.push({
      attributes: [attr],
      closure,
      isSuperkey: isSuperkey([attr], allAttrs, fds),
      isCandidateKey: isCandidateKey([attr], allAttrs, fds)
    });
  }

  // Pairs if schema is small enough (<= 6 attributes) to avoid explosion
  if (allAttrs.length <= 6) {
    for (let i = 0; i < allAttrs.length; i++) {
      for (let j = i + 1; j < allAttrs.length; j++) {
        const pair = [allAttrs[i], allAttrs[j]];
        const closure = computeClosure(pair, fds);
        results.push({
          attributes: pair,
          closure,
          isSuperkey: isSuperkey(pair, allAttrs, fds),
          isCandidateKey: isCandidateKey(pair, allAttrs, fds)
        });
      }
    }
  }
  
  return results;
};
