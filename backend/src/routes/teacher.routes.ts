import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

const router = Router();

// Middleware: Teacher only
router.use(authenticate);
router.use(requireRoles('TEACHER', 'SUPER_ADMIN'));

// Helper to get teacher record
async function getTeacher(userId: string) {
  return await prisma.teacher.findUnique({
    where: { userId },
    include: {
      user: true,
      department: true,
      subjectAssignments: {
        include: {
          subject: true,
          classSection: true,
        },
      },
    },
  });
}

// GET /api/teacher/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await getTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const assignedSectionIds = teacher.subjectAssignments.map((sa) => sa.classSectionId);

    // Count students
    const totalStudents = await prisma.student.count({
      where: { classSectionId: { in: assignedSectionIds } },
    });

    // Notes uploaded
    const notesCount = await prisma.note.count({
      where: { teacherId: teacher.id },
    });

    // Active assignments
    const assignmentsCount = await prisma.assignment.count({
      where: { teacherId: teacher.id },
    });

    // Today's classes
    const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toUpperCase();
    const timetable = await prisma.timetableSlot.findMany({
      where: {
        teacherId: teacher.id,
        dayOfWeek: todayName === 'SUNDAY' ? 'MONDAY' : todayName,
      },
      include: {
        subject: true,
        classSection: true,
      },
      orderBy: { startTime: 'asc' },
    });
    const teachingSchedule = await prisma.timetableSlot.findMany({
      where: { teacherId: teacher.id },
      include: { subject: true, classSection: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return res.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
        employeeId: teacher.employeeId,
        department: teacher.department.name,
        designation: teacher.designation,
        cabinNo: teacher.cabinNo,
      },
      stats: {
        assignedClassesCount: teacher.subjectAssignments.length,
        totalStudents,
        notesCount,
        assignmentsCount,
      },
      todaySchedule: timetable,
      teachingSchedule,
      myClasses: teacher.subjectAssignments.map((sa) => ({
        assignmentId: sa.id,
        subjectId: sa.subject.id,
        subjectName: sa.subject.name,
        subjectCode: sa.subject.code,
        sectionId: sa.classSection.id,
        sectionName: sa.classSection.name,
        semester: sa.classSection.semester,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/teacher/classes
router.get('/classes', async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await getTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    return res.json({
      success: true,
      classes: teacher.subjectAssignments.map((sa) => ({
        assignmentId: sa.id,
        subject: sa.subject,
        classSection: sa.classSection,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/teacher/classes/:sectionId/subjects/:subjectId/students
router.get('/classes/:sectionId/subjects/:subjectId/students', async (req: AuthRequest, res: Response) => {
  try {
    const sectionId = String(req.params.sectionId);
    const subjectId = String(req.params.subjectId);
    const { date } = req.query; // YYYY-MM-DD
    const dateStr = String(date || new Date().toISOString().split('T')[0]);

    if (dateStr !== new Date().toISOString().split('T')[0]) {
      return res.status(403).json({ success: false, message: 'Faculty attendance can only be edited for today. Use an OD request for an approved exception.' });
    }

    const teacher = await getTeacher(req.user!.id);
    const scheduled = await prisma.timetableSlot.findFirst({
      where: { teacherId: teacher?.id, classSectionId: sectionId, subjectId, dayOfWeek: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toUpperCase() },
    });
    if (!scheduled) return res.status(403).json({ success: false, message: 'This subject and class are not on your teaching schedule today.' });

    const students = await prisma.student.findMany({
      where: { classSectionId: sectionId },
      include: {
        user: true,
      },
      orderBy: { rollNo: 'asc' },
    });

    // Find attendance records for this date and subject
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        subjectId,
        classSectionId: sectionId,
        date: dateStr,
      },
    });

    const attendanceMap = new Map(attendanceRecords.map((r) => [r.studentId, r.status]));

    const studentListWithAttendance = students.map((s) => ({
      id: s.id,
      rollNo: s.rollNo,
      name: s.user.name,
      status: attendanceMap.get(s.id) || 'PRESENT', // default present
    }));

    return res.json({
      success: true,
      date: dateStr,
      sectionId,
      subjectId,
      students: studentListWithAttendance,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/teacher/attendance/mark
router.post('/attendance/mark', async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await getTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const { subjectId, classSectionId, date, attendance } = req.body;
    // attendance: [ { studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' } ]

    if (!subjectId || !classSectionId || !date || !Array.isArray(attendance)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance payload' });
    }
    if (date !== new Date().toISOString().split('T')[0]) {
      return res.status(403).json({ success: false, message: 'Faculty attendance can only be edited for today.' });
    }
    const scheduled = await prisma.timetableSlot.findFirst({
      where: { teacherId: teacher.id, classSectionId, subjectId, dayOfWeek: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toUpperCase() },
    });
    if (!scheduled) return res.status(403).json({ success: false, message: 'You can only mark attendance for your scheduled class today.' });

    // Upsert attendance for each student
    for (const record of attendance) {
      await prisma.attendance.upsert({
        where: {
          studentId_subjectId_date: {
            studentId: record.studentId,
            subjectId,
            date,
          },
        },
        update: {
          status: record.status,
          teacherId: teacher.id,
          classSectionId,
        },
        create: {
          studentId: record.studentId,
          subjectId,
          teacherId: teacher.id,
          classSectionId,
          date,
          status: record.status,
        },
      });
    }

    await logAuditEvent({
      req,
      action: 'ATTENDANCE_MARKED',
      entityType: 'Attendance',
      entityId: `${classSectionId}_${subjectId}_${date}`,
      newValue: { classSectionId, subjectId, date, recordCount: attendance.length },
    });

    return res.json({
      success: true,
      message: `Attendance marked successfully for ${attendance.length} students on ${date}`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/teacher/notes/upload
router.post('/notes/upload', async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await getTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const { title, unit, description, subjectId, fileUrl, fileName, fileSize } = req.body;

    if (!title || !unit || !subjectId || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Title, unit, subjectId, and fileUrl are required' });
    }

    const note = await prisma.note.create({
      data: {
        title,
        unit,
        description: description || null,
        subjectId,
        teacherId: teacher.id,
        fileUrl,
        fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
        fileSize: fileSize || '3.5 MB',
      },
    });

    await logAuditEvent({
      req,
      action: 'NOTE_UPLOADED',
      entityType: 'Note',
      entityId: note.id,
      newValue: { title, unit, subjectId, fileUrl },
    });

    return res.json({ success: true, message: 'Note uploaded successfully', note });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/teacher/notes
router.get('/notes', async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await getTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const notes = await prisma.note.findMany({
      where: { teacherId: teacher.id },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, notes });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/teacher/assignments/create
router.post('/assignments/create', async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await getTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const { title, description, subjectId, classSectionId, dueDate, maxMarks, attachmentUrl } = req.body;

    if (!title || !description || !subjectId || !classSectionId || !dueDate) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        subjectId,
        teacherId: teacher.id,
        classSectionId,
        dueDate,
        maxMarks: maxMarks ? Number(maxMarks) : 100,
        attachmentUrl: attachmentUrl || null,
      },
    });

    return res.json({ success: true, message: 'Assignment created successfully', assignment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/teacher/assignments
router.get('/assignments', async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await getTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const assignments = await prisma.assignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        classSection: true,
        submissions: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, assignments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/teacher/assignments/submissions/:id/grade
router.post('/assignments/submissions/:id/grade', async (req: AuthRequest, res: Response) => {
  try {
    const submissionId = String(req.params.id);
    const { marks, feedback } = req.body;

    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marks: Number(marks),
        feedback,
        status: 'GRADED',
      },
    });

    return res.json({ success: true, message: 'Submission graded successfully', submission });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
