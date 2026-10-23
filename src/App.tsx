import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { About } from './pages/About';
import { Browse } from './pages/Browse';
import { Home } from './pages/Home';
import { Practice } from './pages/Practice';
import { WordLists } from './pages/WordLists';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lar" element={<Browse />} />
          <Route path="/ova/teckna" element={<Practice mode="produce" />} />
          <Route path="/ova/tolka" element={<Practice mode="recognize" />} />
          <Route path="/om" element={<About />} />
          <Route path="/ordlistor" element={<WordLists />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
