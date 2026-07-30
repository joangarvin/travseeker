import { AccessibilityEffects } from './AccessibilityEffects';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';

export default function App() {
  return (
    <AppProviders>
      <AccessibilityEffects />
      <AppRoutes />
    </AppProviders>
  );
}
