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
    IconButton,
    Link as MuiLink,
    Divider,
    Alert,
    CircularProgress,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase/firebaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (err: unknown) {
            let errorMessage = '로그인에 실패했습니다.';
            if (err instanceof Error && 'code' in err) {
                if (err.code === 'auth/invalid-credential') {
                    errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
                } else if (err.code === 'auth/user-not-found') {
                    errorMessage = '계정을 찾을 수 없습니다. 이메일을 확인해주세요.';
                } else if (err.code === 'auth/too-many-requests') {
                    errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
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
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        color="primary"
                        sx={{ mb: 1 }}
                    >
                        로그인
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        계정에 로그인하여 서비스를 이용해보세요
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

                <Box component="form" onSubmit={handleLogin} noValidate>
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
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="비밀번호"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 1 }}
                    />

                    <Box sx={{ textAlign: 'right', mb: 3 }}>
                        <MuiLink
                            component={Link}
                            href="/auth/reset-password"
                            underline="hover"
                            variant="body2"
                            color="primary"
                        >
                            비밀번호를 잊으셨나요?
                        </MuiLink>
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{
                            py: 1.5,
                            mb: 2,
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
                        ) : '로그인'}
                    </Button>

                    <Divider sx={{ my: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            또는
                        </Typography>
                    </Divider>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            계정이 없으신가요?
                        </Typography>
                        <Button
                            component={Link}
                            href="/auth/signup"
                            fullWidth
                            variant="outlined"
                            size="large"
                            sx={{
                                mt: 1,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            회원가입
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}