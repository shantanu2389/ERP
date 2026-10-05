'use client';

import React, { useState, useEffect } from 'react';
import {
  DEMO_STUDENTS,
  DEMO_TEACHERS,
  DEMO_ADMINS,
  login,
  getLoginChallenge,
  fetchWithAuth,
  saveSession,
  getStoredSession,
  clearStoredSession,
  UserSession,
} from '@/lib/api';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  Shield,
  UserCheck,
  Users,
  Search,
  Check,
  Send,
  UploadCloud,
  History,
  TrendingUp,
  RefreshCw,
  LogOut,
  Sparkles,
  Lock,
  Plus,
  Award,
  Eye,
  EyeOff,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  User,
  KeyRound,
  CheckCheck,
  Sun,
  Moon,
  FlaskConical,
} from 'lucide-react';

function AttendanceRing({ percentage, size = 112 }: { percentage: number; size?: number }) {
  const value = Math.max(0, Math.min(100, Number(percentage) || 0));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`${value}% attendance`}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="9" className="text-slate-200" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" className={value >= 75 ? 'text-emerald-500' : 'text-rose-500'} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-bold text-slate-800">
        <span className="text-xl">{value.toFixed(1)}%</span>
        <span className="text-[10px] font-normal text-slate-500">MIN 75%</span>
      </div>
    </div>
  );
}

function ERPPortal() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialChecking, setInitialChecking] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Login page state
  const [loginRoleTab, setLoginRoleTab] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState<boolean>(false);
  const [challenge, setChallenge] = useState<{ challengeId: string; question: string }>({ challengeId: '', question: '' });
  const [challengeAnswer, setChallengeAnswer] = useState<string>('');

  // Student states
  const [studentDashboard, setStudentDashboard] = useState<any>(null);
  const [studentAttendance, setStudentAttendance] = useState<any>(null);
  const [studentNotes, setStudentNotes] = useState<any[]>([]);
  const [studentTimetable, setStudentTimetable] = useState<any[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [studentResults, setStudentResults] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [academicSchedule, setAcademicSchedule] = useState<{ examTimetable: any[]; placementScheduled: any[] }>({ examTimetable: [], placementScheduled: [] });
  const [studentODRequests, setStudentODRequests] = useState<any[]>([]);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [selectedAttendanceSubject, setSelectedAttendanceSubject] = useState<any>(null);
  const [odDate, setOdDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [odReason, setOdReason] = useState<string>('');
  const [odDocument, setOdDocument] = useState<string>('');
  const [odDocumentName, setOdDocumentName] = useState<string>('');

  // Student assignment submission modal
  const [submittingAssignment, setSubmittingAssignment] = useState<any>(null);
  const [assignmentFileUrl, setAssignmentFileUrl] = useState<string>('');
  const [assignmentFileName, setAssignmentFileName] = useState<string>('');

  // Student correction modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [correctionField, setCorrectionField] = useState<string>("Father's Name");
  const [requestedValue, setRequestedValue] = useState<string>('Rakesh Kumar');
  const [correctionReason, setCorrectionReason] = useState<string>('Spelling error in college admission record');

  // Teacher states
  const [teacherDashboard, setTeacherDashboard] = useState<any>(null);
  const [teacherStudents, setTeacherStudents] = useState<any[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [teacherNotes, setTeacherNotes] = useState<any[]>([]);
  const [selectedClassSection, setSelectedClassSection] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [teacherAttendanceMap, setTeacherAttendanceMap] = useState<Record<string, string>>({});
  const [showUploadNoteModal, setShowUploadNoteModal] = useState<boolean>(false);
  const [newNote, setNewNote] = useState({ title: '', unit: '', description: '', subjectId: '', fileUrl: '' });

  // Teacher create assignment modal
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState<boolean>(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subjectId: '',
    classSectionId: '',
    dueDate: '',
    maxMarks: '100',
  });

  // Teacher grade submission modal
  const [gradingSubmission, setGradingSubmission] = useState<{ submission: any; assignment: any } | null>(null);
  const [gradeMarks, setGradeMarks] = useState<string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Admin states
  const [adminDashboard, setAdminDashboard] = useState<any>(null);
  const [adminStudents, setAdminStudents] = useState<any[]>([]);
  const [adminCorrections, setAdminCorrections] = useState<any[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
  const [adminODRequests, setAdminODRequests] = useState<any[]>([]);
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [adminOptions, setAdminOptions] = useState<any[]>([]);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentForm, setStudentForm] = useState({
    name: '', email: '', rollNo: '', admissionNo: '', departmentId: '', classSectionId: '', semester: '1',
    fatherName: '', motherName: '', dob: '', bloodGroup: '', address: '',
  });

  // Check saved session on mount (NO automatic bypass/auto-login without explicit session!)
  useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('cgc-theme') : null;
    if (savedTheme === 'dark') setTheme('dark');
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('cgc-theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = getStoredSession();
    if (saved && saved.token) {
      setSession(saved);
      loadPersonaData(saved).finally(() => setInitialChecking(false));
    } else {
      setInitialChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      getLoginChallenge().then(setChallenge).catch(() => setChallenge({ challengeId: '', question: '' }));
      setChallengeAnswer('');
    }
  }, [session]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogin = async (idToUse?: string, passToUse?: string) => {
    const loginId = idToUse || identifier;
    const loginPass = passToUse || password;
    setLoginError('');

    if (!loginId || !loginPass || !challenge.challengeId || !challengeAnswer) {
      setLoginError('Please enter your credentials and complete the human verification challenge.');
      return;
    }

    setIsSubmittingLogin(true);
    setLoading(true);

    try {
      const sess = await login(loginId, loginPass, loginRoleTab, challenge.challengeId, challengeAnswer);
      setSession(sess);
      saveSession(sess);
      setActiveTab('overview');
      await loadPersonaData(sess);
      showToast('success', `Welcome back, ${sess.user.name}! Logged in as ${sess.user.role}.`);
      setIdentifier('');
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
      showToast('error', err.message || 'Login failed');
    } finally {
      setIsSubmittingLogin(false);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    setStudentDashboard(null);
    setAcademicSchedule({ examTimetable: [], placementScheduled: [] });
    setTeacherDashboard(null);
    setAdminDashboard(null);
    setIdentifier('');
    setPassword('');
    setLoginError('');
    setChallengeAnswer('');
    setActiveTab('overview');
    showToast('success', 'Logged out successfully. You can log in via another portal.');
  };

  const loadPersonaData = async (sess: UserSession) => {
    try {
      // The academic schedule module is optional in this local build; do not
      // block login/data loading when that separate service is unavailable.
      setAcademicSchedule({ examTimetable: [], placementScheduled: [] });
      if (sess.user.role === 'STUDENT') {
        const [dash, att, notes, tt, assign, results, prof, od, fees] = await Promise.all([
          fetchWithAuth('/student/dashboard', sess.token),
          fetchWithAuth('/student/attendance', sess.token),
          fetchWithAuth('/student/notes', sess.token),
          fetchWithAuth('/student/timetable', sess.token),
          fetchWithAuth('/student/assignments', sess.token),
          fetchWithAuth('/student/results', sess.token),
          fetchWithAuth('/student/profile', sess.token),
          fetchWithAuth('/student/od-requests', sess.token),
          fetchWithAuth('/student/fees', sess.token),
        ]);
        setStudentDashboard(dash);
        setStudentAttendance(att);
        setStudentNotes(notes.notes || []);
        setStudentTimetable(tt.timetable || []);
        setStudentAssignments(assign.assignments || []);
        setStudentResults(results);
        setStudentProfile(prof);
        setStudentODRequests(od.requests || []);
        setStudentFees(fees.invoices || []);
      } else if (sess.user.role === 'TEACHER') {
        const [dash, assigns, notes] = await Promise.all([
          fetchWithAuth('/teacher/dashboard', sess.token),
          fetchWithAuth('/teacher/assignments', sess.token),
          fetchWithAuth('/teacher/notes', sess.token),
        ]);
        setTeacherDashboard(dash);
        setTeacherAssignments(assigns.assignments || []);
        setTeacherNotes(notes.notes || []);
        if (dash.myClasses && dash.myClasses.length > 0) {
          const firstClass = dash.myClasses[0];
          setSelectedClassSection(firstClass.sectionId);
          setSelectedSubject(firstClass.subjectId);
          loadClassStudents(sess.token, firstClass.sectionId, firstClass.subjectId, attendanceDate);
        }
      } else if (sess.user.role === 'ERP_ADMIN' || sess.user.role === 'SUPER_ADMIN') {
        const [dash, studs, corrs, audits, ods, options] = await Promise.all([
          fetchWithAuth('/admin/dashboard', sess.token),
          fetchWithAuth('/admin/students', sess.token),
          fetchWithAuth('/admin/correction-requests', sess.token),
          fetchWithAuth('/admin/audit-logs', sess.token),
          fetchWithAuth('/admin/od-requests', sess.token),
          fetchWithAuth('/admin/academic-options', sess.token),
        ]);
        setAdminDashboard(dash);
        setAdminStudents(studs.students || []);
        setAdminCorrections(corrs.requests || []);
        setAdminAuditLogs(audits.logs || []);
        setAdminODRequests(ods.requests || []);
        setAdminOptions(options.departments || []);
      }
    } catch (e: any) {
      console.error('Error loading data:', e);
      if (String(e.message || '').toLowerCase().includes('session') || String(e.message || '').toLowerCase().includes('unauthorized')) {
        clearStoredSession();
        setSession(null);
        setLoginError('Your session expired. Please sign in again.');
      } else {
        showToast('error', 'Error refreshing data. Please re-login if token expired.');
      }
    }
  };

  const loadClassStudents = async (token: string, sectionId: string, subjectId: string, date: string) => {
    try {
      const data = await fetchWithAuth(
        `/teacher/classes/${sectionId}/subjects/${subjectId}/students?date=${date}`,
        token
      );
      setTeacherStudents(data.students || []);
      const map: Record<string, string> = {};
      data.students.forEach((s: any) => {
        map[s.id] = s.status;
      });
      setTeacherAttendanceMap(map);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Student submit correction request
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      await fetchWithAuth('/student/profile-correction', session.token, {
        method: 'POST',
        body: JSON.stringify({
          fieldName: correctionField,
          requestedValue,
          reason: correctionReason,
        }),
      });
      showToast('success', 'Profile correction request submitted for ERP Admin review!');
      setShowCorrectionModal(false);
      const prof = await fetchWithAuth('/student/profile', session.token);
      setStudentProfile(prof);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleSubmitOD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !odDocument) return;
    try {
      await fetchWithAuth('/student/od-requests', session.token, {
        method: 'POST',
        body: JSON.stringify({ date: odDate, reason: odReason, documentUrl: odDocument }),
      });
      const data = await fetchWithAuth('/student/od-requests', session.token);
      setStudentODRequests(data.requests || []);
      setOdReason(''); setOdDocument(''); setOdDocumentName('');
      showToast('success', 'OD request submitted to HOD / ERP Admin for review.');
    } catch (err: any) { showToast('error', err.message); }
  };

  const handleODAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    if (!session) return;
    try {
      await fetchWithAuth(`/admin/od-requests/${requestId}/action`, session.token, {
        method: 'POST', body: JSON.stringify({ action }),
      });
      const data = await fetchWithAuth('/admin/od-requests', session.token);
      setAdminODRequests(data.requests || []);
      showToast('success', action === 'APPROVED' ? 'OD approved and attendance credited.' : 'OD request rejected.');
    } catch (err: any) { showToast('error', err.message); }
  };

  const handleFeePayment = async (invoiceId: string) => {
    if (!session) return;
    try {
      const data = await fetchWithAuth(`/student/fees/${invoiceId}/pay`, session.token, { method: 'POST' });
      const fees = await fetchWithAuth('/student/fees', session.token);
      setStudentFees(fees.invoices || []);
      showToast('success', data.message || 'Payment successful. Receipt generated.');
    } catch (err: any) { showToast('error', err.message); }
  };

  const printFeeReceipt = async (invoiceId: string) => {
    if (!session) return;
    try {
      const data = await fetchWithAuth(`/student/fees/${invoiceId}/receipt`, session.token);
      const receipt = data.receipt;
      const popup = window.open('', '_blank', 'width=760,height=760');
      if (!popup) return;
      popup.document.write(`<html><head><title>${receipt.receiptNumber} | CGC Landran</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#172033}h1{color:#075985}table{width:100%;border-collapse:collapse;margin-top:25px}td{padding:12px;border-bottom:1px solid #dbeafe}td:first-child{font-weight:700;width:35%}.paid{color:#047857;font-weight:700}</style></head><body><h1>CGC Landran</h1><p>Chandigarh Group of Colleges • Official Fee Receipt</p><hr/><h2>Payment Receipt</h2><table><tr><td>Receipt No.</td><td>${receipt.receiptNumber}</td></tr><tr><td>Transaction ID</td><td>${receipt.transactionId}</td></tr><tr><td>Student</td><td>${receipt.studentName}</td></tr><tr><td>Roll No.</td><td>${receipt.rollNo}</td></tr><tr><td>Class</td><td>${receipt.classSection}</td></tr><tr><td>Term</td><td>${receipt.term}</td></tr><tr><td>Description</td><td>${receipt.description}</td></tr><tr><td>Amount Paid</td><td>₹${Number(receipt.amount).toLocaleString('en-IN')}</td></tr><tr><td>Status</td><td class="paid">PAID</td></tr></table><p style="margin-top:40px">Generated online on ${new Date(receipt.paidAt).toLocaleString()}</p><script>window.print()</script></body></html>`);
      popup.document.close();
    } catch (err: any) { showToast('error', err.message); }
  };

  // Student submit assignment
  const handleStudentAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !submittingAssignment) return;
    try {
      await fetchWithAuth(`/student/assignments/${submittingAssignment.id}/submit`, session.token, {
        method: 'POST',
        body: JSON.stringify({
          fileUrl: assignmentFileUrl || `https://cdn.college-erp.edu/submissions/${session.user.name.replace(/\s+/g, '_')}_solution.pdf`,
          fileName: assignmentFileName || `${submittingAssignment.title.replace(/\s+/g, '_')}_submission.pdf`,
        }),
      });
      showToast('success', `Assignment "${submittingAssignment.title}" submitted successfully!`);
      setSubmittingAssignment(null);
      setAssignmentFileUrl('');
      setAssignmentFileName('');
      // Reload assignments
      const assign = await fetchWithAuth('/student/assignments', session.token);
      setStudentAssignments(assign.assignments || []);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Teacher mark attendance submit
  const handleSaveAttendance = async () => {
    if (!session) return;
    try {
      const payload = {
        subjectId: selectedSubject,
        classSectionId: selectedClassSection,
        date: attendanceDate,
        attendance: Object.entries(teacherAttendanceMap).map(([studentId, status]) => ({
          studentId,
          status,
        })),
      };

      await fetchWithAuth('/teacher/attendance/mark', session.token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      showToast('success', `Attendance updated for ${payload.attendance.length} students & audit logged!`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Teacher create new assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      await fetchWithAuth('/teacher/assignments/create', session.token, {
        method: 'POST',
        body: JSON.stringify({
          title: newAssignment.title,
          description: newAssignment.description,
          subjectId: newAssignment.subjectId || selectedSubject,
          classSectionId: newAssignment.classSectionId || selectedClassSection,
          dueDate: newAssignment.dueDate || '2026-10-31',
          maxMarks: newAssignment.maxMarks || 100,
        }),
      });
      showToast('success', 'Assignment published to student portal successfully!');
      setShowCreateAssignmentModal(false);
      setNewAssignment({
        title: '',
        description: '',
        subjectId: '',
        classSectionId: '',
        dueDate: '',
        maxMarks: '100',
      });
      const assigns = await fetchWithAuth('/teacher/assignments', session.token);
      setTeacherAssignments(assigns.assignments || []);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Teacher grade submission
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !gradingSubmission) return;
    try {
      await fetchWithAuth(`/teacher/assignments/submissions/${gradingSubmission.submission.id}/grade`, session.token, {
        method: 'POST',
        body: JSON.stringify({
          marks: Number(gradeMarks),
          feedback: gradeFeedback,
        }),
      });
      showToast('success', `Submission graded (${gradeMarks} Marks) & feedback published!`);
      setGradingSubmission(null);
      setGradeMarks('');
      setGradeFeedback('');
      const assigns = await fetchWithAuth('/teacher/assignments', session.token);
      setTeacherAssignments(assigns.assignments || []);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Admin approve/reject correction
  const handleAdminCorrectionAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    if (!session) return;
    try {
      await fetchWithAuth(`/admin/correction-requests/${requestId}/action`, session.token, {
        method: 'POST',
        body: JSON.stringify({
          action,
          adminRemarks: action === 'APPROVED' ? 'Approved upon verification of marksheet' : 'Documentation insufficient',
        }),
      });

      showToast('success', `Correction request ${action} and database record updated.`);
      const [corrs, audits, studs, dash] = await Promise.all([
        fetchWithAuth('/admin/correction-requests', session.token),
        fetchWithAuth('/admin/audit-logs', session.token),
        fetchWithAuth('/admin/students', session.token),
        fetchWithAuth('/admin/dashboard', session.token),
      ]);
      setAdminCorrections(corrs.requests || []);
      setAdminAuditLogs(audits.logs || []);
      setAdminStudents(studs.students || []);
      setAdminDashboard(dash);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Admin toggle student status
  const handleToggleStudentStatus = async (studentId: string, currentStatus: string) => {
    if (!session) return;
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await fetchWithAuth(`/admin/students/${studentId}/status`, session.token, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast('success', `Student status changed to ${newStatus}`);
      const [studs, dash] = await Promise.all([
        fetchWithAuth('/admin/students', session.token),
        fetchWithAuth('/admin/dashboard', session.token),
      ]);
      setAdminStudents(studs.students || []);
      setAdminDashboard(dash);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const resetStudentForm = () => {
    setStudentForm({ name: '', email: '', rollNo: '', admissionNo: '', departmentId: '', classSectionId: '', semester: '1', fatherName: '', motherName: '', dob: '', bloodGroup: '', address: '' });
    setEditingStudent(null);
  };

  const openStudentCreate = () => {
    resetStudentForm();
    setShowStudentForm(true);
  };

  const openStudentEdit = (student: any) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.user.name,
      email: student.user.email,
      rollNo: student.rollNo,
      admissionNo: student.admissionNo,
      departmentId: student.departmentId,
      classSectionId: student.classSectionId,
      semester: String(student.semester),
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      dob: student.dob || '',
      bloodGroup: student.bloodGroup || '',
      address: student.address || '',
    });
    setShowStudentForm(true);
  };

  const handleStudentSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;
    try {
      const endpoint = editingStudent ? `/admin/students/${editingStudent.id}` : '/admin/students';
      const method = editingStudent ? 'PUT' : 'POST';
      const payload = editingStudent
        ? { name: studentForm.name, fatherName: studentForm.fatherName, motherName: studentForm.motherName, dob: studentForm.dob, bloodGroup: studentForm.bloodGroup, address: studentForm.address, semester: Number(studentForm.semester) }
        : { ...studentForm, semester: Number(studentForm.semester) };
      const result = await fetchWithAuth(endpoint, session.token, { method, body: JSON.stringify(payload) });
      setAdminStudents((current) => {
        if (!editingStudent) return [...current, result.student];
        return current.map((item) => item.id === editingStudent.id ? result.student : item);
      });
      const dash = await fetchWithAuth('/admin/dashboard', session.token);
      setAdminDashboard(dash);
      setShowStudentForm(false);
      resetStudentForm();
      showToast('success', editingStudent ? 'Student updated and synchronized.' : 'Student created and synchronized.');
    } catch (err: any) {
      showToast('error', err.message || 'Unable to save student');
    }
  };

  const handleDeleteStudent = async (student: any) => {
    if (!session || !window.confirm(`Delete ${student.user.name}'s student account? This cannot be undone.`)) return;
    try {
      await fetchWithAuth(`/admin/students/${student.id}`, session.token, { method: 'DELETE' });
      setAdminStudents((current) => current.filter((item) => item.id !== student.id));
      const dash = await fetchWithAuth('/admin/dashboard', session.token);
      setAdminDashboard(dash);
      showToast('success', 'Student account deleted and dashboard synchronized.');
    } catch (err: any) {
      showToast('error', err.message || 'Unable to delete student');
    }
  };

  // Loading spinner during initial session restore
  if (initialChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <h2 className="text-lg font-semibold tracking-wide">CGC Landran Student Portal</h2>
        <p className="text-slate-400 text-xs mt-1">Initializing institutional modules...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: AUTHENTICATION / LOGIN SECTION (SEPARATE STUDENT & TEACHER PORTALS)
  // Shown when not logged in (no direct access to ERP!)
  // =========================================================================
  if (!session) {
    return (
      <div className="min-h-screen bg-[#edf8fc] text-slate-800 flex flex-col justify-between">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 transition-all ${
              notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* TOP BAR */}
        <header className="border-b border-sky-100 bg-white sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-700 flex items-center justify-center text-white font-black text-xs shadow-md">
                CGC
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-2">
                  <span>CGC Landran</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    Student ERP
                  </span>
                </div>
                <div className="text-xs text-slate-500">Chandigarh Group of Colleges • Landran</div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-600 font-medium">Official College Portal</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Academic Session 2026–27</span>
            </div>
          </div>
        </header>

        {/* MAIN LOGIN SECTION CONTAINER */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Chandigarh Group of Colleges • Landran</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Sign in to your college portal</h1>
            <p className="text-slate-500 text-sm mt-2">Academic services for students, faculty and ERP administration.</p>
          </div>

          {/* DEDICATED ROLE SELECTOR TABS */}
          <div className="max-w-xl mx-auto w-full mb-8">
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-white border border-sky-100 rounded-2xl shadow-sm">
              {/* Student Portal Tab */}
              <button
                onClick={() => {
                  setLoginRoleTab('STUDENT');
                  setIdentifier('');
                  setPassword('');
                  setLoginError('');
                }}
                className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
                  loginRoleTab === 'STUDENT'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                    : 'text-slate-500 hover:text-sky-700 hover:bg-sky-50'
                }`}
              >
                <GraduationCap className="w-5 h-5 shrink-0" />
                <span>Student Portal</span>
              </button>

              {/* Faculty / Teacher Portal Tab */}
              <button
                onClick={() => {
                  setLoginRoleTab('TEACHER');
                  setIdentifier('');
                  setPassword('');
                  setLoginError('');
                }}
                className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
                  loginRoleTab === 'TEACHER'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400'
                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                <span>Faculty Portal</span>
              </button>

              {/* Admin Portal Tab */}
              <button
                onClick={() => {
                  setLoginRoleTab('ADMIN');
                  setIdentifier('');
                  setPassword('');
                  setLoginError('');
                }}
                className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
                  loginRoleTab === 'ADMIN'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400'
                    : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Shield className="w-5 h-5 shrink-0" />
                <span>ERP Admin</span>
              </button>
            </div>
          </div>

          {/* LOGIN CARD & FORM */}
          <div className="max-w-xl mx-auto w-full">
            <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
              {/* Top Accent Gradient based on selected portal */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  loginRoleTab === 'STUDENT'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : loginRoleTab === 'TEACHER'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
              />

              {/* Role Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                      loginRoleTab === 'STUDENT'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                        : loginRoleTab === 'TEACHER'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    }`}
                  >
                    {loginRoleTab === 'STUDENT'
                      ? 'Student Academic Access'
                      : loginRoleTab === 'TEACHER'
                      ? 'Faculty & Teacher Workspace'
                      : 'ERP Governance & Administration'}
                  </span>

                  <span className="text-xs text-slate-500">Secure sign in</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                  {loginRoleTab === 'STUDENT' && 'Student Login'}
                  {loginRoleTab === 'TEACHER' && 'Faculty / Teacher Login'}
                  {loginRoleTab === 'ADMIN' && 'ERP Administrator Login'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {loginRoleTab === 'STUDENT' &&
                    'View attendance, class timings, notes, timetable, assignments, results, and record corrections.'}
                  {loginRoleTab === 'TEACHER' &&
                    'Mark student attendance registers, upload study notes & PDFs, and publish assignments.'}
                  {loginRoleTab === 'ADMIN' &&
                    'Review profile correction requests, audit logs, and college directory control.'}
                </p>
              </div>

              {/* Error Alert */}
              {loginError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Authentication Notice: </span>
                    {loginError}
                  </div>
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {loginRoleTab === 'STUDENT'
                      ? 'Student Roll Number or College Email'
                      : loginRoleTab === 'TEACHER'
                      ? 'Employee ID or Faculty Email'
                      : 'Administrator Email'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      {loginRoleTab === 'STUDENT' && <GraduationCap className="w-4 h-4" />}
                      {loginRoleTab === 'TEACHER' && <BookOpen className="w-4 h-4" />}
                      {loginRoleTab === 'ADMIN' && <Shield className="w-4 h-4" />}
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        loginRoleTab === 'STUDENT'
                          ? 'e.g. 24CSE1023 or 24cse1023@college.edu'
                          : loginRoleTab === 'TEACHER'
                          ? 'e.g. FAC-CSE-101 or prof.sharma@college.edu'
                          : 'e.g. erpadmin1@college.edu'
                      }
                      className="w-full bg-slate-50 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <span className="text-[11px] text-slate-500">Zero plaintext storage</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-semibold text-sky-900">Captcha</label>
                    <span className="text-[11px] text-sky-700">One active login per student</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-bold text-sky-900">{challenge.question || 'Loading challenge...'}</span>
                    <input
                      inputMode="numeric"
                      required
                      value={challengeAnswer}
                      onChange={(e) => setChallengeAnswer(e.target.value)}
                      placeholder="Answer"
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500"
                    />
                    <button type="button" onClick={() => getLoginChallenge().then(setChallenge)} className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-600 hover:bg-sky-50" aria-label="New challenge">↻</button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                    loginRoleTab === 'STUDENT'
                      ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                      : loginRoleTab === 'TEACHER'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  } ${isSubmittingLogin ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmittingLogin ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating with ERP...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Enter {loginRoleTab === 'STUDENT' ? 'Student' : loginRoleTab === 'TEACHER' ? 'Faculty' : 'Admin'} Portal
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* QUICK DEMO CREDENTIAL FILLERS */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>One-Click Test Accounts:</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Instant login for evaluation</span>
                </div>

                {/* Student Demo Accounts */}
                {loginRoleTab === 'STUDENT' && (
                  <div className="space-y-2">
                    {DEMO_STUDENTS.map((demo) => (
                      <button
                        key={demo.rollNo}
                        type="button"
                        onClick={() => {
                          setIdentifier(demo.rollNo);
                          setPassword(demo.password);
                          handleLogin(demo.rollNo, demo.password);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/40 transition flex items-center justify-between group text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white group-hover:text-blue-300 flex items-center gap-2">
                            <span>{demo.name}</span>
                            <span className="font-mono text-[11px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                              {demo.rollNo}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{demo.details}</div>
                        </div>
                        <span className="px-2 py-1 rounded bg-blue-600/30 text-blue-300 font-bold text-[10px] group-hover:bg-blue-600 group-hover:text-white transition">
                          Sign In ➔
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Teacher Demo Accounts */}
                {loginRoleTab === 'TEACHER' && (
                  <div className="space-y-2">
                    {DEMO_TEACHERS.map((demo) => (
                      <button
                        key={demo.employeeId}
                        type="button"
                        onClick={() => {
                          setIdentifier(demo.email);
                          setPassword(demo.password);
                          handleLogin(demo.email, demo.password);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-emerald-900/30 border border-slate-800 hover:border-emerald-500/40 transition flex items-center justify-between group text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white group-hover:text-emerald-300 flex items-center gap-2">
                            <span>{demo.name}</span>
                            <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {demo.employeeId}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{demo.details}</div>
                        </div>
                        <span className="px-2 py-1 rounded bg-emerald-600/30 text-emerald-300 font-bold text-[10px] group-hover:bg-emerald-600 group-hover:text-white transition">
                          Sign In ➔
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Admin Demo Accounts */}
                {loginRoleTab === 'ADMIN' && (
                  <div className="space-y-2">
                    {DEMO_ADMINS.map((demo) => (
                      <button
                        key={demo.email}
                        type="button"
                        onClick={() => {
                          setIdentifier(demo.email);
                          setPassword(demo.password);
                          handleLogin(demo.email, demo.password);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-amber-900/30 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between group text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white group-hover:text-amber-300 flex items-center gap-2">
                            <span>{demo.name}</span>
                            <span className="text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              {demo.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{demo.details}</div>
                        </div>
                        <span className="px-2 py-1 rounded bg-amber-600/30 text-amber-300 font-bold text-[10px] group-hover:bg-amber-600 group-hover:text-white transition">
                          Sign In ➔
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Protected by Role-Based Access Control (RBAC) & Immutable Session Audit Logging</span>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4">
            CGC Landran • Student Academic Portal • Secure campus services
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGGED-IN ERP PORTAL (STUDENT / TEACHER / ADMIN WORKSPACE)
  // Reached only after authenticating through the designated login section!
  // =========================================================================
  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'theme-dark' : 'bg-slate-50 text-slate-800'}`}>
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-white font-medium flex items-center gap-3 transition-all ${
            notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP INSTITUTIONAL NAVIGATION & USER PROFILE HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              CGC
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>CGC Landran</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    session.user.role === 'STUDENT'
                      ? 'bg-blue-100 text-blue-800'
                      : session.user.role === 'TEACHER'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {session.user.role === 'STUDENT'
                    ? 'Student Portal'
                    : session.user.role === 'TEACHER'
                    ? 'Faculty Portal'
                    : 'Admin Console'}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">Chandigarh Group of Colleges • Academic Portal</div>
            </div>
          </div>

          {/* User Profile & Logout Action */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-900">{session.user.name}</div>
              <div className="text-xs text-slate-500 font-mono">
                {session.user.role} • {session.user.email}
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center border border-blue-200">
              {session.user.name.charAt(0)}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <button
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-sky-50 text-slate-600"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Prominent Log Out Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-rose-400 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
              title="Sign out of current account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* PORTAL CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm">Synchronizing data with ERP Modular REST API...</p>
          </div>
        ) : (
          <div>
            {session.user.role !== 'STUDENT' && (
              <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="font-medium text-slate-800">Placement Scheduled</h2>
                  <button
                    type="button"
                    aria-label="Refresh placement schedule"
                    onClick={() => loadPersonaData(session)}
                    className="rounded-lg border border-slate-200 p-2 text-indigo-500 transition hover:bg-indigo-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-x-auto px-4 py-5">
                  <table className="min-w-[620px] w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-700">
                        {['Company Name', 'Scheduled Date', 'Salary/Stipend', 'Eligibility', 'Degree & Branch'].map((heading) => (
                          <th key={heading} className="border-b-2 border-indigo-500 px-2 pb-2 font-semibold whitespace-nowrap">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {academicSchedule.placementScheduled.map((drive: any) => (
                        <tr key={drive.id} className="border-b border-slate-100 text-slate-600">
                          <td className="px-2 py-3 font-medium">{drive.companyName}</td>
                          <td className="px-2 py-3 whitespace-nowrap">{drive.scheduledDate}</td>
                          <td className="px-2 py-3 whitespace-nowrap">{drive.salaryStipend}</td>
                          <td className="px-2 py-3">{drive.eligibility}</td>
                          <td className="px-2 py-3">{drive.degreeBranch}</td>
                        </tr>
                      ))}
                      {!academicSchedule.placementScheduled.length && (
                        <tr><td colSpan={5} className="px-2 py-8 text-center text-slate-400">No placement drives scheduled.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ========================================================================= */}
            {/* PERSONA 1: STUDENT PORTAL (ATTENDANCE, BUNK PREDICTOR, NOTES, ASSIGNMENTS) */}
            {/* ========================================================================= */}
            {session.user.role === 'STUDENT' && (
              <div className="space-y-6">
                {/* Student Info Bar */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold tracking-wide uppercase border border-blue-400/30">
                      Student Academic Portal
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">{studentDashboard?.student?.name}</h1>
                    <p className="text-slate-300 text-sm mt-0.5">
                      Roll: <span className="font-mono text-white font-semibold">{studentDashboard?.student?.rollNo}</span> • Admission:{' '}
                      <span className="font-mono text-white">{studentDashboard?.student?.admissionNo}</span> • Class:{' '}
                      <span className="font-semibold text-blue-300">{studentDashboard?.student?.classSection} (Sem 4)</span>
                    </p>
                  </div>

                  {/* Quick Attendance Counter Badge */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-black text-white">{studentAttendance?.overall?.percentage}%</div>
                      <div className="text-xs text-blue-200 font-medium">Overall Attendance</div>
                    </div>
                    <div className="h-10 w-px bg-white/20" />
                    <div className="text-xs text-slate-300">
                      <div>
                        Present: <b className="text-white">{studentAttendance?.overall?.present}</b>
                      </div>
                      <div>
                        Total: <b className="text-white">{studentAttendance?.overall?.total} classes</b>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Navigation Tabs */}
                <div className="flex border-b border-slate-200 space-x-1 sm:space-x-4 overflow-x-auto pb-px">
                  {[
                    { id: 'overview', label: 'Dashboard', icon: TrendingUp },
                    { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
                    { id: 'notes', label: 'Notes', icon: FileText },
                    { id: 'timetable', label: 'Time Table', icon: Calendar },
                    { id: 'assignments', label: 'Assignments', icon: BookOpen },
                    { id: 'fees', label: 'Fees', icon: Award },
                    { id: 'od', label: 'OD / Leave', icon: UploadCloud },
                    { id: 'profile', label: 'Profile', icon: Lock },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-3 px-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB CONTENT: STUDENT OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Attendance advisory card */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-emerald-900 text-base">Smart Attendance Advisory</h3>
                          <p className="text-emerald-800 text-sm mt-1">{studentAttendance?.overall?.prediction}</p>
                          <p className="text-xs text-emerald-600 mt-2">
                            College regulatory minimum attendance rule: <b>75.0%</b>.
                          </p>
                        </div>
                      </div>

                      {/* Academic calendar cards */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <h2 className="font-medium text-slate-800">Exam Time Table</h2>
                            <button
                              type="button"
                              aria-label="Refresh exam timetable"
                              onClick={() => session && loadPersonaData(session)}
                              className="rounded-lg border border-slate-200 p-2 text-indigo-500 transition hover:bg-indigo-50"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="overflow-x-auto px-4 py-5">
                            <table className="min-w-[620px] w-full text-left text-xs">
                              <thead>
                                <tr className="text-slate-700">
                                  {['Exam Date', 'Slot', 'CCode', 'Course', 'Semester', 'Regular / Backlog'].map((heading) => (
                                    <th key={heading} className="border-b-2 border-indigo-500 px-2 pb-2 font-semibold whitespace-nowrap">
                                      {heading}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(studentDashboard?.examTimetable || []).map((exam: any) => (
                                  <tr key={exam.id} className="border-b border-slate-100 text-slate-600">
                                    <td className="px-2 py-3 whitespace-nowrap">{exam.examDate}</td>
                                    <td className="px-2 py-3 whitespace-nowrap">{exam.slot || '—'}</td>
                                    <td className="px-2 py-3 font-medium">{exam.code || '—'}</td>
                                    <td className="px-2 py-3">{exam.course || '—'}</td>
                                    <td className="px-2 py-3">{exam.semester}</td>
                                    <td className="px-2 py-3 whitespace-nowrap">{exam.regularBacklog}</td>
                                  </tr>
                                ))}
                                {!studentDashboard?.examTimetable?.length && (
                                  <tr><td colSpan={6} className="px-2 py-8 text-center text-slate-400">No examinations scheduled.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </section>

                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <h2 className="font-medium text-slate-800">Placement Scheduled</h2>
                            <button
                              type="button"
                              aria-label="Refresh placement schedule"
                              onClick={() => session && loadPersonaData(session)}
                              className="rounded-lg border border-slate-200 p-2 text-indigo-500 transition hover:bg-indigo-50"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="overflow-x-auto px-4 py-5">
                            <table className="min-w-[620px] w-full text-left text-xs">
                              <thead>
                                <tr className="text-slate-700">
                                  {['Company Name', 'Scheduled Date', 'Salary/Stipend', 'Eligibility', 'Degree & Branch'].map((heading) => (
                                    <th key={heading} className="border-b-2 border-indigo-500 px-2 pb-2 font-semibold whitespace-nowrap">
                                      {heading}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(studentDashboard?.placementScheduled || []).map((drive: any) => (
                                  <tr key={drive.id} className="border-b border-slate-100 text-slate-600">
                                    <td className="px-2 py-3 font-medium">{drive.companyName}</td>
                                    <td className="px-2 py-3 whitespace-nowrap">{drive.scheduledDate}</td>
                                    <td className="px-2 py-3 whitespace-nowrap">{drive.salaryStipend}</td>
                                    <td className="px-2 py-3">{drive.eligibility}</td>
                                    <td className="px-2 py-3">{drive.degreeBranch}</td>
                                  </tr>
                                ))}
                                {!studentDashboard?.placementScheduled?.length && (
                                  <tr><td colSpan={5} className="px-2 py-8 text-center text-slate-400">No placement drives scheduled.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      </div>

                      {/* Today's Classes */}
                      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <span>Classes for Today</span>
                          </h2>
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                            Room Schedule
                          </span>
                        </div>

                        {studentDashboard?.todayClasses?.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-sm">No lectures scheduled today.</div>
                        ) : (
                          <div className="space-y-3">
                            {studentDashboard?.todayClasses?.map((slot: any) => (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="px-3 py-1.5 rounded-md bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 text-sm">{slot.subject.name}</div>
                                    <div className="text-xs text-slate-500">
                                      Prof. {slot.teacher.user.name} • Room <span className="font-medium text-slate-700">{slot.room}</span>
                                    </div>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                                  Upcoming
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Academic Holidays */}
                      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          <span>Upcoming Holidays</span>
                        </h2>
                        {studentDashboard?.academicHolidays?.length ? (
                          <div className="space-y-2">
                            {studentDashboard.academicHolidays.slice(0, 5).map((holiday: any) => (
                              <div key={holiday.id} className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                                <span className="text-sm font-semibold text-slate-800">{holiday.name}</span>
                                <span className="font-mono text-xs text-indigo-700">{holiday.date}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-slate-500">No holidays have been published.</p>}
                      </div>

                      {/* Recent Lecture Notes & PDFs */}
                      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <span>Recent Lecture Notes & Study Material</span>
                          </h2>
                          <button onClick={() => setActiveTab('notes')} className="text-xs text-blue-600 font-semibold hover:underline">
                            View All Notes
                          </button>
                        </div>

                        <div className="space-y-3">
                          {studentNotes.slice(0, 3).map((note) => (
                            <div
                              key={note.id}
                              className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between hover:border-slate-300 transition"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 text-sm">{note.title}</div>
                                  <div className="text-xs text-slate-500">
                                    {note.unit} • {note.subject.name} • <span className="font-mono text-slate-600">{note.fileSize}</span>
                                  </div>
                                </div>
                              </div>
                              <a
                                href={note.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold transition"
                              >
                                Download PDF
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Col: Notices & Results Preview */}
                    <div className="space-y-6">
                      {/* Active Notices */}
                      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          <span>Campus Notices</span>
                        </h2>

                        <div className="space-y-4">
                          {studentDashboard?.notices?.map((notice: any) => (
                            <div key={notice.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                    notice.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {notice.category}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(notice.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">{notice.title}</h4>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notice.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mid-term Results Snapshot */}
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-indigo-950 text-sm">Mid-Term Academic Standing</h3>
                          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-xs">
                            SGPA {studentResults?.summary?.gpa || '8.76'}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          {studentResults?.results?.slice(0, 4).map((r: any) => (
                            <div key={r.id} className="flex justify-between items-center text-slate-700">
                              <span>{r.subject.name}</span>
                              <span className="font-semibold text-slate-900">
                                {r.marksObtained}/100 ({r.grade})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: ATTENDANCE & BUNK PREDICTOR */}
                {activeTab === 'attendance' && (
                  <div className="space-y-6">
                    {/* Predictor Engine Banner */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            Attendance Planning & Recovery Guidance
                          </div>
                          <h2 className="text-xl font-bold text-slate-900">
                            Overall Attendance: {studentAttendance?.overall?.percentage}%
                          </h2>
                          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                            {studentAttendance?.overall?.prediction}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <AttendanceRing percentage={studentAttendance?.overall?.percentage || 0} size={112} />
                        </div>
                      </div>
                    </div>

                    {/* Subject-wise Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {studentAttendance?.subjects?.map((sub: any) => {
                        const isSafe = sub.percentage >= 75;
                        return (
                          <div
                            key={sub.subjectId}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedAttendanceSubject(sub)}
                            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedAttendanceSubject(sub); }}
                            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between cursor-pointer transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-slate-500">{sub.code}</span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                    {sub.hasLabSlot || sub.courseType === 'LAB' || sub.courseType === 'PRACTICAL' ? <FlaskConical className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                                    {sub.hasLabSlot ? 'Theory + Lab' : sub.courseType === 'LAB' ? 'Lab' : sub.courseType === 'PRACTICAL' ? 'Practical' : 'Theory'}
                                  </span>
                                </div>
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    isSafe ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  {sub.percentage}%
                                </span>
                              </div>
                              <h3 className="font-bold text-slate-900 text-base">{sub.name}</h3>
                              <p className="text-xs text-slate-500 mt-1">
                                Present: <b className="text-emerald-700">{sub.present}</b> · Absent: <b className="text-rose-700">{sub.absent}</b> · {sub.total} total classes
                              </p>
                              {sub.classTimings?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {sub.classTimings.map((slot: any, index: number) => (
                                    <span key={`${slot.day}-${slot.time}-${index}`} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                                      {slot.day.slice(0, 3)} {slot.time}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Progress bar */}
                              <div className="w-full bg-slate-100 rounded-full h-2.5 my-3 overflow-hidden">
                                <div
                                  className={`h-2.5 rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                                />
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className={`text-xs font-medium ${isSafe ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {sub.prediction}
                              </p>
                              <p className="mt-2 text-[11px] font-semibold text-blue-600">Click to view dated attendance details →</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Daily Attendance History */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-600" />
                        <span>Daily Attendance Records</span>
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4">Date</th>
                              <th className="py-2.5 px-4">Subject</th>
                              <th className="py-2.5 px-4">Class timing</th>
                              <th className="py-2.5 px-4">Faculty</th>
                              <th className="py-2.5 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-xs">
                            {studentAttendance?.history?.slice(0, 15).map((rec: any) => (
                              <tr key={rec.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4 font-semibold text-slate-800">{rec.date}</td>
                                <td className="py-2.5 px-4 font-sans text-slate-800">{rec.subject.name}</td>
                                <td className="py-2.5 px-4 font-sans text-slate-600">{rec.classTimings?.join(' · ') || 'See timetable'}</td>
                                <td className="py-2.5 px-4 font-sans text-slate-600">{rec.teacher.user.name}</td>
                                <td className="py-2.5 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {rec.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: STUDY NOTES & PDFS */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-900">Course Materials & Lecture Notes</h2>
                      <span className="text-xs text-slate-500">Stored on S3 / R2 storage</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                                {note.unit}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">{note.fileSize}</span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base">{note.title}</h3>
                            <p className="text-xs text-slate-600 mt-2 line-clamp-2">{note.description}</p>
                            <p className="text-xs text-slate-500 mt-3">
                              Subject: <b className="text-slate-800">{note.subject.name}</b> • Prof.{' '}
                              {note.teacher.user.name}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-mono">{note.fileName}</span>
                            <a
                              href={note.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View / Download PDF</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: TIMETABLE */}
                {activeTab === 'timetable' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Weekly Lecture Timetable (Section CSE-4A)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => {
                        const slots = studentTimetable.filter((s: any) => s.dayOfWeek === day);
                        return (
                          <div key={day} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3 text-center border-b border-slate-200 pb-2">
                              {day}
                            </h3>
                            <div className="space-y-2.5">
                              {slots.map((slot: any) => (
                                <div key={slot.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs text-xs">
                                  <div className="font-mono text-[11px] font-bold text-blue-700">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                  <div className="font-bold text-slate-900 mt-1">{slot.subject.name}</div>
                                  <div className="text-slate-500 text-[11px] mt-0.5">
                                    {slot.teacher.user.name} • <b className="text-slate-700">{slot.room}</b>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: ASSIGNMENTS & STUDENT SUBMISSIONS */}
                {activeTab === 'assignments' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Course Assignments & Evaluations</h2>
                          <p className="text-xs text-slate-500">Submit homework files and view faculty grades & feedback</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {studentAssignments.map((assign: any) => {
                          const sub = assign.submissions?.[0];
                          return (
                            <div
                              key={assign.id}
                              className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                                    {assign.subject.code}
                                  </span>
                                  <span className="text-xs text-slate-400">Due: {assign.dueDate}</span>
                                  <span className="text-xs font-medium text-slate-500">Max Marks: {assign.maxMarks}</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-base">{assign.title}</h3>
                                <p className="text-xs text-slate-600">{assign.description}</p>
                              </div>

                              <div className="shrink-0 flex items-center gap-3">
                                {sub ? (
                                  <div className="text-right">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        sub.status === 'GRADED'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {sub.status === 'GRADED' ? `Graded: ${sub.marks} / ${assign.maxMarks}` : 'Submitted'}
                                    </span>
                                    {sub.feedback && (
                                      <div className="text-xs text-slate-600 mt-1 italic max-w-xs bg-slate-50 p-2 rounded border border-slate-200">
                                        <b>Faculty Feedback:</b> "{sub.feedback}"
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSubmittingAssignment(assign);
                                      setAssignmentFileName(`${assign.title.replace(/\s+/g, '_')}_solution.pdf`);
                                      setAssignmentFileUrl(`https://cdn.college-erp.edu/submissions/24cse1023_${assign.id}.pdf`);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Submit Work</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: PROFILE & RECORD CORRECTION */}
                {activeTab === 'fees' && (
                  <div className="space-y-5">
                    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-xl p-6">
                      <h2 className="text-xl font-bold text-slate-900">Online Fee Payment</h2>
                      <p className="text-sm text-slate-600 mt-1">Pay your college fees securely online and download the official receipt immediately.</p>
                    </div>
                    <div className="space-y-4">{studentFees.map((fee) => {
                      const payment = fee.payments?.[0];
                      return <div key={fee.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-500">{fee.invoiceNumber}</span><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{fee.status}</span></div><h3 className="font-bold text-slate-900 mt-2">{fee.description}</h3><p className="text-sm text-slate-500">{fee.term} • Due {fee.dueDate}</p></div><div className="flex items-center gap-3"><div className="text-xl font-bold text-slate-900">₹{Number(fee.amount).toLocaleString('en-IN')}</div>{fee.status === 'PAID' ? <button onClick={() => printFeeReceipt(fee.id)} className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800">View / Print Receipt</button> : <button onClick={() => handleFeePayment(fee.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Pay Online</button>}</div></div>;
                    })}</div>
                    <p className="text-xs text-slate-500">Payment receipts are stored against your ERP fee record with a transaction ID.</p>
                  </div>
                )}

                {activeTab === 'od' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-sky-100 p-6 shadow-sm">
                      <h2 className="text-xl font-bold text-slate-900">On Duty (OD) Request</h2>
                      <p className="text-sm text-slate-500 mt-1">Upload supporting proof for an approved academic, sports, placement or official college activity.</p>
                      <form onSubmit={handleSubmitOD} className="mt-5 space-y-4">
                        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Date of absence</label><input type="date" required value={odDate} onChange={(e) => setOdDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label><textarea required value={odReason} onChange={(e) => setOdReason(e.target.value)} rows={3} placeholder="e.g. University sports event" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Supporting PDF</label><input type="file" accept="application/pdf,.pdf" required onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setOdDocumentName(file.name); const reader = new FileReader(); reader.onload = () => setOdDocument(String(reader.result || '')); reader.readAsDataURL(file); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50" />{odDocumentName && <p className="text-xs text-emerald-700 mt-1">Attached: {odDocumentName}</p>}</div>
                        <button type="submit" className="w-full rounded-lg bg-sky-700 hover:bg-sky-800 text-white py-2.5 text-sm font-semibold">Submit OD for Approval</button>
                      </form>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-4">My OD Requests</h3>
                      <div className="space-y-3">{studentODRequests.length === 0 ? <p className="text-sm text-slate-500">No OD requests submitted.</p> : studentODRequests.map((od) => <div key={od.id} className="rounded-lg border border-slate-200 p-3"><div className="flex justify-between gap-3"><span className="font-semibold text-sm text-slate-900">{od.date}</span><span className={`text-[11px] font-bold rounded-full px-2 py-1 ${od.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : od.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{od.status}</span></div><p className="text-xs text-slate-600 mt-1">{od.reason}</p></div>)}</div>
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">Student Profile & Official Record</h2>
                          <p className="text-xs text-slate-500 mt-1">
                            Core demographics are protected by ERP Governance. Changes require Administrative Verification.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowCorrectionModal(true)}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-2 self-start"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Request Record Correction</span>
                        </button>
                      </div>

                      {/* Read-only Demographics Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-500">Student Full Name</div>
                          <div className="font-semibold text-slate-900 text-sm mt-0.5">{studentProfile?.profile?.name}</div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-500">Roll Number</div>
                          <div className="font-mono font-semibold text-slate-900 text-sm mt-0.5">
                            {studentProfile?.profile?.rollNo}
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-500">Admission ID</div>
                          <div className="font-mono font-semibold text-slate-900 text-sm mt-0.5">
                            {studentProfile?.profile?.admissionNo}
                          </div>
                        </div>

                        <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-200">
                          <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Father's Name (Locked)</span>
                          </div>
                          <div className="font-semibold text-slate-900 text-sm mt-1">
                            {studentProfile?.profile?.fatherName}
                          </div>
                        </div>

                        <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-200">
                          <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Mother's Name (Locked)</span>
                          </div>
                          <div className="font-semibold text-slate-900 text-sm mt-1">
                            {studentProfile?.profile?.motherName}
                          </div>
                        </div>

                        <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-200">
                          <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Date of Birth (Locked)</span>
                          </div>
                          <div className="font-mono font-semibold text-slate-900 text-sm mt-1">
                            {studentProfile?.profile?.dob}
                          </div>
                        </div>
                      </div>

                      {/* Active or Past Correction Requests */}
                      <div className="mt-8 pt-6 border-t border-slate-200">
                        <h3 className="font-bold text-slate-900 text-sm mb-3">Correction Request Audit Status</h3>
                        <div className="space-y-3">
                          {studentProfile?.pendingCorrections?.map((req: any) => (
                            <div
                              key={req.id}
                              className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">
                                  Field: <span className="text-blue-700">{req.fieldName}</span>
                                </div>
                                <div className="text-slate-600 mt-1">
                                  Old: <span className="line-through text-rose-600 font-medium">{req.oldValue}</span> ➔ New:{' '}
                                  <span className="font-bold text-emerald-700">{req.requestedValue}</span>
                                </div>
                                <div className="text-slate-500 mt-0.5">Reason: {req.reason}</div>
                              </div>

                              <div className="shrink-0">
                                <span
                                  className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] ${
                                    req.status === 'PENDING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : req.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* PERSONA 2: TEACHER / FACULTY PORTAL (ATTENDANCE REGISTER, NOTES, GRADING) */}
            {/* ========================================================================= */}
            {session.user.role === 'TEACHER' && (
              <div className="space-y-6">
                {/* Faculty Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold tracking-wide uppercase border border-emerald-400/30">
                      Faculty Academic Workspace
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">{teacherDashboard?.teacher?.name}</h1>
                    <p className="text-slate-300 text-sm mt-0.5">
                      Employee ID: <span className="font-mono text-white font-semibold">{teacherDashboard?.teacher?.employeeId}</span> •{' '}
                      {teacherDashboard?.teacher?.designation} • Cabin: {teacherDashboard?.teacher?.cabinNo}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">{teacherDashboard?.stats?.totalStudents}</div>
                      <div className="text-[11px] text-emerald-200">Assigned Students</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">{teacherDashboard?.stats?.notesCount}</div>
                      <div className="text-[11px] text-emerald-200">Study Notes</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">{teacherAssignments?.length || 0}</div>
                      <div className="text-[11px] text-emerald-200">Assignments</div>
                    </div>
                  </div>
                </div>

                {/* Teacher Navigation Tabs */}
                <div className="flex border-b border-slate-200 space-x-1 sm:space-x-4 overflow-x-auto pb-px">
                  {[
                    { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
                    { id: 'notes', label: 'Notes', icon: UploadCloud },
                    { id: 'assignments', label: 'Assignments', icon: Award },
                    { id: 'schedule', label: 'Class Schedule', icon: Calendar },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-lg'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TEACHER TAB 1: ATTENDANCE MARKING */}
                {activeTab === 'attendance' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Attendance Register</h2>
                        <p className="text-xs text-slate-500">
                          Attendance can be edited only for your scheduled class today. Use OD approval for exceptions.
                        </p>
                      </div>

                      {/* Selectors */}
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={selectedSubject}
                          onChange={(e) => {
                            setSelectedSubject(e.target.value);
                            loadClassStudents(session.token, selectedClassSection, e.target.value, attendanceDate);
                          }}
                          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
                        >
                          {teacherDashboard?.myClasses?.map((c: any) => (
                            <option key={c.subjectId} value={c.subjectId}>
                              {c.subjectName} ({c.sectionName})
                            </option>
                          ))}
                        </select>

                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          max={new Date().toISOString().split('T')[0]}
                          value={attendanceDate}
                          onChange={(e) => {
                            setAttendanceDate(e.target.value);
                            loadClassStudents(session.token, selectedClassSection, selectedSubject, e.target.value);
                          }}
                          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
                        />

                        <button
                          onClick={handleSaveAttendance}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          <span>Save & Sync DB</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick batch toggle buttons */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Student Roll Register ({teacherStudents.length} Students)</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const updated: Record<string, string> = {};
                            teacherStudents.forEach((s) => (updated[s.id] = 'PRESENT'));
                            setTeacherAttendanceMap(updated);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md"
                        >
                          Mark All Present
                        </button>
                        <button
                          onClick={() => {
                            const updated: Record<string, string> = {};
                            teacherStudents.forEach((s) => (updated[s.id] = 'ABSENT'));
                            setTeacherAttendanceMap(updated);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md"
                        >
                          Mark All Absent
                        </button>
                      </div>
                    </div>

                    {/* Student List Grid */}
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {teacherStudents.map((st) => {
                        const status = teacherAttendanceMap[st.id] || 'PRESENT';
                        return (
                          <div key={st.id} className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50">
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">{st.name}</div>
                              <div className="text-xs text-slate-500 font-mono">Roll No: {st.rollNo}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              {['PRESENT', 'ABSENT', 'LATE'].map((stOpt) => (
                                <button
                                  key={stOpt}
                                  onClick={() => setTeacherAttendanceMap((prev) => ({ ...prev, [st.id]: stOpt }))}
                                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                    status === stOpt
                                      ? stOpt === 'PRESENT'
                                        ? 'bg-emerald-600 text-white'
                                        : stOpt === 'ABSENT'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-amber-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {stOpt}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TEACHER TAB 2: UPLOAD NOTES */}
                {activeTab === 'notes' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Upload Lecture Material & PDFs</h2>
                        <p className="text-xs text-slate-500">Publishes notes instantly to student portal</p>
                      </div>
                      <button
                        onClick={() => setShowUploadNoteModal(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload New Note</span>
                      </button>
                    </div>

                    <div className="p-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      Click <b className="text-emerald-700">"Upload New Note"</b> to publish syllabus unit slides or notes
                      directly to enrolled students.
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900">Notes already uploaded</h3>
                          <p className="text-xs text-slate-500">Your published material across all assigned subjects.</p>
                        </div>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{teacherNotes.length} notes</span>
                      </div>
                      {teacherNotes.length === 0 ? <div className="rounded-lg border border-slate-200 p-5 text-center text-sm text-slate-500">No notes uploaded for your classes yet.</div> : <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Note</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3">Uploaded</th><th className="px-4 py-3">File</th></tr></thead><tbody className="divide-y divide-slate-100">{teacherNotes.map((note: any) => <tr key={note.id} className="hover:bg-slate-50"><td className="px-4 py-3"><div className="font-semibold text-slate-900">{note.title}</div><div className="text-xs text-slate-500">{note.description || 'Lecture material'}</div></td><td className="px-4 py-3"><span className="rounded bg-blue-50 px-2 py-1 text-xs font-mono text-blue-700">{note.subject?.code}</span><div className="text-xs text-slate-600 mt-1">{note.subject?.name}</div></td><td className="px-4 py-3 text-xs text-slate-600">{note.unit}</td><td className="px-4 py-3 text-xs text-slate-500">{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : '—'}</td><td className="px-4 py-3"><a href={note.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-sky-700 underline">View / Download</a></td></tr>)}</tbody></table></div>}
                    </div>
                  </div>
                )}

                {/* TEACHER TAB 3: ASSIGNMENTS & GRADING */}
                {activeTab === 'assignments' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Coursework Assignments & Submissions</h2>
                        <p className="text-xs text-slate-500">Create assignments and evaluate student submissions</p>
                      </div>
                      <button
                        onClick={() => setShowCreateAssignmentModal(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Assignment</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {teacherAssignments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No assignments found.</div>
                      ) : (
                        teacherAssignments.map((assign: any) => (
                          <div key={assign.id} className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                    {assign.subject.code}
                                  </span>
                                  <span className="text-xs font-medium text-slate-500">Section: {assign.classSection.name}</span>
                                  <span className="text-xs text-slate-400">Due: {assign.dueDate}</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-base mt-1">{assign.title}</h3>
                                <p className="text-xs text-slate-600">{assign.description}</p>
                              </div>

                              <div className="text-right">
                                <span className="px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                                  Max Marks: {assign.maxMarks}
                                </span>
                              </div>
                            </div>

                            {/* Submissions List */}
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                                Student Submissions ({assign.submissions?.length || 0})
                              </h4>

                              {assign.submissions?.length === 0 ? (
                                <div className="text-xs text-slate-400 italic">No student submissions received yet.</div>
                              ) : (
                                <div className="space-y-2">
                                  {assign.submissions?.map((sub: any) => (
                                    <div
                                      key={sub.id}
                                      className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs border border-slate-200"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-900">
                                          {sub.student.user.name} ({sub.student.rollNo})
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                          File: <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">{sub.fileName}</a>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        {sub.status === 'GRADED' ? (
                                          <div className="text-right">
                                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                                              Score: {sub.marks} / {assign.maxMarks}
                                            </span>
                                            <button
                                              onClick={() => {
                                                setGradingSubmission({ submission: sub, assignment: assign });
                                                setGradeMarks(String(sub.marks));
                                                setGradeFeedback(sub.feedback || '');
                                              }}
                                              className="ml-2 text-xs text-emerald-700 underline font-semibold"
                                            >
                                              Edit
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setGradingSubmission({ submission: sub, assignment: assign });
                                              setGradeMarks('90');
                                              setGradeFeedback('Good effort. Code passes test cases.');
                                            }}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center gap-1 shadow-xs"
                                          >
                                            <Award className="w-3.5 h-3.5" />
                                            <span>Grade Submission</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TEACHER TAB 4: SCHEDULE */}
                {activeTab === 'schedule' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Teaching Schedule</h2>
                    <div className="space-y-3">
                      {teacherDashboard?.teachingSchedule?.map((slot: any) => (
                        <div key={slot.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <h3 className="font-bold text-slate-900 text-base mt-1">{slot.subject.name}</h3>
                            <p className="text-xs text-slate-500">
                              {slot.dayOfWeek} • Section: {slot.classSection.name} • Room: <b>{slot.room}</b>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* PERSONA 3: ERP ADMIN & SUPER ADMIN (PROFILE APPROVALS, AUDIT TRAIL)       */}
            {/* ========================================================================= */}
            {(session.user.role === 'ERP_ADMIN' || session.user.role === 'SUPER_ADMIN') && (
              <div className="space-y-6">
                {/* Admin Header Banner */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-xs font-semibold tracking-wide uppercase border border-amber-400/30">
                        {session.user.role} Administrative Operations
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">{session.user.name}</h1>
                    <p className="text-slate-300 text-sm mt-0.5">
                      Audit Tracking Active • Granular RBAC Enforced • Zero Plaintext Storage
                    </p>
                  </div>

                  {/* Summary KPI Badges */}
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">{adminDashboard?.stats?.totalStudents}</div>
                      <div className="text-[11px] text-slate-300">Students</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">{adminDashboard?.stats?.totalTeachers}</div>
                      <div className="text-[11px] text-slate-300">Faculty</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-amber-300">
                        {adminDashboard?.stats?.pendingCorrectionsCount}
                      </div>
                      <div className="text-[11px] text-amber-200">Pending Approvals</div>
                    </div>
                  </div>
                </div>

                {/* Admin Navigation Tabs */}
                <div className="flex border-b border-slate-200 space-x-1 sm:space-x-4 overflow-x-auto pb-px">
                  {[
                    { id: 'corrections', label: 'Approvals', icon: UserCheck },
                    { id: 'od', label: 'OD Approvals', icon: UploadCloud },
                    { id: 'audit', label: 'Audit Logs', icon: Shield },
                    { id: 'students', label: 'Students', icon: Users },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-lg'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.id === 'corrections' && adminCorrections.filter((c) => c.status === 'PENDING').length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white font-bold">
                            {adminCorrections.filter((c) => c.status === 'PENDING').length}
                          </span>
                        )}
                        {tab.id === 'od' && adminODRequests.filter((o) => o.status === 'PENDING').length > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-sky-600 text-white font-bold">{adminODRequests.filter((o) => o.status === 'PENDING').length}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* ADMIN TAB 1: SENSITIVE PROFILE CORRECTIONS */}
                {activeTab === 'corrections' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                      <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Sensitive Information Approval Queue</h2>
                        <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                          As specified in the architecture, students cannot directly edit official records (Father's Name,
                          DOB, Admission ID). Admins inspect the request and verify supporting documents before committing
                          modifications to the database with a full audit trail.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {adminCorrections.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-sm">No correction requests found.</div>
                        ) : (
                          adminCorrections.map((req) => (
                            <div
                              key={req.id}
                              className={`p-5 rounded-xl border transition-all ${
                                req.status === 'PENDING' ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900 text-base">{req.student.user.name}</span>
                                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                      {req.student.rollNo}
                                    </span>
                                    <span
                                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                        req.status === 'PENDING'
                                          ? 'bg-amber-100 text-amber-800'
                                          : req.status === 'APPROVED'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {req.status}
                                    </span>
                                  </div>

                                  <div className="mt-3 text-sm flex flex-wrap items-center gap-3">
                                    <span className="text-slate-500 font-medium">
                                      Field: <b>{req.fieldName}</b>
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-rose-700">
                                      Old Record: <b className="font-mono line-through">{req.oldValue}</b>
                                    </span>
                                    <span className="text-slate-400">➔</span>
                                    <span className="text-emerald-700">
                                      Requested New: <b className="font-mono">{req.requestedValue}</b>
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-600 mt-2 bg-slate-100/70 p-2.5 rounded-lg">
                                    <b>Student Stated Reason:</b> {req.reason}
                                  </div>
                                </div>

                                {req.status === 'PENDING' && (
                                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                                    <button
                                      onClick={() => handleAdminCorrectionAction(req.id, 'APPROVED')}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                                    >
                                      <Check className="w-4 h-4" />
                                      <span>Approve & Sync DB</span>
                                    </button>
                                    <button
                                      onClick={() => handleAdminCorrectionAction(req.id, 'REJECTED')}
                                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'od' && (
                  <div className="bg-white rounded-xl border border-sky-100 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">On Duty Approval Queue</h2>
                    <p className="text-sm text-slate-500 mt-1 mb-5">HOD / ERP Admin can verify the PDF and credit attendance for the approved date.</p>
                    <div className="space-y-3">{adminODRequests.length === 0 ? <p className="text-sm text-slate-500">No OD requests found.</p> : adminODRequests.map((od) => <div key={od.id} className="rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><b className="text-slate-900">{od.student.user.name}</b><span className="font-mono text-xs text-slate-500">{od.student.rollNo}</span><span className="text-xs font-bold text-slate-600">{od.date}</span></div><p className="text-sm text-slate-600 mt-1">{od.reason}</p><a href={od.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-700 underline">View supporting PDF</a></div>{od.status === 'PENDING' ? <div className="flex gap-2"><button onClick={() => handleODAction(od.id, 'APPROVED')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Approve & Credit</button><button onClick={() => handleODAction(od.id, 'REJECTED')} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Reject</button></div> : <span className="text-xs font-bold text-slate-500">{od.status}</span>}</div>)}</div>
                  </div>
                )}

                {/* ADMIN TAB 2: AUDIT LOGS */}
                {activeTab === 'audit' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Regulatory Immutable Audit Trail</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Every privileged operation, attendance batch, and student profile correction records WHO, WHAT, OLD,
                        NEW, WHEN, and IP address.
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase">
                          <tr>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Actor (WHO)</th>
                            <th className="py-3 px-4">Action (WHAT)</th>
                            <th className="py-3 px-4">Entity</th>
                            <th className="py-3 px-4">Audit Details (OLD ➔ NEW)</th>
                            <th className="py-3 px-4">Client IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {adminAuditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                                <div>{log.userName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{log.userRole}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[11px]">
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-sans text-slate-700">{log.entityType}</td>
                              <td className="py-3 px-4 font-sans text-xs max-w-xs truncate">
                                {log.newValue ? (
                                  <span className="text-slate-800">{log.newValue}</span>
                                ) : (
                                  <span className="text-slate-400">N/A</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADMIN TAB 3: STUDENT DIRECTORY */}
                {activeTab === 'students' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Student Directory</h2>
                        <p className="text-xs text-slate-500">Search and manage student accounts and enrollments</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search by Roll / Name..."
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                            className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-56"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={openStudentCreate}
                          className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
                        >
                          <Plus className="mr-1 inline h-4 w-4" /> Add Student
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {adminStudents
                        .filter(
                          (s) =>
                            s.user.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
                            s.rollNo.toLowerCase().includes(adminSearch.toLowerCase())
                        )
                        .map((st) => (
                          <div
                            key={st.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm">{st.user.name}</span>
                                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  {st.rollNo}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    st.user.status === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {st.user.status}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {st.department.name} • {st.classSection.name} • Father: <b>{st.fatherName}</b>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openStudentEdit(st)}
                                className="px-3 py-1 text-xs font-semibold rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleStudentStatus(st.id, st.user.status)}
                                className="px-3 py-1 text-xs font-semibold rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700"
                              >
                                {st.user.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(st)}
                                className="px-3 py-1 text-xs font-semibold rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {showStudentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
                <p className="mt-1 text-xs text-slate-500">Changes are saved to the ERP database and reflected in the dashboard immediately.</p>
              </div>
              <button type="button" onClick={() => { setShowStudentForm(false); resetStudentForm(); }} className="text-xl text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleStudentSave} className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              {[
                ['name', 'Full Name', true], ['email', 'College Email', !editingStudent], ['rollNo', 'Roll Number', !editingStudent], ['admissionNo', 'Admission Number', !editingStudent],
                ['fatherName', "Father's Name", true], ['motherName', "Mother's Name", true], ['dob', 'Date of Birth', true], ['bloodGroup', 'Blood Group', false],
              ].map(([key, label, required]) => (
                <label key={String(key)} className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>
                  <input
                    required={Boolean(required)}
                    type={key === 'dob' ? 'date' : key === 'email' ? 'email' : 'text'}
                    value={studentForm[key as keyof typeof studentForm]}
                    disabled={editingStudent && ['email', 'rollNo', 'admissionNo'].includes(String(key))}
                    onChange={(e) => setStudentForm((current) => ({ ...current, [String(key)]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              ))}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Department</span>
                <select
                  required
                  disabled={Boolean(editingStudent)}
                  value={studentForm.departmentId}
                  onChange={(e) => setStudentForm((current) => ({ ...current, departmentId: e.target.value, classSectionId: '' }))}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 disabled:opacity-60"
                >
                  <option value="">Select department</option>
                  {adminOptions.map((department: any) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Class Section</span>
                <select
                  required
                  disabled={Boolean(editingStudent)}
                  value={studentForm.classSectionId}
                  onChange={(e) => setStudentForm((current) => ({ ...current, classSectionId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 disabled:opacity-60"
                >
                  <option value="">Select class section</option>
                  {(adminOptions.find((department: any) => department.id === studentForm.departmentId)?.classSections || []).map((section: any) => <option key={section.id} value={section.id}>{section.name} • Semester {section.semester}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Semester</span>
                <input required min="1" max="12" type="number" value={studentForm.semester} onChange={(e) => setStudentForm((current) => ({ ...current, semester: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Address</span>
                <textarea value={studentForm.address} onChange={(e) => setStudentForm((current) => ({ ...current, address: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900" />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 md:col-span-2">
                <button type="button" onClick={() => { setShowStudentForm(false); resetStudentForm(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">{editingStudent ? 'Save Changes' : 'Create Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAttendanceSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setSelectedAttendanceSubject(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-500">{selectedAttendanceSubject.code}</span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    {selectedAttendanceSubject.hasLabSlot ? 'Theory + Lab' : selectedAttendanceSubject.courseType === 'LAB' ? 'Lab' : selectedAttendanceSubject.courseType === 'PRACTICAL' ? 'Practical' : 'Theory'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{selectedAttendanceSubject.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Exact attendance history for this subject</p>
              </div>
              <button type="button" onClick={() => setSelectedAttendanceSubject(null)} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close attendance details">✕</button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase text-emerald-700">Present</p><p className="mt-1 text-2xl font-bold text-emerald-800">{selectedAttendanceSubject.present}</p></div>
              <div className="rounded-xl bg-rose-50 p-4"><p className="text-xs font-semibold uppercase text-rose-700">Absent</p><p className="mt-1 text-2xl font-bold text-rose-800">{selectedAttendanceSubject.absent}</p></div>
              <div className="rounded-xl bg-slate-100 p-4"><p className="text-xs font-semibold uppercase text-slate-600">Total classes</p><p className="mt-1 text-2xl font-bold text-slate-800">{selectedAttendanceSubject.total}</p></div>
              <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-semibold uppercase text-blue-700">Attendance</p><p className="mt-1 text-2xl font-bold text-blue-800">{selectedAttendanceSubject.percentage}%</p></div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Class timing</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Remarks</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedAttendanceSubject.records || []).map((record: any) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{record.date}</td>
                      <td className="px-4 py-3 text-slate-600">{record.classTimings?.join(' · ') || 'No class slot recorded'}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{record.status === 'PRESENT' ? 'PRESENT' : 'ABSENT'}</span></td>
                      <td className="px-4 py-3 text-slate-500">{record.remarks || '—'}</td>
                    </tr>
                  ))}
                  {!selectedAttendanceSubject.records?.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No attendance records are available for this subject yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STUDENT REQUEST CORRECTION (Locked official record correction)   */}
      {/* ========================================================================= */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Request Record Correction</span>
              </h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Field to Correct</label>
                <select
                  value={correctionField}
                  onChange={(e) => setCorrectionField(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900"
                >
                  <option value="Father's Name">Father's Name (e.g. Rajesh Kumar)</option>
                  <option value="Mother's Name">Mother's Name</option>
                  <option value="Date of Birth">Date of Birth</option>
                  <option value="Emergency Contact">Emergency Contact</option>
                  <option value="Address">Permanent Address</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New / Corrected Value</label>
                <input
                  type="text"
                  required
                  value={requestedValue}
                  onChange={(e) => setRequestedValue(e.target.value)}
                  placeholder="e.g. Rakesh Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Request</label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Incorrect spelling in college admission record as per 10th marksheet."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to ERP Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STUDENT SUBMIT ASSIGNMENT WORK                                   */}
      {/* ========================================================================= */}
      {submittingAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Submit Assignment Work</span>
              </h3>
              <button onClick={() => setSubmittingAssignment(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{submittingAssignment.title}</div>
              <div className="text-slate-500 mt-1">Due Date: {submittingAssignment.dueDate} • Max Marks: {submittingAssignment.maxMarks}</div>
            </div>

            <form onSubmit={handleStudentAssignmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">File Name</label>
                <input
                  type="text"
                  required
                  value={assignmentFileName}
                  onChange={(e) => setAssignmentFileName(e.target.value)}
                  placeholder="e.g. 24cse1023_assignment1.pdf"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Storage / Repository / Document URL</label>
                <input
                  type="text"
                  required
                  value={assignmentFileUrl}
                  onChange={(e) => setAssignmentFileUrl(e.target.value)}
                  placeholder="https://cdn.college-erp.edu/submissions/file.pdf"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Work</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TEACHER UPLOAD NOTE                                              */}
      {/* ========================================================================= */}
      {showUploadNoteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                <span>Upload Lecture Note & PDF</span>
              </h3>
              <button onClick={() => setShowUploadNoteModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!session) return;
                try {
                  await fetchWithAuth('/teacher/notes/upload', session.token, {
                    method: 'POST',
                    body: JSON.stringify({
                      title: newNote.title,
                      unit: newNote.unit,
                      description: newNote.description,
                      subjectId: newNote.subjectId || selectedSubject,
                      fileUrl: newNote.fileUrl || 'https://cdn.college-erp.edu/notes/lecture_notes.pdf',
                    }),
                  });
                  showToast('success', 'Note uploaded and published to students!');
                  setShowUploadNoteModal(false);
                  const notes = await fetchWithAuth('/teacher/notes', session.token);
                  setTeacherNotes(notes.notes || []);
                } catch (err: any) {
                  showToast('error', err.message);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Traversals BFS & DFS"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 4: Graphs"
                  value={newNote.unit}
                  onChange={(e) => setNewNote({ ...newNote, unit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short summary of topics..."
                  value={newNote.description}
                  onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document / PDF Storage URL</label>
                <input
                  type="text"
                  placeholder="https://cdn.college-erp.edu/notes/lecture.pdf"
                  value={newNote.fileUrl}
                  onChange={(e) => setNewNote({ ...newNote, fileUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadNoteModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Publish Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TEACHER CREATE ASSIGNMENT                                        */}
      {/* ========================================================================= */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Create New Assignment</span>
              </h3>
              <button onClick={() => setShowCreateAssignmentModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implementation of Dijkstra's Algorithm"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Instructions</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write clear instructions, test specs, and expected submission format..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    required
                    value={newAssignment.maxMarks}
                    onChange={(e) => setNewAssignment({ ...newAssignment, maxMarks: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: TEACHER GRADE STUDENT SUBMISSION                                 */}
      {/* ========================================================================= */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Evaluate & Grade Submission</span>
              </h3>
              <button onClick={() => setGradingSubmission(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">
                Student: {gradingSubmission.submission.student.user.name} ({gradingSubmission.submission.student.rollNo})
              </div>
              <div className="text-slate-600">Assignment: {gradingSubmission.assignment.title}</div>
              <div className="text-slate-500 font-mono">
                Submitted file:{' '}
                <a
                  href={gradingSubmission.submission.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline font-semibold"
                >
                  {gradingSubmission.submission.fileName}
                </a>
              </div>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Marks Awarded (Out of {gradingSubmission.assignment.maxMarks})
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={gradingSubmission.assignment.maxMarks}
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Faculty Feedback & Comments</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="e.g. Well implemented! Correct edge cases handled and clean code documentation."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Save & Publish Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          CGC Landran Student Portal • Secure Academic Services
          • Role-Based Access Control (RBAC) & Audit Integrity
        </div>
      </footer>
    </div>
  );
}

export default ERPPortal;
