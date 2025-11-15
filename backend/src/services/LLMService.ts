import OpenAI from 'openai';
import { Storyboard, ScrapedData } from '../types/index';

export class LLMService {
  private client: OpenAI;

  constructor(config: { apiKey: string }) {
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async generateStoryboard(scrapedData: ScrapedData): Promise<Storyboard> {
    const prompt = this.buildPrompt(scrapedData);
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o, can be changed to gpt-4-turbo or gpt-3.5-turbo
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert presentation strategist. Output ONLY valid JSON, no other text.' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        response_format: { type: 'json_object' }, // Force JSON output
        temperature: 0.7,
        max_tokens: 4096,
      });
      
      const text = response.choices[0]?.message?.content || '';
      if (!text) {
        throw new Error('Empty response from OpenAI');
      }
      
      const storyboard = this.parseStoryboard(text);
      
      return storyboard;
    } catch (error: any) {
      console.error('Error generating storyboard:', error);
      throw new Error(`Failed to generate storyboard: ${error.message}`);
    }
  }

  private buildPrompt(scrapedData: ScrapedData): string {
    const mainContent = scrapedData.mainPage.content.substring(0, 2000);
    const adjacentTitles = scrapedData.adjacentPages.map(p => p.title).join(', ');
    
    return `Analyze this website data and create a compelling presentation storyboard.

WEBSITE DATA:
Main Page: ${scrapedData.mainPage.title}
Content: ${mainContent}

Adjacent Pages: ${adjacentTitles}

CREATE A STORYBOARD with 8-12 nodes following this structure:
1. Title node (product name + compelling tagline)
2. Problem node (what pain point does this solve?)
3. Solution node (high-level product description)
4-7. Feature nodes (3-5 most important features, one per node)
8. Benefit node (key benefits/use cases)
9. CTA node (call-to-action)

For EACH node, provide:
- id: unique identifier (e.g., "node-1", "node-2")
- type: "title" | "problem" | "solution" | "feature" | "benefit" | "cta"
- title: short, punchy title (max 8 words)
- content: 2-3 bullet points or 1 paragraph (max 50 words)
- speakerNotes: what presenter should say (100-150 words)
- position: { x: number, y: number } - layout for canvas (spread nodes horizontally, 300px apart)

Return a JSON object matching this exact schema:
{
  "title": "Product Name",
  "tagline": "One compelling sentence",
  "nodes": [
    {
      "id": "node-1",
      "type": "title",
      "title": "...",
      "content": "...",
      "speakerNotes": "...",
      "position": { "x": 0, "y": 0 }
    }
  ]
}

Make it story-driven and engaging.`;
  }

  private parseStoryboard(text: string): Storyboard {
    // With OpenAI JSON mode, response should be valid JSON
    // But we'll extract JSON in case there's any extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text.trim();
    
    if (!jsonText) {
      throw new Error('Invalid LLM response: No JSON found');
    }
    
    try {
      const parsed = JSON.parse(jsonText);
      
      // Validate and set default positions if missing
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        parsed.nodes = parsed.nodes.map((node: any, index: number) => ({
          ...node,
          position: node.position || { x: index * 300, y: 0 }
        }));
      }
      
      return parsed;
    } catch (error: any) {
      throw new Error(`Failed to parse storyboard JSON: ${error.message}`);
    }
  }
}

