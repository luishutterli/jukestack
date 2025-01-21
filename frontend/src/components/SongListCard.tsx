import { useState, useEffect, useRef } from "react";
import { type Lend, type Song, coverBaseUrl } from "../util/APIWrapper";
import { formattedTime } from "../util/Util";
import { FaPlay, FaEllipsisH } from "react-icons/fa";

interface SongListCardProps {
    readonly song: Song;
    readonly lend?: Lend;
    readonly onLend?: (songId: number) => void;
    readonly onReturn?: (songId: number) => void;
    readonly onPlay?: (songId: number) => void;
}

function SongListCard({ song, lend, onLend, onReturn, onPlay }: SongListCardProps) {
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);
    const isLend = lend !== undefined;
    const artistsString = `by ${song.musiker.map((artist) => artist.name).join(", ")}`;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setTimeout(() => setShowOptions(false), 100);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="p-2 bg-white shadow-xl rounded-lg text-gray-700 md:hover:shadow-2xl md:hover:scale-[101%] transition-all duration-150">
            <div className="flex justify-between items-center">
                <div className="flex flex-row justify-between flex-grow">
                    <div className="flex flex-row items-center space-x-2">
                        <img
                            src={`${coverBaseUrl}/${encodeURIComponent(song.coverObjekt)}`}
                            alt={song.name}
                            className="w-12 h-12 rounded-md"
                        />
                        <div>
                            <h3>
                                {song.name} - {formattedTime(song.dauer)}
                            </h3>
                            <p className="text-gray-500 text-sm">{artistsString}</p>
                        </div>
                    </div>
                    {isLend && (
                        <div className="flex flex-col items-center justify-center">
                            <p className="text-gray-500 text-xs">
                                {new Date(lend.borrowedAt).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })} -{" "}
                                {new Date(lend.returnAt).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })}
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex flex-row space-x-2">
                    <div className="hidden md:flex md:space-x-2">
                        {isLend && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (onPlay !== undefined) onPlay(song.id);
                                }}
                                className="w-9 h-9 bg-gray-100 shadow-md rounded-full flex items-center justify-center">
                                <FaPlay />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (isLend && onReturn !== undefined) onReturn(song.id);
                                else if (onLend !== undefined) onLend(song.id);
                            }}
                            className={`px-2 py-1 rounded-lg hover:shadow-lg transition-shadow duration-200 ${isLend ? "bg-red-500" : "bg-green-500"} text-white font-semibold`}>
                            {isLend ? "Zurückgeben" : "Ausleihen"}
                        </button>
                    </div>
                    <div className="block md:hidden relative">
                        <button
                            type="button"
                            onClick={() => setShowOptions(!showOptions)}
                            className="w-9 h-9 bg-gray-100 shadow-md rounded-full flex items-center justify-center z-10">
                            <FaEllipsisH />
                        </button>
                        {showOptions && (
                            <div
                                ref={optionsRef}
                                className="absolute right-0 mt-2 w-48 bg-white shadow-lg border border-primary border-opacity-50 rounded-lg z-20">
                                {isLend && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onPlay !== undefined) onPlay(song.id);
                                            setShowOptions(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100">
                                        <FaPlay className="inline mr-2" /> Abspielen
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isLend && onReturn !== undefined) onReturn(song.id);
                                        else if (onLend !== undefined) onLend(song.id);
                                        setShowOptions(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100">
                                    {isLend ? "Zurückgeben" : "Ausleihen"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SongListCard;