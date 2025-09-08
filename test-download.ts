import { downloadFileAsBuffer } from './src/helpers/Downloadhelper'

async function testDownloadFileAsBuffer() {
	const url = 'https://picsum.photos/200/300.jpg'
	try {
		const fileBuffer = await downloadFileAsBuffer(url)
		console.log('File downloaded successfully:', fileBuffer)
	} catch (error) {
		console.error('Error downloading file:', error)
	}
}

testDownloadFileAsBuffer()
