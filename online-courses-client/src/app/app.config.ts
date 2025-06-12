import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http'; // ייבוא withInterceptorsFromDi ו-withFetch
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations'; // אם אתה משתמש ב-Angular Material
import { HTTP_INTERCEPTORS } from '@angular/common/http'; // ייבוא HTTP_INTERCEPTORS
import { AuthInterceptor } from './auth.interceptor'; // ייבוא ה-Interceptor שלך

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(), // אם אתה משתמש ב-Angular Material
    // הוסף את ה-Interceptor כאן
    provideHttpClient(
      withInterceptorsFromDi(), // הפעלת תמיכה ב-DI עבור Interceptors
      withFetch() // מומלץ להשתמש ב-fetch API
    ),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};
