import { locationCatalog } from './locations.data'
import { LocationItem, LocationType } from './types'

// Locations are a static system catalog for now and intentionally not backed by Prisma.
export const listLocations = (type?: string): LocationItem[] => {
    const normalizedType = String(type ?? '')
        .trim()
        .toUpperCase() as LocationType | ''

    if (!normalizedType) {
        return locationCatalog
    }

    return locationCatalog.filter(
        (location) => location.type === normalizedType
    )
}
