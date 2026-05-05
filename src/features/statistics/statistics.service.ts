import * as statisticsRepository from './statistics.repository'

export const getSystemStatistics = async () => {
    return statisticsRepository.getSystemStatistics()
}
