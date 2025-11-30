
import React, { useState } from 'react';
import { SupabaseService } from '../services/supabase';
import { Button, Input, Label, Card } from './ui-components';
import { Hexagon, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await SupabaseService.auth.signUp(email, password);
                if (error) throw error;
                setMessage('Account created! Please check your email to confirm.');
            } else {
                const { error } = await SupabaseService.auth.signIn(email, password);
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto mb-4 shadow-sharp dark:shadow-sharp-dark">
                        <Hexagon size={28} strokeWidth={3} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight font-mono uppercase mb-2">HyprDoc</h1>
                    <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest">
                        Structuralist Document Engine
                    </p>
                </div>

                <Card className="p-8 shadow-2xl bg-white dark:bg-black border-2 border-black dark:border-white">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 mb-6 text-xs font-bold border border-red-200 flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 text-green-600 p-3 mb-6 text-xs font-bold border border-green-200 flex items-center gap-2">
                            <ArrowRight size={16} />
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="h-11"
                                minLength={6}
                            />
                        </div>

                        <div className="pt-2">
                            <Button className="w-full h-11 text-base" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Sign Up' : 'Log In')}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 pt-6 border-t border-dashed border-black/10 dark:border-white/10 text-center">
                        <button 
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                        >
                            {isSignUp ? "Already have an account? Log In" : "New to HyprDoc? Create Account"}
                        </button>
                    </div>
                </Card>
                
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-muted-foreground font-mono">
                        SECURED BY SUPABASE
                    </p>
                </div>
            </div>
        </div>
    );
};
