import { Component, computed, effect, input } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';

import { ADMIN_OPERATIONAL_VERSION_LIMITS } from '../../../../core/configs/admin-coworker-operational-documents.config';
import { IAdminOperationalCatalog } from '../../../../core/interfaces/i-admin-operational-catalog';
import { AdminOperationalTargetForm } from '../../../../core/types/admin-operational-forms';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { createAppRoleOptions } from '../../../../core/utils/app-role-labels';
import { resolveEdgeFormFieldError } from '../../../../core/utils/form-controls';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import {
  createAdminOperationalTargetForm,
  activeAdminOperationalCoworkerIds,
  refreshTargetCoworkerValidators,
  resetAdminOperationalTargetSelector,
} from './target-form';

@Component({
  selector: 'app-admin-operational-target-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    SelectModule,
    ContextHelp,
  ],
  templateUrl: './target-editor.html',
})
export class TargetEditor {
  readonly targets = input.required<FormArray<AdminOperationalTargetForm>>();
  readonly catalog = input.required<IAdminOperationalCatalog>();
  readonly error = input<EdgeFunctionError | null>(null);
  readonly disabled = input(false);

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly targetLimit = ADMIN_OPERATIONAL_VERSION_LIMITS.targetCount;
  protected readonly kindOptions = computed(() =>
    this.catalog().targetKinds.map((value) => ({
      value,
      label: this.i18n.statuses().targetKinds[value],
    })),
  );
  protected readonly roleOptions = computed(() =>
    createAppRoleOptions(this.i18n.appRoles(), this.catalog().appRoles),
  );
  protected readonly coworkerOptions = computed(() =>
    this.catalog().coworkers.map((coworker) => ({
      value: coworker.userId,
      label: coworker.firstName === null
        ? coworker.email
        : `${coworker.firstName} - ${coworker.email}`,
      disabled: !coworker.accessEnabled,
    })),
  );
  protected readonly eventOptions = computed(() =>
    this.catalog().eventDefinitions.map((eventDefinition) => ({
      value: eventDefinition.id,
      label: `${eventDefinition.name} - ${eventDefinition.key}`,
    })),
  );

  constructor() {
    effect(() =>
      refreshTargetCoworkerValidators(this.targets(), this.catalog()),
    );
  }

  protected addTarget(): void {
    const targets = this.targets();
    if (this.disabled() || targets.length >= this.targetLimit) return;
    targets.push(createAdminOperationalTargetForm(
      null,
      activeAdminOperationalCoworkerIds(this.catalog()),
    ));
    targets.markAsDirty();
  }

  protected removeTarget(index: number): void {
    if (this.disabled()) return;
    const targets = this.targets();
    targets.removeAt(index);
    targets.markAsDirty();
  }

  protected targetKindChanged(index: number): void {
    resetAdminOperationalTargetSelector(this.targets().controls[index]!);
  }

  protected fieldError(index: number, field: string): string | null {
    const target = this.targets().controls[index]!;
    const serverPath = `configuration.targets.${index}.${field}`;
    if (
      field === 'userId' &&
      target.controls.userId.hasError('activeCoworker') &&
      !this.error()?.fieldErrors[serverPath]
    ) {
      return this.i18n.validation().inactiveCoworkerTarget;
    }
    return resolveEdgeFormFieldError(
      target.get(field)!,
      serverPath,
      this.error(),
      this.i18n.commonForm(),
      target.touched && target.invalid,
    );
  }

  protected rowError(index: number): string | null {
    return this.error()?.fieldErrors[`configuration.targets.${index}`] ?? null;
  }
}
