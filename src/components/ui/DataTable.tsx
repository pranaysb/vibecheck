"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  Archive,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Columns3
} from "lucide-react";

export type Density = "compact" | "standard" | "comfortable";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  onBatchExport?: (selectedItems: T[]) => void;
  onBatchAudit?: (selectedItems: T[]) => void;
  onBatchArchive?: (selectedItems: T[]) => void;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = "Filter records...",
  searchFilter,
  onBatchExport,
  onBatchAudit,
  onBatchArchive,
  emptyState,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [density, setDensity] = useState<Density>("standard");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    if (searchFilter) {
      return data.filter((item) => searchFilter(item, searchQuery));
    }
    return data.filter((item: any) =>
      Object.values(item).some(
        (val) => typeof val === "string" && val.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection
  const isAllSelected = paginatedData.length > 0 && paginatedData.every((item) => selectedIds.has(keyExtractor(item)));
  const isSomeSelected = paginatedData.some((item) => selectedIds.has(keyExtractor(item))) && !isAllSelected;

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllSelected) {
      paginatedData.forEach((item) => next.delete(keyExtractor(item)));
    } else {
      paginatedData.forEach((item) => next.add(keyExtractor(item)));
    }
    setSelectedIds(next);
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const densityRowClasses = {
    compact: "py-2 px-3 text-xs",
    standard: "py-3.5 px-4 text-xs",
    comfortable: "py-5 px-4 text-sm",
  };

  const selectedItems = useMemo(() => {
    return data.filter((item) => selectedIds.has(keyExtractor(item)));
  }, [data, selectedIds, keyExtractor]);

  return (
    <div className="space-y-3 font-sans relative">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full h-8 pl-8 pr-3 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-xs text-neutral-900 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Right Controls: Density & Page Size */}
        <div className="flex items-center gap-2">
          {/* Density Toggle */}
          <div className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setDensity("compact")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                density === "compact" ? "bg-white text-neutral-900 shadow-2xs font-semibold" : "text-neutral-600 hover:text-neutral-900"
              }`}
              title="Compact View (36px row)"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setDensity("standard")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                density === "standard" ? "bg-white text-neutral-900 shadow-2xs font-semibold" : "text-neutral-600 hover:text-neutral-900"
              }`}
              title="Standard View (48px row)"
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setDensity("comfortable")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                density === "comfortable" ? "bg-white text-neutral-900 shadow-2xs font-semibold" : "text-neutral-600 hover:text-neutral-900"
              }`}
              title="Comfortable View (60px row)"
            >
              Comfortable
            </button>
          </div>

          {/* Rows Per Page */}
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <label htmlFor="page-size-select" className="sr-only">Rows per page</label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 px-2 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Surface */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-mono text-[11px] uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={toggleSelectAll}
                    aria-label="Select all visible records"
                    className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`px-4 py-3 font-semibold select-none ${
                      col.sortable ? "cursor-pointer hover:text-neutral-900" : ""
                    } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : ""}`}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-neutral-400">
                          {sortKey === col.key ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3 h-3 text-neutral-900" strokeWidth={2} />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-neutral-900" strokeWidth={2} />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-neutral-300" strokeWidth={1.5} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700 font-sans">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-neutral-500 text-xs">
                    {emptyState || "No records match the active filter criteria."}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const id = keyExtractor(item);
                  const isSelected = selectedIds.has(id);
                  return (
                    <tr
                      key={id}
                      className={`transition-colors ${
                        isSelected ? "bg-neutral-50/90 font-medium" : "hover:bg-neutral-50/50"
                      }`}
                    >
                      <td className="w-10 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(id)}
                          aria-label={`Select record ${id}`}
                          className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                        />
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`${densityRowClasses[density]} ${
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                          }`}
                        >
                          {col.render ? col.render(item) : (item as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-neutral-900 font-mono">
              {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, totalRecords)}
            </span>{" "}
            of <span className="font-semibold text-neutral-900 font-mono">{totalRecords}</span> results
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Previous</span>
            </button>

            <span className="px-2 font-mono text-neutral-700 text-xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div
          role="toolbar"
          aria-label="Batch actions toolbar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 text-white px-4 py-2.5 rounded-lg shadow-lg border border-neutral-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2 pr-3 border-r border-neutral-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {selectedIds.size} {selectedIds.size === 1 ? "record" : "records"} selected
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {onBatchExport && (
              <button
                type="button"
                onClick={() => onBatchExport(selectedItems)}
                className="h-7 px-2.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Export CSV</span>
              </button>
            )}

            {onBatchAudit && (
              <button
                type="button"
                onClick={() => onBatchAudit(selectedItems)}
                className="h-7 px-2.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 flex items-center gap-1.5 transition-colors font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Batch Audit</span>
              </button>
            )}

            {onBatchArchive && (
              <button
                type="button"
                onClick={() => onBatchArchive(selectedItems)}
                className="h-7 px-2.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Archive className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Archive</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 ml-1"
              title="Clear selection"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
