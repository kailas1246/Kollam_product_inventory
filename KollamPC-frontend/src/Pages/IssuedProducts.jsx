import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const IssuedProductTable = () => {
    const [issuedProducts, setIssuedProducts] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [siSearch, setSiSearch] = useState("");
    const [showReceiptPopup, setShowReceiptPopup] = useState(false);
    const [receiptList, setReceiptList] = useState([]);

    useEffect(() => {
        fetchIssuedProducts();
    }, [startDate, endDate]);

    const fetchIssuedProducts = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/issued-products`,
                { params: { startDate, endDate } }
            );
            setIssuedProducts(response.data);
        } catch (error) {
            console.error("Error fetching issued products:", error);
        }
    };

    const handleDelete = async (id) => {
        const confirm = window.confirm("Are you sure you want to delete this record?");
        if (!confirm) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/issued-products/${id}`
            );
            fetchIssuedProducts();
        } catch (error) {
            console.error("Error deleting issued product:", error);
            alert("Failed to delete issued product.");
        }
    };

    const openReceiptPopup = async (item) => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/issued-products`
            );
            const all = res.data || [];
            const receipts = all.filter(r =>
                r.productId === item.productId ||
                String(r.productId) === String(item.productId) ||
                r.productId === item._id ||
                String(r.productId) === String(item._id)
            );
            setReceiptList(receipts);
            setShowReceiptPopup(true);
        } catch (err) {
            console.error('Error fetching receipts', err);
            setReceiptList([]);
            setShowReceiptPopup(true);
        }
    };

    const exportIssuedPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Product Name", "Quantity", "Unit", "Issued To", "issue Date", "Remarks"]],
            body: filteredProducts.map((prod) => [
                prod.name,
                prod.quantity,
                prod.unit,
                prod.issuedTo,
                new Date(prod.issueDate).toLocaleString(),
                prod.remarks || "-",
            ]),

            startY: 20,
        });
        doc.save("issued-products.pdf");
    };

    const exportIssuedExcel = () => {
        const data = filteredProducts.map((item) => ({
            Name: item.name,
            Quantity: item.quantity,
            Unit: item.unit,
            "Issued To": item.issuedTo,
            "issueDate": item.issueDate,
            Remarks: item.remarks || "-",
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Issued Products");
        XLSX.writeFile(workbook, "issued-products.xlsx");
    };

    // Apply text search (name / issuedTo). If SI search is provided,
    // filter the already filtered list by displayed SI number (index+1).
    const q = searchQuery.trim().toLowerCase();
    const baseFiltered = issuedProducts.filter((item) => {
        if (!q) return true;
        const nameMatch = item.name?.toLowerCase().includes(q);
        const issuedToMatch = item.issuedTo?.toLowerCase().includes(q);
        return nameMatch || issuedToMatch;
    });

    const siQ = siSearch.trim();
    let filteredProducts;
    if (!siQ) {
        filteredProducts = baseFiltered;
    } else {
        const siNum = Number(siQ);
        if (!Number.isNaN(siNum) && Number.isInteger(siNum)) {
            // Match against original serial number (position in issuedProducts)
            filteredProducts = baseFiltered.filter((item) => {
                const origIdx = issuedProducts.findIndex((p) => (p._id ? p._id === item._id : p === item));
                return origIdx !== -1 && origIdx + 1 === siNum;
            });
        } else {
            filteredProducts = baseFiltered.filter((item) => {
                const origIdx = issuedProducts.findIndex((p) => (p._id ? p._id === item._id : p === item));
                return origIdx !== -1 && String(origIdx + 1) === siQ;
            });
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-black">Issued Products</h1>
                    <p className="text-sm text-gray-500">Track, filter, search and manage issued inventory.</p>
                </div>

                {/* Filters and Export Controls */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Search</label>
                        <input
                            type="text"
                            placeholder="Search by name or issued to..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">SI No.</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Search SI No."
                            value={siSearch}
                            onChange={(e) => setSiSearch(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-3">
                        <button
                            onClick={exportIssuedPDF}
                            className="bg-white hover:bg-black hover:text-white border-2 border-black text-black px-4 py-2 rounded-lg text-sm shadow"
                        >
                            Export PDF
                        </button>
                        <button
                            onClick={exportIssuedExcel}
                            className="bg-white hover:bg-black hover:text-white border-2 border-black text-black px-4 py-2 rounded-lg text-sm shadow"
                        >
                            Export Excel
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setStartDate("");
                            setEndDate("");
                            setSearchQuery("");
                            setSiSearch("");
                        }}
                        className="text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Table (styled like AllOrders) */}
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg max-h-[65vh] overflow-auto">
                    <table className="w-full table-auto text-sm border-collapse border-l-2 border-r-2 border-black">
                        <thead className="bg-black text-white sticky top-0 z-20">
                                <tr>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-12">SI No.</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-96" style={{maxWidth: '48ch'}}>Product Name</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-20">Issued To</th>
                                <th className="py-1 px-2 text-center border-l border-black first:border-l-0 w-16">Quantity</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-20">Unit</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-32 break-words whitespace-normal" style={{maxWidth: '12ch', whiteSpace: 'normal', overflowWrap: 'break-word'}}>Remarks</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0">Issued Date</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-3 text-gray-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((item, idx) => (
                                    <tr key={item._id || idx} className="border-b border-black bg-white hover:bg-gray-200">
                                        <td className="px-2 py-1 border-l border-black first:border-l-0">{(() => {
                                            const origIdx = issuedProducts.findIndex((p) => (p._id ? p._id === item._id : p === item));
                                            return origIdx !== -1 ? origIdx + 1 : idx + 1;
                                        })()}</td>
                                        <td className="px-2 py-1 text-black font-normal break-words border-l border-black first:border-l-0" title={item.name} style={{maxWidth: '48ch', whiteSpace: 'normal', overflowWrap: 'break-word'}}>
                                            {item.name}
                                        </td>
                                        <td className="px-2 py-1 border-l border-black w-20 break-words whitespace-normal" title={item.issuedTo} style={{maxWidth: '12ch', whiteSpace: 'normal', overflowWrap: 'break-word'}}>
                                            {item.issuedTo || '-'}
                                        </td>
                                        <td className="px-2 py-1 border-l border-black w-15 text-center">{item.quantity}</td>
                                        <td className="px-2 py-1 border-l border-black w-20">{item.unit}</td>
                                        <td className="px-2 py-1 border-l border-black break-words whitespace-normal" title={item.remarks} style={{maxWidth: '12ch', whiteSpace: 'normal', overflowWrap: 'break-word'}}>{item.remarks || '-'}</td>
                                        <td className="py-1 px-2 whitespace-nowrap border-l border-black">
                                            {item.issueDate ? new Date(item.issueDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            }) : '-'}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap border-l border-black">
                                            <div className="inline-flex gap-2 items-center">
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-xs px-2 py-0.5 rounded"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={() => openReceiptPopup(item)}
                                                    className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-xs px-2 py-0.5 rounded"
                                                >
                                                    All Issued
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* All Receipts Modal */}
                {showReceiptPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-4 rounded-lg w-full max-w-md shadow-lg relative">
                            <h3 className="text-lg font-semibold mb-2">All Issues</h3>
                            <div className="max-h-72 overflow-y-auto text-sm">
                                {receiptList.length === 0 ? (
                                    <p className="text-gray-500">No receipts found for this product.</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="text-left text-xs text-gray-600 border-b">
                                            <tr className="border-b border-black">
                                                <th className="py-1 border-l border-black first:border-l-0">Qty</th>
                                                <th className="py-1 border-l border-black first:border-l-0">Issued To</th>
                                                <th className="py-1 border-l border-black first:border-l-0">Issue Date</th>
                                                <th className="py-1 border-l border-black first:border-l-0">Real Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {receiptList.map((r, i) => (
                                                <tr key={i} className="border-b border-black">
                                                    <td className="py-1 border-l border-black first:border-l-0">{r.quantity}</td>
                                                    <td className="py-1 border-l border-black break-words whitespace-normal" title={r.issuedTo} style={{maxWidth: '12ch', whiteSpace: 'normal', overflowWrap: 'break-word'}}>{r.issuedTo || '-'}</td>
                                                    <td className="py-1 border-l border-black">{r.issueDate ? new Date(r.issueDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : '-'}</td>
                                                    <td className="py-1 border-l border-black">{(r.issuedAt || r.createdAt || r.updatedAt) ? new Date(r.issuedAt || r.createdAt || r.updatedAt).toLocaleString('en-IN', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div className="flex justify-end mt-3">
                                <button onClick={() => setShowReceiptPopup(false)} className="px-3 py-1 bg-gray-300 rounded text-sm">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IssuedProductTable;
