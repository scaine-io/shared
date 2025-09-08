export interface SystemStats {
	system: System
	devices: Device[]
}

interface Device {
	name: string
	type: string
	index: number
	vram_total: number
	vram_free: number
	torch_vram_total: number
	torch_vram_free: number
}

interface System {
	os: string
	ram_total: number
	ram_free: number
	comfyui_version: string
	required_frontend_version: string
	python_version: string
	pytorch_version: string
	embedded_python: boolean
	argv: string[]
}
