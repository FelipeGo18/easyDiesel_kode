import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
    return (
        <div className="flex h-screen bg-bg-base overflow-hidden">
            <Sidebar />

            {/* Main area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Topbar />

                {/* Content */}
                <main className="flex-1 overflow-y-auto w-full" data-lenis-prevent>
                    <div className="p-3 sm:p-4 md:p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
