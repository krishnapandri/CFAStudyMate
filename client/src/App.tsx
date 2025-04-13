import { AuthProvider } from '@/hooks/use-auth';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
