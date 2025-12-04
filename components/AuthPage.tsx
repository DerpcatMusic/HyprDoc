
import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Hexagon } from 'lucide-react';

// Custom theme to match the app's brutalist aesthetic
const clerkAppearance = {
    layout: {
        socialButtonsPlacement: 'bottom' as const,
        privacyPageUrl: 'https://clerk.com/privacy',
        termsPageUrl: 'https://clerk.com/terms',
    },
    variables: {
        borderRadius: '0px',
        colorPrimary: '#7c3aed', // Primary Purple
        fontFamily: '"JetBrains Mono", monospace',
        colorText: '#000000',
        colorBackground: '#ffffff',
    },
    elements: {
        card: "shadow-sharp border-2 border-black rounded-none bg-white",
        headerTitle: "font-black uppercase tracking-tighter text-xl",
        headerSubtitle: "font-mono text-xs text-muted-foreground uppercase tracking-widest",
        socialButtonsBlockButton: "rounded-none border-2 border-black hover:bg-black/5 shadow-sm font-mono text-xs font-bold uppercase",
        formButtonPrimary: "rounded-none border-2 border-black bg-black text-white hover:bg-primary hover:text-white hover:border-primary shadow-sharp hover:shadow-sharp-hover transition-all duration-200 font-mono text-xs font-bold uppercase tracking-wider",
        formFieldInput: "rounded-none border-2 border-black/20 focus:border-black transition-colors font-mono text-sm bg-transparent",
        footerActionLink: "text-primary hover:text-black font-bold uppercase text-[10px] tracking-wider",
        formFieldLabel: "uppercase text-[10px] font-bold tracking-widest text-muted-foreground",
        // Hide the default footer to use our custom toggle
        footerAction: "hidden"
    }
};

export const AuthPage: React.FC = () => {
    const [isSignUp, setIsSignUp] = React.useState(false);

    // ROBUST REDIRECT STRATEGY
    // We use window.location.origin + pathname to ensure we stay on the correct hosted path (handling proxies/subfolders).
    // We avoid window.location.href because it might contain hash params (#) which confuse Clerk's redirect.
    // The hash router in App.tsx will handle the default view (#dashboard) once we land back on the app.
    const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}${window.location.pathname}`
        : undefined;

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/10 bg-grid-pattern p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto mb-4 shadow-sharp dark:shadow-sharp-dark">
                        <Hexagon size={28} strokeWidth={3} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight font-mono uppercase mb-2">HyprDoc</h1>
                    <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest">
                        Structuralist Document Engine
                    </p>
                </div>

                <div className="w-full flex justify-center">
                    {/* routing="virtual" ensures Clerk doesn't try to pushState to the browser history, avoiding conflicts with hash routing */}
                    {isSignUp ? (
                        <SignUp 
                            appearance={clerkAppearance} 
                            routing="virtual" 
                            forceRedirectUrl={redirectUrl}
                            fallbackRedirectUrl={redirectUrl}
                            signInUrl={redirectUrl}
                        />
                    ) : (
                        <SignIn 
                            appearance={clerkAppearance} 
                            routing="virtual" 
                            forceRedirectUrl={redirectUrl}
                            fallbackRedirectUrl={redirectUrl}
                            signUpUrl={redirectUrl}
                        />
                    )}
                </div>
                
                {/* Custom Toggle Footer */}
                <div className="mt-6 text-center bg-white border-2 border-black p-3 shadow-sm w-full max-w-[300px]">
                    <button 
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-xs font-mono font-bold uppercase hover:text-primary transition-colors flex items-center justify-center gap-2 w-full"
                    >
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}
                        <span className="underline decoration-2 underline-offset-4 decoration-primary">
                            {isSignUp ? "Sign In" : "Sign Up"}
                        </span>
                    </button>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-muted-foreground font-mono">
                        POWERED BY CLERK
                    </p>
                </div>
            </div>
        </div>
    );
};
