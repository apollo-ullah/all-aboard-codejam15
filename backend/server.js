const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Gamma API configuration
const GAMMA_API_URL = 'https://public-api.gamma.app/v1.0/generations';
const GAMMA_API_KEY = process.env.GAMMA_API_KEY;

// Store active generations
const activeGenerations = new Map();

/**
 * POST /api/generate
 * Generate a new Gamma presentation
 */
app.post('/api/generate', async (req, res) => {
  try {
    if (!GAMMA_API_KEY) {
      return res.status(500).json({ 
        error: 'GAMMA_API_KEY not configured. Please set it in .env file' 
      });
    }

    const gammaPayload = req.body;

    console.log('Initiating Gamma generation...');
    
    // Create generation request
    const response = await axios.post(GAMMA_API_URL, gammaPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': GAMMA_API_KEY,
      },
    });

    const { generationId, status } = response.data;
    
    // Store the generation info
    activeGenerations.set(generationId, {
      status,
      createdAt: new Date().toISOString(),
      payload: gammaPayload
    });

    console.log(`Generation created: ${generationId}, status: ${status}`);

    res.json({
      generationId,
      status,
      message: 'Generation started successfully'
    });

  } catch (error) {
    console.error('Error creating generation:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to create generation',
      details: error.response?.data
    });
  }
});

/**
 * GET /api/generation/:id
 * Check generation status and retrieve PDF when complete
 */
app.get('/api/generation/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!GAMMA_API_KEY) {
      return res.status(500).json({ 
        error: 'GAMMA_API_KEY not configured' 
      });
    }

    console.log(`Checking status for generation: ${id}`);

    // Check generation status
    const response = await axios.get(`${GAMMA_API_URL}/${id}`, {
      headers: {
        'X-API-KEY': GAMMA_API_KEY,
        'accept': 'application/json'
      },
    });

    const data = response.data;
    
    // Update stored info
    if (activeGenerations.has(id)) {
      activeGenerations.set(id, {
        ...activeGenerations.get(id),
        status: data.status,
        lastChecked: new Date().toISOString()
      });
    }

    console.log(`Generation ${id} status: ${data.status}`);

    // If completed and PDF is available, download it
    const pdfUrl = data.exportUrl || data.pdfUrl;
    if (data.status === 'completed' && pdfUrl) {
      try {
        // Create pdfs directory if it doesn't exist
        const pdfsDir = path.join(__dirname, 'pdfs');
        await fs.mkdir(pdfsDir, { recursive: true });

        console.log(`Downloading PDF from: ${pdfUrl}`);

        // Download the PDF
        const pdfResponse = await axios.get(pdfUrl, {
          responseType: 'arraybuffer'
        });

        // Save PDF to disk
        const filename = `${id}.pdf`;
        const filepath = path.join(pdfsDir, filename);
        await fs.writeFile(filepath, pdfResponse.data);

        console.log(`PDF saved: ${filename}`);

        // Return the complete data with local PDF URL
        res.json({
          ...data,
          localPdfUrl: `/pdfs/${filename}`,
          filename
        });
      } catch (pdfError) {
        console.error('Error downloading PDF:', pdfError.message);
        // Still return the generation data even if PDF download fails
        res.json(data);
      }
    } else {
      res.json(data);
    }

  } catch (error) {
    console.error('Error checking generation status:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to check generation status',
      details: error.response?.data
    });
  }
});

/**
 * GET /api/generations
 * List all active generations
 */
app.get('/api/generations', (req, res) => {
  const generations = Array.from(activeGenerations.entries()).map(([id, info]) => ({
    generationId: id,
    ...info
  }));
  res.json(generations);
});

/**
 * DELETE /api/generation/:id
 * Remove a generation from tracking
 */
app.delete('/api/generation/:id', async (req, res) => {
  const { id } = req.params;
  
  // Delete PDF file if exists
  try {
    const filepath = path.join(__dirname, 'pdfs', `${id}.pdf`);
    await fs.unlink(filepath);
    console.log(`Deleted PDF: ${id}.pdf`);
  } catch (error) {
    // File might not exist, that's okay
  }

  activeGenerations.delete(id);
  res.json({ message: 'Generation removed' });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    apiKeyConfigured: !!GAMMA_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Gamma API Server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${!!GAMMA_API_KEY}`);
  if (!GAMMA_API_KEY) {
    console.warn('⚠️  Warning: GAMMA_API_KEY not set in environment variables');
  }
});
