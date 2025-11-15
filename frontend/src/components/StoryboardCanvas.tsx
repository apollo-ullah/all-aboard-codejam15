import { useCallback, useEffect, useRef, useMemo } from 'react';
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
  ReactFlowInstance,
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
    console.log('📊 Creating flow nodes from:', storyNodes);
    const flowNodes = storyNodes.map((node, index) => {
      // Ensure position is valid, default to horizontal layout if missing
      const position = node.position && 
                       typeof node.position.x === 'number' && 
                       typeof node.position.y === 'number'
        ? node.position
        : { x: index * 350, y: 0 };
      
      return {
        id: node.id,
        type: 'storyNode',
        position,
        data: {
          ...node,
          position, // Store position in data too
        }
      };
    });
    console.log('✅ Created flow nodes:', flowNodes.length, flowNodes);
    return flowNodes;
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

  // Initialize nodes and edges from initialNodes
  const initialFlowNodes = useMemo(() => createFlowNodes(initialNodes), [initialNodes]);
  const initialFlowEdges = useMemo(() => createFlowEdges(initialNodes), [initialNodes]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialFlowEdges);

  // Update nodes when initialNodes change (only when the array reference changes, not on every render)
  useEffect(() => {
    console.log('🔄 Initial nodes changed:', initialNodes);
    if (!initialNodes || initialNodes.length === 0) {
      console.warn('⚠️ No initial nodes provided');
      return;
    }
    const updatedNodes = createFlowNodes(initialNodes);
    const updatedEdges = createFlowEdges(initialNodes);
    console.log('📝 Setting nodes:', updatedNodes.length, 'edges:', updatedEdges.length);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes.length, JSON.stringify(initialNodes.map(n => n.id))]);

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
  }, [onNodesChangeInternal]);

  // Track if this is the initial mount to prevent syncing on first render
  const isInitialMount = useRef(true);
  const lastSyncedNodes = useRef<string>('');
  
  // Sync node changes to parent component (only when nodes actually change, debounced)
  const syncTimeoutRef = useRef<number | undefined>();
  useEffect(() => {
    // Skip sync on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSyncedNodes.current = JSON.stringify(nodes.map(n => ({ id: n.id, position: n.position })));
      return;
    }
    
    // Debounce to prevent infinite loops
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      const storyNodes = nodes.map(n => ({
        ...n.data,
        position: n.position
      } as StoryNodeType));
      
      // Only call if nodes actually changed (compare IDs and positions)
      const currentNodesStr = JSON.stringify(storyNodes.map(n => ({ id: n.id, position: n.position })));
      if (currentNodesStr !== lastSyncedNodes.current) {
        console.log('🔄 Syncing node changes to parent');
        lastSyncedNodes.current = currentNodesStr;
        onNodesChange(storyNodes);
      }
    }, 300);
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  // Store ReactFlow instance to programmatically fit view
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const hasFittedView = useRef(false);
  
  // Callback when ReactFlow is initialized
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    console.log('✅ ReactFlow instance initialized');
    
    // Fit view after a short delay to ensure nodes are rendered
    if (nodes.length > 0 && !hasFittedView.current) {
      setTimeout(() => {
        try {
          instance.fitView({ padding: 0.2, maxZoom: 1.5, duration: 400 });
          hasFittedView.current = true;
          console.log('🔍 Fitted view to show all nodes');
        } catch (error) {
          console.warn('⚠️ Could not fit view:', error);
        }
      }, 300);
    }
  }, [nodes.length]);
  
  // Fit view when nodes are first loaded (if instance is already available)
  useEffect(() => {
    if (reactFlowInstance.current && nodes.length > 0 && !hasFittedView.current) {
      setTimeout(() => {
        try {
          reactFlowInstance.current?.fitView({ padding: 0.2, maxZoom: 1.5, duration: 400 });
          hasFittedView.current = true;
          console.log('🔍 Fitted view to show all nodes (from effect)');
        } catch (error) {
          console.warn('⚠️ Could not fit view:', error);
        }
      }, 300);
    }
  }, [nodes.length]);

  console.log('🎨 Rendering canvas with', nodes.length, 'nodes and', edges.length, 'edges');
  console.log('📍 Node positions:', nodes.map(n => ({ id: n.id, position: n.position })));
  
  return (
    <div className="h-full w-full" style={{ minHeight: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5, duration: 400 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

