export interface History {
	[promptId: string]: PromptHistory
}

export interface PromptHistory {
	outputs: Outputs
	status: PromptStatus
}

export interface PromptStatus {
	status_str: string
	completed: boolean
	messages: (Message | Messages2 | string)[][][]
}

interface Messages2 {
	nodes: any[]
	prompt_id: string
	timestamp: number
}

interface Message {
	prompt_id: string
	timestamp: number
}

interface Outputs {
	[nodeId: string]: NodeOutput
}

interface NodeOutput {
	gifs: Gif[]
}

export interface Gif {
	filename: string
	subfolder: string
	type: string
	format: string
	frame_rate: number
	workflow: string
	fullpath: string
}
