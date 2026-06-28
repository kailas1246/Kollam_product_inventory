import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

const Unsold = () => {
    const [products, setProducts] = useState([]);
    const [issueProduct, setIssueProduct] = useState(null);
    const [issuedTo, setIssuedTo] = useState("");
    const [issueQuantity, setIssueQuantity] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [issueKg, setIssueKg] = useState("KG")
    const [showIssuePopup, setShowIssuePopup] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [allProviders, setAllProviders] = useState([]);
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

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



    useEffect(() => {
        fetchUnsoldProducts();
    }, []);


    const openIssuePopup = (product) => {
        setIssueProduct(product);
        setIssuedTo("");
        setIssueQuantity("");
        setIssueKg("")
        setIsEditMode(false);
        setShowIssuePopup(true);
    };

    const openEditPopup = (product) => {
        setIssueProduct(product);
        setIssuedTo(product.name);
        setIssueQuantity(product.quantity);
        setIssueKg(product.unit);
        setIsEditMode(true);
        setShowIssuePopup(true);
    };

    const fetchUnsoldProducts = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products`);
            const unsold = response.data.filter(product => product.status.toLowerCase() !== 'sold');
            setProducts(unsold);

            const uniqueProviders = [...new Set(unsold.map(p => p.provider))];
            setAllProviders(uniqueProviders);
        } catch (error) {
            console.error('Error fetching unsold products:', error);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesProvider = selectedProviders.length === 0 || selectedProviders.includes(product.provider);
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.provider.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesProvider && matchesSearch;
    });



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
        };

        try {
            if (isEditMode) {
                // Edit mode → update product
                const res = await axios.put(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${issueProduct._id}`,
                    payload
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


    const exportToPDF = (data) => {
        const doc = new jsPDF();
        doc.text("Unsold Products", 14, 16);

        const tableColumn = ["Name", "Quantity", "Unit", "Provider", "Remarks", "Status"];
        const tableRows = [];

        data.forEach(product => {
            tableRows.push([
                product.name,
                product.quantity,
                product.unit,
                product.provider,
                product.remarks || '-',
                product.status
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("unsold_products.pdf");
    };

    const exportToCSV = (data) => {
        const csvData = data.map(product => ({
            Name: product.name,
            Quantity: product.quantity,
            Unit: product.unit,
            Provider: product.provider,
            Remarks: product.remarks || '-',
            Status: product.status
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "unsold_products.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    return (
        <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">Current Stock</h2>

            {/* Provider Filter Dropdown */}
            <div className="relative inline-block text-left mb-4">
                <button
                    onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
                >
                    {selectedProviders.length === allProviders.length ? 'All Providers' :
                        selectedProviders.length === 0 ? 'Select Provider(s)' :
                            `${selectedProviders.length} Selected`}
                </button>

                {showProviderDropdown && (
                    <div className="absolute z-10 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                {/* Search Bar */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or provider"
                    className="w-full sm:w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />

                {/* Export Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => exportToCSV(filteredProducts)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => exportToPDF(filteredProducts)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                        Export PDF
                    </button>
                </div>
            </div>


            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                <table className="min-w-full">
                    <thead className="bg-indigo-700 text-white">
                        <tr>
                            <th className="py-3 px-4 text-left">Product Name</th>
                            <th className="py-3 px-4 text-left">Quantity</th>
                            <th className="py-3 px-4 text-left">Unit</th>
                            <th className="py-3 px-4 text-left">Provider</th>
                            <th className="py-3 px-4 text-left">Remarks</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedProduct && (
                            <div
                                className="fixed left-[80%] top-[100px] w-1/5 text-center transform -translate-x-1/2 -translate-y-1/2 bg-white text-black p-6 rounded-xl shadow-2xl border-2 border-red-700 z-50 product-detail-popup"
                            >
                                <div className="flex justify-between items-center">


                                </div>
                                <hr />
                                <div className="font-semibold space-y-2">
                                    <p><strong> {selectedProduct.quantity} {selectedProduct.unit}</strong></p>

                                </div>
                            </div>
                        )}

                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-6 text-gray-500">
                                    No unsold products found.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td
                                        className="py-3 px-4 text-indigo-700 font-medium cursor-pointer hover:underline"
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        {product.name}
                                    </td>


                                    <td className="py-3 px-4">{product.quantity}</td>
                                    <td className="py-3 px-4">{product.unit}</td>
                                    <td className="py-3 px-4">{product.provider}</td>
                                    <td className="py-3 px-4">{product.remarks || '-'}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${product.status.toLowerCase() === 'not sold'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-700'
                                            }`}>
                                            {product.status}
                                        </span>

                                    </td>
                                    <td className="flex flex-col items-center mt-2 space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2">
                                        <button
                                            onClick={() => openIssuePopup(product)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                                        >
                                            Issue
                                        </button>
                                        <button
                                            onClick={() => openEditPopup(product)}
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                                        >
                                            Delete
                                        </button>
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
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
                        <h3 className="text-xl font-semibold mb-4">
                            {isEditMode ? "Edit Product" : "Issue Product"}
                        </h3>
                        <form onSubmit={handleIssueSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Issued To</label>
                                <input
                                    type="text"
                                    value={issuedTo}
                                    onChange={(e) => setIssuedTo(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input
                                    type="number"
                                    value={issueQuantity}
                                    onChange={(e) => setIssueQuantity(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
                                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="">Select Unit</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Litre">Litre</option>
                                    <option value="Piece">Piece</option>
                                    <option value="Nos">Nos</option>
                                    <option value="Set">Set</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowIssuePopup(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    {isEditMode ? "Update" : "Issue"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Unsold;
