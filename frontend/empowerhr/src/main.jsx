import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // This includes our Tailwind directives
import './App.css' // Specific app overrides
import App from './App.jsx'

// Remove problematic import
// import 'tailwindcss/tailwind.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
