// src/app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Avatar,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Person,
  ExitToApp,
  Home as HomeIcon,
  Dashboard,
  Settings,
  Info
} from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseClient';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      // 사용자 이름 설정 - displayName이 없으면 이메일 앞부분 사용
      setUserName(
        user.displayName ||
        (user.email ? user.email.split('@')[0] : '사용자')
      );
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
    } catch (err) {
      console.error('로그아웃 중 오류 발생:', err);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  // 샘플 카드 콘텐츠
  const featureCards = [
    {
      title: '대시보드',
      description: '사용자 활동과 통계를 확인할 수 있습니다.',
      icon: <Dashboard fontSize="large" color="primary" />,
      action: () => console.log('대시보드 클릭')
    },
    {
      title: '설정',
      description: '계정 설정 및 앱 환경설정을 관리합니다.',
      icon: <Settings fontSize="large" color="primary" />,
      action: () => router.push('/protected/profile')
    },
    {
      title: '정보',
      description: '앱 정보 및 사용 가이드를 확인합니다.',
      icon: <Info fontSize="large" color="primary" />,
      action: () => console.log('정보 클릭')
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* 헤더 */}
      <Paper
        elevation={0}
        sx={{
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HomeIcon sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6" fontWeight="bold" color="primary">
            Next Firebase Auth
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="text"
            startIcon={<Person />}
            onClick={() => router.push('/protected/profile')}
            sx={{ textTransform: 'none', mr: 1 }}
          >
            프로필
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ExitToApp />}
            onClick={handleLogout}
            sx={{ textTransform: 'none' }}
          >
            로그아웃
          </Button>
        </Box>
      </Paper>

      {/* 메인 콘텐츠 */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* 환영 섹션 */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ mb: { xs: 3, md: 0 } }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              안녕하세요, {userName}님!
            </Typography>
            <Typography variant="body1">
              Next.js와 Firebase 인증이 적용된 대시보드에 오신 것을 환영합니다.
              이 템플릿을 자유롭게 활용하여 멋진 프로젝트를 만들어보세요.
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'white',
              color: 'primary.main',
              fontSize: '2.5rem',
              fontWeight: 'bold'
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
        </Paper>

        {/* 기능 카드 */}
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          기능 살펴보기
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)'
            },
            gap: 3
          }}
        >
          {featureCards.map((card, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {card.description}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={card.action}
                  sx={{
                    mt: 'auto',
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  자세히 보기
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* 정보 섹션 */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mt: 4,
            borderRadius: 3,
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            프로젝트 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" paragraph>
            이 프로젝트는 Next.js 15 및 Firebase를 사용하여 구축된 인증 템플릿입니다.
            Material UI 디자인 시스템을 적용하여 모던하고 반응형 UI를 제공합니다.
          </Typography>
          <Typography variant="body1">
            주요 기능:
          </Typography>
          <ul>
            <li>이메일 기반 인증 (로그인/회원가입)</li>
            <li>비밀번호 재설정 기능</li>
            <li>반응형 UI 디자인</li>
            <li>사용자 프로필 관리</li>
            <li>보안 라우팅 (인증된 사용자만 접근 가능)</li>
          </ul>
        </Paper>
      </Container>
    </Box>
  );
}