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

  // Create edges connecting nodes in sequence (prevent duplicates)
  const createFlowEdges = useCallback((storyNodes: StoryNodeType[]): Edge[] => {
    if (storyNodes.length < 2) return [];
    
    const edges: Edge[] = [];
    const edgeSet = new Set<string>(); // Track edges to prevent duplicates
    
    for (let i = 0; i < storyNodes.length - 1; i++) {
      const sourceId = storyNodes[i].id;
      const targetId = storyNodes[i + 1].id;
      const edgeKey = `${sourceId}-${targetId}`;
      
      // Only add if not already present
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          id: `edge-${i}-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
      animated: true,
        });
      }
    }
    
    return edges;
  }, []);

  // Create a stable reference for node IDs to detect actual changes
  const nodeIdsString = useMemo(() => {
    if (!initialNodes || initialNodes.length === 0) return '';
    return JSON.stringify(initialNodes.map(n => ({ 
      id: n.id, 
      x: n.position?.x ?? 0, 
      y: n.position?.y ?? 0,
      title: n.title,
      type: n.type
    })));
  }, [initialNodes]);

  // Initialize nodes and edges from initialNodes (only recalculate when nodes actually change)
  const initialFlowNodes = useMemo(() => createFlowNodes(initialNodes), [nodeIdsString, createFlowNodes]);
  const initialFlowEdges = useMemo(() => createFlowEdges(initialNodes), [nodeIdsString, createFlowEdges]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialFlowEdges);

  // Track previous nodeIdsString to detect actual changes
  const prevNodeIdsStringRef = useRef<string>('');

  // Update nodes when initialNodes actually change (using stable reference)
  useEffect(() => {
    // Only update if the node IDs string actually changed
    if (prevNodeIdsStringRef.current === nodeIdsString) {
      return;
    }
    
    prevNodeIdsStringRef.current = nodeIdsString;
    
    console.log('🔄 Initial nodes changed:', initialNodes);
    if (!initialNodes || initialNodes.length === 0) {
      console.warn('⚠️ No initial nodes provided');
      setNodes([]);
      setEdges([]);
      return;
    }
    
    const updatedNodes = createFlowNodes(initialNodes);
    const updatedEdges = createFlowEdges(initialNodes);
    
    // Remove any duplicate edges before setting
    const uniqueEdges = updatedEdges.filter((edge, index, self) =>
      index === self.findIndex(e => 
        e.source === edge.source && e.target === edge.target
      )
    );
    
    console.log('📝 Setting nodes:', updatedNodes.length, 'edges:', uniqueEdges.length);
    setNodes(updatedNodes);
    setEdges(uniqueEdges);
    hasFittedView.current = false; // Reset fit view flag when nodes change
  }, [nodeIdsString, initialNodes, createFlowNodes, createFlowEdges]);

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

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(nds => {
      const updated = nds.filter(node => node.id !== nodeId);
      
      // Remove edges connected to deleted node
      setEdges(eds => {
        const filtered = eds.filter(
          edge => edge.source !== nodeId && edge.target !== nodeId
        );
        
        // Recreate sequential edges for remaining nodes
        if (updated.length >= 2) {
          const sequentialEdges: Edge[] = [];
          const edgeSet = new Set<string>();
          
          for (let i = 0; i < updated.length - 1; i++) {
            const sourceId = updated[i].id;
            const targetId = updated[i + 1].id;
            const edgeKey = `${sourceId}-${targetId}`;
            
            if (!edgeSet.has(edgeKey)) {
              edgeSet.add(edgeKey);
              sequentialEdges.push({
                id: `edge-${i}-${sourceId}-${targetId}`,
                source: sourceId,
                target: targetId,
                animated: true,
              });
            }
          }
          
          return sequentialEdges;
        }
        
        return filtered;
      });
      
      // Notify parent component
      const storyNodes = updated.map(n => ({
        ...n.data,
        position: n.position
      } as StoryNodeType));
      onNodesChange(storyNodes);
      
      return updated;
    });
  }, [onNodesChange, setNodes, setEdges]);

  // Attach onEdit and onDelete handlers to nodes (only when handlers change)
  useEffect(() => {
    setNodes(nds => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        onEdit: handleNodeEdit,
        onDelete: handleNodeDelete
      }
    })));
  }, [handleNodeEdit, handleNodeDelete, setNodes]);

  const onNodesChangeHandler = useCallback((changes: NodeChange[]) => {
    onNodesChangeInternal(changes);
  }, [onNodesChangeInternal]);

  // Track if this is the initial mount to prevent syncing on first render
  const isInitialMount = useRef(true);
  const lastSyncedNodes = useRef<string>('');
  
  // Sync node changes to parent component (only when nodes actually change, debounced)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
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
    }, 500); // Increased debounce time to reduce sync frequency
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [nodes, onNodesChange]);

  // Prevent duplicate connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      setEdges(eds => {
        // Check if edge already exists
        const edgeExists = eds.some(
          e => e.source === params.source && e.target === params.target
        );
        
        if (edgeExists) {
          console.warn('⚠️ Edge already exists, skipping duplicate connection');
          return eds;
        }
        
        // Add new edge
        return addEdge({
          ...params,
          id: `edge-${params.source}-${params.target}-${Date.now()}`,
          animated: true,
        }, eds);
      });
    },
    [setEdges]
  );

  // Store ReactFlow instance to programmatically fit view
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const hasFittedView = useRef(false);
  const fitViewTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  
  // Consolidated fitView function
  const performFitView = useCallback(() => {
    if (fitViewTimeoutRef.current) {
      clearTimeout(fitViewTimeoutRef.current);
    }
    
    fitViewTimeoutRef.current = setTimeout(() => {
      if (reactFlowInstance.current && nodes.length > 0 && !hasFittedView.current) {
        try {
          reactFlowInstance.current.fitView({ padding: 0.2, maxZoom: 1.5, duration: 400 });
          hasFittedView.current = true;
          console.log('🔍 Fitted view to show all nodes');
        } catch (error) {
          console.warn('⚠️ Could not fit view:', error);
        }
      }
    }, 300);
  }, [nodes.length]);
  
  // Callback when ReactFlow is initialized
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    console.log('✅ ReactFlow instance initialized');
    performFitView();
  }, [performFitView]);
  
  // Fit view when nodes change (consolidated logic)
  useEffect(() => {
    if (reactFlowInstance.current && nodes.length > 0) {
      hasFittedView.current = false; // Reset flag when nodes change
      performFitView();
    }
  }, [nodeIdsString, performFitView]);
  
  // Listen for resize events to refit view (for when arc is applied)
  useEffect(() => {
    const handleResize = () => {
      if (reactFlowInstance.current && nodes.length > 0) {
        hasFittedView.current = false;
        performFitView();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (fitViewTimeoutRef.current) {
        clearTimeout(fitViewTimeoutRef.current);
      }
    };
  }, [nodes.length, performFitView]);

  // Add new node functionality
  const handleAddNode = useCallback((type: StoryNodeType['type'] = 'feature') => {
    const newNodeId = `node-${Date.now()}`;
    const lastNode = nodes[nodes.length - 1];
    const newPosition = lastNode 
      ? { x: lastNode.position.x + 350, y: lastNode.position.y }
      : { x: 0, y: 0 };
    
    const newNode: StoryNodeType = {
      id: newNodeId,
      type,
      title: `New ${type}`,
      content: 'Add your content here...',
      speakerNotes: 'Add speaker notes here...',
      position: newPosition
    };
    
    const newFlowNode: Node = {
      id: newNodeId,
      type: 'storyNode',
      position: newPosition,
      data: {
        ...newNode,
        onEdit: handleNodeEdit,
        onDelete: handleNodeDelete
      }
    };
    
    setNodes(nds => [...nds, newFlowNode]);
    
    // Add edge from last node to new node (check for duplicates)
    if (lastNode) {
      setEdges(eds => {
        // Check if edge already exists
        const edgeExists = eds.some(
          e => e.source === lastNode.id && e.target === newNodeId
        );
        
        if (edgeExists) {
          console.warn('⚠️ Edge already exists, skipping');
          return eds;
        }
        
        return [...eds, {
          id: `edge-${eds.length}-${lastNode.id}-${newNodeId}`,
          source: lastNode.id,
          target: newNodeId,
          animated: true,
        }];
      });
    }
    
    // Notify parent
    const updatedNodes = [...nodes.map(n => ({
      ...n.data,
      position: n.position
    } as StoryNodeType)), newNode];
    onNodesChange(updatedNodes);
    
    console.log('➕ Added new node:', newNodeId);
  }, [nodes, setNodes, setEdges, handleNodeEdit, handleNodeDelete, onNodesChange]);

  console.log('🎨 Rendering canvas with', nodes.length, 'nodes and', edges.length, 'edges');

  return (
    <div className="h-full w-full relative" style={{ minHeight: '600px' }}>
      {/* Add Node Button */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 border">
        <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Add Node</div>
        <div className="flex flex-col gap-1">
          {(['title', 'problem', 'solution', 'feature', 'benefit', 'cta'] as const).map(type => (
            <button
              key={type}
              onClick={() => handleAddNode(type)}
              className="text-xs px-3 py-1 rounded hover:bg-gray-100 text-left capitalize transition-colors"
              title={`Add ${type} node`}
            >
              + {type}
            </button>
          ))}
        </div>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        onInit={onInit}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        connectionMode="loose"
        deleteKeyCode={null} // Disable delete key to prevent accidental deletions
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

