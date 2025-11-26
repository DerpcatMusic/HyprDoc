
import React, { useRef, useState, useEffect } from 'react';
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from './ui-components';
import { Eraser, Check, Upload, Type, PenTool, X, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import SignaturePad from 'signature_pad';

interface SignatureWidgetProps {
    onSign: (dataUrl: string) => void;
    initialValue?: string;
    signatureId?: string;
    signedAt?: number;
}

export const SignatureWidget: React.FC<SignatureWidgetProps> = ({ onSign, initialValue, signatureId, signedAt }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pad, setPad] = useState<SignaturePad | null>(null);
    const [typedName, setTypedName] = useState('');
    const [activeTab, setActiveTab] = useState('draw');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialValue || null);

    // Theme monitoring
    useEffect(() => {
        if (!pad) return;

        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            // Update pen color for better visibility in dark mode
            pad.penColor = isDark ? '#FFFFFF' : '#000000';
        };

        updateTheme(); // Initial check

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, [pad]);

    // Initialize Signature Pad when Draw tab is active
    useEffect(() => {
        if (activeTab === 'draw' && canvasRef.current && !previewUrl) {
            const canvas = canvasRef.current;
            const resizeCanvas = () => {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d")?.scale(ratio, ratio);
                // Resizing clears the canvas, so we would lose data if we don't handle it. 
                // For this widget, clearing on resize is acceptable or we could store data.
            };

            window.addEventListener("resize", resizeCanvas);
            resizeCanvas();

            const newPad = new SignaturePad(canvas, {
                backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent to allow container bg to show
                penColor: document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000',
                velocityFilterWeight: 0.7,
                minWidth: 0.5,
                maxWidth: 2.5,
                throttle: 16, // Better performance
            });
            
            setPad(newPad);

            return () => {
                window.removeEventListener("resize", resizeCanvas);
                newPad.off();
            };
        }
    }, [activeTab, previewUrl]);

    const handleClear = () => {
        pad?.clear();
        setTypedName('');
        setUploadError(null);
        setPreviewUrl(null);
        onSign(''); 
    };

    const handleConfirmDraw = () => {
        if (pad && !pad.isEmpty()) {
            // Create temp canvas to add white/transparent background for consistency if needed
            const canvas = canvasRef.current;
            if(!canvas) return;
            
            // We export as PNG with transparency usually preferred for digital docs
            // But if you strictly need white background:
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const ctx = tempCanvas.getContext('2d');
            if(ctx) {
                // Check if we want dark or light background for the saved image
                // Usually signatures are saved on white or transparent. 
                // Let's keep it simple and just save the stroke.
                
                // If we want to enforce black stroke for the saved image regardless of dark mode viewing:
                const data = pad.toData();
                
                // Temporary switch to black for saving if in dark mode so document looks standard?
                // Or just save as is. Standard PDF signatures are usually black ink.
                const wasDark = pad.penColor === '#FFFFFF';
                if (wasDark) {
                     // Draw black on temp canvas
                     const tempPad = new SignaturePad(tempCanvas, {
                         penColor: '#000000',
                         minWidth: 0.5,
                         maxWidth: 2.5
                     });
                     tempPad.fromData(data);
                     const dataUrl = tempCanvas.toDataURL('image/png');
                     setPreviewUrl(dataUrl);
                     onSign(dataUrl);
                } else {
                    const dataUrl = pad.toDataURL('image/png');
                    setPreviewUrl(dataUrl);
                    onSign(dataUrl);
                }
            }
        }
    };

    const handleConfirmType = () => {
        if (!typedName) return;
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Transparent bg for typed signature usually better, but standardizing on white per previous code
            // ctx.fillStyle = '#FFFFFF';
            // ctx.fillRect(0, 0, 600, 150);
            
            ctx.font = "italic 60px 'Dancing Script', cursive";
            ctx.fillStyle = 'black'; // Always black for the official doc record
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(typedName, 300, 75);
            const dataUrl = canvas.toDataURL('image/png');
            setPreviewUrl(dataUrl);
            onSign(dataUrl);
        }
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setUploadError("File too large (max 5MB)");
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                setPreviewUrl(result);
                onSign(result);
            };
            reader.readAsDataURL(file);
        }
    };

    // View: Signed State (Locked)
    if (previewUrl) {
        return (
            <div className="relative group inline-flex flex-col gap-1">
                <div className="relative border border-green-600/30 bg-green-50/50 rounded-lg p-1 pr-20 min-w-[260px] h-20 flex items-center overflow-hidden dark:bg-green-900/20 dark:border-green-500/40 transition-all hover:shadow-md select-none">
                    <img src={previewUrl} alt="Signature" className="h-full object-contain max-w-[180px] mix-blend-multiply dark:mix-blend-normal dark:invert ml-2" />
                    
                    {/* Verified Stamp */}
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-green-100 via-green-50 to-transparent dark:from-green-900/40 dark:via-green-900/20" />
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center items-end text-[9px] text-green-700 dark:text-green-400 leading-tight border-l border-green-600/10 pl-2 pr-2 bg-white/50 dark:bg-black/10 backdrop-blur-[1px]">
                        <div className="font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                           <CheckCircle2 size={10} /> Verified
                        </div>
                        <div className="font-mono opacity-80 text-[8px]">{signatureId || 'ID: ' + Math.random().toString(36).substr(2, 8).toUpperCase()}</div>
                        <div className="opacity-80">{new Date(signedAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                </div>
                
                <button 
                    onClick={(e) => { e.preventDefault(); handleClear(); }}
                    className="text-[10px] text-muted-foreground hover:text-destructive underline text-right self-end"
                >
                    Clear & Redraw
                </button>
            </div>
        )
    }

    // View: Drawing/Input State
    return (
        <div className="border rounded-lg overflow-hidden bg-card shadow-sm w-full dark:border-zinc-800">
            <Tabs defaultValue="draw" onValueChange={setActiveTab} className="w-full">
                <div className="bg-muted/30 border-b p-1 dark:border-zinc-800">
                    <TabsList className="grid grid-cols-3 w-full h-8 bg-muted/50">
                        <TabsTrigger value="draw" className="text-xs h-7"><PenTool size={12} className="mr-2"/> Draw</TabsTrigger>
                        <TabsTrigger value="type" className="text-xs h-7"><Type size={12} className="mr-2"/> Type</TabsTrigger>
                        <TabsTrigger value="upload" className="text-xs h-7"><Upload size={12} className="mr-2"/> Upload</TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-950 min-h-[200px] flex flex-col justify-center">
                    <TabsContent value="draw" className="mt-0 h-full">
                        <div className="border-2 border-dashed border-indigo-100 rounded-md relative bg-white dark:bg-zinc-900 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors" style={{ height: '160px' }}>
                            <canvas 
                                ref={canvasRef} 
                                style={{ display: 'block', width: '100%', height: '100%' }}
                                className="absolute inset-0 touch-none cursor-crosshair"
                            />
                            <div className="absolute top-2 right-2 text-[9px] text-muted-foreground pointer-events-none opacity-50 select-none uppercase tracking-wider">Sign above</div>
                        </div>
                        <div className="flex justify-end mt-3 gap-2">
                             <Button variant="ghost" size="xs" onClick={() => pad?.clear()}>Clear</Button>
                             <Button size="xs" onClick={handleConfirmDraw} className="bg-indigo-600 hover:bg-indigo-700 text-white">Confirm Signature</Button>
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
                            <div className="h-24 flex items-center justify-center bg-zinc-50 border rounded-lg mb-4 dark:bg-zinc-900 dark:border-zinc-700 overflow-hidden">
                                {typedName ? (
                                    <span className="font-signature text-5xl text-black dark:text-white transform -rotate-2">{typedName}</span>
                                ) : (
                                    <span className="text-muted-foreground text-xs italic opacity-50">Preview will appear here</span>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button size="xs" onClick={handleConfirmType} disabled={!typedName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">Use This Signature</Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-0">
                        <div className="border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center relative hover:bg-indigo-50/30 transition-colors cursor-pointer border-zinc-200 dark:border-zinc-700 dark:hover:bg-indigo-900/10">
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
                            />
                        </div>
                        {uploadError && <p className="text-xs text-destructive mt-2 text-center font-medium">{uploadError}</p>}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};
