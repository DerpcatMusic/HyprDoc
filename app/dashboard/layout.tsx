'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutTemplate, Settings, ArrowLeft, LogOut, 
    Menu, X, Hexagon, Moon, Sun, Book
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui-components';
import { cn } from '@/components/ui-components';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user, isLoaded } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Toggle dark mode
    React.useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    const navigation = [
        { 
            name: 'Dashboard', 
            href: '/dashboard', 
            icon: LayoutTemplate,
            isActive: pathname === '/dashboard'
        },
        { 
            name: 'Global Settings', 
            href: '/settings', 
            icon: Settings,
            isActive: pathname === '/settings'
        },
    ];

    return (
        <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden relative">
            {/* Mobile Header */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-background border-b-2 border-black flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-2">
                    <Hexagon size={20} strokeWidth={3} />
                    <span className="font-bold font-mono tracking-tight uppercase">HyprDoc</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Navigation Sidebar */}
            <div className={cn(
                "w-16 border-r-2 border-black bg-white dark:bg-black dark:border-white flex flex-col items-center py-6 gap-8 z-40 shadow-none flex-shrink-0 transition-all duration-300",
                "md:static md:flex",
                isMobileMenuOpen ? "absolute inset-0 w-full flex-col pt-20" : "hidden"
            )}>
                <div className="w-10 h-10 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-lg tracking-tighter shadow-sharp dark:shadow-sharp-dark md:flex hidden">
                    <Hexagon size={24} strokeWidth={3} />
                </div>
                
                <div className="flex-1 flex flex-col gap-6 w-full px-2 items-center mt-4">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "w-10 h-10 flex items-center justify-center border-2 transition-all",
                                    item.isActive 
                                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                                        : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'
                                )}
                                title={item.name}
                            >
                                <Icon size={20} />
                                <span className="md:hidden ml-2 font-mono font-bold">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
                
                <div className="flex flex-col gap-4 w-full px-2 items-center mb-4">
                    <button 
                        className="w-10 h-10 flex items-center justify-center border-2 border-transparent hover:border-black dark:hover:border-white text-muted-foreground transition-all"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div className="w-full h-px bg-black/10 dark:bg-white/10" />
                    <button 
                        className="w-10 h-10 flex items-center justify-center border-2 border-transparent hover:border-red-500 hover:text-red-500 text-muted-foreground transition-all"
                        onClick={() => {
                            // Use Clerk's signOut
                            if (typeof window !== 'undefined') {
                                window.location.href = '/sign-in';
                            }
                        }}
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full pt-14 md:pt-0">
                {children}
            </div>
        </div>
    );
}

