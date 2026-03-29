import React from 'react';
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

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  attributes,
  fds,
  candidateKeys,
  primeAttributes,
  violations2NF,
  violations3NF,
}) => {
  // Determine layout: Left (candidate key attrs), Center (direct deps), Right (transitive deps)
  const allCandidateKeyAttrs = new Set(candidateKeys.flat());

  const leftAttrs: string[] = [];
  const centerAttrs: string[] = [];
  const rightAttrs: string[] = [];

  const isTransitive = (attr: string) => {
    return violations3NF.some(v => v.fd?.rhs.includes(attr));
  };

  const isPartial = (attr: string) => {
    return violations2NF.some(v => v.fd?.rhs.includes(attr));
  };

  const directlyDetermined = fds
    .filter(fd => fd.lhs.every(a => allCandidateKeyAttrs.has(a)))
    .flatMap(fd => fd.rhs);

  attributes.forEach(attr => {
    if (allCandidateKeyAttrs.has(attr)) {
      leftAttrs.push(attr);
    } else if (isTransitive(attr) && !isPartial(attr)) {
      rightAttrs.push(attr);
    } else {
      centerAttrs.push(attr);
    }
  });

  const nodePositions = new Map<string, { x: number; y: number }>();

  let yLeft = 80, yCenter = 80, yRight = 80;
  
  leftAttrs.forEach(a => { nodePositions.set(a, { x: 110, y: yLeft }); yLeft += 90; });
  centerAttrs.forEach(a => { nodePositions.set(a, { x: 340, y: yCenter }); yCenter += 90; });
  rightAttrs.forEach(a => { nodePositions.set(a, { x: 570, y: yRight }); yRight += 90; });

  const svgHeight = Math.max(300, attributes.length * 90 + 80);

  const renderNode = (attr: string, pos: { x: number, y: number }) => {
    if (allCandidateKeyAttrs.has(attr)) {
      return (
        <g key={attr}>
          <circle cx={pos.x} cy={pos.y} r={34} fill="#E1F5EE" stroke="#0D9488" strokeWidth={2} />
          <text x={pos.x} y={pos.y + 6} fontSize={20} fontWeight={600} fill="#085041" textAnchor="middle">{attr}</text>
          <text x={pos.x} y={pos.y + 22} fontSize={9} fill="#0F6E56" textAnchor="middle">CK</text>
        </g>
      );
    } else if (primeAttributes.includes(attr)) {
      return (
        <g key={attr}>
          <circle cx={pos.x} cy={pos.y} r={28} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={1.5} />
          <text x={pos.x} y={pos.y + 6} fontSize={18} fill="#3C3489" textAnchor="middle">{attr}</text>
          <text x={pos.x} y={pos.y + 20} fontSize={9} fill="#534AB7" textAnchor="middle">prime</text>
        </g>
      );
    } else {
      return (
        <g key={attr}>
          <circle cx={pos.x} cy={pos.y} r={26} fill="#F1EFE8" stroke="#888780" strokeWidth={1} />
          <text x={pos.x} y={pos.y + 6} fontSize={17} fill="#444441" textAnchor="middle">{attr}</text>
          <text x={pos.x} y={pos.y + 20} fontSize={9} fill="#5F5E5A" textAnchor="middle">non-prime</text>
        </g>
      );
    }
  };

  const lines: React.ReactNode[] = [];

  fds.forEach((fd, fdIdx) => {
    const isTransitiveFD = violations3NF.some(v => v.fd === fd);
    const isPartialFD = violations2NF.some(v => v.fd === fd);
    const isDirectFD = fd.lhs.every(a => allCandidateKeyAttrs.has(a));

    let stroke = "#888780";
    let strokeWidth = 1;
    let strokeDasharray = "none";
    let markerId = "url(#arrow-gray)";
    let label = "";

    if (isTransitiveFD) {
      stroke = "#E24B4A";
      strokeWidth = 1.5;
      strokeDasharray = "6 3";
      markerId = "url(#arrow-red)";
      label = "transitive";
    } else if (isPartialFD) {
      stroke = "#BA7517";
      strokeWidth = 1.5;
      strokeDasharray = "3 3";
      markerId = "url(#arrow-amber)";
      label = "partial";
    } else if (isDirectFD) {
      stroke = "#0D9488";
      strokeWidth = 2;
      markerId = "url(#arrow-teal)";
      label = "→";
    }

    fd.lhs.forEach(src => {
      fd.rhs.forEach(tgt => {
        const sourcePos = nodePositions.get(src);
        const targetPos = nodePositions.get(tgt);
        if (!sourcePos || !targetPos) return;

        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const angle = Math.atan2(dy, dx);
        
        const sourceR = allCandidateKeyAttrs.has(src) ? 34 : (primeAttributes.includes(src) ? 28 : 26);
        const startX = sourcePos.x + sourceR * Math.cos(angle);
        const startY = sourcePos.y + sourceR * Math.sin(angle);
        
        const targetR = allCandidateKeyAttrs.has(tgt) ? 34 : (primeAttributes.includes(tgt) ? 28 : 26);
        // adjust endX/endY to account for arrow marker size
        const endX = targetPos.x - (targetR + 6) * Math.cos(angle);
        const endY = targetPos.y - (targetR + 6) * Math.sin(angle);

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        lines.push(
          <g key={`${fdIdx}-${src}-${tgt}`}>
            <line 
              x1={startX} y1={startY} 
              x2={endX} y2={endY} 
              stroke={stroke} 
              strokeWidth={strokeWidth} 
              strokeDasharray={strokeDasharray}
              markerEnd={markerId}
            />
            {label && (
              <text 
                x={midX} y={midY - 4} 
                fontSize={9} 
                fill={stroke} 
                textAnchor="middle"
                transform={`rotate(${angle * 180 / Math.PI}, ${midX}, ${midY})`}
              >
                {label}
              </text>
            )}
          </g>
        );
      });
    });
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 680 ${svgHeight}`} style={{ minWidth: '600px' }}>
          <defs>
            <marker id="arrow-teal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round" />
            </marker>
            <marker id="arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#888780" strokeWidth="1.5" strokeLinecap="round" />
            </marker>
          </defs>

          {lines}
          {attributes.map(attr => nodePositions.has(attr) && renderNode(attr, nodePositions.get(attr)!))}

          {/* Legend */}
          <g transform="translate(520, 20)">
            <rect x="0" y="0" width="140" height="150" fill="white" stroke="#E5E7EB" rx="6" />
            
            <circle cx="15" cy="20" r="6" fill="#E1F5EE" stroke="#0D9488" />
            <text x="28" y="23" fontSize="10" fill="#4B5563">Candidate Key</text>
            
            <circle cx="15" cy="40" r="6" fill="#EDE9FE" stroke="#7C3AED" />
            <text x="28" y="43" fontSize="10" fill="#4B5563">Prime Attribute</text>
            
            <circle cx="15" cy="60" r="6" fill="#F1EFE8" stroke="#888780" />
            <text x="28" y="63" fontSize="10" fill="#4B5563">Non-prime</text>

            <line x1="10" y1="85" x2="25" y2="85" stroke="#0D9488" strokeWidth="2" />
            <text x="28" y="88" fontSize="10" fill="#4B5563">Direct FD</text>

            <line x1="10" y1="105" x2="25" y2="105" stroke="#BA7517" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="28" y="108" fontSize="10" fill="#4B5563">Partial FD</text>

            <line x1="10" y1="125" x2="25" y2="125" stroke="#E24B4A" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="28" y="128" fontSize="10" fill="#4B5563">Transitive FD</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default DependencyGraph;