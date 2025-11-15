import express from 'express'
import axios from 'axios'

const router = express.Router()

const PRESENTON_API_BASE_URL = 'https://api.presenton.ai/api/v1/ppt'

// Get API key from environment - will be checked when routes are called
const getApiKey = () => {
  const apiKey = process.env.PRESENTON_API_KEY
  if (!apiKey) {
    throw new Error('PRESENTON_API_KEY not configured in environment variables')
  }
  return apiKey
}

// Generate presentation synchronously
router.post('/generate', async (req, res) => {
  try {
    const apiKey = getApiKey()
    const jsonData = req.body

    console.log('🔑 Using API Key:', apiKey.substring(0, 20) + '...')
    console.log('📤 Sending request to:', `${PRESENTON_API_BASE_URL}/presentation/generate`)

    const response = await axios.post(
      `${PRESENTON_API_BASE_URL}/presentation/generate`,
      {
        ...jsonData,
        export_as: 'pdf'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('✅ Presentation generated successfully')
    res.json(response.data)
  } catch (error) {
    console.error('Error generating presentation:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate presentation',
      message: error.response?.data?.message || error.message
    })
  }
})

// Generate presentation asynchronously
router.post('/generate/async', async (req, res) => {
  try {
    const jsonData = req.body
    const API_KEY = getApiKey()

    const response = await axios.post(
      `${PRESENTON_API_BASE_URL}/presentation/generate/async`,
      jsonData,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error('Error generating presentation async:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate presentation',
      message: error.response?.data?.message || error.message
    })
  }
})

// Check presentation status
router.get('/status/:presentationId', async (req, res) => {
  try {
    const { presentationId } = req.params
    const API_KEY = getApiKey()

    const response = await axios.get(
      `${PRESENTON_API_BASE_URL}/presentation/status/${presentationId}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error('Error checking status:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({
      error: 'Failed to check presentation status',
      message: error.response?.data?.message || error.message
    })
  }
})

// Export presentation as PDF
router.post('/export', async (req, res) => {
  try {
    const { id } = req.body
    const API_KEY = getApiKey()

    const response = await axios.post(
      `${PRESENTON_API_BASE_URL}/presentation/export`,
      {
        id,
        export_as: 'pdf'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error('Error exporting presentation:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({
      error: 'Failed to export presentation',
      message: error.response?.data?.message || error.message
    })
  }
})

// Create presentation from JSON
router.post('/create/from-json', async (req, res) => {
  try {
    const jsonData = req.body
    const API_KEY = getApiKey()

    const response = await axios.post(
      `${PRESENTON_API_BASE_URL}/presentation/create/from-json`,
      {
        language: jsonData.language || 'English',
        title: jsonData.title || null,
        template: jsonData.template || 'general',
        theme: jsonData.theme || null,
        slides: jsonData.slides || [],
        export_as: 'pdf',
        trigger_webhook: false
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error('Error creating from JSON:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({
      error: 'Failed to create presentation from JSON',
      message: error.response?.data?.message || error.message
    })
  }
})

export default router
