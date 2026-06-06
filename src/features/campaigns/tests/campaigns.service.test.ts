import {
    createCampaignModule,
    createManagedCampaign,
    getManagedCampaignById,
    listManagedCampaigns,
    resetManagedCampaignStore,
    submitCampaignReview,
} from '../campaigns.service'

describe('campaigns.service', () => {
    beforeEach(() => {
        resetManagedCampaignStore()
    })

    it('creates a campaign, adds module data and moves it to submitted state', () => {
        const created = createManagedCampaign({
            title: 'Chien dich he tinh nguyen 2026',
            summary: 'Dong hanh cung cong dong dia phuong',
            description: 'Mo ta chi tiet',
            scope_type: 'PUBLIC',
            start_at: '2026-07-01T01:00:00.000Z',
            end_at: '2026-07-15T10:00:00.000Z',
        })

        expect(created.id).toMatch(/^campaign-/)

        const createdModule = createCampaignModule(created.id, {
            type: 'event',
            title: 'Tuyen tinh nguyen vien',
            description: 'Mo ta module',
            start_at: '2026-07-01T01:00:00.000Z',
            end_at: '2026-07-15T10:00:00.000Z',
            settings: {
                quota: 50,
                location: 'Toa A1',
            },
        })

        expect(createdModule).toEqual(
            expect.objectContaining({
                id: expect.stringMatching(/^module-event-/),
            })
        )

        const submitted = submitCampaignReview(created.id)

        expect(submitted).toEqual({
            id: created.id,
            from_status: 'DRAFT',
            to_status: 'SUBMITTED',
        })

        const list = listManagedCampaigns({})
        expect(list.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: created.id,
                    title: 'Chien dich he tinh nguyen 2026',
                    status: 'SUBMITTED',
                }),
            ])
        )

        const detail = getManagedCampaignById(created.id)
        expect(detail).toEqual(
            expect.objectContaining({
                id: created.id,
                modules: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'event',
                        title: 'Tuyen tinh nguyen vien',
                        settings: expect.objectContaining({
                            quota: 50,
                            location: 'Toa A1',
                        }),
                    }),
                ]),
            })
        )
    })
})
