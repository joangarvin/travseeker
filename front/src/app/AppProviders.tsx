import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ActivityProvider, AuthProvider, CompareProvider, ThemeProvider } from '../contexts';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ActivityProvider>
          <CompareProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </CompareProvider>
        </ActivityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
