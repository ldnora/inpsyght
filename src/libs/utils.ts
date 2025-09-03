import qrCode from "qrcode";

export function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export async function generateQRCode(url: string): Promise<string | null> {
  try {
    return await qrCode.toDataURL(url, {
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
}

export async function generateQrCodeWithLogo(
  qrUrl: string,
  logoPath: string = "/Jerivaldo.png"
): Promise<string | null> {
  // Gera o QR code como data URL
  const qrDataUrl = await generateQRCode(qrUrl);
  if (!qrDataUrl) return null;
  try {
    return new Promise((resolve) => {
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = qrDataUrl;
      qrImg.onload = () => {
        const size = 300;
        const logoSize = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(qrDataUrl);
        ctx.drawImage(qrImg, 0, 0, size, size);
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = logoPath;
        logoImg.onload = () => {
          // Desenha o logo em preto e branco
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, logoSize / 2 + 6, 0, 2 * Math.PI);
          ctx.fillStyle = "#fff";
          ctx.fill();
          ctx.closePath();
          ctx.drawImage(
            logoImg,
            size / 2 - logoSize / 2,
            size / 2 - logoSize / 2,
            logoSize,
            logoSize
          );
          // Aplica filtro grayscale
          const imageData = ctx.getImageData(
            size / 2 - logoSize / 2,
            size / 2 - logoSize / 2,
            logoSize,
            logoSize
          );
          for (let i = 0; i < imageData.data.length; i += 4) {
            const avg =
              (imageData.data[i] +
                imageData.data[i + 1] +
                imageData.data[i + 2]) /
              3;
            imageData.data[i] = avg;
            imageData.data[i + 1] = avg;
            imageData.data[i + 2] = avg;
          }
          ctx.putImageData(
            imageData,
            size / 2 - logoSize / 2,
            size / 2 - logoSize / 2
          );
          ctx.restore();
          resolve(canvas.toDataURL());
        };
        logoImg.onerror = () => resolve(qrDataUrl);
      };
      qrImg.onerror = () => resolve(qrDataUrl);
    });
  } catch (error) {
    console.error("Error generating QR code with logo:", error);
    return null;
  }
}
