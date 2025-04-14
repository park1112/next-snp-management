// src/app/protected/profile/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Avatar,
    TextField,
    Divider,
    Alert,
    CircularProgress,
    IconButton,
    useTheme,
    Grid as MuiGrid // 이름 변경
} from '@mui/material';
import {
    Person,
    ArrowBack,
    Save,
    Edit,
    Email,
    CalendarMonth
} from '@mui/icons-material';
import { updateProfile } from 'firebase/auth';
import Link from 'next/link';

// MUI의 Grid 컴포넌트용 인터페이스
const Grid = ({ children, ...props }: { children: React.ReactNode, props: any }) => {
    return <MuiGrid {...props}>{children}</MuiGrid>;
};

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [creationTime, setCreationTime] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }

        if (user) {
            setDisplayName(user.displayName || '');
            setEmail(user.email || '');

            // 계정 생성 시간 설정 (예: 2022년 10월 15일)
            if (user.metadata?.creationTime) {
                const date = new Date(user.metadata.creationTime);
                setCreationTime(date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }));
            }
        }
    }, [user, loading, router]);

    const handleSaveProfile = async () => {
        if (!user) return;

        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            // 이름 업데이트
            if (displayName !== user.displayName) {
                await updateProfile(user, { displayName });
            }

            setIsEditing(false);
            setSuccess('프로필이 성공적으로 업데이트되었습니다.');
        } catch (err: any) {
            setError('프로필 업데이트에 실패했습니다: ' + err.message);
        } finally {
            setIsSaving(false);
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

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', pb: 8 }}>
            {/* 헤더 */}
            <Paper
                elevation={0}
                sx={{
                    py: 2,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 0,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}
            >
                <Button
                    component={Link}
                    href="/"
                    startIcon={<ArrowBack />}
                    sx={{ textTransform: 'none' }}
                >
                    홈으로 돌아가기
                </Button>
            </Paper>

            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 3
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: 'primary.main',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                mr: 3
                            }}
                        >
                            {displayName ? displayName.charAt(0).toUpperCase() :
                                (email ? email.charAt(0).toUpperCase() : 'U')}
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="h4" fontWeight="bold">
                                    {displayName || '이름 미설정'}
                                </Typography>
                                <IconButton
                                    color="primary"
                                    onClick={() => setIsEditing(!isEditing)}
                                    sx={{ ml: 1 }}
                                >
                                    <Edit />
                                </IconButton>
                            </Box>
                            <Typography variant="body1" color="text.secondary">
                                {email}
                            </Typography>
                        </Box>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            {success}
                        </Alert>
                    )}

                    <Divider sx={{ mb: 4 }} />

                    {/* CSS Grid 레이아웃으로 변경 */}
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                            프로필 정보
                        </Typography>

                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 3
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Person color="action" sx={{ mr: 2, mt: 0.5 }} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        이름
                                    </Typography>
                                    {isEditing ? (
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            sx={{ mt: 1 }}
                                        />
                                    ) : (
                                        <Typography variant="body1">
                                            {displayName || '미설정'}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Email color="action" sx={{ mr: 2, mt: 0.5 }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        이메일
                                    </Typography>
                                    <Typography variant="body1">
                                        {email}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <CalendarMonth color="action" sx={{ mr: 2, mt: 0.5 }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        가입일
                                    </Typography>
                                    <Typography variant="body1">
                                        {creationTime || '정보 없음'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {isEditing && (
                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<Save />}
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    sx={{
                                        px: 3,
                                        py: 1,
                                        borderRadius: 2,
                                        textTransform: 'none'
                                    }}
                                >
                                    {isSaving ? '저장 중...' : '변경사항 저장'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setIsEditing(false)}
                                    sx={{
                                        ml: 2,
                                        px: 3,
                                        py: 1,
                                        borderRadius: 2,
                                        textTransform: 'none'
                                    }}
                                >
                                    취소
                                </Button>
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                        계정 관리
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            component={Link}
                            href="/auth/reset-password"
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none'
                            }}
                        >
                            비밀번호 변경
                        </Button>

                        <Button
                            variant="outlined"
                            color="error"
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none'
                            }}
                        >
                            계정 삭제
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}