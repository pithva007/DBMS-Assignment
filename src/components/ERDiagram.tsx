import React, { useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  MarkerType,
  useNodesState,
  useEdgesState,
  Panel,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { DecomposedRelation, FunctionalDependency } from '../types/normalization';

interface ERDiagramProps {
  originalSchema: string[];
  finalRelations: DecomposedRelation[];
  originalFDs: FunctionalDependency[];
}

// Custom Node to represent a Database Table card
const TableNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`flex flex-col bg-white border-2 rounded-lg min-w-[200px] transition-all duration-300 ${selected ? 'shadow-xl border-blue-500 scale-[1.02]' : 'shadow-md border-slate-300'}`}>
      {/* Table Header */}
      <div className="bg-slate-800 text-white font-bold py-2 px-4 rounded-t-sm flex justify-between items-center text-sm border-b-2 border-slate-800">
        <span>{data.name}</span>
      </div>
      
      {/* Table Body - Rows of Attributes */}
      <div className="flex flex-col py-1">
        {data.attributes.map((attr: string) => {
          const isPK = data.primaryKey.includes(attr);
          const isFK = data.foreignKeys.includes(attr); 
          
          return (
            <div key={attr} className="relative flex items-center justify-between px-4 py-1.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 group">
              {/* Every Left Side handle (Incoming) */}
              <Handle 
                type="target" 
                position={Position.Left} 
                id={`left-${attr}`}
                className="!w-2 !h-2 !bg-blue-400 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity" 
                style={{ top: '50%', left: '-5px' }}
              />
              
              <div className="flex items-center gap-2">
                {isPK && <span className="text-amber-500 font-bold text-xs" title="Primary Key">PK</span>}
                {!isPK && isFK && <span className="text-blue-500 font-bold text-xs" title="Foreign Key">FK</span>}
                {!isPK && !isFK && <span className="text-transparent font-bold text-xs">--</span>}
                <span className={`text-sm ${isPK ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{attr}</span>
              </div>
              
              {/* Every Right Side handle (Outgoing) */}
              <Handle 
                type="source" 
                position={Position.Right} 
                id={`right-${attr}`}
                className="!w-2 !h-2 !bg-blue-400 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity" 
                style={{ top: '50%', right: '-5px' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const nodeTypes = { tableNode: TableNode };

const getLayoutedElements = (nodes: any[], edges: any[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Tables can be tall, handle height generously
  const nodeWidth = 240; 
  const nodeHeight = 180; 

  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 220, nodesep: 120 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

export const ERDiagram: React.FC<ERDiagramProps> = ({ finalRelations }) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // Determine Foreign Keys mathematically for visual markers
    const relationsWithFKs = finalRelations.map(rel => {
      const foreignKeys: string[] = [];
      finalRelations.forEach(otherRel => {
        if (rel.name === otherRel.name) return;
        if (otherRel.primaryKey.length > 0 && otherRel.primaryKey.every((pkAttr: string) => rel.attributes.includes(pkAttr))) {
           foreignKeys.push(...otherRel.primaryKey);
        }
      });
      return { ...rel, foreignKeys };
    });

    // Generate Nodes
    const nodes = relationsWithFKs.map((rel) => ({
      id: rel.name,
      type: 'tableNode',
      data: {
        name: rel.name,
        attributes: rel.attributes,
        primaryKey: rel.primaryKey,
        foreignKeys: rel.foreignKeys,
      },
      position: { x: 0, y: 0 } // Computed by dagre later
    }));

    // Generate Edges
    const edges: any[] = [];
    let edgeCounter = 0;

    finalRelations.forEach((sourceTable) => {
      finalRelations.forEach((targetTable) => {
        if (sourceTable.name === targetTable.name) return;

        const hasFK = sourceTable.primaryKey.length > 0 && 
                      sourceTable.primaryKey.every((pkAttr: string) => targetTable.attributes.includes(pkAttr));

        if (hasFK) {
          sourceTable.primaryKey.forEach((pkAttr: string) => {
            edges.push({
              id: `edge-${edgeCounter++}`,
              source: targetTable.name, 
              target: sourceTable.name, 
              sourceHandle: `right-${pkAttr}`, 
              targetHandle: `left-${pkAttr}`,  
              type: 'smoothstep', 
              animated: true,
              style: { stroke: '#475569', strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
                color: '#475569',
              },
            });
          });
        }
      });
    });

    return getLayoutedElements(nodes, edges);
  }, [finalRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Recalculate layout based on initial elements whenever input changes
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleResetView = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-[600px] border border-slate-200 rounded-xl bg-slate-50 overflow-hidden animate-fade-in relative z-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Background color="#cbd5e1" gap={30} size={1} />
        <Controls showInteractive={false} className="bg-white shadow-md border border-slate-200 rounded-lg overflow-hidden" />
        
        <Panel position="top-right" className="bg-white/95 backdrop-blur-sm p-3.5 rounded-lg shadow-md border border-slate-200 text-xs text-slate-700">
          <div className="font-bold text-slate-800 mb-2.5 pb-1 border-b border-slate-100">ER Diagram Legend</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-500 font-bold text-xs">PK</span>
            <span>Primary Key</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-500 font-bold text-xs">FK</span>
            <span>Foreign Key</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-0.5 bg-slate-600 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-slate-600 border-y-[4px] border-y-transparent"></div>
            </div>
            <span>Cross-Table Relationship</span>
          </div>
        </Panel>

        <Panel position="top-left">
          <button 
            onClick={handleResetView}
            className="bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 shadow-md border border-slate-200 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset View
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default ERDiagram;