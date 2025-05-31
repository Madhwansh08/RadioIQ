import React from 'react';

const ResponsiveTable = ({ columns, data }) => {
  return (
    <div className="overflow-x-auto">
      <table
        className="min-w-full text-left text-sm dark:text-[#fdfdfd] text-[#030811]"
        style={{ borderCollapse: 'collapse' }}
      >
        <thead className="dark:bg-[#030811] bg-[#fdfdfd] border-b dark:border-[#fdfdfd] border-[#030811]">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="w-1/4 px-4 py-2 font-semibold"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-2 border-b dark:border-[#fdfdfd] border-[#030811]"
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-4 border-b dark:border-[#fdfdfd] border-[#030811]"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ResponsiveTable;