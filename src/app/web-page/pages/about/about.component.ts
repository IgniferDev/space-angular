import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavegationMenuComponent } from '../../components/navegation-menu/navegation-menu.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, NavegationMenuComponent, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutPageComponent {}
