import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavegationMenuComponent } from '../../components/navegation-menu/navegation-menu.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, NavegationMenuComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomePageComponent {}
