import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

interface StudentJson {
  MSSV: string;
  'Tên': string;
  'Lớp học phần': string;
  'Chương trình đào tạo': string;
}

const FACULTY_CODE_MAP: Record<string, number> = {
  '101': 101, // Khoa Cơ khí
  '102': 102, // Khoa Công nghệ Thông tin
  '103': 103, // Khoa Cơ khí Giao thông
  '104': 104, // Khoa CN Nhiệt–Điện lạnh
  '105': 105, // Khoa Điện
  '106': 106, // Khoa Điện tử Viễn thông
  '107': 107, // Khoa Hóa
  '109': 109, // Khoa XD Cầu Đường
  '110': 110, // Khoa XD Dân dụng & Công nghiệp
  '111': 111, // Khoa XD Công trình thủy
  '117': 117, // Khoa Môi trường
  '118': 118, // Khoa Quản lý dự án
  '121': 121, // Khoa Kiến trúc
  '123': 123, // Khoa Khoa học Công nghệ tiên tiến
};

function parseMSSV(mssv: string): { facultyCode: string; admissionYear: string; sequence: string } {
  const facultyCode = mssv.substring(0, 3);
  const admissionYear = mssv.substring(3, 5);
  const sequence = mssv.substring(5, 9);
  return { facultyCode, admissionYear, sequence };
}

function getFacultyId(facultyCode: string): number {
  const facultyId = FACULTY_CODE_MAP[facultyCode];
  if (!facultyId) {
    throw new Error(`Unknown faculty code: ${facultyCode}`);
  }
  return facultyId;
}

async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function seedStudents(): Promise<void> {
  console.log('Seeding students...');

  const jsonPath = path.join(__dirname, 'students.json');
  const jsonData: StudentJson[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  for (const studentData of jsonData) {
    const mssv = studentData.MSSV;
    const { facultyCode } = parseMSSV(mssv);
    const facultyId = getFacultyId(facultyCode);

    const email = `${mssv}@sv1.dut.udn.vn`;
    const hashedPassword = await hashPassword(mssv);

    await prisma.student.upsert({
      where: { mssv },
      update: {},
      create: {
        id: crypto.randomUUID(),
        mssv,
        full_name: studentData['Tên'],
        email,
        password: hashedPassword,
        faculty_id: facultyId,
        class_name: studentData['Lớp học phần'],
        phone: null,
        total_points: 0,
      },
    });
  }

  console.log(`Seeded ${jsonData.length} students`);
}
