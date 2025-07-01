/* eslint-disable */
"use client";
import { useState, useEffect } from "react";
import api, { setAuthToken, refreshAccessToken } from "../services/api";

// Usuário e senha fixos
const FIXED_USER = "admin";
const FIXED_PASS = "@Temsenha123";


export default function Home() {
    // Manipulação dos módulos de mensagem
    const [modules, setModules] = useState<string[][]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Estados para autenticação
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState("");

    // --- Heating (Aquecimento) ---
    const [heatingStatus, setHeatingStatus] = useState<any>(null);
    const [heatingLoading, setHeatingLoading] = useState(false);
    const [heatingError, setHeatingError] = useState("");

    // Checa autenticação no localStorage ao carregar
    useEffect(() => {
        const loggedIn = localStorage.getItem("isAuthenticated");
        if (loggedIn === "true") {
            setIsAuthenticated(true);
        }
    }, []);

    // --- JWT Auth ---
    useEffect(() => {
        const token = localStorage.getItem("jwtToken");
        const refreshToken = localStorage.getItem("refreshToken");
        if (token) {
            setAuthToken(token);
        }
        // Checa expiração e tenta refresh se necessário (simples, para MVP)
        const checkAndRefresh = async () => {
            if (!token && refreshToken) {
                const newToken = await refreshAccessToken(refreshToken);
                if (newToken) {
                    setAuthToken(newToken);
                    localStorage.setItem("jwtToken", newToken);
                } else {
                    setAuthToken(null);
                    localStorage.removeItem("jwtToken");
                    localStorage.removeItem("refreshToken");
                    setIsAuthenticated(false);
                }
            }
        };
        checkAndRefresh();
    }, []);


    // Carrega os módulos do backend ao autenticar
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchModules = async () => {
            try {
                const response = await api.get("/whatsapp/message");
                if (response.status === 200 && response.data.message) {
                    // Tenta detectar se é uma mensagem antiga (string) ou já estruturada
                    if (typeof response.data.message === "string") {
                        setModules([[response.data.message]]);
                    } else if (Array.isArray(response.data.message)) {
                        setModules(response.data.message);
                    }
                } else {
                    setModules([]);
                }
            } catch (error) {
                setModules([]);
            }
        };
        fetchModules();
    }, [isAuthenticated]);

    // --- Heating (Aquecimento) ---
    const fetchHeatingStatus = async () => {
        setHeatingError("");
        try {
            const response = await api.get("/whatsapp/heating-status");
            setHeatingStatus(response.data);
        } catch (err) {
            setHeatingError("Erro ao buscar status do aquecimento.");
        }
    };

    const handleStartHeating = async () => {
        setHeatingLoading(true);
        setHeatingError("");
        try {
            await api.get("/whatsapp/start-heating");
            await fetchHeatingStatus();
        } catch (err) {
            setHeatingError("Erro ao iniciar aquecimento.");
        } finally {
            setHeatingLoading(false);
        }
    };

    const handleStopHeating = async () => {
        setHeatingLoading(true);
        setHeatingError("");
        try {
            await api.get("/whatsapp/stop-heating");
            await fetchHeatingStatus();
        } catch (err) {
            setHeatingError("Erro ao parar aquecimento.");
        } finally {
            setHeatingLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchHeatingStatus();
            const interval = setInterval(fetchHeatingStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);


    // Manipulação dos módulos e variações
    const handleModuleChange = (modIdx: number, varIdx: number, value: string) => {
        setModules((prev) => {
            const updated = prev.map((mod, i) =>
                i === modIdx ? mod.map((v, j) => (j === varIdx ? value : v)) : mod
            );
            return updated;
        });
    };

    const handleAddModule = () => {
        setModules((prev) => [...prev, [""]]);
    };

    const handleRemoveModule = (modIdx: number) => {
        setModules((prev) => prev.filter((_, i) => i !== modIdx));
    };

    const handleAddVariation = (modIdx: number) => {
        setModules((prev) => prev.map((mod, i) => (i === modIdx ? [...mod, ""] : mod)));
    };

    const handleRemoveVariation = (modIdx: number, varIdx: number) => {
        setModules((prev) => prev.map((mod, i) =>
            i === modIdx ? mod.filter((_, j) => j !== varIdx) : mod
        ));
    };

    const handleSubmit = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const response = await api.post("/whatsapp/save-message", {
                modules,
            });
            if (response.status === 200) {
                alert("Módulos salvos com sucesso!");
            } else {
                alert("Erro ao salvar módulos.");
            }
        } catch (error) {
            alert("Erro ao salvar módulos.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        try {
            const response = await api.post("/auth/login", { username, password });
            if (response.data.token && response.data.refreshToken) {
                setIsAuthenticated(true);
                setAuthToken(response.data.token);
                localStorage.setItem("isAuthenticated", "true");
                localStorage.setItem("jwtToken", response.data.token);
                localStorage.setItem("refreshToken", response.data.refreshToken);
            } else {
                setLoginError("Usuário ou senha incorretos.");
            }
        } catch (err: any) {
            setLoginError("Usuário ou senha incorretos.");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setAuthToken(null);
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("refreshToken");
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

                <h1 className="pb-5 text-2xl">Editar módulos da mensagem do WhatsApp</h1>
                <div className="sm:w-96 md:w-2/3 lg:w-2/3 w-auto h-auto min-h-20 p-2 items-center justify-center flex flex-col bg-white rounded-lg shadow-lg">
                    {modules.map((mod, modIdx) => (
                        <div key={modIdx} className="w-full mb-4 p-2 border rounded bg-gray-50">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold">Módulo {modIdx + 1}</span>
                                <button
                                    className="text-red-500 text-xs ml-2"
                                    onClick={() => handleRemoveModule(modIdx)}
                                    disabled={modules.length === 1}
                                >Remover módulo</button>
                            </div>
                            {mod.map((variation, varIdx) => (
                                <div key={varIdx} className="flex items-center mb-2">
                                    <textarea
                                        className="w-full h-16 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={`Variação ${varIdx + 1}`}
                                        value={variation}
                                        onChange={e => handleModuleChange(modIdx, varIdx, e.target.value)}
                                    />
                                    <button
                                        className="ml-2 text-red-400 text-xs"
                                        onClick={() => handleRemoveVariation(modIdx, varIdx)}
                                        disabled={mod.length === 1}
                                    >Remover</button>
                                </div>
                            ))}
                            <button
                                className="text-blue-500 text-xs mt-1"
                                onClick={() => handleAddVariation(modIdx)}
                            >Adicionar variação</button>
                        </div>
                    ))}
                    <button
                        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        onClick={handleAddModule}
                    >Adicionar módulo</button>
                    <button
                        disabled={isLoading}
                        onClick={handleSubmit}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition ease-in-out"
                    >
                        {isLoading ? "Salvando..." : "Salvar módulos"}
                    </button>
                </div>
                {/* --- Heating Controls --- */}
                <div className="mt-8 w-full max-w-xl flex flex-col items-center bg-white rounded-lg shadow-lg p-4">
                    <h2 className="text-lg font-bold mb-2">Aquecimento entre Instâncias</h2>
                    <div className="flex gap-4 mb-2">
                        <button
                            onClick={handleStartHeating}
                            disabled={heatingLoading || (heatingStatus && heatingStatus.active)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            Iniciar Aquecimento
                        </button>
                        <button
                            onClick={handleStopHeating}
                            disabled={heatingLoading || !(heatingStatus && heatingStatus.active)}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                        >
                            Parar Aquecimento
                        </button>
                    </div>
                    {heatingError && <div className="text-red-500 mb-2">{heatingError}</div>}
                    <div className="text-sm text-gray-700">
                        {heatingStatus ? (
                            <>
                                <div>Status: <b>{heatingStatus.active ? "Ativo" : "Parado"}</b></div>
                                <div>Total de mensagens: <b>{heatingStatus.stats?.totalMessages ?? 0}</b></div>
                                <div>Erros: <b>{heatingStatus.stats?.errors ?? 0}</b></div>
                                {heatingStatus.startedByCron && (
                                    <div className="text-blue-600 font-semibold">Aquecimento iniciado automaticamente pelo backend</div>
                                )}
                                {heatingStatus.stats?.lastMessage && (
                                    <div className="mt-2 p-2 bg-gray-100 rounded">
                                        <div className="font-semibold">Última mensagem:</div>
                                        <div><b>De:</b> {heatingStatus.stats.lastMessage.sender}</div>
                                        <div><b>Para:</b> {heatingStatus.stats.lastMessage.receiver}</div>
                                        <div><b>Data:</b> {new Date(heatingStatus.stats.lastMessage.date).toLocaleString()}</div>
                                        <div className="break-all"><b>Texto:</b> {heatingStatus.stats.lastMessage.text.slice(0, 100)}...</div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>Carregando status...</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
