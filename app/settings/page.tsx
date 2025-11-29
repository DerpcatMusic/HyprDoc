'use client';

import React from 'react';
import { SettingsView } from '@/components/views/SettingsView';

export default function SettingsPage() {
    return (
        <SettingsView
            mode="global"
            settings={undefined}
            onUpdate={() => {}}
        />
    );
}

