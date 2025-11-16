import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavegationMenuComponent } from '../../components/navegation-menu/navegation-menu.component';

@Component({
  selector: 'app-questions-page',
  standalone: true,
  imports: [CommonModule, NavegationMenuComponent],
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css']
})
export class QuestionsPageComponent {
  // ejemplo simple de banco (puedes reemplazar por servicio)
  questions = [
    { id:1, mode:'math', q:'2 + 2', a:'4' },
    { id:2, mode:'math', q:'5 × 3', a:'15' },
    { id:3, mode:'history', q:'¿Quién llegó a América en 1492?', a:'Colón' },
    { id:4, mode:'history', q:'Civilización inca – capital', a:'Cuzco' }
  ];
}
