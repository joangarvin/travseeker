import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CompareProvider } from './context/CompareContext';
import CompareBar from './components/compare/CompareBar';
import PageLoader from './components/ui/PageLoader';
import AdminRoute from './components/auth/AdminRoute';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Auth = lazy(() => import('./pages/Auth'));
const Favoritos = lazy(() => import('./pages/Favoritos'));
const Colecciones = lazy(() => import('./pages/Colecciones'));
const ColeccionDetail = lazy(() => import('./pages/ColeccionDetail'));
const Comparador = lazy(() => import('./pages/Comparador'));
const Profile = lazy(() => import('./pages/Profile'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const RecoverPassword = lazy(() => import('./pages/RecoverPassword'));
const MapaDestinos = lazy(() => import('./pages/MapaDestinos'));
const DestinationDetail = lazy(() => import('./pages/DestinationDetail'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompareProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sobre-nosotros" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/favoritos" element={<Favoritos />} />
              <Route path="/colecciones" element={<Colecciones />} />
              <Route path="/colecciones/:id" element={<ColeccionDetail />} />
              <Route path="/comparar" element={<Comparador />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/verificar-email" element={<VerifyEmail />} />
              <Route path="/recuperar" element={<RecoverPassword />} />
              <Route path="/mapa" element={<MapaDestinos />} />
              <Route path="/destino/:id" element={<DestinationDetail />} />
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              </Routes>
            </Suspense>
            <CompareBar />
          </Router>
        </CompareProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
