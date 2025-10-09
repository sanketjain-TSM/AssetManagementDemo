const GCS_STORAGE_BUCKET = "https://storage.googleapis.com/ham-prod-assets-images/"

const normalizeKey = (desc: string) =>
    desc.replace(/[^a-z0-9]/gi, "").toLowerCase();

export const getImageName = (desc: string) => {
    if (!desc) return null;
    const normalizedKey = normalizeKey(desc);
    return `${GCS_STORAGE_BUCKET}${normalizedKey}.png`;
};