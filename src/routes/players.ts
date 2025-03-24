import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Player } from '../types/player.js'

const router = express.Router()

const playerSchema = new mongoose.Schema({
	Id: { type: String, required: true, unique: true },
	Name: { type: String, required: true },
	JerseyNumber: { type: String, required: true },
	Team: { type: String, required: true },
	Goals: { type: Number, required: true },
	Assists: { type: Number, required: true }
})

const PlayerModel = mongoose.model<Player>('players', playerSchema)

router.get('/', async (req: Request, res: Response) => {
	try {
		const players = await PlayerModel.find()
		res.json(players)
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: 'An unknown error occurred'
		res.status(500).json({ message: errorMessage })
	}
})

router.get(
	'/stats/goals/:number',
	async (req: Request, res: Response) => {
		try {
			const players = await PlayerModel.find()
				.sort({ Goals: -1 })
				.limit(parseInt(req.params.number))
			res.json(players)
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'An unknown error occurred'
			res.status(500).json({ message: errorMessage })
		}
	}
)

export default router
