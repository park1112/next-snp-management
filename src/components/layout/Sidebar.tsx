// src/components/layout/Sidebar.tsx
'use client';

import React, { useState } from 'react';
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
    Map,
    Add as AddIcon,
    List as ListIcon,
    ReceiptLong,
    Category as CategoryIcon,
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
    const [farmersOpen, setFarmersOpen] = useState(pathname?.includes('/farmers'));
    const [fieldsOpen, setFieldsOpen] = useState(pathname?.includes('/fields'));
    const [workersOpen, setWorkersOpen] = useState(pathname?.includes('/workers'));
    const [schedulesOpen, setSchedulesOpen] = useState(pathname?.includes('/schedules'));
    const [contractsOpen, setContractsOpen] = useState(pathname?.includes('/contracts'));
    const [paymentsOpen, setPaymentsOpen] = useState(pathname?.includes('/payments'));
    const [categoriesOpen, setCategoriesOpen] = useState(pathname?.includes('/categories'));
    // Toggle handlers
    const toggleFarmers = () => setFarmersOpen(!farmersOpen);
    const toggleFields = () => setFieldsOpen(!fieldsOpen);
    const toggleWorkers = () => setWorkersOpen(!workersOpen);
    const toggleSchedules = () => setSchedulesOpen(!schedulesOpen);
    const toggleContracts = () => setContractsOpen(!contractsOpen);
    const togglePayments = () => setPaymentsOpen(!paymentsOpen);
    const toggleCategories = () => setCategoriesOpen(!categoriesOpen);
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
                            },
                            ...(pathname?.includes('/farmers') && !pathname?.includes('/farmers/add') && {
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.main',
                                }
                            })
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
                            href="/farmers"
                            selected={pathname === '/farmers'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <ListIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="농가 목록" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/farmers/add"
                            selected={pathname === '/farmers/add'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="농가 등록" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* Fields */}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={toggleFields}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                            },
                            ...(pathname?.includes('/fields') && !pathname?.includes('/fields/add') && {
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.main',
                                }
                            })
                        }}
                    >
                        <ListItemIcon>
                            <TerrainIcon />
                        </ListItemIcon>
                        <ListItemText primary="농지 관리" />
                        {fieldsOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={fieldsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/fields"
                            selected={pathname === '/fields'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <ListIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="농지 목록" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/fields/map"
                            selected={pathname === '/fields/map'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <Map fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="지도 보기" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/fields/add"
                            selected={pathname === '/fields/add'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="농지 등록" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* Workers */}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={toggleWorkers}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                            },
                            ...(pathname?.includes('/workers') &&
                                !pathname?.includes('/workers/foremen/add') &&
                                !pathname?.includes('/workers/drivers/add') && {
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.main',
                                }
                            })
                        }}
                    >
                        <ListItemIcon>
                            <EngineeringIcon />
                        </ListItemIcon>
                        <ListItemText primary="작업자 관리" />
                        {workersOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={workersOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/workers"
                            selected={pathname === '/workers'}
                            onClick={handleLinkClick}
                        >
                            <ListItemText primary="전체 작업자" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/workers/foremen"
                            selected={pathname === '/workers/foremen'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <GroupsIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="작업반장" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/workers/foremen/add"
                            selected={pathname === '/workers/foremen/add'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="작업반장 등록" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/workers/drivers"
                            selected={pathname === '/workers/drivers'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <CarsIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="운송기사" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/workers/drivers/add"
                            selected={pathname === '/workers/drivers/add'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="운송기사 등록" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* Schedules */}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={toggleSchedules}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                            },
                            ...(pathname?.includes('/schedules') && {
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.main',
                                }
                            })
                        }}
                    >
                        <ListItemIcon>
                            <EventNoteIcon />
                        </ListItemIcon>
                        <ListItemText primary="작업 일정" />
                        {schedulesOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={schedulesOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/schedules"
                            selected={pathname === '/schedules'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <ListIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="일정 목록" />
                        </ListItemButton>
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
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
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
                            },
                            ...(pathname?.includes('/contracts') && {
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.main',
                                }
                            })
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
                            <ListItemIcon>
                                <ListIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="계약 목록" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/contracts/add"
                            selected={pathname === '/contracts/add'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
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
                            },
                            ...(pathname?.includes('/payments') && {
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.main',
                                }
                            })
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
                            <ListItemIcon>
                                <ListIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="정산 목록" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/payments/add"
                            selected={pathname === '/payments/add'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="정산 등록" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/payments/reports"
                            selected={pathname === '/payments/reports'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <ReceiptLong fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="정산 보고서" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* 카테고리 관리 */}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={toggleCategories}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                            },
                            ...(pathname?.includes('/categories') && {
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.main',
                                }
                            })
                        }}
                    >
                        <ListItemIcon>
                            <CategoryIcon />
                        </ListItemIcon>
                        <ListItemText primary="카테고리 관리" />
                        {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={categoriesOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/categories/payment"
                            selected={pathname === '/categories/payment'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <ListIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="결제소속 관리" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/categories/workTypes"
                            selected={pathname === '/categories/workTypes'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <ListIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="업무 유형 관리" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/categories/cropTypes"
                            selected={pathname === '/categories/cropTypes'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="작물 종류 관리" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                            component={Link}
                            href="/categories/categories"
                            selected={pathname === '/categories/categories'}
                            onClick={handleLinkClick}
                        >
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="작업 프로세스 관리" />
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