import { Routes } from '@angular/router';
import { CoursesListComponent } from './courses-list/courses-list.component';
import { CourseDetailsComponent } from './course-details/course-details.component';
import { CourseManagementComponent } from './course-admin/course-management/course-management.component'; // קומפוננטת ניהול הקורסים
import { TeacherGuard } from './guards/teacher.guard'; // ודא שנתיב זה נכון עבור ה-Guard
import { HomeComponent } from './home/home.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AuthGuard } from './guards/auth.guard'; // ודא שנתיב זה נכון עבור ה-Guard
import { CourseFormComponent } from './course-form/course-form.component'; // הנחה: קומפוננטה ליצירה/עריכה של קורס

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }, // ניתוב לדף הבית בברירת מחדל

  // --- מסלול לכפתור "קורסים" (צפייה כללית) ---
  // קומפוננטה זו מציגה את כל הקורסים במערכת (ללא אפשרויות ניהול למורה).
  { path: 'courses', component: CoursesListComponent },
  { path: 'courses/:id', component: CourseDetailsComponent }, // מסלול לפרטי קורס ספציפי

  // --- מסלולים לניהול קורסים (למורים בלבד) ---
  // זהו הנתיב הראשי למסך ניהול הקורסים של המורה.
  // הוא מוגן באמצעות TeacherGuard לוודא שרק מורים יכולים לגשת.
  {
    path: 'admin/courses',
    component: CourseManagementComponent, // הקומפוננטה שאחראית על הצגת קורסי המורה ופעולות הניהול
    canActivate: [AuthGuard, TeacherGuard], // דורש גם אימות וגם תפקיד מורה
  },
  // מסלול ליצירת קורס חדש - גם הוא מוגן למורים.
  {
    path: 'create-course',
    component: CourseFormComponent, // קומפוננטה לטופס יצירת קורס
    canActivate: [AuthGuard, TeacherGuard]
  },
  // מסלול לעריכת קורס קיים - כולל פרמטר ID עבור הקורס הנערך, ומוגן למורים.
  {
    path: 'edit-course/:id',
    component: CourseFormComponent, // קומפוננטה לטופס עריכת קורס
    canActivate: [AuthGuard, TeacherGuard]
  },

  // --- מסלול לפרופיל משתמש ---
  // מוגן באמצעות AuthGuard לוודא שרק משתמשים מחוברים יכולים לגשת לפרופיל שלהם.
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [AuthGuard]
  },

  // --- מסלול ברירת מחדל לכל נתיב שלא נמצא (Wildcard route) ---
  // מנתב משתמשים לדף הבית אם הם מנסים לגשת לנתיב לא קיים.
  { path: '**', redirectTo: 'home' },
];
