'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid as MuiGrid,

  Paper,
  Card,
  CardContent,
  Button,
  Divider,
  useTheme,
  alpha
} from '@mui/material';

import {
  People as PeopleIcon,
  Terrain as TerrainIcon,
  Engineering as EngineeringIcon,
  EventNote as EventNoteIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Add as AddIcon
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, getFirestore } from 'firebase/firestore';

// Stats card component
interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  change: number;
  linkTo: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon, change, linkTo }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {count}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.main,
              borderRadius: '12px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {change > 0 ? (
            <>
              <ArrowUpwardIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
              <Typography variant="body2" color="success.main" fontWeight="medium">
                {change}% 증가
              </Typography>
            </>
          ) : change < 0 ? (
            <>
              <ArrowDownwardIcon sx={{ color: 'error.main', fontSize: '1rem', mr: 0.5 }} />
              <Typography variant="body2" color="error.main" fontWeight="medium">
                {Math.abs(change)}% 감소
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              변화 없음
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            지난달 대비
          </Typography>
        </Box>
      </CardContent>
      <Box sx={{ p: 1, pt: 0 }}>
        <Button
          component="a"
          href={linkTo}
          size="small"
          sx={{
            width: '100%',
            textAlign: 'center',
            textTransform: 'none',
            fontWeight: 'medium',
            py: 0.75,
          }}
        >
          상세 보기
        </Button>
      </Box>
    </Card>
  );
};

// Activity card
interface ActivityItem {
  id: string;
  type: string;
  title: string;
  date: string;
  status: string;
}

// Main dashboard page
const Dashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState({
    farmerCount: 0,
    fieldCount: 0,
    workerCount: 0,
    scheduleCount: 0,
    contractCount: 0,
    paymentCount: 0
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  // Mock data for now - will be replaced with actual Firestore data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const db = getFirestore();

        // Example: Count farmers
        const farmersQuery = query(collection(db, 'farmers'));
        const farmersSnapshot = await getDocs(farmersQuery);
        const farmerCount = farmersSnapshot.docs.length;

        // In a real app, you'd do similar queries for other collections

        // For now, let's set some mock data
        setStats({
          farmerCount: farmerCount || 12,
          fieldCount: 45,
          workerCount: 18,
          scheduleCount: 24,
          contractCount: 9,
          paymentCount: 15
        });

        setRecentActivities([
          {
            id: '1',
            type: 'farmer',
            title: '홍길동 농가 등록',
            date: '2시간 전',
            status: 'completed'
          },
          {
            id: '2',
            type: 'field',
            title: '제1 농장 농지 추가',
            date: '4시간 전',
            status: 'completed'
          },
          {
            id: '3',
            type: 'schedule',
            title: '당근 수확 작업 일정',
            date: '1일 전',
            status: 'scheduled'
          },
          {
            id: '4',
            type: 'contract',
            title: '김영희 농장 계약 체결',
            date: '2일 전',
            status: 'completed'
          },
          {
            id: '5',
            type: 'payment',
            title: '8월 정산 완료',
            date: '3일 전',
            status: 'completed'
          }
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Username 
  const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : '사용자');

  return (
    <MainLayout>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          안녕하세요, {userName}님!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          팜매니지먼트 대시보드에 오신 것을 환영합니다. 모든 농가 활동을 한 곳에서 관리하세요.
        </Typography>
      </Box>

      {/* Stats cards */}
      <MuiGrid container spacing={3} sx={{ mb: 4 }}>
        <MuiGrid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="농가"
            count={stats.farmerCount}
            icon={<PeopleIcon />}
            change={5}
            linkTo="/farmers"
          />
        </MuiGrid>
        <MuiGrid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="농지"
            count={stats.fieldCount}
            icon={<TerrainIcon />}
            change={12}
            linkTo="/fields"
          />
        </MuiGrid>
        <MuiGrid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="작업자"
            count={stats.workerCount}
            icon={<EngineeringIcon />}
            change={-2}
            linkTo="/workers"
          />
        </MuiGrid>
        <MuiGrid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="작업 일정"
            count={stats.scheduleCount}
            icon={<EventNoteIcon />}
            change={8}
            linkTo="/schedules"
          />
        </MuiGrid>
        <MuiGrid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="계약"
            count={stats.contractCount}
            icon={<DescriptionIcon />}
            change={0}
            linkTo="/contracts"
          />
        </MuiGrid>
        <MuiGrid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="정산"
            count={stats.paymentCount}
            icon={<PaymentIcon />}
            change={15}
            linkTo="/payments"
          />
        </MuiGrid>
      </MuiGrid>

      {/* Quick actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          빠른 작업
        </Typography>
        <MuiGrid container spacing={2}>
          <MuiGrid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                  bgcolor: 'primary.light',
                  color: 'primary.main'
                }
              }}
              component="a"
              href="/payments/add"
            >
              <AddIcon sx={{ color: 'primary.main' }} />
              <Typography variant="body2" fontWeight="medium">
                정산 등록
              </Typography>
            </Paper>
          </MuiGrid>
        </MuiGrid>
      </Box>

      {/* Recent activities */}
      <MuiGrid container spacing={4}>
        <MuiGrid size={{ xs: 12, sm: 6, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight="bold">
                최근 활동
              </Typography>
              <Button size="small" color="primary" sx={{ textTransform: 'none' }}>
                전체 보기
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {recentActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}
                    >
                      {activity.type === 'farmer' && <PeopleIcon />}
                      {activity.type === 'field' && <TerrainIcon />}
                      {activity.type === 'schedule' && <EventNoteIcon />}
                      {activity.type === 'contract' && <DescriptionIcon />}
                      {activity.type === 'payment' && <PaymentIcon />}
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activity.date}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '6px',
                      bgcolor: activity.status === 'completed' ? 'success.light' : 'warning.light',
                      color: activity.status === 'completed' ? 'success.main' : 'warning.main',
                      fontSize: '0.75rem',
                      fontWeight: 'medium'
                    }}
                  >
                    {activity.status === 'completed' ? '완료' : '예정'}
                  </Box>
                </Box>
                {index < recentActivities.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Paper>
        </MuiGrid>

        {/* Calendar preview */}
        <MuiGrid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight="bold">
                예정된 일정
              </Typography>
              <Button
                size="small"
                color="primary"
                component="a"
                href="/schedules/calendar"
                sx={{ textTransform: 'none' }}
              >
                캘린더 보기
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: alpha(theme.palette.primary.light, 0.3), borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    오늘
                  </Typography>
                  <Typography variant="body2">
                    4월 10일
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  2
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    내일
                  </Typography>
                  <Typography variant="body2">
                    4월 11일
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" color="text.secondary">
                  3
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    이번 주
                  </Typography>
                  <Typography variant="body2">
                    4월 9일 - 4월 15일
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" color="text.secondary">
                  8
                </Typography>
              </Box>
            </Box>
          </Paper>
        </MuiGrid>
      </MuiGrid>
    </MainLayout>
  );
}

export default Dashboard;