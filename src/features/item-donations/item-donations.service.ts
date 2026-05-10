import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as itemDonationsRepository from './item-donations.repository'
import {
    ConfirmItemPledgeOutput,
    CreateItemPledgeBody,
    CreateItemPledgeOutput,
    ItemDonationModuleOutput,
} from './types'

export const getItemDonationModule = async (
    moduleIdRaw: string
): Promise<ItemDonationModuleOutput> => {
    const module = await itemDonationsRepository.findModuleById(BigInt(moduleIdRaw))

    if (!module || module.type !== 'ITEM_DONATION') {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    return {
        id: serializeId(module.id)!,
        campaign_id: serializeId(module.campaignId)!,
        type: module.type,
        title: module.title,
        description: module.description,
        status: module.status,
        settings_json: module.settingsJson,
        targets: module.itemTargets.map((target) => ({
            id: serializeId(target.id)!,
            name: target.name,
            unit: target.unit,
            target_quantity: target.targetQuantity,
            received_quantity: target.receivedQuantity,
        })),
        pledged_quantity: module.itemPledges.reduce(
            (sum, pledge) => sum + pledge.quantity,
            0
        ),
        campaign: {
            id: serializeId(module.campaign.id)!,
            title: module.campaign.title,
            slug: module.campaign.slug,
            status: module.campaign.status,
        },
    }
}

export const createPledge = async (
    moduleIdRaw: string,
    body: CreateItemPledgeBody,
    principal?: { accountType?: string; userId?: string }
): Promise<CreateItemPledgeOutput> => {
    if (principal?.accountType !== 'STUDENT' || !principal.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản sinh viên')
    }

    const moduleId = BigInt(moduleIdRaw)
    const itemTargetId = BigInt(body.item_target_id)
    const module = await itemDonationsRepository.findModuleWithCampaign(moduleId)

    if (!module || module.type !== 'ITEM_DONATION') {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    const target = await itemDonationsRepository.findTarget({
        id: itemTargetId,
        moduleId,
        campaignId: module.campaignId,
    })

    if (!target) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Target not found')
    }

    const pledge = await itemDonationsRepository.createPledge({
        campaignId: module.campaignId,
        moduleId,
        itemTargetId,
        studentId: BigInt(principal.userId),
        donorName: body.donor_name ?? 'Sinh viên ẩn danh',
        quantity: body.quantity,
        note: body.note ?? null,
    })

    return {
        id: serializeId(pledge.id)!,
        status: pledge.status,
        quantity: pledge.quantity,
        item_target_id: serializeId(pledge.itemTargetId)!,
    }
}

export const confirmPledge = async (
    idRaw: string,
    principal?: { accountType?: string }
): Promise<ConfirmItemPledgeOutput> => {
    if (principal?.accountType !== 'OPERATOR') {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }

    const pledge = await itemDonationsRepository.confirmPledge(BigInt(idRaw))
    return {
        id: serializeId(pledge.id)!,
        status: pledge.status,
    }
}
