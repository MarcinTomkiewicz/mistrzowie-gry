import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { EventProgramItemSourceKind } from '../../enums/event';
import {
  IHostEventCatalogItem,
  IHostEventEdition,
} from '../../interfaces/i-event-catalog';
import { IEventOccurrence } from '../../interfaces/i-event-occurence';
import { IEventProgramItem } from '../../interfaces/i-event-program-item';
import {
  IEventSignupLoadData,
  IEventSignupOccurrenceVm,
  IEventSignupPageData,
  IEventSignupResourcesData,
  IEventSignupScreenData,
} from '../../interfaces/i-event-signup';
import { IOccurrenceSwitcherOption } from '../../interfaces/i-occurrence-switcher';
import { ISessionWithRelations } from '../../interfaces/i-session';
import { IUser } from '../../interfaces/i-user';
import {
  EventSignupAccessState,
  HOST_SIGNUP_OCCURRENCE_STATUSES,
} from '../../types/event-signup';
import { formatDateLabel } from '../../utils/date';
import { hasMinimumRole } from '../../utils/roles';
import { Auth } from '../../services/auth/auth';
import { EventSignup } from '../../services/event-signup/event-signup';
import { GmSessions } from '../../services/gm-sessions/gm-sessions';
import { SessionRead } from '../sessions/session-read';
import { EventProgramRead } from './event-program-read';
import { EventRead } from './event-read';

@Injectable({ providedIn: 'root' })
export class EventSignupRead {
  private readonly auth = inject(Auth);
  private readonly eventProgramRead = inject(EventProgramRead);
  private readonly eventRead = inject(EventRead);
  private readonly eventSignup = inject(EventSignup);
  private readonly gmSessions = inject(GmSessions);
  private readonly sessionRead = inject(SessionRead);

  getOccurrenceVms(
    editionId: string,
    startIso: string,
    endIso: string,
  ): Observable<IEventSignupOccurrenceVm[]> {
    return this.getOccurrences(editionId, startIso, endIso).pipe(
      switchMap((occurrences) => {
        if (!occurrences.length) {
          return of([] as IEventSignupOccurrenceVm[]);
        }

        const user = this.auth.user();

        return forkJoin(
          occurrences.map((occurrence) =>
            this.getSignupData(editionId, occurrence.id).pipe(
              map(({ signupCount, mySignup }) => {
                const accessState = this.resolveAccessState(
                  occurrence,
                  user,
                  signupCount,
                  mySignup,
                );

                return {
                  occurrence,
                  label: formatDateLabel(
                    occurrence.occurrenceDate,
                    'pl-PL',
                    true,
                  ),
                  signupCount,
                  isFull: signupCount >= occurrence.slotCapacity,
                  mySignup,
                  canOpen: accessState === 'allowed',
                } satisfies IEventSignupOccurrenceVm;
              }),
            ),
          ),
        );
      }),
    );
  }

  getFormScreenData(
    eventSlug: string,
    occurrenceDate: string,
    startIso: string,
    endIso: string,
  ): Observable<IEventSignupScreenData> {
    return this.eventRead.getHostCatalog().pipe(
      switchMap((catalog) => {
        const context = this.findEditionBySlug(catalog, eventSlug);

        if (!context) {
          return of({
            data: this.createEmptyLoadData(),
            occurrenceOptions: [],
          } satisfies IEventSignupScreenData);
        }

        return forkJoin({
          data: this.getFormLoadData(
            context.core,
            context.edition,
            occurrenceDate,
          ),
          occurrenceOptions: this.getOccurrenceOptions(
            context.edition.id,
            startIso,
            endIso,
          ),
        });
      }),
    );
  }

  createEmptyLoadData(): IEventSignupLoadData {
    return {
      page: {
        core: null,
        edition: null,
        occurrence: null,
        mySignup: null,
        submittedSession: null,
        signupCount: 0,
        accessState: null,
      },
      resources: this.createEmptyResources(),
    };
  }

  private getFormLoadData(
    core: IHostEventCatalogItem,
    edition: IHostEventEdition,
    occurrenceDate: string,
  ): Observable<IEventSignupLoadData> {
    return this.eventRead.getOccurrenceByDate(edition.id, occurrenceDate).pipe(
      switchMap((occurrence) => {
        if (!occurrence) {
          const empty = this.createEmptyLoadData();

          return of({
            ...empty,
            page: {
              ...empty.page,
              core,
              edition,
            },
          } satisfies IEventSignupLoadData);
        }

        const user = this.auth.user();

        return this.getSignupData(edition.id, occurrence.id).pipe(
          switchMap((signup) => {
            const accessState = this.resolveAccessState(
              occurrence,
              user,
              signup.signupCount,
              signup.mySignup,
            );
            const page = {
              core,
              edition,
              occurrence,
              mySignup: signup.mySignup,
              submittedSession: null,
              signupCount: signup.signupCount,
              accessState,
            } satisfies IEventSignupPageData;

            if (accessState !== 'allowed') {
              return of({
                page,
                resources: this.createEmptyResources(),
              } satisfies IEventSignupLoadData);
            }

            return this.getResources().pipe(
              map(
                (resources) =>
                  ({
                    page: {
                      ...page,
                      submittedSession: this.resolveSubmittedSession(
                        signup.mySignup,
                        resources,
                      ),
                    },
                    resources,
                  }) satisfies IEventSignupLoadData,
              ),
            );
          }),
        );
      }),
    );
  }

  private getOccurrences(
    editionId: string,
    startIso: string,
    endIso: string,
  ): Observable<IEventOccurrence[]> {
    return this.eventRead.getOccurrencesInRange(
      editionId,
      startIso,
      endIso,
      [...HOST_SIGNUP_OCCURRENCE_STATUSES],
    );
  }

  private getSignupData(editionId: string, occurrenceId: string) {
    return forkJoin({
      signupCount:
        this.eventProgramRead.getActiveHostSignupCountByOccurrenceId(
          occurrenceId,
        ),
      mySignup: this.eventSignup.getMySignup({
        eventId: editionId,
        occurrenceId,
      }),
    });
  }

  private getResources(): Observable<IEventSignupResourcesData> {
    const userId = this.auth.userId();

    return forkJoin({
      templateSessions: userId
        ? this.sessionRead.getSessionsByGmProfileId(userId, 'template')
        : of([]),
      customSessions: userId
        ? this.sessionRead.getSessionsByGmProfileId(userId, 'custom')
        : of([]),
      systems: this.gmSessions.getAvailableSystems(),
      styles: this.gmSessions.getAvailableStyles(),
      triggers: this.gmSessions.getAvailableTriggers(),
      languages: this.gmSessions.getAvailableLanguages(),
    });
  }

  private createEmptyResources(): IEventSignupResourcesData {
    return {
      templateSessions: [],
      customSessions: [],
      systems: [],
      styles: [],
      triggers: [],
      languages: [],
    };
  }

  private getOccurrenceOptions(
    editionId: string,
    startIso: string,
    endIso: string,
  ): Observable<IOccurrenceSwitcherOption[]> {
    return this.getOccurrences(editionId, startIso, endIso).pipe(
      map((occurrences) =>
        occurrences.map((occurrence) => ({
          id: occurrence.id,
          label: occurrence.occurrenceDate,
          occurrenceDate: occurrence.occurrenceDate,
        })),
      ),
    );
  }

  private findEditionBySlug(
    catalog: IHostEventCatalogItem[],
    eventSlug: string,
  ): {
    core: IHostEventCatalogItem;
    edition: IHostEventEdition;
  } | null {
    const core = catalog.find((item) =>
      item.editions.some((edition) => edition.slug === eventSlug),
    );
    const edition = core?.editions.find((item) => item.slug === eventSlug);

    return core && edition ? { core, edition } : null;
  }

  private resolveAccessState(
    occurrence: IEventOccurrence,
    user: IUser | null,
    signupCount: number,
    mySignup: IEventProgramItem | null,
  ): EventSignupAccessState {
    if (!HOST_SIGNUP_OCCURRENCE_STATUSES.includes(occurrence.status)) {
      return 'closed';
    }

    if (hasMinimumRole(user, 'admin')) {
      return 'allowed';
    }

    if (!hasMinimumRole(user, 'gm')) {
      return 'forbidden';
    }

    if (signupCount >= occurrence.slotCapacity && !mySignup) {
      return 'full';
    }

    return 'allowed';
  }

  private resolveSubmittedSession(
    signup: IEventProgramItem | null,
    resources: IEventSignupResourcesData,
  ): ISessionWithRelations | null {
    if (!signup) {
      return null;
    }

    switch (signup.sourceKind) {
      case EventProgramItemSourceKind.GmSessionTemplate:
        if (!signup.gmSessionTemplateId) {
          throw new Error(
            `[EVENT_SIGNUP_READ] Signup "${signup.id}" has template source without gmSessionTemplateId.`,
          );
        }

        const templateSession = resources.templateSessions.find(
          (session) => session.id === signup.gmSessionTemplateId,
        );

        if (!templateSession) {
          throw new Error(
            `[EVENT_SIGNUP_READ] Missing template session "${signup.gmSessionTemplateId}" for signup "${signup.id}".`,
          );
        }

        return templateSession;
      case EventProgramItemSourceKind.CustomSession:
        if (!signup.customSessionId) {
          throw new Error(
            `[EVENT_SIGNUP_READ] Signup "${signup.id}" has custom source without customSessionId.`,
          );
        }

        const customSession = resources.customSessions.find(
          (session) => session.id === signup.customSessionId,
        );

        if (!customSession) {
          throw new Error(
            `[EVENT_SIGNUP_READ] Missing custom session "${signup.customSessionId}" for signup "${signup.id}".`,
          );
        }

        return customSession;
      default:
        throw new Error(
          `[EVENT_SIGNUP_READ] Unsupported source "${signup.sourceKind}" for signup "${signup.id}".`,
        );
    }
  }
}
