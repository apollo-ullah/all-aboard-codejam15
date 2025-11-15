import axios from 'axios';
import { Storyboard } from '../types/index';

export class SlideGenerator {
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async generate(storyboard: Storyboard, style: 'YC' | 'Finance'): Promise<{
    presentationUrl: string;
    embedUrl?: string;
    downloadUrl?: string;
    pdfUrl?: string;
    slideCount: number;
  }> {
    // Format storyboard for GAMMA API with narrative-rich instructions
    const gammaInput = this.formatForGamma(storyboard, style);
    
    try {
      console.log('📊 Creating Gamma presentation generation...');
      console.log(`   Input length: ${gammaInput.length} characters`);
      console.log(`   Style: ${style}`);
      console.log(`   📝 Prompt Preview (first 500 chars):\n${gammaInput.substring(0, 500)}...`);
      
      // Use the correct Gamma API endpoint
      const endpoint = 'https://public-api.gamma.app/v1.0/generations';
      console.log(`   Using endpoint: ${endpoint}`);
      
      const response = await axios.post(
        endpoint,
        {
          inputText: gammaInput,
          textMode: 'generate'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          },
          validateStatus: (status) => status < 500,
        }
      );
      
      // Check for error responses
      if (response.status >= 400) {
        const errorData = response.data;
        console.error('❌ Gamma API error response:', {
          status: response.status,
          data: errorData
        });
        
        let errorMessage = `Gamma API error (${response.status})`;
        if (errorData?.message) {
          errorMessage += `: ${errorData.message}`;
        } else if (errorData?.error) {
          errorMessage += `: ${errorData.error}`;
        } else if (typeof errorData === 'string') {
          errorMessage += `: ${errorData}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const generationId = response.data.id || response.data.generationId;
      if (!generationId) {
        console.error('❌ No generation ID in response:', response.data);
        throw new Error('Gamma API did not return a generation ID');
      }
      
      console.log(`✅ Gamma generation created: ${generationId}`);
      
      // Poll for completion
      const result = await this.pollStatus(generationId);
      
      // Extract file URLs from polling response (they should be included)
      console.log(`🔍 Looking for file URLs in polling response...`);
      console.log(`📄 Full polling response:`, JSON.stringify(result, null, 2));
      
      let pdfUrl = result.pdfUrl || result.pdf || result.files?.pdf || result.exportUrls?.pdf;
      
      // Prioritize embed URL from API response (this is what we want!)
      let embedUrl = result.embedUrl || result.embed || result.embedUrl || result.iframeUrl || 
                     result.files?.embed || result.presentation?.embedUrl || result.embedLink;
      
      // Gamma API returns different URL formats - try to get the presentation URL
      let presentationUrl = result.gammaUrl || result.presentationUrl || result.url || result.viewUrl || 
                           result.exportUrl || result.presentation?.url || result.link;
      
      // If we still don't have a presentation URL, try to extract it from the result
      if (!presentationUrl && result.data?.url) {
        presentationUrl = result.data.url;
      }
      
      if (!presentationUrl) {
        console.warn('⚠️ No presentation URL found in Gamma response:', JSON.stringify(result, null, 2));
        throw new Error('Gamma API did not return a presentation URL. Response: ' + JSON.stringify(result));
      }
      
      console.log(`✅ Gamma presentation ready: ${presentationUrl}`);
      if (embedUrl) {
        console.log(`✅ Embed URL from API: ${embedUrl}`);
      }
      
      // Construct embed URL from presentation URL if not provided by API
      // Gamma embed URLs typically follow: https://gamma.app/embed/[id]
      let finalEmbedUrl = embedUrl;
      
      // If no embed URL from API, construct it from presentation URL
      if (!finalEmbedUrl && presentationUrl) {
        try {
          // Extract presentation ID from URL (e.g., https://gamma.app/docs/[id] -> [id])
          // Try multiple URL patterns
          let presentationId: string | null = null;
          
          // Pattern 1: https://gamma.app/docs/[id]
          let urlMatch = presentationUrl.match(/gamma\.app\/docs\/([a-zA-Z0-9_-]+)/);
          if (urlMatch && urlMatch[1]) {
            presentationId = urlMatch[1];
          }
          
          // Pattern 2: https://gamma.app/presentation/[id]
          if (!presentationId) {
            urlMatch = presentationUrl.match(/gamma\.app\/presentation\/([a-zA-Z0-9_-]+)/);
            if (urlMatch && urlMatch[1]) {
              presentationId = urlMatch[1];
            }
          }
          
          // Pattern 3: Extract from any gamma.app URL
          if (!presentationId) {
            urlMatch = presentationUrl.match(/gamma\.app\/[^\/]+\/([a-zA-Z0-9_-]+)/);
            if (urlMatch && urlMatch[1]) {
              presentationId = urlMatch[1];
            }
          }
          
          if (presentationId) {
            // Construct embed URL - this is the format that works!
            finalEmbedUrl = `https://gamma.app/embed/${presentationId}`;
            console.log(`🔗 Constructed embed URL from presentation ID: ${finalEmbedUrl}`);
          } else {
            console.warn('⚠️ Could not extract presentation ID from URL:', presentationUrl);
            // Fallback: use presentation URL directly
            finalEmbedUrl = presentationUrl;
          }
        } catch (error) {
          console.warn('⚠️ Could not construct embed URL, using presentation URL:', error);
          finalEmbedUrl = presentationUrl;
        }
      }
      
      // Use the pdfUrl from file URLs API first, then fallback to response  
      const downloadUrl = pdfUrl || result.downloadUrl || result.exportUrl || result.presentation?.downloadUrl || result.gammaUrl;
      
      return {
        presentationUrl,
        embedUrl: finalEmbedUrl,
        downloadUrl,
        pdfUrl,
        slideCount: storyboard.nodes.length
      };
    } catch (error: any) {
      console.error('❌ Error generating slides:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // Provide more helpful error messages
      if (error.response?.status === 401) {
        throw new Error('Invalid Gamma API key. Please check your GAMMA_API_KEY in .env');
      } else if (error.response?.status === 403) {
        throw new Error('No available Gamma API credits. Please check your subscription.');
      } else if (error.response?.status === 429) {
        throw new Error('Gamma API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request to Gamma API: ${error.response?.data?.message || error.message}`);
      } else if (error.message?.includes('All Gamma API endpoints failed')) {
        throw new Error(`Gamma API endpoints not found. The API structure may have changed. Please check Gamma API documentation or use a fallback presentation viewer. Error: ${error.message}`);
      }
      
      throw new Error(`Failed to generate slides: ${error.message}`);
    }
  }

  private formatForGamma(storyboard: Storyboard, style: 'YC' | 'Finance'): string {
    // Build narrative-rich prompt
    const narrativeContext = this.getNarrativeContext(style);
    const styleGuidelines = this.getStyleGuidelines(style);
    const slideInstructions = this.buildSlideInstructions(storyboard, style);
    
    return `${narrativeContext}

${styleGuidelines}

${slideInstructions}`;
  }

  private getNarrativeContext(style: 'YC' | 'Finance'): string {
    if (style === 'YC') {
      return `🎯 NARRATIVE ARC: YC-Style Pitch Deck

This is a high-stakes startup pitch following the classic YC narrative structure. The story arc is:

1. **HOOK (Title Slide)**: Grab attention immediately with a bold vision statement. Make investors lean forward.

2. **TENSION (Problem)**: Create urgency. Show the pain point is massive, costly, and unsolved. Use dark/serious visuals to build tension.

3. **REVELATION (Solution)**: This is THE moment. Show the breakthrough. Use bright, optimistic visuals. Create a "before/after" contrast with the problem slide.

4. **PROOF (Features)**: Build credibility with concrete capabilities. Show this isn't vaporware—it's real and working.

5. **VALIDATION (Benefits/Traction)**: Provide social proof. Show metrics, logos, testimonials. Make it feel inevitable.

6. **THE ASK (CTA)**: Close strong. Clear, direct call-to-action. Create FOMO.

EMOTIONAL JOURNEY: Curiosity → Tension → Relief → Excitement → Conviction → Action

VISUAL STRATEGY: Start minimal and bold, build to data-rich proof, end with clear action.`;
    } else {
      return `📊 NARRATIVE ARC: Finance-Style Executive Presentation

This is a professional financial presentation for executive decision-makers. The story arc is:

1. **EXECUTIVE SUMMARY (Title)**: Establish credibility immediately with professional polish.

2. **MARKET CONTEXT (Problem)**: Frame the challenge in business terms. Use data and market analysis to show opportunity cost.

3. **STRATEGIC SOLUTION (Solution)**: Present the solution as a strategic initiative with clear ROI potential.

4. **CAPABILITY ANALYSIS (Features)**: Demonstrate technical depth and operational feasibility. Use detailed breakdowns.

5. **BUSINESS CASE (Benefits)**: Show financial impact. Use charts, projections, and benchmarks.

6. **RECOMMENDED ACTION (CTA)**: Clear next steps with timeline and resource requirements.

EMOTIONAL JOURNEY: Trust → Concern → Confidence → Assurance → Conviction → Decision

VISUAL STRATEGY: Professional throughout. Use charts, graphs, and data visualization. Maintain corporate aesthetic.`;
    }
  }

  private getStyleGuidelines(style: 'YC' | 'Finance'): string {
    if (style === 'YC') {
      return `🎨 YC STYLE GUIDELINES:

**CRITICAL: BACKGROUND REQUIREMENTS**
- NEVER use plain white backgrounds - they look cheap and unprofessional
- ALWAYS use colored backgrounds: gradients, solid colors, or high-quality images
- Preferred backgrounds: Dark navy/black, vibrant gradients (blue-to-purple, orange-to-pink), subtle patterns
- Use bold, saturated colors that match the slide's emotional tone
- Problem slides: Dark backgrounds (navy, charcoal, deep red)
- Solution slides: Bright backgrounds (cyan, bright blue, vibrant green)
- Feature/Benefit slides: Gradient backgrounds or colored sections
- Title slide: Hero image or bold gradient background
- CTA slide: High-contrast colored background (not white)
- If using images as backgrounds, ensure they're high-quality and don't compete with text

**Visual Rules:**
- BOLD typography: Headlines should dominate the slide
- Minimal text: 5-7 words max per line, 15 words max per slide
- High contrast: White/light text on dark backgrounds, or dark text on light colored backgrounds (NOT white)
- Simple icons/illustrations: No stock photos unless they tell a story
- Data visualization: Big numbers, simple charts, clear trends
- White space: Lots of it, but within colored/gradient backgrounds, not plain white

**Slide-Specific Emphasis:**
- Title Slide: Make it HUGE. One sentence that changes everything.
- Problem Slide: Use RED/DARK colors. Make it feel urgent.
- Solution Slide: Use BRIGHT colors (green/blue). Make it feel like relief.
- Traction Slide: BIG NUMBERS. Growth arrows. Hockey stick charts.
- CTA Slide: BOLD and CLEAR. No confusion about next steps.

**Animations:**
- Title: Fade in with impact
- Problem: Build tension with sequential reveals
- Solution: Dramatic reveal (curtain lift, fade to bright)
- Features: Sequential builds (one at a time)
- Traction: Animated charts showing growth
- CTA: Pulse/emphasis animation

**Typography:**
- Headlines: 60-80pt, bold, sans-serif
- Body: 24-32pt, regular weight
- Accent text: All caps for emphasis`;
    } else {
      return `🎨 FINANCE STYLE GUIDELINES:

**CRITICAL: BACKGROUND REQUIREMENTS**
- NEVER use plain white backgrounds - they look unprofessional and cheap
- ALWAYS use sophisticated colored backgrounds: subtle gradients, corporate blues/grays, or professional patterns
- Preferred backgrounds: Deep navy gradients, charcoal with blue accents, subtle gray-to-blue gradients
- Use professional color palettes: Navy, slate gray, deep blue, with gold/amber accents
- Title slide: Dark navy or charcoal background with subtle texture
- Problem/Market slides: Professional blue-gray gradient or dark slate
- Solution/Strategy slides: Clean gradient (navy to lighter blue) or professional blue background
- Feature/Capability slides: Subtle gradient or professional colored sections
- Benefits/ROI slides: Professional background with data visualization colors
- CTA slide: Strong colored background (navy or corporate blue, not white)
- If using images, ensure they're professional corporate imagery with proper overlay for text readability

**Visual Rules:**
- Professional typography: Calibri, Arial, or corporate sans-serif
- Structured layouts: Headers, body, footer with consistent spacing
- Corporate colors: Blues, grays, with accent colors for data
- Charts and graphs: Professional financial charts (bar, line, waterfall)
- Data tables: Clean, organized, with clear labels
- Subtle animations: Professional transitions only

**Slide-Specific Emphasis:**
- Title Slide: Professional header with company context
- Problem Slide: Market data, competitive analysis, opportunity sizing
- Solution Slide: Strategic positioning, competitive advantages
- Features Slide: Capability matrix, technical specifications
- Benefits Slide: Financial projections, ROI analysis, benchmarks
- CTA Slide: Implementation timeline, resource requirements

**Animations:**
- All slides: Subtle fades, no flashy effects
- Charts: Animate data points sequentially
- Tables: Fade in by row
- Callouts: Subtle highlights

**Typography:**
- Headlines: 36-44pt, bold
- Body: 18-24pt, regular
- Data labels: 14-18pt, clear hierarchy`;
    }
  }

  private buildSlideInstructions(storyboard: Storyboard, style: 'YC' | 'Finance'): string {
    const slides = storyboard.nodes.map((node, index) => {
      return this.formatSlide(node, index, storyboard.nodes, style);
    }).join('\n\n---\n\n');

    return `📝 SLIDE-BY-SLIDE INSTRUCTIONS:

PRESENTATION TITLE: ${storyboard.title}
TAGLINE: ${storyboard.tagline}

${slides}`;
  }

  private formatSlide(
    node: Storyboard['nodes'][0], 
    index: number, 
    allNodes: Storyboard['nodes'], 
    style: 'YC' | 'Finance'
  ): string {
    const slideNumber = index + 1;
    const totalSlides = allNodes.length;
    
    // Determine narrative role
    const narrativeRole = this.getNarrativeRole(node.type, index, totalSlides);
    
    // Get relationship with adjacent slides
    const relationships = this.getSlideRelationships(node, index, allNodes);
    
    // Get visual instructions
    const visualInstructions = this.getVisualInstructions(node, style, narrativeRole);
    
    return `# Slide ${slideNumber}: ${node.title}

**Narrative Role:** ${narrativeRole}

**Slide Type:** ${node.type.toUpperCase()}

**Content:**
${node.content}

**Speaker Notes Context:**
${node.speakerNotes}

**Visual Instructions:**
${visualInstructions}

${relationships}

**Pacing:** ${this.getPacingGuidance(node.type, style)}`;
  }

  private getNarrativeRole(type: string, index: number, total: number): string {
    const roles: Record<string, string> = {
      title: '🎬 THE HOOK - First impression. Make it memorable. Set the tone for everything that follows.',
      problem: '⚡ BUILD TENSION - This is where you create urgency. Make the audience feel the pain.',
      solution: '💡 THE REVELATION - This is the climax. The "aha!" moment. Maximum impact.',
      feature: '🔧 BUILD CREDIBILITY - Prove you can deliver. Show concrete capabilities.',
      benefit: '📈 VALIDATE THE PROMISE - Show results. Prove it works. Create confidence.',
      cta: '🎯 THE ASK - Close strong. Make the next step crystal clear.',
    };
    
    return roles[type] || '📄 SUPPORTING CONTENT';
  }

  private getSlideRelationships(node: Storyboard['nodes'][0], index: number, allNodes: Storyboard['nodes']): string {
    const prev = index > 0 ? allNodes[index - 1] : null;
    const next = index < allNodes.length - 1 ? allNodes[index + 1] : null;
    
    let relationships = '**Slide Relationships:**\n';
    
    if (prev) {
      relationships += `- Previous: "${prev.title}" (${prev.type}) - `;
      if (node.type === 'solution' && prev.type === 'problem') {
        relationships += 'Use CONTRAST. Go from dark/serious to bright/optimistic. Show transformation.\n';
      } else if (node.type === 'feature' && prev.type === 'solution') {
        relationships += 'Maintain continuity. Build on the solution with concrete details.\n';
      } else {
        relationships += 'Continue the narrative flow.\n';
      }
    }
    
    if (next) {
      relationships += `- Next: "${next.title}" (${next.type}) - `;
      if (node.type === 'problem' && next.type === 'solution') {
        relationships += 'This slide creates tension that the next slide will resolve. Build anticipation.\n';
      } else if (node.type === 'feature' && next.type === 'benefit') {
        relationships += 'Transition from "how it works" to "what you get". Shift from technical to outcomes.\n';
      } else {
        relationships += 'Set up the next beat in the story.\n';
      }
    }
    
    return relationships;
  }

  private getVisualInstructions(node: Storyboard['nodes'][0], style: 'YC' | 'Finance', narrativeRole: string): string {
    const typeInstructions: Record<string, any> = {
      title: {
        YC: `- HUGE, BOLD headline (80pt+)
- Single sentence or phrase
- Minimal or no body text
- BACKGROUND: Bold gradient (blue-to-purple, orange-to-pink) OR high-quality hero image with overlay
- NEVER plain white - use vibrant colored background
- White/light text on dark/gradient background for contrast
- Company logo small in corner
- Make it feel like a movie poster with cinematic background`,
        Finance: `- Professional header with company logo
- Clear, descriptive title
- Subtitle with context
- BACKGROUND: Deep navy gradient OR charcoal with subtle texture
- NEVER plain white - use professional dark/colored background
- White/light text on dark professional background
- Corporate color scheme (navy, gray, gold accents)
- Clean, structured layout
- Include date/confidentiality notice in footer`
      },
      problem: {
        YC: `- BACKGROUND: Dark red gradient, charcoal, or deep navy (NOT white)
- Use RED, ORANGE, or DARK colored backgrounds
- White/light text on dark background for high contrast
- Show the pain with a statistic or quote
- Use a metaphor or powerful image (with dark overlay if needed)
- Keep text minimal but impactful
- "Without our solution, [painful scenario]"
- Make it feel urgent and real with dramatic dark background`,
        Finance: `- BACKGROUND: Professional dark blue-gray gradient or slate background (NOT white)
- Market data chart showing the gap/opportunity
- Competitive landscape analysis
- Cost of inaction ($ figures)
- Use red indicators for problems/risks
- Light text on dark professional background
- Professional data visualization
- Include sources for credibility`
      },
      solution: {
        YC: `- THIS IS THE MOMENT - maximum visual impact
- BACKGROUND: Bright gradient (cyan-to-blue, green-to-teal) OR vibrant solid color (NOT white)
- Use BRIGHT colors (blue, green, cyan) as background
- White or dark text depending on background brightness
- Show the product/platform
- Before/after comparison with problem slide (dark to bright transition)
- "We solve this by [simple explanation]"
- Use reveal animation
- Make it feel like a breakthrough with vibrant colored background`,
        Finance: `- BACKGROUND: Professional blue gradient (navy to lighter blue) or corporate blue (NOT white)
- Strategic positioning chart
- Solution framework diagram
- Competitive advantages matrix
- Light text on dark blue background for readability
- Professional color scheme (blues, grays)
- Clear value proposition statement
- ROI potential highlighted`
      },
      feature: {
        YC: `- BACKGROUND: Gradient (purple-to-blue, or colored sections) OR solid vibrant color (NOT white)
- 3-4 key features MAX
- Use icons or simple illustrations
- One feature per line with benefit
- "Feature Name: What it does in 5 words"
- Show product screenshots if relevant (with colored background, not white)
- Keep it scannable
- Ensure text contrasts well with colored background`,
        Finance: `- BACKGROUND: Subtle gray-to-blue gradient or professional slate background (NOT white)
- Detailed capability breakdown
- Technical architecture diagram
- Feature comparison table
- Implementation timeline
- Integration points highlighted
- Use professional diagrams
- Light text on dark professional background`
      },
      benefit: {
        YC: `- BACKGROUND: Bright gradient (green-to-blue, or success colors) OR vibrant colored background (NOT white)
- BIG NUMBERS - make them huge
- Show growth trajectory (hockey stick!)
- Customer logos (social proof)
- "X% growth in Y months"
- Use charts that trend UP and to the RIGHT
- Make success feel inevitable with optimistic colored background
- Ensure charts/numbers stand out on colored background`,
        Finance: `- BACKGROUND: Professional dark background with data visualization colors (navy or slate, NOT white)
- Financial projections chart
- ROI analysis with assumptions
- Benchmark comparisons
- Risk mitigation strategies
- Quantified business impact ($)
- Professional financial charts
- Light text and chart colors on dark professional background`
      },
      cta: {
        YC: `- BACKGROUND: High-contrast colored background (bold blue, vibrant purple, or dark with bright accents) - NEVER white
- ONE clear ask
- LARGE, BOLD text (white or light on dark background)
- Specific next step
- Contact info prominent
- "Let's build the future together"
- Use action-oriented language
- Make it feel like an opportunity with compelling colored background`,
        Finance: `- BACKGROUND: Strong professional background (deep navy, corporate blue, or dark slate) - NEVER white
- Recommended action items
- Implementation timeline
- Resource requirements
- Next steps with owners
- Contact information
- Follow-up meeting schedule
- Professional and actionable
- Light text on dark professional background for maximum impact`
      }
    };
    
    return typeInstructions[node.type]?.[style] || 'Follow standard slide layout';
  }

  private getPacingGuidance(type: string, style: 'YC' | 'Finance'): string {
    const pacing: Record<string, any> = {
      title: {
        YC: '⚡ FAST - Hit them immediately. 3 seconds to make an impression.',
        Finance: '🎯 CONFIDENT - Establish authority. Take your time to build trust.'
      },
      problem: {
        YC: '⏰ BUILD - Spend time here. Make them feel the pain. 15-20 seconds.',
        Finance: '📊 ANALYTICAL - Present data methodically. 20-30 seconds.'
      },
      solution: {
        YC: '💥 IMPACT - This is the climax. Make it dramatic. 20-30 seconds.',
        Finance: '🔍 THOROUGH - Explain the strategic approach. 30-45 seconds.'
      },
      feature: {
        YC: '🚀 MOMENTUM - Keep it moving. Show capability without bogging down. 10-15 seconds.',
        Finance: '📋 DETAILED - Walk through systematically. 20-30 seconds per feature.'
      },
      benefit: {
        YC: '📈 ACCELERATE - Show the traction. Build excitement. 15-20 seconds.',
        Finance: '💼 SUBSTANTIATE - Prove the business case. 30-45 seconds.'
      },
      cta: {
        YC: '🎯 DIRECT - Clear and simple. End strong. 10 seconds.',
        Finance: '✅ ACTIONABLE - Clear next steps. 15-20 seconds.'
      }
    };
    
    return pacing[type]?.[style] || 'Standard pacing';
  }

  private async pollStatus(generationId: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes (60 * 5 seconds)
    const pollInterval = 5000; // 5 seconds
    
    console.log(`🔄 Polling Gamma generation status: ${generationId}`);
    
    // Use the correct polling endpoint
    const pollEndpoint = `https://public-api.gamma.app/v1.0/generations/${generationId}`;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          pollEndpoint,
          {
            headers: { 
              'Authorization': `Bearer ${this.apiKey}`,
              'X-API-KEY': this.apiKey
            },
            validateStatus: (status) => status < 500,
          }
        );
        
        if (response.status >= 400) {
          if (response.status === 404) {
            throw new Error('Generation not found. The generation may have expired.');
          }
          throw new Error(`Status check failed: ${response.status} - ${JSON.stringify(response.data)}`);
        }
        
        const status = response.data.status || response.data.state;
        const progress = response.data.progress;
        
        // Log progress every 5 attempts
        if (i % 5 === 0 || status === 'completed' || status === 'failed') {
          console.log(`   Polling (${i + 1}/${maxAttempts}): Status = "${status}"${progress ? `, Progress = ${progress}%` : ''}`);
        }
        
        if (status === 'completed' || status === 'done') {
          console.log(`✅ Generation completed!`);
          console.log(`📄 Full response data:`, JSON.stringify(response.data, null, 2));
          return response.data;
        }
        
        if (status === 'failed' || status === 'error') {
          const errorMsg = response.data.error || response.data.message || 'Unknown error';
          throw new Error(`Generation failed: ${errorMsg}`);
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        // If it's a 404, fail immediately
        if (error.response?.status === 404 || error.message?.includes('not found')) {
          throw new Error('Generation not found. The generation may have expired or been deleted.');
        }
        
        // If we've exhausted all attempts, throw the error
        if (i >= maxAttempts - 1) {
          throw new Error(`Polling timeout: ${error.message}`);
        }
        
        // Log error but continue polling
        if (i % 10 === 0) {
          console.warn(`   ⚠️ Polling error (attempt ${i + 1}): ${error.message}. Continuing...`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error('Generation timeout: exceeded maximum polling attempts');
  }
}

