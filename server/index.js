import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import presentonRoutes from './routes/presenton.js'

// Load environment variables
dotenv.config()

// Debug: Check if API key is loaded
console.log('🔑 API Key loaded:', process.env.PRESENTON_API_KEY ? '✅ Yes' : '❌ No')
console.log('📁 Current directory:', process.cwd())

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Routes
app.use('/api/presenton', presentonRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message 
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
