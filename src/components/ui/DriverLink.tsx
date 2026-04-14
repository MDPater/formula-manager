import { Link } from 'react-router-dom';
import { getCountryFlag } from '../../lib/countryFlags';

type DriverLinkProps = {
    driverId: string | null;
    driverName: string;
    country?: string | null;
    className?: string;
};

export function DriverLink({ driverId, driverName, country, className }: DriverLinkProps) {
    const label = `${country ? `${getCountryFlag(country)} ` : ''}${driverName}`;

    if (!driverId) {
        return <span className={className}>{label}</span>;
    }

    return (
        <Link
            to={`/drivers/${driverId}`}
            className={className ?? 'font-medium text-white underline-offset-4 hover:text-red-300 hover:underline'}
        >
            {label}
        </Link>
    );
}
