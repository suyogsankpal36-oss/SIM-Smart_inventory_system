import { Inbox } from "lucide-react";

export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found",
  emptyDescription = "There are no entries matching your current criteria.",
  emptyAction,
  skeletonRows = 5,
  rowKey = (item, idx) => item.id || idx,
  onRowClick,
  className = "",
}) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-base-300/80 bg-base-200 mobile-touch-scroll">
      <table className={`table table-zebra w-full text-sm text-base-content ${className}`}>
        <thead>
          <tr className="border-b border-base-300 text-xs uppercase tracking-wider font-bold text-base-content/70 bg-base-300/40">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`py-3.5 px-4 font-bold ${col.headerClassName || ""} ${
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, rIdx) => (
              <tr key={rIdx} className="border-b border-base-300/40">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="py-4 px-4">
                    <div className="skeleton h-4 w-full max-w-[140px] rounded-md opacity-60" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 px-4 text-center">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                  <div className="p-3.5 rounded-2xl bg-base-300/60 text-base-content/40 mb-3">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-base text-base-content">{emptyMessage}</h4>
                  <p className="text-xs text-base-content/60 mt-1">{emptyDescription}</p>
                  {emptyAction && <div className="mt-4">{emptyAction}</div>}
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr
                key={rowKey(item, rowIdx)}
                onClick={() => onRowClick && onRowClick(item)}
                className={`border-b border-base-300/30 transition-colors ${
                  onRowClick ? "cursor-pointer hover:bg-base-300/60" : "hover:bg-base-300/30"
                }`}
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={col.key || cIdx}
                    className={`py-3.5 px-4 align-middle ${col.className || ""} ${
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                    }`}
                  >
                    {col.render ? col.render(item, rowIdx) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
