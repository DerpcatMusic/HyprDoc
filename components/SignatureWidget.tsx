import React, { useRef, useState, useEffect } from 'react';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Input, Label, cn } from './ui-components';
import { Eraser, Check, Upload, Type, PenTool, X } from 'lucide-react';

interface SignatureWidgetProps {
    onSign: (dataUrl: string) => void;
    initialValue?: string;
}

export const SignatureWidget: React.FC<SignatureWidgetProps> = ({ onSign, initialValue }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [typedName, setTypedName] = useState('');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialValue || null);
    
    // For Drawing Smoothness
    const [points, setPoints] = useState<{x: number, y: number}[]>([]);

    useEffect(() => {
        if (initialValue) setPreviewUrl(initialValue);
    }, [initialValue]);

    // DRAWING LOGIC
    const getCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        setPoints([{ x, y }]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        if (e.cancelable) e.preventDefault();
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const { x, y } = getCoords(e);
        const newPoints = [...points, { x, y }];
        setPoints(newPoints);

        // Smoothing: Quadratic Bezier
        if (newPoints.length > 2) {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             ctx.fillStyle = '#ffffff'; // Ensure white paper background
             ctx.fillRect(0,0, canvas.width, canvas.height);
             
             ctx.lineWidth = 3;
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             ctx.strokeStyle = '#000000'; // Always black ink
             
             ctx.beginPath();
             ctx.moveTo(newPoints[0].x, newPoints[0].y);
             
             for (let i = 1; i < newPoints.length - 2; i++) {
                 const c = (newPoints[i].x + newPoints[i + 1].x) / 2;
                 const d = (newPoints[i].y + newPoints[i + 1].y) / 2;
                 ctx.quadraticCurveTo(newPoints[i].x, newPoints[i].y, c, d);
             }
             
             // For the last 2 points
             ctx.quadraticCurveTo(
                 newPoints[newPoints.length - 2].x,
                 newPoints[newPoints.length - 2].y,
                 newPoints[newPoints.length - 1].x,
                 newPoints[newPoints.length - 1].y
             );
             ctx.stroke();
        }
    };

    const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(false);
        // Do NOT auto save on stop. Wait for explicit confirm.
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Re-fill white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0,0, canvas.width, canvas.height);
        }
        setPoints([]);
        setPreviewUrl(null);
    };

    const confirmSignature = () => {
         if (canvasRef.current) {
            const data = canvasRef.current.toDataURL('image/png');
            setPreviewUrl(data);
            onSign(data);
        }
    }

    // TYPING LOGIC
    const handleTypeChange = (val: string) => {
        setTypedName(val);
        // Generate Image from Text
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ffffff'; // White bg
            ctx.fillRect(0, 0, 600, 150);
            ctx.font = "60px 'Dancing Script', cursive";
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val, 300, 75);
            const data = canvas.toDataURL();
            setPreviewUrl(data);
            // Auto sign for typing is acceptable, or we could require button
            onSign(data);
        }
    };

    // UPLOAD LOGIC
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setUploadError(null);
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                setUploadError("File size must be less than 5MB");
                return;
            }
            if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
                setUploadError("Only PNG, JPG, or SVG allowed");
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const res = ev.target?.result as string;
                setPreviewUrl(res);
                onSign(res);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="border rounded-lg bg-card overflow-hidden shadow-sm dark:border-zinc-800">
            <Tabs defaultValue="draw" className="w-full">
                <div className="border-b bg-muted/40 p-1 dark:border-zinc-800">
                     <TabsList className="w-full grid grid-cols-3 bg-transparent h-8">
                         <TabsTrigger value="draw" className="text-xs data-[state=active]:bg-background"><PenTool size={12} className="mr-2"/> Draw</TabsTrigger>
                         <TabsTrigger value="type" className="text-xs data-[state=active]:bg-background"><Type size={12} className="mr-2"/> Type</TabsTrigger>
                         <TabsTrigger value="upload" className="text-xs data-[state=active]:bg-background"><Upload size={12} className="mr-2"/> Upload</TabsTrigger>
                     </TabsList>
                </div>

                <div className="p-4">
                    <TabsContent value="draw" className="mt-0">
                         <div className="relative border-2 border-dashed rounded-md bg-white overflow-hidden touch-none" style={{ height: '200px' }}>
                             <canvas
                                ref={canvasRef}
                                width={800}
                                height={400} // Higher res for better scaling
                                style={{ width: '100%', height: '100%' }}
                                className="cursor-crosshair bg-white"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                             />
                             <div className="absolute top-2 right-2 flex gap-2 z-10">
                                <Button size="xs" variant="secondary" onClick={clearCanvas} className="h-6 bg-white/80 backdrop-blur border shadow-sm text-foreground hover:bg-white text-destructive hover:text-destructive">
                                    <Eraser size={12} className="mr-1"/> Clear
                                </Button>
                             </div>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                                <Button size="sm" onClick={confirmSignature} className="h-8 shadow-md">
                                    <Check size={14} className="mr-1"/> Accept Signature
                                </Button>
                             </div>

                             {points.length === 0 && !previewUrl && (
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/30 font-signature text-2xl">
                                     Sign here...
                                 </div>
                             )}
                         </div>
                         <div className="mt-2 text-[10px] text-muted-foreground flex justify-between items-center">
                             <span>Draw your signature using your mouse or finger.</span>
                             <span className="font-semibold text-primary">Click Accept to save.</span>
                         </div>
                    </TabsContent>

                    <TabsContent value="type" className="mt-0 space-y-4">
                        <div className="space-y-2">
                            <Label>Full Legal Name</Label>
                            <Input 
                                value={typedName} 
                                onChange={(e) => handleTypeChange(e.target.value)}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        {typedName && (
                            <div className="p-6 bg-white border rounded-md text-center">
                                <div className="font-signature text-4xl">{typedName}</div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="upload" className="mt-0 space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center hover:bg-muted/10 transition-colors text-center">
                            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium mb-1">Click to Upload Signature</p>
                            <p className="text-xs text-muted-foreground mb-4">PNG, JPG or SVG (Max 5MB)</p>
                            <Input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleUpload} />
                            {uploadError && <p className="text-xs text-destructive mt-2">{uploadError}</p>}
                        </div>
                        {previewUrl && (
                            <div className="mt-4 p-2 border rounded bg-white">
                                <img src={previewUrl} alt="Preview" className="max-h-24 mx-auto object-contain" />
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};