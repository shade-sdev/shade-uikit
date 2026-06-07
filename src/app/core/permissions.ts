/**
 * Central permissions registry — single source of truth for all RBAC rules.
 *
 * Each resource defines the roles/permissions required for each action.
 * These are reused across:
 *
 *   Routes:     canActivate: [roleGuard(...APP_PERMISSIONS.companies.view)]
 *   Nav items:  roles: APP_PERMISSIONS.companies.view
 *   Templates:  *skHasRole="APP_PERMISSIONS.companies.edit"
 *
 * Roles and permissions from the JWT are merged into a single flat array
 * by JwtService, so you can use either interchangeably here.
 */
export const APP_PERMISSIONS = {

  payments: {
    view: ['CLIENT_MINE_MANAGEMENT', 'CLIENT_OTHER_MANAGEMENT'],
  },

  coaches: {
    view:   ['COACH_MINE_MANAGEMENT', 'COACH_OTHER_MANAGEMENT'],
    create: ['COACH_MINE_MANAGEMENT', 'COACH_OTHER_MANAGEMENT'],
    edit:   ['COACH_MINE_MANAGEMENT', 'COACH_OTHER_MANAGEMENT'],
    delete: ['COACH_OTHER_MANAGEMENT'],
  },

  clients: {
    view:   ['CLIENT_MINE_MANAGEMENT', 'CLIENT_OTHER_MANAGEMENT'],
    create: ['CLIENT_MINE_MANAGEMENT', 'CLIENT_OTHER_MANAGEMENT'],
    edit:   ['CLIENT_MINE_MANAGEMENT', 'CLIENT_OTHER_MANAGEMENT'],
    delete: ['CLIENT_OTHER_MANAGEMENT'],
  },

  companies: {
    view:   ['COMPANY_MINE_READ',   'COMPANY_OTHER_READ',   'COMPANY_MINE_MANAGEMENT', 'COMPANY_OTHER_MANAGEMENT'],
    create: ['COMPANY_MINE_CREATE', 'COMPANY_OTHER_CREATE', 'COMPANY_MINE_MANAGEMENT', 'COMPANY_OTHER_MANAGEMENT'],
    edit:   ['COMPANY_MINE_UPDATE', 'COMPANY_OTHER_UPDATE', 'COMPANY_MINE_MANAGEMENT', 'COMPANY_OTHER_MANAGEMENT'],
    delete: ['COMPANY_OTHER_MANAGEMENT'],
  },

  employees: {
    view:   ['EMPLOYEE_READ',   'EMPLOYEE_MANAGEMENT'],
    create: ['EMPLOYEE_CREATE', 'EMPLOYEE_MANAGEMENT'],
    edit:   ['EMPLOYEE_UPDATE', 'EMPLOYEE_MANAGEMENT'],
    delete: ['EMPLOYEE_MANAGEMENT'],
  },

  directory: {
    view: ['EMPLOYEE_READ', 'EMPLOYEE_MANAGEMENT'],
  },

  training: {
    view:   ['TRAINING_READ',   'TRAINING_MANAGEMENT'],
    create: ['TRAINING_CREATE', 'TRAINING_MANAGEMENT'],
    edit:   ['TRAINING_UPDATE', 'TRAINING_MANAGEMENT'],
    delete: ['TRAINING_MANAGEMENT'],
  },

  absences: {
    view:   ['ABSENCE_READ',   'ABSENCE_MANAGEMENT'],
    create: ['ABSENCE_CREATE', 'ABSENCE_MANAGEMENT'],
    edit:   ['ABSENCE_UPDATE', 'ABSENCE_MANAGEMENT'],
    delete: ['ABSENCE_MANAGEMENT'],
  },

  leaveCalendar: {
    view: ['ABSENCE_READ', 'ABSENCE_MANAGEMENT'],
  },

  settings: {
    view: ['SETTINGS_READ', 'SETTINGS_MANAGEMENT'],
    edit: ['SETTINGS_UPDATE', 'SETTINGS_MANAGEMENT'],
  },

} satisfies Record<string, Record<string, string[]>>;
