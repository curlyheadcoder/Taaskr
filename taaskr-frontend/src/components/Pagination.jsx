import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className = '',
  style = {}
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  if (totalItems <= itemsPerPage && currentPage === 1) {
    return null; // No pagination needed for single page with few items
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(totalItems, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`pagination-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.85rem 0.25rem',
        marginTop: '1rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
        ...style
      }}
    >
      <div>
        Showing <strong style={{ color: 'var(--text-main)' }}>{startItem}</strong> to{' '}
        <strong style={{ color: 'var(--text-main)' }}>{endItem}</strong> of{' '}
        <strong style={{ color: 'var(--text-main)' }}>{totalItems}</strong> items
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-secondary btn-sm"
          style={{
            padding: '0.35rem 0.6rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            opacity: currentPage === 1 ? 0.45 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
          title="Previous Page"
        >
          <ChevronLeft size={15} />
          <span>Prev</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{ padding: '0.3rem 0.45rem', color: 'var(--text-muted)' }}
                >
                  ...
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-card)',
                  color: isActive ? '#FFFFFF' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-secondary btn-sm"
          style={{
            padding: '0.35rem 0.6rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            opacity: currentPage === totalPages ? 0.45 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
          title="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
