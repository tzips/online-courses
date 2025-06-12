

export interface Lesson {
    id?: number; // מזהה שיכול להיות אופציונלי עבור יצירה חדשה (השרת מייצר אותו)
    courseId: number; // מזהה הקורס שאליו שייך השיעור
    title: string;    // כותרת השיעור
    content: string;  // תוכן השיעור
    // ניתן להוסיף שדות נוספים אם השרת מחזיר אותם, למשל:
    // createdAt?: Date;
    // updatedAt?: Date;
  }