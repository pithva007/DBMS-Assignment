import { FunctionalDependency } from '../types/normalization';
import { isCandidateKey } from './closure';

export const getCombinations = <T>(arr: T[], size: number): T[][] => {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const [first, ...rest] = arr;
  
  const combinationsWithFirst = getCombinations(rest, size - 1).map((combination) => [first, ...combination]);
  const combinationsWithoutFirst = getCombinations(rest, size);
  
  return [...combinationsWithFirst, ...combinationsWithoutFirst];
};

export const findAllCandidateKeys = (allAttrs: string[], fds: FunctionalDependency[]): string[][] => {
  const keys: string[][] = [];
  
  // Sort attributes to ensure consistent key representation
  const sortedAttrs = [...allAttrs].sort();
  
  // We search by size 1 up to N
  for (let size = 1; size <= sortedAttrs.length; size++) {
    const combinations = getCombinations(sortedAttrs, size);
    
    for (const combination of combinations) {
      // Optimization: If a subset of this combination is already a key, 
      // then this combination cannot be a candidate key (it would be a superkey, but not minimal).
      // However, isCandidateKey already checks minimality.
      // But we can skip the expensive check if we know it's a superkey but not minimal.
      
      // Check if any existing key is a subset of this combination
      const isSuperKeyOfExisting = keys.some(key => 
        key.every(k => combination.includes(k))
      );
      
      if (isSuperKeyOfExisting) {
        continue;
      }

      if (isCandidateKey(combination, sortedAttrs, fds)) {
        keys.push(combination);
      }
    }
  }
  
  return keys;
};

export const getPrimeAttributes = (candidateKeys: string[][]): string[] => {
  const primes = new Set<string>();
  candidateKeys.forEach(key => {
    key.forEach(attr => primes.add(attr));
  });
  return Array.from(primes).sort();
};

export const getNonPrimeAttributes = (allAttrs: string[], primeAttrs: string[]): string[] => {
  return allAttrs.filter(attr => !primeAttrs.includes(attr)).sort();
};
