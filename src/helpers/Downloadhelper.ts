import fetch, { Response } from 'node-fetch'

export async function downloadFileAsBuffer(url: string): Promise<Buffer> {
	try {
		const response: Response = await fetch(url)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const arrayBuffer = await response.arrayBuffer()
		return Buffer.from(arrayBuffer)
	} catch (error) {
		console.error('Failed to download file:', error)
		throw new Error('Failed to download file from the provided URL.')
	}
}
