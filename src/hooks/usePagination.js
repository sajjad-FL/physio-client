import { useCallback, useMemo, useState } from 'react'

export const PAGE_SIZE_OPTIONS = [10, 20, 50]
export const DEFAULT_PAGE_SIZE = 10

/**
 * Shared list pagination state for screens that use <Pagination />.
 * Use this instead of copying page / pageSize / total wiring on every page.
 */
export default function usePagination({ defaultPageSize = DEFAULT_PAGE_SIZE } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const resetPage = useCallback(() => setPage(1), [])

  const setPageSizeAndReset = useCallback((size) => {
    setPage(1)
    setPageSize(Number(size) || defaultPageSize)
  }, [defaultPageSize])

  const applyMeta = useCallback((payload = {}) => {
    const nextTotal = Number(payload.total)
    const nextPages = Number(payload.totalPages)
    setTotal(Number.isFinite(nextTotal) ? nextTotal : 0)
    setTotalPages(Number.isFinite(nextPages) && nextPages > 0 ? nextPages : 1)
  }, [])

  const clearMeta = useCallback(() => {
    setTotal(0)
    setTotalPages(1)
  }, [])

  const paginationProps = useMemo(
    () => ({
      page,
      totalPages,
      onPageChange: setPage,
      total,
      pageSize,
      onPageSizeChange: setPageSizeAndReset,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    [page, totalPages, total, pageSize, setPageSizeAndReset],
  )

  /** Stable object so list load effects don't re-fire when only totals update. */
  const params = useMemo(() => ({ page, limit: pageSize }), [page, pageSize])

  return {
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize: setPageSizeAndReset,
    setTotal,
    setTotalPages,
    resetPage,
    applyMeta,
    clearMeta,
    paginationProps,
    /** Query params for list APIs */
    params,
  }
}
