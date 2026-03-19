import React from 'react';
import { ClosureResult } from '../types/normalization';

interface ClosurePanelProps {
  closures: ClosureResult[];
}

const ClosurePanel: React.FC<ClosurePanelProps> = ({ closures }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-teal-600 p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Step 2 — Attribute Closures</h2>
      <p className="text-gray-600 mb-6 text-sm">
        The closure X⁺ is the set of all attributes functionally determined by X.
        <br />
        <span className="text-teal-600 font-semibold">• Superkey:</span> Closure contains ALL attributes.
        <br />
        <span className="text-purple-600 font-semibold">• Candidate Key:</span> Minimal superkey.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {closures.map((closure, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-lg border flex flex-col justify-between
              ${closure.isCandidateKey 
                ? 'border-2 border-teal-500 bg-teal-50 shadow-sm' 
                : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="font-mono text-lg mb-2 text-gray-800 break-words">
              {`{${closure.attributes.join(', ')}}⁺ = {${closure.closure.join(', ')}}`}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {closure.isSuperkey && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-md border border-green-200">
                  Superkey
                </span>
              )}
              {closure.isCandidateKey && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-md border border-purple-200">
                  Candidate Key
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClosurePanel;
