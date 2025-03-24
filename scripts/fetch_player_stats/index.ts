import axios from 'axios'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const BASE_URL =
	'https://app.innebandy.se/api/followgameapi/initlivetimelineblurbs'
const AUTH_TOKEN = process.env.AUTH_TOKEN
const API_BASE_URL = 'https://floorball-league.vercel.app/api/'

enum Action {
	Goal = 'Goal',
	Assist = 'Assist'
}

interface GameTimelineData {
	DetailsText: string
	IsGoal: boolean
	IsAwayTeamAction: boolean
	ClubDisplayName: string
	GameMinute: string
	Period: number
	IsPeriodStart: boolean
	IsPeriodEnd: boolean
	IsGameEnd: boolean
}

interface Game {
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
	UpdatedAt: string
}

interface Player {
	Id: string
	Name: string
	JerseyNumber: string
	Team: string
	Goals: number
	Assists: number
}

const playerSchema = new mongoose.Schema({
	Id: { type: String, required: true, unique: true },
	Name: { type: String, required: true },
	JerseyNumber: { type: String, required: true },
	Team: { type: String, required: true },
	Goals: { type: Number, required: true },
	Assists: { type: Number, required: true }
})

const Player = mongoose.model('Player', playerSchema)

async function fetchGameTimeline(
	gameId: number
): Promise<GameTimelineData[]> {
	let timeLineData: GameTimelineData[] = []
	try {
		const generateCallback = () =>
			`jQuery${Date.now()}${Math.floor(
				Math.random() * 1000000
			)}_${Date.now()}`

		const headers = {
			Authorization: `Bearer ${AUTH_TOKEN}`,
			Accept:
				'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01',
			'Accept-Language': 'en-US,en;q=0.9',
			'Cache-Control': 'no-cache',
			Pragma: 'no-cache',
			'X-Platform': '2',
			'X-Requested-With': 'XMLHttpRequest',
			'User-Agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
			'sec-ch-ua':
				'"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"macOS"'
		}

		const parseJsonpResponse = (data: string) => {
			const jsonStr = data
				.replace(/^jQuery.*?\(/, '')
				.replace(/\);?$/, '')
			return JSON.parse(jsonStr)
		}

		const parseNetDate = (dateString: string) => {
			if (!dateString) return null
			const timestamp = dateString.match(/\d+/)?.[0]
			if (!timestamp) return null

			const date = new Date(parseInt(timestamp))
			return date.toISOString().slice(0, 19).replace('T', ' ')
		}

		interface TimelineBlurb {
			EREventInfo: {
				ClubDisplayName?: string
				DetailsText?: string
				IsGoal?: boolean
				IsAwayTeamAction?: boolean
				GameMinute?: string
				Period?: number
				IsPeriodStart?: boolean
				IsPeriodEnd?: boolean
				IsGameEnd?: boolean
				EREventID?: string
			}
			InsertTime?: string
		}

		// Helper function to process timeline blurbs
		const processTimelineBlurbs = (data: any): GameTimelineData[] => {
			let blurbs: TimelineBlurb[] = []

			// Extract the actual timeline data from the response
			let timelineData = data

			// Handle JSONP response
			if (typeof data === 'string') {
				try {
					// Extract JSON from JSONP response
					const jsonStr = data
						.replace(/^jQuery.*?\(/, '')
						.replace(/\);?$/, '')
					timelineData = JSON.parse(jsonStr)
				} catch (e) {
					console.error('Error parsing JSONP response:', e)
					return []
				}
			}

			// Extract timeline data from response
			const extractTimelineItems = (obj: any): TimelineBlurb[] => {
				if (!obj || typeof obj !== 'object') return []

				// If it's an array, process each item
				if (Array.isArray(obj)) {
					return obj.filter((item) => item && item.EREventInfo)
				}

				// If it has EREventInfo, it's a timeline item
				if (obj.EREventInfo) {
					return [obj]
				}

				// If it has TimelineBlurbs, process those
				if (obj.TimelineBlurbs) {
					return extractTimelineItems(obj.TimelineBlurbs)
				}

				// Skip roster data
				if (obj.GameTeamRoster || obj.TeamSponsors) {
					return []
				}

				// Recursively search through object properties
				return Object.values(obj).reduce(
					(acc: TimelineBlurb[], val) => {
						if (val && typeof val === 'object') {
							return [...acc, ...extractTimelineItems(val)]
						}
						return acc
					},
					[]
				)
			}

			// Process the timeline data
			blurbs = extractTimelineItems(timelineData)

			console.log('Raw blurbs:', JSON.stringify(blurbs, null, 2))

			const filteredBlurbs = blurbs.filter(
				(timeLineBlurb): timeLineBlurb is TimelineBlurb =>
					timeLineBlurb &&
					timeLineBlurb.EREventInfo &&
					(Boolean(timeLineBlurb.EREventInfo.IsGoal) ||
						Boolean(timeLineBlurb.EREventInfo.IsPeriodStart) ||
						Boolean(timeLineBlurb.EREventInfo.IsPeriodEnd) ||
						Boolean(timeLineBlurb.EREventInfo.IsGameEnd))
			)
			console.log('Filtered blurbs count:', filteredBlurbs.length)

			return filteredBlurbs.map((timeLineBlurb) => {
				const gameTimelineData: GameTimelineData = {
					ClubDisplayName:
						timeLineBlurb.EREventInfo.ClubDisplayName || '',
					DetailsText: timeLineBlurb.EREventInfo.DetailsText || '',
					IsGoal: Boolean(timeLineBlurb.EREventInfo.IsGoal),
					IsAwayTeamAction: Boolean(
						timeLineBlurb.EREventInfo.IsAwayTeamAction
					),
					GameMinute: timeLineBlurb.EREventInfo.GameMinute || '',
					Period: timeLineBlurb.EREventInfo.Period || 0,
					IsPeriodStart: Boolean(
						timeLineBlurb.EREventInfo.IsPeriodStart
					),
					IsPeriodEnd: Boolean(timeLineBlurb.EREventInfo.IsPeriodEnd),
					IsGameEnd: Boolean(timeLineBlurb.EREventInfo.IsGameEnd)
				}
				console.log(
					'Processed blurb:',
					JSON.stringify(gameTimelineData, null, 2)
				)
				return gameTimelineData
			})
		}

		// Get initial timeline data
		const initialResponse = await axios.get(
			`${BASE_URL}?gameid=${gameId}&callback=${generateCallback()}&_=${Date.now()}`,
			{ headers, responseType: 'text' }
		)

		const initialData = parseJsonpResponse(initialResponse.data)
		timeLineData = processTimelineBlurbs(initialData)
		console.log(
			`Fetched ${timeLineData.length} initial timeline items for game ${gameId}`
		)

		// Get additional timeline items if available
		let hasMoreItems = true
		let currentData = initialData
		let pageCount = 1

		while (hasMoreItems) {
			console.log(`Processing page ${pageCount} for game ${gameId}`)
			const items = Array.isArray(currentData)
				? currentData
				: currentData.TimelineBlurbs || []
			console.log(`Found ${items.length} items on page ${pageCount}`)

			if (items.length === 0) {
				console.log(`No items found on page ${pageCount}, stopping`)
				break
			}

			const lastItem = items[items.length - 1]
			console.log('Last item:', JSON.stringify(lastItem, null, 2))
			console.log('InsertTime:', lastItem?.InsertTime)
			console.log(
				'Parsed timestamp:',
				parseNetDate(lastItem?.InsertTime)
			)
			console.log('EREventInfo:', lastItem?.EREventInfo)
			console.log('EREventID:', lastItem?.EREventInfo?.EREventID)

			const timestamp = parseNetDate(lastItem?.InsertTime)
			if (!timestamp || !lastItem?.EREventInfo?.EREventID) {
				console.log('Last item missing required fields, stopping')
				break
			}

			try {
				const lastTimelineItem = timestamp
				const lastItemId = lastItem.EREventInfo.EREventID
				console.log(
					`Fetching next page with lastTimelineItem=${lastTimelineItem} and lastItemId=${lastItemId}`
				)

				const moreResponse = await axios.get(
					`https://app.innebandy.se/api/followgameapi/getmoretimelineblurbs/?gameid=${gameId}&lasttimelineitem=${encodeURIComponent(
						lastTimelineItem
					)}&lastitemid=${lastItemId}&callback=${generateCallback()}&_=${Date.now()}`,
					{ headers, responseType: 'text' }
				)

				currentData = parseJsonpResponse(moreResponse.data)
				console.log(
					'Response data:',
					JSON.stringify(currentData, null, 2)
				)

				const moreItems = processTimelineBlurbs(currentData)

				if (moreItems.length === 0) {
					console.log('No more items found, stopping')
					hasMoreItems = false
				} else {
					timeLineData = [...timeLineData, ...moreItems]
					console.log(
						`Added ${moreItems.length} more timeline items for game ${gameId}`
					)
				}

				pageCount++
			} catch (error) {
				console.error(
					`Error fetching more timeline items for game ${gameId}:`,
					error
				)
				hasMoreItems = false
			}
		}

		return timeLineData
	} catch (error: any) {
		if (axios.isAxiosError(error)) {
			console.error('Network error fetching timeline:', {
				status: error.response?.status,
				data: error.response?.data,
				url: error.config?.url,
				method: error.config?.method
			})
		} else if (error instanceof Error) {
			console.error('Error processing timeline data:', error.message)
		} else {
			console.error('Unknown error in fetchGameTimeline:', error)
		}
		throw error
	}

	return timeLineData
}

async function fetchGames(): Promise<Game[]> {
	try {
		const response = await axios.get(`${API_BASE_URL}/games`)
		return response.data
	} catch (error) {
		console.error('Error fetching games:', error)
		throw error
	}
}

async function connectToMongoDB() {
	try {
		await mongoose.connect(process.env.DATABASE_URL!)
		console.log('Connected to MongoDB')
	} catch (error) {
		console.error('MongoDB connection error:', error)
		process.exit(1)
	}
}

;(async () => {
	await connectToMongoDB()
	const players: Record<string, Player> = {}
	try {
		const games = await fetchGames()
		//console.log('Games:', games)

		let count = 0

		for (const game of games) {
			count++
			try {
				const timeline = await fetchGameTimeline(game.GameID)
				//console.log('Timeline data:', timeline)
				for (const event of timeline) {
					if (event.IsGoal) {
						const details = parseDetailsText(event.DetailsText)
						details.forEach((detail) => {
							const playerId =
								event.ClubDisplayName +
								'-' +
								detail.Number +
								'-' +
								detail.Name
							if (!players[playerId]) {
								players[playerId] = {
									Id: playerId,
									Name: detail.Name,
									JerseyNumber: detail.Number,
									Team: event.IsAwayTeamAction
										? game.AwayTeamClubName
										: game.HomeTeamClubName,
									Goals: 0,
									Assists: 0
								}
							}
							if (detail.Action === Action.Goal) {
								players[playerId].Goals += 1
							} else if (detail.Action === Action.Assist) {
								players[playerId].Assists += 1
							}
						})
					}
				}
			} catch (error) {
				console.error('Failed to fetch timeline:', error)
			}
			console.log('Game:', game.GameID)
			if (count > 2) {
				break
			}
		}
	} catch (error) {
		console.error('Failed to fetch games:', error)
	}

	try {
		const playerList = Object.values(players)
		//console.log('Player list:', playerList)

		const operations = playerList.map((player) => {
			return Player.findOneAndUpdate({ Id: player.Id }, player, {
				upsert: true,
				new: true
			})
		})

		await Promise.all(operations)
		console.log(
			'All player stats processed. Updated/Saved:',
			playerList.length
		)
	} catch (error) {
		console.error('Failed to save players to MongoDB:', error)
	} finally {
		try {
			await mongoose.disconnect()
			console.log('Disconnected from MongoDB')
		} catch (error) {
			console.error('Error disconnecting from MongoDB:', error)
		}
		process.exit(0)
	}
})()

interface Detail {
	Action: Action
	Name: string
	Number: string
}

// "67 Fname Lname, ass 3 Fname Lname"
function parseDetailsText(inputText: string): Detail[] {
	let details: Detail[] = []
	if (inputText.includes(', ass')) {
		const splittedText = inputText.split(', ass ')
		let goal = createDetail(splittedText[0], Action.Goal)
		let assist = createDetail(splittedText[1], Action.Assist)
		details.push(goal, assist)
	} else {
		details.push(createDetail(inputText, Action.Goal))
	}
	return details
}

function createDetail(text: string, action: Action): Detail {
	let detail: Detail = { Action: action, Name: '', Number: '' }
	const splittedText = text.split(' ')
	for (let i = 0; i < splittedText.length; i++) {
		if (i === 0) {
			detail.Number = splittedText[i]
		} else {
			if (detail.Name.length > 0) {
				detail.Name += ' '
			}
			detail.Name += splittedText[i]
		}
	}
	return detail
}
