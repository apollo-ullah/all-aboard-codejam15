# Gamma AI Presentation Generator

A modern full-stack application for generating AI-powered presentations using the Gamma API. Built with Node.js, Express, React, and a sleek, modern UI.

![Gamma Presentation Generator](https://img.shields.io/badge/Status-Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-v16+-green)
![React](https://img.shields.io/badge/React-v18-blue)

## Features

✨ **AI-Powered Generation** - Create stunning presentations using Gamma's AI
🎨 **Modern UI** - Sleek, glassmorphic design with smooth animations
📄 **PDF Export** - Automatically export presentations as PDF
🔄 **Real-time Status** - Live updates on generation progress
👀 **Interactive Viewer** - Browse presentations with zoom and navigation controls
📱 **Responsive Design** - Works perfectly on desktop and mobile

## Project Structure

```
hackathons/
├── backend/                 # Node.js Express server
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── .env.example        # Environment variables template
│   └── pdfs/              # Generated PDFs (auto-created)
├── frontend/               # React application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── GeneratorForm.js      # Generation form component
│   │   │   ├── GeneratorForm.css
│   │   │   ├── PresentationViewer.js # PDF viewer component
│   │   │   ├── PresentationViewer.css
│   │   │   ├── StatusPanel.js        # Status display component
│   │   │   └── StatusPanel.css
│   │   ├── App.js          # Main app component
│   │   ├── App.css
│   │   ├── index.js        # React entry point
│   │   └── index.css       # Global styles
│   └── package.json        # Frontend dependencies
└── sample.json            # Sample Gamma API payload

```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Gamma API key (get one at [https://gamma.app](https://gamma.app))

## Installation

### 1. Clone the repository

```bash
cd hackathons
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file from the example:

```bash
copy .env.example .env
```

Edit `.env` and add your Gamma API key:

```env
GAMMA_API_KEY=sk-gamma-your-actual-api-key-here
PORT=3001
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
```

## Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### Start the Frontend

In a new terminal:

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

## Usage

1. **Enter Content**: Fill in the presentation content in the text area
2. **Configure Options**: Customize text mode, format, theme, and other options
3. **Generate**: Click "Generate Presentation" button
4. **Wait**: The system will poll the Gamma API for status updates
5. **View**: Once complete, the PDF will display in an interactive viewer
6. **Download**: Download the PDF or view it in Gamma

## API Endpoints

### Backend API

- `POST /api/generate` - Create a new presentation
- `GET /api/generation/:id` - Check generation status and retrieve PDF
- `GET /api/generations` - List all active generations
- `DELETE /api/generation/:id` - Remove a generation
- `GET /api/health` - Health check endpoint

## Configuration Options

### Text Options

- **Text Mode**: Generate, Condense, or Preserve
- **Amount**: Brief, Medium, Detailed, or Extensive
- **Tone**: Define the voice (e.g., professional, casual)
- **Audience**: Target audience description
- **Language**: Output language

### Image Options

- **Source**: AI Generated, Unsplash, Pictographic, or No Images
- **Model**: Imagen 4 Pro, Flux 1 Pro, DALL-E 3 (for AI-generated)
- **Style**: Visual style description

### Layout Options

- **Format**: Presentation, Document, Social Media, or Webpage
- **Dimensions**: Fluid, 16:9, or 4:3
- **Theme**: Bold, Oasis, Minimal, Modern
- **Number of Cards**: 1-60 slides

## Technologies Used

### Backend

- **Express.js** - Web framework
- **Axios** - HTTP client for Gamma API
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend

- **React** - UI framework
- **react-pdf** - PDF rendering
- **Axios** - API communication
- **CSS3** - Modern styling with animations

## Features in Detail

### Modern UI Design

- Glassmorphic design elements
- Smooth animations and transitions
- Gradient accents
- Responsive layout
- Dark theme optimized

### PDF Viewer

- Page navigation
- Zoom controls (50%-200%)
- Thumbnail strip
- Smooth scrolling
- Keyboard shortcuts

### Status Tracking

- Real-time polling
- Visual progress indicators
- Error handling
- Generation ID tracking

## Troubleshooting

### "GAMMA_API_KEY not configured"

Make sure you've created a `.env` file in the backend directory with your API key.

### PDF not loading

Check that the backend server is running and can access the Gamma API. Check the backend console for errors.

### Port already in use

Change the PORT in backend `.env` file or stop the process using that port.

## API Reference

For detailed information about Gamma API parameters, visit:
https://developers.gamma.app/docs/generate-api-parameters-explained

## License

MIT

## Support

For issues or questions:

1. Check the Gamma API documentation
2. Review backend console logs
3. Check browser console for frontend errors

---

**Built with ❤️ using Gamma AI, React, and Node.js**
