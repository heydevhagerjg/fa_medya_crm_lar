import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems }) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        let pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                pages.push(i);
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                pages.push('...');
            }
        }
        return pages.filter((p, index, arr) => p !== '...' || arr[index - 1] !== '...');
    };

    return (
        <div className="flex items-center justify-between border-t theme-divider theme-surface px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm theme-text-secondary">
                        Toplam <span className="font-medium">{totalPages}</span> sayfadan <span className="font-medium">{currentPage}</span>. sayfa gösteriliyor.
                        {totalItems !== undefined && (
                            <span className="ml-1">
                                Toplam kayıt sayısı: <span className="font-medium">{totalItems}</span>
                            </span>
                        )}
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 theme-text-secondary ring-1 ring-inset theme-divider hover:bg-[#F4F5F7] dark:hover:bg-white/10 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Önceki</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {getPages().map((page, idx) => (
                            page === '...' ? (
                                <span key={`ellipsis-${idx}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold theme-text-secondary ring-1 ring-inset theme-divider focus:outline-offset-0">
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${currentPage === page
                                            ? 'z-10 theme-button-primary text-white'
                                            : 'theme-text-primary ring-1 ring-inset theme-divider hover:bg-[#F4F5F7] dark:hover:bg-white/10'
                                        }`}
                                >
                                    {page}
                                </button>
                            )
                        ))}
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 theme-text-secondary ring-1 ring-inset theme-divider hover:bg-[#F4F5F7] dark:hover:bg-white/10 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Sonraki</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
            {/* Mobile View */}
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border theme-divider theme-surface px-4 py-2 text-sm font-medium theme-text-primary hover:bg-[#F4F5F7] dark:hover:bg-white/10 disabled:opacity-50"
                >
                    Önceki
                </button>
                <div className="flex items-center text-sm theme-text-secondary">
                    {currentPage} / {totalPages}
                </div>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border theme-divider theme-surface px-4 py-2 text-sm font-medium theme-text-primary hover:bg-[#F4F5F7] dark:hover:bg-white/10 disabled:opacity-50"
                >
                    Sonraki
                </button>
            </div>
        </div>
    );
}
