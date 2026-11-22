// Configuración global de la aplicación: router, cliente HTTP e interceptores.
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { apiCaidaInterceptor } from './shared/estado-api/api-caida.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()), // :id de la ruta como input del componente
    provideHttpClient(withFetch(), withInterceptors([apiCaidaInterceptor])),
  ],
};