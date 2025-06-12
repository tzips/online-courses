// src/app/courses-list/courses-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CourseService } from '../services/course.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Course } from '../interfaces/course.interface';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, tap, switchMap, map, filter } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router'; // **הוסף את זה!**

@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    RouterModule // **הוסף את זה לרשימת ה-imports**
  ],
  templateUrl: './courses-list.component.html',
  styleUrl: './courses-list.component.css'
})
export class CoursesListComponent implements OnInit {
  // ... שאר הקוד של הקומפוננטה ...
  allCourses$: Observable<Course[]>;
  isLoading: boolean = true;
  error: string | null = null;

  isLoggedIn$: Observable<boolean>;
  isStudent$: Observable<boolean>;
  currentUserId$: Observable<number | null>;

  private enrolledCourseIdsSubject = new BehaviorSubject<number[]>([]);
  enrolledCourseIds$: Observable<number[]> = this.enrolledCourseIdsSubject.asObservable();

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.allCourses$ = of([]);
    this.isLoggedIn$ = this.authService.isLoggedIn();
    this.isStudent$ = this.authService.isStudent();
    this.currentUserId$ = this.authService.userId$;
  }

  ngOnInit(): void {
    console.log('CoursesListComponent ngOnInit called!');
    this.loadAllCourses();
    this.loadStudentEnrolledCourses();
  }

  loadAllCourses(): void {
    this.isLoading = true;
    this.allCourses$ = this.courseService.getAllCourses().pipe(
      tap((data: Course[]) => {
        console.log('Courses loaded successfully:', data);
        this.isLoading = false;
        this.error = null;
      }),
      catchError((error) => {
        console.error('Error loading courses:', error);
        this.error = 'נכשל בטעינת הקורסים. אנא נסה שוב מאוחר יותר.';
        this.snackBar.open(this.error, 'סגור', { duration: 5000 });
        this.isLoading = false;
        return of([]);
      })
    );
  }

  loadStudentEnrolledCourses(): void {
    combineLatest([this.isStudent$, this.currentUserId$]).pipe(
      filter(([isStudent, userId]) => isStudent && userId !== null),
      switchMap(([_, userId]) => this.courseService.getEnrolledCoursesByStudent(userId!).pipe(
        map(courses => {
          return courses.map(c => c.id).filter((id): id is number => id !== undefined && id !== null);
        }),
        tap(enrolledIds => this.enrolledCourseIdsSubject.next(enrolledIds)),
        catchError(err => {
          console.error('Error loading enrolled courses for student:', err);
          this.snackBar.open('נכשל בטעינת הקורסים הרשומים עבורך.', 'סגור', { duration: 3000 });
          return of([]);
        })
      ))
    ).subscribe();
  }

  isCourseEnrolled(courseId: number): Observable<boolean> {
    return this.enrolledCourseIds$.pipe(
      map(enrolledIds => enrolledIds.includes(courseId))
    );
  }

  onEnroll(courseId: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.snackBar.open('יש להתחבר כתלמיד כדי להירשם לקורס.', 'סגור', { duration: 3000 });
      return;
    }

    this.courseService.enrollStudent(courseId, userId).pipe(
      tap(() => {
        this.snackBar.open('נרשמת לקורס בהצלחה!', 'סגור', { duration: 3000 });
        this.loadStudentEnrolledCourses();
      }),
      catchError(err => {
        console.error('Error enrolling in course:', err);
        this.snackBar.open('נכשל בהרשמה לקורס: ' + (err.error?.message || err.message), 'סגור', { duration: 5000 });
        return of(null);
      })
    ).subscribe();
  }

  onUnenroll(courseId: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.snackBar.open('יש להתחבר כתלמיד כדי לעזוב קורס.', 'סגור', { duration: 3000 });
      return;
    }

    this.courseService.unenrollStudent(courseId, userId).pipe(
      tap(() => {
        this.snackBar.open('עזבת את הקורס בהצלחה!', 'סגור', { duration: 3000 });
        this.loadStudentEnrolledCourses();
      }),
      catchError(err => {
        console.error('Error unenrolling from course:', err);
        this.snackBar.open('נכשל בעזיבת הקורס: ' + (err.error?.message || err.message), 'סגור', { duration: 5000 });
        return of(null);
      })
    ).subscribe();
  }

  onEditCourse(courseId: number): void {
    console.log(`Edit course ${courseId}`);
  }

  onDeleteCourse(courseId: number): void {
    if (confirm('האם אתה בטוח שברצונך למחוק קורס זה?')) {
      console.log(`Delete course ${courseId}`);
    }
  }
}