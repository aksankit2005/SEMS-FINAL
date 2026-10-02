import React, { useState, useRef, useEffect } from 'react';
import { Crop, ZoomIn, ZoomOut, RotateCcw, Check, X, Sparkles, Image as ImageIcon } from 'lucide-react';

export const ImageCropperModal = ({ 
  imageSrc, 
  onClose, 
  onCropComplete,
  onUseOriginal = null,
  aspectRatio = '16:9', // '16:9' | '1:1'
  shape = 'banner', // 'banner' | 'square' | 'circle'
  title = 'Crop & Resize Image',
  subtitle = 'Drag to reposition or zoom to frame perfectly',
  cropButtonLabel = 'Save Cropped Photo',
  skipButtonLabel = 'Use Original (No Crop)'
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const isSquare = aspectRatio === '1:1';

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
  }, [imageSrc]);

  useEffect(() => {
    if (imgRef.current) {
      renderCanvas();
    }
  }, [zoom, offset, aspectRatio]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    // Output dimension based on aspect ratio
    if (isSquare) {
      canvas.width = 600;
      canvas.height = 600;
    } else {
      canvas.width = 800;
      canvas.height = 450;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX + offset.x, centerY + offset.y);
    ctx.scale(zoom, zoom);

    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support for Mobile / Tablet Devices
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleCropSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  const handleSkipToOriginal = () => {
    if (onUseOriginal) {
      onUseOriginal(imageSrc);
    } else {
      onCropComplete(imageSrc);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-fade-in font-sans">
      <div className={`w-full ${isSquare ? 'max-w-lg' : 'max-w-2xl'} bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4`}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isSquare ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-indigo-500/10 text-blue-600 dark:text-indigo-400'}`}>
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {title}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Preview Box */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className={`relative w-full ${isSquare ? 'max-w-[320px] aspect-square mx-auto rounded-3xl' : 'aspect-video rounded-2xl'} bg-slate-900 overflow-hidden border-2 border-dashed ${isSquare ? 'border-emerald-500/50' : 'border-blue-500/40'} cursor-grab active:cursor-grabbing flex items-center justify-center shadow-inner select-none`}
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
          
          {/* Circular Face Guide Overlay for 1:1 Avatar */}
          {isSquare && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-center justify-center">
                <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Face Centering Guide
                </span>
              </div>
            </div>
          )}

          {!isSquare && (
            <div className="absolute inset-0 border-2 border-blue-500/30 dark:border-indigo-500/30 pointer-events-none flex items-center justify-center">
              <span className="text-[10px] font-mono text-blue-400 dark:text-indigo-400/60 uppercase bg-slate-950/60 px-2 py-1 rounded-full">
                Preview Banner Area (16:9)
              </span>
            </div>
          )}
        </div>

        {/* Zoom & Reset Control Bar */}
        <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">Zoom:</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 max-w-[160px] accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 transition cursor-pointer ml-1"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Modal Action Buttons: Both Crop and Use Original */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Option to Skip / Use Original photo as-is */}
            {onUseOriginal && (
              <button
                type="button"
                onClick={handleSkipToOriginal}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Keep original uncropped image"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{skipButtonLabel}</span>
              </button>
            )}

            {/* Option to Crop & Save */}
            <button
              type="button"
              onClick={handleCropSave}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl ${isSquare ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer`}
            >
              <Check className="w-4 h-4" /> 
              <span>{cropButtonLabel}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


