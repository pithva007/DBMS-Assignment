import React from 'react';

interface CandidateKeysPanelProps {
  candidateKeys: string[][];
  primaryKey: string[];
  primeAttributes: string[];
  nonPrimeAttributes: string[];
}

const CandidateKeysPanel: React.FC<CandidateKeysPanelProps> = ({
  candidateKeys,
  primaryKey,
  primeAttributes,
  nonPrimeAttributes
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-600 p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Step 3 — Candidate Keys & Prime Attributes</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Candidate Keys Found</h3>
        <div className="flex flex-wrap gap-2">
          {candidateKeys.map((key, idx) => {
            const isPK = key.length === primaryKey.length && key.every(k => primaryKey.includes(k));
            return (
              <span 
                key={idx} 
                className={`px-4 py-2 rounded-full font-mono text-sm font-semibold flex items-center gap-2
                  ${isPK 
                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' 
                    : 'bg-purple-100 text-purple-800 border border-purple-200'}`}
              >
                {`{${key.join(', ')}}`}
                {isPK && <span title="Primary Key">⭐</span>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-teal-600 uppercase tracking-wide mb-2 border-b border-teal-200 pb-1">Prime Attributes</h3>
          <ul className="space-y-1 mt-2">
            {primeAttributes.map((attr, idx) => (
              <li key={idx} className="flex items-center gap-2 text-gray-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                {attr}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">Non-Prime Attributes</h3>
          {nonPrimeAttributes.length === 0 ? (
            <p className="text-gray-400 italic mt-2">None</p>
          ) : (
            <ul className="space-y-1 mt-2">
              {nonPrimeAttributes.map((attr, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  {attr}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
        <p><strong>Prime attributes</strong> appear in at least one candidate key.</p>
        <p><strong>Non-prime attributes</strong> do not appear in any candidate key.</p>
      </div>
    </div>
  );
};

export default CandidateKeysPanel;
