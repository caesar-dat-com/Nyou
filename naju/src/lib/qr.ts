import { QrCode } from "./qrcodegen";

/**
 * Generates a high-contrast QR PNG data URL.
 * PNG is usually more reliable than SVG for mobile camera scanners.
 */
export function makeQrSvgDataUrl(text: string) {
  const qr = QrCode.encodeText(text, QrCode.Ecc.HIGH);

  const border = 4; // quiet zone
  const modulePx = 12; // larger blocks => easier scanning
  const size = qr.size + border * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size * modulePx;
  canvas.height = size * modulePx;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // very unlikely fallback
    return "";
  }

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.getModule(x, y)) continue;
      const xx = (x + border) * modulePx;
      const yy = (y + border) * modulePx;
      ctx.fillRect(xx, yy, modulePx, modulePx);
    }
  }

  return canvas.toDataURL("image/png");
}
