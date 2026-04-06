import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { TeamPage } from '../features/team/TeamPage';
import { MarketPage } from '../features/market/MarketPage';
import { FactoryPage } from '../features/factory/FactoryPage';
import { RaceWeekendPage } from '../features/race/RaceWeekendPage';
import { StandingsPage } from '../features/standings/StandingsPage';

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
            { path: 'standings', element: <StandingsPage /> },
        ],
    },
]);