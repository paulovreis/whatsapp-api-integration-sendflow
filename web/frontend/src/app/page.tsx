/* eslint-disable */
"use client";
import { useState, useEffect } from "react";
const api = require("../services/api").default;

// Usuário e senha fixos
const FIXED_USER = "admin";
const FIXED_PASS = "@Temsenha123";

export default function Home() {
    const [message, setMessage] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Estados para autenticação
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState("");

    // Checa autenticação no localStorage ao carregar
    useEffect(() => {
        const loggedIn = localStorage.getItem("isAuthenticated");
        if (loggedIn === "true") {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchMessage = async () => {
            await api
                .get("/whatsapp/message")
                .then((response: any) => {
                    if (response.status === 200) {
                        setMessage(response.data.message);
                        setNewMessage(response.data.message);
                    } else {
                        alert("Erro ao carregar mensagem.");
                    }
                })
                .catch((error: any) => {
                    console.error("Erro ao carregar mensagem:", error);
                    alert("Erro ao carregar mensagem.");
                });
        };
        fetchMessage();
    }, [isAuthenticated]);

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
    };

    const handleSubmit = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const response = await api.post("/whatsapp/save-message", {
                message: newMessage,
            });
            if (response.status === 200) {
                alert("Mensagem enviada com sucesso!");
            } else {
                alert("Erro ao enviar mensagem.");
            }
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            alert("Erro ao enviar mensagem.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === FIXED_USER && password === FIXED_PASS) {
            setIsAuthenticated(true);
            setLoginError("");
            localStorage.setItem("isAuthenticated", "true");
        } else {
            setLoginError("Usuário ou senha incorretos.");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem("isAuthenticated");
        setUsername("");
        setPassword("");
    };

    if (!isAuthenticated) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-100">
                <form
                    onSubmit={handleLogin}
                    className="bg-white p-8 rounded-lg shadow-lg flex flex-col gap-4 min-w-[300px]"
                >
                    <h2 className="text-xl font-bold mb-2">Login</h2>
                    <input
                        type="text"
                        placeholder="Usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="border p-2 rounded"
                        autoFocus
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border p-2 rounded"
                    />
                    {loginError && (
                        <span className="text-red-500 text-sm">{loginError}</span>
                    )}
                    <button
                        type="submit"
                        className="bg-green-500 text-white rounded-lg py-2 hover:bg-green-600"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        );
    }

    return (
        <>
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-100">
                <div className="absolute top-4 right-4">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        Sair
                    </button>
                </div>
                <h1 className="pb-5 text-2xl">
                    Alterar mensagem a ser enviada no whatsapp
                </h1>
                <div className="sm:w-96 md:w-2/3 lg:w-2/3 w-auto h-auto min-h-20 p-2 items-center justify-center flex flex-col bg-white rounded-lg shadow-lg">
                    <textarea
                        className="w-full h-40 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite sua mensagem aqui..."
                        value={newMessage}
                        onChange={handleMessageChange}
                        autoFocus
                    ></textarea>
                    <button
                        disabled={isLoading}
                        onClick={() => handleSubmit()}
                        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition ease-in-out"
                    >
                        {isLoading ? "Enviando..." : "Enviar Mensagem"}
                    </button>
                </div>
            </div>
        </>
    );
}
