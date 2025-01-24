import { useEffect, useState } from "react";
import Header from "./components/Header";
import { getUserInfo, updateUserInfo, type User } from "./util/APIWrapper";
import { Link, useNavigate } from "react-router";
import ErrorModal from "./components/ErrorModal";

function Settings() {
    const [email, setEmail] = useState("");
    const [vorname, setVorname] = useState("");
    const [nachname, setNachname] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [userInfo, setUserInfo] = useState<User | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        getUserInfo().then((apiResponse) => {
            if (apiResponse.success && apiResponse.data) {
                setUserInfo(apiResponse.data);
                setEmail(apiResponse.data.email);
                setVorname(apiResponse.data.vorname);
                setNachname(apiResponse.data.nachname);
                setLoading(false);
            } else {
                navigate("/app/login");
            }
        });
    }, [navigate]);

    const handleSaveEmail = async () => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setMessage("Bitte geben Sie eine gültige Email-Adresse ein!");
            return;
        }
        setLoading(true);
        const response = await updateUserInfo("email", { email });
        if (response.success) {
            setMessage("Email erfolgreich geändert!");
            navigate("/app");
        } else {
            setErrorMessage(`Fehler beim Ändern der Email: ${response.error}`);
        }
        setLoading(false);
    };

    const handleSaveName = async () => {
        setLoading(true);
        const response = await updateUserInfo("name", { vorname, nachname });
        if (response.success) {
            setMessage("Name erfolgreich geändert!");
        } else {
            setErrorMessage(`Fehler beim Ändern des Namens: ${response.error}`);
        }
        setLoading(false);
    };

    const handleSavePassword = async () => {
        if (password !== confirmPassword) {
            setMessage("Passwörter stimmen nicht überein!");
            return;
        }
        setLoading(true);
        const response = await updateUserInfo("passwort", { passwort: password });
        if (response.success) {
            setMessage("Passwort erfolgreich geändert!");
        } else {
            setErrorMessage(`Fehler beim Ändern des Passworts: ${response.error}`);
        }
        setLoading(false);
    };

    const isEmailChanged = email !== userInfo?.email;
    const isNameChanged = vorname !== userInfo?.vorname || nachname !== userInfo?.nachname;
    const isPasswordValid = password && password === confirmPassword;

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-background to-blue-300 pb-52">
            <div className={loading ? "filter grayscale" : ""}>
                <Header user={userInfo} />
                <main className="flex flex-col items-center p-8 space-y-8">
                    <div className="w-full max-w-2xl p-6 bg-white bg-opacity-50 rounded-lg shadow-lg relative">
                        <Link to="/app" className="absolute top-4 left-4 p-2 rounded-lg bg-primary text-white">
                            Zurück
                        </Link>
                        <h2 className="text-3xl font-bold mb-6 text-center">Einstellungen</h2>
                        {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
                        <section className="mb-12">
                            <h3 className="text-2xl font-semibold mb-4 text-center">Email ändern</h3>
                            <form className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Neue Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveEmail}
                                    disabled={!isEmailChanged}
                                    className={`w-full px-4 py-2 rounded-lg shadow transition duration-300 ${
                                        isEmailChanged
                                            ? "bg-blue-500 text-white hover:bg-blue-700"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}>
                                    Email speichern
                                </button>
                            </form>
                        </section>

                        <hr className="border-t border-gray-300 my-8" />

                        <section className="mb-12">
                            <h3 className="text-2xl font-semibold mb-4 text-center">Name ändern</h3>
                            <form className="space-y-6">
                                <div>
                                    <label htmlFor="vorname" className="block text-sm font-medium text-gray-700">
                                        Vorname
                                    </label>
                                    <input
                                        type="text"
                                        id="vorname"
                                        value={vorname}
                                        onChange={(e) => setVorname(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="nachname" className="block text-sm font-medium text-gray-700">
                                        Nachname
                                    </label>
                                    <input
                                        type="text"
                                        id="nachname"
                                        value={nachname}
                                        onChange={(e) => setNachname(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveName}
                                    disabled={!isNameChanged}
                                    className={`w-full px-4 py-2 rounded-lg shadow transition duration-300 ${
                                        isNameChanged
                                            ? "bg-blue-500 text-white hover:bg-blue-700"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}>
                                    Name speichern
                                </button>
                            </form>
                        </section>

                        <hr className="border-t border-gray-300 my-8" />

                        <section>
                            <h3 className="text-2xl font-semibold mb-4 text-center">Passwort ändern</h3>
                            <form className="space-y-6">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Neues Passwort
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                        Passwort bestätigen
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSavePassword}
                                    disabled={!isPasswordValid}
                                    className={`w-full px-4 py-2 rounded-lg shadow transition duration-300 ${
                                        isPasswordValid
                                            ? "bg-blue-500 text-white hover:bg-blue-700"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}>
                                    Passwort speichern
                                </button>
                            </form>
                        </section>
                    </div>
                </main>
            </div>

            {loading && <div className="pointer-events-none fixed inset-0 bg-white opacity-50 z-50" />}
            {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />}
        </div>
    );
}

export default Settings;
