import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

const router = Router();

// Middleware: Admin only (SUPER_ADMIN or ERP_ADMIN)
router.use(authenticate);
router.use(requireRoles('SUPER_ADMIN', 'ERP_ADMIN'));

// GET /api/admin/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const totalDepartments = await prisma.department.count();
    const totalCourses = await prisma.course.count();
    const totalSubjects = await prisma.subject.count();

    const pendingCorrectionsCount = await prisma.profileCorrectionRequest.count({
      where: { status: 'PENDING' },
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 6,
    });

    // Attendance health
    const totalAttendance = await prisma.attendance.count();
    const presentAttendance = await prisma.attendance.count({ where: { status: 'PRESENT' } });
    const collegeAttendanceRate = totalAttendance > 0 ? Number(((presentAttendance / totalAttendance) * 100).toFixed(1)) : 0;

    return res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalDepartments,
        totalCourses,
        totalSubjects,
        pendingCorrectionsCount,
        collegeAttendanceRate,
      },
      recentAuditLogs,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/students
router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const { search, departmentId, semester } = req.query;

    const where: any = {};
    if (departmentId) where.departmentId = String(departmentId);
    if (semester) where.semester = Number(semester);
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { rollNo: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, status: true, phone: true } },
        department: true,
        classSection: true,
      },
      orderBy: { rollNo: 'asc' },
    });

    return res.json({ success: true, students });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/academic-options (options for student registration)
router.get('/academic-options', async (_req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { classSections: { orderBy: { name: 'asc' } } },
    });
    return res.json({ success: true, departments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/students (Create Student)
router.post('/students', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, rollNo, admissionNo, departmentId, classSectionId, semester, fatherName, motherName, dob, bloodGroup, address } = req.body;

    if (!name || !email || !rollNo || !admissionNo || !departmentId || !classSectionId) {
      return res.status(400).json({ success: false, message: 'Missing required student registration fields' });
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('StudentPassword@123', salt);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        passwordHash: defaultPasswordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        permissions: 'attendance.view,notes.view,notes.download,assignments.submit,marks.view,corrections.request',
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNo,
        admissionNo,
        departmentId: String(departmentId),
        classSectionId: String(classSectionId),
        semester: Number(semester) || 1,
        fatherName: fatherName || 'Not Provided',
        motherName: motherName || 'Not Provided',
        dob: dob || '2004-01-01',
        bloodGroup: bloodGroup || null,
        address: address || null,
      },
      include: { user: true, department: true, classSection: true },
    });

    await logAuditEvent({
      req,
      action: 'STUDENT_CREATED',
      entityType: 'Student',
      entityId: student.id,
      newValue: { rollNo, name, departmentId, classSectionId },
    });

    return res.json({ success: true, message: 'Student created successfully', student });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/students/:id (Admin edit student)
router.put('/students/:id', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = String(req.params.id);
    const existing = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { name, fatherName, motherName, dob, bloodGroup, address, semester } = req.body;

    if (name) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { name },
      });
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: {
        fatherName: fatherName !== undefined ? fatherName : existing.fatherName,
        motherName: motherName !== undefined ? motherName : existing.motherName,
        dob: dob !== undefined ? dob : existing.dob,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : existing.bloodGroup,
        address: address !== undefined ? address : existing.address,
        semester: semester !== undefined ? Number(semester) : existing.semester,
      },
      include: { user: true, department: true, classSection: true },
    });

    await logAuditEvent({
      req,
      action: 'STUDENT_UPDATED_BY_ADMIN',
      entityType: 'Student',
      entityId: studentId,
      oldValue: {
        name: existing.user.name,
        fatherName: existing.fatherName,
        motherName: existing.motherName,
        dob: existing.dob,
      },
      newValue: {
        name: name || existing.user.name,
        fatherName: updated.fatherName,
        motherName: updated.motherName,
        dob: updated.dob,
      },
    });

    return res.json({ success: true, message: 'Student profile updated and logged', student: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/students/:id/status (Toggle Account Status)
router.patch('/students/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = String(req.params.id);
    const { status } = req.body; // ACTIVE | SUSPENDED | INACTIVE

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const updatedUser = await prisma.user.update({
      where: { id: student.userId },
      data: { status },
    });

    await logAuditEvent({
      req,
      action: 'STUDENT_STATUS_CHANGED',
      entityType: 'User',
      entityId: updatedUser.id,
      oldValue: { status: student.user.status },
      newValue: { status },
    });

    return res.json({ success: true, message: `Account status updated to ${status}`, status });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/students/:id (Remove student account and profile)
router.delete('/students/:id', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = String(req.params.id);
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id: studentId } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    await logAuditEvent({
      req,
      action: 'STUDENT_DELETED',
      entityType: 'Student',
      entityId: studentId,
      oldValue: { name: student.user.name, email: student.user.email, rollNo: student.rollNo },
    });

    return res.json({ success: true, message: 'Student account deleted', studentId });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/teachers
router.get('/teachers', async (req: AuthRequest, res: Response) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, status: true } },
        department: true,
        subjectAssignments: {
          include: {
            subject: true,
            classSection: true,
          },
        },
      },
    });

    return res.json({ success: true, teachers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/correction-requests
router.get('/correction-requests', async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.profileCorrectionRequest.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: true,
            classSection: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, requests });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/correction-requests/:id/action (Approve or Reject Correction Request)
router.post('/correction-requests/:id/action', async (req: AuthRequest, res: Response) => {
  try {
    const requestId = String(req.params.id);
    const { action, adminRemarks } = req.body; // action: 'APPROVED' | 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be APPROVED or REJECTED' });
    }

    const request = await prisma.profileCorrectionRequest.findUnique({
      where: { id: requestId },
      include: { student: { include: { user: true } } },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Correction request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    // If APPROVED, perform actual update on Student record
    if (action === 'APPROVED') {
      const field = request.fieldName;
      const newVal = request.requestedValue;

      const updateData: any = {};
      if (field === "Father's Name" || field === 'fatherName') updateData.fatherName = newVal;
      if (field === "Mother's Name" || field === 'motherName') updateData.motherName = newVal;
      if (field === 'Date of Birth' || field === 'dob') updateData.dob = newVal;
      if (field === 'Emergency Contact' || field === 'emergencyContact') updateData.emergencyContact = newVal;
      if (field === 'Address' || field === 'address') updateData.address = newVal;

      if (Object.keys(updateData).length > 0) {
        await prisma.student.update({
          where: { id: request.studentId },
          data: updateData,
        });
      }
    }

    // Update request state
    const updatedRequest = await prisma.profileCorrectionRequest.update({
      where: { id: requestId },
      data: {
        status: action,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
        adminRemarks: adminRemarks || null,
      },
    });

    // Write essential AUDIT LOG
    await logAuditEvent({
      req,
      action: action === 'APPROVED' ? 'PROFILE_CORRECTION_APPROVED' : 'PROFILE_CORRECTION_REJECTED',
      entityType: 'Student',
      entityId: request.studentId,
      oldValue: { field: request.fieldName, value: request.oldValue },
      newValue: {
        field: request.fieldName,
        value: action === 'APPROVED' ? request.requestedValue : request.oldValue,
        decision: action,
        reviewer: req.user!.name,
        remarks: adminRemarks,
      },
    });

    return res.json({
      success: true,
      message: `Correction request marked as ${action} and database synchronized.`,
      request: updatedRequest,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    const { action, entityType, limit } = req.query;

    const where: any = {};
    if (action) where.action = String(action);
    if (entityType) where.entityType = String(entityType);

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit ? Number(limit) : 50,
    });

    return res.json({ success: true, count: logs.length, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/password-reset
router.post('/password-reset', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, message: 'userId and newPassword are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const user = await prisma.user.update({
      where: { id: String(userId) },
      data: { passwordHash },
    });

    await logAuditEvent({
      req,
      action: 'ADMIN_PASSWORD_RESET',
      entityType: 'User',
      entityId: String(userId),
      newValue: { targetUserEmail: user.email, targetUserName: user.name },
    });

    return res.json({ success: true, message: `Password reset successfully for ${user.email}` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/academics
router.get('/academics', async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        courses: true,
        subjects: true,
        classSections: true,
      },
    });

    return res.json({ success: true, departments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// HOD / ERP Admin OD review. Approval also credits the student on every
// scheduled class for that date, so the record is reflected in attendance.
router.get('/od-requests', async (_req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.oDRequest.findMany({
      include: { student: { include: { user: true, classSection: true } } },
      orderBy: [{ status: 'asc' }, { date: 'desc' }],
    });
    return res.json({ success: true, requests });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/od-requests/:id/action', async (req: AuthRequest, res: Response) => {
  try {
    const action = req.body.action === 'APPROVED' ? 'APPROVED' : req.body.action === 'REJECTED' ? 'REJECTED' : null;
    if (!action) return res.status(400).json({ success: false, message: 'Action must be APPROVED or REJECTED.' });
    const request = await prisma.oDRequest.findUnique({
      where: { id: String(req.params.id) },
      include: { student: true },
    });
    if (!request) return res.status(404).json({ success: false, message: 'OD request not found.' });

    const updated = await prisma.oDRequest.update({
      where: { id: request.id },
      data: { status: action, reviewedById: req.user!.id, reviewedAt: new Date(), adminRemarks: req.body.adminRemarks || `OD ${action.toLowerCase()} by HOD/ERP Admin.` },
    });

    if (action === 'APPROVED') {
      const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${request.date}T12:00:00Z`)).toUpperCase();
      const slots = await prisma.timetableSlot.findMany({ where: { classSectionId: request.student.classSectionId, dayOfWeek: weekday } });
      for (const slot of slots) {
        await prisma.attendance.upsert({
          where: { studentId_subjectId_date: { studentId: request.studentId, subjectId: slot.subjectId, date: request.date } },
          update: { status: 'PRESENT', teacherId: slot.teacherId, classSectionId: request.student.classSectionId, remarks: 'OD approved by HOD/ERP Admin' },
          create: { studentId: request.studentId, subjectId: slot.subjectId, teacherId: slot.teacherId, classSectionId: request.student.classSectionId, date: request.date, status: 'PRESENT', remarks: 'OD approved by HOD/ERP Admin' },
        });
      }
    }
    await logAuditEvent({ req, action: `OD_${action}`, entityType: 'ODRequest', entityId: request.id, newValue: { date: request.date, studentId: request.studentId } });
    return res.json({ success: true, request: updated, message: action === 'APPROVED' ? 'OD approved and attendance credited.' : 'OD request rejected.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
