import './globals.css';
import type { Metadata, Viewport  } from 'next';
// import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { QueryProvider } from './context/QueryProvider';
import { DataProvider } from './context/DataProvider';
import { DataLoadingProvider } from './components/DataLoadingProvider';
import DataProviderDebug from './components/DataProviderDebug';
import { ErrorBoundary } from './components/ErrorBoundary';
import InstallPWAButton from './components/InstallPWAButton';


export const metadata: Metadata = {
  title: 'Estudio Maker',
  description: 'Calendario de turnos 100% offline',
  manifest: '/manifest.webmanifest',
  themeColor: '#0ea5e9',
  icons: {
    icon: '/icono.png',
    apple: '/icono.png'
  }
};


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              <DataProvider>
                <DataLoadingProvider>
                  {/* <ThemeProvider> */}
                    <div >
                      {children}
                    </div>
                    {/* 🎯 Debug component para monitorear el DataProvider */}
                    <DataProviderDebug />
                  {/* </ThemeProvider> */}
                </DataLoadingProvider>
              </DataProvider>
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
        <InstallPWAButton />
      </body>
    </html>
  );
}