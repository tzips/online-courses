import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // קבל את הטוקן מ-localStorage
    const authToken = localStorage.getItem('token');

    // אם קיים טוקן, שכפל את הבקשה והוסף את כותרת ה-Authorization
    if (authToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}` // פורמט נפוץ: Bearer Token
        }
      });
    }

    // המשך את הבקשה
    return next.handle(request);
  }
}
