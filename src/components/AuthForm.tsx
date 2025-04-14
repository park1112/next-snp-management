// src/components/AuthForm.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { TextField, Button, Paper, Typography, Alert } from '@mui/material';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseClient';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
    mode: 'login' | 'signup';
}

const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>(''); // 회원가입 모드용
    const [error, setError] = useState<string>('');

    const isLogin = mode === 'login';

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('이메일과 비밀번호는 필수입니다.');
            return;
        }
        if (!isLogin && password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            router.push('/');
        } catch (err: any) {
            setError(err.message || '인증 중 오류가 발생했습니다.');
        }
    };

    return (
        <Paper elevation={3} sx={{ padding: 4, maxWidth: 400, margin: 'auto' }}>
            <Typography variant="h5" component="h1" align="center" gutterBottom>
                {isLogin ? '로그인' : '회원가입'}
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            <form onSubmit={handleSubmit}>
                <TextField
                    label="이메일"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="비밀번호"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                {!isLogin && (
                    <TextField
                        label="비밀번호 확인"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                )}
                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                    {isLogin ? '로그인' : '회원가입'}
                </Button>
            </form>
        </Paper>
    );
};

export default AuthForm;
