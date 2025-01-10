import { useEffect, useRef, useState } from "react";
import type { Song } from "../util/APIWrapper";
import { formattedTime } from "../util/Util";

interface MusicPlayerProps {
    readonly song?: Song | null;
    readonly isPlaying: boolean;
    readonly songUrl: string | null;
    readonly togglePlay: () => void;
}

function MusicPlayer({ song, isPlaying, songUrl, togglePlay }: MusicPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);

    const displayedSong = song ?? {
        name: "Nothing playing",
        musiker: [],
        dauer: 0,
    };

    const artistsString = displayedSong.musiker.length ? `by ${displayedSong.musiker.map((artist) => artist.name).join(", ")}` : "";

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, songUrl]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const diff = audioRef.current.currentTime - currentTime;
            if (audioRef.current.currentTime >= audioRef.current.duration && isPlaying) {
                console.log("Song ended");
                togglePlay();
            }
            if (diff > 0.5) {
                setCurrentTime(audioRef.current.currentTime);
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    return (
        <footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-1/2 bg-gray-200 p-3 flex items-center rounded-3xl">
            {songUrl && (
                <audio ref={audioRef} src={songUrl} onTimeUpdate={handleTimeUpdate}>
                    <track kind="captions" />
                </audio>
            )}
            <div className="w-14 h-14 bg-purple-500 rounded-2xl"></div>

            <div className="flex flex-1 flex-col justify-between px-4 space-y-2">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-1">
                        <div>
                            <p className="font-bold text-gray-700">{displayedSong.name}</p>
                            <p className="text-gray-500 text-sm">{artistsString}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (song) togglePlay();
                            }}
                            className="w-9 h-9 bg-white shadow rounded-full flex items-center justify-center">
                            <span className="text-black">{isPlaying ? "⏸" : "▶"}</span>
                        </button>
                        <p className="text-gray-500 text-sm">
                            {formattedTime(currentTime)} / {formattedTime(displayedSong.dauer)}
                        </p>
                    </div>
                </div>

                <input
                    type="range"
                    min={0}
                    max={displayedSong.dauer}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 rounded-full appearance-none bg-gray-300"
                />
            </div>
        </footer>
    );
}

export default MusicPlayer;
