import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/"
            element={
              <main className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-6 p-8">
                  <h1 className="text-4xl font-bold text-primary-700">
                    🛢️ Plataforma de Gestión de Combustibles
                  </h1>
                  <p className="text-lg text-gray-600 max-w-xl mx-auto">
                    Sistema de control, trazabilidad y regulación de
                    combustibles en estaciones de servicio colombianas.
                  </p>
                  <div className="flex gap-4 justify-center text-sm text-gray-500">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                      React + Vite
                    </span>
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                      TypeScript
                    </span>
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                      Tailwind CSS v4
                    </span>
                  </div>
                </div>
              </main>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
