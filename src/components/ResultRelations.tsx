import React from 'react';
import { DecomposedRelation } from '../types/normalization';

interface ResultRelationsProps {
  relations: DecomposedRelation[];
  normalForm: string;
}

const ResultRelations: React.FC<ResultRelationsProps> = ({ relations, normalForm }) => {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Final Relations after {normalForm} Decomposition
      </h3>
      
      {relations.length === 0 ? (
        <p className="text-gray-400 italic">No decomposition needed</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {relations.map((rel, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                <span className="font-bold text-lg text-gray-800">{rel.name}</span>
                <span className="text-xs text-gray-400 font-mono">PK: {`{${rel.primaryKey.join(', ')}}`}</span>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {rel.attributes.map((attr, i) => {
                  const isPk = rel.primaryKey.includes(attr);
                  return (
                    <span 
                      key={i} 
                      className={`px-2 py-0.5 text-xs rounded-md font-mono
                        ${isPk 
                          ? 'bg-teal-100 text-teal-800 font-semibold underline decoration-teal-500' 
                          : 'bg-gray-100 text-gray-700'}`}
                    >
                      {attr}
                    </span>
                  );
                })}
              </div>
              
              <div className="text-xs text-gray-500 font-mono space-y-1">
                {rel.fds.length > 0 ? (
                  rel.fds.map((fd, i) => (
                    <div key={i} className="truncate" title={fd.raw || `${fd.lhs.join(',')} -> ${fd.rhs.join(',')}`}>
                      {fd.raw || `${fd.lhs.join(',')} -> ${fd.rhs.join(',')}`}
                    </div>
                  ))
                ) : (
                  <div className="italic text-gray-400">No specific FDs</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultRelations;
