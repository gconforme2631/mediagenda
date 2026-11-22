// Actualiza el estado de la API según el resultado de cada petición.
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoApiService } from './estado-api.service';

export const apiCaidaInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const estadoApi = inject(EstadoApiService);

  return next(req).pipe(
    tap({
      next: (evento) => {
        if (evento instanceof HttpResponse) estadoApi.marcar(true);
      },
      error: (error: unknown) => {
        // 0: sin conexión; 503: API sin acceso a la base de datos
        if (error instanceof HttpErrorResponse && (error.status === 0 || error.status === 503)) {
          estadoApi.marcar(false);
        }
      },
    }),
  );
};