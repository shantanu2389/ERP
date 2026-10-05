import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive College ERP database seed...');

  // Never wipe a database that already contains accounts. This keeps local
  // recovery safe while still allowing a completely empty development DB to
  // be initialized with the demo college data.
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    throw new Error('Seed aborted: existing user data detected. Use a deliberate migration/reset procedure instead.');
  }

  // Clean existing records in correct relation order
  await prisma.auditLog.deleteMany();
  await prisma.profileCorrectionRequest.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.placementDrive.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.note.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.teacherSubjectAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.classSection.deleteMany();
  await prisma.course.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword@123', salt);
  const teacherPasswordHash = await bcrypt.hash('TeacherPassword@123', salt);
  const studentPasswordHash = await bcrypt.hash('StudentPassword@123', salt);

  console.log('Creating Departments...');
  const cseDept = await prisma.department.create({
    data: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      hodName: 'Dr. Ananya Sen',
    },
  });

  const itDept = await prisma.department.create({
    data: {
      name: 'Information Technology',
      code: 'IT',
      hodName: 'Dr. Vikram Malhotra',
    },
  });

  const eceDept = await prisma.department.create({
    data: {
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      hodName: 'Dr. R. K. Mukherjee',
    },
  });

  const mechDept = await prisma.department.create({
    data: {
      name: 'Mechanical Engineering',
      code: 'MECH',
      hodName: 'Dr. S. K. Roy',
    },
  });

  console.log('Creating Courses...');
  await prisma.course.createMany({
    data: [
      { name: 'Bachelor of Technology in Computer Science', code: 'BTECH-CSE', departmentId: cseDept.id, durationYears: 4 },
      { name: 'Bachelor of Technology in Information Technology', code: 'BTECH-IT', departmentId: itDept.id, durationYears: 4 },
      { name: 'Bachelor of Technology in Electronics', code: 'BTECH-ECE', departmentId: eceDept.id, durationYears: 4 },
    ],
  });

  console.log('Creating Class Sections...');
  const cse4A = await prisma.classSection.create({
    data: {
      name: 'CSE-4A',
      departmentId: cseDept.id,
      semester: 4,
      academicYear: '2026-2027',
    },
  });

  const cse4B = await prisma.classSection.create({
    data: {
      name: 'CSE-4B',
      departmentId: cseDept.id,
      semester: 4,
      academicYear: '2026-2027',
    },
  });

  const it4A = await prisma.classSection.create({
    data: {
      name: 'IT-4A',
      departmentId: itDept.id,
      semester: 4,
      academicYear: '2026-2027',
    },
  });

  console.log('Creating Subjects...');
  const subDsa = await prisma.subject.create({
    data: {
      name: 'Data Structures & Algorithms',
      code: 'CS401',
      credits: 4,
      semester: 4,
      departmentId: cseDept.id,
    },
  });

  const subOs = await prisma.subject.create({
    data: {
      name: 'Operating Systems',
      code: 'CS402',
      credits: 4,
      semester: 4,
      departmentId: cseDept.id,
    },
  });

  const subDbms = await prisma.subject.create({
    data: {
      name: 'Database Management Systems',
      code: 'CS403',
      credits: 4,
      semester: 4,
      departmentId: cseDept.id,
    },
  });

  const subCn = await prisma.subject.create({
    data: {
      name: 'Computer Networks',
      code: 'CS404',
      credits: 3,
      semester: 4,
      departmentId: cseDept.id,
    },
  });

  const subMath = await prisma.subject.create({
    data: {
      name: 'Discrete Mathematics',
      code: 'MA401',
      credits: 3,
      semester: 4,
      departmentId: cseDept.id,
    },
  });

  console.log('Creating Admin Users...');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@college.edu',
      passwordHash: adminPasswordHash,
      name: 'Dr. Arvind Swaminathan',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      phone: '+91 98765 00001',
      permissions: 'super_admin,all.manage,users.manage,audit.view,system.settings',
    },
  });

  const erpAdmin1 = await prisma.user.create({
    data: {
      email: 'erpadmin1@college.edu',
      passwordHash: adminPasswordHash,
      name: 'Suresh Mehta (Admin #102)',
      role: 'ERP_ADMIN',
      status: 'ACTIVE',
      phone: '+91 98765 00002',
      permissions: 'student.view,student.edit,student.add,teacher.manage,attendance.manage,notes.manage,corrections.manage,audit.view',
    },
  });

  const erpAdmin2 = await prisma.user.create({
    data: {
      email: 'erpadmin2@college.edu',
      passwordHash: adminPasswordHash,
      name: 'Kavita Nambiar (Admin #103)',
      role: 'ERP_ADMIN',
      status: 'ACTIVE',
      phone: '+91 98765 00003',
      permissions: 'student.view,student.edit,teacher.manage,corrections.manage,audit.view',
    },
  });

  console.log('Creating Faculty Users...');
  const teacherUser1 = await prisma.user.create({
    data: {
      email: 'prof.sharma@college.edu',
      passwordHash: teacherPasswordHash,
      name: 'Prof. Rajesh Sharma',
      role: 'TEACHER',
      status: 'ACTIVE',
      phone: '+91 98765 11001',
      permissions: 'attendance.mark,attendance.edit,notes.upload,notes.view,assignments.create,marks.enter',
    },
  });

  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacherUser1.id,
      employeeId: 'FAC-CSE-101',
      departmentId: cseDept.id,
      designation: 'Associate Professor',
      qualification: 'Ph.D. in Computer Science (IIT Bombay)',
      cabinNo: 'C-Block 304',
    },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      email: 'dr.ananya@college.edu',
      passwordHash: teacherPasswordHash,
      name: 'Dr. Ananya Sen',
      role: 'TEACHER',
      status: 'ACTIVE',
      phone: '+91 98765 11002',
      permissions: 'attendance.mark,attendance.edit,notes.upload,notes.view,assignments.create,marks.enter',
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacherUser2.id,
      employeeId: 'FAC-CSE-102',
      departmentId: cseDept.id,
      designation: 'Professor & HOD',
      qualification: 'Ph.D. in Distributed Systems',
      cabinNo: 'C-Block 301 (HOD Office)',
    },
  });

  const teacherUser3 = await prisma.user.create({
    data: {
      email: 'dr.malhotra@college.edu',
      passwordHash: teacherPasswordHash,
      name: 'Dr. Vikram Malhotra',
      role: 'TEACHER',
      status: 'ACTIVE',
      phone: '+91 98765 11003',
      permissions: 'attendance.mark,attendance.edit,notes.upload,notes.view,assignments.create,marks.enter',
    },
  });

  const teacher3 = await prisma.teacher.create({
    data: {
      userId: teacherUser3.id,
      employeeId: 'FAC-IT-103',
      departmentId: itDept.id,
      designation: 'Associate Professor',
      qualification: 'M.Tech, Ph.D. in Networking',
      cabinNo: 'IT-Block 205',
    },
  });

  console.log('Assigning Teachers to Subjects & Sections...');
  await prisma.teacherSubjectAssignment.createMany({
    data: [
      { teacherId: teacher1.id, subjectId: subDsa.id, classSectionId: cse4A.id },
      { teacherId: teacher1.id, subjectId: subOs.id, classSectionId: cse4A.id },
      { teacherId: teacher2.id, subjectId: subDbms.id, classSectionId: cse4A.id },
      { teacherId: teacher3.id, subjectId: subCn.id, classSectionId: cse4A.id },
      { teacherId: teacher1.id, subjectId: subMath.id, classSectionId: cse4A.id },
    ],
  });

  console.log('Creating Students...');
  // Aarav Patel - Main Demo Student
  const studentUser1 = await prisma.user.create({
    data: {
      email: '24cse1023@college.edu',
      passwordHash: studentPasswordHash,
      name: 'Aarav Patel',
      role: 'STUDENT',
      status: 'ACTIVE',
      phone: '+91 98765 22001',
      permissions: 'attendance.view,notes.view,notes.download,assignments.submit,marks.view,corrections.request',
    },
  });

  const student1 = await prisma.student.create({
    data: {
      userId: studentUser1.id,
      rollNo: '24CSE1023',
      admissionNo: 'ADM-2024-8841',
      departmentId: cseDept.id,
      classSectionId: cse4A.id,
      semester: 4,
      fatherName: 'Rajesh Kumar',
      motherName: 'Sunita Patel',
      dob: '2004-05-18',
      bloodGroup: 'B+',
      address: 'Flat 402, Green Valley Heights, Sector 14, Bengaluru',
      emergencyContact: '+91 98765 99001',
    },
  });

  // Student 2: Priya Sharma
  const studentUser2 = await prisma.user.create({
    data: {
      email: '24cse1024@college.edu',
      passwordHash: studentPasswordHash,
      name: 'Priya Sharma',
      role: 'STUDENT',
      status: 'ACTIVE',
      phone: '+91 98765 22002',
      permissions: 'attendance.view,notes.view,notes.download,assignments.submit,marks.view,corrections.request',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: studentUser2.id,
      rollNo: '24CSE1024',
      admissionNo: 'ADM-2024-8842',
      departmentId: cseDept.id,
      classSectionId: cse4A.id,
      semester: 4,
      fatherName: 'Manoj Sharma',
      motherName: 'Geeta Sharma',
      dob: '2004-09-12',
      bloodGroup: 'O+',
      address: 'House #84, Palm Avenue, Indiranagar, Bengaluru',
      emergencyContact: '+91 98765 99002',
    },
  });

  // Student 3: Rohan Verma (Attendance near threshold: 72% for prediction demo!)
  const studentUser3 = await prisma.user.create({
    data: {
      email: '24cse1025@college.edu',
      passwordHash: studentPasswordHash,
      name: 'Rohan Verma',
      role: 'STUDENT',
      status: 'ACTIVE',
      phone: '+91 98765 22003',
      permissions: 'attendance.view,notes.view,notes.download,assignments.submit,marks.view,corrections.request',
    },
  });

  const student3 = await prisma.student.create({
    data: {
      userId: studentUser3.id,
      rollNo: '24CSE1025',
      admissionNo: 'ADM-2024-8843',
      departmentId: cseDept.id,
      classSectionId: cse4A.id,
      semester: 4,
      fatherName: 'Alok Verma',
      motherName: 'Meera Verma',
      dob: '2004-11-23',
      bloodGroup: 'A+',
      address: 'Villa 12, Sunrise Enclave, Whitefield, Bengaluru',
      emergencyContact: '+91 98765 99003',
    },
  });

  // Student 4: Sneha Iyer
  const studentUser4 = await prisma.user.create({
    data: {
      email: '24cse1026@college.edu',
      passwordHash: studentPasswordHash,
      name: 'Sneha Iyer',
      role: 'STUDENT',
      status: 'ACTIVE',
      phone: '+91 98765 22004',
      permissions: 'attendance.view,notes.view,notes.download,assignments.submit,marks.view,corrections.request',
    },
  });

  const student4 = await prisma.student.create({
    data: {
      userId: studentUser4.id,
      rollNo: '24CSE1026',
      admissionNo: 'ADM-2024-8844',
      departmentId: cseDept.id,
      classSectionId: cse4A.id,
      semester: 4,
      fatherName: 'Venkatesh Iyer',
      motherName: 'Lakshmi Iyer',
      dob: '2004-03-30',
      bloodGroup: 'AB+',
      address: 'Flat 10B, Silver Oak Residency, Koramangala, Bengaluru',
      emergencyContact: '+91 98765 99004',
    },
  });

  console.log('Seeding Attendance Records across subjects...');
  // Generate realistic attendance dates over past 30 teaching days
  const subjects = [
    { sub: subDsa, teacher: teacher1, targetAaravPresent: 26, total: 30 }, // ~86.6%
    { sub: subOs, teacher: teacher1, targetAaravPresent: 24, total: 30 },  // 80.0%
    { sub: subDbms, teacher: teacher2, targetAaravPresent: 28, total: 30 },// 93.3%
    { sub: subCn, teacher: teacher3, targetAaravPresent: 24, total: 30 },  // 80.0%
    { sub: subMath, teacher: teacher1, targetAaravPresent: 25, total: 30 },// 83.3%
  ];

  for (const item of subjects) {
    for (let day = 1; day <= item.total; day++) {
      const dateStr = `2026-09-${day.toString().padStart(2, '0')}`;
      
      // Aarav
      const aaravStatus = day <= item.targetAaravPresent ? 'PRESENT' : 'ABSENT';
      await prisma.attendance.create({
        data: {
          studentId: student1.id,
          subjectId: item.sub.id,
          teacherId: item.teacher.id,
          classSectionId: cse4A.id,
          date: dateStr,
          status: aaravStatus,
        },
      });

      // Priya (very high attendance)
      const priyaStatus = day <= 28 ? 'PRESENT' : 'ABSENT';
      await prisma.attendance.create({
        data: {
          studentId: student2.id,
          subjectId: item.sub.id,
          teacherId: item.teacher.id,
          classSectionId: cse4A.id,
          date: dateStr,
          status: priyaStatus,
        },
      });

      // Rohan (72% attendance for prediction demo)
      const rohanStatus = day <= 21 ? 'PRESENT' : 'ABSENT';
      await prisma.attendance.create({
        data: {
          studentId: student3.id,
          subjectId: item.sub.id,
          teacherId: item.teacher.id,
          classSectionId: cse4A.id,
          date: dateStr,
          status: rohanStatus,
        },
      });

      // Sneha
      const snehaStatus = day <= 27 ? 'PRESENT' : 'ABSENT';
      await prisma.attendance.create({
        data: {
          studentId: student4.id,
          subjectId: item.sub.id,
          teacherId: item.teacher.id,
          classSectionId: cse4A.id,
          date: dateStr,
          status: snehaStatus,
        },
      });
    }
  }

  console.log('Creating Study Notes & PDFs...');
  await prisma.note.createMany({
    data: [
      {
        title: 'Wave Optics & Interference Phenomena',
        unit: 'Unit 2: Wave Optics',
        description: 'Comprehensive lecture slides covering Young double slit experiment, thin film interference, and diffraction grating.',
        subjectId: subDsa.id,
        teacherId: teacher1.id,
        fileUrl: 'https://cdn.college-erp.edu/notes/wave_optics_unit2.pdf',
        fileName: 'wave_optics_unit2.pdf',
        fileSize: '4.8 MB',
      },
      {
        title: 'Balanced Binary Search Trees & AVL Rotations',
        unit: 'Unit 3: Trees & Graphs',
        description: 'Complete notes on LL, RR, LR, RL tree rotations with step-by-step visualizations and C++ implementations.',
        subjectId: subDsa.id,
        teacherId: teacher1.id,
        fileUrl: 'https://cdn.college-erp.edu/notes/dsa_unit3_avl_trees.pdf',
        fileName: 'dsa_unit3_avl_trees.pdf',
        fileSize: '3.2 MB',
      },
      {
        title: 'Process Synchronization, Semaphores & Deadlocks',
        unit: 'Unit 2: Concurrency & Sync',
        description: 'Detailed coverage of Peterson algorithm, counting semaphores, classic dining philosophers problem, and Bankers algorithm.',
        subjectId: subOs.id,
        teacherId: teacher1.id,
        fileUrl: 'https://cdn.college-erp.edu/notes/os_unit2_synchronization.pdf',
        fileName: 'os_unit2_synchronization.pdf',
        fileSize: '5.1 MB',
      },
      {
        title: 'Relational Database Design & Normalization (1NF to BCNF)',
        unit: 'Unit 4: Database Design',
        description: 'Functional dependencies, lossless join decomposition, and canonical covers with solved university exam problems.',
        subjectId: subDbms.id,
        teacherId: teacher2.id,
        fileUrl: 'https://cdn.college-erp.edu/notes/dbms_unit4_normalization.pdf',
        fileName: 'dbms_unit4_normalization.pdf',
        fileSize: '6.4 MB',
      },
      {
        title: 'TCP Flow Control, Congestion Control & Sliding Window',
        unit: 'Unit 3: Transport Layer',
        description: 'Mathematical analysis of TCP Tahoe/Reno, slow start, congestion avoidance, fast retransmit, and fast recovery.',
        subjectId: subCn.id,
        teacherId: teacher3.id,
        fileUrl: 'https://cdn.college-erp.edu/notes/cn_unit3_transport_layer.pdf',
        fileName: 'cn_unit3_transport_layer.pdf',
        fileSize: '4.2 MB',
      },
    ],
  });

  console.log('Creating Assignments...');
  const assign1 = await prisma.assignment.create({
    data: {
      title: 'Assignment 1: Red-Black Tree Implementation in C++',
      description: 'Implement a self-balancing Red-Black Tree with insertion, deletion, and inorder traversal. Include unit tests.',
      subjectId: subDsa.id,
      teacherId: teacher1.id,
      classSectionId: cse4A.id,
      dueDate: '2026-10-15',
      maxMarks: 100,
      attachmentUrl: 'https://cdn.college-erp.edu/assignments/dsa_assign1_specs.pdf',
    },
  });

  const assign2 = await prisma.assignment.create({
    data: {
      title: 'Assignment 2: PostgreSQL Indexing & Query Optimization',
      description: 'Benchmark B-Tree vs Hash index performance on a 1-million-row synthetic table using EXPLAIN ANALYZE in PostgreSQL.',
      subjectId: subDbms.id,
      teacherId: teacher2.id,
      classSectionId: cse4A.id,
      dueDate: '2026-10-20',
      maxMarks: 50,
      attachmentUrl: 'https://cdn.college-erp.edu/assignments/dbms_assign2_spec.pdf',
    },
  });

  const assign3 = await prisma.assignment.create({
    data: {
      title: 'Assignment 3: Multi-client Socket Chat Server in Node.js',
      description: 'Build a TCP socket chat room with broadcast messaging, user nicknames, and private direct messages.',
      subjectId: subCn.id,
      teacherId: teacher3.id,
      classSectionId: cse4A.id,
      dueDate: '2026-10-28',
      maxMarks: 50,
    },
  });

  console.log('Creating Assignment Submissions...');
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assign1.id,
      studentId: student1.id,
      fileUrl: 'https://cdn.college-erp.edu/submissions/24cse1023_assign1.zip',
      fileName: '24cse1023_assign1.zip',
      status: 'GRADED',
      marks: 96,
      feedback: 'Outstanding implementation! Clean memory management and comprehensive test suite.',
    },
  });

  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assign2.id,
      studentId: student1.id,
      fileUrl: 'https://cdn.college-erp.edu/submissions/24cse1023_assign2_report.pdf',
      fileName: '24cse1023_assign2_report.pdf',
      status: 'SUBMITTED',
      marks: null,
      feedback: null,
    },
  });

  console.log('Creating Timetable...');
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const timetableSchedule = [
    { day: 'MONDAY', start: '09:00', end: '10:00', sub: subDsa, teacher: teacher1, room: 'LH-201' },
    { day: 'MONDAY', start: '10:00', end: '11:00', sub: subOs, teacher: teacher1, room: 'LH-201' },
    { day: 'MONDAY', start: '11:15', end: '12:15', sub: subDbms, teacher: teacher2, room: 'LH-204' },
    { day: 'MONDAY', start: '13:15', end: '15:15', sub: subDsa, teacher: teacher1, room: 'CS-Lab 2' },

    { day: 'TUESDAY', start: '09:00', end: '10:00', sub: subCn, teacher: teacher3, room: 'LH-201' },
    { day: 'TUESDAY', start: '10:00', end: '11:00', sub: subMath, teacher: teacher1, room: 'LH-201' },
    { day: 'TUESDAY', start: '11:15', end: '12:15', sub: subDbms, teacher: teacher2, room: 'LH-204' },

    { day: 'WEDNESDAY', start: '09:00', end: '10:00', sub: subOs, teacher: teacher1, room: 'LH-201' },
    { day: 'WEDNESDAY', start: '10:00', end: '11:00', sub: subDsa, teacher: teacher1, room: 'LH-201' },
    { day: 'WEDNESDAY', start: '11:15', end: '12:15', sub: subCn, teacher: teacher3, room: 'LH-204' },
    { day: 'WEDNESDAY', start: '13:15', end: '15:15', sub: subDbms, teacher: teacher2, room: 'DBMS Lab' },

    { day: 'THURSDAY', start: '09:00', end: '10:00', sub: subMath, teacher: teacher1, room: 'LH-201' },
    { day: 'THURSDAY', start: '10:00', end: '11:00', sub: subCn, teacher: teacher3, room: 'LH-201' },
    { day: 'THURSDAY', start: '11:15', end: '12:15', sub: subOs, teacher: teacher1, room: 'LH-204' },

    { day: 'FRIDAY', start: '09:00', end: '10:00', sub: subDbms, teacher: teacher2, room: 'LH-201' },
    { day: 'FRIDAY', start: '10:00', end: '11:00', sub: subDsa, teacher: teacher1, room: 'LH-201' },
    { day: 'FRIDAY', start: '11:15', end: '12:15', sub: subMath, teacher: teacher1, room: 'LH-204' },
  ];

  for (const slot of timetableSchedule) {
    await prisma.timetableSlot.create({
      data: {
        classSectionId: cse4A.id,
        subjectId: slot.sub.id,
        teacherId: slot.teacher.id,
        dayOfWeek: slot.day,
        startTime: slot.start,
        endTime: slot.end,
        room: slot.room,
      },
    });
  }

  console.log('Creating Mid-Semester Examination & Results...');
  const midSem = await prisma.exam.create({
    data: {
      name: 'Mid-Semester Examination - Autumn 2026',
      examType: 'MID_TERM',
      examDate: '2026-10-24',
      slot: '09:00 AM - 12:00 PM',
      code: 'CS401',
      course: 'B.Tech CSE',
      semester: 4,
      academicYear: '2026-2027',
    },
  });

  await prisma.exam.createMany({
    data: [
      { name: 'Operating Systems', examType: 'MID_TERM', examDate: '2026-10-26', slot: '09:00 AM - 12:00 PM', code: 'CS402', course: 'B.Tech CSE', semester: 4, academicYear: '2026-2027' },
      { name: 'Database Management Systems', examType: 'MID_TERM', examDate: '2026-10-28', slot: '02:00 PM - 05:00 PM', code: 'CS403', course: 'B.Tech CSE', semester: 4, academicYear: '2026-2027' },
    ],
  });

  await prisma.placementDrive.createMany({
    data: [
      { companyName: 'Tata Consultancy Services', scheduledDate: '2026-11-04', salaryStipend: '₹7.2 LPA', eligibility: '60% throughout', degreeBranch: 'B.Tech - CSE / IT' },
      { companyName: 'Infosys', scheduledDate: '2026-11-09', salaryStipend: '₹6.5 LPA', eligibility: 'No active backlogs', degreeBranch: 'B.Tech - All Branches' },
    ],
  });

  await prisma.examResult.createMany({
    data: [
      { examId: midSem.id, studentId: student1.id, subjectId: subDsa.id, marksObtained: 88, maxMarks: 100, grade: 'A', remarks: 'Strong in Algorithmic complexity' },
      { examId: midSem.id, studentId: student1.id, subjectId: subOs.id, marksObtained: 82, maxMarks: 100, grade: 'A', remarks: 'Good grasp of kernel concepts' },
      { examId: midSem.id, studentId: student1.id, subjectId: subDbms.id, marksObtained: 94, maxMarks: 100, grade: 'A+', remarks: 'Exceptional SQL queries' },
      { examId: midSem.id, studentId: student1.id, subjectId: subCn.id, marksObtained: 79, maxMarks: 100, grade: 'B+', remarks: 'Review subnetting problems' },
      { examId: midSem.id, studentId: student1.id, subjectId: subMath.id, marksObtained: 86, maxMarks: 100, grade: 'A', remarks: 'Well solved proof proofs' },

      { examId: midSem.id, studentId: student2.id, subjectId: subDsa.id, marksObtained: 95, maxMarks: 100, grade: 'A+' },
      { examId: midSem.id, studentId: student2.id, subjectId: subOs.id, marksObtained: 91, maxMarks: 100, grade: 'A+' },
      { examId: midSem.id, studentId: student2.id, subjectId: subDbms.id, marksObtained: 96, maxMarks: 100, grade: 'A+' },
      { examId: midSem.id, studentId: student2.id, subjectId: subCn.id, marksObtained: 88, maxMarks: 100, grade: 'A' },
      { examId: midSem.id, studentId: student2.id, subjectId: subMath.id, marksObtained: 92, maxMarks: 100, grade: 'A+' },
    ],
  });

  console.log('Creating Notices...');
  await prisma.notice.createMany({
    data: [
      {
        title: 'Mid-Semester Examination Schedule Autumn 2026',
        content: 'The mid-semester theory examinations for B.Tech semesters 4, 6 and 8 will commence from October 24, 2026. Hall tickets will be downloadable via student ERP portal starting October 18.',
        category: 'EXAM',
        targetAudience: 'ALL',
        priority: 'HIGH',
        authorId: erpAdmin1.id,
      },
      {
        title: 'National Hackathon "InnoHack 2026" Registrations Open',
        content: 'Exciting news! Our college is hosting the 36-hour National InnoHack 2026 with a prize pool of ₹5,00,000. Themes include AI in Healthcare, Smart Campus, and FinTech. Form teams of 3-4.',
        category: 'EVENT',
        targetAudience: 'STUDENTS',
        priority: 'NORMAL',
        authorId: teacherUser1.id,
      },
      {
        title: 'Central Library Extended Hours During Exam Preparations',
        content: 'The Central Library reading halls will remain open 24x7 from October 15 to November 10. Digital lab and photocopy services will be operational till 11:00 PM.',
        category: 'GENERAL',
        targetAudience: 'ALL',
        priority: 'NORMAL',
        authorId: superAdmin.id,
      },
      {
        title: 'Mandatory Faculty Meeting: Outcome-Based Education (OBE) Audit',
        content: 'All HODs and teaching faculty are requested to assemble in the Senate Hall on Friday at 4:00 PM for the NBA accreditation readiness review.',
        category: 'ACADEMIC',
        targetAudience: 'TEACHERS',
        priority: 'HIGH',
        authorId: superAdmin.id,
      },
    ],
  });

  console.log('Creating Profile Correction Request (Matching User Scenario)...');
  // Student: 24CSE1023 (Aarav Patel)
  // Requested Change: Father's Name (Old: Rajesh Kumar -> New: Rakesh Kumar)
  // Reason: Incorrect spelling
  await prisma.profileCorrectionRequest.create({
    data: {
      studentId: student1.id,
      fieldName: "Father's Name",
      oldValue: 'Rajesh Kumar',
      requestedValue: 'Rakesh Kumar',
      reason: 'Incorrect spelling in college admission record. Matching with Class 10th CBSE Certificate.',
      documentUrl: 'https://cdn.college-erp.edu/documents/24cse1023_class10_marksheet.pdf',
      status: 'PENDING',
    },
  });

  // Approved past correction request to showcase completed workflow
  await prisma.profileCorrectionRequest.create({
    data: {
      studentId: student2.id,
      fieldName: 'Emergency Contact',
      oldValue: '+91 98000 00000',
      requestedValue: '+91 98765 99002',
      reason: 'Parents changed primary phone number.',
      status: 'APPROVED',
      reviewedById: erpAdmin1.id,
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      adminRemarks: 'Verified with parent telephone call.',
    },
  });

  console.log('Creating Production Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: erpAdmin1.id,
        userRole: 'ERP_ADMIN',
        userName: 'Suresh Mehta (Admin #102)',
        action: 'STUDENT_REGISTERED',
        entityType: 'Student',
        entityId: student1.id,
        oldValue: null,
        newValue: JSON.stringify({ rollNo: '24CSE1023', name: 'Aarav Patel', dept: 'CSE' }),
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        userId: teacherUser1.id,
        userRole: 'TEACHER',
        userName: 'Prof. Rajesh Sharma',
        action: 'ATTENDANCE_MARKED',
        entityType: 'Attendance',
        entityId: cse4A.id,
        oldValue: null,
        newValue: JSON.stringify({ subject: 'CS401', date: '2026-09-30', presentCount: 28, total: 30 }),
        ipAddress: '192.168.1.145',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        userId: erpAdmin1.id,
        userRole: 'ERP_ADMIN',
        userName: 'Suresh Mehta (Admin #102)',
        action: 'PROFILE_CORRECTION_APPROVED',
        entityType: 'Student',
        entityId: student2.id,
        oldValue: JSON.stringify({ field: 'Emergency Contact', val: '+91 98000 00000' }),
        newValue: JSON.stringify({ field: 'Emergency Contact', val: '+91 98765 99002' }),
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        userId: superAdmin.id,
        userRole: 'SUPER_ADMIN',
        userName: 'Dr. Arvind Swaminathan',
        action: 'ROLE_PERMISSION_UPDATED',
        entityType: 'User',
        entityId: erpAdmin2.id,
        oldValue: 'student.view',
        newValue: 'student.view,student.edit,teacher.manage,corrections.manage,audit.view',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    ],
  });

  console.log('✅ College ERP database seeding completed successfully!');
  console.log('---------------------------------------------------------');
  console.log('Default test credentials:');
  console.log('Super Admin:  superadmin@college.edu / AdminPassword@123');
  console.log('ERP Admin:    erpadmin1@college.edu  / AdminPassword@123');
  console.log('Teacher:      prof.sharma@college.edu / TeacherPassword@123');
  console.log('Student:      24cse1023@college.edu  / StudentPassword@123');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
