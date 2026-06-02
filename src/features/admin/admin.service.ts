import { serializeId, serializePagination } from 'src/common/serializers'
import * as certificatesService from 'src/features/certificates/certificates.service'
import * as fundraisingService from 'src/features/fundraising/fundraising.service'
import * as adminRepository from './admin.repository'
import {
    AdminAuditLogListOutput,
    AdminAuditLogsQuery,
    AdminBackgroundJobListOutput,
    AdminBackgroundJobsQuery,
    AdminRunBackgroundJobsBody,
} from './types'

export const listAuditLogs = async (
    query: AdminAuditLogsQuery
): Promise<AdminAuditLogListOutput> => {
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 20)
    const where = {
        ...(query.action ? { action: query.action } : {}),
        ...(query.entity_type ? { entityType: query.entity_type } : {}),
        ...(query.entity_id ? { entityId: BigInt(query.entity_id) } : {}),
        ...(query.actor_type ? { actorType: query.actor_type } : {}),
        ...(query.actor_id ? { actorId: BigInt(query.actor_id) } : {}),
        ...(query.from || query.to
            ? {
                  createdAt: {
                      ...(query.from ? { gte: new Date(query.from) } : {}),
                      ...(query.to ? { lte: new Date(query.to) } : {}),
                  },
              }
            : {}),
    }
    const [total, items] = await adminRepository.findAuditLogs({
        page,
        limit,
        where,
    })

    return serializePagination(
        items.map((item) => ({
            id: serializeId(item.id)!,
            actor_type: item.actorType,
            actor_id: serializeId(item.actorId)!,
            action: item.action,
            entity_type: item.entityType,
            entity_id: serializeId(item.entityId)!,
            before_json: item.beforeJson,
            after_json: item.afterJson,
            ip_address: item.ipAddress,
            created_at: item.createdAt,
        })),
        {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        }
    )
}

export const listBackgroundJobs = async (
    query: AdminBackgroundJobsQuery
): Promise<AdminBackgroundJobListOutput> => {
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 20)
    const where = {
        ...(query.type ? { type: query.type } : {}),
        ...(query.status ? { status: query.status } : {}),
    }
    const [total, items] = await adminRepository.findBackgroundJobs({
        page,
        limit,
        where,
    })

    return serializePagination(
        items.map((item) => ({
            id: serializeId(item.id)!,
            type: item.type,
            status: item.status,
            payload_json: item.payloadJson,
            attempts: item.attempts,
            last_error: item.lastError,
            run_at: item.runAt,
            locked_at: item.lockedAt,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
        })),
        {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        }
    )
}

export const runBackgroundJobs = async (
    body: AdminRunBackgroundJobsBody
) => {
    if (body.type?.startsWith('SEPAY_')) {
        return fundraisingService.processDueBackgroundJobs({
            type: body.type,
            limit: body.limit,
        })
    }

    return certificatesService.processDueBackgroundJobs({
        type: body.type,
        limit: body.limit,
    })
}

export const retryBackgroundJob = async (idRaw: string) => {
    const job = await adminRepository.findBackgroundJobById(BigInt(idRaw))
    if (job?.type?.startsWith('SEPAY_')) {
        return fundraisingService.retryBackgroundJob(idRaw)
    }

    return certificatesService.retryBackgroundJob(idRaw)
}
