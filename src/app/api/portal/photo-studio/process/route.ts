import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { cloudinary, buildTransformations, PhotoOps } from '@/lib/cloudinary-server'

async function verifyStaff(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['agent', 'admin', 'dev'].includes(decoded.role as string)) return null
    return decoded
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { publicIds, operations }: { publicIds: string[]; operations: PhotoOps } = await req.json()
  if (!publicIds?.length) return Response.json({ error: 'No photos' }, { status: 400 })

  const transformations = buildTransformations(operations)
  if (!transformations.length) return Response.json({ error: 'No operations selected' }, { status: 400 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      console.log(`[photo-studio] processing ${publicIds.length} photos, ops:`, operations)

      // Process all photos in parallel — each streams its result when done
      await Promise.allSettled(
        publicIds.map(async (publicId) => {
          try {
            console.log(`[photo-studio] starting: ${publicId}`)
            const result = await cloudinary.uploader.explicit(publicId, {
              type: 'upload',
              eager: [transformations],  // wrap in array to chain all ops into one pipeline
              eager_async: false,
            }) as { eager?: { secure_url: string }[] }

            const processedUrl = result.eager?.[0]?.secure_url
            if (processedUrl) {
              console.log(`[photo-studio] done: ${publicId}`)
              send({ publicId, url: processedUrl, status: 'done' })
            } else {
              console.error(`[photo-studio] no output URL for: ${publicId}`, result)
              send({ publicId, status: 'error', message: 'No output URL returned' })
            }
          } catch (err) {
            // Extract Cloudinary API error detail (e.g. "Add-on not enabled", "Invalid parameter")
            const cloudErr = err as { error?: { message?: string; http_code?: number }; http_code?: number; message?: string }
            const detail = cloudErr?.error?.message ?? cloudErr?.message ?? (err instanceof Error ? err.message : 'Processing failed')
            console.error(`[photo-studio] error for ${publicId}:`, JSON.stringify(err, null, 2))
            send({ publicId, status: 'error', message: detail })
          }
        })
      )

      console.log(`[photo-studio] batch complete`)

      send({ done: true })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
