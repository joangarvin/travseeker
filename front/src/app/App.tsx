import { AccessibilityEffects } from './AccessibilityEffects';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';
import { MotionEffects } from './MotionEffects';
import { WebVitals } from './WebVitals';

export default function App() {
  return (
    <AppProviders>
      <AccessibilityEffects />
      <MotionEffects />
      <WebVitals />
      <AppRoutes />
    </AppProviders>
  );
}
