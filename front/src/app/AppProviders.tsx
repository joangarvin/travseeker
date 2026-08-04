import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  ActivityProvider,
  AuthProvider,
  CompareProvider,
  ThemeProvider,
  TourismTypeProvider,
} from '../contexts';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ActivityProvider>
          <TourismTypeProvider>
            <CompareProvider>
              <BrowserRouter>{children}</BrowserRouter>
            </CompareProvider>
          </TourismTypeProvider>
        </ActivityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
