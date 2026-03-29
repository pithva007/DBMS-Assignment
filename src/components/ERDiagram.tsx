import React from 'react';
import { DecomposedRelation, FunctionalDependency } from '../types/normalization';

interface ERDiagramProps {
  originalSchema: string[];
  finalRelations: DecomposedRelation[];
  originalFDs: FunctionalDependency[];
}

export const ERDiagram: React.FC<ERDiagramProps> = ({ finalRelations }) => {
  const ENTITY_WIDTH = 160;
  const HEADER_HEIGHT = 36;
  const ROW_HEIGHT = 26;
  
  const entityHeight = (attrs: string[]) => HEADER_HEIGHT + attrs.length * ROW_HEIGHT + 10;

  const positions = finalRelations.map((_, i) => {
    const count = finalRelations.length;
    if (count === 1) return [{x: 260, y: 60}][i];
    if (count === 2) return [{x: 120, y: 80}, {x: 360, y: 80}][i];
    if (count === 3) return [{x: 60, y: 60}, {x: 260, y: 60}, {x: 460, y: 60}][i];
    if (count === 4) return [{x: 60, y: 40}, {x: 280, y: 40}, {x: 60, y: 220}, {x: 280, y: 220}][i];
    const row = Math.floor(i / 3);
    const col = i % 3;
    return { x: 60 + col * 200, y: 60 + row * 200 };
  });

  const colors = [
    { header: "#0D9488", body: "#E1F5EE", text: "#085041" },
    { header: "#BA7517", body: "#FAEEDA", text: "#633806" },
    { header: "#7C3AED", body: "#EDE9FE", text: "#3C3489" },
    { header: "#993C1D", body: "#FAECE7", text: "#4A1B0C" },
    { header: "#5F5E5A", body: "#F1EFE8", text: "#2C2C2A" }
  ];

  // Map to store foreign keys: { fromReq: index, toReq: index, attr: string }
  const foreignKeys: { fromReq: number; toReq: number; attr: string }[] = [];

  finalRelations.forEach((r1, i1) => {
    finalRelations.forEach((r2, i2) => {
      if (i1 === i2) return;
      const commonAttrs = r1.attributes.filter(a => r2.attributes.includes(a));
      commonAttrs.forEach(attr => {
        // A is PK of R2 but not PK of R1 -> A is FK in R1 referencing R2
        if (r2.primaryKey.includes(attr) && !r1.primaryKey.includes(attr)) {
          foreignKeys.push({ fromReq: i1, toReq: i2, attr });
        }
      });
    });
  });

  let maxBottom = 0;
  positions.forEach((pos, i) => {
    const bottom = pos.y + entityHeight(finalRelations[i].attributes);
    if (bottom > maxBottom) maxBottom = bottom;
  });
  
  const svgHeight = maxBottom + 80;

  const renderEntity = (r: DecomposedRelation, i: number) => {
    const pos = positions[i];
    const c = colors[i % colors.length];
    const h = entityHeight(r.attributes);
    
    return (
      <g key={r.name} transform={`translate(${pos.x}, ${pos.y})`}>
        {/* Outer body rect */}
        <rect x={0} y={0} width={ENTITY_WIDTH} height={h} rx={10} fill={c.body} stroke={c.header} strokeWidth={1.5} />
        
        {/* Header (Top rounded, bottom square) */}
        <rect x={0} y={0} width={ENTITY_WIDTH} height={HEADER_HEIGHT} rx={10} fill={c.header} />
        <rect x={0} y={10} width={ENTITY_WIDTH} height={HEADER_HEIGHT - 10} fill={c.header} />
        <text x={ENTITY_WIDTH/2} y={23} fill="white" fontSize={13} fontWeight={600} textAnchor="middle">{r.name}</text>

        {/* Rows */}
        {r.attributes.map((attr, attrIdx) => {
          const isPK = r.primaryKey.includes(attr);
          const isFK = foreignKeys.some(fk => fk.fromReq === i && fk.attr === attr);
          const rowY = HEADER_HEIGHT + attrIdx * ROW_HEIGHT;
          const bgFill = attrIdx % 2 === 0 ? "rgba(255,255,255,0.4)" : "transparent";

          return (
            <g key={attr}>
              <rect x={0} y={rowY} width={ENTITY_WIDTH} height={ROW_HEIGHT} fill={isPK ? "rgba(255,255,255,0.7)" : bgFill} />
              <text x={12} y={rowY + 18} fill={c.text} fontSize={12} fontWeight={isPK ? 600 : 400}>
                {attr}
              </text>
              {isPK && <text x={ENTITY_WIDTH - 30} y={rowY + 18} fill="#CA8A04" fontSize={10} fontWeight={600}>(PK)</text>}
              {isFK && <text x={ENTITY_WIDTH - 30} y={rowY + 18} fill="#2563EB" fontSize={10} fontStyle="italic">(FK)</text>}
            </g>
          );
        })}
      </g>
    );
  };

  const renderFKLines = () => {
    return foreignKeys.map((fk, idx) => {
      const fromPos = positions[fk.fromReq];
      const toPos = positions[fk.toReq];
      const fromRel = finalRelations[fk.fromReq];
      const toRel = finalRelations[fk.toReq];

      const fromAttrIdx = fromRel.attributes.indexOf(fk.attr);
      const toAttrIdx = toRel.attributes.indexOf(fk.attr);

      const startX = fromPos.x + ENTITY_WIDTH;
      const startY = fromPos.y + HEADER_HEIGHT + fromAttrIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
      
      const endX = toPos.x;
      const endY = toPos.y + HEADER_HEIGHT + toAttrIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

      // Make lines routing a bit more structured
      const midX = (startX + endX) / 2;

      return (
        <g key={`fk-${idx}`}>
          <path d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`} 
                fill="none" stroke="#378ADD" strokeWidth={1.5} strokeDasharray="5 3" />
          
          {/* Diamond at FK end */}
          <polygon points={`${startX},${startY} ${startX+4},${startY-4} ${startX+8},${startY} ${startX+4},${startY+4}`} fill="#378ADD" />
          
          {/* Arrow at PK end */}
          <polygon points={`${endX - 8},${endY - 4} ${endX},${endY} ${endX - 8},${endY + 4}`} fill="#378ADD" />
          
          <text x={midX} y={(startY + endY) / 2 - 5} fill="#2563EB" fontSize={9} textAnchor="middle">FK</text>
        </g>
      );
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 680 ${svgHeight}`} style={{ minWidth: '600px' }}>
          {renderFKLines()}
          {finalRelations.map((r, i) => renderEntity(r, i))}
          
          <text x={340} y={svgHeight - 20} fill="#6B7280" fontSize={10} textAnchor="middle">
            PK = Primary Key  |  FK = Foreign Key  |  Dashed lines = Referential Integrity Constraint
          </text>
        </svg>
      </div>
    </div>
  );
};

export default ERDiagram;