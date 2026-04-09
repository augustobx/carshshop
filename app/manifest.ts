import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'CarshShop Vendedores',
        short_name: 'Carsh PWA',
        description: 'Sistema de Gestión de Ventas y Cotizaciones',
        start_url: '/pwa',
        display: 'standalone',
        background_color: '#0f172a', // Slate 900
        theme_color: '#4f46e5',      // Indigo 600
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}