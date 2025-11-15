# Presenton PDF Viewer - Full Stack Application

A modern full-stack application with Node.js backend and React frontend that generates presentations using the Presenton API and displays them in a beautiful PDF viewer.

## Architecture

```
Frontend (React) ←→ Backend (Node.js/Express) ←→ Presenton API
    Port 3000              Port 5000              presenton.ai
```

**Why a backend?**

- 🔒 **Security**: API key stays server-side, never exposed to clients
- 🛡️ **Protection**: No risk of API key theft from browser
- 📊 **Control**: Can add rate limiting, logging, and monitoring
- 🔄 **Flexibility**: Easy to add custom business logic

## Features

- 🎨 **Modern UI Design** - Beautiful gradient background with smooth animations
- 📄 **Seamless PDF Viewing** - Smooth scrolling and navigation through presentation pages
- 🔍 **Zoom Controls** - Zoom in/out functionality for better viewing
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- ⚡ **Fast Generation** - Quick presentation generation from JSON data
- 🔒 **Secure API** - API key protected on backend server
- 🎯 **Page Navigation** - Quick jump to any page with thumbnail navigation

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 3. Start Both Servers

**Option A: Run both servers with one command (recommended)**

```bash
npm run dev:all
```

**Option B: Run servers separately**

Terminal 1 (Backend):

```bash
npm run dev:server
```

Terminal 2 (Frontend):

```bash
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Project Structure

```
hackathon-presenton/
├── server/                        # Backend (Node.js/Express)
│   ├── routes/
│   │   └── presenton.js          # Presenton API routes
│   ├── .env                      # Backend environment variables (API key)
│   ├── index.js                  # Express server entry point
│   └── package.json              # Backend dependencies
├── src/                          # Frontend (React)
│   ├── components/
│   │   ├── PDFViewer.jsx         # PDF viewer component
│   │   ├── PDFViewer.css
│   │   ├── LoadingSpinner.jsx
│   │   └── LoadingSpinner.css
│   ├── services/
│   │   └── PresentonService.js   # Frontend API service (calls backend)
│   ├── App.jsx                    # Main app component
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── sample.json                   # Sample presentation data
├── .env                          # Frontend environment variables
├── package.json                  # Frontend dependencies & scripts
└── vite.config.js               # Vite configuration
```

## API Endpoints

### Backend Routes (http://localhost:5000/api/presenton)

| Method | Endpoint                  | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| POST   | `/generate`               | Generate presentation synchronously  |
| POST   | `/generate/async`         | Generate presentation asynchronously |
| GET    | `/status/:presentationId` | Check async generation status        |
| POST   | `/export`                 | Export presentation as PDF           |
| POST   | `/create/from-json`       | Create from JSON directly            |

## Environment Variables

### Backend (`server/.env`)

```
PRESENTON_API_KEY=your-api-key-here
PORT=5000
```

### Frontend (`.env`)

```
VITE_BACKEND_URL=http://localhost:5000/api/presenton
```

│ ├── main.jsx # React entry point
│ └── index.css # Global styles
├── sample.json # Sample presentation data
├── package.json # Project dependencies
├── vite.config.js # Vite configuration
└── index.html # HTML entry point

````

## Using the Application

1. **Start the servers** using `npm run dev:all`
2. **Open** http://localhost:3000 in your browser
3. **Click "Generate Presentation"** to create from sample.json
4. **View the PDF** with navigation controls
5. **Zoom** in/out as needed
6. **Download** the PDF if desired

## Customizing Your Presentation

Edit `sample.json` to customize your presentation content. The JSON structure supports:

- `content`: Brief description of your presentation
- `slides_markdown`: Array of markdown-formatted slides
- `instructions`: Instructions for the AI on how to design slides
- `tone`: Presentation tone (professional, casual, etc.)
- `template`: Template style (modern, general, swift, standard)
- `theme`: Color theme (professional-blue, etc.)
- `n_slides`: Number of slides to generate
- `export_as`: Export format (pdf or pptx)

## Production Deployment

### Backend
1. Deploy to a service like Railway, Render, or Heroku
2. Set `PRESENTON_API_KEY` environment variable
3. Update `PORT` if needed
4. Note the deployed backend URL

### Frontend
1. Update `.env` with production backend URL:
   ```
   VITE_BACKEND_URL=https://your-backend-url.com/api/presenton
   ```
2. Build: `npm run build`
3. Deploy `dist/` folder to Vercel, Netlify, or similar

## Development Scripts

```bash
npm run dev              # Start frontend only (port 3000)
npm run dev:server       # Start backend only (port 5000)
npm run dev:all          # Start both frontend & backend
npm run build            # Build frontend for production
npm run server           # Start backend in production mode
```

## Building for Production

```bash
npm run build
````

The built files will be in the `dist/` directory.

## Troubleshooting

### Backend not starting

- Ensure you're in the correct directory
- Check if port 5000 is available
- Verify server/.env file exists with API key

### Frontend can't connect to backend

- Verify backend is running on port 5000
- Check `.env` has correct `VITE_BACKEND_URL`
- Check browser console for CORS errors

### API errors

- Verify API key in `server/.env` is correct
- Check backend terminal for error logs
- Ensure Presenton API is accessible

## Technologies Used

### Frontend

- React 18
- Vite
- react-pdf
- axios

### Backend

- Node.js
- Express
- axios
- cors
- dotenv

## Security Notes

- ✅ API key is stored server-side only
- ✅ Never commit `server/.env` to git
- ✅ CORS enabled for local development
- ⚠️ Add rate limiting for production
- ⚠️ Add authentication if needed

## License

MIT License - Feel free to use this for your hackathon project!

## Support

For Presenton API support, visit: https://docs.presenton.ai
