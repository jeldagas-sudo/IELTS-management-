import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AddSession from './pages/AddSession';
import Sessions from './pages/Sessions';
import Analysis from './pages/Analysis';
import Patterns from './pages/Patterns';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddSession />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/patterns" element={<Patterns />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
