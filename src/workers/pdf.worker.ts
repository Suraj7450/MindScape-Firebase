import * as pdfjsLib from 'pdfjs-dist';

// Define the expected message type
export interface PdfWorkerMessage {
    fileBuffer: ArrayBuffer;
}

export interface PdfWorkerResponse {
    text?: string;
    error?: string;
    progress?: {
        currentPage: number;
        totalPages: number;
    };
}

// When a message is received from the main thread
self.addEventListener('message', async (e: MessageEvent<PdfWorkerMessage>) => {
    try {
        const { fileBuffer } = e.data;

        if (!fileBuffer) {
            throw new Error('No file buffer provided to worker.');
        }

        // Set up PDF.js worker
        // The main thread is currently handling GlobalWorkerOptions, but inside
        // the actual worker context we don't necessarily need to set workerSrc again 
        // since this script *is* the worker, but we need to load the document.
        // However, pdfjsLib in a Web Worker environment needs its own worker script if it spawns further workers,
        // but usually calling getDocument inside a worker uses a fake worker or runs locally.
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';

            // Report progress back to main thread
            self.postMessage({
                progress: {
                    currentPage: i,
                    totalPages: totalPages
                }
            } as PdfWorkerResponse);
        }

        // Send final result
        self.postMessage({
            text: fullText
        } as PdfWorkerResponse);

    } catch (error: any) {
        self.postMessage({
            error: error.message || 'Unknown error occurred during PDF parsing in worker.'
        } as PdfWorkerResponse);
    }
});
