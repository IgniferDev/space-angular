
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './web-page/pages/home/home.component';
import { QuestionsPageComponent } from './web-page/pages/questions/questions.component';
import { AboutPageComponent } from './web-page/pages/about/about.component';
import { PurposePageComponent } from './web-page/pages/purpose/purpose.component';
import { GameComponent } from './web-page/pages/game/game.component';
export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'preguntas', component: QuestionsPageComponent },
  { path: 'quienes-somos', component: AboutPageComponent },
  { path: 'proposito', component: PurposePageComponent },
  { path: 'juega', component: GameComponent },
  { path: '**', redirectTo: '' }
];
