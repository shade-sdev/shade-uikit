import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { JwtService } from './jwt.service';

/**
 * Structural directive that conditionally renders its host element based on
 * whether the current user has at least one of the required roles/permissions.
 *
 * Roles and permissions are merged transparently — use either interchangeably.
 *
 * ---
 *
 * **Single role/permission:**
 * ```html
 * <button *skHasRole="'ADMIN'">Delete</button>
 * ```
 *
 * **Any of multiple roles (OR logic):**
 * ```html
 * <div *skHasRole="['COMPANY_READ', 'COMPANY_WRITE']">
 *   Company section
 * </div>
 * ```
 *
 * **With else template:**
 * ```html
 * <div *skHasRole="'ADMIN'; else noAccess">Admin content</div>
 * <ng-template #noAccess>
 *   <p>You do not have access.</p>
 * </ng-template>
 * ```
 *
 * The directive is reactive — if the user's roles change (e.g. after a token
 * refresh that grants new permissions) the view updates automatically.
 */
@Directive({
  selector: '[skHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly jwt          = inject(JwtService);
  private readonly templateRef  = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  /** Required role(s). A single string or an array — OR logic applies. */
  readonly skHasRole = input<string | string[]>([]);

  /** Optional template to render when the user does NOT have access. */
  readonly skHasRoleElse = input<TemplateRef<unknown> | null>(null);

  constructor() {
    effect(() => {
      const required  = this.skHasRole();
      const roles     = Array.isArray(required) ? required : [required];
      const userRoles = this.jwt.roles();
      const hasAccess = roles.length === 0 || roles.some(r => userRoles.includes(r));

      this.viewContainer.clear();

      if (hasAccess) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        const elseRef = this.skHasRoleElse();
        if (elseRef) {
          this.viewContainer.createEmbeddedView(elseRef);
        }
      }
    });
  }
}
