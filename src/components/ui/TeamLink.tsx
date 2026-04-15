import { Link } from 'react-router-dom';
import { getCountryFlag } from '../../lib/countryFlags';

type TeamLinkProps = {
    teamId: string | null;
    teamName: string;
    country?: string | null;
    className?: string;
};

export function TeamLink({ teamId, teamName, country, className }: TeamLinkProps) {
    const label = `${country ? `${getCountryFlag(country)} ` : ''}${teamName}`;

    if (!teamId) {
        return <span className={className}>{label}</span>;
    }

    return (
        <Link
            to={`/teams/${teamId}`}
            className={className ?? 'font-medium text-white underline-offset-4 hover:text-red-300 hover:underline'}
        >
            {label}
        </Link>
    );
}
