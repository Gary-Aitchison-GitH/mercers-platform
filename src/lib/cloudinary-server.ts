import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL })

export { cloudinary }

export interface PhotoOps {
  enhance: boolean
  crop: boolean
  removePeople: boolean
}

export function buildTransformations(ops: PhotoOps) {
  const t: Record<string, unknown>[] = []
  // Generative removal first — operates on the full original frame
  if (ops.removePeople) {
    t.push({ effect: 'gen_remove:prompt_people and pets;multiple_true' })
  }
// Enhancement after removal so it doesn't undo corrections
  if (ops.enhance) {
    t.push({ effect: 'improve:indoor' })
  }
  // Crop last — preserve as much fixed content as possible
  if (ops.crop) {
    t.push({ crop: 'fill', aspect_ratio: '7:5', gravity: 'auto' })
  }
  return t
}
