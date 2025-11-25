
import React, { useState } from 'react';
import { Button, Input, Label, Card } from './ui-components';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

interface AccessGateProps {
    documentTitle: string;
    onAccessGranted: (email: string) => void;
}

export const AccessGate: React.FC<AccessGateProps> = ({ documentTitle, onAccessGranted }) => {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call to send OTP
        setTimeout(() => {
            setIsLoading(false);
            setStep('otp');
        }, 1500);
    };

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate OTP verification
        setTimeout(() => {
            if (otp === '123456') { // Mock OTP
                setIsLoading(false);
                onAccessGranted(email);
            } else {
                alert('Invalid Code (Try 123456)');
                setIsLoading(false);
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md p-8 space-y-8 shadow-2xl dark:border-zinc-800">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Secure Access</h1>
                    <p className="text-muted-foreground text-sm">
                        You have been invited to view and sign <br/>
                        <span className="font-semibold text-foreground">{documentTitle}</span>
                    </p>
                </div>

                {step === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-4 animate-in slide-in-from-right duration-300">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="email" 
                                    placeholder="name@company.com" 
                                    className="pl-9" 
                                    required 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button className="w-full" disabled={isLoading}>
                            {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in slide-in-from-right duration-300">
                        <div className="space-y-2">
                            <Label>Verification Code</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="123456" 
                                    className="pl-9 tracking-widest font-mono text-center text-lg" 
                                    required 
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center">Check your email for the code.</p>
                        </div>
                        <Button className="w-full" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Access Document'} <ArrowRight size={16} className="ml-2" />
                        </Button>
                        <button type="button" onClick={() => setStep('email')} className="text-xs text-center w-full text-muted-foreground hover:underline">
                            Change Email
                        </button>
                    </form>
                )}
                
                <div className="pt-6 border-t text-center dark:border-zinc-800">
                     <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                         <Lock size={10} /> End-to-End Encrypted
                     </p>
                </div>
            </Card>
        </div>
    );
};
