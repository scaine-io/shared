import * as path from 'path'
import * as fs from 'fs/promises'
import { ComfyClient } from './src/comfy/ComfyClient'

const audio = path.join(__dirname, '/src/comfy/__examples__/audio.mp3')
const video = path.join(__dirname, '/src/comfy/__examples__/video.mp4')
const destAudioName = `audio-${Date.now()}.mp3`
const destVideoName = `video-${Date.now()}.mp4`
const url = 'https://gpunodejcdlblorc7avz.tec-s33.onthetaedgecloud.com/'

async function testComfyClient() {
	console.log('Testing ComfyClient...')
	try {
		const comfyClient = new ComfyClient(url)

		// const systemStats = await comfyClient.getSystemStats()
		// console.log('System Stats:')
		// console.log(JSON.stringify(systemStats))

		const progress0 = await comfyClient.getNodeStatus()
		console.log('ComfyUI Progress:')
		console.log(JSON.stringify(progress0))

		console.log(`Queue status: ${progress0.queue_pending} items pending and ${progress0.queue_running.length} items running.`)

		if (progress0.queue_pending && progress0.queue_pending > 0 && progress0.queue_running.length > 0) {
			console.log(`There are ${progress0.queue_pending} items in the queue. Please wait until they are processed.`)
			return
		}

		// await comfyClient.clearQueue()

		// const history = await comfyClient.history(1)
		// console.log('History:')
		// console.log(JSON.stringify(history))

		// get example.mp3 and put it into a buffer
		const audioBuffer = await fs.readFile(audio)
		const uploadResult = await comfyClient.uploadImageToComfyUI(audioBuffer, destAudioName)

		const videoBuffer = await fs.readFile(video)
		const uploadResultVideo = await comfyClient.uploadImageToComfyUI(videoBuffer, destVideoName)
		// console.log('Upload Result:')
		// console.log(JSON.stringify(uploadResult))

		const workflowPath = path.join(__dirname, '/src/comfy/__workflows__/lip-sync-workflow.json')
		const workflow = await comfyClient.readLocalWorkflow(workflowPath)
		const outputName = Date.now().toString()
		const updatedWorkflow = await comfyClient.setWorkflowPropsLipSync(workflow, destAudioName, destVideoName, outputName)

		// console.log('Updated Workflow:')
		// console.log(JSON.stringify(updatedWorkflow, null, 2))

		// const progress = await comfyClient.getNodeStatus()
		// console.log('ComfyUI Progress:')
		// console.log(JSON.stringify(progress))

		const result = await comfyClient.sendComfyUIWorkflow(updatedWorkflow)
		// console.log('ComfyUI Workflow Result:')
		// console.log(JSON.stringify(result))

		// wait for 1 second
		// await new Promise((resolve) => setTimeout(resolve, 1000))

		// const status = await comfyClient.status(result.prompt_id)
		// console.log('ComfyUI Status Result:')
		// console.log(JSON.stringify(status))

		// const progress1 = await comfyClient.getNodeStatus()
		// console.log('ComfyUI Progress:')
		// console.log(JSON.stringify(progress1))

		// check status every 10 seconds
		const interval = setInterval(async () => {
			const status = await comfyClient.status(result.prompt_id)

			if (status.completed === true) {
				console.log('ComfyUI Workflow Completed:')
				clearInterval(interval)

				// download video
				const downloadResult = await comfyClient.getDownloadUrl(result.prompt_id)
				console.log('ComfyUI Download Result:')
				console.log(JSON.stringify(downloadResult))
			}
		}, 1000)
	} catch (error: any) {
		console.error(`error: ${error.message}`)
	}
}

testComfyClient().catch(console.error)
