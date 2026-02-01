import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { MindMapStructure } from '../services/mindMapService';

interface MindMapVisualizationProps {
  structure: MindMapStructure;
  title?: string;
}

const nodeColors = {
  root: {
    bg: '#8B5CF6', // purple-600
    border: '#7C3AED', // purple-700
    text: '#FFFFFF',
  },
  branch: {
    bg: '#3B82F6', // blue-600
    border: '#2563EB', // blue-700
    text: '#FFFFFF',
  },
  leaf: {
    bg: '#10B981', // green-600
    border: '#059669', // green-700
    text: '#FFFFFF',
  },
};

export const MindMapVisualization: React.FC<MindMapVisualizationProps> = ({
  structure,
  title,
}) => {
  // Convert mind map structure to React Flow format
  const convertToReactFlowNodes = useCallback((): Node[] => {
    return structure.nodes.map((node) => {
      const colors = nodeColors[node.type || 'branch'];
      
      return {
        id: node.id,
        type: 'default',
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.label,
        },
        style: {
          background: node.style?.backgroundColor || colors.bg,
          color: node.style?.textColor || colors.text,
          border: `2px solid ${node.style?.borderColor || colors.border}`,
          borderRadius: '8px',
          padding: '12px 20px',
          fontSize: node.type === 'root' ? '16px' : '14px',
          fontWeight: node.type === 'root' ? 'bold' : 'normal',
          minWidth: '120px',
          textAlign: 'center',
        },
      };
    });
  }, [structure.nodes]);

  const convertToReactFlowEdges = useCallback((): Edge[] => {
    return structure.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'smoothstep',
      label: edge.label,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: {
        strokeWidth: 2,
        stroke: '#94A3B8', // gray-400
      },
      labelStyle: {
        fontSize: '12px',
        fill: '#64748B', // gray-500
      },
    }));
  }, [structure.edges]);

  const [nodes] = useNodesState(convertToReactFlowNodes());
  const [edges] = useEdgesState(convertToReactFlowEdges());

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {structure.metadata?.totalNodes || structure.nodes.length} nodos •{' '}
            {structure.metadata?.totalEdges || structure.edges.length} conexiones •{' '}
            {structure.metadata?.maxLevel !== undefined
              ? `${structure.metadata.maxLevel + 1} niveles`
              : 'Jerarquía automática'}
          </p>
        </div>
      )}
      
      <div style={{ width: '100%', height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#E5E7EB" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const mindMapNode = structure.nodes.find((n) => n.id === node.id);
              const type = mindMapNode?.type || 'branch';
              return nodeColors[type].bg;
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Leyenda:</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded"
              style={{
                background: nodeColors.root.bg,
                border: `2px solid ${nodeColors.root.border}`,
              }}
            />
            <span className="text-sm text-gray-700">Concepto Principal</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded"
              style={{
                background: nodeColors.branch.bg,
                border: `2px solid ${nodeColors.branch.border}`,
              }}
            />
            <span className="text-sm text-gray-700">Conceptos Secundarios</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded"
              style={{
                background: nodeColors.leaf.bg,
                border: `2px solid ${nodeColors.leaf.border}`,
              }}
            />
            <span className="text-sm text-gray-700">Detalles</span>
          </div>
        </div>
      </div>

      {/* Controls Help */}
      <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Controles:</strong> Usa el mouse para hacer zoom y mover el mapa. Los botones en la
          esquina inferior izquierda permiten ajustar la vista.
        </p>
      </div>
    </div>
  );
};
