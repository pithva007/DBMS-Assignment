export interface FunctionalDependency {
  lhs: string[];   // left hand side attributes
  rhs: string[];   // right hand side attributes
  raw: string;     // original string e.g. "A → B, C"
}

export interface ClosureResult {
  attributes: string[];     // input set e.g. ["A"]
  closure: string[];        // result e.g. ["A","B","C","D","E"]
  isSuperkey: boolean;
  isCandidateKey: boolean;
}

export interface NormalFormViolation {
  type: 'partial' | 'transitive' | 'bcnf';
  fd?: FunctionalDependency;
  explanation: string;
}

export interface DecomposedRelation {
  name: string;         // e.g. "R1"
  attributes: string[];
  fds: FunctionalDependency[];
  primaryKey: string[];
}

export interface NormalizationResult {
  originalSchema: string[];
  fds: FunctionalDependency[];
  closures: ClosureResult[];
  candidateKeys: string[][];
  primaryKey: string[];
  primeAttributes: string[];
  nonPrimeAttributes: string[];
  is1NF: boolean;
  is2NF: boolean;
  is3NF: boolean;
  isBCNF: boolean;
  violations2NF: NormalFormViolation[];
  violations3NF: NormalFormViolation[];
  violationsBCNF: NormalFormViolation[];
  relations1NF: DecomposedRelation[];
  relations2NF: DecomposedRelation[];
  relations3NF: DecomposedRelation[];
  relationsBCNF: DecomposedRelation[];
  steps: NormalizationStep[];
}

export interface NormalizationStep {
  normalForm: '1NF' | '2NF' | '3NF' | 'BCNF';
  status: 'satisfied' | 'violated' | 'decomposed';
  title: string;
  explanation: string;
  violations: string[];
  decompositions: string[];
  resultRelations: DecomposedRelation[];
}
