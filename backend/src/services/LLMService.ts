import OpenAI from 'openai';
import { Storyboard, ScrapedData } from '../types/index';

export class LLMService {
  private client: OpenAI;

  constructor(config: { apiKey: string }) {
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async generateStoryboard(scrapedData: ScrapedData, mode: 'standard' | 'competitive' | 'briefing' | 'partnership' = 'standard'): Promise<Storyboard> {
    const prompt = this.buildPrompt(scrapedData, mode);

    try {
      console.log(`🤖 Calling OpenAI API to generate storyboard (${mode} mode)...`);
      console.log(`   Prompt length: ${prompt.length} characters`);
      console.log(`   Main page content: ${scrapedData.mainPage.content.length} chars`);
      console.log(`   Adjacent pages: ${scrapedData.adjacentPages.length}`);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o for advanced analysis
        messages: [
          {
            role: 'system',
            content: 'You are a world-class presentation strategist and business analyst who understands positioning, competitive intelligence, and compelling narratives. Output ONLY valid JSON, no other text.'
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
      
      console.log('✅ OpenAI API response received');
      
      const text = response.choices[0]?.message?.content || '';
      if (!text) {
        console.error('❌ Empty response from OpenAI');
        throw new Error('Empty response from OpenAI');
      }
      
      console.log(`   Response length: ${text.length} characters`);
      const storyboard = this.parseStoryboard(text);
      console.log(`✅ Storyboard parsed successfully: ${storyboard.nodes.length} nodes`);
      
      return storyboard;
    } catch (error: any) {
      console.error('❌ Error generating storyboard:', error);
      console.error('   Error type:', error.constructor.name);
      console.error('   Error message:', error.message);
      if (error.response) {
        console.error('   OpenAI API error:', error.response.status, error.response.data);
      }
      throw new Error(`Failed to generate storyboard: ${error.message}`);
    }
  }

  private buildPrompt(scrapedData: ScrapedData, mode: 'standard' | 'competitive' | 'briefing' | 'partnership' = 'standard'): string {
    const modeContexts = {
      competitive: `
🔍 COMPETITIVE INTELLIGENCE MODE:
You are analyzing a competitor. Your goal is to:
1. Understand their positioning and strategy
2. Identify their strengths and weaknesses
3. Create a narrative that could be used to:
   - Brief a sales team on this competitor
   - Prepare for a competitive deal
   - Analyze their market approach
   - Identify partnership opportunities

Extract and highlight:
- Their target market and ICP (Ideal Customer Profile)
- Core value proposition
- Key differentiators
- Pricing strategy (if visible)
- Competitive advantages
- Potential weaknesses or gaps
- Market positioning`,

      briefing: `
📋 INTERNAL BRIEFING MODE:
Create an executive briefing about this company for internal stakeholders.
Focus on:
- Quick understanding of what they do
- Market opportunity and positioning
- Key metrics and traction (if visible)
- Technology/approach
- Competitive landscape position`,

      partnership: `
🤝 PARTNERSHIP PITCH MODE:
Create a pitch for why partnering with this company makes sense.
Focus on:
- Their core strengths and capabilities
- Market position and reach
- Complementary offerings
- Mutual benefits
- Integration opportunities`,

      standard: `
🎯 STANDARD PITCH MODE:
Create a compelling pitch deck that tells their product story.
Focus on making the best case for their offering.`
    };

    const modeContext = modeContexts[mode];

    return `You are a world-class presentation strategist and business analyst. You understand positioning, narrative structure, and how to tell compelling stories about products.

${modeContext}

WEBSITE INTELLIGENCE:
Main Page Title: ${scrapedData.mainPage.title}
Main Page Content:
${scrapedData.mainPage.content.substring(0, 3000)}

Additional Pages Analyzed:
${scrapedData.adjacentPages.map((p: any) => `
- ${p.title}
  ${p.content.substring(0, 500)}
`).join('\n')}

METADATA:
- Description: ${scrapedData.mainPage.metadata?.description || 'N/A'}
- OG Title: ${scrapedData.mainPage.metadata?.ogTitle || 'N/A'}

YOUR MISSION:
Analyze this company/product and create a presentation storyboard that tells their story in the most compelling way possible.

THINK LIKE A STRATEGIST:
1. What problem are they REALLY solving? (Not just what they say)
2. Who is their target customer? (Be specific: "Enterprise DevOps teams", not "developers")
3. What makes them different? (Find the unique angle)
4. What's their narrative arc? (Underdog? Innovator? Disruptor?)
5. What evidence supports their claims? (Features, metrics, logos)

CREATE A STORYBOARD with 8-12 nodes:

NODE STRUCTURE:
1. **Title Node** (type: "title")
   - Create a BOLD tagline that captures their essence
   - Think: "Stripe: Payments infrastructure for the internet"
   - Not: "Welcome to our product"

2. **Problem Node** (type: "problem")
   - What pain point do they solve?
   - Quantify it if possible ($X lost, Y hours wasted)
   - Make it REAL and relatable
   - Example: "DevOps teams waste 40% of their time on infrastructure"

3. **Solution Node** (type: "solution")
   - How do they solve it? (High level)
   - What's the key insight or innovation?
   - Make it sound inevitable
   - Example: "We automate infrastructure so devs can ship faster"

4-7. **Feature Nodes** (type: "feature")
   - 3-5 most important capabilities
   - Each feature should have a benefit
   - Format: "Feature Name: What it does + why it matters"
   - Focus on outcomes, not just features
   - Examples:
     * "Auto-scaling: Handle traffic spikes without manual intervention"
     * "Real-time monitoring: Catch issues before users notice"

8. **Benefit/Traction Node** (type: "benefit")
   - What results do customers get?
   - Include metrics if found (X% faster, $Y saved)
   - Social proof (customer logos, testimonials)
   - Make success feel tangible

9. **CTA Node** (type: "cta")
   - Clear next step
   - Make it specific and actionable
   - Examples: "Start free trial", "Talk to sales", "See demo"

FOR EACH NODE, PROVIDE:
- **id**: "node-1", "node-2", etc.
- **type**: One of: title, problem, solution, feature, benefit, cta
- **title**: Punchy, 5-8 words max
- **content**: 2-3 bullet points OR 1 paragraph (max 50 words)
  * Each bullet should be a complete thought
  * Use specific details from the website
  * Include numbers/metrics when available
- **speakerNotes**: 100-150 words explaining:
  * What to emphasize on this slide
  * Key talking points
  * Why this matters
  * Transition to next slide
- **position**: Layout for canvas
  * Start at x: 0, y: 0
  * Space nodes 300px apart horizontally
  * Alternate y position slightly (0, 50, 0, 50) for visual variety

CRITICAL REQUIREMENTS:
✅ Make the narrative flow logically (problem → solution → proof → action)
✅ Use SPECIFIC details from the website (not generic statements)
✅ Include any metrics, numbers, or data points you find
✅ Identify the TARGET AUDIENCE explicitly
✅ Find the UNIQUE ANGLE that makes them different
✅ Make each slide independently valuable
✅ Keep text concise - this is a presentation, not an essay

OUTPUT ONLY VALID JSON (no markdown, no explanation):
{
  "title": "Company/Product Name",
  "tagline": "One sentence that captures their essence",
  "targetAudience": "Specific description of who this is for",
  "coreInnovation": "What makes them unique in one sentence",
  "nodes": [
    {
      "id": "node-1",
      "type": "title",
      "title": "Bold Tagline Here",
      "content": "Compelling one-liner",
      "speakerNotes": "Open strong. This is their vision...",
      "position": { "x": 0, "y": 0 }
    }
  ]
}

REMEMBER: You're not just summarizing a website. You're crafting a narrative that sells their vision.`;
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

