// src/app/auth/teacher.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, combineLatest } from 'rxjs'; // ייבוא combineLatest
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators'; // ייבוא map ו-take

@Injectable({
  providedIn: 'root'
})
export class TeacherGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // בודק אם המשתמש מחובר וגם אם תפקידו הוא 'teacher'
    return combineLatest([
      this.authService.userId$, // בודק אם יש userId (כלומר, מחובר)
      this.authService.currentUserRole$ // בודק מה התפקיד
    ]).pipe(
      take(1), // לוקח את הערך הנוכחי ומשלים את ה-Observable
      map(([userId, role]) => {
        if (userId !== null && role === 'teacher') {
          // המשתמש מחובר וגם מורה
          return true;
        } else {
          // לא מחובר, או מחובר אבל לא מורה.
          // נווט לדף גישה אסורה או לדף הבית עם הודעה.
          // נניח שיש לך נתיב '/access-denied' או פשוט נווט לדף הבית.
          this.router.navigate(['/home']); // או '/access-denied' אם יש לך כזה
          return false;
        }
      })
    );
  }
}
