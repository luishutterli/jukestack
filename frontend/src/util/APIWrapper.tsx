// const domain = "localhost:8080";
// const baseURL = `http://${domain}/api`;
const currentDomain = window.location.hostname;
const baseURL = `https://${currentDomain}/api`;

const userURL = `${baseURL}/user`;
const authURL = `${baseURL}/auth`;
const songURL = `${baseURL}/songs`;
const lendURL = `${baseURL}/lend`;
const adminURL = `${baseURL}/admin`;

import axios from "axios";

const publicInstance = axios.create({
    baseURL: baseURL,
    timeout: 2000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

export interface User {
    id?: number;
    email: string;
    nachname: string;
    vorname: string;
    passwort?: string;
    admin?: boolean;
}

export interface Song {
    id: number;
    name: string;
    dauer: number; // seconds?
    jahr: number;
    album?: string;
    musiker: Musiker[];
}

export interface Musiker {
    id: number;
    name: string;
}

export interface Lend {
    id: number;
    borrowedAt: string; // ISO date string
    returnAt: string; // ISO date string
    song: Song;
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string | object;
}

function handleAxiosError<T = unknown>(error: unknown): ApiResponse<T> {
    if (axios.isAxiosError(error)) {
        return { success: false, error: error.response?.data || error.message };
    }
    return { success: false, error: `Unexpected Error: ${error}` };
}

// API functions
// /user
export async function createUser(user: Omit<User, "id">): Promise<ApiResponse> {
    try {
        const response = await publicInstance.post(userURL, user);
        return { success: response.status === 201, data: response.data };
    } catch (error) {
        return handleAxiosError<User>(error);
    }
}

export async function getUserInfo(): Promise<ApiResponse<User>> {
    try {
        const response = await publicInstance.get(userURL);
        return { success: response.status === 200, data: response.data };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function updateUserInfo(updatedData: Partial<User>): Promise<ApiResponse> {
    try {
        const response = await publicInstance.put(userURL, updatedData);
        return { success: response.status === 200 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function deleteUser(): Promise<ApiResponse> {
    try {
        const response = await publicInstance.delete(userURL);
        return { success: response.status === 204 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

// /auth
export async function login(email: string, passwort: string): Promise<ApiResponse> {
    try {
        const response = await publicInstance.post(`${authURL}/login`, { email, passwort });
        return { success: response.status === 201 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function logout(): Promise<ApiResponse> {
    try {
        const response = await publicInstance.post(`${authURL}/logout`);
        return { success: response.status === 201 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function verifySession(): Promise<ApiResponse> {
    try {
        const response = await publicInstance.get(`${authURL}/verify`);
        return { success: response.status === 200 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function refreshSession(): Promise<ApiResponse> {
    try {
        const response = await publicInstance.post(`${authURL}/refresh`);
        return { success: response.status === 201 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

// /songs
export async function listSongs(): Promise<ApiResponse<Song[]>> {
    try {
        const response = await publicInstance.get(songURL);
        return { success: response.status === 200, data: response.data as Song[] };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function checkSongAvailability(songId: number): Promise<ApiResponse<{ available: boolean }>> {
    try {
        const response = await publicInstance.get(`${songURL}/status/${songId}`);
        return { success: response.status === 200 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

// /lend
export async function listBorrowedSongs(): Promise<ApiResponse<Lend[]>> {
    try {
        const response = await publicInstance.get(lendURL);
        return { success: response.status === 200, data: response.data as Lend[] };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function lendSong(id: number): Promise<ApiResponse<void>> {
    try {
        const response = await publicInstance.post(`${lendURL}/${id}`);
        return { success: response.status === 200 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function returnSong(songId: number): Promise<ApiResponse<void>> {
    try {
        const response = await publicInstance.delete<void>(`${lendURL}/${songId}`);
        return { success: response.status === 200 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function generateSongFileLink(id: number): Promise<ApiResponse<{ link: string }>> {
    try {
        const response = await publicInstance.get<{ link: string }>(`${lendURL}/${id}/listen`);
        return { success: response.status === 200, data: response.data };
    } catch (error) {
        return handleAxiosError(error);
    }
}

// /admin
export async function adminListAllUsers(): Promise<ApiResponse<User[]>> {
    try {
        const response = await publicInstance.get<User[]>(`${adminURL}/users`);
        return { success: response.status === 200, data: response.data };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function adminGetUserInfo(id: number): Promise<ApiResponse<User>> {
    try {
        const response = await publicInstance.get<User>(`${adminURL}/users/${id}`);
        return { success: response.status === 200, data: response.data };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function adminListUserBorrowedSongs(id: number): Promise<ApiResponse<Lend[]>> {
    try {
        const response = await publicInstance.get<Lend[]>(`${adminURL}/users/${id}/lend`);
        return { success: response.status === 200, data: response.data };
    } catch (error) {
        return handleAxiosError(error);
    }
}


export async function adminUpdateUserLend(lendId: number, updatedData: {lendDays : number}): Promise<ApiResponse<void>> {
    try {
        const response = await publicInstance.put<void>(`${adminURL}/lend/${lendId}`, updatedData);
        return { success: response.status === 200 };
    } catch (error) {
        return handleAxiosError(error);
    }
}

export async function adminReturnUserLend(lendId: number): Promise<ApiResponse<void>> {
    try {
        const response = await publicInstance.delete<void>(`${adminURL}/lend/${lendId}`);
        return { success: response.status === 200 };
    } catch (error) {
        return handleAxiosError(error);
    }
}
