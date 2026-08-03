import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrintService {
  /**
   * Renders `html` in a hidden iframe and triggers the browser print dialog.
   * Avoids popup blockers (window.open) and leaves the host page untouched —
   * reusable for any printable document in the system (receipts, reports…).
   */
  printHtml(html: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(cleanup, 1000);
    }, 200);
  }
}
