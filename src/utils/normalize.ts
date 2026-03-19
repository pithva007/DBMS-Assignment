import { 
  FunctionalDependency, 
  NormalFormViolation, 
  DecomposedRelation, 
  NormalizationResult, 
  NormalizationStep,
  ClosureResult
} from '../types/normalization';
import { computeClosure, isSuperkey, isCandidateKey, computeAllClosures } from './closure';
import { findAllCandidateKeys, getPrimeAttributes, getNonPrimeAttributes } from './candidateKeys';

export const parseSchema = (input: string): string[] => {
  return input.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
};

export const parseFDs = (input: string): FunctionalDependency[] => {
  return input.split('\n').filter(line => line.trim().length > 0).map(line => {
    const parts = line.split(/->|→/);
    if (parts.length !== 2) return null;
    const lhs = parts[0].split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    const rhs = parts[1].split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    if (lhs.length === 0 || rhs.length === 0) return null;
    return { lhs, rhs, raw: line.trim() };
  }).filter((fd): fd is FunctionalDependency => fd !== null);
};

// Helper: Check if array A is a subset of array B
const isSubset = (a: string[], b: string[]) => a.every(val => b.includes(val));
// Helper: Check if array A is a proper subset of array B
const isProperSubset = (a: string[], b: string[]) => isSubset(a, b) && a.length < b.length;
// Helper: Check intersection of two arrays
const intersection = (a: string[], b: string[]) => a.filter(x => b.includes(x));
// Helper: Check equality of two sets of attributes
const areSetsEqual = (a: string[], b: string[]) => a.length === b.length && isSubset(a, b);

export const findPartialDependencies = (
  fds: FunctionalDependency[],
  candidateKeys: string[][],
  nonPrimeAttrs: string[]
): NormalFormViolation[] => {
  const violations: NormalFormViolation[] = [];
  
  for (const fd of fds) {
    // Check if RHS contains non-prime attributes
    const nonPrimeRHS = intersection(fd.rhs, nonPrimeAttrs);
    if (nonPrimeRHS.length === 0) continue;

    // Check if LHS is a proper subset of any candidate key
    for (const key of candidateKeys) {
      if (isProperSubset(fd.lhs, key)) {
        violations.push({
          type: 'partial',
          fd,
          explanation: `${fd.lhs.join(',')} → ${nonPrimeRHS.join(',')} is a partial dependency because {${fd.lhs.join(',')}} is a proper subset of candidate key {${key.join(',')}} and {${nonPrimeRHS.join(',')}} is non-prime.`
        });
        // We found one key it violates with, that's enough to flag it
        break; 
      }
    }
  }
  return violations;
};

export const findTransitiveDependencies = (
  fds: FunctionalDependency[],
  allAttrs: string[],
  candidateKeys: string[][],
  primeAttrs: string[],
  nonPrimeAttrs: string[]
): NormalFormViolation[] => {
  const violations: NormalFormViolation[] = [];

  for (const fd of fds) {
    // 3NF condition: either X is superkey OR Y is prime
    // Transitive dep if: LHS not superkey AND RHS has non-prime
    
    // Check if LHS is superkey
    const isLhsSuperkey = isSuperkey(fd.lhs, allAttrs, fds);
    
    // Check if RHS has non-prime attributes
    const nonPrimeRHS = intersection(fd.rhs, nonPrimeAttrs);
    
    if (!isLhsSuperkey && nonPrimeRHS.length > 0) {
      // It might be a partial dependency, which is 2NF violation.
      // 3NF violations are specifically transitive: LHS is not superkey, not partial (implied if we pass 2NF check first usually, but here we check standalone).
      // The definition says: LHS is NOT a superkey AND LHS is NOT a proper subset of any candidate key (if it was, it's partial).
      
      let isPartial = false;
      for (const key of candidateKeys) {
        if (isProperSubset(fd.lhs, key)) {
          isPartial = true;
          break;
        }
      }
      
      if (!isPartial) {
        violations.push({
          type: 'transitive',
          fd,
          explanation: `${fd.lhs.join(',')} → ${nonPrimeRHS.join(',')} is a transitive dependency because {${fd.lhs.join(',')}} is not a superkey and {${nonPrimeRHS.join(',')}} contains non-prime attributes.`
        });
      }
    }
  }
  return violations;
};

export const findBCNFViolations = (
  fds: FunctionalDependency[],
  allAttrs: string[]
): NormalFormViolation[] => {
  const violations: NormalFormViolation[] = [];
  
  for (const fd of fds) {
    // BCNF: LHS must be a superkey for non-trivial FDs
    // Trivial: Y is subset of X.
    if (isSubset(fd.rhs, fd.lhs)) continue;
    
    if (!isSuperkey(fd.lhs, allAttrs, fds)) {
      violations.push({
        type: 'bcnf',
        fd,
        explanation: `${fd.lhs.join(',')} → ${fd.rhs.join(',')} violates BCNF because {${fd.lhs.join(',')}} is not a superkey.`
      });
    }
  }
  return violations;
};

export const decomposeInto2NF = (
  allAttrs: string[],
  fds: FunctionalDependency[],
  candidateKeys: string[][],
  partialDeps: NormalFormViolation[]
): DecomposedRelation[] => {
  if (partialDeps.length === 0) {
    return [{
      name: 'R1',
      attributes: allAttrs,
      fds,
      primaryKey: candidateKeys[0] || []
    }];
  }

  const relations: DecomposedRelation[] = [];
  let remainingAttrs = [...allAttrs];
  let processedLHS: string[][] = [];

  // Create relations for partial dependencies
  partialDeps.forEach((dep, idx) => {
    if (!dep.fd) return;
    const lhs = dep.fd.lhs;
    
    // Group by LHS to avoid duplicates if multiple FDs have same LHS
    const existingIdx = processedLHS.findIndex(l => areSetsEqual(l, lhs));
    if (existingIdx === -1) {
      processedLHS.push(lhs);
      // Find all attributes determined by this LHS in the partial deps
      // Actually we should take the closure of LHS restricted to the problem?
      // Or just take the RHS from the violation?
      // Standard algorithm: Take LHS and its closure (or at least the RHS causing violation).
      // Let's take LHS + RHS from the FD.
      
      // Better: For each unique LHS in partial deps, create a relation with {LHS} U {all RHS attributes dependent on this LHS partially}
      const relevantFDs = partialDeps.filter(d => d.fd && areSetsEqual(d.fd.lhs, lhs)).map(d => d.fd!);
      let rhsUnion: string[] = [];
      relevantFDs.forEach(fd => rhsUnion.push(...fd.rhs));
      rhsUnion = Array.from(new Set(rhsUnion));
      
      const relAttrs = Array.from(new Set([...lhs, ...rhsUnion]));
      
      relations.push({
        name: `R${relations.length + 1}`,
        attributes: relAttrs,
        fds: relevantFDs, // Approximate, technically should project FDs
        primaryKey: lhs
      });
      
      // Remove RHS from remaining attributes (but keep LHS)
      remainingAttrs = remainingAttrs.filter(attr => !rhsUnion.includes(attr) || lhs.includes(attr));
    }
  });

  // Main relation with remaining attributes
  if (remainingAttrs.length > 0) {
    // Project FDs for this relation?
    // For simple assignment, we can just filter FDs that are fully contained in remainingAttrs
    const remainingFDs = fds.filter(fd => isSubset([...fd.lhs, ...fd.rhs], remainingAttrs));
    
    // Calculate PK for remaining - usually original PK (if it remains) or what's left
    // If original candidate key is still present, use it.
    let pk = candidateKeys.find(key => isSubset(key, remainingAttrs)) || remainingAttrs;

    relations.push({
      name: `R${relations.length + 1}`,
      attributes: remainingAttrs,
      fds: remainingFDs,
      primaryKey: pk
    });
  }

  return relations;
};

export const decomposeInto3NF = (
  relations2NF: DecomposedRelation[],
  transitiveDeps: NormalFormViolation[]
): DecomposedRelation[] => {
  // Synthesis algorithm usually starts from FDs, but here we can decompose iteratively from 2NF relations
  // For each relation in 2NF, check if it has transitive deps.
  
  let relations = [...relations2NF];
  let newRelations: DecomposedRelation[] = [];
  
  relations.forEach(rel => {
    // Find transitive deps specific to THIS relation
    // We need to re-check transitive deps within the scope of this relation's attributes and FDs
    // But we are passed a global list of transitive deps. We should filter those that apply to this relation.
    
    const relevantTransitive = transitiveDeps.filter(d => 
      d.fd && isSubset([...d.fd.lhs, ...d.fd.rhs], rel.attributes)
    );
    
    if (relevantTransitive.length === 0) {
      newRelations.push(rel);
      return;
    }
    
    // Decompose
    // X -> Y is transitive. Create R_new(X, Y) with PK=X. Remove Y from R_old.
    let currentAttrs = [...rel.attributes];
    let currentFDs = [...rel.fds];
    
    relevantTransitive.forEach(viol => {
      if (!viol.fd) return;
      const { lhs, rhs } = viol.fd;
      
      // Check if attributes still exist in current relation (might have been removed by previous step in loop)
      if (!isSubset([...lhs, ...rhs], currentAttrs)) return;
      
      // Create new relation
      const newRelAttrs = Array.from(new Set([...lhs, ...rhs]));
      newRelations.push({
        name: `R${newRelations.length + 100}`, // Temp name, renumber later
        attributes: newRelAttrs,
        fds: [viol.fd],
        primaryKey: lhs
      });
      
      // Remove RHS from current relation
      currentAttrs = currentAttrs.filter(a => !rhs.includes(a) || lhs.includes(a));
    });
    
    // Add the modified original relation
    newRelations.push({
      name: rel.name,
      attributes: currentAttrs,
      fds: currentFDs.filter(fd => isSubset([...fd.lhs, ...fd.rhs], currentAttrs)),
      primaryKey: rel.primaryKey // PK remains usually
    });
  });
  
  // Renumber
  return newRelations.map((r, i) => ({ ...r, name: `R${i + 1}` }));
};

export const decomposeIntoBCNF = (
  relations3NF: DecomposedRelation[],
  allAttrs: string[],
  originalFDs: FunctionalDependency[]
): DecomposedRelation[] => {
  let resultRelations = [...relations3NF];
  let changed = true;
  
  while (changed) {
    changed = false;
    const nextRelations: DecomposedRelation[] = [];
    
    for (const rel of resultRelations) {
      // Check for BCNF violation in this relation
      // We need to find FDs that apply to this relation: X -> Y where X, Y in rel.attributes
      // And check if X is superkey FOR THIS RELATION.
      
      // Find applicable FDs
      const applicableFDs = originalFDs.filter(fd => 
        isSubset([...fd.lhs, ...fd.rhs], rel.attributes)
      );
      
      let violationFD: FunctionalDependency | null = null;
      
      for (const fd of applicableFDs) {
        // Trivial?
        if (isSubset(fd.rhs, fd.lhs)) continue;
        
        // Compute closure of LHS relative to this relation's attributes
        // actually we can use global closure and intersect with rel.attributes?
        // No, closure should be computed using applicable FDs? 
        // Or just check if LHS determines all attributes in rel.
        
        const closure = computeClosure(fd.lhs, applicableFDs); // Use applicable FDs for closure in sub-relation?
        // Actually, FDs are preserved, so we should use original FDs but check if closure covers all rel.attributes
        // Wait, if we use original FDs, we might get attributes outside the relation.
        // BCNF violation: X -> Y holds in R, but X is not superkey of R.
        
        const closureInRel = computeClosure(fd.lhs, originalFDs).filter(a => rel.attributes.includes(a));
        const isSuperkeyInRel = rel.attributes.every(a => closureInRel.includes(a));
        
        if (!isSuperkeyInRel) {
          violationFD = fd;
          break; 
        }
      }
      
      if (violationFD) {
        changed = true;
        // Split: R1(X+Y), R2(Attr - Y + X)
        // Actually standard is: R1 = X U Y, R2 = (R - Y) U X
        // violationFD is X -> Y.
        
        const X = violationFD.lhs;
        // Y in the violation might be only part of RHS that is in the relation?
        // The FD might be X -> A, B, C. But only A, B are in relation.
        // We should take Y = (closure(X) INTERSECT rel.attributes) - X
        
        const closureX = computeClosure(X, originalFDs).filter(a => rel.attributes.includes(a));
        const Y = closureX.filter(a => !X.includes(a)); // Everything determined by X in this relation, excluding X
        
        const r1Attrs = Array.from(new Set([...X, ...Y]));
        const r2Attrs = rel.attributes.filter(a => !Y.includes(a)); // Remove Y, keep X (X is not in Y)
        
        nextRelations.push({
          name: `${rel.name}_1`,
          attributes: r1Attrs,
          fds: [], // Recalculate next iter
          primaryKey: X
        });
        
        nextRelations.push({
          name: `${rel.name}_2`,
          attributes: r2Attrs,
          fds: [], // Recalculate next iter
          primaryKey: rel.primaryKey // Preserve if possible, or X? No, X is in R2.
        });
        
      } else {
        nextRelations.push(rel);
      }
    }
    resultRelations = nextRelations;
  }
  
  // Renumber
  return resultRelations.map((r, i) => ({ 
    ...r, 
    name: `R${i + 1}`,
    fds: originalFDs.filter(fd => isSubset([...fd.lhs, ...fd.rhs], r.attributes))
  }));
};


export const runNormalization = (schemaInput: string, fdsInput: string): NormalizationResult => {
  const schema = parseSchema(schemaInput);
  const fds = parseFDs(fdsInput);
  
  const closures = computeAllClosures(schema, fds);
  const candidateKeys = findAllCandidateKeys(schema, fds);
  const primeAttrs = getPrimeAttributes(candidateKeys);
  const nonPrimeAttrs = getNonPrimeAttributes(schema, primeAttrs);
  
  const partialDeps = findPartialDependencies(fds, candidateKeys, nonPrimeAttrs);
  const transitiveDeps = findTransitiveDependencies(fds, schema, candidateKeys, primeAttrs, nonPrimeAttrs);
  const bcnfViolations = findBCNFViolations(fds, schema); // Note: this is for global schema check
  
  // 1NF is assumed true if we can parse it (atomic values assumed)
  const is1NF = true;
  const is2NF = partialDeps.length === 0;
  const is3NF = is2NF && transitiveDeps.length === 0;
  const isBCNF = is3NF && bcnfViolations.length === 0;

  const steps: NormalizationStep[] = [];
  
  // 1NF
  steps.push({
    normalForm: '1NF',
    status: 'satisfied',
    title: '1NF — First Normal Form',
    explanation: 'First Normal Form requires that all attributes contain only atomic values and there are no repeating groups. We assume the input schema satisfies 1NF.',
    violations: [],
    decompositions: [],
    resultRelations: [{ name: 'R1', attributes: schema, fds, primaryKey: candidateKeys[0] || [] }]
  });

  // 2NF
  let relations2NF: DecomposedRelation[] = [];
  if (is2NF) {
    relations2NF = [{ name: 'R1', attributes: schema, fds, primaryKey: candidateKeys[0] || [] }];
    steps.push({
      normalForm: '2NF',
      status: 'satisfied',
      title: '2NF — Second Normal Form',
      explanation: 'No partial dependencies found.',
      violations: [],
      decompositions: [],
      resultRelations: relations2NF
    });
  } else {
    relations2NF = decomposeInto2NF(schema, fds, candidateKeys, partialDeps);
    steps.push({
      normalForm: '2NF',
      status: 'violated',
      title: '2NF — Second Normal Form',
      explanation: 'Violations found: Non-prime attributes depend on part of a candidate key.',
      violations: partialDeps.map(v => v.explanation),
      decompositions: ['Decomposed based on partial dependencies.'],
      resultRelations: relations2NF
    });
  }

  // 3NF
  let relations3NF: DecomposedRelation[] = [];
  if (is3NF) {
    relations3NF = relations2NF; // Propagate
    steps.push({
      normalForm: '3NF',
      status: 'satisfied',
      title: '3NF — Third Normal Form',
      explanation: 'No transitive dependencies found.',
      violations: [],
      decompositions: [],
      resultRelations: relations3NF
    });
  } else {
    relations3NF = decomposeInto3NF(relations2NF, transitiveDeps);
    steps.push({
      normalForm: '3NF',
      status: is2NF ? 'violated' : 'decomposed', // If 2NF was violated, this is a further step
      title: '3NF — Third Normal Form',
      explanation: 'Violations found: Transitive dependencies detected.',
      violations: transitiveDeps.map(v => v.explanation),
      decompositions: ['Decomposed to remove transitive dependencies.'],
      resultRelations: relations3NF
    });
  }

  // BCNF
  let relationsBCNF: DecomposedRelation[] = [];
  // For BCNF, we check violations in the 3NF relations
  const bcnfViolationsIn3NF = relations3NF.flatMap(rel => {
    // Check if any FD in this relation violates BCNF
    const relFDs = rel.fds; // These are projected
    // We need to check BCNF condition for each relation
    const localViolations: string[] = [];
    relFDs.forEach(fd => {
      // Check if LHS is superkey in this relation
      const closure = computeClosure(fd.lhs, relFDs).filter(a => rel.attributes.includes(a));
      if (!rel.attributes.every(a => closure.includes(a))) {
        localViolations.push(`${fd.lhs} -> ${fd.rhs} violates BCNF in ${rel.name}`);
      }
    });
    return localViolations;
  });

  if (bcnfViolationsIn3NF.length === 0 && isBCNF) {
    relationsBCNF = relations3NF;
    steps.push({
      normalForm: 'BCNF',
      status: 'satisfied',
      title: 'BCNF — Boyce-Codd Normal Form',
      explanation: 'All relations satisfy BCNF.',
      violations: [],
      decompositions: [],
      resultRelations: relationsBCNF
    });
  } else {
    relationsBCNF = decomposeIntoBCNF(relations3NF, schema, fds);
    steps.push({
      normalForm: 'BCNF',
      status: (is3NF && !isBCNF) ? 'violated' : 'decomposed',
      title: 'BCNF — Boyce-Codd Normal Form',
      explanation: 'Decomposing relations that violate BCNF.',
      violations: bcnfViolationsIn3NF.length > 0 ? bcnfViolationsIn3NF : ['Potential BCNF violations checked during decomposition'],
      decompositions: ['Decomposed remaining relations into BCNF.'],
      resultRelations: relationsBCNF
    });
  }

  return {
    originalSchema: schema,
    fds,
    closures,
    candidateKeys,
    primaryKey: candidateKeys[0] || [],
    primeAttributes: primeAttrs,
    nonPrimeAttributes: nonPrimeAttrs,
    is1NF,
    is2NF,
    is3NF,
    isBCNF,
    violations2NF: partialDeps,
    violations3NF: transitiveDeps,
    violationsBCNF: bcnfViolations,
    relations1NF: [{ name: 'R1', attributes: schema, fds, primaryKey: candidateKeys[0] || [] }],
    relations2NF,
    relations3NF,
    relationsBCNF,
    steps
  };
};
