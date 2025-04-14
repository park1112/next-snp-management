// src/components/layout/MainLayout.tsx
'use client';

import React, { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Box,
    CssBaseline,
    CircularProgress,
    useMediaQuery,
    useTheme
} from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Check if user is authenticated
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!user) return null;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />

            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onClose={toggleSidebar} />

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    width: { xs: '100%', md: `calc(100% - ${sidebarOpen ? 240 : 0}px)` },
                    ml: { xs: 0, md: sidebarOpen ? '240px' : 0 },
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                {/* Header */}
                <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

                {/* Page content */}
                <Box sx={{
                    flexGrow: 1,
                    p: 3,
                    overflowY: 'auto',
                    bgcolor: '#f5f7fa',
                }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;