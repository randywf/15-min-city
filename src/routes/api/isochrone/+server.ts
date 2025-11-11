import type { RequestHandler } from '@sveltejs/kit';
import { XMLHttpRequest } from 'xmlhttprequest';
import { OPENROUTESERVICE_API_KEY } from '$env/static/private';

interface IsochroneRequest {
  locations: [number, number][];
  range: number[];
  profile: 'foot-walking' | 'cycling-regular' | 'wheelchair';
}

export const POST: RequestHandler = async({ request }: { request: Request }) => {
  const body: IsochroneRequest = await request.json();

  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', `https://api.openrouteservice.org/v2/isochrones/${body.profile}`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
    xhr.setRequestHeader('Authorization', OPENROUTESERVICE_API_KEY);

    xhr.onload = () => {
      const status = xhr.status ?? 200;
      const text = xhr.responseText ?? '';

      resolve(new Response(text, {
        status,
        headers: { 'Content-Type': 'application/json' }
      }))
    };

    xhr.onerror = () => {
      reject(new Error('Failed to fetch isochrone'));
    };

    xhr.send(JSON.stringify(body));
  });
}
