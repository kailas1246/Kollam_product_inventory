import { useEffect, useState } from "react";
import axios from "axios";
import { useNotification } from "../Components/NotificationProvider";


const AddProduct = () => {
    const { addNotification } = useNotification();
    const [existingProducts, setExistingProducts] = useState([]);
    const [isNewProduct, setIsNewProduct] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products`);
                const names = [...new Set(res.data.map(p => p.name))];
                setExistingProducts(names);
            } catch (err) {
                console.error("Failed to fetch product names", err);
            }
        };
        fetchProducts();
    }, []);


    const [product, setProduct] = useState({
        name: "",
        quantity: "",
        unit: "kg",
        remarks: "",
        status: "not sold",
        provider: "",
        date: "",
    });

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct((prev) => ({
            ...prev,
            [name]: value,
        }));

        // If typing the new product name, show filtered suggestions
        if (name === "name" && isNewProduct) {
            const q = value.trim().toLowerCase();
            if (q.length === 0) {
                setSuggestions([]);
                setShowSuggestions(false);
            } else {
                const matches = existingProducts.filter((n) =>
                    n.toLowerCase().includes(q)
                );
                setSuggestions(matches);
                setShowSuggestions(matches.length > 0);
            }
        }
    };

    const handleSelectSuggestion = (name) => {
        setProduct((prev) => ({ ...prev, name }));
        setIsNewProduct(false);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Success notifications are shown inline; disabled toast notifications for success

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Prevent adding a new product with a name that already exists (case-insensitive)
        const nameTrimmed = (product.name || "").trim();
        if (isNewProduct && nameTrimmed.length > 0) {
            const exists = existingProducts.some((n) => n.toLowerCase() === nameTrimmed.toLowerCase());
            if (exists) {
                const msg = "Item already exists.";
                setError(msg);
                addNotification({ type: 'error', message: msg });
                return;
            }
        }

        try {
            await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products`, product);
            setError("");
            setSuccess("Product added successfully!");
            // Show success toast notification
            addNotification({ type: 'success', message: 'Product added successfully!' });
            // Add the new name to existingProducts so it's available in the dropdown
            if (nameTrimmed.length > 0) {
                setExistingProducts((prev) => [...new Set([...prev, nameTrimmed])]);
            }
            setProduct({ name: "", quantity: "", unit: "kg", remarks: "", status: "not sold", provider: "", date: "" });
            setIsNewProduct(false);
        } catch (err) {
            setError("Failed to add product.");
            setSuccess("");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-white">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
            >
                <h2 className="text-black text-2xl font-bold mb-6 text-center">Add Product</h2>

                {success && <p className="text-green-400 mb-4">{success}</p>}
                {error && <p className="text-red-400 mb-4">{error}</p>}

                <div className="mb-4">
                    <label className="block text-sm font-medium  mb-1 text-black">Product Name</label>
                    <select
                        value={isNewProduct ? "new" : product.name}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === "new") {
                                setIsNewProduct(true);
                                setProduct((prev) => ({ ...prev, name: "" }));
                            } else {
                                setIsNewProduct(false);
                                setProduct((prev) => ({ ...prev, name: value }));
                            }
                        }}
                        className="w-full p-2 rounded bg-white text-black border border-gray-600"
                    >
                        <option value="">-- Select a product --</option>
                        <option value="new">+ Add new product</option>
                        {existingProducts.map((name, idx) => (
                            <option key={idx} value={name}>{name}</option>
                        ))}

                    </select>

                    {isNewProduct && (
                        <div className="relative mt-2">
                            <input
                                type="text"
                                name="name"
                                autoComplete="off"
                                value={product.name}
                                onChange={handleChange}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                                placeholder="Enter new product name"
                                required
                                className="w-full p-2 rounded bg-white text-black border border-gray-600"
                            />

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute left-0 right-0 bg-white text-black border border-gray-300 mt-1 rounded shadow max-h-40 overflow-auto z-10">
                                    {suggestions.map((s, i) => (
                                        <div
                                            key={i}
                                            onMouseDown={() => handleSelectSuggestion(s)}
                                            className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                                        >
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <input
                    type="text"
                    name="provider"
                    value={product.provider}
                    onChange={handleChange}
                    placeholder="Provider"
                    required
                    className="w-full p-2 mb-4 rounded bg-white text-black border border-gray-600"
                />


                <input
                    type="number"
                    name="quantity"
                    value={product.quantity}
                    onChange={handleChange}
                    placeholder="Quantity"
                    required
                    className="w-full p-2 mb-4 rounded bg-white text-black border border-gray-600"
                />

                <select
                    name="unit"
                    value={product.unit}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 rounded bg-white text-black border border-gray-600"
                >
                    <option value="Kg">Kilogram</option>
                    <option value="Litre">Litre</option>
                    <option value="Piece">Piece</option>
                    <option value="Box">Box</option>
                    <option value="Ton">Ton</option>
                    <option value="Nos">Nos</option>
                    <option value="Mtr">Mtr</option>
                    <option value="Set">Set</option>
                </select>

                <input
                    type="text"
                    name="remarks"
                    value={product.remarks}
                    onChange={handleChange}
                    placeholder="Remarks"
                    required
                    className="w-full p-2 mb-4 rounded bg-white text-black border border-gray-600"
                />
                <input
                    type="date"
                    name="date"
                    value={product.date}
                    onChange={handleChange}
                    required
                    className="w-full p-2 mb-4 rounded bg-white text-black border border-gray-600"
                />


                {/* Sold / Not Sold Select */}
                <select
                    name="status"
                    value={product.status}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 rounded bg-white text-black border border-gray-600"
                >
                    <option value="sold">Sold</option>
                    <option value="not sold">Not Sold</option>
                </select>

                <button
                    type="submit"
                    className="w-full py-2 bg-white hover:bg-black text-black border-2 border-black hover:text-white rounded font-semibold"
                >
                    Add Product
                </button>

                {/* <span className="text-black font-bold">Stock Items Entry - </span>
                <button className="text-blue-600 font-bold hover:text-blue-700">Click Here</button> */}

            </form>
        </div>
    );
};

export default AddProduct;
