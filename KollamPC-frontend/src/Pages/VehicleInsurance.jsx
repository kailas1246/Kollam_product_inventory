import React, { useState, useEffect } from "react";
import axios from "axios";

export default function VehicleInsurance() {
    const [vehicleName, setVehicleName] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [vehicles, setVehicles] = useState([]);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/vehicles`);
        setVehicles(res.data);
    };

    const handleAddVehicle = async () => {
        await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/vehicles`, {
            name: vehicleName,
            expiry: expiryDate,
        });
        setVehicleName("");
        setExpiryDate("");
        fetchVehicles();
    };

    const handleDeleteVehicle = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this vehicle?");
        if (!confirmDelete) return;
        try {
            await axios.delete(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/vehicles/${id}`);
            fetchVehicles();
        } catch (err) {
            console.error("Error deleting vehicle:", err);
        }
    };

    const getStatus = (expiry) => {
        const today = new Date();
        const exp = new Date(expiry);
        const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { label: `Expired (${Math.abs(diff)}d ago)`, color: "bg-red-500" };
        if (diff <= 30) return { label: `Expiring Soon (${diff}d)`, color: "bg-yellow-500" };
        return { label: `Active (${diff}d)`, color: "bg-green-500" };
    };

    const filterVehicles = vehicles.filter((v) => {
        const statusText = getStatus(v.expiry).label.toLowerCase();
        const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            filterStatus === "all" ||
            (filterStatus === "expired" && statusText.includes("expired")) ||
            (filterStatus === "active" && (statusText.includes("expiring soon") || statusText.includes("active")));
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6 text-black"> Vehicle Insurance Manager</h1>

                {/* Add Form */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Vehicle Name"
                        value={vehicleName}
                        onChange={(e) => setVehicleName(e.target.value)}
                        className="border border-gray-300 p-2 rounded-md w-full"
                    />
                    <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="border border-gray-300 p-2 rounded-md w-full"
                    />
                    <button
                        onClick={handleAddVehicle}
                        className="bg-white border-2 border-black text-black px-5 py-2 rounded-md hover:bg-black hover:text-white transition"
                    >
                        Add Vehicle
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <input
                        type="text"
                        placeholder="🔍 Search by vehicle name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-black p-2 rounded-md w-full md:max-w-xs"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-black p-2 rounded-md"
                    >
                        <option value="all">All Statuses</option>
                        <option value="expired">Expired</option>
                        <option value="active">Active</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-center border border-black0">
                        <thead className="bg-gray-100 text-black font-semibold">
                            <tr>
                                <th className="p-3 border">Vehicle</th>
                                <th className="p-3 border">Insurance Expiry</th>
                                <th className="p-3 border">Status</th>
                                <th className="p-3 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filterVehicles.map((v, idx) => {
                                const status = getStatus(v.expiry);
                                return (
                                    <tr key={idx} className="hover:bg-gray-100">
                                        <td className="p-3 border">{v.name}</td>
                                        <td className="p-3 border">
                                            {new Date(v.expiry).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="p-3 border">
                                            <span
                                                className={`text-black text-xs px-2 py-1 rounded-full ${status.color}`}
                                            >
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="p-3 border">
                                            <button
                                                onClick={() => handleDeleteVehicle(v._id)}
                                                className="bg-white border-2 hover:bg-black hover:text-white border-black text-black px-3 py-1 rounded-md transition"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filterVehicles.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-gray-500 p-4">
                                        No vehicles found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
