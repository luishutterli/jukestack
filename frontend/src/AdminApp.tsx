import { useEffect, useState } from "react";
import {
    adminListAllUsers,
    adminListUserBorrowedSongs,
    adminReturnUserLend,
    adminUpdateUserLend,
    getUserInfo,
    type Lend,
    type User,
} from "./util/APIWrapper";
import { Link, useNavigate, useParams } from "react-router";
import Header from "./components/Header";

function Modal({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
}: {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onConfirm: () => void;
    readonly title: string;
    readonly children: React.ReactNode;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <div className="mb-4">{children}</div>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                        Abbrechen
                    </button>
                    <button type="button" onClick={onConfirm} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Bestätigen
                    </button>
                </div>
            </div>
        </div>
    );
}

export function AdminApp() {
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState<User>();
    const [loading, setLoading] = useState(true);

    const [userList, setUserList] = useState<User[]>([]);

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
                if (!apiResponse.data?.admin) {
                    navigate("/app/");
                }
                setLoading(false);
            })
            .catch(() => navigate("/app/login"));
    }, [navigate]);

    useEffect(() => {
        setLoading(true);
        adminListAllUsers().then((apiResponse) => {
            if (apiResponse.success) {
                if (apiResponse.data === undefined) {
                    console.log("No users ", apiResponse.error);
                    return;
                }
                setUserList(apiResponse.data);
                console.log("Loaded users ");
                setLoading(false);
            }
        });
    }, []);

    return (
        <div className="relative bg-background">
            <div className={loading ? "filter grayscale" : ""}>
                <Header sticky={true} user={userInfo} />
                <div className="flex justify-center items-center py-16 flex-col">
                    <h1 className="text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                        Admin Panel
                    </h1>
                    <div className="flex flex-col space-y-4 w-full max-w-4xl">
                        {userList.map((user) => (
                            <button
                                type="button"
                                key={user.email}
                                onClick={() => navigate(`/app/admin/user/${user.email}`)}
                                className="flex flex-col border border-gray-300 rounded-lg p-4 bg-white shadow-lg hover:shadow-2xl transition-all duration-150 transform hover:scale-105">
                                <p className="text-lg font-semibold">Email: {user.email}</p>
                                <p className="text-sm text-gray-600">Vorname: {user.vorname}</p>
                                <p className="text-sm text-gray-600">Nachname: {user.nachname}</p>
                            </button>
                        ))}
                    </div>
                </div>
                {loading && <div className="pointer-events-none fixed inset-0 bg-white opacity-50 z-50" />}
            </div>
        </div>
    );
}

export function AdminUserLends() {
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);
    const [modalTitle, setModalTitle] = useState("");
    const [modalConfirmAction, setModalConfirmAction] = useState<() => void>(() => {});

    const { email } = useParams();
    const [userLends, setUserLends] = useState<Lend[]>([]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: refresh key is used to trigger a reload
    useEffect(() => {
        setLoading(true);
        if (!email) {
            return;
        }
        adminListUserBorrowedSongs(email).then((apiResponse) => {
            if (apiResponse.success) {
                setUserLends(apiResponse.data ?? []);
            } else {
                console.log("Error getting user lends", apiResponse.error);
            }
            setLoading(false);
        });
    }, [email, refreshKey]);

    const onReturn = (lendId: number) => {
        setModalTitle("Zurückgabe bestätigen");
        setModalContent(<p>Willst du das Lied wirklich zurückgeben?</p>);
        setModalConfirmAction(() => async () => {
            setLoading(true);
            if (!email) {
                return;
            }
            adminReturnUserLend(lendId).then((apiResponse) => {
                if (apiResponse.success) {
                    setRefreshKey((prev) => prev + 1);
                } else {
                    console.log("Error returning song", apiResponse.error);
                }
                setLoading(false);
                setIsModalOpen(false);
            });
        });
        setIsModalOpen(true);
    };

    const onUpdate = (lendId: number) => {
        let newDays = 1;
        setModalTitle("Neue Ausleihdauer festlegen");
        setModalContent(
            <div>
                <label htmlFor="lendDays" className="block text-sm font-medium text-gray-700">
                    Neue Ausleihdauer in Tagen
                </label>
                <input
                    type="number"
                    id="lendDays"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    // biome-ignore lint/suspicious/noAssignInExpressions: unnecessary lint error
                    onChange={(e) => (newDays = Number.parseInt(e.target.value))}
                />
            </div>,
        );
        setModalConfirmAction(() => async () => {
            setLoading(true);
            if (!email) {
                return;
            }
            adminUpdateUserLend(lendId, { lendDays: newDays }).then((apiResponse) => {
                if (apiResponse.success) {
                    setRefreshKey((prev) => prev + 1);
                } else {
                    console.log("Error updating song", apiResponse.error);
                }
                setLoading(false);
                setIsModalOpen(false);
            });
        });
        setIsModalOpen(true);
    };

    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<User>();

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
                if (!apiResponse.data?.admin) {
                    navigate("/app/");
                }
                setLoading(false);
            })
            .catch(() => navigate("/app/login"));
    }, [navigate]);

    return (
        <div className="relative min-h-screen bg-background">
            <div className={loading ? "filter grayscale" : ""}>
                <Header sticky={true} user={userInfo} />
                    <div className="flex justify-center m-8 space-x-4">
                        <Link
                            to="/app/admin"
                            className="border border-blue-500 text-blue-500 rounded-lg px-4 py-2 hover:bg-blue-500 hover:text-white transition duration-300">
                            Zurück
                        </Link>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                            {email}
                        </h1>
                </div>
                <div className="flex flex-col space-y-4 w-full max-w-4xl mx-auto">
                    {userLends.map((lend) => (
                        <div
                            key={lend.song.id}
                            className="flex flex-col border border-gray-300 rounded-lg p-4 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <p className="text-lg font-semibold">ID: {lend.song.id}</p>
                            <p className="text-sm text-gray-600">Name: {lend.song.name}</p>
                            <p className="text-sm text-gray-600">Dauer: {lend.song.dauer}</p>
                            <p className="text-sm text-gray-600">Jahr: {lend.song.jahr}</p>
                            <p className="text-sm text-gray-600">Album: {lend.song.album}</p>
                            <p className="text-sm text-gray-600">Musiker: {lend.song.musiker.map((m) => m.name).join(", ")}</p>
                            <p className="text-sm text-gray-600">Ausgeliehen am: {lend.borrowedAt}</p>
                            <p className="text-sm text-gray-600">Zurück am: {lend.returnAt}</p>
                            <div className="flex space-x-2 mt-2">
                                <button
                                    type="button"
                                    className="border border-blue-500 text-blue-500 rounded-lg px-4 py-2 hover:bg-blue-500 hover:text-white transition duration-300"
                                    onClick={() => onReturn(lend.id)}>
                                    Zurückgeben
                                </button>
                                <button
                                    type="button"
                                    className="border border-blue-500 text-blue-500 rounded-lg px-4 py-2 hover:bg-blue-500 hover:text-white transition duration-300"
                                    onClick={() => onUpdate(lend.id)}>
                                    Ausleih Dauer ändern
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {loading && <div className="pointer-events-none fixed inset-0 bg-white opacity-50 z-50" />}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={modalConfirmAction} title={modalTitle}>
                {modalContent}
            </Modal>
        </div>
    );
}
