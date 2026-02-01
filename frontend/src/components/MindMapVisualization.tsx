import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { MindMapStructure } from '../services/mindMapService';
import { mindMapService } from '../services/mindMapService';

interface MindMapVisualizationProps {
  structure: MindMapStructure;
  title?: string;
  mindMapId?: string; // ID del mapa mental para guardar cambios
  readOnly?: boolean; // Si es true, no se guardan los cambios
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
  mindMapId,
  readOnly = false,
}) => {
  const saveTimeoutRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

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
        draggable: true, // Enable dragging
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
          cursor: 'grab',
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

  const [nodes, setNodes, onNodesChange] = useNodesState(convertToReactFlowNodes());
  const [edges] = useEdgesState(convertToReactFlowEdges());

  // Save positions to backend with debounce
  const savePositions = useCallback(async (updatedNodes: Node[]) => {
    if (!mindMapId || readOnly) return;

    try {
      setIsSaving(true);
      const nodesToSave = updatedNodes.map(node => ({
        id: node.id,
        position: node.position,
      }));

      await mindMapService.updateMindMapPositions(mindMapId, nodesToSave as any);
      console.log('Positions saved successfully');
    } catch (error) {
      console.error('Error saving positions:', error);
    } finally {
      setIsSaving(false);
    }
  }, [mindMapId, readOnly]);

  // Handle node position changes with debounce
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    // Check if there's a position change
    const hasPositionChange = changes.some(
      change => change.type === 'position' && change.dragging === false
    );

    if (hasPositionChange && !readOnly && mindMapId) {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout to save after 1 second of no changes
      saveTimeoutRef.current = setTimeout(() => {
        setNodes(currentNodes => {
          savePositions(currentNodes);
          return currentNodes;
        });
      }, 1000);
    }
  }, [onNodesChange, readOnly, mindMapId, savePositions, setNodes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
      
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        {isSaving && (
          <div className="absolute top-4 right-4 z-10 bg-green-100 text-green-800 px-3 py-1.5 rounded-lg shadow-md text-sm font-medium flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando posiciones...
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          fitView
          nodesDraggable={!readOnly}
          nodesConnectable={false}
          elementsSelectable={true}
          attributionPosition="bottom-left"
          minZoom={0.2}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
          💡 <strong>Controles:</strong> Arrastra los nodos para reorganizarlos{!readOnly && ' (se guardan automáticamente)'}. 
          Usa la rueda del mouse para hacer zoom. Haz clic y arrastra el fondo para mover el mapa completo.
        </p>
      </div>
    </div>
  );
};
