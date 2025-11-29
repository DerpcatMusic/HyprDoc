'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { 
    ArrowLeft, LogOut, Menu, X, 
    Moon, Sun, SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui-components';
import { cn } from '../../../components/ui-components';

export default function DocumentEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const params = useParams();
    const docId = params.id as string;
    const { user, signOut } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Toggle dark mode
    React.useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    return (
        <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden relative">
            {/* Mobile Header */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-background border-b-2 border-black flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard">
                        <ArrowLeft size={20} />
                    </Link>
                    <span className="font-bold font-mono tracking-tight uppercase">Document Editor</span>
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
                    <span className="text-sm">HD</span>
                </div>
                
                <div className="flex-1 flex flex-col gap-6 w-full px-2 items-center mt-4">
                    <Link
                        href="/dashboard"
                        className="w-10 h-10 flex items-center justify-center border-2 transition-all border-transparent hover:border-black dark:hover:border-white text-muted-foreground"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                        <span className="md:hidden ml-2 font-mono font-bold">Dashboard</span>
                    </Link>

                    <Link
                        href={`/doc/${docId}/preview`}
                        className={cn(
                            "w-10 h-10 flex items-center justify-center border-2 transition-all",
                            pathname?.includes('/preview') 
                                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                                : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'
                        )}
                        title="Preview Document"
                    >
                        <SlidersHorizontal size={20} />
                        <span className="md:hidden ml-2 font-mono font-bold">Preview</span>
                    </Link>
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
                        onClick={signOut}
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

            {/* Top Bar for Desktop */}
            <div className="hidden md:flex absolute top-0 right-0 h-14 bg-background/90 backdrop-blur-none border-b-2 border-black dark:border-white px-6 py-4 gap-4 z-50">
                <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </Button>
                <Link href={`/doc/${docId}/preview`}>
                    <Button variant="outline">
                        Preview
                    </Button>
                </Link>
                <Link href={`/s/${docId}`}>
                    <Button className="gap-2">
                        <SlidersHorizontal size={16}/> SHARE
                    </Button>
                </Link>
            </div>
        </div>
    );
}