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
  opened = -1;

  toggle(num: number) {
    this.opened = this.opened === num ? -1 : num;
  }

  isOpen(num: number) {
    return this.opened === num;
  }
}
