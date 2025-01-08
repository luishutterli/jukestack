import { useState } from "react";
import Header from "./components/Header";
import TextBox from "./components/TextBox";

function LoginSignup() {
    const [email, setEmail] = useState("");
    const [vorname, setVorname] = useState("");
    const [nachname, setNachname] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setConfirmPassword(""); // Reset confirm password when toggling form
    };

    const passwordsMatch = password === confirmPassword;

    const isFormValid = isLogin
        ? email && password
        : email && vorname && nachname && password && confirmPassword && passwordsMatch;

    return (
        <div className="flex flex-col h-screen">
            <Header />
            <div className="flex justify-center items-center flex-grow">
                <div className="container border-2 shadow-lg flex flex-col p-4 items-center rounded-xl w-auto">
                    <div>
                        <h1 className="font-extrabold text-5xl bg-gradient-to-r from-primary to-secondary to-80% inline-block text-transparent bg-clip-text p-2">
                            {isLogin ? "Login" : "Signup"}
                        </h1>
                    </div>
                    <div>
                        <TextBox
                            type="text"
                            label="Email:"
                            placeholder="Deine Email..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {!isLogin && (
                            <>
                                <TextBox
                                    type="text"
                                    label="Vorname:"
                                    placeholder="Dein Vorname..."
                                    value={vorname}
                                    onChange={(e) => setVorname(e.target.value)}
                                />
                                <TextBox
                                    type="text"
                                    label="Nachname:"
                                    placeholder="Dein Nachname..."
                                    value={nachname}
                                    onChange={(e) => setNachname(e.target.value)}
                                />
                            </>
                        )}
                        <TextBox
                            type="password"
                            label="Password:"
                            placeholder="Dein Passwort..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {!isLogin && (
                            <TextBox
                                type="password"
                                label="Confirm Password:"
                                placeholder="Passwort bestätigen..."
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={!passwordsMatch ? "border-red-500" : ""}
                            />
                        )}
                    </div>
                    <button
                        type="button"
                        className={`p-2 rounded-lg mb-4 ${isFormValid ? "bg-primary text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"}`}
                        disabled={!isFormValid}
                    >
                        {isLogin ? "Login" : "Signup"}
                    </button>
                    <button type="button" onClick={toggleForm} className="text-xs underline text-primary">
                        {isLogin ? "Noch kein Konto? Registrieren" : "Bereits ein Konto? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginSignup;