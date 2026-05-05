import React from 'react'

export interface Column<T> {
  key:       string
  header:    React.ReactNode
  render?:   (row: T, index: number) => React.ReactNode
  align?:    'left' | 'center' | 'right'
  width?:    string
}

interface TableProps<T> {
  columns:    Column<T>[]
  data:       T[]
  keyField:   keyof T
  /** Shown when data is empty */
  emptyText?: string
  onRowClick?: (row: T) => void
}

export function Table<T>({ columns, data, keyField, emptyText = 'No records found.', onRowClick }: TableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width:          '100%',
          borderCollapse: 'collapse',
          fontFamily:     'var(--font-body)',
        }}
      >
        <thead>
          <tr style={{ background: 'var(--gray-50)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding:       '.6rem 1.25rem',
                  textAlign:     (col.align ?? 'left') as React.CSSProperties['textAlign'],
                  fontSize:      '.7rem',
                  fontWeight:    600,
                  color:         'var(--gray-400)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  borderBottom:  '1px solid var(--gray-100)',
                  whiteSpace:    'nowrap',
                  width:         col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding:   '3rem',
                  textAlign: 'center',
                  color:     'var(--gray-400)',
                  fontSize:  '.88rem',
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={String(row[keyField])}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: rowIndex < data.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  cursor:       onRowClick ? 'pointer' : 'default',
                  transition:   'background .1s',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding:  '.9rem 1.25rem',
                      fontSize: '.86rem',
                      color:    'var(--gray-900)',
                      textAlign:(col.align ?? 'left') as React.CSSProperties['textAlign'],
                    }}
                  >
                    {col.render
                      ? col.render(row, rowIndex)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}