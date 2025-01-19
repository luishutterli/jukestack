import { useEffect, useRef, useState } from "react";
import { type Song, coverBaseUrl } from "../util/APIWrapper";
import { formattedTime } from "../util/Util";
import { FaPause, FaPlay } from "react-icons/fa";

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
        album: "",
    };

    const artistsString = displayedSong.musiker.length ? `by ${displayedSong.musiker.map((artist) => artist.name).join(", ")}` : "";

    // biome-ignore lint/correctness/useExhaustiveDependencies: songUrl needs to be a dependency to update the audio element
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, songUrl]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: displayedSong.name,
                artist: artistsString,
                album: displayedSong.album,
                artwork: [
                    { src: `${coverBaseUrl}/${encodeURIComponent(song?.coverObjekt ?? '')}`, sizes: '96x96', type: 'image/png' },
                    { src: `${coverBaseUrl}/${encodeURIComponent(song?.coverObjekt ?? '')}`, sizes: '128x128', type: 'image/png' },
                    { src: `${coverBaseUrl}/${encodeURIComponent(song?.coverObjekt ?? '')}`, sizes: '192x192', type: 'image/png' },
                    { src: `${coverBaseUrl}/${encodeURIComponent(song?.coverObjekt ?? '')}`, sizes: '256x256', type: 'image/png' },
                    { src: `${coverBaseUrl}/${encodeURIComponent(song?.coverObjekt ?? '')}`, sizes: '384x384', type: 'image/png' },
                    { src: `${coverBaseUrl}/${encodeURIComponent(song?.coverObjekt ?? '')}`, sizes: '512x512', type: 'image/png' },
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => {
                if (!isPlaying) togglePlay();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                if (isPlaying) togglePlay();
            });

            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                if (audioRef.current) {
                    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - (details.seekOffset || 10), 0);
                }
            });

            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                if (audioRef.current) {
                    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + (details.seekOffset || 10), audioRef.current.duration);
                }
            });

            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (audioRef.current && details.fastSeek && 'fastSeek' in audioRef.current) {
                    if (details.seekTime !== undefined) {
                        audioRef.current.fastSeek(details.seekTime);
                    }
                } else if (audioRef.current) {
                    if (details.seekTime !== undefined) {
                        audioRef.current.currentTime = details.seekTime;
                    }
                }
            });

            navigator.mediaSession.setActionHandler('stop', () => {
                if (isPlaying) togglePlay();
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                }
            });
        }
    }, [displayedSong, isPlaying, song, togglePlay, artistsString]);

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
        <footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 md:w-2/3 lg:w-1/2 bg-white bg-opacity-90 p-4 flex items-center rounded-3xl shadow-lg backdrop-blur-lg">
            {songUrl && (
                <audio ref={audioRef} src={songUrl} onTimeUpdate={handleTimeUpdate}>
                    <track kind="captions" />
                </audio>
            )}
            {song ? (
                <img src={`${coverBaseUrl}/${encodeURIComponent(song.coverObjekt)}`} alt={song.name} className="w-16 h-16 rounded-2xl shadow-md" />
            ) : (
                <div className="w-16 h-16 bg-purple-500 rounded-2xl shadow-md" />
            )}
            <div className="flex flex-1 flex-col justify-between px-4 space-y-2">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-1">
                        <div>
                            <p className="font-bold text-gray-800">{displayedSong.name}</p>
                            <p className="text-gray-600 text-sm">{artistsString}</p>
                            {displayedSong.album && <p className="text-gray-600 text-sm">in {displayedSong.album}</p>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (song) togglePlay();
                            }}
                            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                            {isPlaying ? <FaPause /> : <FaPlay />}
                        </button>
                        <p className="text-gray-600 text-sm">
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