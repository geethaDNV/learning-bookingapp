import React from "react";
import { JournalEntry } from "../../types/index.js";

interface JournalEntryTableProps {
  entries: JournalEntry[];
  loading?: boolean;
}

export const JournalEntryTable: React.FC<JournalEntryTableProps> = ({
  entries,
  loading = false,
}) => {
  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No journal entries found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Entry Date
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Reference
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Description
            </th>
            <th className="border border-gray-300 px-4 py-2 text-right">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <React.Fragment key={entry.id}>
              <tr className="bg-blue-50">
                <td colSpan={4} className="border border-gray-300 px-4 py-2">
                  <strong className="text-sm">
                    {entry.referenceType} - {entry.description}
                  </strong>
                  <span className="ml-4 text-xs text-gray-600">
                    {new Date(entry.entryDate).toLocaleDateString()}
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-gray-300 px-4 py-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left">Account</th>
                        <th className="text-right">Debit</th>
                        <th className="text-right">Credit</th>
                        <th className="text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lines.map((line) => (
                        <tr key={line.id} className="border-t border-gray-200">
                          <td className="py-1">Line {line.lineNumber}</td>
                          <td className="text-right">
                            {line.debitAmount > 0 ? line.debitAmount.toFixed(2) : "-"}
                          </td>
                          <td className="text-right">
                            {line.creditAmount > 0 ? line.creditAmount.toFixed(2) : "-"}
                          </td>
                          <td className="text-xs text-gray-600">
                            {line.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
