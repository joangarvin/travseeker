import { AccessibilityEffects } from './AccessibilityEffects';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';
import { WebVitals } from './WebVitals';

export default function App() {
  return (
    <AppProviders>
      <AccessibilityEffects />
      <WebVitals />
      <AppRoutes />
    </AppProviders>
  );
}
