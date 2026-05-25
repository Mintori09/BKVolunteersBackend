const PDF_WIDTH = 595
const PDF_HEIGHT = 842
const PAGE_MARGIN_X = 72
const PAGE_START_Y = 760
const LINE_HEIGHT = 24

const DEFAULT_FIELDS = [
    'certificate_no',
    'student_name',
    'student_code',
    'campaign_title',
    'module_title',
    'issued_at',
]

const FIELD_LABELS: Record<string, string> = {
    certificate_no: 'Certificate No',
    student_name: 'Student',
    student_code: 'Student Code',
    campaign_title: 'Campaign',
    module_title: 'Module',
    issued_at: 'Issued At',
}

const escapePdfText = (value: string) =>
    value
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\r?\n/g, ' ')

const buildPdf = (contentStream: string) => {
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream`,
    ]

    let pdf = '%PDF-1.4\n'
    const offsets = [0]

    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf, 'utf8'))
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    })

    const xrefOffset = Buffer.byteLength(pdf, 'utf8')
    pdf += `xref\n0 ${objects.length + 1}\n`
    pdf += '0000000000 65535 f \n'

    offsets.slice(1).forEach((offset) => {
        pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
    })

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

    return Buffer.from(pdf, 'utf8')
}

const buildContentStream = (args: {
    title: string
    subtitle: string
    lines: Array<{ label: string; value: string }>
}) => {
    const chunks = [
        'BT',
        `/F1 24 Tf`,
        `${PAGE_MARGIN_X} ${PAGE_START_Y} Td`,
        `(${escapePdfText(args.title)}) Tj`,
        '0 -32 Td',
        '/F1 12 Tf',
        `(${escapePdfText(args.subtitle)}) Tj`,
    ]

    args.lines.forEach((line) => {
        chunks.push('0 -24 Td')
        chunks.push(
            `(${escapePdfText(`${line.label}: ${line.value || 'N/A'}`)}) Tj`
        )
    })

    chunks.push('ET')

    return chunks.join('\n')
}

export const renderCertificatePdf = (args: {
    certificateNo: string
    templateName: string
    layoutJson?: unknown
    values: Record<string, string>
}) => {
    const layout =
        args.layoutJson && typeof args.layoutJson === 'object'
            ? (args.layoutJson as Record<string, unknown>)
            : {}
    const configuredFields = Array.isArray(layout.fields)
        ? layout.fields.filter((item): item is string => typeof item === 'string')
        : []
    const fields = configuredFields.length > 0 ? configuredFields : DEFAULT_FIELDS

    const lines = fields
        .map((field) => ({
            label: FIELD_LABELS[field] ?? field,
            value: args.values[field] ?? '',
        }))
        .filter((line) => line.value.trim().length > 0)

    const contentStream = buildContentStream({
        title: 'BK Volunteers Certificate',
        subtitle: `${args.templateName} - ${args.certificateNo}`,
        lines,
    })

    return buildPdf(contentStream)
}
