// src/app/user-profile/user-profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { CourseService } from '../services/course.service';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces/user.interface';
import { Course } from '../interfaces/course.interface';
import { Observable, Subscription, combineLatest, of, forkJoin } from 'rxjs';
import { switchMap, catchError, tap, filter } from 'rxjs/operators'; // הוספנו filter
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog'; // ייבוא MatDialog
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'; // ייבוא דיאלוג האישור
// נניח שזו קומפוננטת הדיאלוג החדשה לעריכת משתמש, ניצור אותה בהמשך
import { EditUserDialogComponent } from '../edit-user-profile/edit-user-profile.component';


@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {

  user$: Observable<User | undefined>;
  displayedCourses$: Observable<Course[]>;
  isLoading: boolean = true;
  error: string | null = null;
  private subscriptions: Subscription = new Subscription();
  currentUserId: number | null = null;
  currentUserRole: string | null = null;

  constructor(
    private userService: UserService,
    private courseService: CourseService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog // הזרקת MatDialog
  ) {
    this.user$ = of(undefined);
    this.displayedCourses$ = of([]);
  }

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([
        this.authService.userId$,
        this.authService.currentUserRole$
      ]).pipe(
        tap(([authUserId, authRole]) => {
          this.currentUserId = authUserId;
          this.currentUserRole = authRole;

          if (authUserId === null) {
            this.error = 'אינך מחובר/ת. אנא התחבר/י כדי לצפות בפרופיל.';
            this.snackBar.open(this.error, 'סגור', { duration: 5000 });
            this.isLoading = false;
            this.router.navigate(['/login']);
            return;
          }
          this.isLoading = true;
          this.error = null;
        }),
        switchMap(([authUserId, authRole]) => {
          const getUser$ = this.userService.getUser(authUserId!);

          let getCourses$: Observable<Course[]>;
          if (authRole === 'student') {
            getCourses$ = this.courseService.getEnrolledCoursesByStudent(authUserId!);
          } else {
            getCourses$ = of([]);
          }

          return forkJoin([
            getUser$,
            getCourses$
          ]).pipe(
            tap(([user, courses]) => {
              if (!user) {
                this.error = 'משתמש לא נמצא או שגיאה בטעינת הנתונים.';
                this.snackBar.open(this.error, 'סגור', { duration: 5000 });
              }
              this.user$ = of(user);
              this.displayedCourses$ = of(courses);
            }),
            catchError(err => {
              this.error = 'נכשל בטעינת נתוני משתמש או קורסים: ' + (err.error?.message || err.message);
              this.snackBar.open(this.error, 'סגור', { duration: 5000 });
              return of([undefined, []]);
            })
          );
        })
      ).subscribe(data => {
        this.isLoading = false;
      })
    );
  }

  // פונקציה חדשה לעדכון פרופיל
  onEditProfile(user: User): void {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '500px',
      data: { user: { ...user } } // העבר עותק של אובייקט המשתמש לדיאלוג
    });

    this.subscriptions.add(
      dialogRef.afterClosed().pipe(
        filter(result => !!result), // אם התוצאה היא אמתית (המשתמש לחץ 'שמור')
        tap(() => this.isLoading = true),
        switchMap(updatedUserData => {
          return this.userService.updateUser(user.id!, updatedUserData).pipe(
            tap(response => {
              this.snackBar.open('הפרופיל עודכן בהצלחה!', 'סגור', { duration: 3000 });
              this.refreshProfileData(); // רענן את נתוני הפרופיל בתצוגה
            }),
            catchError(error => {
              console.error('שגיאה בעדכון הפרופיל:', error);
              this.snackBar.open('שגיאה בעדכון הפרופיל: ' + (error.error?.message || error.message), 'סגור', { duration: 5000 });
              this.isLoading = false;
              return of(null);
            })
          );
        })
      ).subscribe({
        error: (err) => {
          console.error('Edit profile dialog stream error:', err);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      })
    );
  }

  // פונקציה חדשה למחיקת משתמש
  onDeleteAccount(userId: number): void {
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'מחיקת חשבון',
        message: 'האם אתה בטוח שברצונך למחוק את חשבונך? פעולה זו אינה הפיכה וכל הנתונים הקשורים לחשבון יימחקו לצמיתות.',
        confirmText: 'מחק חשבון',
        cancelText: 'ביטול'
      }
    });

    this.subscriptions.add(
      confirmDialogRef.afterClosed().pipe(
        filter(confirmed => confirmed), // אם המשתמש אישר
        tap(() => this.isLoading = true),
        switchMap(() => {
          return this.userService.deleteUser(userId).pipe(
            tap(() => {
              this.snackBar.open('חשבונך נמחק בהצלחה!', 'סגור', { duration: 3000 });
              this.authService.logout(); // וודא התנתקות לאחר מחיקה
              this.router.navigate(['/login']); // הפנה לדף ההתחברות
            }),
            catchError(error => {
              console.error('שגיאה במחיקת החשבון:', error);
              this.snackBar.open('שגיאה במחיקת החשבון: ' + (error.error?.message || error.message), 'סגור', { duration: 5000 });
              this.isLoading = false;
              return of(null);
            })
          );
        })
      ).subscribe({
        error: (err) => {
          console.error('Delete account dialog stream error:', err);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      })
    );
  }

  onUnenrollCourse(courseId: number): void {
    if (!this.currentUserId) {
      this.snackBar.open('שגיאה: משתמש לא מחובר.', 'סגור', { duration: 3000 });
      return;
    }

    if (this.currentUserRole !== 'student') {
        this.snackBar.open('רק תלמידים יכולים לבטל הרשמה מקורסים.', 'סגור', { duration: 3000 });
        return;
    }

    this.courseService.unenrollStudent(courseId, this.currentUserId).pipe(
      tap(() => {
        this.snackBar.open('ההרשמה בוטלה בהצלחה!', 'סגור', { duration: 3000 });
        this.refreshProfileData();
      }),
      catchError(err => {
        this.snackBar.open('נכשל בביטול ההרשמה: ' + (err.error?.message || err.message), 'סגור', { duration: 5000 });
        return of(null);
      })
    ).subscribe();
  }

  private refreshProfileData(): void {
    if (this.currentUserId) {
      this.isLoading = true;
      const getUser$ = this.userService.getUser(this.currentUserId);

      let getCourses$: Observable<Course[]>;
      if (this.currentUserRole === 'student') {
        getCourses$ = this.courseService.getEnrolledCoursesByStudent(this.currentUserId);
      } else {
        getCourses$ = of([]);
      }

      forkJoin([
        getUser$,
        getCourses$
      ]).pipe(
        tap(([user, courses]) => {
          this.user$ = of(user);
          this.displayedCourses$ = of(courses);
          this.isLoading = false;
        }),
        catchError(err => {
          this.error = 'נכשל ברענון נתוני הפרופיל: ' + (err.error?.message || err.message);
          this.isLoading = false;
          return of([undefined, []]);
        })
      ).subscribe();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}