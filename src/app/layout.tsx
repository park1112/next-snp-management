import React from 'react';
import './global.css';
import ClientProviders from '@/components/ClientProviders';
import { AppProvider } from '@/contexts/AppContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';

export const metadata = {
  title: '팜매니지먼트 - 농가, 농지, 작업자 관리 시스템',
  description: 'Next.js 15, TypeScript, Firebase 기반 팜매니지먼트 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ClientProviders>
          <AppProvider>
            {children}
          </AppProvider>
        </ClientProviders>
      </body>
    </html>
  );
}