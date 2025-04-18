'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProfileComponents from '@/components/protected/ProfileComponents';

export default function ProfilePage() {
    return (
        <MainLayout>
            <ProfileComponents />
        </MainLayout>
    );
}