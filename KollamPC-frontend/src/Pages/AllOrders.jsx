import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import * as XLSX from "xlsx";

const ProductTable = () => {
    const [products, setProducts] = useState([]);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
    const [issueProduct, setIssueProduct] = useState(null);
    const [issuedTo, setIssuedTo] = useState("");
    const [issueQuantity, setIssueQuantity] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [siSearch, setSiSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [issueKg, setIssueKg] = useState("KG")
    const [showIssuePopup, setShowIssuePopup] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [allProviders, setAllProviders] = useState([]);
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [showAllReceiptPopup, setShowAllReceiptPopup] = useState(false);
    const [allReceiptProduct, setAllReceiptProduct] = useState(null);
    const [allReceiptHistory, setAllReceiptHistory] = useState([]);
    

    const fetchUnsoldProducts = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products`
            );
            setProducts(response.data);
            console.debug('AllOrders: fetched products count', response.data?.length);

            const uniqueProviders = [...new Set(response.data.map(p => p.provider))];
            setAllProviders(uniqueProviders);
        } catch (error) {
            console.error('Error fetching unsold products:', error);
        }
    };



    const handleProviderChange = (provider) => {
        if (provider === 'ALL') {
            if (selectedProviders.length === allProviders.length) {
                setSelectedProviders([]);
            } else {
                setSelectedProviders(allProviders);
            }
        } else {
            setSelectedProviders(prevSelected =>
                prevSelected.includes(provider)
                    ? prevSelected.filter(p => p !== provider)
                    : [...prevSelected, provider]
            );
        }
    };



    const handleExcelImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            try {
                await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/import`, jsonData);
                alert("Products imported successfully.");
                fetchUnsoldProducts();
            } catch (err) {
                alert("Failed to import products");
                console.error(err);
            }
        };

        reader.readAsArrayBuffer(file);
    };


    useEffect(() => {
        fetchUnsoldProducts();
    }, []);

    // Listen for external product updates (e.g. from AddProduct) and refresh
    useEffect(() => {
        const handler = (e) => {
            const updated = e?.detail?.product;
            if (updated) {
                setProducts(prev => {
                    // replace matching product by _id, or append if not present
                    const found = prev.some(p => p._id === updated._id);
                    if (found) return prev.map(p => p._id === updated._id ? updated : p);
                    return [updated, ...prev];
                });
            } else {
                fetchUnsoldProducts();
            }
        };
        window.addEventListener('productsUpdated', handler);
        console.debug('AllOrders: registered productsUpdated listener');
        return () => window.removeEventListener('productsUpdated', handler);
    }, []);


    const openIssuePopup = (product) => {
        setIssueProduct(product);
        setIssuedTo("");
        setIssueQuantity("");
        setIssueKg("")
        setRemarks("");
        setIsEditMode(false);
        setShowIssuePopup(true);
    };

    const openEditPopup = (product) => {
        setIssueProduct(product);
        // default 'issuedTo' to provider when restocking (makes more sense for receipts)
        setIssuedTo(product.provider || product.name);
        // When editing, prefill the quantity field so user can replace it
        setIssueQuantity(String(product.quantity || ""));
        setIssueKg(product.unit);
        setRemarks(product.remarks || "");
        setIsEditMode(true);
        setShowIssuePopup(true);
    };

    const openAllReceipt = async (product) => {
        const updated = products.find(p => (p._id && product._id) ? p._id === product._id : p === product) || product;
        setAllReceiptProduct(updated);
        setShowAllReceiptPopup(true);

        try {
            if (updated && updated._id) {
                const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${updated._id}/history`);
                setAllReceiptHistory(Array.isArray(res.data) ? res.data : []);
            } else {
                setAllReceiptHistory([]);
            }
        } catch (err) {
            console.error('Failed to fetch product history', err);
            setAllReceiptHistory([]);
        }
    };


    const baseFiltered = products.filter(product => {
        const name = product.name || "";
        const provider = product.provider || "";

        const matchesProvider = selectedProviders.length === 0 || selectedProviders.includes(provider);
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.toLowerCase().includes(searchQuery.toLowerCase());

        // Check if product falls within the date range
        let withinDateRange = true;
        if (startDate) {
            withinDateRange = withinDateRange && new Date(product.date) >= new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            withinDateRange = withinDateRange && new Date(product.date) <= end;
        }

        return matchesProvider && matchesSearch && withinDateRange;
    });

    // SI number search: match against original serial number in the `products` list (index + 1)
    const siQ = siSearch.trim();
    let filteredProducts;
    if (!siQ) {
        filteredProducts = baseFiltered;
    } else {
        const siNum = Number(siQ);
        if (!Number.isNaN(siNum) && Number.isInteger(siNum)) {
            filteredProducts = baseFiltered.filter((item) => {
                const origIdx = products.findIndex((p) => (p._id ? p._id === item._id : p === item));
                return origIdx !== -1 && origIdx + 1 === siNum;
            });
        } else {
            filteredProducts = baseFiltered.filter((item) => {
                const origIdx = products.findIndex((p) => (p._id ? p._id === item._id : p === item));
                return origIdx !== -1 && String(origIdx + 1) === siQ;
            });
        }
    }




    const handleDelete = async (productId) => {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await axios.delete(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${productId}`);
                fetchUnsoldProducts();
            } catch (error) {
                console.error("Error deleting product:", error);
            }
        }
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();

        if (!issueProduct || !issuedTo || !issueQuantity || !issueKg) {
            alert("All fields are required.");
            return;
        }

        const payload = {
            name: issuedTo,
            quantity: Number(issueQuantity),
            unit: issueKg,
            remarks: remarks.trim(),
        };

        try {
            if (isEditMode) {
                // Edit mode → replace existing quantity with entered quantity
                const newQty = Number(issueQuantity);
                if (Number.isNaN(newQty)) {
                    alert("Please enter a valid quantity.");
                    return;
                }

                // Only update the fields that should change — do NOT overwrite the product name
                const updatedPayload = {
                    quantity: newQty,
                    unit: issueKg || issueProduct.unit,
                    remarks: remarks.trim(),
                };

                const res = await axios.put(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${issueProduct._id}`,
                    updatedPayload
                );
                if (res.status === 200) {
                    alert("Product updated successfully.");
                    fetchUnsoldProducts();
                    setShowIssuePopup(false);
                }
            } else {
                // Issue mode → create issued-product entry
                const issuePayload = {
                    productId: issueProduct._id || "",
                    name: issueProduct.name || "",
                    quantity: Number(issueQuantity),
                    unit: issueProduct.unit || "",
                    issuedTo: issuedTo.trim(),
                    remarks: remarks.trim(),
                    issueDate: issueDate
                };

                const res = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/issued-products`, issuePayload);
                if (res.status === 201) {
                    alert("Product issued successfully.");
                    fetchUnsoldProducts();
                    setShowIssuePopup(false);
                }
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error: " + (error.response?.data?.message || "Action failed"));
        }
    };

    // Return a display status: treat quantity 0 as Sold
    const getDisplayStatus = (product) => {
        if (!product) return 'Not Sold';
        if (Number(product.quantity) === 0) return 'Sold';
        return product.status || 'Not Sold';
    };


const exportToPDF = (data) => {
    const doc = new jsPDF();
    doc.text("Products", 14, 16);

    const tableColumn = [
        "SI No.",
        "Name",
        "Quantity",
        "Unit",
        "Provider",
        "Remarks",
        "Status",
        "Date Added"
    ];

    const tableRows = [];

    data.forEach((product, index) => {
        tableRows.push([
            index + 1,
            product.name,
            product.quantity,
            product.unit,
            product.provider,
            product.remarks || '-',
            getDisplayStatus(product),
            new Date(product.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }),
        ]);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });

    doc.save("products.pdf");
};

    


  const exportToExcel = (data) => {
    const wsData = [
        ["SI No.", "Name", "Quantity", "Unit", "Provider", "Remarks", "Status", "Date Added"],
        ...data.map((product, index) => [
            index + 1,
            product.name,
            product.quantity,
            product.unit,
            product.provider,
            product.remarks || "-",
            getDisplayStatus(product),
            new Date(product.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Apply black fill to header row
    const headerStyle = {
        fill: { fgColor: { rgb: "000000" } }, // black background
        font: { color: { rgb: "FFFFFF" }, bold: true } // white bold text
    };

    const headerCols = ["A1","B1","C1","D1","E1","F1","G1","H1"];
    headerCols.forEach(cell => {
        if (!ws[cell]) return;
        ws[cell].s = headerStyle;
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");

    XLSX.writeFile(wb, "products.xlsx", { cellStyles: true });
};




    return (
        <div className="p-0 sm:p-0 bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-6 text-center text-black">Product Inventory</h2>

            {/* Provider Filter Dropdown */}
            <div className="relative inline-block text-left mb-4">
                <button
                    onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                    className="px-4 py-2 bg-white text-black border-2 border-black rounded shadow hover:bg-black hover:text-white"
                >
                    {selectedProviders.length === allProviders.length ? 'All Providers' :
                        selectedProviders.length === 0 ? 'Select Provider(s)' :
                            `${selectedProviders.length} Selected`}
                </button>


                {showProviderDropdown && (
                    <div className="absolute z-10 mt-2 w-56 bg-white border border-black rounded shadow-lg max-h-60 overflow-y-auto">
                        <label className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100">
                            <input
                                type="checkbox"
                                className="mr-2"
                                onChange={() => handleProviderChange('ALL')}
                                checked={selectedProviders.length === allProviders.length}
                            />
                            Select All
                        </label>

                        {allProviders.map((provider, index) => (
                            <label
                                key={index}
                                className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                            >
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    onChange={() => handleProviderChange(provider)}
                                    checked={selectedProviders.includes(provider)}
                                />
                                {provider}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Start Date:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border px-2 py-1 rounded-md"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">End Date:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border px-2 py-1 rounded-md"
                    />
                </div>

                <button
                    onClick={() => {
                        setStartDate("");
                        setEndDate("");
                    }}
                    className="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded-md text-sm"
                >
                    Clear Filter
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                {/* Search Bar and SI finder */}
                <div className="flex items-center gap-2 w-full sm:w-64">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or provider"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <input
                        type="text"
                        inputMode="numeric"
                        value={siSearch}
                        onChange={(e) => setSiSearch(e.target.value)}
                        placeholder="SI No."
                        className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    />
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => exportToExcel(filteredProducts)}
                        className="bg-white border-2 hover:border-white hover:bg-black hover:text-white border-black text-black px-4 py-2 rounded-lg text-sm"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => exportToPDF(filteredProducts)}
                        className="bg-white border-2 hover:border-white hover:bg-black hover:text-white border-black text-black px-4 py-2 rounded-lg text-sm"
                    >
                        Export PDF
                    </button>
                    <div className="flex gap-2">
                        <label className="bg-white border-2 hover:border-white hover:bg-black hover:text-white border-black text-black px-4 py-2 rounded-lg text-sm cursor-pointer">
                            Import Excel
                            <input
                                type="file"
                                accept=".xlsx,.xls,.xlsm" // ← Added .xlsm
                                onChange={handleExcelImport}
                                className="hidden"
                            />
                        </label>
                    </div>


                </div>
            </div>


            <div className="overflow-x-auto bg-white rounded-xl shadow-lg max-h-[65vh] overflow-auto">
                <table className="w-full table-auto text-sm border-collapse border-l-2 border-r-2 border-black">
                    <thead className="bg-black text-white sticky top-0 z-20">
                        <tr>
                            <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-12">SI No.</th>
                            <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-1/2">Product Name</th>
                            <th className="py-1 px-2 text-center border-l border-black first:border-l-0 w-16">Quantity</th>
                            <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-20">Unit</th>
                            <th className="py-1 px-2 text-center border-l border-black first:border-l-0 w-20 break-words whitespace-normal" style={{maxWidth: '12ch', whiteSpace: 'normal', overflowWrap: 'break-word'}}>Vendor</th>
                            <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-20" style={{minWidth: '90px'}}>Remarks</th>
                            <th className="py-1 px-2 text-left border-l border-black first:border-l-0">Status</th>
                            <th className="py-1 px-2 text-left border-l border-black first:border-l-0">Date Added</th>
                            <th className="py-1 px-2 text-left border-l border-black first:border-l-0">Actions</th>
                        </tr>
                    </thead>
                    <tbody>


                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center py-3 text-gray-500">
                                    No unsold products found.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product, index) => (
                                <tr key={index} className="border-b border-black bg-white hover:bg-gray-200">
                                    <td className="px-2 py-1 border-l border-black first:border-l-0">{(() => {
                                        const origIdx = products.findIndex((p) => (p._id ? p._id === product._id : p === product));
                                        return origIdx !== -1 ? origIdx + 1 : index + 1;
                                    })()}</td>
                                    <td
                                        className="px-2 py-1 text-black font-normal break-words border-l border-black first:border-l-0 w-1/2"
                                        onClick={() => setSelectedProduct(product)}
                                        title={product.name}
                                        style={{
                                            maxWidth: '30ch',
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {product.name}
                                    </td>
                                    <td className="px-2 py-1 border-l border-black w-15 text-center">{product.quantity}</td>
                                    <td className="px-2 py-1 border-l border-black w-20">{product.unit}</td>
                                    <td className="px-2 py-1 border-l border-black w-28 break-words whitespace-normal text-center" title={product.provider} style={{maxWidth: '12ch', whiteSpace: 'normal', overflowWrap: 'break-word'}}>{product.provider || '-'}</td>
                                    <td className="px-2 py-1 border-l border-black w-20" style={{minWidth: '90px'}}>
                                        <div
                                            title={product.remarks || '-'}
                                            style={{
                                                maxWidth: '20ch',
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            {product.remarks || '-'}
                                        </div>
                                    </td>
                                    <td className="px-2 py-1 border-l border-black">
                                        {(() => {
                                            const statusText = getDisplayStatus(product);
                                            const isNotSold = statusText.toLowerCase() === 'not sold';
                                            const badgeClass = isNotSold ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700';
                                            return (
                                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${badgeClass}`}>
                                                    {statusText}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="py-1 px-2 whitespace-nowrap border-l border-black">
                                        {new Date(product.date).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>

                                    <td className="px-2 py-1 whitespace-nowrap border-l border-black">
                                        <div className="inline-flex gap-2 items-center">
                                            <button
                                                onClick={() => openIssuePopup(product)}
                                                className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-xs px-2 py-0.5 rounded"
                                            >
                                                Issue
                                            </button>
                                            <button
                                                onClick={() => openEditPopup(product)}
                                                className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-xs px-2 py-0.5 rounded"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openAllReceipt(product)}
                                                className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-xs px-2 py-0.5 rounded"
                                            >
                                                All Receipt
                                            </button>
                                            
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-xs px-2 py-0.5 rounded"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))

                        )}
                    </tbody>
                </table>
            </div>

            {/* Issue/Edit Modal */}
            {showIssuePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg w-full max-w-sm shadow-lg relative">
                        <h3 className="text-lg font-semibold mb-2">
                            {isEditMode ? "Edit Product" : "Issue Product"}
                        </h3>
                        <form onSubmit={handleIssueSubmit} className="space-y-2 text-sm">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Issued To</label>
                                <input
                                    type="text"
                                    value={issuedTo}
                                    onChange={(e) => setIssuedTo(e.target.value)}
                                    className="mt-1 block w-full px-3 py-1.5 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                                <input
                                    type="text"
                                    value={issueProduct ? issueProduct.quantity : ''}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-1.5 border rounded-md bg-gray-100 cursor-not-allowed text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input
                                    type="number"
                                    value={issueQuantity}
                                    onChange={(e) => setIssueQuantity(e.target.value)}
                                    className="mt-1 block w-full px-3 py-1.5 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Enter quantity"
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Unit</label>
                                <select
                                    value={issueKg}
                                    onChange={(e) => setIssueKg(e.target.value)}
                                    className="mt-1 block w-full px-3 py-1.5 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    required
                                >
                                    <option value="">Select Unit</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Litre">Litre</option>
                                    <option value="Piece">Piece</option>
                                    <option value="Box">Box</option>
                                    <option value="Ton">Ton</option>
                                    <option value="Nos">Nos</option>
                                    <option value="Mtr">Mtr</option>
                                    <option value="Set">Set</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                                <input
                                    type="date"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-1.5 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    required
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="mt-1 block w-full px-3 py-1.5 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Enter remarks (optional)"
                                    rows={2}
                                />
                            </div>


                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowIssuePopup(false)}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                                >
                                    {isEditMode ? "Update" : "Issue"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* All Receipt Modal (read-only, shows latest updated product details) */}
            {showAllReceiptPopup && allReceiptProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg w-full max-w-2xl shadow-lg relative">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold mb-2">All Receipt - Updates ({allReceiptHistory.length})</h3>
                            <div className="text-sm text-gray-600">Product: <span className="font-medium">{allReceiptProduct.name}</span></div>
                        </div>

                        <div className="mt-2">
                            {allReceiptHistory.length === 0 ? (
                                <div className="text-sm text-gray-500">No updates found for this product.</div>
                            ) : (
                                <div className="overflow-x-auto max-h-60 overflow-auto border rounded">
                                    <table className="w-full text-sm table-auto">
                                        <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-1 text-left">#</th>
                                                <th className="px-2 py-1 text-left">Action</th>
                                                <th className="px-2 py-1 text-left">Qty Change</th>
                                                <th className="px-2 py-1 text-left">Prev Qty</th>
                                                <th className="px-2 py-1 text-left">New Qty</th>
                                                <th className="px-2 py-1 text-left">Remarks</th>
                                                <th className="px-2 py-1 text-left">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allReceiptHistory.map((h, i) => (
                                                <tr key={h._id || i} className="border-t">
                                                    <td className="px-2 py-1 align-top">{i + 1}</td>
                                                    <td className="px-2 py-1 align-top">{h.action}</td>
                                                    <td className="px-2 py-1 align-top">{h.quantityChange}</td>
                                                    <td className="px-2 py-1 align-top">{h.previousQuantity}</td>
                                                    <td className="px-2 py-1 align-top">{h.newQuantity}</td>
                                                    <td className="px-2 py-1 align-top">{h.remarks || '-'}</td>
                                                    <td className="px-2 py-1 align-top whitespace-nowrap">{new Date(h.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                onClick={() => { setShowAllReceiptPopup(false); setAllReceiptProduct(null); setAllReceiptHistory([]); }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            

        </div>
    );
};

export default ProductTable;
