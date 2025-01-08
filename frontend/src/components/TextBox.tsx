import { useState } from "react";

interface TextBoxProps {
    readonly type: string;
    readonly label: string;
    readonly placeholder: string;
    readonly value: string;
    readonly onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    readonly className?: string;
}

function TextBox({ type, label, placeholder, value, onChange, className = "" }: TextBoxProps) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    }

    return (
        <div className="mb-4">
            <label htmlFor={label} className="block text-gray-700 text-sm font-bold">
                {label}
            </label>
            <div className="relative">
                <input
                    id={label}
                    type={type === "password" && showPassword ? "text" : type}
                    placeholder={placeholder}
                    onChange={onChange}
                    value={value}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${className}`}
                />
                {type === "password" && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                        {showPassword ? "Hide" : "Show"}
                    </button>
                )}
            </div>
        </div>
    );
}

export default TextBox;