import JsBarcode from 'jsbarcode';

/**
 * Render barcode onto an SVG or canvas element
 */
export function renderBarcode(element: SVGElement | HTMLCanvasElement, value: string, options?: {
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
}) {
  if (!element || !value) return;
  try {
    JsBarcode(element, value, {
      format: options?.format || 'CODE128',
      width: options?.width ?? 2,
      height: options?.height ?? 40,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize ?? 14,
      margin: options?.margin ?? 6,
      background: 'transparent',
      lineColor: '#1e293b',
    });
  } catch (err) {
    console.warn('Barcode render error:', err);
  }
}

/**
 * Hook or helper to listen to USB Barcode Scanners.
 * USB scanners send rapid keystrokes followed by Enter key.
 */
export class USBBarcodeScannerListener {
  private buffer: string = '';
  private lastKeyTime: number = 0;
  private onScanCallback: (barcode: string) => void;
  private keydownHandler: (e: KeyboardEvent) => void;

  constructor(onScan: (barcode: string) => void) {
    this.onScanCallback = onScan;
    this.keydownHandler = this.handleKeyDown.bind(this);
  }

  public start() {
    window.addEventListener('keydown', this.keydownHandler);
  }

  public stop() {
    window.removeEventListener('keydown', this.keydownHandler);
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Ignore input if user is actively typing in an input or textarea unless specifically intended
    const target = e.target as HTMLElement;
    const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

    const currentTime = Date.now();
    const diff = currentTime - this.lastKeyTime;
    this.lastKeyTime = currentTime;

    if (e.key === 'Enter') {
      if (this.buffer.length >= 3 && diff < 80) {
        // High typing speed indicates barcode scanner
        this.onScanCallback(this.buffer.trim());
        this.buffer = '';
        if (!isInput) {
          e.preventDefault();
        }
      } else {
        this.buffer = '';
      }
      return;
    }

    if (e.key.length === 1) {
      if (diff > 120) {
        // Typing too slow; reset buffer
        this.buffer = e.key;
      } else {
        this.buffer += e.key;
      }
    }
  }
}

class USBScannerManager {
  private listeners: Set<(barcode: string) => void> = new Set();
  private scannerInstance: USBBarcodeScannerListener | null = null;

  public init() {
    if (!this.scannerInstance) {
      this.scannerInstance = new USBBarcodeScannerListener((barcode) => {
        this.listeners.forEach((cb) => cb(barcode));
      });
      this.scannerInstance.start();
    }
  }

  public destroy() {
    if (this.scannerInstance) {
      this.scannerInstance.stop();
      this.scannerInstance = null;
    }
  }

  public addListener(callback: (barcode: string) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const usbScanner = new USBScannerManager();
