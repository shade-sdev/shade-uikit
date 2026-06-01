# Shade UI Kit

A modern, reusable **Angular 21 component library and design system** for building enterprise-grade web applications. Built with standalone components, reactive forms, and Tailwind CSS v4.

## What is Shade UI Kit?

**Shade UI Kit** is a comprehensive collection of **production-ready UI components** designed to accelerate development. Instead of building from scratch, import pre-built components with:

- ✅ Complete styling (light & dark mode)
- ✅ Full accessibility (WCAG AA)
- ✅ Type-safe TypeScript
- ✅ Responsive design
- ✅ Error handling & loading states

## Features at a Glance

| Category | Components |
|----------|-----------|
| **Forms** | Input, Textarea, Select, MultiSelect, Checkbox, Toggle, RadioGroup, DatePicker, ComboBox, ButtonGroup |
| **Data Display** | Table (with pagination/sorting/filtering), Tabs, Accordion, Calendar, Masonry |
| **Feedback** | Toast, Modal, Tooltip, Popover, Alert, Skeleton, LoadingOverlay, Spinner |
| **Layout** | PageContainer, Grid, Stack, AppShell, Sidebar, Header, Breadcrumb, PageHeader |
| **Atoms** | Badge, Avatar, Card, Chip, Divider, EmptyState, Progress, Button |

## Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 9.x (package manager)
- **Angular CLI** 21.2.13+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd shade-uikit

# Install dependencies
pnpm install

# Start development server
ng serve

# Navigate to http://localhost:4200/
```

## Component Categories

### 1. Form Components

**Simple Input Fields:**
```html
<sk-input
  label="Email"
  type="email"
  placeholder="user@example.com"
  formControlName="email"
/>

<sk-textarea
  label="Description"
  [rows]="4"
  placeholder="Enter text..."
  formControlName="description"
/>

<sk-input
  label="Password"
  type="password"
  placeholder="••••••••"
  formControlName="password"
/>
```

**Selection Controls:**
```html
<!-- Single Select -->
<sk-select
  label="Status"
  [options]="statusOptions"
  formControlName="status"
/>

<!-- Multi-Select with Chips -->
<sk-multi-select
  label="Tags"
  [loadFn]="loadTags"
  formControlName="tags"
/>

<!-- Checkbox -->
<sk-checkbox
  label="I agree to terms"
  formControlName="agreeTerms"
/>

<!-- Toggle -->
<sk-toggle
  label="Enable notifications"
  formControlName="notificationsEnabled"
/>

<!-- Date Picker -->
<sk-date-picker
  label="Birth Date"
  formControlName="birthDate"
/>
```

### 2. Data Display Components

**Table with Server-Side Operations:**
```typescript
protected readonly columns: ColumnDef[] = [
  { key: 'name', label: 'Name', sortable: true, searchable: true },
  { key: 'email', label: 'Email', searchable: true },
  { key: 'status', label: 'Status', filterable: true },
  { key: 'createdDate', label: 'Created', sortable: true },
];

protected readonly loadFn = (params: TableParams) => {
  return this.http.get('/api/users', { params });
};
```

```html
<sk-table
  [columns]="columns"
  [loadFn]="loadFn"
  [clickable]="true"
  (rowClick)="onRowClick($event)"
/>
```

**Tabs:**
```html
<sk-tabs>
  <sk-tab label="Overview">
    <p>Overview content</p>
  </sk-tab>
  <sk-tab label="Details">
    <p>Details content</p>
  </sk-tab>
</sk-tabs>
```

**Accordion:**
```html
<sk-accordion>
  <sk-accordion-item title="Section 1">
    Content for section 1
  </sk-accordion-item>
  <sk-accordion-item title="Section 2">
    Content for section 2
  </sk-accordion-item>
</sk-accordion>
```

### 3. Feedback Components

**Toast Notifications:**
```typescript
private readonly toast = inject(ToastService);

onSuccess() {
  this.toast.success('Operation completed!');
}

onError() {
  this.toast.error('An error occurred', { title: 'Error' });
}

onWarning() {
  this.toast.warning('Please review', { title: 'Warning' });
}

onInfo() {
  this.toast.info('For your information');
}

// With custom duration (ms):
onPersistent() {
  this.toast.error('Critical failure', { title: 'Error', duration: 0 }); // 0 = never auto-dismiss
}
```

**Modal Dialog:**
```typescript
constructor(private modal: ModalService) {}

openDialog() {
  this.modal.open(MyDialogComponent, {
    title: 'Confirm Action',
    data: { message: 'Are you sure?' }
  }).subscribe(result => {
    if (result) {
      // User confirmed
    }
  });
}
```

**Alert Banner:**
```html
<sk-alert variant="info" [dismissible]="true">
  This is an informational message
</sk-alert>

<sk-alert variant="success">
  Operation was successful!
</sk-alert>

<sk-alert variant="warning">
  Please be careful
</sk-alert>

<sk-alert variant="error">
  Something went wrong
</sk-alert>
```

### 4. Layout Components

**Page Container:**
```html
<sk-page-container maxWidth="2xl" gap="lg">
  <!-- Your page content -->
</sk-page-container>
```

**Responsive Grid:**
```html
<!-- 1 column on mobile, 2 on tablet, 4 on desktop -->
<sk-grid [cols]="1" [colsSm]="2" [colsLg]="4" gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</sk-grid>
```

**Flexible Stack:**
```html
<!-- Vertical stack (default) -->
<sk-stack gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
</sk-stack>

<!-- Horizontal stack -->
<sk-stack direction="horizontal" justify="between" align="center">
  <div>Left</div>
  <div>Right</div>
</sk-stack>
```

### 5. Atom Components

**Badge:**
```html
<sk-badge variant="success">Active</sk-badge>
<sk-badge variant="warning">Pending</sk-badge>
<sk-badge variant="error">Failed</sk-badge>
```

**Avatar:**
```html
<sk-avatar name="John Doe" size="lg" />
<sk-avatar [image]="imageUrl" status="online" />
```

**Card:**
```html
<sk-card>
  <sk-card-header title="Card Title" />
  <sk-card-content>
    Your content here
  </sk-card-content>
  <sk-card-footer>
    Footer content
  </sk-card-footer>
</sk-card>
```

## Design System

### Colors

**Light Mode:**
- Primary: `#135bec`
- Background: `#f6f6f8`
- Surface: `#ffffff`
- Border: `#e0e0e0`
- Text: `#1f2937`

**Dark Mode:**
- Background: `#0a0f18`
- Surface: `#161b26`
- Border: `#232936`
- Text: `#f3f4f6`

### Typography

- **Font Family:** Inter (400, 500, 600, 700, 800, 900)
- **Icons:** Material Symbols Outlined
- **Responsive:** Auto-scales from mobile to desktop

### Dark Mode Toggle

```typescript
// Toggle dark mode
const html = document.documentElement;
html.classList.toggle('dark');

// Or set specific theme
html.classList.add('dark');    // Dark mode
html.classList.remove('dark'); // Light mode
```

All components automatically adapt to dark mode!

## Error Handling

The kit includes **global HTTP error handling** via a functional interceptor wired into the HTTP client:

```typescript
// app.config.ts
provideJwt({ ... }, [httpErrorInterceptor])
```

Errors automatically show as toasts with:
- ✅ Clear error messages from RFC 7807 `problem+json` responses
- ✅ Field-specific violations (e.g. `Email: must not be blank`)
- ✅ Support reference IDs for internal server errors
- ✅ Trace IDs for debugging
- ✅ Duration scaled by severity (500s show longer than 400s)

No need to handle errors per-component — `httpErrorInterceptor` catches everything!

## Reactive Forms with Validation

```typescript
protected readonly form = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]],
  age: ['', [Validators.required, Validators.min(18)]],
  terms: [false, Validators.requiredTrue],
});

protected onSubmit() {
  if (this.form.valid) {
    console.log(this.form.value);
  }
}
```

## Server-Side Operations

Built-in support for backend pagination, sorting, and filtering:

```typescript
// Table automatically handles:
// ✅ Pagination
// ✅ Column sorting
// ✅ Field searching
// ✅ Multi-field filtering
// ✅ Loading states
```

Just pass your API endpoint and the table handles everything!

## Architecture

### Standalone Components

Every component is standalone (`standalone: true`) for:
- Better tree-shaking
- Cleaner imports
- Smaller bundles
- Flexible composition

### OnPush Change Detection

All components use `ChangeDetectionStrategy.OnPush` for:
- Better performance
- Predictable reactivity
- Signal-based state management

### TypeScript First

Full type safety with:
- Properly typed inputs/outputs
- No `any` types
- JSDoc documentation
- IDE autocomplete

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest |
| Firefox | Latest |
| Safari | Latest |
| Edge | Latest |

## Performance

- **Bundle Size:** ~45KB gzipped (all components)
- **Load Time:** < 1s on 4G
- **Change Detection:** OnPush (optimal performance)
- **Tree-Shaking:** Only import what you use

## Accessibility (WCAG AA)

✅ Keyboard navigation
✅ Screen reader support
✅ ARIA labels & roles
✅ Focus management
✅ Color contrast compliance

## Contributing

Want to add a component or improve the kit?

1. Create a component in `src/app/components/`
2. Use standalone architecture
3. Add WCAG AA accessibility
4. Document with JSDoc
5. Test at mobile/tablet/desktop
6. Use Tailwind utilities

## Resources

- [Angular 21 Docs](https://angular.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Angular CDK](https://material.angular.io/cdk)
- [Material Symbols](https://fonts.google.com/icons)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/)

## License

MIT
