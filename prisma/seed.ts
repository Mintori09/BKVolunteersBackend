import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  PrismaClient,
  StudentAccountStatus,
  ManagerRoleType,
  ManagerAccountStatus,
  ClubStatus,
  ClubMembershipStatus,
  OrganizerType,
  CampaignApprovalStatus,
  CampaignPublicationStatus,
  CampaignPhaseType,
  CampaignPhaseStatus,
  ParticipantScope,
  VerificationMode,
  ApprovalStepType,
  ApprovalStepStatus,
  CampaignStatusGroup,
  RegistrationStatus,
  CheckinMethod,
  CertificateDeliveryStatus,
  ContributionType,
  ContributionStatus,
  CampaignFileType,
  NotificationType,
  NotificationTargetType,
} from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL as string),
});

const STUDENT_CSV_URL = new URL('./students.csv', import.meta.url);
const CLOUDINARY_UPLOAD_BASE_URL = 'https://api.cloudinary.com/v1_1';
const d = (value: string) => new Date(value);

const IDS = {
  clubs: {
    protech: '00000000-0000-4000-8000-000000000001',
    rainbow: '00000000-0000-4000-8000-000000000002',
  },
  managers: {
    doan: '00000000-0000-4000-8000-000000000101',
    lcdCntt: '00000000-0000-4000-8000-000000000102',
    clbProtech: '00000000-0000-4000-8000-000000000103',
  },
  students: {
    an: '00000000-0000-4000-8000-000000000201',
    khang: '00000000-0000-4000-8000-000000000202',
    bao: '00000000-0000-4000-8000-000000000203',
    huy: '00000000-0000-4000-8000-000000000204',
  },
  files: {
    lcdCover: '00000000-0000-4000-8000-000000000301',
    lcdLogo: '00000000-0000-4000-8000-000000000302',
    lcdPlan: '00000000-0000-4000-8000-000000000303',
    protechCover: '00000000-0000-4000-8000-000000000304',
    protechQr: '00000000-0000-4000-8000-000000000305',
    protechPlan: '00000000-0000-4000-8000-000000000306',
    protechCertTpl: '00000000-0000-4000-8000-000000000307',
    proofAn: '00000000-0000-4000-8000-000000000308',
    proofBao: '00000000-0000-4000-8000-000000000309',
    certAn: '00000000-0000-4000-8000-000000000310',
  },
  bankAccounts: {
    protech: '00000000-0000-4000-8000-000000000401',
  },
  campaigns: {
    lcdSupport: '00000000-0000-4000-8000-000000000501',
    protechBooks: '00000000-0000-4000-8000-000000000502',
  },
  phases: {
    lcdRecruit: '00000000-0000-4000-8000-000000000601',
    protechFund: '00000000-0000-4000-8000-000000000602',
    protechField: '00000000-0000-4000-8000-000000000603',
  },
  registrations: {
    lcdAn: '00000000-0000-4000-8000-000000000701',
    lcdKhang: '00000000-0000-4000-8000-000000000702',
    protechAn: '00000000-0000-4000-8000-000000000703',
    protechBao: '00000000-0000-4000-8000-000000000704',
  },
  contributions: {
    fundAn: '00000000-0000-4000-8000-000000000801',
    fundBao: '00000000-0000-4000-8000-000000000802',
  },
} as const;

const FACULTIES = [
  { code: '101', name: 'Khoa Co khi' },
  { code: '102', name: 'Khoa Cong nghe thong tin' },
  { code: '103', name: 'Khoa Co khi Giao thong' },
  { code: '104', name: 'Khoa Cong nghe Nhiet - Dien lanh' },
  { code: '105', name: 'Khoa Dien' },
  { code: '106', name: 'Khoa Dien tu Vien thong' },
  { code: '107', name: 'Khoa Hoa' },
  { code: '109', name: 'Khoa Xay dung Cau duong' },
  { code: '110', name: 'Khoa Xay dung Dan dung va Cong nghiep' },
  { code: '111', name: 'Khoa Xay dung Cong trinh thuy' },
  { code: '117', name: 'Khoa Moi truong' },
  { code: '118', name: 'Khoa Quan ly du an' },
  { code: '121', name: 'Khoa Kien truc' },
  { code: '123', name: 'Khoa Khoa hoc Cong nghe tien tien' },
];

type SampleStudentKey = keyof typeof IDS.students;

interface SeededStudent {
  id: string;
  mssv: string;
  email: string;
  fullName: string;
  className: string | null;
  facultyCode: string;
  facultyId: number;
}

const SAMPLE_STUDENT_SPECS: Array<{ key: SampleStudentKey; facultyCode: string; preferredMssv?: string }> = [
  { key: 'an', facultyCode: '102', preferredMssv: '102220001' },
  { key: 'khang', facultyCode: '102', preferredMssv: '102220045' },
  { key: 'bao', facultyCode: '105', preferredMssv: '105230012' },
  { key: 'huy', facultyCode: '106', preferredMssv: '106220031' },
];

let sampleStudents: Record<SampleStudentKey, SeededStudent> | null = null;
let totalStudentsSeeded = 0;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function normalizeText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (character === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  values.push(current);
  return values.map((value) => value.trim());
}

function deterministicUuid(input: string): string {
  const hex = createHash('sha256').update(input).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

async function loadStudents(facultyMap: Map<string, number>, passwordHash: string) {
  const csvContent = await readFile(STUDENT_CSV_URL, 'utf8');
  const lines = csvContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const students: SeededStudent[] = [];
  const seen = new Set<string>();

  for (const line of lines.slice(1)) {
    const [rawMssv, rawName, rawClassName] = parseCsvLine(line);
    const mssv = normalizeText(rawMssv);
    const fullName = normalizeText(rawName);
    if (!mssv || !fullName || seen.has(mssv)) continue;
    const facultyCode = mssv.slice(0, 3);
    const facultyId = facultyMap.get(facultyCode);
    if (!facultyId) continue;
    seen.add(mssv);
    students.push({
      id: deterministicUuid(`student:${mssv}`),
      mssv,
      email: `${mssv}@sv1.dut.udn.vn`,
      fullName,
      className: normalizeText(rawClassName),
      facultyCode,
      facultyId,
    });
  }

  const selected = {} as Record<SampleStudentKey, SeededStudent>;
  const used = new Set<string>();
  for (const spec of SAMPLE_STUDENT_SPECS) {
    const preferred = spec.preferredMssv ? students.find((student) => student.mssv === spec.preferredMssv) : undefined;
    const chosen = (preferred && !used.has(preferred.mssv) ? preferred : undefined) || students.find((student) => student.facultyCode === spec.facultyCode && !used.has(student.mssv));
    if (!chosen) throw new Error(`Cannot map sample student ${spec.key}`);
    used.add(chosen.mssv);
    selected[spec.key] = chosen;
    IDS.students[spec.key] = chosen.id;
  }

  for (let index = 0; index < students.length; index += 1000) {
    await prisma.student.createMany({
      data: students.slice(index, index + 1000).map((student) => ({
        id: student.id,
        mssv: student.mssv,
        email: student.email,
        passwordHash: passwordHash,
        fullName: student.fullName,
        facultyId: student.facultyId,
        className: student.className,
        phone: null,
        status: StudentAccountStatus.ACTIVE,
      })),
    });
  }

  sampleStudents = selected;
  totalStudentsSeeded = students.length;
}

async function uploadImage(publicId: string, title: string, subtitle: string, label: string, accentColor: string, backgroundColor: string) {
  const cloudName = requireEnv('CLOUDINARY_CLOUD_NAME');
  const apiKey = requireEnv('CLOUDINARY_API_KEY');
  const apiSecret = requireEnv('CLOUDINARY_API_SECRET');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="${backgroundColor}"/><circle cx="1300" cy="180" r="140" fill="${accentColor}" opacity="0.25"/><rect x="120" y="120" width="240" height="60" rx="30" fill="${accentColor}"/><text x="240" y="158" font-size="26" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif">${label}</text><text x="120" y="360" font-size="72" fill="#fff" font-family="Arial, sans-serif" font-weight="700">${title}</text><text x="120" y="430" font-size="34" fill="#e5e7eb" font-family="Arial, sans-serif">${subtitle}</text><text x="120" y="790" font-size="28" fill="#cbd5e1" font-family="Arial, sans-serif">BKVolunteers seed via Cloudinary</text></svg>`;
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const signature = createHash('sha1')
    .update(`overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');
  const formData = new FormData();
  formData.set('file', `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
  formData.set('api_key', apiKey);
  formData.set('timestamp', timestamp);
  formData.set('signature', signature);
  formData.set('overwrite', 'true');
  formData.set('public_id', publicId);
  const response = await fetch(`${CLOUDINARY_UPLOAD_BASE_URL}/${cloudName}/image/upload`, { method: 'POST', body: formData });
  if (!response.ok) throw new Error(`Cloudinary upload failed: ${await response.text()}`);
  const payload = (await response.json()) as { secure_url: string; bytes: number };
  return { storageKey: payload.secure_url, fileSize: BigInt(payload.bytes), mimeType: 'image/svg+xml' };
}

async function clearData() {
  await prisma.notificationStudent.deleteMany();
  await prisma.notificationManager.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.campaignFile.deleteMany();
  await prisma.campaignStatusHistory.deleteMany();
  await prisma.campaignApprovalStep.deleteMany();
  await prisma.phaseVolunteerConfig.deleteMany();
  await prisma.phaseFundraisingConfig.deleteMany();
  await prisma.campaignPhase.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.clubMembership.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.managerAccount.deleteMany();
  await prisma.student.deleteMany();
  await prisma.club.deleteMany();
  await prisma.file.deleteMany();
  await prisma.faculty.deleteMany();
}

async function main() {
  await clearData();
  const studentPasswordHash = await bcrypt.hash('SV@123456', 10);
  const managerPasswordHash = await bcrypt.hash('QL@123456', 10);

  await prisma.faculty.createMany({ data: FACULTIES });
  const facultyMap = new Map((await prisma.faculty.findMany()).map((faculty) => [faculty.code, faculty.id]));

  await prisma.club.createMany({
    data: [
      { id: IDS.clubs.protech, name: 'CLB ProTech', facultyId: facultyMap.get('102'), isSchoolLevel: false, status: ClubStatus.ACTIVE },
      { id: IDS.clubs.rainbow, name: 'CLB Tinh nguyen Cau Vong', isSchoolLevel: true, status: ClubStatus.ACTIVE },
    ],
  });

  await prisma.managerAccount.createMany({
    data: [
      { id: IDS.managers.doan, username: 'doantruong', email: 'doantruong@dut.udn.vn', passwordHash: managerPasswordHash, roleType: ManagerRoleType.DOANTRUONG_ADMIN, status: ManagerAccountStatus.ACTIVE },
      { id: IDS.managers.lcdCntt, username: 'lcd_cntt', email: 'lcd.cntt@dut.udn.vn', passwordHash: managerPasswordHash, roleType: ManagerRoleType.LCD_MANAGER, facultyId: facultyMap.get('102'), status: ManagerAccountStatus.ACTIVE },
      { id: IDS.managers.clbProtech, username: 'clb_protech', email: 'protech@dut.udn.vn', passwordHash: managerPasswordHash, roleType: ManagerRoleType.CLB_MANAGER, clubId: IDS.clubs.protech, status: ManagerAccountStatus.ACTIVE },
    ],
  });

  await loadStudents(facultyMap, studentPasswordHash);
  if (!sampleStudents) throw new Error('Sample students were not loaded');

  const lcdCover = await uploadImage('bkvolunteers/seed/lcd-support-cover', 'Tiep suc mua thi', 'LCD CNTT 2026 cover', 'COVER', '#22c55e', '#14532d');
  const lcdLogo = await uploadImage('bkvolunteers/seed/lcd-support-logo', 'LCD CNTT', 'Organization logo', 'LOGO', '#38bdf8', '#0f172a');
  const protechCover = await uploadImage('bkvolunteers/seed/protech-books-cover', 'Gop sach cho em', 'ProTech 2026 cover', 'COVER', '#f97316', '#7c2d12');
  const protechQr = await uploadImage('bkvolunteers/seed/protech-qr', 'QR Donation', 'Support the fundraiser', 'QR', '#14b8a6', '#134e4a');
  const proofAn = await uploadImage('bkvolunteers/seed/proof-an', sampleStudents.an.fullName, 'Donation proof 500000 VND', 'PROOF', '#10b981', '#064e3b');
  const proofBao = await uploadImage('bkvolunteers/seed/proof-bao', sampleStudents.bao.fullName, 'Donation proof 300000 VND', 'PROOF', '#f59e0b', '#78350f');

  await prisma.file.createMany({
    data: [
      { id: IDS.files.lcdCover, storageKey: lcdCover.storageKey, originalName: 'lcd-support-cover.svg', mimeType: lcdCover.mimeType, fileSize: lcdCover.fileSize, uploadedByManagerId: IDS.managers.lcdCntt },
      { id: IDS.files.lcdLogo, storageKey: lcdLogo.storageKey, originalName: 'lcd-support-logo.svg', mimeType: lcdLogo.mimeType, fileSize: lcdLogo.fileSize, uploadedByManagerId: IDS.managers.lcdCntt },
      { id: IDS.files.lcdPlan, storageKey: 'seed/campaigns/lcd-support/plan.pdf', originalName: 'ke-hoach-tiep-suc-mua-thi-2026.pdf', mimeType: 'application/pdf', fileSize: 1642000n, uploadedByManagerId: IDS.managers.lcdCntt },
      { id: IDS.files.protechCover, storageKey: protechCover.storageKey, originalName: 'protech-books-cover.svg', mimeType: protechCover.mimeType, fileSize: protechCover.fileSize, uploadedByManagerId: IDS.managers.clbProtech },
      { id: IDS.files.protechQr, storageKey: protechQr.storageKey, originalName: 'protech-books-qr.svg', mimeType: protechQr.mimeType, fileSize: protechQr.fileSize, uploadedByManagerId: IDS.managers.clbProtech },
      { id: IDS.files.protechPlan, storageKey: 'seed/campaigns/protech-books/plan.pdf', originalName: 'ke-hoach-gop-sach-cho-em-2026.pdf', mimeType: 'application/pdf', fileSize: 1395000n, uploadedByManagerId: IDS.managers.clbProtech },
      { id: IDS.files.protechCertTpl, storageKey: 'seed/templates/protech-certificate-template.pdf', originalName: 'mau-giay-chung-nhan-protech.pdf', mimeType: 'application/pdf', fileSize: 680000n, uploadedByManagerId: IDS.managers.clbProtech },
      { id: IDS.files.proofAn, storageKey: proofAn.storageKey, originalName: `proof-${slugify(sampleStudents.an.fullName)}.svg`, mimeType: proofAn.mimeType, fileSize: proofAn.fileSize, uploadedByStudentId: IDS.students.an },
      { id: IDS.files.proofBao, storageKey: proofBao.storageKey, originalName: `proof-${slugify(sampleStudents.bao.fullName)}.svg`, mimeType: proofBao.mimeType, fileSize: proofBao.fileSize, uploadedByStudentId: IDS.students.bao },
      { id: IDS.files.certAn, storageKey: 'seed/certificates/protech-an.pdf', originalName: `certificate-${slugify(sampleStudents.an.fullName)}.pdf`, mimeType: 'application/pdf', fileSize: 455000n, uploadedByManagerId: IDS.managers.clbProtech },
    ],
  });

  await prisma.clubMembership.createMany({
    data: [
      { id: '00000000-0000-4000-8000-000000000901', clubId: IDS.clubs.protech, studentId: IDS.students.an, status: ClubMembershipStatus.APPROVED, joinedAt: d('2025-09-10T08:00:00+07:00'), approvedAt: d('2025-09-12T09:00:00+07:00'), approvedById: IDS.managers.clbProtech, note: 'Core volunteer member' },
      { id: '00000000-0000-4000-8000-000000000902', clubId: IDS.clubs.protech, studentId: IDS.students.khang, status: ClubMembershipStatus.APPROVED, joinedAt: d('2025-09-12T08:00:00+07:00'), approvedAt: d('2025-09-15T09:00:00+07:00'), approvedById: IDS.managers.clbProtech, note: 'Logistics member' },
    ],
  });

  await prisma.bankAccount.createMany({
    data: [
      { id: IDS.bankAccounts.protech, bankName: 'BIDV', accountName: 'CLB ProTech', accountNumber: '102000000002', ownerName: 'CLB ProTech', managedByManagerId: IDS.managers.clbProtech, isActive: true },
    ],
  });

  await prisma.campaign.createMany({
    data: [
      {
        id: IDS.campaigns.lcdSupport,
        title: 'Tiep suc mua thi 2026 - LCD CNTT',
        slogan: 'Dong hanh cung thi sinh',
        description: 'Volunteer support campaign for exam season.',
        creatorManagerId: IDS.managers.lcdCntt,
        organizerType: OrganizerType.LCD,
        facultyId: facultyMap.get('102'),
        approvalStatus: CampaignApprovalStatus.APPROVED,
        publicationStatus: CampaignPublicationStatus.REGISTRATION_OPEN,
        publicFrom: d('2026-05-01T08:00:00+07:00'),
        publicUntil: d('2026-06-30T23:59:59+07:00'),
        coverFileId: IDS.files.lcdCover,
        logoFileId: IDS.files.lcdLogo,
      },
      {
        id: IDS.campaigns.protechBooks,
        title: 'Gop sach cho em 2026 - CLB ProTech',
        slogan: 'Mieng sach nho, yeu thuong to',
        description: 'Fundraising and field trip campaign for donated books.',
        creatorManagerId: IDS.managers.clbProtech,
        organizerType: OrganizerType.CLB,
        clubId: IDS.clubs.protech,
        approvalStatus: CampaignApprovalStatus.APPROVED,
        publicationStatus: CampaignPublicationStatus.ONGOING,
        publicFrom: d('2026-01-10T08:00:00+07:00'),
        publicUntil: d('2026-03-15T23:59:59+07:00'),
        coverFileId: IDS.files.protechCover,
      },
    ],
  });

  await prisma.campaignPhase.createMany({
    data: [
      { id: IDS.phases.lcdRecruit, campaignId: IDS.campaigns.lcdSupport, phaseOrder: 1, phaseName: 'Recruit volunteers', phaseType: CampaignPhaseType.VOLUNTEER_RECRUITMENT, startAt: d('2026-05-01T08:00:00+07:00'), endAt: d('2026-05-20T23:59:59+07:00'), registrationStartAt: d('2026-05-01T08:00:00+07:00'), registrationEndAt: d('2026-05-12T23:59:59+07:00'), locationText: 'Faculty of IT, DUT', status: CampaignPhaseStatus.OPEN },
      { id: IDS.phases.protechFund, campaignId: IDS.campaigns.protechBooks, phaseOrder: 1, phaseName: 'Fundraising', phaseType: CampaignPhaseType.FUNDRAISING, startAt: d('2026-01-10T08:00:00+07:00'), endAt: d('2026-02-10T23:59:59+07:00'), status: CampaignPhaseStatus.ENDED },
      { id: IDS.phases.protechField, campaignId: IDS.campaigns.protechBooks, phaseOrder: 2, phaseName: 'Field trip delivery', phaseType: CampaignPhaseType.FIELD_ACTIVITY, startAt: d('2026-03-01T06:00:00+07:00'), endAt: d('2026-03-01T18:00:00+07:00'), registrationStartAt: d('2026-02-10T08:00:00+07:00'), registrationEndAt: d('2026-02-20T23:59:59+07:00'), locationText: 'Hoa Bac, Da Nang', status: CampaignPhaseStatus.ENDED },
    ],
  });

  await prisma.phaseVolunteerConfig.createMany({
    data: [
      { phaseId: IDS.phases.lcdRecruit, maxParticipants: 60, participantScope: ParticipantScope.FACULTY_ONLY, requiresCheckin: false },
      { phaseId: IDS.phases.protechField, maxParticipants: 20, participantScope: ParticipantScope.ALL_STUDENTS, requiresCheckin: true, certificateTemplateFileId: IDS.files.protechCertTpl },
    ],
  });

  await prisma.phaseFundraisingConfig.createMany({
    data: [
      { phaseId: IDS.phases.protechFund, targetAmount: 30000000, bankAccountId: IDS.bankAccounts.protech, qrFileId: IDS.files.protechQr, transferNotePrefix: 'GOPSACH', verificationMode: VerificationMode.SEMI_AUTO },
    ],
  });

  await prisma.campaignApprovalStep.createMany({
    data: [
      { id: '00000000-0000-4000-8000-000000001001', campaignId: IDS.campaigns.lcdSupport, stepType: ApprovalStepType.FINAL_REVIEW, status: ApprovalStepStatus.APPROVED, reviewerId: IDS.managers.doan, comment: 'Approved by school union', reviewedAt: d('2026-04-28T14:00:00+07:00') },
      { id: '00000000-0000-4000-8000-000000001002', campaignId: IDS.campaigns.protechBooks, stepType: ApprovalStepType.FINAL_REVIEW, status: ApprovalStepStatus.APPROVED, reviewerId: IDS.managers.doan, comment: 'Approved for launch', reviewedAt: d('2026-01-08T09:30:00+07:00') },
    ],
  });

  await prisma.campaignStatusHistory.createMany({
    data: [
      { id: '00000000-0000-4000-8000-000000001101', campaignId: IDS.campaigns.lcdSupport, statusGroup: CampaignStatusGroup.PUBLICATION, fromStatus: 'READY_TO_PUBLISH', toStatus: 'REGISTRATION_OPEN', changedById: IDS.managers.lcdCntt, note: 'Open volunteer registration', createdAt: d('2026-05-01T08:00:00+07:00') },
      { id: '00000000-0000-4000-8000-000000001102', campaignId: IDS.campaigns.protechBooks, statusGroup: CampaignStatusGroup.PUBLICATION, fromStatus: 'PUBLISHED', toStatus: 'ONGOING', changedById: IDS.managers.clbProtech, note: 'Fundraising and trip are active', createdAt: d('2026-01-10T08:00:00+07:00') },
    ],
  });

  await prisma.campaignFile.createMany({
    data: [
      { id: '00000000-0000-4000-8000-000000001201', campaignId: IDS.campaigns.lcdSupport, fileId: IDS.files.lcdPlan, fileType: CampaignFileType.PLAN, isPublic: false },
      { id: '00000000-0000-4000-8000-000000001202', campaignId: IDS.campaigns.lcdSupport, fileId: IDS.files.lcdCover, fileType: CampaignFileType.COVER, isPublic: true },
      { id: '00000000-0000-4000-8000-000000001203', campaignId: IDS.campaigns.lcdSupport, fileId: IDS.files.lcdLogo, fileType: CampaignFileType.LOGO, isPublic: true },
      { id: '00000000-0000-4000-8000-000000001204', campaignId: IDS.campaigns.protechBooks, fileId: IDS.files.protechPlan, fileType: CampaignFileType.PLAN, isPublic: false },
      { id: '00000000-0000-4000-8000-000000001205', campaignId: IDS.campaigns.protechBooks, fileId: IDS.files.protechCover, fileType: CampaignFileType.COVER, isPublic: true },
    ],
  });

  await prisma.registration.createMany({
    data: [
      { id: IDS.registrations.lcdAn, phaseId: IDS.phases.lcdRecruit, studentId: IDS.students.an, status: RegistrationStatus.APPROVED, appliedAt: d('2026-05-02T09:00:00+07:00'), reviewedById: IDS.managers.lcdCntt, reviewedAt: d('2026-05-03T10:30:00+07:00') },
      { id: IDS.registrations.lcdKhang, phaseId: IDS.phases.lcdRecruit, studentId: IDS.students.khang, status: RegistrationStatus.WAITLISTED, appliedAt: d('2026-05-02T09:30:00+07:00'), reviewedById: IDS.managers.lcdCntt, reviewedAt: d('2026-05-03T11:00:00+07:00') },
      { id: IDS.registrations.protechAn, phaseId: IDS.phases.protechField, studentId: IDS.students.an, status: RegistrationStatus.COMPLETED, appliedAt: d('2026-02-12T09:00:00+07:00'), reviewedById: IDS.managers.clbProtech, reviewedAt: d('2026-02-13T10:00:00+07:00') },
      { id: IDS.registrations.protechBao, phaseId: IDS.phases.protechField, studentId: IDS.students.bao, status: RegistrationStatus.COMPLETED, appliedAt: d('2026-02-12T10:00:00+07:00'), reviewedById: IDS.managers.clbProtech, reviewedAt: d('2026-02-13T10:15:00+07:00') },
    ],
  });

  await prisma.checkin.createMany({
    data: [
      { id: '00000000-0000-4000-8000-000000001301', registrationId: IDS.registrations.protechAn, checkedById: IDS.managers.clbProtech, method: CheckinMethod.MANUAL, checkedInAt: d('2026-03-01T06:25:00+07:00'), checkedOutAt: d('2026-03-01T17:40:00+07:00') },
    ],
  });

  await prisma.certificate.createMany({
    data: [
      { id: '00000000-0000-4000-8000-000000001401', registrationId: IDS.registrations.protechAn, fileId: IDS.files.certAn, issuedById: IDS.managers.clbProtech, issuedAt: d('2026-03-05T10:00:00+07:00'), emailSentAt: d('2026-03-05T10:05:00+07:00'), deliveryStatus: CertificateDeliveryStatus.SENT },
    ],
  });

  await prisma.contribution.createMany({
    data: [
      { id: IDS.contributions.fundAn, phaseId: IDS.phases.protechFund, studentId: IDS.students.an, contributionType: ContributionType.MONEY, amount: 500000, proofFileId: IDS.files.proofAn, status: ContributionStatus.VERIFIED, verifiedById: IDS.managers.clbProtech, verifiedAt: d('2026-01-25T14:00:00+07:00') },
      { id: IDS.contributions.fundBao, phaseId: IDS.phases.protechFund, studentId: IDS.students.bao, contributionType: ContributionType.MONEY, amount: 300000, proofFileId: IDS.files.proofBao, status: ContributionStatus.VERIFIED, verifiedById: IDS.managers.clbProtech, verifiedAt: d('2026-01-26T09:15:00+07:00') },
    ],
  });

  await prisma.notificationStudent.createMany({
    data: [
      { id: '00000000-0000-4000-8000-000000001501', studentId: IDS.students.an, type: NotificationType.REGISTRATION, title: 'Registration approved', message: 'Your IT faculty volunteer registration has been approved.', targetType: NotificationTargetType.REGISTRATION, targetId: IDS.registrations.lcdAn },
      { id: '00000000-0000-4000-8000-000000001502', studentId: IDS.students.bao, type: NotificationType.CERTIFICATE, title: 'Certificate issued', message: 'Your participation certificate for the ProTech campaign is ready.', targetType: NotificationTargetType.CERTIFICATE, targetId: '00000000-0000-4000-8000-000000001401' },
    ],
  });

  await prisma.notificationManager.createMany({
    data: [
      { id: '00000000-0000-4000-8000-000000001601', managerId: IDS.managers.clbProtech, type: NotificationType.CONTRIBUTION, title: 'Verified donations', message: 'Two donations were verified in the ProTech campaign.', targetType: NotificationTargetType.CAMPAIGN, targetId: IDS.campaigns.protechBooks },
      { id: '00000000-0000-4000-8000-000000001602', managerId: IDS.managers.lcdCntt, type: NotificationType.REGISTRATION, title: 'New volunteer registrations', message: 'The IT faculty campaign has new volunteer registrations to review.', targetType: NotificationTargetType.PHASE, targetId: IDS.phases.lcdRecruit },
    ],
  });

  console.log('Prisma seed completed successfully.');
  console.log(`Students imported from CSV: ${totalStudentsSeeded}`);
  console.log(`Sample student account: ${sampleStudents.an.email} / SV@123456`);
  console.log('Sample manager accounts: doantruong / QL@123456, lcd_cntt / QL@123456, clb_protech / QL@123456');
}

main()
  .catch((error) => {
    console.error('Prisma seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
