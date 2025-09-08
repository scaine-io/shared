import type { Storage } from '@google-cloud/storage'
import { FIREBASE_CONFIG, Media } from '@scaine-io/model'
import { fileTypeFromBuffer } from 'file-type'
import fetch from 'node-fetch'
/**
 * Usage Example:
 *
 *   import { extractBucketAndFile } from '@scaine-io/utils/storage/StorageHelpers';
 *   const ref = 'gs://my-bucket/path/to/file.txt';
 *   const { bucketName, fileName } = extractBucketAndFile(ref);
 *   // bucketName: 'my-bucket', fileName: 'path/to/file.txt'
 */
export function extractBucketAndFile(storageRef: string) {
	const match = storageRef.match(/^gs:\/\/([^/]+)\/(.+)$/)
	if (!match) throw new Error('Invalid storageRef format')
	const bucketName = match[1]
	const fileName = match[2]
	return { bucketName, fileName } as BucketAndFile
}

export interface BucketAndFile {
	bucketName: string
	fileName: string
}

export async function pipelineDownloadToGCS(url: string, storage: Storage, media: Media) {
	try {
		const contentType = getContentTypeByExtension(url)
		const fileName = media.id
		const gcsFileName = `media/${media.userId}/${fileName}`

		// get content type from url extension

		const response = await fetch(url)
		if (!response.body) throw new Error('No response body')

		const bucketName = FIREBASE_CONFIG.storageBucket
		const file = storage.bucket(bucketName).file(gcsFileName)
		const writeStream = file.createWriteStream({
			metadata: {
				contentType: contentType,
			},
		})

		await new Promise<void>((resolve, reject) => {
			response.body!.pipe(writeStream).on('finish', resolve).on('error', reject)
		})

		const gsRef = `gs://${bucketName}/${gcsFileName}`
		// Generate a random download token
		const token = crypto.randomUUID()
		// Set the token as metadata
		await file.setMetadata({
			metadata: { firebaseStorageDownloadTokens: token },
		})
		// Firebase Storage public URL format with token
		const encodedPath = encodeURIComponent(gcsFileName)
		const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`
		return { gsRef, publicUrl: firebaseUrl }
	} catch (error: any) {
		throw new Error(`Error in pipelineDownloadToGCS: ${error.message} for ${url}`)
	}
}

/**
 * Get content type (MIME) based on file extension for image, audio, and video files.
 */
export function getContentTypeByExtension(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase()
	switch (ext) {
		// Images
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg'
		case 'png':
			return 'image/png'
		case 'gif':
			return 'image/gif'
		case 'webp':
			return 'image/webp'
		case 'svg':
			return 'image/svg+xml'
		// Audio
		case 'mp3':
			return 'audio/mpeg'
		case 'wav':
			return 'audio/wav'
		case 'ogg':
			return 'audio/ogg'
		case 'm4a':
			return 'audio/mp4'
		// Video
		case 'mp4':
			return 'video/mp4'
		case 'mov':
			return 'video/quicktime'
		case 'webm':
			return 'video/webm'
		case 'avi':
			return 'video/x-msvideo'
		case 'mkv':
			return 'video/x-matroska'
		default:
			return 'application/octet-stream'
	}
}
