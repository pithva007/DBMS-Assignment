import React from 'react';

interface ExampleLoaderProps {
  onLoadExample: (exampleIndex: number) => void;
}

const ExampleLoader: React.FC<ExampleLoaderProps> = ({ onLoadExample }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onLoadExample(1)}
        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
      >
        Example 1 (Simple)
      </button>
      <button
        onClick={() => onLoadExample(2)}
        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
      >
        Example 2 (Student-Course)
      </button>
      <button
        onClick={() => onLoadExample(3)}
        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
      >
        Example 3 (Multi-key)
      </button>
    </div>
  );
};

export default ExampleLoader;
