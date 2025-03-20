import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import gameRoutes from './routes/games.js'
import tableRoutes from './routes/table.js'

const app = express()

const DATABASE_URL =
	process.env.DATABASE_URL ||
	'mongodb://127.0.0.1:27017/floorball-league'

const PORT = 3000

mongoose.connect(DATABASE_URL)
const db = mongoose.connection
db.on('error', (err) => console.error(err))
db.on('open', () => console.log('Connected to MongoDB'))

app.use(express.json())
app.use('/api/games', gameRoutes)

app.use('/api/table', tableRoutes)

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
