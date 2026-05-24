import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ToastViewport } from '@/components/ui/Toast';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { queryClient } from '@/lib/queryClient';
import { AppRoutes } from '@/routes';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex-1">
            <AppRoutes />
          </div>
          <Footer />
        </div>
        <CartDrawer />
        <ToastViewport />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
