import { Routes } from '@angular/router';
import { Login } from './components/pages/login/login';
import { Home } from './components/pages/home/home';
import { ProfileWallet } from './components/pages/profile-wallet/profile-wallet';

export const routes: Routes = [
    { path : '', component: Home},
    { path : 'login', component: Login},
    { path: 'profile-wallet', component: ProfileWallet },
];
