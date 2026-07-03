import { TestBed } from '@angular/core/testing';
import {
  PostgrestError,
  PostgrestSingleResponse,
  SupabaseClient,
} from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';

import { Supabase } from '../supabase/supabase';

import { Backend } from './backend';

describe('Backend', () => {
  let service: Backend;
  let supabaseClient: jasmine.SpyObj<Pick<SupabaseClient, 'rpc'>>;

  beforeEach(() => {
    supabaseClient = jasmine.createSpyObj<Pick<SupabaseClient, 'rpc'>>(
      'SupabaseClient',
      ['rpc'],
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Supabase,
          useValue: {
            client: () => supabaseClient,
          },
        },
      ],
    });
    service = TestBed.inject(Backend);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('calls supabase rpc with function name and args', async () => {
    const args = { p_slug: 'testowy-artykul' };
    supabaseClient.rpc.and.resolveTo(success({ id: 'article-1' }));

    await firstValueFrom(service.rpc('get_article', args));

    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_article', args);
  });

  it('calls supabase rpc without args', async () => {
    supabaseClient.rpc.and.resolveTo(success([]));

    await firstValueFrom(service.rpc('get_articles'));

    expect(supabaseClient.rpc).toHaveBeenCalledWith('get_articles', undefined);
  });

  it('returns rpc data', async () => {
    const data = [{ id: 'article-1' }];
    supabaseClient.rpc.and.resolveTo(success(data));

    const result = await firstValueFrom(
      service.rpc<Array<{ id: string }>>('get_articles'),
    );

    expect(result).toBe(data);
  });

  it('does not camel-case rpc data', async () => {
    const data = { hero_image_path: 'raw-value' };
    supabaseClient.rpc.and.resolveTo(success(data));

    const result = await firstValueFrom(
      service.rpc<{ hero_image_path: string }>('get_article'),
    );

    expect(result).toEqual({ hero_image_path: 'raw-value' });
  });

  it('throws when rpc returns an error', async () => {
    supabaseClient.rpc.and.resolveTo(failure('RPC failed'));

    await expectAsync(
      firstValueFrom(service.rpc('get_articles')),
    ).toBeRejectedWithError('RPC failed');
  });

  it('does not snake-case p_payload', async () => {
    const payload = {
      heroImagePath: 'content/articles/article-1/hero.png',
      seoDescription: 'SEO description',
    };
    supabaseClient.rpc.and.resolveTo(success({ id: 'article-1' }));

    await firstValueFrom(
      service.rpc('save_admin_content_article', { p_payload: payload }),
    );

    expect(supabaseClient.rpc).toHaveBeenCalledWith(
      'save_admin_content_article',
      { p_payload: payload },
    );
  });
});

function success<T>(data: T): PostgrestSingleResponse<T> {
  return {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  };
}

function failure<T>(message: string): PostgrestSingleResponse<T> {
  return {
    data: null,
    error: {
      message,
      details: '',
      hint: '',
      code: 'P0001',
      name: 'PostgrestError',
    } as PostgrestError,
    count: null,
    status: 400,
    statusText: 'Bad Request',
  };
}
