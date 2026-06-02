import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import fs from 'fs'
import { ApiError } from './ApiError'
import { HttpStatus } from 'src/common/constants'

const proofsDir = path.join(process.cwd(), 'uploads', 'proofs')

if (!fs.existsSync(proofsDir)) {
    fs.mkdirSync(proofsDir, { recursive: true })
}

const proofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, proofsDir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}-${randomUUID()}${ext}`)
    },
})

const imageFileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new ApiError(HttpStatus.BAD_REQUEST, 'Chỉ cho phép upload ảnh'))
    }
}

export const proofUpload = multer({
    storage: proofStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
})

export const getProofFileUrl = (filename: string): string => {
    return `/uploads/proofs/${filename}`
}
