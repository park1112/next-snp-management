import React from 'react';
import '../app/global.css';
import ClientProviders from '../components/ClientProviders';

export const metadata = {
  title: 'Next.js Firebase Auth Template with Material Design',
  description: 'Next.js 15, TypeScript, Firebase 인증 템플릿 (Material UI 적용)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
