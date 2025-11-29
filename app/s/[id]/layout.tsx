'use client';

import React from 'react';

export default function SharedViewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {children}
        </div>
    );
}