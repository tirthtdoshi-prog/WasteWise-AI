import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  AlertCircle,
  Upload,
  RefreshCw,
  Recycle,
  Leaf,
  Trash2,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import type { ClassificationResult, SampleWasteItem } from '../types/waste';
import { SAMPLE_WASTE_ITEMS, getCategoryStyle } from '../data/wasteData';

interface ClassifierWorkspaceProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  previewUrl: string | null;
  sourceLabel: string;
  isLoading: boolean;
  error: string | null;
  result: ClassificationResult | null;
  lastScanTime: string | null;
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleWasteItem) => void;
  onReanalyze: () => void;
  onCaptureDataUrl: (dataUrl: string, label: string, silent?: boolean) => void;
}

export const ClassifierWorkspace: React.FC<ClassifierWorkspaceProps> = ({
  fileInputRef,
  previewUrl,
  sourceLabel,
  isLoading,
  error,
  result,
  lastScanTime,
  onFileSelected,
  onSampleSelected,
  onReanalyze,
  onCaptureDataUrl,
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'realtime'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoScan, setAutoScan] = useState(true);
  const [countdown, setCountdown] = useState(4);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Real-time camera access is unavailable in this browser context. Switch to Photo Upload or test a sample below.'
      );
      setCameraActive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setCameraError(
        'Camera permission was denied or no camera device was detected. You can still upload images or click any sample below.'
      );
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (inputMode === 'realtime') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputMode]);

  const captureVideoFrame = (silent = false) => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || isLoadingRef.current) return;

    const maxEdge = 896;
    const vw = video.videoWidth || 800;
    const vh = video.videoHeight || 600;
    const scale = Math.min(1, maxEdge / Math.max(vw, vh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(vw * scale));
    canvas.height = Math.max(1, Math.round(vh * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const nowLabel = `Live Camera · ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
    onCaptureDataUrl(dataUrl, nowLabel, silent);
  };

  useEffect(() => {
    if (inputMode !== 'realtime' || !cameraActive || !autoScan) {
      setCountdown(4);
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (!isLoadingRef.current) {
            captureVideoFrame(true);
          }
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [inputMode, cameraActive, autoScan]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setInputMode('upload');
      onFileSelected(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputMode('upload');
      onFileSelected(file);
    }
    e.target.value = '';
  };

  const categoryStyle = result ? getCategoryStyle(result.category) : null;

  return (
    <section id="classifier" className="pt-10 pb-14 border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-9">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-emerald-700 tracking-wide mb-2">
              Real-Time Computer Vision · Deep Material &amp; Reuse Intelligence
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] [text-wrap:balance]">
              Smart waste analysis built for real human action
            </h1>
            <p className="mt-3.5 text-base text-slate-600 leading-relaxed max-w-2xl">
              Upload a photo or switch to real-time camera scanning to uncover exact material grade,
              step-by-step preparation instructions, products made after recycling, and practical DIY
              reuse ideas.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Scanner input mode"
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'upload'}
              onClick={() => setInputMode('upload')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Photo Upload</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'realtime'}
              onClick={() => setInputMode('realtime')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                inputMode === 'realtime'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Real-Time Camera</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleInputChange}
          aria-label="Upload waste image"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Upload / Real-Time Camera Viewport & Samples */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative aspect-[4/3] w-full rounded-xl border overflow-hidden transition-colors bg-slate-50 ${
                isDragging ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200'
              }`}
            >
              {inputMode === 'realtime' ? (
                <div className="absolute inset-0 bg-slate-950 flex flex-col justify-between text-white">
                  {cameraError ? (
                    <div className="my-auto text-center px-8">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-sm text-slate-200 leading-relaxed mb-5">{cameraError}</p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                        >
                          Retry Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputMode('upload')}
                          className="px-4 py-2 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
                        >
                          Switch to Photo Upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 top-0 p-3.5 bg-gradient-to-b from-slate-950/75 to-transparent flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 text-xs font-medium text-white">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              cameraActive ? 'bg-emerald-400' : 'bg-slate-400'
                            }`}
                            aria-hidden="true"
                          />
                          <span>
                            {autoScan
                              ? `Live Auto-Scan · Next frame in ${countdown}s`
                              : 'Live Camera · Manual trigger'}
                          </span>
                        </div>
                        {lastScanTime && (
                          <span className="font-mono tabular-nums text-xs text-slate-300">
                            Last scan {lastScanTime}
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setAutoScan((prev) => !prev)}
                          className="px-3.5 py-2 text-xs font-medium bg-white/15 hover:bg-white/25 text-white rounded-lg backdrop-blur-xs cursor-pointer"
                        >
                          {autoScan ? 'Pause Auto-Scan' : 'Resume Auto-Scan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => captureVideoFrame(false)}
                          disabled={isLoading || !cameraActive}
                          className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                        >
                          {isLoading ? 'Analyzing Frame...' : 'Scan Frame Now'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : previewUrl && !brokenImageIds['preview'] ? (
                <>
                  <img
                    src={previewUrl}
                    alt={sourceLabel || 'Uploaded waste sample'}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImageIds((prev) => ({ ...prev, preview: true }))
                    }
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent p-4 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300">Active Sample</p>
                      <p className="text-sm font-medium text-white truncate">{sourceLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium bg-white text-slate-900 hover:bg-slate-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Replace Photo
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center p-8 text-center hover:bg-slate-100/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4">
                    <Upload className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                  </div>
                  <p className="font-display text-base font-semibold text-slate-900">
                    Drop a waste image here, or browse files
                  </p>
                  <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
                    Supports JPG, PNG, and WEBP photos of bottles, packaging, cans, glass jars, or
                    food scraps.
                  </p>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('upload');
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  <span>Choose Image</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInputMode((prev) => (prev === 'realtime' ? 'upload' : 'realtime'))
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  <span>{inputMode === 'realtime' ? 'Stop Camera' : 'Real-Time Camera'}</span>
                </button>
              </div>

              {previewUrl && inputMode === 'upload' && (
                <button
                  type="button"
                  onClick={onReanalyze}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Re-run Analysis</span>
                </button>
              )}
            </div>

            {/* 5 Photographic Quick-Test Samples */}
            <div className="pt-2">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs font-medium text-slate-700">
                  Quick-Test Photographic Samples
                </span>
                <span className="text-xs text-slate-500">Click any item for deep analysis</span>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {SAMPLE_WASTE_ITEMS.map((sample) => {
                  const isActive = previewUrl === sample.imageUrl;
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => {
                        setInputMode('upload');
                        setBrokenImageIds((prev) => ({ ...prev, preview: false }));
                        onSampleSelected(sample);
                      }}
                      className={`group text-left rounded-lg border overflow-hidden transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                        isActive
                          ? 'border-emerald-600 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                        {brokenImageIds[sample.id] ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-xs font-medium text-slate-500 p-1 text-center">
                            {sample.category}
                          </div>
                        ) : (
                          <img
                            src={sample.imageUrl}
                            alt={sample.title}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenImageIds((prev) => ({
                                ...prev,
                                [sample.id]: true,
                              }))
                            }
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                          />
                        )}
                      </div>
                      <div className="px-2 py-1.5 bg-white">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {sample.category}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Immediate Classification & Human Action Checklist */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between">
              {isLoading && !result ? (
                <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1">
                      <div className="h-3.5 w-44 bg-slate-200 rounded" />
                      <div className="h-8 w-56 bg-slate-200 rounded" />
                      <div className="h-4 w-48 bg-slate-100 rounded" />
                    </div>
                    <div className="h-12 w-24 bg-slate-200 rounded" />
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="h-4 w-44 bg-slate-200 rounded" />
                    <div className="h-4 w-full bg-slate-100 rounded" />
                    <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  </div>
                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 w-full bg-slate-100 rounded" />
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="my-auto py-8">
                  <div className="flex items-start gap-3 text-rose-700 mb-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h2 className="font-display text-lg font-semibold text-slate-900">
                        Classification Failed
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">{error}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={onReanalyze}
                        className="px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      Upload Another Image
                    </button>
                  </div>
                </div>
              ) : result && categoryStyle ? (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                      <div className="flex items-center gap-2">
                        <span>{result.materialGrade}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {result.compostable
                            ? 'Compostable'
                            : result.recyclable
                              ? 'Recyclable'
                              : 'General Stream'}
                        </span>
                      </div>
                      {typeof result.analysisMs === 'number' && (
                        <span className="font-mono tabular-nums text-slate-500">
                          {isLoading
                            ? 'Updating...'
                            : `${(result.analysisMs / 1000).toFixed(2)}s`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
                          {result.category}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                          {result.itemDetected}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-500">Confidence</p>
                        <p className="font-mono tabular-nums text-3xl font-semibold text-slate-900">
                          {result.confidence}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${categoryStyle.barColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, result.confidence))}%` }}
                      />
                    </div>
                  </div>

                  {/* Disposal Instruction */}
                  <div className="pt-4 border-t border-slate-100 flex items-start gap-3">
                    {result.compostable ? (
                      <Leaf className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                    ) : result.recyclable ? (
                      <Recycle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Where It Goes · {result.binType}
                      </p>
                      <p className="mt-1 text-sm text-slate-900 leading-relaxed">
                        {result.disposalRecommendation}
                      </p>
                    </div>
                  </div>

                  {/* Human Action Steps */}
                  {result.humanActionSteps && result.humanActionSteps.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-2.5">
                        What You Should Do Right Now
                      </p>
                      <ol className="space-y-2">
                        {result.humanActionSteps.map((step, idx) => (
                          <li key={step} className="flex items-start gap-2.5 text-sm text-slate-800">
                            <span className="font-mono tabular-nums text-xs font-medium text-emerald-700 mt-0.5 shrink-0">
                              0{idx + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Health, Safety & Practical Value */}
                  {result.humanSafetyAndValue && (
                    <div className="pt-4 border-t border-slate-100 flex items-start gap-3">
                      <ShieldCheck
                        className="w-5 h-5 text-slate-700 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Human Safety &amp; Value Tip
                        </p>
                        <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                          {result.humanSafetyAndValue}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <a
                      href="#recycled-outcomes"
                      className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline underline-offset-4"
                    >
                      View recycled products &amp; visual guide
                    </a>
                    <a
                      href="#diy-ideas"
                      className="font-medium text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                    >
                      See DIY home reuse ideas
                    </a>
                  </div>
                </div>
              ) : (
                <div className="my-auto py-8">
                  <p className="text-xs font-medium text-slate-500 mb-2">Awaiting Waste Sample</p>
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    Deep human-focused waste analysis
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-md">
                    Upload an image, enable real-time camera scanning, or test a sample photo on the
                    left to reveal:
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-700 font-mono text-xs">01.</span>
                      <span>Material grade, decomposition timeline, and energy savings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-700 font-mono text-xs">02.</span>
                      <span>Step-by-step preparation checklist &amp; human safety tips</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-700 font-mono text-xs">03.</span>
                      <span>Visual showcase of new products made after recycling</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-700 font-mono text-xs">04.</span>
                      <span>Practical DIY &amp; upcycling ideas you can build at home</span>
                    </li>
                  </ul>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => onSampleSelected(SAMPLE_WASTE_ITEMS[0])}
                      className="px-4 py-2.5 text-sm font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      Analyze Plastic Bottle Sample
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
