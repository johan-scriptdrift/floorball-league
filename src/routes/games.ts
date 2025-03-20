import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Game } from '../types/game.js'

const router = express.Router()

const gameSchema = new mongoose.Schema({
	GameID: { type: Number, required: true, unique: true },
	GameStatusID: { type: Number, required: true },
	LeagueID: { type: Number, required: true },
	LeagueName: { type: String, required: true },
	GameRound: { type: Number, required: true },
	LeagueDisplayName: { type: String, required: true },
	HomeTeamID: { type: Number, required: true },
	AwayTeamID: { type: Number, required: true },
	HomeTeamClubName: { type: String, required: true },
	AwayTeamClubName: { type: String, required: true },
	HomeTeamScore: String,
	AwayTeamScore: String,
	GameTime: String,
	ArenaName: String,
	UpdatedAt: String
})

const Game = mongoose.model<Game>('games', gameSchema)

router.get('/', async (req: Request, res: Response) => {
	try {
		const games = await Game.find()
		res.json(games)
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: 'An unknown error occurred'
		res.status(500).json({ message: errorMessage })
	}
})

router.get('/:id', async (req: Request, res: Response) => {
	try {
		const game = await Game.findOne({
			GameID: parseInt(req.params.id)
		})
		if (game) {
			res.json(game)
		} else {
			res.status(404).json({ message: 'Game not found' })
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: 'An unknown error occurred'
		res.status(500).json({ message: errorMessage })
	}
})

export default router
