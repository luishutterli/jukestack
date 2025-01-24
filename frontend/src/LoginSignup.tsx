import { useEffect, useState } from "react";
import Header from "./components/Header";
import TextBox from "./components/TextBox";
import { login, createUser, ping } from "./util/APIWrapper";
import { useNavigate } from "react-router";

function LoginSignup() {
    const [email, setEmail] = useState("");
    const [vorname, setVorname] = useState("");
    const [nachname, setNachname] = useState("");
    const [passwort, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);

    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setConfirmPassword("");
    };


    // Ping server to wake up an instance
    useEffect(() => {
        ping().then((response) => {
            console.log(`Pinged server: ${response.data}ms (roundtrip)`);
        });
    }, []);

    const passwordsMatch = passwort === confirmPassword;

    const isFormValid = isLogin ? email && passwort : email && vorname && nachname && passwort && confirmPassword && passwordsMatch;

    const handleClick = async () => {
        if (!isFormValid) return;

        setLoading(true);

        if (isLogin) {
            await login(email, passwort).then((response) => {
                // console.log(response);
                if (!response.success) {
                    setIsError(true);
                    setMessage(`Login fehlgeschlagen: ${response.error}`);
                    setLoading(false);
                    return;
                }
                navigate("/app");
            });
            setLoading(false);
            return;
        }

        const user = {
            email,
            vorname,
            nachname,
            passwort,
        };
        await createUser(user).then((response) => {
            // console.log(response);
            if (!response.success) {
                setMessage(`Registrierung fehlgeschlagen: ${response.error}`);
                setIsError(true);
                setLoading(false);
                return;
            }
            setIsLogin(true);
            setMessage("Registrierung erfolgreich!");
            setIsError(false);
        });
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-screen">
            <Header />
            <div className="flex justify-center items-center flex-grow">
                <div className={`container border-2 shadow-lg flex flex-col p-4 items-center rounded-xl w-auto ${loading ? "opacity-50" : ""}`}>
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
                            value={passwort}
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
                        className={`p-2 rounded-lg mb-4 ${isFormValid && !loading ? "bg-primary text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"}`}
                        disabled={!isFormValid || loading}
                        onClick={handleClick}>
                        {isLogin ? "Login" : "Signup"}
                    </button>
                    <button type="button" onClick={toggleForm} className="text-xs underline text-primary">
                        {isLogin ? "Noch kein Konto? Registrieren" : "Bereits ein Konto? Login"}
                    </button>
                    {message && <p className={`text-sm mt-2 ${isError ? "text-red-500" : "text-green-500"}`}>{message}</p>}
                </div>
            </div>
        </div>
    );
}

export default LoginSignup;