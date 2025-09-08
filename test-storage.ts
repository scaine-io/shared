import { downloadFileAsBuffer } from './src/helpers/Downloadhelper'
import { uploadBufferToGCS, pipelineDownloadToGCS } from './src/storage/StorageHelpers'
import * as admin from 'firebase-admin'
import { FIREBASE_CONFIG, Media } from '@scaine-io/types'
import { Storage } from '@google-cloud/storage'

// for local testing
// Set emulator host environment variables
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081'
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199'

console.log('------------------------------------------------------')
console.log('-------- run this before the first test --------------')
console.log('-------- gcloud auth application-default login -------')
console.log('------------------------------------------------------')

admin.initializeApp({
	projectId: FIREBASE_CONFIG.projectId,
	storageBucket: FIREBASE_CONFIG.storageBucket,
})

// async function testDownloadAndSaveToGCS() {
// 	const url = 'https://picsum.photos/200/300.jpg'
// 	try {
// 		const fileBuffer = await downloadFileAsBuffer(url)
// 		console.log('File downloaded successfully:', fileBuffer)
// 		await uploadBufferToGCS('test-image.jpg', fileBuffer, admin.storage() as unknown as Storage)
// 		console.log('File uploaded successfully to GCS')

// 		const [files] = await admin.storage().bucket(FIREBASE_CONFIG.storageBucket).getFiles()
// 		files.forEach((file) => console.log(file.name))
// 	} catch (error) {
// 		console.error('Error downloading file:', error)
// 	}
// }

// testDownloadAndSaveToGCS()

// test pipelineDownloadToGCS
async function testPipelineDownloadToGCS() {
	const url = 'https://picsum.photos/200/300.jpg'
	try {
		const media = { id: '123sdc5f', userId: '0x12345' } as unknown as Media

		const { gsRef, publicUrl } = await pipelineDownloadToGCS(url, admin.storage() as unknown as Storage, media)
		console.log('File piped successfully to GCS')
		console.log('GS Reference:', gsRef)
		console.log('Public URL:', publicUrl)
		const [files] = await admin.storage().bucket(FIREBASE_CONFIG.storageBucket).getFiles()
		files.forEach((file) => console.log(file.name))
	} catch (error) {
		console.error('Error in pipelineDownloadToGCS:', error)
	}
}

testPipelineDownloadToGCS()
