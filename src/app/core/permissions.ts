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
  clientMetricDefinitions: {
    view: [
      'CLIENT_METRIC_DEFINITION_MINE_READ',
      'CLIENT_METRIC_DEFINITION_OTHER_READ',
      'CLIENT_METRIC_DEFINITION_MINE_MANAGEMENT',
      'CLIENT_METRIC_DEFINITION_OTHER_MANAGEMENT',
    ],
    create: [
      'CLIENT_METRIC_DEFINITION_MINE_CREATE',
      'CLIENT_METRIC_DEFINITION_OTHER_CREATE',
      'CLIENT_METRIC_DEFINITION_MINE_MANAGEMENT',
      'CLIENT_METRIC_DEFINITION_OTHER_MANAGEMENT',
    ],
    edit: [
      'CLIENT_METRIC_DEFINITION_MINE_UPDATE',
      'CLIENT_METRIC_DEFINITION_OTHER_UPDATE',
      'CLIENT_METRIC_DEFINITION_MINE_MANAGEMENT',
      'CLIENT_METRIC_DEFINITION_OTHER_MANAGEMENT',
    ],
    delete: [
      'CLIENT_METRIC_DEFINITION_OTHER_MANAGEMENT',
      'CLIENT_METRIC_DEFINITION_MINE_MANAGEMENT',
      'CLIENT_METRIC_DEFINITION_MINE_DELETE',
      'CLIENT_METRIC_DEFINITION_OTHER_DELETE',
    ],
  },

  payments: {
    view: [
      'PAYMENT_MINE_READ',
      'PAYMENT_OTHER_READ',
      'PAYMENT_MINE_MANAGEMENT',
      'PAYMENT_OTHER_MANAGEMENT',
    ],
    create: [
      'PAYMENT_MINE_CREATE',
      'PAYMENT_OTHER_CREATE',
      'PAYMENT_MINE_MANAGEMENT',
      'PAYMENT_OTHER_MANAGEMENT',
    ],
    edit: [
      'PAYMENT_MINE_UPDATE',
      'PAYMENT_OTHER_UPDATE',
      'PAYMENT_MINE_MANAGEMENT',
      'PAYMENT_OTHER_MANAGEMENT',
    ],
    delete: [
      'PAYMENT_OTHER_MANAGEMENT',
      'PAYMENT_MINE_MANAGEMENT',
      'PAYMENT_MINE_DELETE',
      'PAYMENT_OTHER_DELETE',
    ],
  },

  trainingPlans: {
    view: [
      'TRAINING_PLAN_MINE_READ',
      'TRAINING_PLAN_OTHER_READ',
      'TRAINING_PLAN_MINE_MANAGEMENT',
      'TRAINING_PLAN_OTHER_MANAGEMENT',
    ],
    create: [
      'TRAINING_PLAN_MINE_CREATE',
      'TRAINING_PLAN_OTHER_CREATE',
      'TRAINING_PLAN_MINE_MANAGEMENT',
      'TRAINING_PLAN_OTHER_MANAGEMENT',
    ],
    edit: [
      'TRAINING_PLAN_MINE_UPDATE',
      'TRAINING_PLAN_OTHER_UPDATE',
      'TRAINING_PLAN_MINE_MANAGEMENT',
      'TRAINING_PLAN_OTHER_MANAGEMENT',
    ],
    delete: [
      'TRAINING_PLAN_OTHER_MANAGEMENT',
      'TRAINING_PLAN_MINE_MANAGEMENT',
      'TRAINING_PLAN_MINE_DELETE',
      'TRAINING_PLAN_OTHER_DELETE',
    ],
  },

  diets: {
    view: ['DIET_MINE_READ', 'DIET_OTHER_READ', 'DIET_MINE_MANAGEMENT', 'DIET_OTHER_MANAGEMENT'],
    create: [
      'DIET_MINE_CREATE',
      'DIET_OTHER_CREATE',
      'DIET_MINE_MANAGEMENT',
      'DIET_OTHER_MANAGEMENT',
    ],
    edit: [
      'DIET_MINE_UPDATE',
      'DIET_OTHER_UPDATE',
      'DIET_MINE_MANAGEMENT',
      'DIET_OTHER_MANAGEMENT',
    ],
    delete: [
      'DIET_OTHER_MANAGEMENT',
      'DIET_MINE_MANAGEMENT',
      'DIET_MINE_DELETE',
      'DIET_OTHER_DELETE',
    ],
  },

  coaches: {
    view: [
      'COACH_MINE_READ',
      'COACH_OTHER_READ',
      'COACH_MINE_MANAGEMENT',
      'COACH_OTHER_MANAGEMENT',
    ],
    create: [
      'COACH_MINE_CREATE',
      'COACH_OTHER_CREATE',
      'COACH_MINE_MANAGEMENT',
      'COACH_OTHER_MANAGEMENT',
    ],
    edit: [
      'COACH_MINE_UPDATE',
      'COACH_OTHER_UPDATE',
      'COACH_MINE_MANAGEMENT',
      'COACH_OTHER_MANAGEMENT',
    ],
    delete: [
      'COACH_OTHER_MANAGEMENT',
      'COACH_MINE_MANAGEMENT',
      'COACH_MINE_DELETE',
      'COACH_OTHER_DELETE',
    ],
  },

  clients: {
    view: [
      'CLIENT_MINE_READ',
      'CLIENT_OTHER_READ',
      'CLIENT_MINE_MANAGEMENT',
      'CLIENT_OTHER_MANAGEMENT',
    ],
    create: [
      'CLIENT_MINE_CREATE',
      'CLIENT_OTHER_CREATE',
      'CLIENT_MINE_MANAGEMENT',
      'CLIENT_OTHER_MANAGEMENT',
    ],
    edit: [
      'CLIENT_MINE_UPDATE',
      'CLIENT_OTHER_UPDATE',
      'CLIENT_MINE_MANAGEMENT',
      'CLIENT_OTHER_MANAGEMENT',
    ],
    delete: [
      'CLIENT_OTHER_MANAGEMENT',
      'CLIENT_MINE_MANAGEMENT',
      'CLIENT_MINE_DELETE',
      'CLIENT_OTHER_DELETE',
    ],
  },

  companies: {
    view: [
      'COMPANY_MINE_READ',
      'COMPANY_OTHER_READ',
      'COMPANY_MINE_MANAGEMENT',
      'COMPANY_OTHER_MANAGEMENT',
    ],
    create: [
      'COMPANY_MINE_CREATE',
      'COMPANY_OTHER_CREATE',
      'COMPANY_MINE_MANAGEMENT',
      'COMPANY_OTHER_MANAGEMENT',
    ],
    edit: [
      'COMPANY_MINE_UPDATE',
      'COMPANY_OTHER_UPDATE',
      'COMPANY_MINE_MANAGEMENT',
      'COMPANY_OTHER_MANAGEMENT',
    ],
    delete: [
      'COMPANY_OTHER_MANAGEMENT',
      'COMPANY_MINE_MANAGEMENT',
      'COMPANY_MINE_DELETE',
      'COMPANY_OTHER_DELETE',
    ],
  },

  employees: {
    view: ['EMPLOYEE_READ', 'EMPLOYEE_MANAGEMENT'],
    create: ['EMPLOYEE_CREATE', 'EMPLOYEE_MANAGEMENT'],
    edit: ['EMPLOYEE_UPDATE', 'EMPLOYEE_MANAGEMENT'],
    delete: ['EMPLOYEE_MANAGEMENT'],
  },

  directory: {
    view: ['EMPLOYEE_READ', 'EMPLOYEE_MANAGEMENT'],
  },

  training: {
    view: ['TRAINING_READ', 'TRAINING_MANAGEMENT'],
    create: ['TRAINING_CREATE', 'TRAINING_MANAGEMENT'],
    edit: ['TRAINING_UPDATE', 'TRAINING_MANAGEMENT'],
    delete: ['TRAINING_MANAGEMENT'],
  },

  absences: {
    view: ['ABSENCE_READ', 'ABSENCE_MANAGEMENT'],
    create: ['ABSENCE_CREATE', 'ABSENCE_MANAGEMENT'],
    edit: ['ABSENCE_UPDATE', 'ABSENCE_MANAGEMENT'],
    delete: ['ABSENCE_MANAGEMENT'],
  },

  leaveCalendar: {
    view: ['ABSENCE_READ', 'ABSENCE_MANAGEMENT'],
  },

  settings: {
    view: ['SETTINGS_READ', 'SETTINGS_MANAGEMENT'],
    edit: ['SETTINGS_UPDATE', 'SETTINGS_MANAGEMENT'],
  },

  clientMetricValues: {
    view: [
      'CLIENT_METRIC_VALUE_MINE_READ',
      'CLIENT_METRIC_VALUE_OTHER_READ',
      'CLIENT_METRIC_VALUE_MINE_MANAGEMENT',
      'CLIENT_METRIC_VALUE_OTHER_MANAGEMENT',
    ],
    edit: [
      'CLIENT_METRIC_VALUE_MINE_UPDATE',
      'CLIENT_METRIC_VALUE_OTHER_UPDATE',
      'CLIENT_METRIC_VALUE_MINE_MANAGEMENT',
      'CLIENT_METRIC_VALUE_OTHER_MANAGEMENT',
    ],
  },

  selfProfile: {
    view: ['CLIENT'],
  },
} satisfies Record<string, Record<string, string[]>>;
