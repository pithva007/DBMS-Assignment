import React from 'react';
import ExampleLoader from './ExampleLoader';

interface InputPanelProps {
  schema: string;
  fds: string;
  onSchemaChange: (val: string) => void;
  onFDsChange: (val: string) => void;
  onAnalyze: () => void;
  onLoadExample: (n: number) => void;
  error: string | null;
  isAnalyzing: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({
  schema,
  fds,
  onSchemaChange,
  onFDsChange,
  onAnalyze,
  onLoadExample,
  error,
  isAnalyzing
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-teal-600 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Step 1 — Define Your Relation</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Relation Schema</label>
        <input
          type="text"
          value={schema}
          onChange={(e) => onSchemaChange(e.target.value)}
          placeholder="e.g. A, B, C, D, E"
          className="w-full font-mono text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">Separate attributes with commas</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Functional Dependencies</label>
        <textarea
          value={fds}
          onChange={(e) => onFDsChange(e.target.value)}
          placeholder={`A -> B, C\nB -> D\nC -> E`}
          className="w-full h-[120px] font-mono text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">One dependency per line. Use -> or →</p>
      </div>

      <ExampleLoader onLoadExample={onLoadExample} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={isAnalyzing || !schema.trim()}
        className={`w-full py-3 px-6 rounded-lg text-white font-medium text-lg transition-all
          ${isAnalyzing || !schema.trim() 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg'}`}
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze & Normalize →'}
      </button>
    </div>
  );
};

export default InputPanel;
