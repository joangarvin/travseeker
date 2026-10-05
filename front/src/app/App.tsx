import { GuidedTourProvider } from '../features/tour/GuidedTour';
import { PrivacyProvider } from '../features/privacy/CookieConsent';
import { LanguageNavigation } from '../i18n/LanguageNavigation';
import { AccessibilityEffects } from './AccessibilityEffects';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';
import { MotionEffects } from './MotionEffects';
import { WebVitals } from './WebVitals';

export default function App() {
  return (
    <AppProviders>
      <PrivacyProvider>
        <LanguageNavigation />
        <AccessibilityEffects />
        <MotionEffects />
        <WebVitals />
        <GuidedTourProvider>
          <AppRoutes />
        </GuidedTourProvider>
      </PrivacyProvider>
    </AppProviders>
  );
}
