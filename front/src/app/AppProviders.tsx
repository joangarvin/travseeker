import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, CompareProvider, ThemeProvider } from '../contexts';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompareProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </CompareProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
