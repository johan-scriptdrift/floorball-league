import axios from 'axios'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const BASE_URL =
	'https://app.innebandy.se/api/leagueapi/getpreviousleaguegames/'
const LEAGUE_ID = process.env.LEAGUE_ID
const AUTH_TOKEN = process.env.AUTH_TOKEN

interface GameData {
	GameID: number
	GameStatusID: number
	LeagueID: number
	LeagueName: string
	GameRound: number
	LeagueDisplayName: string
	HomeTeamID: number
	AwayTeamID: number
	HomeTeamClubName: string
	AwayTeamClubName: string
	HomeTeamScore: string
	AwayTeamScore: string
	GameTime: string
	ArenaName: string
}

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
	UpdatedAt: { type: String }
})

const Game = mongoose.model('Game', gameSchema)
const DATABASE_URL =
	process.env.DATABASE_URL ||
	'mongodb://127.0.0.1:27017/floorball-league'

console.log('Connecting to MongoDB...')
mongoose
	.connect(DATABASE_URL)
	.then(() => {
		console.log('Connected to MongoDB')
	})
	.catch((err) => {
		console.error('MongoDB connection error:', err)
		process.exit(1)
	})

function parseGameId(id: string | number): number {
	return typeof id === 'string' ? parseInt(id, 10) : id
}

async function fetchGames(
	lastGameId: number = 0
): Promise<GameData[]> {
	let allGames: GameData[] = []
	let hasMoreData = true
	let retryCount = 0
	const maxRetries = 3
	const seenGameIds = new Set<number>()
	let emptyResponseCount = 0
	const maxEmptyResponses = 5

	while (hasMoreData && retryCount < maxRetries) {
		try {
			console.log(`Fetching games with lastGameId: ${lastGameId}`)
			const response = await axios.get(
				`${BASE_URL}?leagueid=${LEAGUE_ID}&lastgameid=${lastGameId}`,
				{
					headers: {
						Authorization: AUTH_TOKEN,
						Accept: 'application/json',
						'X-Platform': '2',
						'X-Requested-With': 'XMLHttpRequest',
						'User-Agent':
							'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
					}
				}
			)

			const data = response.data

			if (!data || !Array.isArray(data) || data.length === 0) {
				emptyResponseCount++
				console.log(
					`Empty response received (${emptyResponseCount}/${maxEmptyResponses})`
				)

				if (emptyResponseCount >= maxEmptyResponses) {
					console.log('Max empty responses reached, stopping')
					hasMoreData = false
					break
				}

				lastGameId += 10
				await new Promise((resolve) => setTimeout(resolve, 1000))
				continue
			}

			emptyResponseCount = 0

			const newGames = data.filter((game) => {
				const id = game.GameID
				if (!seenGameIds.has(id)) {
					seenGameIds.add(id)
					return true
				}
				return false
			})

			if (newGames.length > 0) {
				allGames.push(...newGames)
				console.log(
					`Added ${newGames.length} new games. Total: ${allGames.length}`
				)

				lastGameId = data[data.length - 1].GameID
				console.log(`Next lastGameId: ${lastGameId}`)
			} else {
				console.log('No new games found, stopping')
				hasMoreData = false
				break
			}

			await new Promise((resolve) => setTimeout(resolve, 1000))
		} catch (error: any) {
			if (axios.isAxiosError(error)) {
				console.error('Error details:', {
					status: error.response?.status,
					data: error.response?.data,
					config: {
						url: error.config?.url,
						method: error.config?.method,
						headers: error.config?.headers
					}
				})
			}

			retryCount++
			if (retryCount < maxRetries) {
				console.log(`Retry attempt ${retryCount} of ${maxRetries}`)
				await new Promise((resolve) =>
					setTimeout(resolve, 2000 * retryCount)
				)
			} else {
				console.error('Max retries reached, stopping')
				hasMoreData = false
			}
		}
	}

	return allGames
}

async function saveGames(games: GameData[]) {
	console.log('Saving games to MongoDB...')
	let saved = 0
	let errors = 0

	for (const gameData of games) {
		try {
			await Game.findOneAndUpdate(
				{ GameID: gameData.GameID },
				{
					...gameData,
					UpdatedAt: new Date().toISOString()
				},
				{ upsert: true, new: true }
			)
			saved++
		} catch (error) {
			console.error(`Error saving game ${gameData.GameID}:`, error)
			errors++
		}
	}

	console.log(`Saved ${saved} games, encountered ${errors} errors`)
	return { saved, errors }
}

mongoose.connection.once('open', () => {
	console.log('MongoDB connection ready, starting to fetch games...')
	fetchGames()
		.then(async (games) => {
			console.log(`Total games fetched: ${games.length}`)
			const result = await saveGames(games)
			console.log(
				'All games processed. Saved:',
				result.saved,
				'Errors:',
				result.errors
			)
			await mongoose.disconnect()
			console.log('Disconnected from MongoDB')
			process.exit(0)
		})
		.catch((error) => {
			console.error('Fetching failed:', error)
			mongoose.disconnect()
			process.exit(1)
		})
})
