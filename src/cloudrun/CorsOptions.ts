export const corsOptions = {
	origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
		// console.log('CORS origin check:', origin) // Debug log

		// Allow requests with no origin (mobile apps, Postman, etc.)
		if (!origin) return callback(null, true)

		// Allow domains containing "scaine"
		if (origin.includes('scaine')) return callback(null, true)

		// Allow local fixme: remove when in production
		if (origin.startsWith('localhost') || origin.includes('127.0.0.1') || origin === 'http://localhost:5173') return callback(null, true)

		// Reject all other origins
		callback(new Error(`Not allowed by CORS policy: ${origin}`), false)
	},
	methods: ['GET', 'POST', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
	preflightContinue: false,
	optionsSuccessStatus: 200, // For legacy browser support
}
