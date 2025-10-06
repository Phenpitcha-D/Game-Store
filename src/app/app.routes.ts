import { Routes } from '@angular/router';
import { Home } from './components/pages/home/home';
import { ProfileWallet } from './components/pages/profile-wallet/profile-wallet';
import { Auth } from './components/pages/auth/auth';
import { Editprofile } from './components/pages/editprofile/editprofile';
import { TopSellers } from './components/pages/top-sellers/top-sellers';
import { AdminManager } from './components/pages/admin-manager/admin-manager';
import { ManageGame } from './components/pages/manage-game/manage-game';
import { Admin } from './components/pages/admin/admin';
import { UserTransactions } from './components/pages/user-transactions/user-transactions';
import { Cart } from './components/pages/cart/cart';

export const routes: Routes = [
    { path : '', component: Home},
    { path : 'login', component: Auth},
    { path : 'profile-wallet', component: ProfileWallet },
    { path : 'editprofile', component: Editprofile},
    { path : 'topsellers', component: TopSellers},
    { path : 'adminmanager', component: Admin, 
        children: [
            { path: '', component: AdminManager },
            { path: 'manage-games', component: ManageGame },
            { path: 'view-transactions', component: UserTransactions}, 
        ],
    },
    { path : 'cart', component: Cart },
    
];
