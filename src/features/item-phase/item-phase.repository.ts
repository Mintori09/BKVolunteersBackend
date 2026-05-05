import { prismaClient } from 'src/config'
import { CreateItemPhaseInput, UpdateItemPhaseInput } from './types'

export const findCampaignById = async (campaignId: string) => {
    return prismaClient.campaign.findUnique({
        where: { id: campaignId, deletedAt: null },
    })
}

export const findItemPhaseByCampaignId = async (campaignId: string) => {
    return prismaClient.itemDonationCampaign.findUnique({
        where: { campaignId },
    })
}

export const findItemPhaseById = async (phaseId: number) => {
    return prismaClient.itemDonationCampaign.findUnique({
        where: { id: phaseId },
    })
}

export const createItemPhase = async (
    campaignId: string,
    data: CreateItemPhaseInput
) => {
    return prismaClient.itemDonationCampaign.create({
        data: {
            campaignId,
            acceptedItems: JSON.stringify(data.acceptedItems),
            collectionAddress: data.collectionAddress,
            startDate: data.startDate,
            endDate: data.endDate,
        },
    })
}

export const updateItemPhase = async (
    phaseId: number,
    data: UpdateItemPhaseInput
) => {
    const updateData: Record<string, unknown> = {}

    if (data.acceptedItems !== undefined) {
        updateData.acceptedItems = JSON.stringify(data.acceptedItems)
    }
    if (data.collectionAddress !== undefined) {
        updateData.collectionAddress = data.collectionAddress
    }
    if (data.startDate !== undefined) {
        updateData.startDate = data.startDate
    }
    if (data.endDate !== undefined) {
        updateData.endDate = data.endDate
    }

    return prismaClient.itemDonationCampaign.update({
        where: { id: phaseId },
        data: updateData,
    })
}

export const deleteItemPhase = async (phaseId: number) => {
    return prismaClient.itemDonationCampaign.delete({
        where: { id: phaseId },
    })
}

export const countDonationsByPhaseId = async (phaseId: number) => {
    return prismaClient.donation.count({
        where: { itemPhaseId: phaseId },
    })
}
