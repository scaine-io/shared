import express, { Express, Response } from 'express'
import { corsOptions } from './CorsOptions'
import cors from 'cors'

export class CloudRunBase {
	public app: Express
	public server: ReturnType<Express['listen']> | undefined
	public readonly port: number

	constructor() {
		this.port = process.env.PORT ? Number(process.env.PORT) : 8080
		this.app = express()
		this.app.use(cors(corsOptions))
		this.app.use(express.json())

		// Health check
		this.app.get('/health', (res: Response) => {
			res.status(200).send('OK')
		})

		// Auto-start the server
		this.start()
	}

	private start() {
		this.server = this.app.listen(this.port, () => {
			console.log(`Service listening on port ${this.port}`)
		})

		const shutdown = (signal: string) => {
			if (this.server) {
				this.server.close(() => {
					console.log(`Process ${signal}, server closed.`)
					process.exit(0)
				})
			}
		}

		process.on('SIGTERM', () => shutdown('terminated'))
		process.on('SIGINT', () => shutdown('interrupted'))
		process.on('SIGUSR2', () => shutdown('restarted'))
	}
}
