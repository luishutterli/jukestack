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
import { useNavigate, useParams } from "react-router";
import Header from "./components/Header";

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
        <div className="relative">
            <div className={loading ? "filter grayscale" : ""}>
                <Header user={userInfo} />
                <div className="flex justify-center items-center h-96 flex-col">
                    <h1 className="text-4xl">Admin Panel</h1>
                    <div className="flex flex-col space-y-2">
                        {userList.map((user) => (
                            <div
                                key={user.id}
                                className="flex flex-col border-2 border-black rounded-sm p-2 cursor-pointer"
                                onClick={() => navigate(`/app/admin/user/${user.id}`)}>
                                <p>ID: {user.id}</p>
                                <p>Email: {user.email}</p>
                                <p>Vorname: {user.vorname}</p>
                                <p>Nachname: {user.nachname}</p>
                            </div>
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

    const { id } = useParams();
    const [userLends, setUserLends] = useState<Lend[]>([]);

    useEffect(() => {
        setLoading(true);
        if (!id) {
            return;
        }
        adminListUserBorrowedSongs(Number.parseInt(id)).then((apiResponse) => {
            if (apiResponse.success) {
                setUserLends(apiResponse.data ?? []);
            } else {
                console.log("Error getting user lends", apiResponse.error);
            }
            setLoading(false);
        });
    }, [id, refreshKey]);

    const onReturn = async (lendId: number) => {
        setLoading(true);
        if (!id) {
            return;
        }
        adminReturnUserLend(lendId).then((apiResponse) => {
            if (apiResponse.success) {
                setRefreshKey((prev) => prev + 1);
            } else {
                console.log("Error returning song", apiResponse.error);
            }
            setLoading(false);
        });
    };

    const onUpdade = async (lendId: number) => {
        setLoading(true);
        if (!id) {
            return;
        }
        const newDays = Number.parseInt(prompt("Neue Ausleihdauer in Tagen eingeben") ?? "1");
        if (!newDays) {
            setLoading(false);
            return;
        }
        adminUpdateUserLend(lendId, { lendDays: newDays }).then((apiResponse) => {
            if (apiResponse.success) {
                setRefreshKey((prev) => prev + 1);
            } else {
                console.log("Error updating song", apiResponse.error);
            }
            setLoading(false);
        });
    };

    return (
        <div className="relative">
            <div className={loading ? "filter grayscale" : ""}>
                <Header />
                <h1 className="text-4xl m-4">Admin Panel | User ID: {id}</h1>
                <div className="flex flex-col space-y-2">
                    {userLends.map((lend) => (
                        <div key={lend.song.id} className="flex flex-col border-2 border-black rounded-sm p-2">
                            <p>ID: {lend.song.id}</p>
                            <p>Name: {lend.song.name}</p>
                            <p>Dauer: {lend.song.dauer}</p>
                            <p>Jahr: {lend.song.jahr}</p>
                            <p>Album: {lend.song.album}</p>
                            <p>Musiker: {lend.song.musiker.map((m) => m.name).join(", ")}</p>
                            <p>Ausgeliehen am: {lend.borrowedAt}</p>
                            <p>Zurück am: {lend.returnAt}</p>
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    className="border-1 border-black rounded-sm p-1 text-blue-500"
                                    onClick={() => onReturn(lend.id)}>
                                    Zurückgeben
                                </button>
                                <button
                                    type="button"
                                    className="border-1 border-black rounded-sm p-1 text-blue-500"
                                    onClick={() => onUpdade(lend.id)}>
                                    Ausleih Dauer ändern
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {loading && <div className="pointer-events-none fixed inset-0 bg-white opacity-50 z-50" />}
        </div>
    );
}
