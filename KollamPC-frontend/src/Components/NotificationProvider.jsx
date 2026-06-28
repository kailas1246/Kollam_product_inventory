import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const NotificationContext = createContext();

export function useNotification() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback(({ type = "info", message, duration = 2000 }) => {
        const id = Date.now();

        setNotifications((prev) => [...prev, { id, type, message }]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
    }, []);

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-4 max-w-sm">
                {notifications.map(({ id, type, message }) => (
                    <div
                        key={id}
                        className={`relative px-6 py-4 rounded-3xl border-2 shadow-lg text-black backdrop-blur-xl transition-all animate-pop
              ${type === "success" ? "border-green-300 bg-white/80" :
                                type === "error" ? "border-red-300 bg-white/80" :
                                    type === "warning" ? "border-yellow-300 bg-white/80" :
                                        "border-blue-300 bg-white/80"
                            }`}
                    >
                        {/* Inner Light Glow */}
                        <div className="absolute inset-0 rounded-3xl z-0 bg-white opacity-[0.5] blur-xl" />

                        {/* Glow Border Ring */}
                        <div className={`absolute -inset-[2px] rounded-3xl z-[-1] blur-md opacity-30
              ${type === "success" ? "bg-green-300" :
                                type === "error" ? "bg-red-300" :
                                    type === "warning" ? "bg-yellow-300" :
                                        "bg-blue-300"
                            }`} />

                        {/* Content */}
                        <div className="relative z-10 flex items-center gap-4">
                            {{
                                success: <CheckCircle2 className="text-green-500 mt-1" />,
                                error: <XCircle className="text-red-500 mt-1" />,
                                warning: <AlertTriangle className="text-yellow-500 mt-1" />,
                                info: <Info className="text-blue-500 mb-2" />,
                            }[type]}

                            <div className="text-[15px] font-semibold leading-tight flex-1">{message}</div>

                            <button
                                onClick={() => removeNotification(id)}
                                className="text-gray-500 hover:text-black transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Animations */}
            <style>{`
        @keyframes pop {
          0% { transform: scale(0.9) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-pop {
          animation: pop 0.4s ease-out forwards;
        }
      `}</style>
        </NotificationContext.Provider>
    );
}
