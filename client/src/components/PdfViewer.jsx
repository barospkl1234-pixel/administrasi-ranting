import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Download, ExternalLink, Printer, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut
} from 'lucide-react';
import Modal from './Modal';
import { downloadDataUrl } from '../utils/files';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

export default function PdfViewer({
  isOpen,
  onClose,
  file,
  fileName = 'Dokumen',
  fileType = 'application/pdf',
  metadata,
  onDownload
}) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);

  const isPdf = fileType === 'application/pdf';

  const onDocumentLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
    setPageNumber(1);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setError('Gagal memuat PDF. File mungkin rusak atau tidak valid.');
  }, []);

  const goToPrevPage = () => setPageNumber(p => Math.max(1, p - 1));
  const goToNextPage = () => setPageNumber(p => Math.min(numPages, p + 1));

  const zoomIn = () => {
    setScale(s => {
      const idx = ZOOM_LEVELS.indexOf(s);
      if (idx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[idx + 1];
      return Math.min(200, s + 25);
    });
  };

  const zoomOut = () => {
    setScale(s => {
      const idx = ZOOM_LEVELS.indexOf(s);
      if (idx > 0) return ZOOM_LEVELS[idx - 1];
      return Math.max(50, s - 25);
    });
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (file) {
      downloadDataUrl(file, fileName);
    }
  };

  const handleOpenNewTab = () => {
    if (file) {
      const win = window.open('', '_blank');
      if (win.document) {
        win.document.write(`
          <!DOCTYPE html>
          <html><head><title>${fileName}</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#e2e8f0">
            <iframe src="${file}" style="width:100%;height:100vh;border:none"></iframe>
          </body></html>
        `);
      }
    }
  };

  const handlePrint = () => {
    if (file) {
      const printWindow = window.open('', '_blank');
      if (printWindow.document) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html><head><title>Cetak - ${fileName}</title>
          <style>@page{size:auto;margin:10mm;}body{margin:0;}iframe{width:100%;height:100vh;border:none;}</style>
          </head><body>
          <iframe src="${file}" onload="setTimeout(()=>{window.print();window.close()},500)"></iframe>
          </body></html>
        `);
      }
    }
  };

  const toggleFullscreen = () => setIsFullscreen(f => !f);

  if (!isOpen || !file) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lihat Dokumen"
      maxWidth={isFullscreen ? 'max-w-[98vw]' : 'max-w-5xl'}
    >
      <div className="space-y-3">
        {/* Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <div className="text-xs space-y-0.5 min-w-0">
            <p className="font-bold text-slate-800 truncate">{fileName}</p>
            {metadata && (
              <p className="text-slate-500 truncate">
                {metadata.letterNumber ? `No. ${metadata.letterNumber} · ` : ''}
                {metadata.subject || ''}
              </p>
            )}
            <p className="text-slate-400">
              {fileType === 'application/pdf' ? 'PDF' : 'Gambar'}
              {metadata?.size ? ` · ${formatFileSize(metadata.size)}` : ''}
              {numPages ? ` · ${numPages} halaman` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenNewTab}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Tab Baru
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh
            </button>
          </div>
        </div>

        {/* Toolbar */}
        {isPdf && numPages && (
          <div className="no-print flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600 font-medium px-2 min-w-[100px] text-center select-none">
                Hal {pageNumber} dari {numPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                disabled={scale <= 50}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ZOOM_LEVELS.map(z => (
                  <option key={z} value={z}>{z}%</option>
                ))}
              </select>
              <button
                onClick={zoomIn}
                disabled={scale >= 200}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrint}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                title="Cetak"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className={`bg-slate-100 rounded-xl overflow-auto ${isFullscreen ? 'max-h-[85vh]' : 'max-h-[65vh]'}`}>
          {isPdf ? (
            <div className="flex justify-center p-4">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-slate-500">Memuat PDF...</p>
                    </div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-red-500">{error || 'Gagal memuat PDF'}</p>
                      {file && (
                        <button
                          onClick={handleOpenNewTab}
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Coba buka di tab baru
                        </button>
                      )}
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale / 100}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4">
              <img
                src={file}
                alt={fileName}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
