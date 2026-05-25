import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as notificationService from 'src/features/notification/notification.service'
import * as itemDonationsRepository from './item-donations.repository'
import {
    ConfirmItemPledgeOutput,
    CreateItemPledgeBody,
    CreateItemPledgeOutput,
    CreateItemTargetBody,
    ItemDonationConfigBody,
    ItemDonationConfigOutput,
    ItemDonationModuleOutput,
    ItemDonationPledgeListQuery,
    ItemDonationTargetListQuery,
    ItemPledgeHandoverBody,
    ItemPledgeHandoverOutput,
    ItemPledgeOutput,
    ItemPledgeTransitionOutput,
    ItemTargetOutput,
    RejectItemPledgeBody,
    UpdateItemTargetBody,
} from './types'

type Principal = {
    accountType?: string
    userId?: string
    role?: string
    organizationId?: string | null
}

const requireStudent = (principal?: Principal) => {
    if (principal?.accountType !== 'STUDENT' || !principal.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản sinh viên')
    }

    return principal
}

const requireOperator = (principal?: Principal) => {
    if (principal?.accountType !== 'OPERATOR' || !principal.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }

    return principal
}

const assertOperatorScope = (
    principal: Principal,
    organizationId: bigint | null | undefined
) => {
    if (principal.role === 'DOANTRUONG' || principal.role === 'LCD') {
        return
    }

    if (!principal.organizationId || !organizationId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Không có quyền thao tác module hiện vật này'
        )
    }

    if (principal.organizationId !== organizationId.toString()) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Không có quyền thao tác module hiện vật này'
        )
    }
}

const getModuleConfig = (settingsJson: unknown): Record<string, unknown> => {
    if (!settingsJson || typeof settingsJson !== 'object') {
        return {}
    }

    return settingsJson as Record<string, unknown>
}

const isItemDonationModuleType = (value: string | null | undefined) =>
    value === 'ITEM_DONATION' || value === 'item_donation'

const ensureParticipationOpen = (module: {
    status: string
    startAt: Date
    endAt: Date
    campaign: { status: string }
}) => {
    if (!['PUBLISHED', 'ONGOING'].includes(module.campaign.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chiến dịch chưa mở để tiếp nhận hiện vật'
        )
    }

    if (['CLOSED', 'CANCELLED'].includes(module.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Hạng mục hiện vật đã đóng')
    }

    const now = Date.now()
    if (now < module.startAt.getTime() || now > module.endAt.getTime()) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Hạng mục hiện vật không nằm trong thời gian tiếp nhận'
        )
    }
}

const serializeTarget = (target: {
    id: bigint
    moduleId: bigint
    campaignId: bigint
    name: string
    unit: string
    targetQuantity: number
    receivedQuantity: number
    description: string | null
    status: string
}): ItemTargetOutput => ({
    id: serializeId(target.id)!,
    module_id: serializeId(target.moduleId)!,
    campaign_id: serializeId(target.campaignId)!,
    name: target.name,
    unit: target.unit,
    target_quantity: target.targetQuantity,
    received_quantity: target.receivedQuantity,
    remaining_quantity: Math.max(
        0,
        target.targetQuantity - target.receivedQuantity
    ),
    description: target.description,
    status: target.status,
})

const serializePledge = (pledge: {
    id: bigint
    moduleId: bigint
    campaignId: bigint
    donorName: string
    quantity: number
    status: string
    note: string | null
    expectedHandoverAt: Date | null
    receivedQuantity: number | null
    receivedAt: Date | null
    createdAt: Date
    itemTarget: { id: bigint; name: string; unit: string }
    student: { id: bigint; fullName: string; studentCode: string }
}): ItemPledgeOutput => ({
    id: serializeId(pledge.id)!,
    module_id: serializeId(pledge.moduleId)!,
    campaign_id: serializeId(pledge.campaignId)!,
    item_target: {
        id: serializeId(pledge.itemTarget.id)!,
        name: pledge.itemTarget.name,
        unit: pledge.itemTarget.unit,
    },
    student: {
        id: serializeId(pledge.student.id)!,
        full_name: pledge.student.fullName,
        student_code: pledge.student.studentCode,
    },
    donor_name: pledge.donorName,
    quantity: pledge.quantity,
    status: pledge.status,
    note: pledge.note,
    expected_handover_at: pledge.expectedHandoverAt?.toISOString() ?? null,
    received_quantity: pledge.receivedQuantity,
    received_at: pledge.receivedAt?.toISOString() ?? null,
    created_at: pledge.createdAt.toISOString(),
})

export const getItemDonationModule = async (
    moduleIdRaw: string
): Promise<ItemDonationModuleOutput> => {
    const module = await itemDonationsRepository.findModuleById(BigInt(moduleIdRaw))

    if (!module || !isItemDonationModuleType(module.type)) {
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

export const updateModuleConfig = async (
    moduleIdRaw: string,
    body: ItemDonationConfigBody,
    principal?: Principal
): Promise<ItemDonationConfigOutput> => {
    const operator = requireOperator(principal)
    const module = await itemDonationsRepository.findModuleWithCampaign(
        BigInt(moduleIdRaw)
    )

    if (!module || !isItemDonationModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    assertOperatorScope(operator, module.campaign.organizationId)

    const config = {
        ...getModuleConfig(module.settingsJson),
        receiver_address: body.receiver_address,
        receiver_contact: body.receiver_contact,
        allow_over_target: body.allow_over_target,
        handover_note: body.handover_note ?? null,
    }

    const updated = await itemDonationsRepository.updateModuleConfig({
        moduleId: module.id,
        settingsJson: config,
    })

    return {
        module_id: serializeId(updated.id)!,
        config: getModuleConfig(updated.settingsJson),
    }
}

export const createTarget = async (
    moduleIdRaw: string,
    body: CreateItemTargetBody,
    principal?: Principal
) => {
    const operator = requireOperator(principal)
    const module = await itemDonationsRepository.findModuleWithCampaign(
        BigInt(moduleIdRaw)
    )

    if (!module || !isItemDonationModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    assertOperatorScope(operator, module.campaign.organizationId)

    const target = await itemDonationsRepository.createTarget({
        campaignId: module.campaignId,
        moduleId: module.id,
        name: body.name,
        unit: body.unit,
        targetQuantity: body.target_quantity,
        description: body.description ?? null,
    })

    return { id: serializeId(target.id)! }
}

export const getTargets = async (
    moduleIdRaw: string,
    query: ItemDonationTargetListQuery
): Promise<ItemTargetOutput[]> => {
    const targets = await itemDonationsRepository.findTargets({
        moduleId: BigInt(moduleIdRaw),
        status: query.status,
    })

    return targets.map(serializeTarget)
}

export const updateTarget = async (
    idRaw: string,
    body: UpdateItemTargetBody,
    principal?: Principal
): Promise<ItemTargetOutput> => {
    const operator = requireOperator(principal)
    const target = await itemDonationsRepository.findTargetById(BigInt(idRaw))

    if (!target) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Target not found')
    }

    assertOperatorScope(operator, target.campaign.organizationId)

    const reservedQuantity =
        await itemDonationsRepository.sumReservedQuantityByTarget(target.id)
    const minimumTargetQuantity = Math.max(
        target.receivedQuantity,
        reservedQuantity
    )

    if (body.target_quantity < minimumTargetQuantity) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Số lượng mục tiêu không được nhỏ hơn số lượng đã cam kết hoặc đã nhận'
        )
    }

    const updated = await itemDonationsRepository.updateTarget({
        id: target.id,
        name: body.name,
        unit: body.unit,
        targetQuantity: body.target_quantity,
        description: body.description ?? null,
        status: body.status,
    })

    return serializeTarget(updated)
}

export const deleteTarget = async (
    idRaw: string,
    principal?: Principal
): Promise<void> => {
    const operator = requireOperator(principal)
    const target = await itemDonationsRepository.findTargetById(BigInt(idRaw))

    if (!target) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Target not found')
    }

    assertOperatorScope(operator, target.campaign.organizationId)

    if (target.receivedQuantity > 0 || target._count.pledges > 0) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Không thể xóa target đã phát sinh pledge hoặc đã ghi nhận hiện vật'
        )
    }

    await itemDonationsRepository.deleteTarget(target.id)
}

export const createPledge = async (
    moduleIdRaw: string,
    body: CreateItemPledgeBody,
    principal?: Principal
): Promise<CreateItemPledgeOutput> => {
    const student = requireStudent(principal)
    const moduleId = BigInt(moduleIdRaw)
    const itemTargetId = BigInt(body.item_target_id)
    const module = await itemDonationsRepository.findModuleWithCampaign(moduleId)

    if (!module || !isItemDonationModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    ensureParticipationOpen(module)

    const target = await itemDonationsRepository.findTarget({
        id: itemTargetId,
        moduleId,
        campaignId: module.campaignId,
    })

    if (!target) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Target not found')
    }

    if (target.status !== 'ACTIVE') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Mục tiêu hiện vật không còn nhận đăng ký'
        )
    }

    const config = getModuleConfig(module.settingsJson)
    const allowOverTarget = config.allow_over_target === true

    if (!allowOverTarget) {
        const reservedQuantity =
            await itemDonationsRepository.sumReservedQuantityByTarget(target.id)
        const nextReserved = reservedQuantity + body.quantity

        if (nextReserved > target.targetQuantity) {
            throw new ApiError(
                HttpStatus.CONFLICT,
                'Số lượng đăng ký vượt quá nhu cầu hiện vật còn lại'
            )
        }
    }

    const pledge = await itemDonationsRepository.createPledge({
        campaignId: module.campaignId,
        moduleId,
        itemTargetId,
        studentId: BigInt(student.userId!),
        donorName: body.donor_name ?? 'Sinh viên ẩn danh',
        quantity: body.quantity,
        note: body.note ?? null,
        expectedHandoverAt: body.expected_handover_at
            ? new Date(body.expected_handover_at)
            : null,
    })

    return {
        id: serializeId(pledge.id)!,
        status: pledge.status,
        quantity: pledge.quantity,
        item_target_id: serializeId(pledge.itemTargetId)!,
    }
}

export const getPledges = async (
    moduleIdRaw: string,
    query: ItemDonationPledgeListQuery,
    principal?: Principal
): Promise<ItemPledgeOutput[]> => {
    const operator = requireOperator(principal)
    const module = await itemDonationsRepository.findModuleWithCampaign(
        BigInt(moduleIdRaw)
    )

    if (!module || !isItemDonationModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    assertOperatorScope(operator, module.campaign.organizationId)

    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 100)
    const skip = (page - 1) * limit

    const { items } = await itemDonationsRepository.findPledgesByModuleId({
        moduleId: module.id,
        status: query.status,
        q: query.q,
        skip,
        take: limit,
    })

    return items.map(serializePledge)
}

export const confirmPledge = async (
    idRaw: string,
    principal?: Principal
): Promise<ConfirmItemPledgeOutput> => {
    const operator = requireOperator(principal)
    const pledge = await itemDonationsRepository.findPledgeById(BigInt(idRaw))

    if (!pledge) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Pledge not found')
    }

    assertOperatorScope(operator, pledge.campaign.organizationId)

    if (pledge.status !== 'PLEDGED') {
        throw new ApiError(HttpStatus.CONFLICT, 'Pledge không ở trạng thái chờ xác nhận')
    }

    const updated = await itemDonationsRepository.confirmPledge(pledge.id)

    await notificationService.createForStudent({
        studentId: pledge.student.id.toString(),
        type: 'ITEM_PLEDGE_CONFIRMED',
        title: 'Pledge hiện vật đã được xác nhận',
        message: `Đăng ký ${pledge.itemTarget.name} của bạn đã được xác nhận.`,
        dataJson: {
            pledge_id: serializeId(pledge.id)!,
            campaign_id: serializeId(pledge.campaign.id)!,
            module_id: serializeId(pledge.module.id)!,
        },
    })

    return {
        id: serializeId(updated.id)!,
        status: updated.status,
    }
}

export const rejectPledge = async (
    idRaw: string,
    body: RejectItemPledgeBody,
    principal?: Principal
): Promise<ItemPledgeTransitionOutput> => {
    const operator = requireOperator(principal)
    const pledge = await itemDonationsRepository.findPledgeById(BigInt(idRaw))

    if (!pledge) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Pledge not found')
    }

    assertOperatorScope(operator, pledge.campaign.organizationId)

    if (pledge.status !== 'PLEDGED') {
        throw new ApiError(HttpStatus.CONFLICT, 'Pledge không ở trạng thái có thể từ chối')
    }

    const updated = await itemDonationsRepository.rejectPledge({
        id: pledge.id,
        reason: body.reason,
    })

    await notificationService.createForStudent({
        studentId: pledge.student.id.toString(),
        type: 'ITEM_PLEDGE_REJECTED',
        title: 'Pledge hiện vật bị từ chối',
        message: body.reason,
        dataJson: {
            pledge_id: serializeId(pledge.id)!,
            campaign_id: serializeId(pledge.campaign.id)!,
            module_id: serializeId(pledge.module.id)!,
        },
    })

    return {
        id: serializeId(updated.id)!,
        status: updated.status,
    }
}

export const handoverPledge = async (
    idRaw: string,
    body: ItemPledgeHandoverBody,
    principal?: Principal
): Promise<ItemPledgeHandoverOutput> => {
    const operator = requireOperator(principal)
    const pledge = await itemDonationsRepository.findPledgeById(BigInt(idRaw))

    if (!pledge) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Pledge not found')
    }

    assertOperatorScope(operator, pledge.campaign.organizationId)

    if (pledge.status !== 'CONFIRMED') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ có thể ghi nhận bàn giao cho pledge đã xác nhận'
        )
    }

    if (body.received_quantity > pledge.quantity) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Số lượng thực nhận không được vượt quá số lượng đã cam kết'
        )
    }

    const config = getModuleConfig(pledge.module.settingsJson)
    const allowOverTarget = config.allow_over_target === true
    const projectedReceived =
        pledge.itemTarget.receivedQuantity + body.received_quantity

    if (!allowOverTarget && projectedReceived > pledge.itemTarget.targetQuantity) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Số lượng thực nhận vượt quá mục tiêu hiện vật'
        )
    }

    const updated = await itemDonationsRepository.handoverPledge({
        id: pledge.id,
        receivedQuantity: body.received_quantity,
        receivedAt: body.received_at ? new Date(body.received_at) : new Date(),
        evidenceUrl: body.evidence_url ?? null,
        handoverNote: body.note ?? body.location ?? null,
    })

    if (!updated) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Pledge not found')
    }

    await notificationService.createForStudent({
        studentId: pledge.student.id.toString(),
        type: 'ITEM_PLEDGE_RECEIVED',
        title: 'Đã ghi nhận bàn giao hiện vật',
        message: `Đơn vị đã ghi nhận ${body.received_quantity} ${pledge.itemTarget.unit} ${pledge.itemTarget.name}.`,
        dataJson: {
            pledge_id: serializeId(pledge.id)!,
            campaign_id: serializeId(pledge.campaign.id)!,
            module_id: serializeId(pledge.module.id)!,
            received_quantity: body.received_quantity,
        },
    })

    return {
        pledge_id: serializeId(updated.id)!,
        handover_id: `${serializeId(updated.id)}-${updated.receivedAt?.getTime() ?? Date.now()}`,
        status: updated.status,
    }
}
