import axios from 'axios'

// Use local backend server instead of calling Presenton API directly
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/presenton'

class PresentonService {
  /**
   * Generate a presentation from JSON data using Presenton API
   * @param {Object} jsonData - The presentation data in JSON format
   * @returns {Promise<string>} - The URL/path to the generated PDF
   */
  async generatePresentation(jsonData) {
    try {
      // Option 1: Use async generation for large presentations
      // const presentationId = await this.generatePresentationAsync(jsonData)
      // const pdfPath = await this.waitForCompletionAndExport(presentationId)
      
      // Option 2: Use synchronous generation (simpler, but may timeout for large presentations)
      const pdfPath = await this.generatePresentationSync(jsonData)
      
      return pdfPath
    } catch (error) {
      console.error('Error in generatePresentation:', error)
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to generate presentation'
      )
    }
  }

  /**
   * Generate presentation synchronously
   * This is simpler but may timeout for very large presentations
   */
  async generatePresentationSync(jsonData) {
    const response = await axios.post(
      `${BACKEND_API_URL}/generate`,
      {
        ...jsonData,
        export_as: 'pdf' // Ensure we export as PDF
      }
    )

    return response.data.path
  }

  /**
   * Generate presentation asynchronously
   * Better for large presentations
   */
  async generatePresentationAsync(jsonData) {
    const response = await axios.post(
      `${BACKEND_API_URL}/generate/async`,
      jsonData
    )

    return response.data.presentation_id
  }

  /**
   * Check the status of async presentation generation
   */
  async checkPresentationStatus(presentationId) {
    const response = await axios.get(
      `${BACKEND_API_URL}/status/${presentationId}`
    )

    return response.data
  }

  /**
   * Export presentation as PDF
   */
  async exportPresentationAsPDF(presentationId) {
    const response = await axios.post(
      `${BACKEND_API_URL}/export`,
      {
        id: presentationId,
        export_as: 'pdf'
      }
    )

    return response.data.path
  }

  /**
   * Wait for async presentation to complete and export as PDF
   */
  async waitForCompletionAndExport(presentationId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkPresentationStatus(presentationId)
      
      if (status.status === 'completed') {
        // Export as PDF
        return await this.exportPresentationAsPDF(presentationId)
      } else if (status.status === 'failed') {
        throw new Error('Presentation generation failed')
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    throw new Error('Presentation generation timed out')
  }

  /**
   * Alternative: Create presentation from JSON directly
   * This uses the /create/from-json endpoint
   */
  async createFromJSON(jsonData) {
    const response = await axios.post(
      `${BACKEND_API_URL}/create/from-json`,
      {
        language: jsonData.language || 'English',
        title: jsonData.title || null,
        template: jsonData.template || 'general',
        theme: jsonData.theme || null,
        slides: jsonData.slides || [],
        export_as: 'pdf',
        trigger_webhook: false
      }
    )

    return response.data.path
  }
}

export default new PresentonService()
