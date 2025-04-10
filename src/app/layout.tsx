// src/app/layout.tsx
import React from 'react';
import './global.css';
import ClientProviders from '@/components/ClientProviders';

export const metadata = {
  title: '팜매니지먼트 - 농가, 농지, 작업자 관리 시스템',
  description: 'Next.js 15, TypeScript, Firebase 기반 팜매니지먼트 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 필요한 메타 태그들을 추가하세요 */}
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
