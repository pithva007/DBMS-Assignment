import React, { useState, useEffect, useMemo } from 'react';
import { NormalizationResult, FunctionalDependency, DecomposedRelation } from '../types/normalization';

interface StepAnimatorProps {
  result: NormalizationResult;
}

interface AnimatorSubStep {
  phase: '1NF' | '2NF' | '3NF' | 'BCNF';
  title: string;
  body: string;
  highlight?: string[];
  highlightFDs?: FunctionalDependency[];
  status: 'checking' | 'satisfied' | 'violated';
  showRelations?: DecomposedRelation[];
}

export const StepAnimator: React.FC<StepAnimatorProps> = ({ result }) => {
  const [phase, setPhase] = useState<'1NF'|'2NF'|'3NF'|'BCNF'>('1NF');
  const [subStep, setSubStep] = useState(0);

  const allSubSteps = useMemo(() => {
    const steps: AnimatorSubStep[] = [];

    // 1NF
    steps.push({
      phase: '1NF', title: 'Checking Atomicity',
      body: 'Every attribute must contain atomic (indivisible) values. No multi-valued attributes or repeating groups allowed.',
      highlight: result.originalSchema, status: 'checking'
    });
    steps.push({
      phase: '1NF', title: 'Checking Primary Key',
      body: `Primary key identified: {${result.primaryKey.join(', ')}}. Every tuple in the relation is uniquely identifiable.`,
      highlight: result.primaryKey, status: 'satisfied'
    });
    steps.push({
      phase: '1NF', title: '1NF Result',
      body: `✓ Relation R(${result.originalSchema.join(', ')}) is in 1NF. All values are atomic and a primary key exists.`,
      highlight: result.originalSchema, status: 'satisfied'
    });

    // 2NF
    steps.push({
      phase: '2NF', title: 'Identifying Candidate Keys',
      body: `Candidate keys found: ${result.candidateKeys.map(k => '{' + k.join(',') + '}').join(', ')}\nPrime attributes: {${result.primeAttributes.join(', ')}}\nNon-prime attributes: {${result.nonPrimeAttributes.join(', ')}}`,
      highlight: result.primeAttributes, status: 'checking'
    });

    if (result.candidateKeys.every(k => k.length === 1)) {
      steps.push({
        phase: '2NF', title: '2NF Check — Single Attribute Key',
        body: 'All candidate keys are single attributes. Partial dependencies are impossible — 2NF is automatically satisfied.',
        status: 'satisfied'
      });
    } else {
      for (const viol of result.violations2NF) {
        steps.push({
          phase: '2NF', title: `Partial Dependency Found`,
          body: viol.explanation,
          highlightFDs: viol.fd ? [viol.fd] : [], status: 'violated'
        });
        steps.push({
          phase: '2NF', title: `Decomposing for 2NF`,
          body: `Removing partial dependency by creating separate relation.`,
          showRelations: result.relations2NF, status: 'satisfied'
        });
      }
    }
    steps.push({
      phase: '2NF', title: '2NF Result',
      body: result.is2NF ? '✓ Schema is in 2NF.' : '✓ Decomposed to 2NF.',
      showRelations: result.relations2NF, status: 'satisfied'
    });

    // 3NF
    steps.push({
      phase: '3NF', title: 'Checking 3NF',
      body: `Checking for transitive dependencies where a non-prime attribute depends on another non-prime attribute.`,
      status: 'checking'
    });
    if (result.violations3NF.length === 0) {
      steps.push({
        phase: '3NF', title: '3NF Check — No Transitive Dependencies',
        body: 'No transitive dependencies found. 3NF is satisfied.',
        status: 'satisfied'
      });
    } else {
      for (const viol of result.violations3NF) {
        steps.push({
          phase: '3NF', title: `Transitive Dependency Found`,
          body: viol.explanation,
          highlightFDs: viol.fd ? [viol.fd] : [], status: 'violated'
        });
        steps.push({
          phase: '3NF', title: `Decomposing for 3NF`,
          body: `Extracting transitive dependency to remove redundancy.`,
          showRelations: result.relations3NF, status: 'satisfied'
        });
      }
    }
    steps.push({
      phase: '3NF', title: '3NF Result',
      body: result.is3NF ? '✓ Schema is in 3NF.' : '✓ Decomposed to 3NF.',
      showRelations: result.relations3NF, status: 'satisfied'
    });

    // BCNF
    steps.push({
      phase: 'BCNF', title: 'Checking BCNF',
      body: `For BCNF, every determinant must be a superkey. Checking for any remaining violations.`,
      status: 'checking'
    });
    if (result.violationsBCNF.length === 0) {
      steps.push({
        phase: 'BCNF', title: 'BCNF Check — Satisfied',
        body: 'Every determinant is a superkey. BCNF is satisfied.',
        status: 'satisfied'
      });
    } else {
      for (const viol of result.violationsBCNF) {
        steps.push({
          phase: 'BCNF', title: `BCNF Violation Found`,
          body: viol.explanation,
          highlightFDs: viol.fd ? [viol.fd] : [], status: 'violated'
        });
        steps.push({
          phase: 'BCNF', title: `Decomposing for BCNF`,
          body: `Extracting violating dependency.`,
          showRelations: result.relationsBCNF, status: 'satisfied'
        });
      }
    }
    steps.push({
      phase: 'BCNF', title: 'BCNF Result',
      body: result.isBCNF ? '✓ Schema is in BCNF.' : '✓ Final decomposition is in BCNF. Lossless join preserved.',
      showRelations: result.relationsBCNF, status: 'satisfied'
    });

    return steps;
  }, [result]);

  const totalSteps = allSubSteps.length;
  const currentStep = allSubSteps[subStep];

  useEffect(() => {
    setPhase(currentStep.phase);
  }, [subStep, currentStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setSubStep(s => Math.min(s + 1, totalSteps - 1));
      } else if (e.key === 'ArrowLeft') {
        setSubStep(s => Math.max(s - 1, 0));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [totalSteps]);

  const handleNext = () => setSubStep(s => Math.min(s + 1, totalSteps - 1));
  const handlePrev = () => setSubStep(s => Math.max(s - 1, 0));

  const handleJump = (targetPhase: string) => {
    const idx = allSubSteps.findIndex(s => s.phase === targetPhase);
    if (idx !== -1) setSubStep(idx);
  };

  const getPhaseColor = (stepPhase: string) => {
    switch (stepPhase) {
      case '1NF': return 'teal';
      case '2NF': return 'amber';
      case '3NF': return 'purple';
      case 'BCNF': return 'green';
      default: return 'gray';
    }
  };

  const getPhaseIndex = (p: string) => ['1NF', '2NF', '3NF', 'BCNF'].indexOf(p);
  const currentPhaseIdx = getPhaseIndex(phase);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* Top Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between max-w-lg mx-auto relative cursor-default">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-0"></div>
          {['1NF', '2NF', '3NF', 'BCNF'].map((p, i) => {
            const isCompleted = i < currentPhaseIdx;
            const isCurrent = i === currentPhaseIdx;
            
            let colorCls = 'bg-white border-2 border-gray-300 text-gray-400';
            if (isCompleted) {
              colorCls = 'bg-teal-500 border-2 border-teal-500 text-white';
            } else if (isCurrent) {
              colorCls = 'bg-teal-600 border-2 border-teal-600 text-white shadow-md transform scale-110';
            }

            return (
              <div key={p} className="flex flex-col items-center z-10 relative">
                <div onClick={() => handleJump(p)} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${colorCls}`}>
                  {isCompleted ? '✓' : p}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Content */}
      <div className="p-8 min-h-[320px] flex flex-col items-center justify-center transition-opacity duration-200 opacity-100 fade-in">
        <div className={`mb-4 px-4 py-1 text-sm font-bold uppercase rounded-full bg-${getPhaseColor(currentStep.phase)}-100 text-${getPhaseColor(currentStep.phase)}-800`}>
          {currentStep.phase}
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{currentStep.title}</h3>
        
        <div className="flex items-center justify-center gap-3 mb-6">
          {currentStep.status === 'satisfied' && <span className="text-green-500 text-2xl">✓</span>}
          {currentStep.status === 'violated' && <span className="text-red-500 text-2xl">✗</span>}
          {currentStep.status === 'checking' && <span className="animate-pulse text-teal-500 text-2xl">⚡</span>}
          <p className="text-lg text-gray-600 max-w-2xl text-center whitespace-pre-wrap">{currentStep.body}</p>
        </div>

        {currentStep.highlight && currentStep.highlight.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {currentStep.highlight.map(attr => (
              <span key={attr} className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-md font-medium">
                {attr}
              </span>
            ))}
          </div>
        )}

        {currentStep.highlightFDs && currentStep.highlightFDs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 text-red-600 font-medium">
            {currentStep.highlightFDs.map(fd => fd.raw).join(' | ')}
          </div>
        )}

        {currentStep.showRelations && (
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {currentStep.showRelations.map((r, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm text-center">
                <div className="font-bold text-gray-800 mb-2">{r.name}</div>
                <div className="text-sm text-gray-600">
                  {r.attributes.map(a => r.primaryKey.includes(a) ? <u key={a} className="font-bold text-teal-800 mx-1">{a}</u> : <span key={a} className="mx-1">{a}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
        <button 
          onClick={handlePrev} 
          disabled={subStep === 0}
          className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        
        <div className="text-sm font-medium text-gray-500">
          Step {subStep + 1} of {totalSteps}
        </div>
        
        <button 
          onClick={handleNext} 
          disabled={subStep === totalSteps - 1}
          className="px-4 py-2 bg-teal-600 border border-teal-600 rounded-md text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default StepAnimator;