// src/components/layout/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography,
    IconButton,
    Collapse,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Terrain as TerrainIcon,
    Engineering as EngineeringIcon,
    EventNote as EventNoteIcon,
    Description as DescriptionIcon,
    Payment as PaymentIcon,
    ExpandLess,
    ExpandMore,
    ChevronLeft,
    Settings,
    Person,
    Home as HomeIcon,
    Groups as GroupsIcon,
    DirectionsCar as CarsIcon,
    CalendarMonth,
    Map
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
    const { user } = useAuth();
    const pathname = usePathname();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Menu expansion states
    const [farmersOpen, setFarmersOpen] = React.useState(pathname?.includes('/farmers'));
    const [fieldsOpen, setFieldsOpen] = React.useState(pathname?.includes('/fields'));
    const [workersOpen, setWorkersOpen] = React.useState(pathname?.includes('/workers'));
    const [schedulesOpen, setSchedulesOpen] = React.useState(pathname?.includes('/schedules'));
    const [contractsOpen, setContractsOpen] = React.useState(pathname?.includes('/contracts'));
    const [paymentsOpen, setPaymentsOpen] = React.useState(pathname?.includes('/payments'));

    // Toggle handlers
    const toggleFarmers = () => setFarmersOpen(!farmersOpen);
    const toggleFields = () => setFieldsOpen(!fieldsOpen);
    const toggleWorkers = () => setWorkersOpen(!workersOpen);
    const toggleSchedules = () => setSchedulesOpen(!schedulesOpen);
    const toggleContracts = () => setContractsOpen(!contractsOpen);
    const togglePayments = () => setPaymentsOpen(!paymentsOpen);

    // Handle mobile view
    const handleLinkClick = () => {
        if (isMobile) {
            onClose();
        }
    };

    // Get username or email
    const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : '사용자');

    // Drawer content
    const drawerContent = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#fff',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
        }}>
            {/* Sidebar Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HomeIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                        팜매니지먼트
                    </Typography>
                </Box>
                {isMobile && (
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <ChevronLeft />
                    </IconButton>
                )}
            </Box>

            {/* User Info */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', mb: 1 }}>
                <Person sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1" fontWeight="medium" noWrap>
                    {userName}
                </Typography>
            </Box>

            <Divider />

            {/* Menu Items */}
            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }} component="nav">
                {/* Dashboard */}
                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        href="/"
                        selected={pathname === '/'}
                        onClick={handleLinkClick}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.light',
                                },
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.main',
                                }
                            }
                        }}
                    >
                        <ListItemIcon>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary="대시보드" />
                    </ListItemButton>
                </ListItem>

                {/* Farmers */}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={toggleFarmers}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <PeopleIcon />
                        </ListItemIcon>
                        <ListItemText primary="농가 관리" />
                        {farmersOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={farmersOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/schedules/calendar"
                            selected={pathname === '/schedules/calendar'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <CalendarMonth fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="일정 캘린더" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/schedules/add"
                            selected={pathname === '/schedules/add'}
                            onClick={handleLinkClick}
                        >
                            <ListItemText primary="작업 등록" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* Contracts */}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={toggleContracts}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <DescriptionIcon />
                        </ListItemIcon>
                        <ListItemText primary="계약 관리" />
                        {contractsOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={contractsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/contracts"
                            selected={pathname === '/contracts'}
                            onClick={handleLinkClick}
                        >
                            <ListItemText primary="계약 목록" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/contracts/add"
                            selected={pathname === '/contracts/add'}
                            onClick={handleLinkClick}
                        >
                            <ListItemText primary="계약 등록" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* Payments */}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={togglePayments}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <PaymentIcon />
                        </ListItemIcon>
                        <ListItemText primary="정산 관리" />
                        {paymentsOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={paymentsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/payments"
                            selected={pathname === '/payments'}
                            onClick={handleLinkClick}
                        >
                            <ListItemText primary="정산 목록" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/payments/add"
                            selected={pathname === '/payments/add'}
                            onClick={handleLinkClick}
                        >
                            <ListItemText primary="정산 등록" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/payments/reports"
                            selected={pathname === '/payments/reports'}
                            onClick={handleLinkClick}
                        >
                            <ListItemText primary="정산 보고서" />
                        </ListItemButton>
                    </List>
                </Collapse>
            </List>

            {/* Bottom Menu */}
            <Box sx={{ p: 2, mt: 'auto' }}>
                <Divider sx={{ mb: 2 }} />
                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            component={Link}
                            href="/profile"
                            selected={pathname === '/profile'}
                            onClick={handleLinkClick}
                            sx={{
                                borderRadius: 1,
                                mb: 0.5
                            }}
                        >
                            <ListItemIcon>
                                <Person />
                            </ListItemIcon>
                            <ListItemText primary="프로필" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton
                            component={Link}
                            href="/settings"
                            selected={pathname === '/settings'}
                            onClick={handleLinkClick}
                            sx={{
                                borderRadius: 1,
                                mb: 0.5
                            }}
                        >
                            <ListItemIcon>
                                <Settings />
                            </ListItemIcon>
                            <ListItemText primary="설정" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );

    return (
        <>
            {/* Mobile drawer */}
            {isMobile ? (
                <Drawer
                    variant="temporary"
                    open={open}
                    onClose={onClose}
                    ModalProps={{
                        keepMounted: true, // Better performance on mobile
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: 240,
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                // Desktop drawer
                <Drawer
                    variant="permanent"
                    open={open}
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: 240,
                            overflow: 'hidden',
                            transition: theme.transitions.create(['width', 'margin'], {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                            ...(!open && {
                                width: 0,
                                overflowX: 'hidden',
                                transition: theme.transitions.create(['width', 'margin'], {
                                    easing: theme.transitions.easing.sharp,
                                    duration: theme.transitions.duration.leavingScreen,
                                }),
                            }),
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}
        </>
    );
};

export default Sidebar;