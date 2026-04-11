import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCareerSetupStore } from '../../store/careerSetupStore';
import { useGameStore } from '../../store/gameStore';
import { useUiStore } from '../../store/uiStore';

export function TopBar({
    showNavToggle,
    mobileNavOpen,
    onToggleNav,
}: {
    showNavToggle: boolean;
    mobileNavOpen: boolean;
    onToggleNav: () => void;
}) {
    const location = useLocation();
    const isSetupRoute = location.pathname === '/career/setup';
    const theme = useUiStore((state) => state.theme);

    const teams = useGameStore((state) => state.teams);
    const drivers = useGameStore((state) => state.drivers);
    const engineers = useGameStore((state) => state.engineers);
    const pitCrewChiefs = useGameStore((state) => state.pitCrewChiefs);
    const calendar = useGameStore((state) => state.calendar);
    const currentRound = useGameStore((state) => state.currentRound);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const seasonNumber = useGameStore((state) => state.seasonNumber);
    const isSeasonComplete = useGameStore((state) => state.isSeasonComplete);

    const activeSaveName = useGameStore((state) => state.activeSaveName);
    const lastSavedAt = useGameStore((state) => state.lastSavedAt);
    const saveCurrentCareer = useGameStore((state) => state.saveCurrentCareer);
    const exportCurrentCareer = useGameStore((state) => state.exportCurrentCareer);
    const exitToStartScreen = useGameStore((state) => state.exitToStartScreen);

    const setupSaveName = useCareerSetupStore((state) => state.saveName);
    const setupTeamId = useCareerSetupStore((state) => state.teamId);
    const setupDriverIds = useCareerSetupStore((state) => state.driverIds);
    const setupEngineerId = useCareerSetupStore((state) => state.engineerId);
    const setupPitCrewChiefId = useCareerSetupStore((state) => state.pitCrewChiefId);
    const setupSeasonLength = useCareerSetupStore((state) => state.seasonLength);

    const nextRace = calendar[currentRound];
    const playerTeam = teams.find((team) => team.id === playerTeamId) ?? teams[0];

    const selectedSetupTeam = teams.find((team) => team.id === setupTeamId) ?? null;
    const selectedSetupDrivers = drivers.filter((driver) => setupDriverIds.includes(driver.id));
    const selectedSetupEngineer =
        engineers.find((engineer) => engineer.id === setupEngineerId) ?? null;
    const selectedSetupPitCrewChief =
        pitCrewChiefs.find((chief) => chief.id === setupPitCrewChiefId) ?? null;

    const setupSpent =
        selectedSetupDrivers.reduce((sum, driver) => sum + driver.marketValue, 0) +
        (selectedSetupEngineer?.salary ?? 0) +
        (selectedSetupPitCrewChief?.salary ?? 0);

    const setupRemainingBudget = (selectedSetupTeam?.budget ?? 0) - setupSpent;

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const headerClass =
        theme === 'light'
            ? `sticky top-0 z-40 border-b border-stone-300 bg-stone-50/90 backdrop-blur transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'
            }`
            : `sticky top-0 z-40 border-b border-white/5 bg-[#2b2d31]/90 backdrop-blur transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'
            }`;

    if (isSetupRoute) {
        return (
            <header className={headerClass}>
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                            Career Setup
                        </div>
                        <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white md:text-2xl">
                            Build Your Team
                        </h1>
                        <div className="mt-1 text-xs text-stone-600 dark:text-zinc-400">
                            {setupSaveName || 'New Career'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Budget</div>
                            <div
                                className={`text-sm font-semibold ${setupRemainingBudget >= 0 ? 'text-stone-900 dark:text-white' : 'text-red-400'
                                    }`}
                            >
                                ${Math.max(setupRemainingBudget, 0).toLocaleString()}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Drivers</div>
                            <div className="text-sm font-semibold text-stone-900 dark:text-white">
                                {setupDriverIds.length}/2
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Staff</div>
                            <div className="text-sm font-semibold text-stone-900 dark:text-white">
                                {(setupEngineerId ? 1 : 0) + (setupPitCrewChiefId ? 1 : 0)}/2
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Season</div>
                            <div className="text-sm font-semibold text-stone-900 dark:text-white">
                                {setupSeasonLength} races
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className={headerClass}>
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 md:flex-row md:items-center md:justify-between md:px-6">
                <div className="flex items-start gap-3">
                    {showNavToggle && (
                        <button
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-800 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden"
                            onClick={onToggleNav}
                        >
                            {mobileNavOpen ? 'Hide Menu' : 'Show Menu'}
                        </button>
                    )}

                    <div className={`${scrolled ? 'hidden md:block' : 'block'}`}>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                            Season {seasonNumber}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-900 dark:text-white md:text-2xl">
                                <span>{nextRace?.flag ?? '🏁'}</span>
                                <span>
                                    {isSeasonComplete
                                        ? 'Season Complete'
                                        : nextRace
                                            ? nextRace.name
                                            : 'Season Complete'}
                                </span>
                            </h1>

                            {isSeasonComplete && (
                                <Link
                                    to="/season-overview"
                                    className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                                >
                                    Season Overview
                                </Link>
                            )}
                        </div>

                        <div className="mt-1 text-xs text-stone-600 dark:text-zinc-400">
                            {activeSaveName}
                            {lastSavedAt ? ` · ${new Date(lastSavedAt).toLocaleString()}` : ''}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">RND</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-white">
                            {Math.min(currentRound + 1, calendar.length)}/{calendar.length}
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">$</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-white">
                            {Math.round(playerTeam.budget / 1000000)}M
                        </div>
                    </div>

                    {!scrolled && (
                        <>
                            <button
                                className="rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-2 text-xs font-medium text-white"
                                onClick={saveCurrentCareer}
                            >
                                Save
                            </button>

                            <button
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-stone-800 dark:text-zinc-300"
                                onClick={exportCurrentCareer}
                            >
                                Export
                            </button>

                            {!isSeasonComplete && (
                                <button
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-stone-800 dark:text-zinc-300"
                                    onClick={exitToStartScreen}
                                >
                                    Back
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}