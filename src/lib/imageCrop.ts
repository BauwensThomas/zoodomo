export interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image decode failed"));
    img.src = src;
  });
}

/**
 * Découpe la zone sélectionnée (coordonnées pixels de l'image source, données par
 * `onCropComplete` de react-easy-crop) et la redessine aux dimensions de sortie fixes de la
 * catégorie, remplace `compressImage` : la taille de sortie est désormais fixée par ce
 * recadrage, plus besoin d'un second passage de redimensionnement.
 */
export async function cropImageToBlob(
  imageSrc: string,
  croppedAreaPixels: CroppedAreaPixels,
  outputWidth: number,
  outputHeight: number,
  quality = 0.85
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    img,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Blob conversion failed"))),
      "image/jpeg",
      quality
    );
  });
}
