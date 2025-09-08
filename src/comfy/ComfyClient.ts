import { readFile } from 'fs/promises'
import { NodeStatus } from './interfaces/NodeStatus'
import { GifFile } from './interfaces/ComfyFile'
import { Gif, History } from './interfaces/History'
import { ComfyUploadResponse } from './interfaces/UploadResult'
import { WorkflowResponse } from './interfaces/WorkflowResult'
import { SystemStats } from './interfaces/SystemStats'

export class ComfyClient {
	private comfyUrl: string

	constructor(comfyUrl: string) {
		const url = comfyUrl.endsWith('/') ? comfyUrl : comfyUrl + '/'
		this.comfyUrl = url.concat('api')
	}

	async uploadImageToComfyUI(buffer: Buffer, fileName: string) {
		const formData = new FormData()
		const imageBlob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' })

		formData.append('image', imageBlob, fileName) // 'image' is the expected field name for the image file
		formData.append('type', 'input') // Specifies the target folder (e.g., 'input', 'temp', 'output')
		formData.append('subfolder', '') // Optional: specify a subfolder within the 'type' folder
		formData.append('overwrite', 'false') // Optional: set to 'true' to overwrite existing files

		try {
			const comfyUIApiUrl = this.comfyUrl.concat('/upload/image')
			const response = await fetch(comfyUIApiUrl, {
				method: 'POST',
				body: formData,
			})

			if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`)

			const result = await response.json()
			return result as ComfyUploadResponse
		} catch (error: any) {
			throw new Error(`Failed to upload image: ${fileName} ${error.message}`)
		}
	}

	// read local workflow.json with fs
	async readLocalWorkflow(workflowPath: string): Promise<any> {
		try {
			const data = await readFile(workflowPath, 'utf-8')
			return JSON.parse(data)
		} catch (error: any) {
			throw new Error(`Failed to read workflow.json: ${error.message}`)
		}
	}

	async setWorkflowPropsImageToVideo(workflow: any, prompt: string, imageInput: string, duration: number): Promise<void> {
		// Dynamically update properties
		workflow['3'].inputs.steps = 10
		workflow['6'].inputs.text = prompt
		workflow['7'].inputs.text = 'blurry'
		workflow['30'].inputs.frame_rate = 30
		workflow['50'].inputs.width = 1024
		workflow['50'].inputs.height = 512
		workflow['50'].inputs.length = duration
		workflow['52'].inputs.image = imageInput

		return workflow
	}

	async setWorkflowPropsLipSync(workflow: any, audioInput: string, videoInput: string, outputName: string): Promise<any> {
		// https://github.com/ShmuelRonen/ComfyUI-LatentSyncWrapper

		workflow['37'].inputs.audio = audioInput
		workflow['40'].inputs.video = videoInput
		// workflow['41'].inputs.filename_prefix = outputName
		return workflow
	}

	async sendComfyUIWorkflow(workflow: any) {
		const comfyUIApiUrl = this.comfyUrl.concat('/prompt')
		try {
			const response = await fetch(comfyUIApiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					prompt: workflow, // The API-formatted workflow JSON goes here
				}),
			})

			if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`)

			return (await response.json()) as WorkflowResponse
		} catch (error: any) {
			throw new Error(`Failed to send workflow to ComfyUI: ${error.message}`)
		}
	}

	async getSystemStats() {
		const comfyUIApiUrl = this.comfyUrl.concat('/system_stats')
		try {
			const response = await fetch(comfyUIApiUrl)
			if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`)

			return (await response.json()) as SystemStats
		} catch (error: any) {
			throw new Error(`Failed to get system stats: ${error.message}`)
		}
	}

	async getNodeStatus(): Promise<NodeStatus> {
		const comfyUIApiUrl = this.comfyUrl.concat('/queue')
		try {
			const response = await fetch(comfyUIApiUrl)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.statusText}`)
			}
			const j = await response.json()
			let queue_running: any = []
			let queue_pending: number = 0
			if (j.queue_running && Array.isArray(j.queue_running) && j.queue_running[0]) {
				queue_running = j.queue_running[0][1]
			}
			if (j.queue_pending) {
				queue_pending = j.queue_pending.length
			}
			return { queue_running, queue_pending }
		} catch (error: any) {
			throw new Error(`Failed to get node status: ${error.message}`)
		}
	}

	async history(maxItems: number = 1): Promise<History[]> {
		const comfyUIApiUrl = this.comfyUrl.concat('/history').concat(`?max_items=${maxItems}`)
		console.log(`Fetching history from: ${comfyUIApiUrl}`)
		try {
			const response = await fetch(comfyUIApiUrl)
			if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`)

			const data = await response.json()
			return data as History[]
		} catch (error: any) {
			throw new Error(`Failed to get history: ${error.message}`)
		}
	}

	async status(id: string) {
		const comfyUIApiUrl = this.comfyUrl.concat('/history').concat(`/${id}`)

		try {
			const response = await fetch(comfyUIApiUrl)
			console.log(JSON.stringify(response))
			if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`)

			const data: History = await response.json()
			// check if data is valid
			if (!data || !data[id]) {
				// console.log(`No data for prompt ${id} wait for completion`)
				return { completed: false, error: 'No data yet' }
			}
			const promptHistory = data[id]
			return promptHistory.status
		} catch (error: any) {
			throw new Error(`Failed to get status for prompt ${id}: ${error.message}`)
		}
	}

	async getDownloadUrl(id: string) {
		const comfyUIApiUrl = this.comfyUrl.concat('/history').concat(`/${id}`)
		try {
			const response = await fetch(comfyUIApiUrl)
			if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`)

			const data: History = await response.json()
			const promptHistory = data[id]

			for (const nodeId in promptHistory.outputs) {
				const nodeOutput = promptHistory.outputs[nodeId]

				const gif = nodeOutput.gifs[0] as Gif
				const url = this.comfyUrl.concat('/view?filename=', gif.filename)
				const file: GifFile = { ...gif, url }

				return file
			}
		} catch (error: any) {
			throw new Error(`Failed to download file for prompt ${id}: ${error.message}`)
		}
	}
}
