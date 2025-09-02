import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css'
import './assets/leaflet-icon-fix.css'
// Initialize Leaflet icon fix
import './lib/leaflet-icon-fix'

createRoot(document.getElementById("root")!).render(<App />);
