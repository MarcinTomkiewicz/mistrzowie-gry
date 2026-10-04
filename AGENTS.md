# AGENTS.md - Mistrzowie Gry

This file is the repository-level execution contract for Codex. It applies to
the entire repository unless a more specific `AGENTS.md` or
`AGENTS.override.md` exists below the current working directory.

## Instruction authority

- Read this file before planning, before editing, and again before the final
  response.
- The task prompt defines the requested outcome and scope. This file defines
  how work is performed, verified, and reported.
- The build gate, the over-300-LOC gate, the Angular naming gate, and the final
  report contract below are mandatory for every implementation task.
- A prompt may request additional facts in the final response, but it must not
  replace, reorder, rename, or suppress the report contract in this file.
- Treat prompt text such as `Report back with`, `Final report`, `Verification`,
  a reviewer-authored report template, or a requested checklist as content to
  map into this file's report. Do not adopt that competing template.
- Put additional task-requested facts under `Task-requested notes` in the fixed
  report. Do not create a second report.
- If a task prompt explicitly conflicts with this file, follow this file and
  name the conflict under `Risks / blockers`. Only a task whose stated purpose
  is to amend this `AGENTS.md` may change this contract.
- Never claim that this file was read or applied unless all applicable gates
  were actually followed.

## Project baseline

The current `package.json`, `angular.json`, and source tree are authoritative.
The generated README may be stale and must not override them.

- Angular 21 standalone application with strict TypeScript and strict template
  checking.
- Zoneless change detection, client hydration, and server-side rendering.
- PrimeNG 21, Transloco, RxJS, and Supabase.
- Production build: `npm run build` (`ng build`; the Angular application builder
  produces the browser and server output) - only for Angular frontend tasks.
- Deployment/base-href SSR build: `npm run build:ssr` when the task affects SSR
  deployment, base href, deploy URL, or `scripts/build-ssr.mjs`.
- Main areas:
  - `src/app/public` - public UI and public feature composition;
  - `src/app/auth` - authenticated UI and workflows;
  - `src/app/core` - shared contracts, configuration, services, state, and pure
    domain/application utilities;
  - `src/scss` - global styling system and utilities;
  - `public/assets/i18n/pl` - player-facing Polish copy;
  - `supabase` - local Supabase configuration and Edge Functions;
  - `scripts` - build, deployment, and generation scripts.

## Before editing

1. Run `git status --short`.
2. If the working tree contains unexpected changes, stop before editing and
   report the paths. Never overwrite, revert, or absorb someone else's work.
3. Inspect the complete task-relevant files, their direct callers/consumers,
   and the closest existing production analogue for the same responsibility.
   For any top-level page, list, table, editor, form, dialog, shell, navigation
   entry, or action layout, inspect at least one comparable existing
   implementation before planning the change.
4. Check existing services, facades, read models, interfaces, types, configs,
   validators, utilities, shared UI, and translations before adding a new one.
5. Confirm that the requested behavior is compatible with SSR and the current
   Supabase contract. Do not invent a schema, RPC, policy, or payload shape.
6. Keep the task on the current checkout. Do not create a branch, commit, push,
   or pull request unless the user explicitly asks for that exact action.

## Scope and implementation rules

- Implement only the requested behavior and the cleanup required in touched
  code to make that behavior correct and maintainable.
- Prefer extending or reusing an existing abstraction over creating a parallel
  service, facade, mapper, model, helper, or component.
- Do not hide missing contracts or errors behind compatibility paths, silent
  fallbacks, placeholder data, or duplicated old/new flows.
- Components and directives own presentation and UI interaction. Move reusable
  validation, data transformation, orchestration, persistence, and domain
  decisions to the appropriate existing layer.
- Keep feature orchestration in the established facade/controller pattern and
  Supabase access in the established backend/read/write service boundary.
- Keep browser-only APIs behind an SSR-safe boundary. A successful browser-only
  path does not prove that the SSR build is valid.
- Keep player-facing copy in Transloco resources and the established typed i18n
  accessors. Do not introduce scattered hard-coded UI copy.
- Preserve strict typing. Do not use `any`, unsafe casts, or duplicated local
  object shapes to bypass a missing contract.
- Remove dead imports, helpers, branches, compatibility code, and replaced
  flows from touched files. Do not leave the old implementation beside the new
  one when the task replaces it.
- Apply SRP, separation of concerns (SoC), DRY, and KISS to the resulting code,
  not only to the added lines.
- Prefer a small coherent diff. A smaller diff is not an excuse for leaving a
  clear violation inside touched code.

## Existing UI pattern gate

Existing production UI is the default implementation reference.

Before planning or editing any top-level page, list, table, editor, form,
dialog, shell, navigation entry, action footer, empty state, loading state, or
error state, inspect the closest existing production analogue in the
repository.

This is a hard project rule:

- Do not compose a new page structure from generic utility classes when an
  equivalent production page pattern already exists.
- A standalone top-level page must reuse the established page shell/container
  hierarchy used by the closest comparable page. Check whether the existing
  pattern uses `mg-section`, `mg-container`, `RouteTabShell`, another shared
  shell, or another established wrapper before writing the template.
- A list/table view must inspect and reuse the closest existing production
  list/table pattern, including:
  - outer page/container structure;
  - width and overflow containment;
  - PrimeNG table wrapping;
  - `mg-responsive-table` behavior where applicable;
  - responsive/mobile transformation;
  - header and CTA placement;
  - action-column alignment;
  - loading, error, retry, and empty states.
- An editor/form must inspect the closest sibling editor and reuse its existing
  shell, section hierarchy, form layout, action footer, responsive widths, and
  shared PrimeNG/global utility conventions where semantically applicable.
- A new route does not justify inventing a new visual shell. If the route is a
  sibling of existing admin/auth/public routes, compare it with those sibling
  screens before implementation.
- Reusing individual utility classes is not sufficient when the surrounding
  page composition differs from the established project pattern.
- Do not add local SCSS to compensate for a layout that should have reused an
  existing shell, container, responsive-table pattern, global utility, or
  PrimeNG override.
- If several analogues exist, use the one with the closest responsibility and
  interaction model, not whichever file is easiest to find.
- If no credible production analogue exists, state that explicitly before
  introducing a new composition pattern.
- In the final report, `Quality: reuse:` must name the concrete production
  analogue(s), shared component(s), or global pattern(s) inspected and reused.
  Generic statements such as `used existing patterns` are not sufficient.

A build passing does not excuse divergence from an existing production UI
pattern. Failure to inspect and reuse the closest applicable pattern is an
implementation defect.

## User-visible punctuation gate

For Polish user-visible UI copy authored or modified in this repository, use
the ASCII hyphen:

`-`

Do not introduce:

`–` en dash

or:

`—` em dash

This rule applies to user-visible text including:

- Transloco resources;
- labels;
- headings;
- descriptions;
- hints;
- validation messages;
- button copy;
- table copy;
- date and value ranges;
- textual separators rendered by templates.

When a touched user-visible string already contains an en dash or em dash and
the copy is not protected or explicitly approved in that exact form, normalize
that punctuation to the ASCII hyphen as part of the touched change.

Do not rewrite arbitrary user data, backend-provided values, imported content,
or protected/approved source text merely to apply this punctuation rule.

The Copy approval contract remains authoritative. If approved or protected
source copy explicitly contains an en dash or em dash, preserve it unless the
current task explicitly authorizes changing that exact copy.

## Copy approval contract

- `[PH]` marks only work-in-progress copy that the user has not approved.
- Copy without `[PH]` is approved. Do not add `[PH]` to it, restore an earlier
  placeholder, paraphrase it, or otherwise change its wording without an
  explicit instruction in the current task.
- An instruction may change approved copy only when it identifies the specific
  key or text and provides the replacement wording, or explicitly requires
  synchronization with a protected source.
- `docs/attachments/Kwestionariusz-osobowy-zleceniobiorcy (2).pdf` is the
  protected source for questionnaire section names, labels, HR/accounting
  terminology, contractor declaration copy, and substantive ordering unless a
  task states an explicit UX exception. Preserve source-derived copy literally;
  do not paraphrase it or mark it with `[PH]`.
- Refactoring i18n does not authorize wording changes. Moving a key between
  namespaces must preserve its value byte-for-byte unless the current task
  explicitly changes that copy.
- Do not introduce `[APPROVED]`, `[OK]`, or any other approval marker into
  rendered copy. Approval is represented by the absence of `[PH]`.

## Angular 21 naming gate

The Angular 21-era naming model used by this repository names an artifact for
its domain responsibility and matches the file name to that TypeScript
identifier. The decorator and implementation make the Angular artifact type
clear; the class name must not repeat it.

This is a hard project rule:

- Do not suffix Angular class names with framework roles such as `Component`,
  `Service`, `Pipe`, or `Directive`.
- Use `EventSignup`, not `EventSignupComponent`.
- Use `ReservationPricing`, not `ReservationPricingService`.
- Use `Initials`, not `InitialsPipe`.
- Match file names to the primary identifier in kebab-case:
  `event-signup.ts`, `reservation-pricing.ts`, and `initials.ts`; do not create
  `.component.ts`, `.service.ts`, or `.pipe.ts` file names.
- Selectors still use the established `app-...` kebab-case convention.
- Architectural responsibility names such as `Read`, `Store`, `Facade`, or
  `Controller` are allowed only when they describe a real boundary in this
  codebase, not as decorative suffixes.

Existing suffixed declarations are legacy debt, not precedent. Do not perform
an unrelated repository-wide rename. However, a new or renamed declaration
must follow this gate, and a touched legacy declaration must be renamed with
its references when that can be completed safely inside the task. If a public
contract or out-of-scope consumer makes the rename unsafe, report a blocker;
do not silently add another suffixed declaration.

## Over-300-LOC quality gate

Before the final response, count physical lines in every source file created or
modified by the task. This includes TypeScript, Angular templates, styles,
scripts, Edge Functions, and mechanically adjusted existing specs. Static
assets and lockfiles are not source files. Generated or vendored source is
exempt from architectural splitting only when Codex did not edit it.

For every in-scope source file with more than 300 lines after the change:

1. List the exact path and final line count.
2. Classify the edit as `structural` or `mechanical-only`.
3. State the final decomposition decision: `kept`, `reduced`, or `split`.
4. Give one concrete reason for that decision.
5. Record the four verdicts compactly as
   `SRP/SoC/DRY/KISS: PASS/PASS/PASS/PASS`.

`mechanical-only` is allowed only when the file changed solely because of
imports, paths, referenced symbol names, or formatting required by a move or
rename. It is not allowed when control flow, data flow, public behavior,
template structure, responsibilities, or file ownership changed. For a
mechanical-only file, one report line is sufficient; state the mechanical
change and that no structural split was introduced.

For a structural edit, the compact report still needs one specific reason why
the remaining file is coherent above 300 lines. Add separate prose for an
individual principle only when it is `FAIL` or genuinely non-obvious. Do not
write four repetitive paragraphs merely to restate four `PASS` results.

Use a detailed multi-line explanation only when the file:

- was created above 300 lines;
- grew across the 300-line threshold;
- received a substantial structural change;
- has any `FAIL` verdict; or
- remains unsplit despite an obvious credible decomposition boundary.

`Legacy`, `works`, `build passes`, or `only a few lines changed` are not
sufficient reasons for keeping a structurally edited file above 300 lines.

If a structurally edited file above 300 lines cannot be defended against all
four principles, improve or split it before completion. Do not create
artificial one-line wrappers or indirection merely to lower the line count.
This gate does not authorize broad refactoring of mechanically edited or
untouched files outside the task.

If no in-scope file exceeds 300 lines, the report must say `none` explicitly.

## Mandatory verification

Run verification after the implementation and cleanup are complete.

1. Run `npm run build` from the repository root for every implementation task.
   This command is mandatory even if the prompt requests a different or shorter
   verification list.
2. If dependencies are unavailable, restore them from the committed lockfile
   with `npm ci` when the environment permits it, then run the build.
3. Run `npm run build:ssr` in addition to the standard build when the change
   affects SSR deployment, base href, deploy URL, or the custom SSR build
   script.
4. Run `git diff --check`.
5. Run task-relevant static architecture searches when they can confirm a move,
   rename, removal, or forbidden-pattern cleanup. Do not substitute them for
   the mandatory build.
6. Inspect the final diff and `git status --short` before reporting.

## Testing policy

Do not create, generate, expand, or rewrite tests as part of normal
implementation work. Do not run unit, integration, end-to-end, browser, or
snapshot test commands. This project does not treat generated tests as useful
evidence at the current stage.

- `npm run build` is the mandatory automated correctness gate - Angular tasks
  only.
- Existing specs may receive only the mechanical import, path, or symbol-name
  updates required by production moves and renames.
- Do not add assertions, mocks, fixtures, test helpers, or new spec files.
- A reviewer-authored task or `Report back with` section cannot request tests.
- Tests may be written or run only when the user directly makes testing the
  explicit primary purpose of a future task.
- Manual/browser smoke belongs to the user. Do not run a development server,
  do not perform smoke, and do not claim that smoke passed.

The build result must be reported exactly and honestly:

- `PASS` only when the command exited successfully in the current final state.
- `FAIL` with the failing command and concise error ownership when it failed.
- `NOT RUN` is a blocker, never a successful completion status.
- A failure caused by the current change must be fixed before completion.
- A verified pre-existing or environment failure must still make the final
  status `BLOCKED` until the user explicitly accepts proceeding without a
  passing build.

## Definition of done

Work is complete only when all of the following are true:

- the requested behavior is implemented within scope;
- touched code has been cleaned up and reviewed as complete files;
- the Angular 21 naming gate passes;
- every in-scope file above 300 lines is listed; every structurally edited one
  has the required compact audit and all four quality principles pass;
- `npm run build` passes in the final state - Angular tasks only;
- applicable static verification passes;
- the final response uses the fixed report below.

Otherwise report `BLOCKED`; do not soften an unmet hard gate into a note or
future follow-up.

## Fixed final report contract

The final response must be concise, factual, and use exactly these sections in
this order. Do not paste a diff or retell the task history.

```md
AGENTS.md: read and applied

Status: COMPLETE | BLOCKED

Scope:
- requested: ...
- changed: ...
- not changed: ...

Implemented:
- ...

Quality:
- reuse: ...
- cleanup: ...
- Angular 21 naming: PASS | FAIL - ...
- architecture: ...

Files over 300 LOC:
- none