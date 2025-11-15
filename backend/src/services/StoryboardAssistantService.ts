import OpenAI from 'openai';
import { Storyboard, StoryNode } from '../types/index';

export class StoryboardAssistantService {
  private client: OpenAI;

  constructor(config: { apiKey: string }) {
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  /**
   * Chat with AI about storyboard improvements
   */
  async chatAboutStoryboard(
    storyboard: Storyboard,
    style: 'YC' | 'Finance',
    userMessage: string
  ): Promise<{ response: string; updatedStoryboard?: Storyboard }> {
    const context = this.buildContext(storyboard, style);
    
    const systemPrompt = `You are an expert presentation coach helping improve a ${style}-style storyboard.

You can help users by:
1. Providing advice and suggestions (when user asks "how can I..." or "what should I...")
2. Adding new nodes (slides) to the storyboard
3. Modifying existing nodes (changing title, content, speakerNotes)
4. Reordering/moving nodes (when user says "move X to position Y" or "reorder")
5. Removing nodes

When the user asks you to MAKE CHANGES (add, modify, reorder, move, remove, etc.), you MUST respond with a JSON object containing:
- "response": A clear explanation of what you did (e.g., "I've moved the Revenue Model node to position 3")
- "updatedStoryboard": The complete updated storyboard object with ALL nodes in their new order

CRITICAL RULES FOR REORDERING/MOVING NODES:
- If user says "move X to be the 3rd node" or "move X to position 3", you MUST actually reorder the nodes
- Keep ALL existing nodes (don't remove any)
- Rearrange them in the requested order
- Update positions: x = index * 320, y = 0 for sequential layout
- Preserve all node IDs, content, and properties
- Example: If user says "move revenue to 3rd", find the revenue node and place it at index 2 (0-indexed), shifting others

DO NOT just provide advice when the user explicitly asks you to make a change. ACTUALLY make the change and return the updatedStoryboard.

The storyboard structure is:
{
  "title": string,
  "tagline": string,
  "nodes": [
    {
      "id": string (must be unique, use "node-{timestamp}-{index}" for new nodes),
      "type": "title" | "problem" | "solution" | "feature" | "benefit" | "cta",
      "title": string,
      "content": string,
      "speakerNotes": string,
      "position": { "x": number, "y": number }
    }
  ]
}

IMPORTANT RULES:
- When adding nodes, generate unique IDs like "node-{timestamp}-{index}" (e.g., "node-1234567890-0")
- Preserve existing node IDs when modifying
- Set positions: x = index * 320, y = 0 for sequential layout
- Always include ALL nodes in updatedStoryboard (don't omit any)
- If only providing advice, omit "updatedStoryboard" from JSON`;

    // Detect if user wants to make changes (not just advice)
    const changeKeywords = [
      'add', 'create', 'insert', 'new',
      'modify', 'change', 'update', 'edit',
      'reorder', 'move', 'swap', 'switch', 'shift',
      'remove', 'delete', 'drop',
      'put', 'place', 'position'
    ];
    
    const wantsChanges = changeKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    
    const userPrompt = `CURRENT STORYBOARD:
${context}

USER REQUEST: ${userMessage}

${wantsChanges 
  ? 'IMPORTANT: The user wants you to MAKE CHANGES to the storyboard. You MUST respond with JSON containing both "response" (explaining what you did) and "updatedStoryboard" (the complete updated storyboard with all nodes in the new order/structure). Do NOT just provide advice - actually make the requested changes.'
  : 'The user is asking for advice. Provide helpful suggestions in the "response" field only (omit "updatedStoryboard").'}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' }, // Force JSON output
        temperature: 0.7,
        max_tokens: 4000,
      });

      const assistantResponseText = response.choices[0]?.message?.content || '';
      
      // Parse JSON response
      let parsedResponse: { response: string; updatedStoryboard?: Storyboard };
      try {
        parsedResponse = JSON.parse(assistantResponseText);
      } catch (parseError) {
        // If JSON parsing fails, try to extract it
        const jsonMatch = assistantResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: just return the text as response
          return {
            response: assistantResponseText,
          };
        }
      }
      
      // Validate and process updatedStoryboard if present
      if (parsedResponse.updatedStoryboard) {
        const validated = this.validateAndFixStoryboard(
          parsedResponse.updatedStoryboard,
          storyboard
        );
        return {
          response: parsedResponse.response || assistantResponseText,
          updatedStoryboard: validated,
        };
      }
      
      return {
        response: parsedResponse.response || assistantResponseText,
      };
    } catch (error: any) {
      console.error('Error in storyboard assistant:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  /**
   * Build context string from storyboard
   */
  private buildContext(storyboard: Storyboard, style: 'YC' | 'Finance'): string {
    const nodesSummary = storyboard.nodes.map((node, idx) => 
      `${idx + 1}. ID: ${node.id} | Type: ${node.type} | Title: ${node.title} | Content: ${node.content.substring(0, 150)} | Position: (${node.position.x}, ${node.position.y})`
    ).join('\n\n');

    return `Title: ${storyboard.title}
Tagline: ${storyboard.tagline}
Style: ${style}
Total Slides: ${storyboard.nodes.length}

Current Nodes:
${nodesSummary}

Node Types Available:
- title: Product name and tagline
- problem: Pain point being solved
- solution: High-level product description
- feature: Key features (can have multiple)
- benefit: Key benefits/use cases
- cta: Call-to-action

When adding nodes, place them at appropriate positions in the sequence.`;
  }

  /**
   * Validate and fix storyboard from AI response
   */
  private validateAndFixStoryboard(
    aiStoryboard: any,
    originalStoryboard: Storyboard
  ): Storyboard {
    // Ensure we have a valid structure
    if (!aiStoryboard || typeof aiStoryboard !== 'object') {
      return originalStoryboard;
    }

    const nodes = Array.isArray(aiStoryboard.nodes) ? aiStoryboard.nodes : [];
    
    // Process each node
    const validatedNodes = nodes.map((node: any, index: number) => {
      // Try to find original node by ID first, then by index
      const originalNode = node.id 
        ? originalStoryboard.nodes.find(n => n.id === node.id)
        : originalStoryboard.nodes[index];
      
      // Generate new ID if needed
      const nodeId = node.id || originalNode?.id || `node-${Date.now()}-${index}`;
      
      // Calculate position
      const position = node.position && 
                      typeof node.position.x === 'number' && 
                      typeof node.position.y === 'number'
        ? node.position
        : originalNode?.position || { x: index * 320, y: 0 };
      
      // Validate type
      const validTypes = ['title', 'problem', 'solution', 'feature', 'benefit', 'cta'];
      const nodeType = validTypes.includes(node.type) 
        ? node.type 
        : originalNode?.type || 'feature';
      
      return {
        id: nodeId,
        type: nodeType,
        title: node.title || originalNode?.title || 'Untitled',
        content: node.content || originalNode?.content || '',
        speakerNotes: node.speakerNotes || originalNode?.speakerNotes || '',
        position: position,
      };
    });

    // If no nodes were provided, keep original
    if (validatedNodes.length === 0) {
      return originalStoryboard;
    }

    return {
      title: aiStoryboard.title || originalStoryboard.title,
      tagline: aiStoryboard.tagline || originalStoryboard.tagline,
      nodes: validatedNodes,
    };
  }
}

