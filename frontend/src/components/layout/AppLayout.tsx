import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAccess } from '@/hooks/useAccess';

const SIDEBAR_HIDDEN_ROLES = ['estacion', 'distribuidor', 'distribuidor_regulado', 'regulador', 'auditor', 'particular'];

export function AppLayout() {
    const { roleName } = useAccess();
    const hideSidebar = SIDEBAR_HIDDEN_ROLES.includes(roleName ?? '');

    return (
        <div className="flex h-screen bg-bg-base overflow-hidden">
            {!hideSidebar && <Sidebar />}

            {/* Main area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Topbar />

                {/* Content */}
                <main className="flex-1 overflow-y-auto w-full" data-lenis-prevent>
                    <div className={hideSidebar ? 'p-4 sm:p-6 md:p-8 lg:p-12 max-w-[1400px] mx-auto w-full' : 'p-3 sm:p-4 md:p-6'}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
