import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { PaymentStatusPage } from "./features/payments/pages/PaymentStatusPage";
import { PaymentListPage } from "./features/payments/pages/PaymentListPage";

// Simple router without react-router-dom for MVP
type Page = "list" | "status";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState<Page>("list");
  const [publicId, setPublicId] = React.useState<string>("");

  const handleViewStatus = (id: string) => {
    setPublicId(id);
    setCurrentPage("status");
  };

  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-8 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Payments Learning</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentPage("list")}
                  className={`px-4 py-2 rounded ${
                    currentPage === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  List
                </button>
                {currentPage === "status" && (
                  <button
                    onClick={() => setCurrentPage("list")}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  >
                    ← Back
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="mt-8">
          {currentPage === "list" && <PaymentListPage />}
          {currentPage === "status" && <PaymentStatusPage publicId={publicId} />}
        </main>
      </div>
    </Provider>
  );
};

export default App;
