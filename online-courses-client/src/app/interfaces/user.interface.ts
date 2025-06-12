// src/app/interfaces/user.interface.ts
export interface User {
  id: number;
  name: string; // השרת מחזיר 'name' לא 'firstName' ו-'lastName'
  email: string;
  role: 'student' | 'teacher' | 'admin'; // או string אם התפקידים יכולים להיות אחרים
  courseIds?: number[]; // הוספה קריטית: רשימת ה-ID של הקורסים שהמשתמש רשום אליהם (רק אם השרת יחזיר את זה ב-GET /api/users/:id)
                            // **עדכון חשוב**: קוד השרת שסיפקת אינו מחזיר `courseIds` ב-GET /api/users/:id.
                            // הוא מחזיר את הקורסים הרשומים דרך `GET /api/courses/student/:studentId`.
                            // לכן, הממשק הזה לא יכיל `courseIds` ישירות, אלא נשלף אותם בנפרד.
}