import type { Lend, Song } from "../util/APIWrapper";
import { formattedTime } from "../util/Util";

interface SongListCardProps {
    readonly song: Song;
    readonly lend?: Lend;
    readonly onLend?: (songId: number) => void;
    readonly onReturn?: (songId: number) => void;
    readonly onPlay?: (songId: number) => void;
}

function SongListCard({ song, lend, onLend, onReturn, onPlay }: SongListCardProps) {
    const isLend = lend !== undefined;
    const artistsString = `by ${song.musiker.map((artist) => artist.name).join(", ")}`;

    return (
        <div className="p-2 bg-white shadow rounded-lg text-gray-700">
            <div className="flex justify-between items-center">
                <div className="flex flex-row items-center space-x-2">
                    <div className="w-10 h-10 bg-purple-500 rounded-md"></div>
                    <div>
                        <h3>
                            {song.name} - {formattedTime(song.dauer)}
                        </h3>
                        <p className="text-gray-500 text-sm">{artistsString}</p>
                    </div>
                </div>
                {isLend && (
                    <div className="flex flex-col items-end">
                        <p className="text-gray-500 text-sm">
                            {new Date(lend.borrowedAt).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })} -{" "}
                            {new Date(lend.returnAt).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })}
                        </p>
                    </div>
                )}
                <div className="flex flex-row space-x-2">
                    {isLend && (
                        <button
                            type="button"
                            onClick={() => {
                                if (onPlay !== undefined) onPlay(song.id);
                            }}
                            className="w-9 h-9 bg-white shadow rounded-full flex items-center justify-center">
                            <span className="text-black">▶</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            if (isLend && onReturn !== undefined) onReturn(song.id);
                            else if (onLend !== undefined) onLend(song.id);
                        }}
                        className={`px-2 py-1 rounded-lg ${isLend ? "bg-red-500" : "bg-green-500"} text-white font-semibold`}>
                        {isLend ? "Zurückgeben" : "Ausleihen"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SongListCard;
