import { useState, Dispatch, SetStateAction } from 'react'

export type SortOrder = 'asc' | 'desc'

export interface ColumnDef {
  field: string
  [key: string]: unknown
}

export interface PersistedTableState {
  order?: SortOrder
  orderBy?: string
  rowsPerPage?: number
  filters?: Record<string, unknown>
  hiddenColumns?: string[]
}

export interface UseDataTableStateOptions {
  columns?: ColumnDef[]
  defaultSortField?: string
  defaultSortOrder?: SortOrder
  pageSize?: number
  persisted?: PersistedTableState | null
}

export interface UseDataTableStateReturn {
  order: SortOrder
  setOrder: Dispatch<SetStateAction<SortOrder>>
  orderBy: string | undefined
  setOrderBy: Dispatch<SetStateAction<string | undefined>>
  selected: string[]
  setSelected: Dispatch<SetStateAction<string[]>>
  page: number
  setPage: Dispatch<SetStateAction<number>>
  rowsPerPage: number
  setRowsPerPage: Dispatch<SetStateAction<number>>
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  activeFilters: Record<string, unknown>
  setActiveFilters: Dispatch<SetStateAction<Record<string, unknown>>>
  expandedRows: Set<string>
  setExpandedRows: Dispatch<SetStateAction<Set<string>>>
  hiddenColumns: string[]
  setHiddenColumns: Dispatch<SetStateAction<string[]>>
}

/**
 * Manages DataTable sorting, pagination, filtering, and selection state.
 * Extracted from components/data.jsx DataTable.
 */
export function useDataTableState({
  columns = [],
  defaultSortField,
  defaultSortOrder = 'asc',
  pageSize = 10,
  persisted = null,
}: UseDataTableStateOptions = {}): UseDataTableStateReturn {
  const [order, setOrder] = useState<SortOrder>(persisted?.order || defaultSortOrder)
  const [orderBy, setOrderBy] = useState<string | undefined>(persisted?.orderBy || defaultSortField || columns[0]?.field)
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(persisted?.rowsPerPage || pageSize)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>(persisted?.filters || {})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(persisted?.hiddenColumns || [])

  return {
    order, setOrder,
    orderBy, setOrderBy,
    selected, setSelected,
    page, setPage,
    rowsPerPage, setRowsPerPage,
    searchQuery, setSearchQuery,
    activeFilters, setActiveFilters,
    expandedRows, setExpandedRows,
    hiddenColumns, setHiddenColumns,
  }
}
