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

      // Process all photos in parallel — each streams its result when done
      await Promise.allSettled(
        publicIds.map(async (publicId) => {
          try {
            const result = await cloudinary.uploader.explicit(publicId, {
              type: 'upload',
              eager: transformations,
              eager_async: false,
            }) as { eager?: { secure_url: string }[] }

            const processedUrl = result.eager?.[0]?.secure_url
            if (processedUrl) {
              send({ publicId, url: processedUrl, status: 'done' })
            } else {
              send({ publicId, status: 'error', message: 'No output URL returned' })
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Processing failed'
            send({ publicId, status: 'error', message })
          }
        })
      )

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
