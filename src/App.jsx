import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AddSession from './pages/AddSession';
import AddReadingTest from './pages/AddReadingTest';
import Sessions from './pages/Sessions';
import Analysis from './pages/Analysis';
import Patterns from './pages/Patterns';
import DataManagement from './pages/DataManagement';

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-bg pb-20 md:pb-0">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddSession />} />
            <Route path="/add-reading-test" element={<AddReadingTest />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/patterns" element={<Patterns />} />
            <Route path="/data" element={<DataManagement />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
