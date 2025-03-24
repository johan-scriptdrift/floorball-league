import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import gameRoutes from './routes/games.js'
import tableRoutes from './routes/table.js'
import playerRoutes from './routes/players.js'

dotenv.config()

const app = express()

// Enable CORS for all routes
app.use(
	cors({
		origin: '*', // Allow all origins in development
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
	})
)

const DATABASE_URL =
	process.env.MONGODB_URI ||
	'mongodb://127.0.0.1:27017/floorball-league'
const PORT = 3000

console.log('DATABASE_URL:', DATABASE_URL)

mongoose
	.connect(DATABASE_URL)
	.then(() => console.log('Connected to MongoDB Atlas'))
	.catch((error) => {
		console.error('MongoDB connection error:', error)
		process.exit(1)
	})

app.use(express.json())
app.use('/api/games', gameRoutes)

app.use('/api/table', tableRoutes)
app.use('/api/players', playerRoutes)

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
