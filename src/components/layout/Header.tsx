// src/components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Button,
    Avatar,
    Box,
    Menu,
    MenuItem,
    Divider,
    useTheme,
    useMediaQuery,
    InputBase,
    alpha
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    Person,
    Settings,
    ExitToApp
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebaseClient';

interface HeaderProps {
    toggleSidebar: () => void;
    sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();
    const router = useRouter();

    // Profile menu
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // Notification menu
    const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
    const notifOpen = Boolean(notifAnchorEl);

    const handleNotifMenu = (event: React.MouseEvent<HTMLElement>) => {
        setNotifAnchorEl(event.currentTarget);
    };

    const handleNotifClose = () => {
        setNotifAnchorEl(null);
    };

    // User name for display
    const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : '사용자');

    // User initials for avatar
    const userInitials = userName.charAt(0).toUpperCase();

    // Logout handler
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/auth/login');
        } catch (error) {
            console.error('로그아웃 오류:', error);
        }
    };

    return (
        <AppBar
            position="sticky"
            color="default"
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer - 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: 'white'
            }}
        >
            <Toolbar>
                {/* Menu toggle button */}
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={toggleSidebar}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Title - Mobile only */}
                {isMobile && (
                    <Typography
                        variant="h6"
                        component="div"
                        fontWeight="bold"
                        color="primary"
                        sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1 }}
                    >
                        팜매니지먼트
                    </Typography>
                )}

                {/* Search box - Desktop only */}
                <Box
                    sx={{
                        position: 'relative',
                        borderRadius: theme.shape.borderRadius,
                        backgroundColor: alpha(theme.palette.common.black, 0.04),
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.common.black, 0.08),
                        },
                        marginRight: theme.spacing(2),
                        marginLeft: 0,
                        width: { xs: '0', md: '400px' },
                        display: { xs: 'none', md: 'block' }
                    }}
                >
                    <Box sx={{ position: 'absolute', padding: theme.spacing(0, 2), height: '100%', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <SearchIcon color="action" />
                    </Box>
                    <InputBase
                        placeholder="농가, 농지, 작업자 등 검색..."
                        sx={{
                            color: 'inherit',
                            padding: theme.spacing(1, 1, 1, 0),
                            paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                            transition: theme.transitions.create('width'),
                            width: '100%',
                        }}
                    />
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                {/* Notifications */}
                <IconButton
                    color="inherit"
                    onClick={handleNotifMenu}
                    sx={{ ml: 1 }}
                >
                    <NotificationsIcon />
                </IconButton>
                <Menu
                    anchorEl={notifAnchorEl}
                    open={notifOpen}
                    onClose={handleNotifClose}
                    PaperProps={{
                        sx: {
                            width: 320,
                            maxHeight: 500,
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                            알림
                        </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            새로운 알림이 없습니다.
                        </Typography>
                    </Box>
                </Menu>

                {/* User profile */}
                <Button
                    onClick={handleMenu}
                    color="inherit"
                    sx={{
                        ml: 1,
                        textTransform: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.primary',
                        borderRadius: '8px'
                    }}
                >
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'primary.main',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {userInitials}
                    </Avatar>
                    <Typography
                        variant="body2"
                        sx={{
                            ml: 1,
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        {userName}
                    </Typography>
                </Button>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    PaperProps={{
                        sx: {
                            width: 200,
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={() => {
                        handleClose();
                        router.push('/profile');
                    }}>
                        <Person fontSize="small" sx={{ mr: 1 }} />
                        프로필
                    </MenuItem>
                    <MenuItem onClick={() => {
                        handleClose();
                        router.push('/settings');
                    }}>
                        <Settings fontSize="small" sx={{ mr: 1 }} />
                        설정
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => {
                        handleClose();
                        handleLogout();
                    }}>
                        <ExitToApp fontSize="small" sx={{ mr: 1 }} />
                        로그아웃
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default Header;