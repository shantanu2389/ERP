import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';
import crypto from 'crypto';

const router = Router();

// Middleware: Student only
router.use(authenticate);
router.use(requireRoles('STUDENT'));

// Helper to get student record from authenticated user
async function getStudent(userId: string) {
  return await prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      department: true,
      classSection: true,
    },
  });
}

function weekdayForDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
    .toUpperCase();
}

// GET /api/student/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Attendance stats
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: { subject: true },
    });

    const dashboardSlots = await prisma.timetableSlot.findMany({
      where: { classSectionId: student.classSectionId },
      select: { subjectId: true, dayOfWeek: true },
    });
    const academicHolidays = await prisma.academicHoliday.findMany({ orderBy: { date: 'asc' } });
    const holidayDates = new Set(academicHolidays.map((holiday) => holiday.date));
    // A mark is a valid class only when the subject was actually scheduled on
    // that weekday and the date is not an academic holiday.
    const validAttendanceRecords = attendanceRecords.filter((record) => (
      !holidayDates.has(record.date) && dashboardSlots.some((slot) => slot.subjectId === record.subjectId && slot.dayOfWeek === weekdayForDate(record.date))
    ));

    const totalClasses = validAttendanceRecords.length;
    const presentClasses = validAttendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const overallPercentage = totalClasses > 0 ? Number(((presentClasses / totalClasses) * 100).toFixed(1)) : 100;

    // Subjects enrolled for class
    const subjects = await prisma.subject.findMany({
      where: { departmentId: student.departmentId, semester: student.semester },
    });

    // Subject-wise attendance calculation
    const subjectWise = subjects.map((sub) => {
      const subRecords = validAttendanceRecords.filter((a) => a.subjectId === sub.id);
      const subTotal = subRecords.length;
      const subPresent = subRecords.filter((a) => a.status === 'PRESENT').length;
      const percentage = subTotal > 0 ? Number(((subPresent / subTotal) * 100).toFixed(1)) : 100;

      return {
        subjectId: sub.id,
        name: sub.name,
        code: sub.code,
        credits: sub.credits,
        total: subTotal,
        present: subPresent,
        percentage,
      };
    });

    // Today's classes from Timetable
    const currentDate = new Date().toISOString().split('T')[0];
    const todayName = weekdayForDate(currentDate);
    const timetable = await prisma.timetableSlot.findMany({
      where: { classSectionId: student.classSectionId },
      include: { subject: true, teacher: { include: { user: true } } },
      orderBy: { startTime: 'asc' },
    });

    const todayClasses = holidayDates.has(currentDate) ? [] : timetable.filter((slot) => slot.dayOfWeek === (todayName === 'SUNDAY' ? 'MONDAY' : todayName));

    // Recent Notes
    const recentNotes = await prisma.note.findMany({
      where: { subject: { departmentId: student.departmentId, semester: student.semester } },
      include: { subject: true, teacher: { include: { user: true } } },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Active Assignments
    const assignments = await prisma.assignment.findMany({
      where: { classSectionId: student.classSectionId },
      include: {
        subject: true,
        submissions: { where: { studentId: student.id } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Notices
    const notices = await prisma.notice.findMany({
      where: { targetAudience: { in: ['ALL', 'STUDENTS'] } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    const examTimetable = await prisma.exam.findMany({
      where: { semester: student.semester },
      orderBy: { examDate: 'asc' },
      take: 8,
    });

    const placementScheduled = await prisma.placementDrive.findMany({
      orderBy: { scheduledDate: 'asc' },
      take: 8,
    });

    return res.json({
      success: true,
      student: {
        id: student.id,
        name: student.user.name,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        department: student.department.name,
        departmentCode: student.department.code,
        semester: student.semester,
        classSection: student.classSection.name,
      },
      attendance: {
        totalClasses,
        presentClasses,
        overallPercentage,
        subjectWise,
      },
      todayClasses,
      recentNotes,
      assignments,
      notices,
      academicHolidays,
      examTimetable,
      placementScheduled,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const pendingCorrections = await prisma.profileCorrectionRequest.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      profile: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        department: student.department.name,
        classSection: student.classSection.name,
        semester: student.semester,
        fatherName: student.fatherName,
        motherName: student.motherName,
        dob: student.dob,
        bloodGroup: student.bloodGroup,
        address: student.address,
        emergencyContact: student.emergencyContact,
        readOnlyFieldsNotice: 'Official student records like Father Name, Mother Name, and DOB are locked. Use Request Correction for administrative approval.',
      },
      pendingCorrections,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/attendance
router.get('/attendance', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const records = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: { subject: true, teacher: { include: { user: true } } },
      orderBy: { date: 'desc' },
    });

    const subjects = await prisma.subject.findMany({
      where: { departmentId: student.departmentId, semester: student.semester },
    });
    const classSlots = await prisma.timetableSlot.findMany({
      where: { classSectionId: student.classSectionId },
      select: { subjectId: true, dayOfWeek: true, startTime: true, endTime: true, room: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    const academicHolidays = await prisma.academicHoliday.findMany({ orderBy: { date: 'asc' } });
    const holidayDates = new Set(academicHolidays.map((holiday) => holiday.date));
    const validRecords = records.filter((record) => (
      !holidayDates.has(record.date) && classSlots.some((slot) => slot.subjectId === record.subjectId && slot.dayOfWeek === weekdayForDate(record.date))
    ));

    const totalClasses = validRecords.length;
    const presentClasses = validRecords.filter((r) => r.status === 'PRESENT').length;
    const overallPercentage = totalClasses > 0 ? Number(((presentClasses / totalClasses) * 100).toFixed(1)) : 100;

    const subjectBreakdown = subjects.map((sub) => {
      const subRecords = validRecords.filter((r) => r.subjectId === sub.id);
      const total = subRecords.length;
      const present = subRecords.filter((r) => r.status === 'PRESENT').length;
      const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 100;

      // Attendance prediction per subject (target 75%)
      let prediction = '';
      let statusType = 'GOOD';
      if (percentage >= 75) {
        const canBunk = Math.floor((present - 0.75 * total) / 0.75);
        prediction = canBunk > 0 ? `You may skip up to ${canBunk} upcoming class${canBunk === 1 ? '' : 'es'} and remain above 75%.` : 'On track. Prioritise your upcoming classes.';
        statusType = 'SAFE';
      } else {
        const needConsecutive = Math.ceil((0.75 * total - present) / 0.25);
        prediction = `Attendance below 75%! You must attend next ${needConsecutive} consecutive class(es) to recover.`;
        statusType = 'DEFICIT';
      }

      return {
        subjectId: sub.id,
        name: sub.name,
        code: sub.code,
        credits: sub.credits,
        total,
        present,
        absent: total - present,
        percentage,
        prediction,
        statusType,
        courseType: (sub as any).courseType || (sub.name.toLowerCase().includes('lab') ? 'LAB' : 'THEORY'),
        hasLabSlot: classSlots.some((slot) => slot.subjectId === sub.id && /lab|laboratory/i.test(slot.room || '')),
        records: subRecords.map((record) => {
          const recordDay = weekdayForDate(record.date);
          return {
            id: record.id,
            date: record.date,
            status: record.status,
            remarks: record.remarks,
            classTimings: classSlots
              .filter((slot) => slot.subjectId === sub.id && slot.dayOfWeek === recordDay)
              .map((slot) => `${slot.startTime}–${slot.endTime}`),
          };
        }).sort((a, b) => b.date.localeCompare(a.date)),
        classTimings: classSlots.filter((slot) => slot.subjectId === sub.id).map((slot) => ({
          day: slot.dayOfWeek,
          time: `${slot.startTime}–${slot.endTime}`,
          room: slot.room,
        })),
      };
    });

    // Overall attendance prediction
    let overallPrediction = '';
    if (overallPercentage >= 75) {
      const safeMiss = Math.floor((presentClasses - 0.75 * totalClasses) / 0.75);
      overallPrediction = safeMiss > 0 ? `You may skip up to ${safeMiss} upcoming class${safeMiss === 1 ? '' : 'es'} without dropping below the mandatory 75% threshold.` : 'You are right at the 75% boundary.';
    } else {
      const requiredPresents = Math.ceil((0.75 * totalClasses - presentClasses) / 0.25);
      overallPrediction = `You need ${requiredPresents} consecutive present marks to reach the 75% minimum requirement.`;
    }

    return res.json({
      success: true,
      overall: {
        total: totalClasses,
        present: presentClasses,
        percentage: overallPercentage,
        requiredThreshold: 75,
        prediction: overallPrediction,
        isAboveThreshold: overallPercentage >= 75,
      },
      subjects: subjectBreakdown,
      history: validRecords.slice(0, 30).map((record) => {
        const recordDay = weekdayForDate(record.date);
        return {
          ...record,
          // Show only the lecture slot(s) that actually occurred on this date.
          // This also supports two lectures of the same subject on one day.
          classTimings: classSlots
            .filter((slot) => slot.subjectId === record.subjectId && slot.dayOfWeek === recordDay)
            .map((slot) => `${slot.startTime}–${slot.endTime}`),
        };
      }),
      academicHolidays,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/timetable
router.get('/timetable', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const slots = await prisma.timetableSlot.findMany({
      where: { classSectionId: student.classSectionId },
      include: {
        subject: true,
        teacher: { include: { user: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return res.json({ success: true, classSection: student.classSection.name, timetable: slots });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/notes
router.get('/notes', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const notes = await prisma.note.findMany({
      where: {
        subject: {
          departmentId: student.departmentId,
          semester: student.semester,
        },
      },
      include: {
        subject: true,
        teacher: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, notes });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/assignments
router.get('/assignments', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const assignments = await prisma.assignment.findMany({
      where: { classSectionId: student.classSectionId },
      include: {
        subject: true,
        teacher: { include: { user: true } },
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.json({ success: true, assignments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/student/assignments/:id/submit
router.post('/assignments/:id/submit', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const assignmentId = String(req.params.id);
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return res.status(400).json({ success: false, message: 'File URL and file name are required' });
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      update: {
        fileUrl,
        fileName,
        submittedAt: new Date(),
        status: 'SUBMITTED',
      },
      create: {
        assignmentId,
        studentId: student.id,
        fileUrl,
        fileName,
        status: 'SUBMITTED',
      },
    });

    return res.json({ success: true, message: 'Assignment submitted successfully', submission });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/results
router.get('/results', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const results = await prisma.examResult.findMany({
      where: { studentId: student.id },
      include: {
        exam: true,
        subject: true,
      },
      orderBy: { exam: { name: 'asc' } },
    });

    const totalMarks = results.reduce((acc, r) => acc + r.marksObtained, 0);
    const maxMarks = results.reduce((acc, r) => acc + r.maxMarks, 0);
    const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(1) : '0';

    return res.json({
      success: true,
      results,
      summary: {
        totalMarks,
        maxMarks,
        percentage,
        gpa: (Number(percentage) / 10).toFixed(2),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/student/profile-correction
router.post('/profile-correction', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const { fieldName, requestedValue, reason, documentUrl } = req.body;

    if (!fieldName || !requestedValue || !reason) {
      return res.status(400).json({
        success: false,
        message: 'fieldName, requestedValue, and reason are required',
      });
    }

    // Get current value of field
    let oldValue = (student as any)[fieldName] || 'N/A';
    if (fieldName === "Father's Name") oldValue = student.fatherName;
    if (fieldName === "Mother's Name") oldValue = student.motherName;
    if (fieldName === 'Date of Birth') oldValue = student.dob;

    const correction = await prisma.profileCorrectionRequest.create({
      data: {
        studentId: student.id,
        fieldName,
        oldValue: String(oldValue),
        requestedValue,
        reason,
        documentUrl: documentUrl || null,
        status: 'PENDING',
      },
    });

    await logAuditEvent({
      req,
      action: 'CORRECTION_REQUESTED',
      entityType: 'ProfileCorrectionRequest',
      entityId: correction.id,
      oldValue: { field: fieldName, val: oldValue },
      newValue: { field: fieldName, val: requestedValue, reason },
    });

    return res.json({
      success: true,
      message: 'Correction request submitted for ERP Admin approval.',
      correction,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/profile-corrections
router.get('/profile-corrections', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const requests = await prisma.profileCorrectionRequest.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, requests });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Student OD (On Duty) request with supporting PDF. HOD/ERP Admin reviews it.
router.get('/od-requests', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const requests = await prisma.oDRequest.findMany({ where: { studentId: student.id }, orderBy: { date: 'desc' } });
    return res.json({ success: true, requests });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/od-requests', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const { date, reason, documentUrl } = req.body;
    if (!date || !reason || !documentUrl || !String(documentUrl).toLowerCase().includes('pdf')) {
      return res.status(400).json({ success: false, message: 'Date, reason, and a supporting PDF are required.' });
    }
    const request = await prisma.oDRequest.create({ data: { studentId: student.id, date, reason, documentUrl } });
    return res.status(201).json({ success: true, request });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/fees
router.get('/fees', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    let invoices = await prisma.feeInvoice.findMany({ where: { studentId: student.id }, include: { payments: true }, orderBy: { dueDate: 'desc' } });
    if (invoices.length === 0) {
      const invoice = await prisma.feeInvoice.create({
        data: {
          studentId: student.id,
          invoiceNumber: `CGC-${new Date().getFullYear()}-${student.rollNo}`,
          term: '2026-27 / Semester 1',
          description: 'Tuition and institutional fee',
          amount: 75000,
          dueDate: '2026-10-31',
        },
        include: { payments: true },
      });
      invoices = [invoice];
    }
    return res.json({ success: true, invoices });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Demo-safe online checkout. Replace the transaction creation block with the
// verified Razorpay/Stripe webhook in production.
router.post('/fees/:id/pay', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const invoice = await prisma.feeInvoice.findFirst({ where: { id: String(req.params.id), studentId: student.id }, include: { payments: true } });
    if (!invoice) return res.status(404).json({ success: false, message: 'Fee invoice not found' });
    if (invoice.status === 'PAID') return res.json({ success: true, message: 'This fee has already been paid.', invoice });

    const now = new Date();
    const transactionId = `CGCPAY-${now.getFullYear()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    const receiptNumber = `CGC-REC-${now.getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const payment = await prisma.feePayment.create({ data: { invoiceId: invoice.id, transactionId, amount: invoice.amount, receiptNumber } });
    const updated = await prisma.feeInvoice.update({ where: { id: invoice.id }, data: { status: 'PAID', paidAt: now }, include: { payments: true } });
    await logAuditEvent({ req, action: 'FEE_PAYMENT_SUCCESS', entityType: 'FeeInvoice', entityId: invoice.id, newValue: { transactionId, receiptNumber, amount: invoice.amount } });
    return res.json({ success: true, message: 'Payment successful. Your receipt is ready.', invoice: updated, payment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/fees/:id/receipt', async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudent(req.user!.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const invoice = await prisma.feeInvoice.findFirst({ where: { id: String(req.params.id), studentId: student.id }, include: { payments: true, student: { include: { user: true, classSection: true } } } });
    if (!invoice || invoice.status !== 'PAID' || !invoice.payments[0]) return res.status(404).json({ success: false, message: 'Paid receipt not available' });
    return res.json({ success: true, receipt: { invoiceNumber: invoice.invoiceNumber, receiptNumber: invoice.payments[0].receiptNumber, transactionId: invoice.payments[0].transactionId, paidAt: invoice.paidAt, amount: invoice.amount, term: invoice.term, description: invoice.description, studentName: invoice.student.user.name, rollNo: invoice.student.rollNo, classSection: invoice.student.classSection.name } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
