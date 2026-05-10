import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
//import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
//import { useAuthStore } from './store/authStore';
import Login from './pages/LoginPage';

/*function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" />;
  return children;
}*/

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/*<Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsDashboard /></ProtectedRoute>} />
          {/* остальные */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}


export default App
