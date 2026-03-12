import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContactPayload } from '../../../../../core/types/contact';



type ContactResponse = {
  ok: boolean;
  error?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ContactApi {
  private readonly http = inject(HttpClient);

  send(payload: ContactPayload): Observable<ContactResponse> {
    return this.http.post<ContactResponse>('/api/contact', payload);
  }
}