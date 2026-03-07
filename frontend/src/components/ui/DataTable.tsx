import { useState, useMemo, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

export interface Column<T> {
    key: string;
    header: string;
    render?: (row: T) => ReactNode;
    sortable?: boolean;
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchable?: boolean;
    searchPlaceholder?: string;
    pageSize?: number;
    onRowClick?: (row: T) => void;
    actions?: (row: T) => ReactNode;
    emptyMessage?: string;
    loading?: boolean;
}

function getCellValue<T extends object>(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
}

function formatCellValue(value: unknown): ReactNode {
    if (value == null || value === '') {
        return '—';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    return JSON.stringify(value);
}

function getRowKey<T extends object>(row: T, fallback: number) {
    if ('id' in row) {
        const rowId = row.id;
        if (typeof rowId === 'string' || typeof rowId === 'number') {
            return rowId;
        }
    }

    return fallback;
}

export function DataTable<T extends object>({
    columns,
    data = [], // Garantizar que data siempre sea un array
    searchable = true,
    searchPlaceholder = 'Buscar...',
    pageSize = 10,
    onRowClick,
    actions,
    emptyMessage = 'No hay datos disponibles',
    loading = false,
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(0);

    const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    const filtered = useMemo(() => {
        if (!search.trim()) return safeData;
        const q = search.toLowerCase();
        return safeData.filter((row) =>
            columns.some((col) => {
                const val = getCellValue(row, col.key);
                return val != null && String(val).toLowerCase().includes(q);
            })
        );
    }, [safeData, search, columns]);

    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        if (!Array.isArray(filtered)) return []; // Asegurarse de que filtered es un array
        return [...filtered].sort((a, b) => {
            const av = getCellValue(a, sortKey) ?? '';
            const bv = getCellValue(b, sortKey) ?? '';
            const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    const sortedArray = Array.isArray(sorted) ? sorted : [];
    const totalPages = Math.max(1, Math.ceil(sortedArray.length / pageSize));
    const paged = sortedArray.slice(page * pageSize, (page + 1) * pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const SortIcon = ({ col }: { col: string }) => {
        if (sortKey !== col) return <Icon name="chevrons-up-down" size={12} className="text-text-muted opacity-50" />;
        return sortDir === 'asc' ? (
            <Icon name="chevron-up" size={12} className="text-amber-500" />
        ) : (
            <Icon name="chevron-down" size={12} className="text-amber-500" />
        );
    };

    return (
        <div className="space-y-3">
            {/* Search */}
            {searchable && (
                <div className="relative max-w-xs">
                    <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        placeholder={searchPlaceholder}
                        className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-border-default rounded-brand text-[13px] text-text-primary font-sans placeholder:text-text-muted interactive"
                    />
                </div>
            )}

            {/* Table */}
            <div className="border border-border-subtle rounded-brand overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-bg-elevated border-b border-border-subtle">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        style={col.width ? { width: col.width } : undefined}
                                        className={`px-4 py-2.5 text-left text-label text-text-muted ${col.sortable !== false ? 'cursor-pointer select-none hover:text-text-primary' : ''}`}
                                        onClick={() => col.sortable !== false && handleSort(col.key)}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {col.header}
                                            {col.sortable !== false && <SortIcon col={col.key} />}
                                        </span>
                                    </th>
                                ))}
                                {actions && <th className="px-4 py-2.5 text-right text-label text-text-muted w-24">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center">
                                        <div className="inline-flex items-center gap-2 text-text-muted">
                                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[12px] font-mono uppercase tracking-wider">Cargando...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paged.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-[13px] text-text-muted">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                paged.map((row, i) => (
                                    <tr
                                        key={getRowKey(row, i)}
                                        onClick={() => onRowClick?.(row)}
                                        className={`border-b border-border-subtle last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-bg-elevated/50' : ''}`}
                                    >
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-4 py-3 text-[13px] text-text-primary font-sans">
                                                {col.render ? col.render(row) : formatCellValue(getCellValue(row, col.key))}
                                            </td>
                                        ))}
                                        {actions && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-1">{actions(row)}</div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                        {sortedArray.length} resultado{sortedArray.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1.5 rounded-brand hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed interactive text-text-muted"
                        >
                            <Icon name="chevron-left" size={14} />
                        </button>
                        <span className="text-[11px] font-mono text-text-secondary px-2">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="p-1.5 rounded-brand hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed interactive text-text-muted"
                        >
                            <Icon name="chevron-right" size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
