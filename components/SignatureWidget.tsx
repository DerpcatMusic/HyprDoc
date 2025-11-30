import React, { useRef, useState, useEffect } from 'react';
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger, Checkbox, Label } from './ui-components';
import { Eraser, Check, Upload, Type, PenTool, X, CheckCircle2, Image as ImageIcon, Loader2, ShieldCheck } from 'lucide-react';
import SignaturePad from 'signature_pad';
import { useDocument } from '../context/DocumentContext';

interface SignatureWidgetProps {
    onSign: (dataUrl: string) => void;
    initialValue?: string | undefined;
    signatureId?: string | undefined;
    signedAt?: number | undefined;
    disabled?: boolean | undefined;
}

export const SignatureWidget: React.FC<SignatureWidgetProps> = ({ onSign, initialValue, signatureId, signedAt, disabled }) => {
    const { uploadAsset } = useDocument();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pad, setPad] = useState<SignaturePad | null>(null);
    const [typedName, setTypedName] = useState('');
    const [activeTab, setActiveTab] = useState('draw');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialValue || null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasConsented, setHasConsented] = useState(false);

    // Sync initialValue if it changes externally
    useEffect(() => {
        if (initialValue !== previewUrl) {
            setPreviewUrl(initialValue || null);
        }
    }, [initialValue]);

    // Initialize Signature Pad
    useEffect(() => {
        if (activeTab === 'draw' && canvasRef.current && !previewUrl && !disabled) {
            const canvas = canvasRef.current;
            const resizeCanvas = () => {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d")?.scale(ratio, ratio);
            };

            window.addEventListener("resize", resizeCanvas);
            resizeCanvas();

            const newPad = new SignaturePad(canvas, {
                backgroundColor: 'rgba(255, 255, 255, 0)',
                penColor: document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000',
                velocityFilterWeight: 0.7,
                minWidth: 0.5,
                maxWidth: 2.5,
                throttle: 16,
            });
            
            setPad(newPad);

            return () => {
                window.removeEventListener("resize", resizeCanvas);
                newPad.off();
            };
        }
    }, [activeTab, previewUrl, disabled]);

    const handleClear = () => {
        if (disabled) return;
        pad?.clear();
        setTypedName('');
        setUploadError(null);
        setPreviewUrl(null);
        setHasConsented(false);
        onSign(''); 
    };

    // --- REAL UPLOAD LOGIC ---
    const processAndUpload = async (blob: Blob) => {
        if (!hasConsented || disabled) return;
        setIsSaving(true);
        try {
            const fileName = `signatures/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
            const publicUrl = await uploadAsset(blob, fileName);
            
            if (publicUrl) {
                setPreviewUrl(publicUrl);
                // Important: We pass the URL back up, Viewer handles the DB transaction
                onSign(publicUrl); 
            }
        } catch (e) {
            console.error("Failed to upload signature", e);
            setUploadError("Failed to save signature. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDraw = () => {
        if (pad && !pad.isEmpty() && hasConsented && !disabled) {
            const canvas = canvasRef.current;
            if(!canvas) return;
            canvas.toBlob((blob) => {
                if (blob) processAndUpload(blob);
            }, 'image/png');
        }
    };

    const handleConfirmType = () => {
        if (!typedName || !hasConsented || disabled) return;
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.font = "italic 60px 'Dancing Script', cursive";
            ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(typedName, 300, 75);
            
            canvas.toBlob((blob) => {
                if(blob) processAndUpload(blob);
            }, 'image/png');
        }
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && hasConsented && !disabled) {
            if (file.size > 5 * 1024 * 1024) {
                setUploadError("File too large (max 5MB)");
                return;
            }
            processAndUpload(file);
        }
    };

    // View: Signed State (Locked)
    if (previewUrl) {
        return (
            <div className="relative group inline-flex flex-col gap-1">
                <div className="relative border-2 border-green-600/30 bg-green-50/50 rounded-none p-1 pr-20 min-w-[260px] h-20 flex items-center overflow-hidden dark:bg-green-900/20 dark:border-green-500/40 transition-all select-none">
                    <img src={previewUrl} alt="Signature" className="h-full object-contain max-w-[180px] mix-blend-multiply dark:mix-blend-normal dark:invert ml-2" />
                    
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-green-100 via-green-50 to-transparent dark:from-green-900/40 dark:via-green-900/20" />
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center items-end text-[9px] text-green-700 dark:text-green-400 leading-tight border-l border-green-600/10 pl-2 pr-2 bg-white/50 dark:bg-black/10 backdrop-blur-[1px]">
                        <div className="font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                           <CheckCircle2 size={10} /> Verified
                        </div>
                        <div className="font-mono opacity-80 text-[8px]">{signatureId || 'ID: ' + Math.random().toString(36).substr(2, 8).toUpperCase()}</div>
                        <div className="opacity-80">{new Date(signedAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                </div>
                
                {!signedAt && !disabled && (
                <button 
                    onClick={(e) => { e.preventDefault(); handleClear(); }}
                    className="text-[10px] text-muted-foreground hover:text-destructive underline text-right self-end"
                >
                    Clear & Redraw
                </button>
                )}
            </div>
        )
    }

    if (disabled) {
        return (
            <div className="h-20 w-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-muted-foreground text-xs uppercase font-mono tracking-widest cursor-not-allowed">
                Signature Locked
            </div>
        );
    }

    // View: Drawing/Input State
    return (
        <div className="border-2 rounded-none overflow-hidden bg-card shadow-sm w-full dark:border-zinc-800 relative">
             {isSaving && (
                 <div className="absolute inset-0 z-50 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center animate-in fade-in">
                     <Loader2 size={24} className="animate-spin text-primary mb-2" />
                     <span className="text-xs font-mono font-bold uppercase">Securing Signature...</span>
                 </div>
             )}

            <Tabs defaultValue="draw" onValueChange={setActiveTab} className="w-full">
                <div className="bg-muted/30 border-b p-1 dark:border-zinc-800">
                    <TabsList className="grid grid-cols-3 w-full h-8 bg-muted/50">
                        <TabsTrigger value="draw" className="text-xs h-7 rounded-none"><PenTool size={12} className="mr-2"/> Draw</TabsTrigger>
                        <TabsTrigger value="type" className="text-xs h-7 rounded-none"><Type size={12} className="mr-2"/> Type</TabsTrigger>
                        <TabsTrigger value="upload" className="text-xs h-7 rounded-none"><Upload size={12} className="mr-2"/> Upload</TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-950 min-h-[200px] flex flex-col justify-center">
                    <TabsContent value="draw" className="mt-0 h-full">
                        <div className="border-2 border-dashed border-indigo-100 rounded-none relative bg-white dark:bg-zinc-900 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors" style={{ height: '160px' }}>
                            <canvas 
                                ref={canvasRef} 
                                style={{ display: 'block', width: '100%', height: '100%' }}
                                className="absolute inset-0 touch-none cursor-crosshair"
                            />
                            <div className="absolute top-2 right-2 text-[9px] text-muted-foreground pointer-events-none opacity-50 select-none uppercase tracking-wider">Sign above</div>
                        </div>
                        
                        <div className="mt-4 border-t pt-4 border-dashed">
                             <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => !disabled && setHasConsented(!hasConsented)}>
                                 <Checkbox checked={hasConsented} onCheckedChange={setHasConsented} id="consent-draw" disabled={disabled} />
                                 <Label className="cursor-pointer mb-0" htmlFor="consent-draw">I agree to be legally bound by this electronic signature.</Label>
                             </div>
                             <div className="flex justify-end gap-2">
                                 <Button variant="ghost" size="xs" onClick={() => pad?.clear()}>Clear</Button>
                                 <Button size="xs" onClick={handleConfirmDraw} disabled={!hasConsented || (pad?.isEmpty() ?? true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">Confirm Signature</Button>
                             </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="type" className="mt-0">
                        <div className="space-y-4">
                            <Input 
                                value={typedName}
                                onChange={(e) => setTypedName(e.target.value)}
                                placeholder="Type your full legal name"
                                className="text-lg py-6 dark:bg-zinc-900 dark:border-zinc-700"
                                autoFocus
                            />
                            <div className="h-24 flex items-center justify-center bg-zinc-50 border rounded-none mb-4 dark:bg-zinc-900 dark:border-zinc-700 overflow-hidden">
                                {typedName ? (
                                    <span className="font-signature text-5xl text-black dark:text-white transform -rotate-2">{typedName}</span>
                                ) : (
                                    <span className="text-muted-foreground text-xs italic opacity-50">Preview will appear here</span>
                                )}
                            </div>
                            
                            <div className="mt-4 border-t pt-4 border-dashed">
                                 <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => !disabled && setHasConsented(!hasConsented)}>
                                     <Checkbox checked={hasConsented} onCheckedChange={setHasConsented} id="consent-type" disabled={disabled} />
                                     <Label className="cursor-pointer mb-0" htmlFor="consent-type">I agree to be legally bound by this electronic signature.</Label>
                                 </div>
                                 <div className="flex justify-end">
                                     <Button size="xs" onClick={handleConfirmType} disabled={!typedName.trim() || !hasConsented} className="bg-indigo-600 hover:bg-indigo-700 text-white">Use This Signature</Button>
                                 </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-0">
                        <div className="border-2 border-dashed rounded-none h-48 flex flex-col items-center justify-center relative hover:bg-indigo-50/30 transition-colors cursor-pointer border-zinc-200 dark:border-zinc-700 dark:hover:bg-indigo-900/10">
                            <div className="p-4 bg-indigo-50 rounded-full mb-3 dark:bg-indigo-900/20">
                                <ImageIcon className="h-6 w-6 text-indigo-500" />
                            </div>
                            <p className="text-sm font-medium">Click to upload image</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG or JPG (max 5MB)</p>
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                accept="image/png, image/jpeg"
                                onChange={handleUpload}
                                disabled={!hasConsented || disabled}
                            />
                            {(!hasConsented || disabled) && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 cursor-not-allowed z-10" />}
                        </div>
                        
                        <div className="mt-4 flex items-center gap-2 justify-center">
                             <Checkbox checked={hasConsented} onCheckedChange={setHasConsented} id="consent-upload" disabled={disabled} />
                             <Label className="cursor-pointer mb-0" htmlFor="consent-upload">I agree to be legally bound by this electronic signature.</Label>
                        </div>
                        
                        {uploadError && <p className="text-xs text-destructive mt-2 text-center font-medium">{uploadError}</p>}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};