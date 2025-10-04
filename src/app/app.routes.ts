import { Routes } from '@angular/router';
import { Login } from './components/pages/login/login';
import { ProfileWallet } from './components/pages/profile-wallet/profile-wallet';

export const routes: Routes = [
    { path : 'login', component: Login},
    {path: 'profile-wallet', component: ProfileWallet },
];
