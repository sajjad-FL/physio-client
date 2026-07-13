import imageCompression from 'browser-image-compression'
import { MAX_UPLOAD_BYTES } from '../constants/uploadLimits.js'

/** Target slightly under 500 KB so multipart overhead still fits the limit. */
const TARGET_BYTES = Math.min(MAX_UPLOAD_BYTES, Math.floor(0.48 * 1024 * 1024))

const PRESETS = {
  avatar: { maxWidthOrHeight: 1024, initialQuality: 0.88 },
  document: { maxWidthOrHeight: 2048, initialQuality: 0.88 },
  payment: { maxWidthOrHeight: 2048, initialQuality: 0.9 },
  product: { maxWidthOrHeight: 1600, initialQuality: 0.85 },
  default: { maxWidthOrHeight: 2048, initialQuality: 0.88 },
}

/**
 * @param {File | Blob | null | undefined} file
 */
export function isCompressibleImage(file) {
  if (!file || typeof file !== 'object') return false
  const type = String(file.type || '').toLowerCase()
  if (type === 'application/pdf') return false
  return /^image\/(jpeg|jpg|png|webp)$/.test(type)
}

/**
 * @param {File} file
 * @param {keyof typeof PRESETS | { maxWidthOrHeight?: number, initialQuality?: number }} [presetOrOptions]
 * @returns {Promise<File>}
 */
export async function compressImageFile(file, presetOrOptions = 'default') {
  if (!isCompressibleImage(file)) return file
  if (file.size <= TARGET_BYTES) return file

  const preset =
    typeof presetOrOptions === 'string'
      ? PRESETS[presetOrOptions] || PRESETS.default
      : { ...PRESETS.default, ...(presetOrOptions || {}) }

  const options = {
    maxSizeMB: TARGET_BYTES / (1024 * 1024),
    maxWidthOrHeight: preset.maxWidthOrHeight,
    initialQuality: preset.initialQuality,
    useWebWorker: true,
    fileType: file.type === 'image/png' ? 'image/webp' : file.type || 'image/jpeg',
  }

  const compressed = await imageCompression(file, options)
  const outName = renameCompressed(file.name, compressed.type)

  if (compressed instanceof File) {
    if (compressed.name === outName) return compressed
    return new File([compressed], outName, {
      type: compressed.type || options.fileType,
      lastModified: Date.now(),
    })
  }

  return new File([compressed], outName, {
    type: compressed.type || options.fileType,
    lastModified: Date.now(),
  })
}

/**
 * Compress images that need it; leave PDFs and small images alone.
 * @param {File} file
 * @param {keyof typeof PRESETS} [preset]
 * @returns {Promise<File>}
 */
export async function prepareUploadFile(file, preset = 'default') {
  if (!file) return file
  if (!isCompressibleImage(file)) return file

  const out = await compressImageFile(file, preset)
  if (out.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Could not compress image under ${Math.round(MAX_UPLOAD_BYTES / 1024)} KB. Try a smaller photo.`)
  }
  return out
}

function renameCompressed(originalName, mime) {
  const base = String(originalName || 'image').replace(/\.[^.]+$/, '') || 'image'
  const ext =
    mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : 'jpg'
  return `${base}.${ext}`
}
