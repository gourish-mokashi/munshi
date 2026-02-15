import { getAgentResponse } from "../agent";
import type { Request, Response } from "express";
import { prisma } from "../exports/prisma";
import fs from "fs";
import path from "path";
import { sarvamClient } from "../exports/sarvam";
import { removeSpecialCharacters } from "../lib/stripSpecialCharacters";

export async function getAIResponse(req: Request, res: Response) {
    try {
        const userId = req.user?.id 
        const userInput = req.query["input"] as string;
        if (!userInput) {
            res.status(400).json({
                success: false,
                error: "Missing 'input' query parameter",
            });
            return;
        }

        const response = await getAgentResponse(userInput, userId);

        // Save user input and agent response to chat history
        await appendMessageToChat("USER", userInput, userId);
        await appendMessageToChat("AGENT", response, userId);

        res.json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error("Error getting AI response:", error);
        res.status(500).json({
            success: false,
            error: "An error occurred while getting AI response",
        });
    }
}

export async function getAIResponseWithAudio(req: Request, res: Response) {
    try {
        const userId = req.user?.id
        const { audio }= req.body

        if(!audio) {
            res.status(400).json({
                success: false,
                error: "Missing 'audio' in request body",
            });
            return;
        }

        // Convert base64 → temp file
        const buffer = Buffer.from(audio, "base64");
        const tempPath = path.join(__dirname, "temp.wav");

        fs.writeFileSync(tempPath, buffer);

        const translitResponse = await sarvamClient.speechToText.transcribe({
            file: fs.createReadStream(tempPath),
            model: "saaras:v3",
            mode: "translit",
            language_code: "hi-IN",
        })

        fs.unlinkSync(tempPath);

        const response = await getAgentResponse(translitResponse.transcript, userId);
        const cleanResponseForAudio = removeSpecialCharacters(response);

        const audioResponse = await sarvamClient.textToSpeech.convert({
            text: cleanResponseForAudio,
            model: "bulbul:v3",
            target_language_code: "hi-IN",
            pace: 1.1,
        })

        // Save user input and agent response to chat history
        await appendMessageToChat("USER", translitResponse.transcript, userId);
        await appendMessageToChat("AGENT", response, userId);

        res.json({
            success: true,
            data: {
                transcript: translitResponse.transcript,
                response,
            },
            audio: audioResponse.audios[0], 
        });

    } catch (err) {
        console.error("Error in getAIResponseWithAudio:", err);
        res.status(500).json({
            success: false,
            error: "An error occurred while processing audio response",
        });
    }
}

export async function getChatHistory(req: Request, res: Response) {
    try {
        const { cursor, limit = 10 } = req.query;

        // get the last limit messages from cursor in the chat history
        const messages = await prisma.chat.findMany({
            where: {
                ...(cursor && {
                    createdAt: { lt: new Date(String(cursor)) },
                    userId: req.user?.id, 
                }),
            },
            orderBy: { createdAt: "desc" },
            take: Number(limit),
            select: {
                createdAt: true,
                messages: {
                    select: {
                        sender: true,
                        message: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: messages || [],
            nextCursor:
                messages.length > 0
                    ? messages[messages.length - 1]?.createdAt
                    : null,
        });
    } catch (error) {
        console.error("Error getting chat history:", error);
        res.status(500).json({
            success: false,
            error: "An error occurred while getting chat history",
        });
    }
}

async function appendMessageToChat(sender: "USER" | "AGENT", message: string, userId: string) {
    try {

        let chat = await prisma.chat.findFirst({
            where: {
                userId: userId,
            },
        });

        if (!chat) {
            chat = await prisma.chat.create({
                data: {
                    userId: userId,
                },
            });
        }

        await prisma.message.create({
            data: {
                sender,
                message,
                chatId: chat.id,
                userId: userId,
            },
        });
    } catch (error) {
        console.error("Error appending message to chat:", error);
    }
}