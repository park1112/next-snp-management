'use client';

import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    InputAdornment,
    Alert,
    CircularProgress,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebase/firebaseClient';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!email) {
            setError('이메일을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: unknown) {
            let errorMessage = '비밀번호 재설정 이메일 전송에 실패했습니다.';
            if (err instanceof Error && 'code' in err) {
                if (err.code === 'auth/user-not-found') {
                    errorMessage = '해당 이메일로 가입된 계정을 찾을 수 없습니다.';
                } else if (err.code === 'auth/invalid-email') {
                    errorMessage = '유효하지 않은 이메일 형식입니다.';
                } else if (err.code === 'auth/too-many-requests') {
                    errorMessage = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.';
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4
        }}>
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    p: isMobile ? 3 : 4,
                    borderRadius: 2,
                    background: 'linear-gradient(to right bottom, #ffffff, #fafafa)'
                }}
            >
                <Button
                    startIcon={<ArrowBack />}
                    component={Link}
                    href="/auth/login"
                    sx={{ mb: 3, textTransform: 'none' }}
                >
                    로그인으로 돌아가기
                </Button>

                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        color="primary"
                        sx={{ mb: 1 }}
                    >
                        비밀번호 재설정
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        계정에 등록된 이메일로 재설정 링크를 보내드립니다
                    </Typography>
                </Box>

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: 1,
                            animation: 'fadeIn 0.5s'
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert
                        severity="success"
                        sx={{
                            mb: 3,
                            borderRadius: 1,
                            animation: 'fadeIn 0.5s'
                        }}
                    >
                        비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.
                    </Alert>
                )}

                <Box component="form" onSubmit={handleResetPassword} noValidate>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="이메일"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email color="action" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3 }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || success}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            boxShadow: 2,
                            position: 'relative'
                        }}
                    >
                        {loading ? (
                            <CircularProgress
                                size={24}
                                color="inherit"
                                sx={{ position: 'absolute' }}
                            />
                        ) : '비밀번호 재설정 링크 전송'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}