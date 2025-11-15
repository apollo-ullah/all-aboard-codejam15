import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import StoryNode from './StoryNode';
import { StoryNode as StoryNodeType } from '../types';

const nodeTypes = {
  storyNode: StoryNode,
};

interface StoryboardCanvasProps {
  initialNodes: StoryNodeType[];
  onNodesChange: (nodes: StoryNodeType[]) => void;
}

export default function StoryboardCanvas({ initialNodes, onNodesChange }: StoryboardCanvasProps) {
  // Convert storyboard nodes to React Flow nodes
  const createFlowNodes = useCallback((storyNodes: StoryNodeType[]): Node[] => {
    return storyNodes.map(node => ({
      id: node.id,
      type: 'storyNode',
      position: node.position,
      data: {
        ...node,
      }
    }));
  }, []);

  // Create edges connecting nodes in sequence
  const createFlowEdges = useCallback((storyNodes: StoryNodeType[]): Edge[] => {
    return storyNodes.slice(0, -1).map((node, idx) => ({
      id: `edge-${idx}`,
      source: node.id,
      target: storyNodes[idx + 1].id,
      animated: true,
    }));
  }, []);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(createFlowNodes(initialNodes));
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(createFlowEdges(initialNodes));

  // Update nodes when initialNodes change
  useEffect(() => {
    const updatedNodes = createFlowNodes(initialNodes);
    setNodes(updatedNodes);
    setEdges(createFlowEdges(initialNodes));
  }, [initialNodes, createFlowNodes, createFlowEdges, setNodes, setEdges]);

  const handleNodeEdit = useCallback((nodeId: string, updates: Partial<StoryNodeType>) => {
    setNodes(nds => {
      const updated = nds.map(node => {
        if (node.id === nodeId) {
          return { 
            ...node, 
            data: { ...node.data, ...updates },
            position: updates.position || node.position
          };
        }
        return node;
      });
      
      // Notify parent component with updated nodes
      const storyNodes = updated.map(n => ({
        ...n.data,
        position: n.position
      } as StoryNodeType));
      onNodesChange(storyNodes);
      
      return updated;
    });
  }, [onNodesChange, setNodes]);

  // Attach onEdit handler to nodes
  useEffect(() => {
    setNodes(nds => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        onEdit: handleNodeEdit
      }
    })));
  }, [handleNodeEdit, setNodes]);

  const onNodesChangeHandler = useCallback((changes: NodeChange[]) => {
    onNodesChangeInternal(changes);
    
    // Update parent with new positions after changes are applied
    setTimeout(() => {
      setNodes(currentNodes => {
        const updated = currentNodes.map(n => ({
          ...n.data,
          position: n.position
        } as StoryNodeType));
        onNodesChange(updated);
        return currentNodes;
      });
    }, 0);
  }, [onNodesChangeInternal, setNodes, onNodesChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

