export function printToPdf(selector) {
  const printEl = document.querySelector(selector);
  if (!printEl) {
    window.print();
    return;
  }

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    window.print();
    return;
  }

  const clone = printEl.cloneNode(true);
  clone.querySelectorAll('img[src^="/"]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), window.location.origin).href;
  });

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  win.document.write(`<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <title>Cetak</title>
    ${styles}
    <style>
      html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
      @page { size: A4 portrait; margin: 15mm 20mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style>
  </head>
  <body>${clone.outerHTML}</body>
</html>`);
  win.document.close();

  const doPrint = () => {
    win.focus();
    win.print();
  };

  const imgs = Array.from(win.document.images);
  if (imgs.length === 0) {
    doPrint();
    return;
  }

  let remaining = imgs.length;
  const onImageDone = () => {
    remaining -= 1;
    if (remaining === 0) {
      setTimeout(doPrint, 150);
    }
  };
  imgs.forEach((img) => {
    if (img.complete) {
      onImageDone();
    } else {
      img.addEventListener('load', onImageDone);
      img.addEventListener('error', onImageDone);
    }
  });

  setTimeout(doPrint, 2500);
}