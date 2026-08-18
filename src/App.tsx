import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TestSessionProvider } from './context/TestSessionContext';
import Home from './pages/Home';
import ModuleWarmup from './pages/ModuleWarmup';
import ModuleMath from './pages/ModuleMath';
import ModuleEnglish from './pages/ModuleEnglish';
import ModuleCognition from './pages/ModuleCognition';
import LevelProposal from './pages/LevelProposal';
import Dashboard from './pages/Dashboard';
import TestConfigurator from './components/TestConfigurator';
import Layout from './components/Layout';
import PracticeView from './components/PracticeView';
import AbTestPage from './pages/AbTestPage';

function App() {
  return (
    <TestSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="warmup" element={<ModuleWarmup />} />
            <Route path="cognition" element={<ModuleCognition />} />
            <Route path="level-proposal" element={<LevelProposal />} />
            <Route path="math" element={<ModuleMath />} />
            <Route path="english" element={<ModuleEnglish />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="configurator" element={<TestConfigurator />} />
            <Route path="practice" element={<PracticeView />} />
            <Route path="ab-test" element={<AbTestPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TestSessionProvider>
  );
}

export default App;
