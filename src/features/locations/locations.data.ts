import { LocationItem } from './types'

export const locationCatalog: LocationItem[] = [
    {
        id: 'dut-main-campus',
        name: 'Bach Khoa Da Nang - Co so chinh',
        address: '54 Nguyen Luong Bang, Hoa Khanh Bac, Lien Chieu, Da Nang',
        latitude: 16.0749,
        longitude: 108.1504,
        type: 'CAMPUS',
        description:
            'Khuon vien chinh phu hop cho buoi hop quan tri, tap huan va tiep nhan tinh nguyen vien.',
    },
    {
        id: 'hoa-bac-community-house',
        name: 'Nha van hoa Hoa Bac',
        address: 'Thon Nam Yen, xa Hoa Bac, huyen Hoa Vang, Da Nang',
        latitude: 16.1168,
        longitude: 107.9876,
        type: 'COMMUNITY',
        description:
            'Diem to chuc hoat dong cong dong, phu hop cho chien dich tinh nguyen tai dia phuong.',
    },
    {
        id: 'city-youth-union-office',
        name: 'Thanh Doan Da Nang',
        address: '71 Xuan Thuy, Khue Trung, Cam Le, Da Nang',
        latitude: 16.0406,
        longitude: 108.2016,
        type: 'PARTNER',
        description:
            'Diem phoi hop voi doi tac Doan Hoi, phu hop cho cong tac dieu phoi va tiep nhan ho so.',
    },
    {
        id: 'cam-le-community-center',
        name: 'Trung tam ho tro Cong dong Cam Le',
        address: '08 Cach Mang Thang Tam, Hoa Tho Dong, Cam Le, Da Nang',
        latitude: 16.0212,
        longitude: 108.2179,
        type: 'COMMUNITY',
        description:
            'Khong gian sinh hoat cong dong phu hop cho workshop, huong dan va cap phat vat pham.',
    },
    {
        id: 'green-lab-partner-office',
        name: 'Green Lab Partner Hub',
        address: '20 Bach Dang, Hai Chau 1, Hai Chau, Da Nang',
        latitude: 16.0703,
        longitude: 108.2244,
        type: 'PARTNER',
        description:
            'Van phong doi tac ho tro truyen thong, hop tac su kien va trung chuyen tai nguyen.',
    },
]
