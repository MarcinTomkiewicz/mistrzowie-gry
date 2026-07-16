import { request as requestHttp } from 'node:http';
import { request as requestHttps } from 'node:https';

const USER_AGENT = 'MistrzowieGrySeoAudit/1.0';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 5;

export function fetchText(url, hostHeader) {
  return requestText(
    new URL(url),
    hostHeader,
    MAX_REDIRECTS,
    Date.now() + REQUEST_TIMEOUT_MS,
  );
}

function requestText(url, hostHeader, redirectsRemaining, deadline) {
  const headers = {
    accept: 'text/html,application/xml;q=0.9,*/*;q=0.8',
    'user-agent': USER_AGENT,
  };

  if (hostHeader) {
    headers.host = hostHeader;
  }

  const remainingTime = deadline - Date.now();

  if (remainingTime <= 0) {
    return Promise.reject(
      new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`),
    );
  }

  const request =
    url.protocol === 'https:'
      ? requestHttps
      : url.protocol === 'http:'
        ? requestHttp
        : null;

  if (!request) {
    return Promise.reject(
      new Error(`Unsupported redirect protocol: ${url.protocol}`),
    );
  }

  return new Promise((resolve, reject) => {
    let outgoing;
    const timeout = setTimeout(() => {
      outgoing?.destroy(
        new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`),
      );
    }, remainingTime);
    const fail = (error) => {
      clearTimeout(timeout);
      reject(error);
    };

    outgoing = request(url, { headers }, (response) => {
      const status = response.statusCode ?? 0;
      const location = getHeader(response.headers.location);

      if (isRedirect(status) && location) {
        clearTimeout(timeout);
        response.resume();

        if (redirectsRemaining === 0) {
          reject(new Error(`Too many redirects for ${url.toString()}`));
          return;
        }

        let redirectUrl;

        try {
          redirectUrl = new URL(location, url);
        } catch {
          reject(new Error(`Invalid redirect location: ${location}`));
          return;
        }

        resolve(
          requestText(
            redirectUrl,
            hostHeader,
            redirectsRemaining - 1,
            deadline,
          ),
        );
        return;
      }

      const chunks = [];

      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      response.once('error', fail);
      response.once('end', () => {
        clearTimeout(timeout);
        resolve({
          status,
          finalUrl: url.toString(),
          contentType: getHeader(response.headers['content-type']),
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });

    outgoing.once('error', fail);
    outgoing.end();
  });
}

function isRedirect(status) {
  return [301, 302, 303, 307, 308].includes(status);
}

function getHeader(value) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
