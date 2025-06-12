import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-course-admin',
  standalone:true,
  imports: [RouterOutlet,RouterModule],
  templateUrl: './course-admin.component.html',
  styleUrl: './course-admin.component.css'
})
export class CourseAdminComponent {

}
