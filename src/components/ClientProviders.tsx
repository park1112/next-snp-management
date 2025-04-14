// src/components/ClientProviders.tsx
'use client';

import React from 'react';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../createEmotionCache';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from '../contexts/AuthContext';

const clientSideEmotionCache = createEmotionCache();

// 테마 커스터마이징
const theme = createTheme({
    palette: {
        primary: {
            main: '#4361ee', // 현대적인 블루
            light: '#738ced',
            dark: '#2541b8',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#f72585', // 선명한 핑크
            light: '#ff5eac',
            dark: '#c10062',
            contrastText: '#ffffff',
        },
        error: {
            main: '#ef233c',
        },
        warning: {
            main: '#fb8500',
        },
        info: {
            main: '#3a86ff',
        },
        success: {
            main: '#06d6a0',
        },
        background: {
            default: '#f5f7fa',
            paper: '#ffffff',
        },
        text: {
            primary: '#2b2d42',
            secondary: '#575a7b',
        },
    },
    typography: {
        fontFamily: '"Pretendard", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 700,
        },
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    shadows: [
        'none',
        '0px 2px 4px rgba(0, 0, 0, 0.05)',
        '0px 4px 8px rgba(0, 0, 0, 0.05)',
        '0px 8px 16px rgba(0, 0, 0, 0.07)',
        '0px 12px 20px rgba(0, 0, 0, 0.08)',
        '0px 14px 24px rgba(0, 0, 0, 0.1)',
        '0px 16px 28px rgba(0, 0, 0, 0.12)',
        '0px 18px 32px rgba(0, 0, 0, 0.14)',
        '0px 20px 36px rgba(0, 0, 0, 0.16)',
        '0px 22px 40px rgba(0, 0, 0, 0.18)',
        '0px 24px 44px rgba(0, 0, 0, 0.20)',
        '0px 26px 48px rgba(0, 0, 0, 0.22)',
        '0px 28px 52px rgba(0, 0, 0, 0.24)',
        '0px 30px 56px rgba(0, 0, 0, 0.26)',
        '0px 32px 60px rgba(0, 0, 0, 0.28)',
        '0px 34px 64px rgba(0, 0, 0, 0.30)',
        '0px 36px 68px rgba(0, 0, 0, 0.32)',
        '0px 38px 72px rgba(0, 0, 0, 0.34)',
        '0px 40px 76px rgba(0, 0, 0, 0.36)',
        '0px 42px 80px rgba(0, 0, 0, 0.38)',
        '0px 44px 84px rgba(0, 0, 0, 0.40)',
        '0px 46px 88px rgba(0, 0, 0, 0.42)',
        '0px 48px 92px rgba(0, 0, 0, 0.44)',
        '0px 50px 96px rgba(0, 0, 0, 0.46)',
        '0px 52px 100px rgba(0, 0, 0, 0.48)',
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    },
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: '#3050d6',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4361ee',
                        },
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <CacheProvider value={clientSideEmotionCache}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ThemeProvider>
        </CacheProvider>
    );
}