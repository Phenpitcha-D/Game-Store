import { Routes } from '@angular/router';
import { Home } from './components/pages/home/home';
import { ProfileWallet } from './components/pages/profile-wallet/profile-wallet';
import { Auth } from './components/pages/auth/auth';
import { Editprofile } from './components/pages/editprofile/editprofile';

export const routes: Routes = [
    { path : '', component: Home},
    { path : 'login', component: Auth},
    { path : 'profile-wallet', component: ProfileWallet },
    { path : 'editprofile', component: Editprofile}
];
