import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Game } from '../types/game.js'
import { Table } from '../types/table.js'
import { Team } from '../types/team.js'

const router = express.Router()

const Game = mongoose.model<Game>('games')

router.get('/', async (req: Request, res: Response) => {
	try {
		const games = await Game.find(
			{},
			{
				UpdatedAt: 1,
				LeagueID: 1,
				LeagueName: 1,
				GameID: 1,
				HomeTeamID: 1,
				AwayTeamID: 1,
				HomeTeamClubName: 1,
				AwayTeamClubName: 1,
				HomeTeamScore: 1,
				AwayTeamScore: 1
			}
		).lean()
		const teamStats = new Map<number, Team>()

		games.forEach((game) => {
			const homeScore = parseInt(game.HomeTeamScore)
			const awayScore = parseInt(game.AwayTeamScore)

			if (!teamStats.has(game.HomeTeamID)) {
				teamStats.set(game.HomeTeamID, {
					TeamID: game.HomeTeamID,
					TeamName: game.HomeTeamClubName,
					GamesPlayed: 0,
					Wins: 0,
					Losses: 0,
					Draws: 0,
					GoalsFor: 0,
					GoalsAgainst: 0,
					Points: 0
				})
			}
			if (!teamStats.has(game.AwayTeamID)) {
				teamStats.set(game.AwayTeamID, {
					TeamID: game.AwayTeamID,
					TeamName: game.AwayTeamClubName,
					GamesPlayed: 0,
					Wins: 0,
					Losses: 0,
					Draws: 0,
					GoalsFor: 0,
					GoalsAgainst: 0,
					Points: 0
				})
			}

			const homeTeam = teamStats.get(game.HomeTeamID)!
			const awayTeam = teamStats.get(game.AwayTeamID)!

			homeTeam.GamesPlayed++
			awayTeam.GamesPlayed++

			homeTeam.GoalsFor += homeScore
			homeTeam.GoalsAgainst += awayScore
			awayTeam.GoalsFor += awayScore
			awayTeam.GoalsAgainst += homeScore

			if (homeScore > awayScore) {
				homeTeam.Wins++
				awayTeam.Losses++
				homeTeam.Points += 3
			} else if (awayScore > homeScore) {
				awayTeam.Wins++
				homeTeam.Losses++
				awayTeam.Points += 3
			} else {
				homeTeam.Draws++
				awayTeam.Draws++
				homeTeam.Points += 1
				awayTeam.Points += 1
			}
		})

		// Convert to array and sort by points (and goal difference if points are equal)
		// Find the most recent UpdatedAt from all games
		const latestGame = games.reduce((latest, current) => {
			if (
				!latest ||
				(current.UpdatedAt && current.UpdatedAt > latest.UpdatedAt)
			) {
				return current
			}
			return latest
		}, games[0])

		const table: Table = {
			LeagueID: latestGame?.LeagueID || 0,
			LeagueName: latestGame?.LeagueName || '',
			UpdatedAt: latestGame?.UpdatedAt || '',
			Teams: Array.from(teamStats.values()).sort((a, b) => {
				if (b.Points !== a.Points) return b.Points - a.Points
				const aGoalDiff = a.GoalsFor - a.GoalsAgainst
				const bGoalDiff = b.GoalsFor - b.GoalsAgainst
				if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff
				return b.GoalsFor - a.GoalsFor
			})
		}

		res.json(table)
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: 'An unknown error occurred'
		res.status(500).json({ message: errorMessage })
	}
})

export default router
