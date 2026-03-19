import React, { useState } from 'react';
import { NormalizationStep } from '../types/normalization';
import ResultRelations from './ResultRelations';

interface NormalizationStepsProps {
  steps: NormalizationStep[];
}

const NormalizationSteps: React.FC<NormalizationStepsProps> = ({ steps }) => {
  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
        Step 4 — Normalization (1NF → 2NF → 3NF → BCNF)
      </h2>
      
      {steps.map((step, idx) => (
        <NormalizationStepCard key={idx} step={step} />
      ))}
    </div>
  );
};

const NormalizationStepCard: React.FC<{ step: NormalizationStep }> = ({ step }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Status badge logic
  const getStatusBadge = () => {
    switch (step.status) {
      case 'satisfied':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">Satisfied</span>;
      case 'violated':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold border border-red-200">Violated</span>;
      case 'decomposed':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200">Decomposed</span>;
      default:
        return null;
    }
  };

  // Border color based on NF
  const getBorderColor = () => {
    switch (step.normalForm) {
      case '1NF': return 'border-l-teal-500';
      case '2NF': return 'border-l-amber-500';
      case '3NF': return 'border-l-purple-500';
      case 'BCNF': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${getBorderColor()} overflow-hidden`}>
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-800">{step.title}</h3>
          {getStatusBadge()}
        </div>
        <span className="text-gray-400 text-xl font-bold transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-100 bg-white">
          <p className="text-gray-600 mt-4 mb-4 text-sm leading-relaxed">
            {step.explanation}
          </p>

          {step.violations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">Violations Found:</h4>
              <ul className="space-y-2">
                {step.violations.map((v, i) => (
                  <li key={i} className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-800 rounded-r-md flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.decompositions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Decomposition Steps:</h4>
              <ul className="space-y-2">
                {step.decompositions.map((d, i) => (
                  <li key={i} className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm text-blue-800 rounded-r-md flex items-start gap-2">
                    <span className="text-blue-500 font-bold">→</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ResultRelations relations={step.resultRelations} normalForm={step.normalForm} />
        </div>
      )}
    </div>
  );
};

export default NormalizationSteps;
