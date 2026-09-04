import type { Metadata, Viewport } from 'next';
import { RolMembresia } from '@prisma/client';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { notFound, redirect } from 'next/navigation';
import PWASplash from './PWASplash';
import ModuleHelpButton from '@/components/ModuleHelpButton';

export const metadata: Metadata = {
  title: 'OnlyCars Sales',
  description: 'Gestión comercial móvil para concesionarias',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default async function PWALayout({ children }: { children: React.ReactNode }) {
  let tenant;
  try {
    tenant = await getTenantContext();
  } catch {
    notFound();
  }

  try {
    await requireTenantRole(tenant.id, [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR]);
  } catch (error: any) {
    if (String(error?.message || '').startsWith('UNAUTHORIZED')) redirect('/login');
    redirect('/');
  }

  const brandColor = tenant.settings?.primaryColor || '#2563eb';
  const themeStyles = `
    :root {
      --color-brand: ${brandColor};
      --color-brand-hover: ${brandColor}ee;
      --color-brand-ring: ${brandColor}33;
    }
  `;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 select-none antialiased">
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col">
        <ModuleHelpButton variant="floating" />
        <PWASplash logo={tenant.settings?.logoUrl || null} initialDolar={tenant.settings?.dolarActual || 1400}>
          {children}
        </PWASplash>
      </div>
    </div>
  );
}
