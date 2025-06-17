/* eslint-disable */
"use client";
import { useState, useEffect } from "react";
const api = require("../services/api").default;

export default function Home() {
	const [message, setMessage] = useState("");
	const [newMessage, setNewMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
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
	}, []);

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

	return (
		<>
			<div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-100">
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
