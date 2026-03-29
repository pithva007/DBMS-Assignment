import React, { useMemo, useEffect, useCallback } from 'react';
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
  EdgeProps,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { FunctionalDependency, NormalFormViolation } from '../types/normalization';

interface DependencyGraphProps {
  attributes: string[];
  fds: FunctionalDependency[];
  candidateKeys: string[][];
  primeAttributes: string[];
  violations2NF: NormalFormViolation[];
  violations3NF: NormalFormViolation[];
  violationsBCNF: NormalFormViolation[];
}

// Custom Node for Attributes
const AttributeNode = ({ data, selected }: NodeProps) => {
  let bgClass = "bg-slate-50 border-slate-400 text-slate-800";
  let subTextClass = "text-slate-500";
  
  if (data.nodeType === 'CK') {
    bgClass = "bg-teal-50 border-teal-600 text-teal-900";
    subTextClass = "text-teal-700";
  } else if (data.nodeType === 'prime') {
    bgClass = "bg-purple-50 border-purple-500 text-purple-900";
    subTextClass = "text-purple-700";
  }

  return (
    <div 
      className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 ${selected ? 'shadow-xl scale-110' : 'shadow-md'} ${bgClass}`}
      title={data.tooltip}
    >
      <Handle type="target" position={Position.Left} className="!w-1 !h-1 !bg-transparent !border-none" />
      <div className="font-bold text-lg">{data.label}</div>
      <div className={`text-[10px] font-medium tracking-wide ${subTextClass}`}>{data.subLabel}</div>
      <Handle type="source" position={Position.Right} className="!w-1 !h-1 !bg-transparent !border-none" />
    </div>
  );
};

// Custom Edge with Background Label
const CustomLabeledEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm text-[10px] font-bold border"
          >
            <span style={{ color: data.color }}>{data.label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = { attribute: AttributeNode };
const edgeTypes = { custom: CustomLabeledEdge };

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 90;
  const nodeHeight = 90;

  dagreGraph.setGraph({ rankdir: direction, ranksep: 180, nodesep: 80 });

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
      targetPosition: 'left',
      sourcePosition: 'right',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  attributes,
  fds,
  candidateKeys,
  primeAttributes,
  violations2NF,
  violations3NF,
}) => {
  const allCandidateKeyAttrs = useMemo(() => new Set(candidateKeys.flat()), [candidateKeys]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes = attributes.map(attr => {
      let nodeType = 'non-prime';
      let subLabel = 'non-prime';
      let tooltip = 'Non-prime Attribute';

      if (allCandidateKeyAttrs.has(attr)) {
        nodeType = 'CK';
        subLabel = 'CK';
        tooltip = 'Candidate Key Attribute';
      } else if (primeAttributes.includes(attr)) {
        nodeType = 'prime';
        subLabel = 'prime';
        tooltip = 'Prime Attribute (part of a key)';
      }

      return {
        id: attr,
        type: 'attribute',
        data: { label: attr, subLabel, nodeType, tooltip },
        position: { x: 0, y: 0 } // Computed by dagre later
      };
    });

    const edges: any[] = [];
    fds.forEach((fd, fdIdx) => {
      const isTransitiveFD = violations3NF.some(v => v.fd && v.fd.lhs.join(',') === fd.lhs.join(',') && v.fd.rhs.join(',') === fd.rhs.join(','));
      const isPartialFD = violations2NF.some(v => v.fd && v.fd.lhs.join(',') === fd.lhs.join(',') && v.fd.rhs.join(',') === fd.rhs.join(','));
      const isDirectFD = fd.lhs.every(a => allCandidateKeyAttrs.has(a));

      let stroke = "#94A3B8"; // slate-400
      let strokeWidth = 1.5;
      let strokeDasharray = "none";
      let label = "";
      let color = "#64748B"; // slate-500

      if (isTransitiveFD) {
        stroke = "#EF4444"; // red-500
        strokeWidth = 2;
        strokeDasharray = "5 5";
        label = "Transitive";
        color = "#DC2626";
      } else if (isPartialFD) {
        stroke = "#F59E0B"; // amber-500
        strokeWidth = 2;
        strokeDasharray = "5 5";
        label = "Partial";
        color = "#D97706";
      } else if (isDirectFD) {
        stroke = "#0D9488"; // teal-600
        strokeWidth = 2;
      }

      fd.lhs.forEach(src => {
        fd.rhs.forEach(tgt => {
          edges.push({
            id: `e-${fdIdx}-${src}-${tgt}`,
            source: src,
            target: tgt,
            type: label ? 'custom' : 'default', // Only use custom for labeled edges to simplify rendering
            data: { label, color },
            animated: isTransitiveFD || isPartialFD,
            style: { stroke, strokeWidth, strokeDasharray },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: stroke,
            },
          });
        });
      });
    });

    return getLayoutedElements(nodes, edges);
  }, [attributes, fds, allCandidateKeyAttrs, primeAttributes, violations2NF, violations3NF]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Layout recalcs when initial structure changes
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleResetView = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges, 'LR');
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
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 50 / 800 }} // Map 50px padding approx
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-right"
      >
        <Background color="#cbd5e1" gap={24} size={1.5} />
        <Controls showInteractive={false} className="bg-white shadow-md border border-slate-200 rounded-lg overflow-hidden" />
        
        <MiniMap 
          nodeStrokeColor={(n: any) => {
            if (n.data.nodeType === 'CK') return '#0D9488';
            if (n.data.nodeType === 'prime') return '#8B5CF6';
            return '#94A3B8';
          }}
          nodeColor={(n: any) => {
            if (n.data.nodeType === 'CK') return '#F0FDFA';
            if (n.data.nodeType === 'prime') return '#F5F3FF';
            return '#F8FAFC';
          }}
          nodeBorderRadius={30}
          className="rounded-lg shadow-md border border-slate-200 bg-white"
        />
        
        <Panel position="top-right" className="bg-white/95 backdrop-blur-sm p-3.5 rounded-lg shadow-md border border-slate-200 text-xs text-slate-700 min-w-[140px]">
          <div className="font-bold text-slate-800 mb-2.5 pb-1 border-b border-slate-100">Legend</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3.5 h-3.5 rounded-full bg-teal-50 border-2 border-teal-600"></div>
            <span>Candidate Key</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3.5 h-3.5 rounded-full bg-purple-50 border-2 border-purple-500"></div>
            <span>Prime</span>
          </div>
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-50 border-2 border-slate-400"></div>
            <span>Non-prime</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-0.5 bg-teal-600"></div>
            <span>Direct FD</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-0.5 bg-amber-500 border-dashed border"></div>
            <span>Partial FD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500 border-dashed border"></div>
            <span>Transitive FD</span>
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

export default DependencyGraph;