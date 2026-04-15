import type {
    CustomDatabaseFile,
    Driver,
    Race,
    Team,
} from '../features/season/types';

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isDriver(value: unknown): value is Driver {
    if (!isObject(value)) return false;

    return (
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.age === 'number' &&
        typeof value.country === 'string' &&
        typeof value.teamId === 'string' &&
        typeof value.overall === 'number' &&
        typeof value.qualifying === 'number' &&
        typeof value.racecraft === 'number' &&
        typeof value.consistency === 'number' &&
        typeof value.wetSkill === 'number' &&
        typeof value.marketValue === 'number'
    );
}

function isTeam(value: unknown): value is Team {
    if (!isObject(value)) return false;

    return (
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.country === 'string' &&
        typeof value.budget === 'number' &&
        typeof value.aero === 'number' &&
        typeof value.power === 'number' &&
        typeof value.reliability === 'number' &&
        Array.isArray(value.drivers) &&
        value.drivers.every((driverId) => typeof driverId === 'string') &&
        typeof value.points === 'number'
    );
}

function isRace(value: unknown): value is Race {
    if (!isObject(value)) return false;

    return (
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.country === 'string' &&
        typeof value.flag === 'string' &&
        (value.trackBias === 'power' ||
            value.trackBias === 'aero' ||
            value.trackBias === 'balanced') &&
        typeof value.chaos === 'number' &&
        (value.weather === 'dry' ||
            value.weather === 'mixed' ||
            value.weather === 'wet')
    );
}

export function parseCustomDatabaseFile(value: unknown): CustomDatabaseFile {
    if (!isObject(value)) {
        throw new Error('JSON root must be an object.');
    }

    if (value.version !== 1) {
        throw new Error('Only version 1 database files are supported.');
    }

    if (value.type !== 'database') {
        throw new Error('This JSON file is not a custom database file.');
    }

    if (!isObject(value.world)) {
        throw new Error('Database file is missing a world section.');
    }

    const teams = value.world.teams;
    const drivers = value.world.drivers;
    const calendar = value.world.calendar ?? [];

    if (!Array.isArray(teams) || teams.length === 0) {
        throw new Error('Database file must include at least one team.');
    }

    if (!Array.isArray(drivers) || drivers.length === 0) {
        throw new Error('Database file must include at least one driver.');
    }

    if (!teams.every(isTeam)) {
        throw new Error('One or more teams are invalid.');
    }

    if (!drivers.every(isDriver)) {
        throw new Error('One or more drivers are invalid.');
    }

    if (!Array.isArray(calendar) || !calendar.every(isRace)) {
        throw new Error('Calendar is invalid.');
    }

    const teamIds = new Set(teams.map((team) => team.id));

    const playerTeamId =
        typeof value.playerTeamId === 'string' ? value.playerTeamId : teams[0].id;

    if (!teamIds.has(playerTeamId)) {
        throw new Error('playerTeamId does not exist in the imported teams.');
    }

    return {
        version: 1,
        type: 'database',
        meta: isObject(value.meta)
            ? {
                name:
                    typeof value.meta.name === 'string' ? value.meta.name : undefined,
                description:
                    typeof value.meta.description === 'string'
                        ? value.meta.description
                        : undefined,
            }
            : undefined,
        playerTeamId,
        world: {
            teams,
            drivers,
            calendar,
        },
    };
}