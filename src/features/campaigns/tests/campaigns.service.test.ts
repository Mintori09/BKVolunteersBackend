import {
    createCampaignModule,
    createManagedCampaign,
    getManagedCampaignById,
    listManagedCampaigns,
    resetManagedCampaignStore,
    submitCampaignReview,
} from '../campaigns.service'

describe('campaigns.service', () => {
    beforeEach(async () => {
        await resetManagedCampaignStore()
    })

    it('creates a campaign, adds module data and moves it to submitted state', async () => {
        const created = await createManagedCampaign(
            {
                title: 'Chien dich he tinh nguyen 2026',
                summary: 'Dong hanh cung cong dong dia phuong',
                description: 'Mo ta chi tiet',
                scope_type: 'PUBLIC',
                start_at: '2026-07-01T01:00:00.000Z',
                end_at: '2026-07-15T10:00:00.000Z',
            },
            {
                userId: 'lcd-user',
                role: 'LCD',
            }
        )

        expect(created.id).toEqual(expect.any(String))

        const createdModule = await createCampaignModule(
            created.id,
            {
                type: 'event',
                title: 'Tuyen tinh nguyen vien',
                description: 'Mo ta module',
                start_at: '2026-07-01T01:00:00.000Z',
                end_at: '2026-07-15T10:00:00.000Z',
                settings: {
                    quota: 50,
                    location: 'Toa A1',
                },
            },
            {
                userId: 'lcd-user',
                role: 'LCD',
            }
        )

        expect(createdModule).toEqual(
            expect.objectContaining({
                id: expect.any(String),
            })
        )

        const submitted = await submitCampaignReview(
            created.id,
            'lcd-user',
            'LCD'
        )

        expect(submitted).toEqual({
            id: created.id,
            from_status: 'DRAFT',
            to_status: 'SUBMITTED',
        })

        const list = await listManagedCampaigns({})
        expect(list.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: created.id,
                    title: 'Chien dich he tinh nguyen 2026',
                    status: 'SUBMITTED',
                }),
            ])
        )

        const detail = await getManagedCampaignById(created.id)
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
