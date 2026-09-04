import NuevoVehiculoClient from '@/components/vehiculos/NuevoVehiculoClient';
import { getTenantContext } from '@/lib/tenant-context';

export const metadata = {
    title: 'Ingresar unidad | OnlyCars',
};

export default async function AgregarVehiculoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams;
    const tenant = await getTenantContext();
    const tipo = params.tipo === 'Moto' ? 'Moto' : 'Auto';
    const requestedReturn = typeof params.returnTo === 'string' ? params.returnTo : '';
    const returnHref = requestedReturn === '/motos' || requestedReturn === '/vehiculos' ? requestedReturn : (tipo === 'Moto' ? '/motos' : '/vehiculos');

    return (
        <div className="bg-slate-50 min-h-screen">
            <NuevoVehiculoClient
                tipoInicial={tipo}
                returnHref={returnHref}
                dolarActual={Number(tenant.settings?.dolarActual || 1400)}
            />
        </div>
    );
}
