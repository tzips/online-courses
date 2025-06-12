// src/app/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators'; // ייבוא map ו-take

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // שימוש ב-Observable של userId$ כדי לבדוק אם המשתמש מחובר
    return this.authService.userId$.pipe(
      take(1), // לוקח את הערך הנוכחי ומשלים את ה-Observable
      map(userId => {
        if (userId !== null) {
          // המשתמש מחובר
          // אם ה-route דורש תפקיד ספציפי (לדוגמה, TeacherGuard), זה יטופל ב-Guard נפרד
          return true;
        } else {
          // המשתמש אינו מחובר, נווט לדף התחברות
          this.router.navigate(['/login']); // נניח שיש לך נתיב /login
          return false;
        }
      })
    );
  }
}