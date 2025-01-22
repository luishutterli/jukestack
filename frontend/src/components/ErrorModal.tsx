import type React from "react";

interface ErrorModalProps {
    message: string;
    onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full z-10">
                <h2 className="text-xl font-bold mb-4 text-red-600">Fehler</h2>
                <p className="text-gray-700 mb-4">{message}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-200">
                    Abbrechen
                </button>
            </div>
        </div>
    );
};

export default ErrorModal;
