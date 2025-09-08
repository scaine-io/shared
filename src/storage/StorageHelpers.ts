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

