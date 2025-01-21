import { useEffect, useState } from "react";
import Header from "./components/Header";
import { useNavigate } from "react-router";
import { generateSongFileLink, getUserInfo, lendSong, listBorrowedSongs, listSongs, returnSong, type Lend, type Song, type User } from "./util/APIWrapper";
import MusicPlayer from "./components/MusicPlayer";
import SongListCard from "./components/SongListCard";

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

    useEffect(() => {
        setLoading(true);
        getUserInfo()
            .then((apiResponse) => {
                if (!apiResponse.success) {
                    navigate("/app/login");
                    return;
                }
                setUserInfo(apiResponse.data);
                console.log("User info: ", apiResponse.data);
                if (apiResponse.data?.admin) {
                    navigate("/app/admin");
                }
                setLoading(false);
            })
            .catch(() => navigate("/app/login"));
    }, [navigate]);

    useEffect(() => {
        setLoading(true);
        listSongs().then((apiResponse) => {
            if (apiResponse.success) {
                if (apiResponse.data === undefined) {
                    console.log("No songs ", apiResponse.error);
                    return;
                }
                setJkLibrary(apiResponse.data);
                console.log("Loaded jkLibrary ", refreshKey);
                setLoading(false);
            }
        });
    }, [refreshKey]);

    useEffect(() => {
        setLoading(true);
        listBorrowedSongs().then((apiResponse) => {
            if (apiResponse.success) {
                if (apiResponse.data === undefined) {
                    console.log("No borrowed songs ", apiResponse.error);
                    return;
                }
                setOwnLibrary(apiResponse.data);
                console.log("Loaded ownLibrary ", refreshKey);
                setLoading(false);
            }
        });
    }, [refreshKey]);

    const onLend = async (songId: number) => {
        setLoading(true);
        lendSong(songId)
            .then((apiResponse) => {
                if (apiResponse.success) {
                    setRefreshKey(prev => prev + 1);
                } else {
                    alert(`Song konnte nicht ausgeliehen werden: ${apiResponse.error}`);
                    setLoading(false);
                }
            })
            .catch(() => {
                setLoading(false);
            });
    };

    const onReturn = async (lendId: number) => {
        setLoading(true);
        returnSong(lendId)
            .then(async (apiResponse) => {
                if (apiResponse.success) {
                    setRefreshKey(prev => prev + 1);
                }
            })
            .catch(() => {
                setLoading(false);
                console.log("Error returning song");
            });
    };

    const onPlay = async (songId: number) => {
        setLoading(true);
        generateSongFileLink(songId).then((apiResponse) => {
            if (apiResponse.success) {
                if (!apiResponse.data || !apiResponse.data.link) {
                    console.log("No song file link");
                    setLoading(false);
                    return;
                }

                console.log("Playing song, ", songId);
                console.log("Playing song, ", ownLibrary);
                console.log("Playing song, ", ownLibrary.find((lend) => lend.song.id === songId));

                setSelectedSong(ownLibrary.find((lend) => lend.song.id === songId)?.song ?? null);
                setSongUrl(apiResponse.data.link);
                setPlaying(true);
                setLoading(false);
                console.log("Playing song, ", selectedSong);
            } else {
                alert(`Song konnte abgespielt werden: ${apiResponse.error}`);
                setLoading(false);
            }
        }
        ).catch(() => {
            setLoading(false);
            console.log("Error playing song");
        });
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-background to-blue-300 pb-52 md:pb-0">
            <div className={loading ? "filter grayscale" : ""}>
                <Header user={userInfo} />
                <main className="flex flex-col md:flex-row p-2 md:p-8 space-y-4 md:space-x-8">
                    <div className="flex-1 p-2 md:p-6 bg-white bg-opacity-50 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-2 md:mb-4"><p className="bg-gradient-to-r from-primary to-secondary to-80% inline-block text-transparent bg-clip-text">JK</p> Bibliothek</h2>
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
                {!loading && <MusicPlayer isPlaying={playing} song={selectedSong} songUrl={songUrl} togglePlay={() => setPlaying(prev => !prev)} />}
            </div>

            {loading && <div className="pointer-events-none fixed inset-0 bg-white opacity-50 z-50" />}
        </div>
    );
}

export default App;