// src/app/instructor-profile/instructor-profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user.service';
import { CourseService } from '../services/course.service';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces/user.interface';
import { Course } from '../interfaces/course.interface';
import { Observable, Subscription, combineLatest, of, forkJoin } from 'rxjs';
import { switchMap, catchError, tap, filter, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card'; // Added for card layout

@Component({
  selector: 'app-instructor-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './instructor-profile.component.html',
  styleUrls: ['./instructor-profile.component.css']
})
export class InstructorProfileComponent implements OnInit, OnDestroy {

  instructor$: Observable<User | undefined>;
  taughtCourses$: Observable<Course[]>;
  isLoading: boolean = true;
  error: string | null = null;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private userService: UserService,
    private courseService: CourseService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.instructor$ = of(undefined);
    this.taughtCourses$ = of([]);
  }

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([
        this.route.paramMap,
        this.authService.userId$,
        this.authService.currentUserRole$
      ]).pipe(
        switchMap(([params, authUserId, authRole]) => {
          const userIdParam = params.get('id');
          const requestedUserId = userIdParam ? parseInt(userIdParam, 10) : NaN;

          // וודא שהמשתמש מחובר, שהוא מורה, ושהוא צופה בפרופיל של עצמו
          // או שמנהל צופה בפרופיל של מורה (לא מטופל כאן, אבל אפשרי)
          if (isNaN(requestedUserId) || requestedUserId !== authUserId || authRole !== 'teacher') {
            this.error = 'מזהה משתמש לא תקין או שאין לך הרשאה לצפות בפרופיל זה כמורה.';
            this.isLoading = false;
            return of(null);
          }

          this.isLoading = true;
          this.error = null;

          // שולף פרטי מורה
          return this.userService.getUser(requestedUserId).pipe(
            switchMap(instructor => {
              if (!instructor || instructor.role !== 'teacher') {
                this.error = 'משתמש לא נמצא או שאינו מורה.';
                return of({ instructor: undefined, courses: [] });
              }

              // השרת מחזיר קורסים של מורה דרך: GET /api/courses?teacherId=X
              return this.courseService.getAllCourses().pipe( // קודם כל מקבלים את כל הקורסים
                map(allCourses => allCourses.filter(c => c.teacherId === instructor.id)), // ואז מסננים לפי ה-teacherId
                map(taughtCourses => ({ instructor, courses: taughtCourses }))
              );
            }),
            catchError(err => {
              this.error = 'נכשל בטעינת נתוני מורה או קורסים מלומדים: ' + (err.error?.message || err.message);
              return of({ instructor: undefined, courses: [] });
            })
          );
        })
      ).subscribe(data => {
        if (data && data.instructor) {
          this.instructor$ = of(data.instructor);
          this.taughtCourses$ = of(data.courses);
        } else {
          this.instructor$ = of(undefined);
          this.taughtCourses$ = of([]);
        }
        this.isLoading = false;
      })
    );
  }

  // דוגמא לפונקציה לעריכת קורס - תצטרך ליישם ניווט/דיאלוג
  onEditCourse(courseId: number): void {
    console.log(`Edit course with ID: ${courseId}`);
    // this.router.navigate(['/admin/courses/edit', courseId]);
  }

  // דוגמא לפונקציה למחיקת קורס
  onDeleteCourse(courseId: number): void {
    if (confirm('האם אתה בטוח שברצונך למחוק קורס זה?')) {
      this.courseService.deleteCourse(courseId).pipe(
        tap(() => {
          this.snackBar.open('הקורס נמחק בהצלחה!', 'סגור', { duration: 3000 });
          // רענן את רשימת הקורסים המלומדים
          this.refreshTaughtCourses();
        }),
        catchError(err => {
          this.snackBar.open('נכשל במחיקת הקורס: ' + (err.error?.message || err.message), 'סגור', { duration: 5000 });
          return of(null);
        })
      ).subscribe();
    }
  }

  // פונקציה לרענון נתוני הקורסים המלומדים
  private refreshTaughtCourses(): void {
    if (this.instructor$) {
      this.instructor$.pipe(
        take(1), // Take current value
        filter(instructor => !!instructor && instructor.role === 'teacher'),
        switchMap(instructor => {
          return this.courseService.getAllCourses().pipe(
            map(allCourses => allCourses.filter(c => c.teacherId === instructor!.id)),
            tap(taughtCourses => this.taughtCourses$ = of(taughtCourses)),
            catchError(err => {
              this.error = 'נכשל ברענון הקורסים המלומדים: ' + (err.error?.message || err.message);
              return of([]);
            })
          );
        })
      ).subscribe(() => this.isLoading = false);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}