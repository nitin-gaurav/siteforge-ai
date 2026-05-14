const inlineRasterPattern = /^data:image\/(png|jpe?g|webp);base64,/i;
const minInlineImageChars = 180000;

function isInlineRasterImage(url = "") {
  return inlineRasterPattern.test(url);
}

function isLogoLikeImage(image = {}) {
  const text = `${image.alt || ""} ${image.query || ""}`.toLowerCase();
  return text.includes("logo") || text.includes("app icon") || text.includes("brand mark");
}

function canvasToDataUrl(canvas, quality) {
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) return webp;
  return canvas.toDataURL("image/jpeg", quality);
}

async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function optimizeImage(image) {
  if (!isInlineRasterImage(image?.url) || image.url.length < minInlineImageChars || typeof document === "undefined") {
    return image;
  }

  try {
    const loadedImage = await loadImage(image.url);
    const maxSize = isLogoLikeImage(image) ? 768 : 1280;
    const scale = Math.min(1, maxSize / Math.max(loadedImage.naturalWidth || loadedImage.width, loadedImage.naturalHeight || loadedImage.height));

    if (scale >= 0.98 && image.url.length < 450000) return image;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((loadedImage.naturalWidth || loadedImage.width) * scale));
    canvas.height = Math.max(1, Math.round((loadedImage.naturalHeight || loadedImage.height) * scale));

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return image;

    context.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
    const optimizedUrl = canvasToDataUrl(canvas, isLogoLikeImage(image) ? 0.82 : 0.76);

    return optimizedUrl.length < image.url.length
      ? {
          ...image,
          url: optimizedUrl,
          optimized: true
        }
      : image;
  } catch {
    return image;
  }
}

async function optimizeItemImages(items) {
  if (!Array.isArray(items)) return items;

  return Promise.all(
    items.map(async (item) => ({
      ...item,
      image: item.image ? await optimizeImage(item.image) : item.image
    }))
  );
}

export async function optimizeProjectImages(sections = []) {
  if (!Array.isArray(sections) || !sections.length) return sections;

  return Promise.all(
    sections.map(async (section) => ({
      ...section,
      image: section.image ? await optimizeImage(section.image) : section.image,
      items: await optimizeItemImages(section.items)
    }))
  );
}
