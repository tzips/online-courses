// src/app/interfaces/course.interface.ts

// ממשק לקורס - ודא שהוא תואם למבנה הנתונים מהשרת שלך
export interface Course {
  id?: number; // ID של הקורס, לפי דרישות השרת הוא number
  title: string;
  description: string;
  teacherId?: number; // מזהה המורה, לפי דרישות השרת הוא number
  registeredStudentIds?: string[]; // **הוספה: רשימת ID של סטודנטים הרשומים לקורס**
  // הוסף כאן מאפיינים נוספים של הקורס
  // category?: string;
  // duration?: number;
}

// ממשק לתגובת השרת לאחר הוספת קורס
// מבוסס על השגיאה שקיבלת, המצביעה על כך שהשרת מחזיר message ו-courseId (number)
export interface AddCourseResponse {
  message: string;
  courseId: number; // לפי דרישות השרת הוא number
  // ייתכן שהשרת מחזיר גם את אובייקט הקורס המלא, במקרה כזה:
  // course: Course;
}

// ממשק לתגובת השרת עבור עדכון/מחיקה (כאשר רק message מוחזר)
export interface ServerMessageResponse {
  message: string;
}