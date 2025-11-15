import { StoryNode, Storyboard } from '../types';

/**
 * Narrative Arc Templates
 * Defines the ideal structure for different presentation styles
 */

export type NarrativeArcStep = {
  type: StoryNode['type'];
  label: string;
  description: string;
  required: boolean;
};

export const YC_NARRATIVE_ARC: NarrativeArcStep[] = [
  {
    type: 'title',
    label: 'Title/Hook',
    description: 'Compelling product name and tagline',
    required: true,
  },
  {
    type: 'problem',
    label: 'Problem',
    description: 'The pain point you\'re solving',
    required: true,
  },
  {
    type: 'solution',
    label: 'Solution',
    description: 'Your product in one sentence',
    required: true,
  },
  {
    type: 'feature',
    label: 'Market Opportunity',
    description: 'Market size and opportunity',
    required: false,
  },
  {
    type: 'feature',
    label: 'Product/Features',
    description: 'Key features and how it works',
    required: true,
  },
  {
    type: 'feature',
    label: 'Business Model',
    description: 'How you make money',
    required: false,
  },
  {
    type: 'benefit',
    label: 'Traction/Metrics',
    description: 'Key metrics, growth, validation',
    required: false,
  },
  {
    type: 'feature',
    label: 'Team',
    description: 'Why you\'re the right team',
    required: false,
  },
  {
    type: 'cta',
    label: 'Ask/CTA',
    description: 'What you\'re asking for',
    required: true,
  },
];

export const FINANCE_NARRATIVE_ARC: NarrativeArcStep[] = [
  {
    type: 'title',
    label: 'Executive Summary',
    description: 'Overview of the presentation',
    required: true,
  },
  {
    type: 'problem',
    label: 'Market Analysis',
    description: 'Market conditions and trends',
    required: true,
  },
  {
    type: 'solution',
    label: 'Financial Overview',
    description: 'Key financial metrics and projections',
    required: true,
  },
  {
    type: 'feature',
    label: 'Strategy',
    description: 'Strategic approach and plan',
    required: true,
  },
  {
    type: 'feature',
    label: 'Implementation Plan',
    description: 'How the strategy will be executed',
    required: false,
  },
  {
    type: 'benefit',
    label: 'Risk Analysis',
    description: 'Potential risks and mitigation',
    required: false,
  },
  {
    type: 'feature',
    label: 'Recommendations',
    description: 'Key recommendations and next steps',
    required: false,
  },
  {
    type: 'cta',
    label: 'Conclusion',
    description: 'Summary and call to action',
    required: true,
  },
];

/**
 * Get narrative arc template for a style
 */
export function getNarrativeArc(style: 'YC' | 'Finance'): NarrativeArcStep[] {
  return style === 'YC' ? YC_NARRATIVE_ARC : FINANCE_NARRATIVE_ARC;
}

/**
 * Analyze storyboard against narrative arc
 * Returns missing steps and suggestions
 */
export function analyzeStoryboard(
  storyboard: Storyboard,
  style: 'YC' | 'Finance'
): {
  missingSteps: NarrativeArcStep[];
  extraNodes: StoryNode[];
  suggestions: string[];
} {
  const arc = getNarrativeArc(style);
  const nodeTypes = storyboard.nodes.map(n => n.type);

  const missingSteps: NarrativeArcStep[] = [];
  const extraNodes: StoryNode[] = [];
  const suggestions: string[] = [];

  // Find missing required steps
  arc.forEach(step => {
    if (step.required && !nodeTypes.includes(step.type)) {
      missingSteps.push(step);
      suggestions.push(`Missing required ${step.label.toLowerCase()} slide`);
    }
  });

  // Find nodes that don't fit the arc
  storyboard.nodes.forEach(node => {
    const arcHasType = arc.some(step => step.type === node.type);
    if (!arcHasType) {
      extraNodes.push(node);
    }
  });

  // Check order
  const orderedTypes = arc.map(s => s.type);
  const currentOrder = storyboard.nodes.map(n => n.type);
  const isOutOfOrder = !arraysMatchOrder(currentOrder, orderedTypes);

  if (isOutOfOrder) {
    suggestions.push('Slides are not in the optimal order for this style');
  }

  return { missingSteps, extraNodes, suggestions };
}

/**
 * Reorder nodes to match narrative arc
 */
export function applyNarrativeArc(
  storyboard: Storyboard,
  style: 'YC' | 'Finance'
): Storyboard {
  const arc = getNarrativeArc(style);
  const reorderedNodes: StoryNode[] = [];

  // Group nodes by type
  const nodesByType = new Map<StoryNode['type'], StoryNode[]>();
  storyboard.nodes.forEach(node => {
    if (!nodesByType.has(node.type)) {
      nodesByType.set(node.type, []);
    }
    nodesByType.get(node.type)!.push(node);
  });

  // Track which nodes we've used
  const usedNodeIds = new Set<string>();

  // Build reordered list following arc
  let xPosition = 0;
  const SPACING = 320; // Reduced spacing for better fit

  arc.forEach((step, index) => {
    const nodesOfType = nodesByType.get(step.type) || [];

    if (nodesOfType.length > 0) {
      // Use existing nodes of this type (take first one, mark others as unused for now)
      const nodeToUse = nodesOfType[0];
      usedNodeIds.add(nodeToUse.id);

      reorderedNodes.push({
        ...nodeToUse,
        position: { x: xPosition, y: 0 },
      });
      xPosition += SPACING;
    }
    // Don't create placeholders - just skip missing steps
  });

  // Add remaining nodes of used types (if multiple of same type)
  arc.forEach((step) => {
    const nodesOfType = nodesByType.get(step.type) || [];
    if (nodesOfType.length > 1) {
      // Add additional nodes of this type
      for (let i = 1; i < nodesOfType.length; i++) {
        const node = nodesOfType[i];
        if (!usedNodeIds.has(node.id)) {
          reorderedNodes.push({
            ...node,
            position: { x: xPosition, y: 0 },
          });
          usedNodeIds.add(node.id);
          xPosition += SPACING;
        }
      }
    }
  });

  // Add any extra nodes that don't match arc at the end
  storyboard.nodes.forEach(node => {
    if (!usedNodeIds.has(node.id)) {
      reorderedNodes.push({
        ...node,
        position: { x: xPosition, y: 0 },
      });
      xPosition += SPACING;
    }
  });

  return {
    ...storyboard,
    nodes: reorderedNodes,
  };
}

/**
 * Helper to check if arrays match order (allowing for missing elements)
 */
function arraysMatchOrder(arr1: string[], arr2: string[]): boolean {
  let arr1Index = 0;
  let arr2Index = 0;

  while (arr1Index < arr1.length && arr2Index < arr2.length) {
    if (arr1[arr1Index] === arr2[arr2Index]) {
      arr1Index++;
      arr2Index++;
    } else {
      arr2Index++;
    }
  }

  return arr1Index === arr1.length;
}
