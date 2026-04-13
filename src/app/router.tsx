import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { CareerSetupPage } from '../features/career/CareerSetupPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { DriverDetailPage } from '../features/drivers/DriverDetailPage';
import { FactoryPage } from '../features/factory/FactoryPage';
import { MarketPage } from '../features/market/MarketPage';
import { RaceWeekendPage } from '../features/race/RaceWeekendPage';
import { ResultsPage } from '../features/results/ResultsPage';
import { SeasonOverviewPage } from '../features/season/SeasonOverviewPage';
import { StandingsPage } from '../features/standings/StandingsPage';
import { TeamPage } from '../features/team/TeamPage';
import { OffSeasonPage } from '../features/offseason/OffSeasonPage';
import { HallOfFamePage } from '../features/halloffame/HallOfFamePage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: 'career/setup', element: <CareerSetupPage /> },
            { path: 'team', element: <TeamPage /> },
            { path: 'market', element: <MarketPage /> },
            { path: 'factory', element: <FactoryPage /> },
            { path: 'race', element: <RaceWeekendPage /> },
            { path: 'results', element: <ResultsPage /> },
            { path: 'standings', element: <StandingsPage /> },
            { path: 'drivers/:driverId', element: <DriverDetailPage /> },
            { path: 'season-overview', element: <SeasonOverviewPage /> },
            { path: 'offseason', element: <OffSeasonPage /> },
            { path: 'hall-of-fame', element: <HallOfFamePage /> },
        ],
    },
]);