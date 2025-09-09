import * as path from 'path'
import * as fs from 'fs/promises'
import { ComfyClient } from './src/comfy/ComfyClient'

const image = path.join(__dirname, '/src/comfy/__examples__/example.jpg')
const destFileName = 'example.jpg'
const url = 'https://gpunoded899ugo2qzs1k-b906f2afcea61e53.tec-s20.onthetaedgecloud.com/'

async function testComfyClient() {
	console.log('Testing ComfyClient...')
	try {
		const comfyClient = new ComfyClient(url)

		const systemStats = await comfyClient.getSystemStats()
		console.log('System Stats:')
		console.log(JSON.stringify(systemStats))

		const progress0 = await comfyClient.getNodeStatus()
		console.log('ComfyUI Progress:')
		console.log(JSON.stringify(progress0))


		const history = await comfyClient.history(1)
		// console.log('History:')
		// console.log(JSON.stringify(history))

		// get example.jpg and put it into a buffer
		const imageBuffer = await fs.readFile(image)
		const uploadResult = await comfyClient.uploadImageToComfyUI(imageBuffer, destFileName)
		// console.log('Upload Result:')
		// console.log(JSON.stringify(uploadResult))

		const workflowPath = path.join(__dirname, './src/comfy/__workflows__/image-to-video-workflow.json')
		const workflow = await comfyClient.readLocalWorkflow(workflowPath)
		const updatedWorkflow = await comfyClient.setWorkflowPropsImageToVideo(workflow, 'wave and say hello and kiss', 'example.jpg', 10)

		const progress = await comfyClient.getNodeStatus()
		console.log('ComfyUI Progress:')
		console.log(JSON.stringify(progress))

		const result = await comfyClient.sendComfyUIWorkflow(updatedWorkflow)
		// console.log('ComfyUI Workflow Result:')
		// console.log(JSON.stringify(result))

		// wait for 1 second
		await new Promise((resolve) => setTimeout(resolve, 1000))

		const status = await comfyClient.status(result.prompt_id)
		console.log('ComfyUI Status Result:')
		console.log(JSON.stringify(status))

		const progress1 = await comfyClient.getNodeStatus()
		console.log('ComfyUI Progress:')
		console.log(JSON.stringify(progress1))

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
		}, 10000)
	} catch (error: any) {
		console.error(`error: ${error.message}`)
	}
}

testComfyClient().catch(console.error)
