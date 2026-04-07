import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { TeamPage } from '../features/team/TeamPage';
import { MarketPage } from '../features/market/MarketPage';
import { FactoryPage } from '../features/factory/FactoryPage';
import { RaceWeekendPage } from '../features/race/RaceWeekendPage';
import { ResultsPage } from '../features/results/ResultsPage';
import { StandingsPage } from '../features/standings/StandingsPage';
import { DriverDetailPage } from '../features/drivers/DriverDetailPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: 'team', element: <TeamPage /> },
            { path: 'market', element: <MarketPage /> },
            { path: 'factory', element: <FactoryPage /> },
            { path: 'race', element: <RaceWeekendPage /> },
            { path: 'results', element: <ResultsPage /> },
            { path: 'standings', element: <StandingsPage /> },
            { path: 'drivers/:driverId', element: <DriverDetailPage /> },
        ],
    },
]);