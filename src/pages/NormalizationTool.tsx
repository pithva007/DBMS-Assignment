import React, { useState } from 'react';
import InputPanel from '../components/InputPanel';
import ClosurePanel from '../components/ClosurePanel';
import CandidateKeysPanel from '../components/CandidateKeysPanel';
import NormalizationSteps from '../components/NormalizationSteps';
import ResultRelations from '../components/ResultRelations';
import DependencyGraph from '../components/DependencyGraph';
import ERDiagram from '../components/ERDiagram';
import StepAnimator from '../components/StepAnimator';
import { NormalizationResult } from '../types/normalization';
import { runNormalization } from '../utils/normalize';
import { exportNormalizationReport } from '../utils/exportPDF';

const NormalizationTool: React.FC = () => {
  const [schema, setSchema] = useState('');
  const [fdsInput, setFDsInput] = useState('');
  const [result, setResult] = useState<NormalizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'graph' | 'er'>('graph');

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

              {/* Tabbed Visual Analysis */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex gap-2">
                  <button
                    onClick={() => setActiveTab('graph')}
                    className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                      activeTab === 'graph' 
                        ? 'bg-teal-600 text-white border-teal-600' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Dependency Graph
                  </button>
                  <button
                    onClick={() => setActiveTab('er')}
                    className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                      activeTab === 'er' 
                        ? 'bg-teal-600 text-white border-teal-600' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    ER Diagram
                  </button>
                </div>
                <div className="p-4 bg-gray-50">
                  {activeTab === 'graph' ? (
                    <DependencyGraph 
                      attributes={result.originalSchema}
                      fds={result.fds}
                      candidateKeys={result.candidateKeys}
                      primeAttributes={result.primeAttributes}
                      violations2NF={result.violations2NF}
                      violations3NF={result.violations3NF}
                      violationsBCNF={result.violationsBCNF}
                    />
                  ) : (
                    <ERDiagram 
                      originalSchema={result.originalSchema}
                      finalRelations={result.relationsBCNF}
                      originalFDs={result.fds}
                    />
                  )}
                </div>
              </div>

              {/* Interactive Walkthrough */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Interactive Step-by-step Walkthrough</h2>
                  <p className="text-sm text-gray-500">Use arrow keys ← → or buttons to navigate</p>
                </div>
                <StepAnimator result={result} />
              </div>

              <ClosurePanel closures={result.closures} />
              
              <CandidateKeysPanel 
                candidateKeys={result.candidateKeys} 
                primaryKey={result.primaryKey}
                primeAttributes={result.primeAttributes}
                nonPrimeAttributes={result.nonPrimeAttributes}
              />
              
              <NormalizationSteps steps={result.steps} result={result} />

              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
                  Final BCNF Relations
                </h2>
                <ResultRelations relations={result.relationsBCNF} normalForm="BCNF" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Export PDF button */}
      {result && (
        <button
          onClick={() => exportNormalizationReport(result, schema, fdsInput)}
          className="fixed bottom-6 right-6 bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium transition-transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
      )}
    </div>
  );
};

export default NormalizationTool;
