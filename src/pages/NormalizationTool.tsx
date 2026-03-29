import React, { useState } from 'react';
import InputPanel from '../components/InputPanel';
import ClosurePanel from '../components/ClosurePanel';
import CandidateKeysPanel from '../components/CandidateKeysPanel';
import NormalizationSteps from '../components/NormalizationSteps';
import ResultRelations from '../components/ResultRelations';
import { NormalizationResult } from '../types/normalization';
import { runNormalization } from '../utils/normalize';

const NormalizationTool: React.FC = () => {
  const [schema, setSchema] = useState('');
  const [fdsInput, setFDsInput] = useState('');
  const [result, setResult] = useState<NormalizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const res = runNormalization(schema, fdsInput);
      setResult(res);
      
      // Smooth scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during normalization.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadExample = (n: number) => {
    if (n === 1) {
      setSchema('A, B, C, D, E');
      setFDsInput('A -> B, C\nB -> D\nC -> E');
    } else if (n === 2) {
      setSchema('S, C, I, R');
      setFDsInput('S, C -> I\nI -> R');
    } else if (n === 3) {
      setSchema('A, B, C, D');
      setFDsInput('A, B -> C\nC -> D\nA -> D');
    }
    setError(null);
    setResult(null);
  };

  const handleReset = () => {
    setSchema('');
    setFDsInput('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-teal-600 text-white py-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">DB Normalizer</h1>
          <span className="text-teal-100 text-sm hidden sm:inline-block">Database Normalization Tool</span>
          <span className="text-xs text-teal-200 opacity-80">DBMS Assignment — Nirma University</span>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8 max-w-5xl">
        {/* Hero Section */}
        {!result && (
          <div className="text-center mb-10 py-8">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Database Normalization Tool
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Enter your relation schema and functional dependencies to automatically 
              compute closures, candidate keys, and step-by-step normalization from 1NF to BCNF.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold uppercase tracking-wide">Closure Computation</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold uppercase tracking-wide">Candidate Keys</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase tracking-wide">Step-by-step</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold uppercase tracking-wide">1NF → BCNF</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          <div className="relative">
            <InputPanel
              schema={schema}
              fds={fdsInput}
              onSchemaChange={setSchema}
              onFDsChange={setFDsInput}
              onAnalyze={handleAnalyze}
              onLoadExample={handleLoadExample}
              error={error}
              isAnalyzing={isAnalyzing}
            />
            {result && (
              <button 
                onClick={handleReset}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {result && (
            <div id="results-section" className="space-y-8 animate-fade-in-up">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="text-3xl font-bold text-teal-600 mb-1">{result.originalSchema.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Attributes</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="text-3xl font-bold text-teal-600 mb-1">{result.fds.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">FDs</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{result.candidateKeys.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Candidate Keys</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {result.isBCNF ? 'BCNF' : result.is3NF ? '3NF' : result.is2NF ? '2NF' : '1NF'}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Highest NF</div>
                </div>
              </div>

              <ClosurePanel closures={result.closures} />
              
              <CandidateKeysPanel 
                candidateKeys={result.candidateKeys} 
                primaryKey={result.primaryKey}
                primeAttributes={result.primeAttributes}
                nonPrimeAttributes={result.nonPrimeAttributes}
              />
              
              <NormalizationSteps steps={result.steps} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NormalizationTool;
