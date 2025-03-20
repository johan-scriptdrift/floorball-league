import { Team } from './team.js'

export interface Table {
	LeagueID: number
	LeagueName: string
	UpdatedAt: string
	Teams: Team[]
}
