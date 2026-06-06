import { locationCatalog } from './locations.data'
import { LocationItem, LocationType } from './types'

export const listLocations = (type?: string): LocationItem[] => {
    const normalizedType = String(type ?? '')
        .trim()
        .toUpperCase() as LocationType | ''

    if (!normalizedType) {
        return locationCatalog
    }

    return locationCatalog.filter((location) => location.type === normalizedType)
}

