import { Routes } from '@angular/router';
import { Login } from './components/pages/login/login';
import { Home } from './components/pages/home/home';

export const routes: Routes = [
    { path : '', component: Home},
    { path : 'auth', component: Login},
];
