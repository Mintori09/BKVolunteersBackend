export type LocationType = 'CAMPUS' | 'COMMUNITY' | 'PARTNER'

export interface LocationItem {
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
    type: LocationType
    description: string
}

