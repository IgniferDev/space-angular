import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavegationMenuComponent } from '../../components/navegation-menu/navegation-menu.component';

@Component({
  selector: 'app-purpose-page',
  standalone: true,
  imports: [CommonModule, NavegationMenuComponent,RouterModule],
  templateUrl: './purpose.component.html',
  styleUrls: ['./purpose.component.css']
})
export class PurposePageComponent {}
