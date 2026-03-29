import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAccess } from '@/hooks/useAccess';

export function AppLayout() {
    const { roleName } = useAccess();
    const isRegulador = roleName === 'regulador';

    return (
        <div className="flex h-screen bg-bg-base overflow-hidden">
            {/* Sidebar - Oculto para regulador */}
            {!isRegulador && <Sidebar />}

            {/* Main area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Topbar />

                {/* Content */}
                <main className={`flex-1 overflow-y-auto ${isRegulador ? 'p-4 sm:p-6 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full' : 'p-3 sm:p-4 md:p-6'}`} data-lenis-prevent>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
