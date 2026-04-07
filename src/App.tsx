import { Outlet } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { StartScreen } from './features/start/StartScreen';
import { useGameStore } from './store/gameStore';

export default function App() {
  const hasLoadedCareer = useGameStore((state) => state.hasLoadedCareer);

  if (!hasLoadedCareer) {
    return <StartScreen />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}