import { useEffect, useState } from "react";
import Header from "./components/Header";
import { useNavigate } from "react-router";
import {
    generateSongFileLink,
    getUserInfo,
    lendSong,
    listBorrowedSongs,
    listSongs,
    returnSong,
    sendVerifyEmail,
    type Lend,
    type Song,
    type User,
} from "./util/APIWrapper";
import MusicPlayer from "./components/MusicPlayer";
import SongListCard from "./components/SongListCard";
import ErrorModal from "./components/ErrorModal";

function App() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const [userInfo, setUserInfo] = useState<User>();

    const [jkLibrary, setJkLibrary] = useState<Song[]>([]);
    const [ownLibrary, setOwnLibrary] = useState<Lend[]>([]);

    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [songUrl, setSongUrl] = useState<string | null>(null);
    const [playing, setPlaying] = useState(false);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getUserInfo()
            .then((apiResponse) => {
                if (!apiResponse.success) {
                    navigate("/app/login");
                    return;
                }
                setUserInfo(apiResponse.data);
                // console.log("User info: ", apiResponse.data);
                if (apiResponse.data?.admin) {
                    navigate("/app/admin");
                }
                setLoading(false);
            })
            .catch(() => navigate("/app/login"));
    }, [navigate]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: key is used to refresh the list
    useEffect(() => {
        setLoading(true);
        listSongs().then((apiResponse) => {
            if (apiResponse.success) {
                if (apiResponse.data === undefined) {
                    // console.log("Keine Lieder ", apiResponse.error);
                    return;
                }
                setJkLibrary(apiResponse.data);
                // console.log("JK-Bibliothek geladen ", refreshKey);
                setLoading(false);
            }
        });
    }, [refreshKey]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: key is used to refresh the list
    useEffect(() => {
        setLoading(true);
        listBorrowedSongs().then((apiResponse) => {
            if (apiResponse.success) {
                if (apiResponse.data === undefined) {
                    // console.log("Keine ausgeliehenen Lieder ", apiResponse.error);
                    return;
                }
                setOwnLibrary(apiResponse.data);
                // console.log("Eigene Bibliothek geladen ", refreshKey);
                setLoading(false);
            }
        });
    }, [refreshKey]);

    const onLend = async (songId: number) => {
        setLoading(true);
        lendSong(songId)
            .then((apiResponse) => {
                if (apiResponse.success) {
                    setRefreshKey((prev) => prev + 1);
                } else {
                    setErrorMessage(`Lied konnte nicht ausgeliehen werden: ${apiResponse.error}`);
                    setLoading(false);
                }
            })
            .catch(() => {
                setErrorMessage("Fehler beim Ausleihen des Liedes");
                setLoading(false);
            });
    };

    const onReturn = async (lendId: number) => {
        setLoading(true);
        returnSong(lendId)
            .then(async (apiResponse) => {
                if (apiResponse.success) {
                    setRefreshKey((prev) => prev + 1);
                } else {
                    setErrorMessage(`Lied konnte nicht zurückgegeben werden: ${apiResponse.error}`);
                    setLoading(false);
                }
            })
            .catch(() => {
                setErrorMessage("Fehler beim Zurückgeben des Liedes");
                setLoading(false);
            });
    };

    const onPlay = async (songId: number) => {
        setLoading(true);
        generateSongFileLink(songId)
            .then((apiResponse) => {
                if (apiResponse.success) {
                    if (!apiResponse.data || !apiResponse.data.link) {
                        // console.log("Kein Lied-Datei-Link");
                        setLoading(false);
                        return;
                    }

                    // console.log("Lied wird abgespielt, ", songId);
                    // console.log("Lied wird abgespielt, ", ownLibrary);
                    // console.log(
                    //     "Lied wird abgespielt, ",
                    //     ownLibrary.find((lend) => lend.song.id === songId),
                    // );

                    setSelectedSong(ownLibrary.find((lend) => lend.song.id === songId)?.song ?? null);
                    setSongUrl(apiResponse.data.link);
                    setPlaying(true);
                    setLoading(false);
                    // console.log("Lied wird abgespielt, ", selectedSong);
                } else {
                    setErrorMessage(`Lied konnte nicht abgespielt werden: ${apiResponse.error}`);
                    setLoading(false);
                }
            })
            .catch(() => {
                setErrorMessage("Fehler beim Abspielen des Liedes");
                setLoading(false);
            });
    };

    const onSendVerifyEmail = async () => {
        setLoading(true);
        sendVerifyEmail()
            .then((apiResponse) => {
                // console.log("Verifizierungsmail:", apiResponse)
                if (!apiResponse.success) {
                    setErrorMessage(`Verifizierungs-E-Mail konnte nicht gesendet werden: ${apiResponse.error}`);
                }
                setLoading(false);
            })
            .catch((apiResponse) => {
                setErrorMessage(`Fehler beim Senden der Verifizierungs-E-Mail, ${apiResponse.error}`);
                setLoading(false);
            });
    };

    if (userInfo && !userInfo.emailVerifiziert) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="p-6 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">E-Mail-Bestätigung erforderlich</h2>
                    <p className="mb-4">Bitte bestätigen Sie Ihre E-Mail-Adresse, um fortzufahren.</p>
                    <button
                        type="button"
                        onClick={onSendVerifyEmail}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
                        Verifizierungs-E-Mail senden
                    </button>
                </div>
                {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-background to-blue-300 pb-52">
            <div className={loading ? "filter grayscale" : ""}>
                <Header user={userInfo} />
                <main className="flex flex-col md:flex-row p-2 md:p-8 space-y-4 md:space-x-8 md:space-y-0">
                    <div className="flex-1 p-2 md:p-6 bg-white bg-opacity-50 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-2 md:mb-4">
                            <p className="bg-gradient-to-r from-primary to-secondary to-80% inline-block text-transparent bg-clip-text">
                                JK
                            </p>{" "}
                            Bibliothek
                        </h2>
                        <ul className="space-y-2 md:space-y-4">
                            {jkLibrary.length > 0 ? (
                                jkLibrary.map((item) => (
                                    <li key={item.id}>
                                        <SongListCard song={item} onLend={onLend} />
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500">Keine Einträge</p>
                            )}
                        </ul>
                    </div>

                    <div className="flex-1 p-2 md:p-6 bg-white bg-opacity-50 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-2 md:mb-4">Deine Bibliothek</h2>
                        <ul className="space-y-2 md:space-y-4">
                            {ownLibrary.length > 0 ? (
                                ownLibrary.map((item) => (
                                    <li key={item.id}>
                                        <SongListCard song={item.song} lend={item} onReturn={onReturn} onPlay={onPlay} />
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500">Keine Einträge</p>
                            )}
                        </ul>
                    </div>
                </main>
                {!loading && (
                    <MusicPlayer
                        isPlaying={playing}
                        song={selectedSong}
                        songUrl={songUrl}
                        togglePlay={() => setPlaying((prev) => !prev)}
                    />
                )}
            </div>

            {loading && <div className="pointer-events-none fixed inset-0 bg-white opacity-50 z-50" />}
            {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />}
        </div>
    );
}

export default App;