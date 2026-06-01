# Shade UI Kit

A modern, reusable Angular 21 UI component library and design system for backoffice web applications. Built with standalone components, reactive forms, and Tailwind CSS v4.

## Overview

**Shade UI Kit** is a comprehensive Angular component library designed to accelerate development of enterprise-grade web applications. It provides:

- **50+ Reusable Components** — Forms, data display, feedback, layout, and atoms
- **Design System** — Consistent theming with light and dark mode support
- **Tailwind v4 Integration** — Modern utility-first styling with full theme customization
- **Standalone Architecture** — Angular 21 standalone components for better tree-shaking and code organization
- **Type-Safe Forms** — Reactive Forms with comprehensive validation
- **Accessibility** — WCAG AA compliant with proper ARIA labels and focus management
- **Server-Side Operations** — Built-in pagination, sorting, filtering for table components

## Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 9.x (package manager)
- **Angular CLI** 21.2.13+

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shade-uikit
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200/`. The app auto-reloads on file changes.

4. **Build for production**
   ```bash
   ng build
   ```
   Output: `dist/shade-uikit/`

## Project Structure

```
src/app/
├── components/              # Reusable UI components
│   ├── layout/             # App shell, sidebar, header, breadcrumb
│   ├── feedback/           # Toast, modal, tooltip, popover, skeleton
│   ├── forms/              # Input, select, checkbox, date picker, etc.
│   ├── data/               # Table, tabs, accordion, calendar
│   ├── atoms/              # Badge, alert, avatar, card, chip, divider
│   └── index.ts            # Barrel export
├── pages/                  # Feature pages
│   ├── dashboard/
│   ├── employees/
│   ├── companies/          # Add, edit, detail, list with CRUD
│   └── ...
├── core/                   # Core services
│   ├── api.config.ts       # API base URL configuration
│   └── ...
├── layout/                 # Root layout & shell
├── app.routes.ts           # Main routing configuration
└── styles.css              # Global styles & Tailwind theme

```

## Key Features

### 1. Company Management (CRUD)
Complete company data management with nested branches:

- **Add Company** (`/companies/add`) — Create new company with form validation
- **Company List** (`/companies`) — Server-side pagination, sorting, filtering
- **Company Detail** (`/companies/:id`) — Read-only view of company information
- **Edit Company** (`/companies/:id/edit`) — Update company data and branches

**Fields:**
- Information: companyName, BRN, email, contactNumber, logo, branches
- Address: street, city, state, postalCode
- Miscellaneous: disclaimer, agreeTermsOfService
- Price: standardPrice

### 2. Form Components
Full suite of form controls with validation:

- Text inputs (email, password with visibility toggle, number, tel)
- Textarea with auto-resize
- Select (single & async-loading)
- Multi-select with chips
- Checkbox & toggle
- Radio groups
- Combo-box (searchable)
- Date picker

### 3. Data Display
- **Table** — Feature-complete with HTTP loading, pagination, sorting, filtering, row selection, empty states
- **Tabs** — Lazy-loading with underline indicator
- **Accordion** — Single/multi-open modes
- **Calendar** — Month view with date selection
- **Masonry** — CSS columns-based responsive grid

### 4. Feedback & Overlays
- **Toast** — Sonner-style stacked notifications (success, error, warning, info)
- **Modal** — Focus-trapped dialogs with backdrop click close
- **Tooltip** — Hover/focus activated with CDK positioning
- **Popover** — Click-triggered overlay panels
- **Skeleton** — Pulsing shimmer loaders
- **Alert** — Inline status banners (dismissible)

### 5. Layout Primitives
- **PageContainer** — Page wrapper with configurable max-width and gap
- **Grid** — Responsive grid with breakpoint-aware column counts
- **Stack** — Flex container (vertical/horizontal) with alignment options

### 6. Design System

#### Color Tokens (Tailwind v4 Theme)
```css
--color-primary: #135bec;
--color-background-light: #f6f6f8;
--color-background-dark: #0a0f18;
--color-surface-dark: #161b26;
--color-border-dark: #232936;
```

#### Dark Mode
Toggle via `<html class="dark">`. All components adapt automatically with `dark:` prefix utilities.

#### Fonts
- **Sans**: Inter (400, 500, 600, 700, 800, 900)
- **Icons**: Material Symbols Outlined

## Usage Examples

### Using Form Controls

```typescript
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputComponent, SelectComponent, ButtonComponent } from '@app/components';

export class MyComponent {
  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    status: ['active', Validators.required],
  });

  constructor(private fb: FormBuilder) {}

  protected onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

```html
<sk-input
  label="Email"
  placeholder="user@example.com"
  formControlName="email"
  [error]="form.get('email')?.invalid"
/>
<sk-button variant="primary" type="submit" [disabled]="form.invalid">
  Submit
</sk-button>
```

### Using Table with Server-Side Data

```typescript
protected readonly tableParams = signal<TableParams>({
  page: 1,
  pageSize: 10,
  sort: 'createdDate',
  descendingSort: true,
  filters: {},
});

protected readonly loadFn = (params: TableParams) => {
  return this.http.get<PagedResult>('/api/companies', { params });
};
```

### Displaying Toast Notifications

```typescript
constructor(private toast: ToastService) {}

protected onSuccess() {
  this.toast.success('Company created successfully!', {
    duration: 3000,
    position: 'top-right',
  });
}
```

## Development

### Code Generation

```bash
# Generate new component
ng generate component pages/my-feature

# Generate new directive
ng generate directive components/my-directive

# Generate new pipe
ng generate pipe pipes/my-pipe
```

### Running Tests

```bash
# Unit tests
ng test

# e2e tests
ng e2e
```

### Building

```bash
# Development build
ng build --configuration=development

# Production build (optimized)
ng build
```

## API Integration

The app is configured to work with a backend API at `https://fitness-gym-management-be.onrender.com`.

Configure the base URL in `src/app/core/api.config.ts`:

```typescript
export const API_BASE_URL = new InjectionToken<string>(
  'api.base.url',
  {
    providedIn: 'root',
    factory: () => 'https://fitness-gym-management-be.onrender.com',
  }
);
```

## Architecture Patterns

### Standalone Components
All components use Angular 21 standalone architecture (`standalone: true`):

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent],
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {}
```

### Reactive Forms with Nested Groups
Complex forms use nested FormGroups for organization:

```typescript
protected readonly form = this.fb.group({
  information: this.fb.group({
    name: ['', Validators.required],
    email: ['', Validators.email],
  }),
  address: this.fb.group({
    street: ['', Validators.required],
    city: ['', Validators.required],
  }),
});
```

### Signal-Based State Management
Modern signal API for reactive state:

```typescript
protected readonly data = signal<Data | null>(null);
protected readonly isLoading = signal(true);
protected readonly computed = computed(() => this.data()?.name);
```

### Server-Side Operations
Table operations handled by backend:

```
GET /api/companies?pageNumber=0&pageSize=10&sort=COMPANY_NAME&descendingSort=false&companyName=Acme
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions welcome! Please follow these guidelines:

1. Use standalone components
2. Implement `OnPush` change detection
3. Add WCAG AA accessibility attributes
4. Document props and events with JSDoc
5. Test responsive behavior at mobile, tablet, desktop
6. Use Tailwind utilities (no inline CSS)

## License

MIT

## Additional Resources

- [Angular 21 Docs](https://angular.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Angular CDK](https://material.angular.io/cdk)
- [Material Symbols](https://fonts.google.com/icons)
- [Reactive Forms Guide](https://angular.dev/guide/forms/reactive-forms)
