import { signal } from '@angular/core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Department = 'Engineering' | 'Design' | 'Product' | 'Sales' | 'HR' | 'Finance' | 'Operations';
export type EmployeeStatus = 'active' | 'on-leave' | 'remote' | 'terminated';
export type TrainingStatus = 'completed' | 'in-progress' | 'not-started' | 'overdue';
export type AbsenceType = 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: Department;
  role: string;
  status: EmployeeStatus;
  joinDate: string;
  salary: number;
  managerId?: string;
  phone: string;
  location: string;
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  course: string;
  category: string;
  status: TrainingStatus;
  progress: number;
  assignedDate: string;
  dueDate: string;
  completedDate?: string;
}

export interface AbsenceRequest {
  id: string;
  employeeId: string;
  type: AbsenceType;
  status: AbsenceStatus;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  submittedDate: string;
}

// ─── Employees ────────────────────────────────────────────────────────────────

const EMPLOYEES_DATA: Employee[] = [
  { id: 'e01', name: 'Alice Martin',    email: 'alice.martin@corp.io',    department: 'Engineering', role: 'Engineering Lead',       status: 'active',      joinDate: '2020-02-10', salary: 112000, phone: '+1 555-0101', location: 'New York' },
  { id: 'e02', name: 'Bob Chen',        email: 'bob.chen@corp.io',        department: 'Engineering', role: 'Senior Backend Dev',     status: 'remote',      joinDate: '2021-05-03', salary: 96000,  managerId: 'e01', phone: '+1 555-0102', location: 'San Francisco' },
  { id: 'e03', name: 'Carol Davis',     email: 'carol.davis@corp.io',     department: 'Engineering', role: 'Frontend Developer',     status: 'active',      joinDate: '2022-08-15', salary: 84000,  managerId: 'e01', phone: '+1 555-0103', location: 'Austin' },
  { id: 'e04', name: 'David Park',      email: 'david.park@corp.io',      department: 'Engineering', role: 'DevOps Engineer',        status: 'active',      joinDate: '2021-11-20', salary: 92000,  managerId: 'e01', phone: '+1 555-0104', location: 'Seattle' },
  { id: 'e05', name: 'Eva Schmidt',     email: 'eva.schmidt@corp.io',     department: 'Engineering', role: 'QA Engineer',            status: 'on-leave',    joinDate: '2023-01-08', salary: 78000,  managerId: 'e01', phone: '+1 555-0105', location: 'Boston' },
  { id: 'e06', name: 'Frank Torres',    email: 'frank.torres@corp.io',    department: 'Design',      role: 'Head of Design',         status: 'active',      joinDate: '2020-06-01', salary: 105000, phone: '+1 555-0106', location: 'New York' },
  { id: 'e07', name: 'Grace Kim',       email: 'grace.kim@corp.io',       department: 'Design',      role: 'UX Designer',            status: 'active',      joinDate: '2022-03-14', salary: 88000,  managerId: 'e06', phone: '+1 555-0107', location: 'Los Angeles' },
  { id: 'e08', name: 'Henry Wilson',    email: 'henry.wilson@corp.io',    department: 'Design',      role: 'UI Designer',            status: 'remote',      joinDate: '2023-04-19', salary: 82000,  managerId: 'e06', phone: '+1 555-0108', location: 'Chicago' },
  { id: 'e09', name: 'Isla Brown',      email: 'isla.brown@corp.io',      department: 'Product',     role: 'VP of Product',          status: 'active',      joinDate: '2019-09-05', salary: 130000, phone: '+1 555-0109', location: 'New York' },
  { id: 'e10', name: 'James Miller',    email: 'james.miller@corp.io',    department: 'Product',     role: 'Product Manager',        status: 'active',      joinDate: '2021-07-22', salary: 98000,  managerId: 'e09', phone: '+1 555-0110', location: 'New York' },
  { id: 'e11', name: 'Karen White',     email: 'karen.white@corp.io',     department: 'Product',     role: 'Product Analyst',        status: 'on-leave',    joinDate: '2022-10-03', salary: 85000,  managerId: 'e09', phone: '+1 555-0111', location: 'Denver' },
  { id: 'e12', name: 'Liam Johnson',    email: 'liam.johnson@corp.io',    department: 'Sales',       role: 'Sales Director',         status: 'active',      joinDate: '2020-03-17', salary: 118000, phone: '+1 555-0112', location: 'New York' },
  { id: 'e13', name: 'Mia Thompson',    email: 'mia.thompson@corp.io',    department: 'Sales',       role: 'Account Executive',      status: 'active',      joinDate: '2021-09-01', salary: 79000,  managerId: 'e12', phone: '+1 555-0113', location: 'Miami' },
  { id: 'e14', name: 'Noah Garcia',     email: 'noah.garcia@corp.io',     department: 'Sales',       role: 'Sales Representative',   status: 'active',      joinDate: '2023-02-14', salary: 68000,  managerId: 'e12', phone: '+1 555-0114', location: 'Dallas' },
  { id: 'e15', name: 'Olivia Martinez', email: 'olivia.martinez@corp.io', department: 'Sales',       role: 'Customer Success Mgr',   status: 'remote',      joinDate: '2022-06-06', salary: 76000,  managerId: 'e12', phone: '+1 555-0115', location: 'Phoenix' },
  { id: 'e16', name: 'Patrick Lee',     email: 'patrick.lee@corp.io',     department: 'HR',          role: 'HR Manager',             status: 'active',      joinDate: '2020-01-13', salary: 94000,  phone: '+1 555-0116', location: 'New York' },
  { id: 'e17', name: 'Quinn Anderson',  email: 'quinn.anderson@corp.io',  department: 'HR',          role: 'HR Specialist',          status: 'active',      joinDate: '2023-03-27', salary: 72000,  managerId: 'e16', phone: '+1 555-0117', location: 'New York' },
  { id: 'e18', name: 'Rachel Taylor',   email: 'rachel.taylor@corp.io',   department: 'Finance',     role: 'Finance Director',       status: 'active',      joinDate: '2019-11-11', salary: 125000, phone: '+1 555-0118', location: 'New York' },
  { id: 'e19', name: 'Sam Jackson',     email: 'sam.jackson@corp.io',     department: 'Operations',  role: 'Operations Manager',     status: 'active',      joinDate: '2021-04-08', salary: 89000,  phone: '+1 555-0119', location: 'Atlanta' },
  { id: 'e20', name: 'Tessa Moore',     email: 'tessa.moore@corp.io',     department: 'Operations',  role: 'Operations Analyst',     status: 'on-leave',    joinDate: '2023-06-12', salary: 71000,  managerId: 'e19', phone: '+1 555-0120', location: 'Atlanta' },
];

// ─── Training ─────────────────────────────────────────────────────────────────

const TRAINING_DATA: TrainingRecord[] = [
  { id: 't01', employeeId: 'e01', course: 'Leadership Excellence',        category: 'Leadership',   status: 'completed',    progress: 100, assignedDate: '2024-01-10', dueDate: '2024-03-01', completedDate: '2024-02-20' },
  { id: 't02', employeeId: 'e01', course: 'Cloud Architecture (AWS)',     category: 'Technical',    status: 'in-progress',  progress: 65,  assignedDate: '2024-04-01', dueDate: '2024-07-01' },
  { id: 't03', employeeId: 'e02', course: 'Kubernetes Advanced',          category: 'Technical',    status: 'completed',    progress: 100, assignedDate: '2024-01-15', dueDate: '2024-04-01', completedDate: '2024-03-18' },
  { id: 't04', employeeId: 'e02', course: 'Security Best Practices',      category: 'Compliance',   status: 'overdue',      progress: 30,  assignedDate: '2024-02-01', dueDate: '2024-04-30' },
  { id: 't05', employeeId: 'e03', course: 'React 18 Deep Dive',           category: 'Technical',    status: 'in-progress',  progress: 80,  assignedDate: '2024-03-01', dueDate: '2024-06-01' },
  { id: 't06', employeeId: 'e03', course: 'Accessibility Standards',      category: 'Compliance',   status: 'not-started',  progress: 0,   assignedDate: '2024-05-01', dueDate: '2024-08-01' },
  { id: 't07', employeeId: 'e04', course: 'Terraform & IaC',              category: 'Technical',    status: 'completed',    progress: 100, assignedDate: '2024-01-20', dueDate: '2024-03-20', completedDate: '2024-03-15' },
  { id: 't08', employeeId: 'e04', course: 'Incident Management',          category: 'Operations',   status: 'in-progress',  progress: 55,  assignedDate: '2024-04-10', dueDate: '2024-07-10' },
  { id: 't09', employeeId: 'e05', course: 'Automated Testing',            category: 'Technical',    status: 'overdue',      progress: 20,  assignedDate: '2024-02-15', dueDate: '2024-05-01' },
  { id: 't10', employeeId: 'e05', course: 'GDPR Compliance',              category: 'Compliance',   status: 'not-started',  progress: 0,   assignedDate: '2024-05-15', dueDate: '2024-08-15' },
  { id: 't11', employeeId: 'e06', course: 'Design Systems at Scale',      category: 'Design',       status: 'completed',    progress: 100, assignedDate: '2024-01-05', dueDate: '2024-03-05', completedDate: '2024-02-28' },
  { id: 't12', employeeId: 'e06', course: 'Leadership Excellence',        category: 'Leadership',   status: 'in-progress',  progress: 70,  assignedDate: '2024-04-01', dueDate: '2024-07-01' },
  { id: 't13', employeeId: 'e07', course: 'Figma Advanced',               category: 'Design',       status: 'completed',    progress: 100, assignedDate: '2024-02-01', dueDate: '2024-04-01', completedDate: '2024-03-25' },
  { id: 't14', employeeId: 'e07', course: 'User Research Methods',        category: 'Design',       status: 'in-progress',  progress: 45,  assignedDate: '2024-04-15', dueDate: '2024-07-15' },
  { id: 't15', employeeId: 'e08', course: 'Motion Design Principles',     category: 'Design',       status: 'not-started',  progress: 0,   assignedDate: '2024-05-01', dueDate: '2024-09-01' },
  { id: 't16', employeeId: 'e08', course: 'GDPR Compliance',              category: 'Compliance',   status: 'completed',    progress: 100, assignedDate: '2024-01-10', dueDate: '2024-03-10', completedDate: '2024-03-01' },
  { id: 't17', employeeId: 'e09', course: 'Strategic Product Management', category: 'Leadership',   status: 'completed',    progress: 100, assignedDate: '2024-01-01', dueDate: '2024-02-28', completedDate: '2024-02-15' },
  { id: 't18', employeeId: 'e09', course: 'OKR Frameworks',               category: 'Leadership',   status: 'in-progress',  progress: 90,  assignedDate: '2024-04-01', dueDate: '2024-06-30' },
  { id: 't19', employeeId: 'e10', course: 'Product Analytics',            category: 'Technical',    status: 'completed',    progress: 100, assignedDate: '2024-02-10', dueDate: '2024-04-10', completedDate: '2024-04-05' },
  { id: 't20', employeeId: 'e10', course: 'Agile & Scrum Mastery',        category: 'Operations',   status: 'in-progress',  progress: 60,  assignedDate: '2024-04-20', dueDate: '2024-07-20' },
  { id: 't21', employeeId: 'e11', course: 'Data Visualization',           category: 'Technical',    status: 'overdue',      progress: 15,  assignedDate: '2024-03-01', dueDate: '2024-05-15' },
  { id: 't22', employeeId: 'e11', course: 'SQL Mastery',                  category: 'Technical',    status: 'not-started',  progress: 0,   assignedDate: '2024-05-20', dueDate: '2024-08-20' },
  { id: 't23', employeeId: 'e12', course: 'Enterprise Sales Strategy',    category: 'Sales',        status: 'completed',    progress: 100, assignedDate: '2024-01-15', dueDate: '2024-03-15', completedDate: '2024-03-10' },
  { id: 't24', employeeId: 'e12', course: 'Leadership Excellence',        category: 'Leadership',   status: 'in-progress',  progress: 40,  assignedDate: '2024-04-05', dueDate: '2024-07-05' },
  { id: 't25', employeeId: 'e13', course: 'CRM Tools & Salesforce',       category: 'Sales',        status: 'completed',    progress: 100, assignedDate: '2024-02-05', dueDate: '2024-04-05', completedDate: '2024-03-30' },
  { id: 't26', employeeId: 'e13', course: 'Negotiation Skills',           category: 'Sales',        status: 'in-progress',  progress: 50,  assignedDate: '2024-04-15', dueDate: '2024-07-15' },
  { id: 't27', employeeId: 'e14', course: 'Sales Fundamentals',           category: 'Sales',        status: 'in-progress',  progress: 75,  assignedDate: '2024-03-01', dueDate: '2024-06-01' },
  { id: 't28', employeeId: 'e14', course: 'Product Knowledge 101',        category: 'Operations',   status: 'completed',    progress: 100, assignedDate: '2024-02-20', dueDate: '2024-03-20', completedDate: '2024-03-18' },
  { id: 't29', employeeId: 'e15', course: 'Customer Success Strategies',  category: 'Sales',        status: 'completed',    progress: 100, assignedDate: '2024-01-20', dueDate: '2024-03-20', completedDate: '2024-03-12' },
  { id: 't30', employeeId: 'e15', course: 'Conflict Resolution',          category: 'Leadership',   status: 'not-started',  progress: 0,   assignedDate: '2024-05-10', dueDate: '2024-08-10' },
  { id: 't31', employeeId: 'e16', course: 'HR Compliance & Labor Law',    category: 'Compliance',   status: 'completed',    progress: 100, assignedDate: '2024-01-01', dueDate: '2024-02-28', completedDate: '2024-02-20' },
  { id: 't32', employeeId: 'e16', course: 'Talent Acquisition Mastery',   category: 'HR',           status: 'in-progress',  progress: 85,  assignedDate: '2024-04-01', dueDate: '2024-06-30' },
  { id: 't33', employeeId: 'e17', course: 'HRIS Systems',                 category: 'Technical',    status: 'completed',    progress: 100, assignedDate: '2024-02-15', dueDate: '2024-04-15', completedDate: '2024-04-10' },
  { id: 't34', employeeId: 'e17', course: 'Diversity & Inclusion',        category: 'HR',           status: 'in-progress',  progress: 35,  assignedDate: '2024-04-25', dueDate: '2024-07-25' },
  { id: 't35', employeeId: 'e18', course: 'Financial Modeling',           category: 'Finance',      status: 'completed',    progress: 100, assignedDate: '2024-01-10', dueDate: '2024-03-01', completedDate: '2024-02-25' },
  { id: 't36', employeeId: 'e18', course: 'IFRS Accounting Standards',    category: 'Compliance',   status: 'in-progress',  progress: 60,  assignedDate: '2024-04-01', dueDate: '2024-07-01' },
  { id: 't37', employeeId: 'e19', course: 'Supply Chain Management',      category: 'Operations',   status: 'completed',    progress: 100, assignedDate: '2024-01-15', dueDate: '2024-03-15', completedDate: '2024-03-08' },
  { id: 't38', employeeId: 'e19', course: 'Six Sigma Green Belt',         category: 'Operations',   status: 'in-progress',  progress: 55,  assignedDate: '2024-04-10', dueDate: '2024-08-10' },
  { id: 't39', employeeId: 'e20', course: 'Process Optimization',         category: 'Operations',   status: 'overdue',      progress: 10,  assignedDate: '2024-03-01', dueDate: '2024-05-01' },
  { id: 't40', employeeId: 'e20', course: 'Data Analysis Basics',         category: 'Technical',    status: 'not-started',  progress: 0,   assignedDate: '2024-05-20', dueDate: '2024-09-01' },
];

// ─── Absences ─────────────────────────────────────────────────────────────────

const ABSENCE_DATA: AbsenceRequest[] = [
  { id: 'a01', employeeId: 'e05', type: 'maternity',  status: 'approved',  startDate: '2024-04-01', endDate: '2024-07-01', days: 63, reason: 'Maternity leave', submittedDate: '2024-02-15' },
  { id: 'a02', employeeId: 'e11', type: 'sick',        status: 'approved',  startDate: '2024-05-06', endDate: '2024-05-10', days: 5,  reason: 'Medical procedure recovery', submittedDate: '2024-05-03' },
  { id: 'a03', employeeId: 'e20', type: 'personal',    status: 'approved',  startDate: '2024-05-20', endDate: '2024-05-31', days: 9,  reason: 'Family emergency', submittedDate: '2024-05-16' },
  { id: 'a04', employeeId: 'e03', type: 'vacation',    status: 'pending',   startDate: '2024-06-10', endDate: '2024-06-21', days: 10, reason: 'Annual leave - summer vacation', submittedDate: '2024-05-08' },
  { id: 'a05', employeeId: 'e07', type: 'vacation',    status: 'pending',   startDate: '2024-06-17', endDate: '2024-06-28', days: 10, reason: 'Summer holiday trip', submittedDate: '2024-05-10' },
  { id: 'a06', employeeId: 'e13', type: 'sick',        status: 'pending',   startDate: '2024-05-22', endDate: '2024-05-24', days: 3,  reason: 'Flu symptoms', submittedDate: '2024-05-21' },
  { id: 'a07', employeeId: 'e02', type: 'personal',    status: 'approved',  startDate: '2024-04-22', endDate: '2024-04-23', days: 2,  reason: 'Apartment move', submittedDate: '2024-04-15' },
  { id: 'a08', employeeId: 'e10', type: 'vacation',    status: 'rejected',  startDate: '2024-05-27', endDate: '2024-05-31', days: 5,  reason: 'Long weekend break', submittedDate: '2024-05-05' },
  { id: 'a09', employeeId: 'e14', type: 'sick',        status: 'approved',  startDate: '2024-04-08', endDate: '2024-04-09', days: 2,  reason: 'Dental surgery', submittedDate: '2024-04-07' },
  { id: 'a10', employeeId: 'e17', type: 'vacation',    status: 'pending',   startDate: '2024-07-01', endDate: '2024-07-12', days: 10, reason: 'Family vacation abroad', submittedDate: '2024-05-09' },
  { id: 'a11', employeeId: 'e04', type: 'personal',    status: 'approved',  startDate: '2024-03-25', endDate: '2024-03-25', days: 1,  reason: 'Child school event', submittedDate: '2024-03-22' },
  { id: 'a12', employeeId: 'e08', type: 'sick',        status: 'rejected',  startDate: '2024-04-15', endDate: '2024-04-18', days: 4,  reason: 'Chronic back pain', submittedDate: '2024-04-14' },
  { id: 'a13', employeeId: 'e19', type: 'vacation',    status: 'approved',  startDate: '2024-03-18', endDate: '2024-03-22', days: 5,  reason: 'Spring break holiday', submittedDate: '2024-03-01' },
  { id: 'a14', employeeId: 'e15', type: 'personal',    status: 'pending',   startDate: '2024-06-03', endDate: '2024-06-04', days: 2,  reason: 'House closing appointment', submittedDate: '2024-05-20' },
  { id: 'a15', employeeId: 'e01', type: 'vacation',    status: 'approved',  startDate: '2024-02-19', endDate: '2024-02-23', days: 5,  reason: 'Winter break', submittedDate: '2024-02-01' },
];

// ─── Reactive store ───────────────────────────────────────────────────────────

export const employeesStore  = signal<Employee[]>([...EMPLOYEES_DATA]);
export const trainingStore   = signal<TrainingRecord[]>([...TRAINING_DATA]);
export const absencesStore   = signal<AbsenceRequest[]>([...ABSENCE_DATA]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getEmployee(id: string): Employee | undefined {
  return employeesStore().find((e) => e.id === id);
}

export function getEmployeeName(id: string): string {
  return getEmployee(id)?.name ?? '—';
}

export function calcTenure(joinDate: string): string {
  const start = new Date(joinDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths}mo`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m ? `${y}y ${m}mo` : `${y}y`;
}

export const DEPT_COLORS: Record<Department, string> = {
  Engineering: 'bg-blue-500',
  Design:      'bg-violet-500',
  Product:     'bg-emerald-500',
  Sales:       'bg-amber-500',
  HR:          'bg-rose-500',
  Finance:     'bg-teal-500',
  Operations:  'bg-orange-500',
};

export const STATUS_COLORS: Record<EmployeeStatus, string> = {
  active:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  remote:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'on-leave':  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  terminated:  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export const TRAINING_COLORS: Record<TrainingStatus, string> = {
  completed:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'in-progress':'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'not-started':'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  overdue:      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export const ABSENCE_COLORS: Record<AbsenceStatus, string> = {
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  vacation: 'Vacation', sick: 'Sick Leave', personal: 'Personal',
  maternity: 'Maternity', paternity: 'Paternity', unpaid: 'Unpaid',
};
