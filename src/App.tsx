import React, { useRef, useState } from 'react';
import { Header } from './components/Header';
import { ClassifierWorkspace } from './components/ClassifierWorkspace';
import { DeepAnalysisSection } from './components/DeepAnalysisSection';
import type { ClassificationResult, SampleWasteItem } from './types/waste';

function compressImageDataUrl(
  rawDataUrl: string,
  maxEdge = 896,
  quality = 0.85
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      const scale = Math.min(1, maxEdge / Math.max(naturalWidth, naturalHeight));
      const targetW = Math.max(1, Math.round(naturalWidth * scale));
      const targetH = Math.max(1, Math.round(naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ dataUrl: rawDataUrl, mimeType: 'image/jpeg' });
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      resolve({
        dataUrl: canvas.toDataURL('image/jpeg', quality),
        mimeType: 'image/jpeg',
      });
    };
    img.onerror = () => resolve({ dataUrl: rawDataUrl, mimeType: 'image/jpeg' });
    img.src = rawDataUrl;
  });
}

async function imageUrlToDataUrl(url: string): Promise<{ dataUrl: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not load selected sample image.');
  }
  const blob = await response.blob();
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image data.'));
    reader.readAsDataURL(blob);
  });
  return compressImageDataUrl(rawDataUrl);
}

async function fileToDataUrl(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read uploaded image file.'));
    reader.readAsDataURL(file);
  });
  return compressImageDataUrl(rawDataUrl);
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activePayload, setActivePayload] = useState<{
    dataUrl: string;
    mimeType: string;
    label: string;
  } | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const classifyImage = async (
    imageBase64: string,
    mimeType: string,
    silent = false
  ) => {
    setIsLoading(true);
    if (!silent) {
      setError(null);
    }

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Classification request failed.');
      }

      setResult(data as ClassificationResult);
      setError(null);
      setLastScanTime(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to classify image. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
      const { dataUrl, mimeType } = await fileToDataUrl(file);
      setPreviewUrl(dataUrl);
      setSourceLabel(file.name);
      setActivePayload({ dataUrl, mimeType, label: file.name });
      await classifyImage(dataUrl, mimeType);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process selected file.');
    }
  };

  const handleSampleSelected = async (sample: SampleWasteItem) => {
    setPreviewUrl(sample.imageUrl);
    setSourceLabel(sample.title);
    setError(null);
    setIsLoading(true);
    try {
      const { dataUrl, mimeType } = await imageUrlToDataUrl(sample.imageUrl);
      setActivePayload({ dataUrl, mimeType, label: sample.title });
      await classifyImage(dataUrl, mimeType);
    } catch (err: unknown) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to load sample image.');
    }
  };

  const handleCaptureDataUrl = async (dataUrl: string, label: string, silent = false) => {
    setPreviewUrl(dataUrl);
    setSourceLabel(label);
    setActivePayload({ dataUrl, mimeType: 'image/jpeg', label });
    await classifyImage(dataUrl, 'image/jpeg', silent);
  };

  const handleReanalyze = async () => {
    if (!activePayload || !previewUrl) return;
    await classifyImage(activePayload.dataUrl, activePayload.mimeType);
  };

  const triggerUpload = () => {
    document.getElementById('classifier')?.scrollIntoView({ behavior: 'smooth' });
    fileInputRef.current?.click();
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header onUploadClick={triggerUpload} />

      <main className="flex-1">
        <ClassifierWorkspace
          fileInputRef={fileInputRef}
          previewUrl={previewUrl}
          sourceLabel={sourceLabel}
          isLoading={isLoading}
          error={error}
          result={result}
          lastScanTime={lastScanTime}
          onFileSelected={handleFileSelected}
          onSampleSelected={handleSampleSelected}
          onReanalyze={handleReanalyze}
          onCaptureDataUrl={handleCaptureDataUrl}
        />

        <DeepAnalysisSection result={result} onTestSample={handleSampleSelected} />
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p className="font-medium text-slate-700">
            WasteWise AI · Real-Time Smart Waste Analysis
          </p>
          <p>
            Material classification, human preparation guidance, recycled product outcomes, and home
            upcycling ideas.
          </p>
        </div>
      </footer>
    </div>
  );
}
