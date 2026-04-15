import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { StartScreen } from './features/start/StartScreen';
import { useGameStore } from './store/gameStore';
import { Analytics } from "@vercel/analytics/react"

export default function App() {
  const hasLoadedCareer = useGameStore((state) => state.hasLoadedCareer);
  const location = useLocation();

  const publicRoutes = ['/career/setup'];

  if (!hasLoadedCareer && !publicRoutes.includes(location.pathname)) {
    return <StartScreen />;
  }

  return (
    <AppShell>
      <Outlet />
      <Analytics />
    </AppShell>
  );
}