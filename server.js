const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

const MAX_RETRIES = 3;
const BASE_DELAY = 2000;

// Delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Tanya Gemini dengan retry otomatis
async function askGemini(message) {

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {

        try {

            const response = await fetch(
                GEMINI_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": process.env.GEMINI_API_KEY
                    },

                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: message
                            }]
                        }]
                    })
                }
            );

            const data = await response.json();

            // Berhasil
            if (response.ok) {

                return (
                    data.candidates?.[0]?.content?.parts?.[0]?.text ||
                    "Gemini tidak memberikan jawaban."
                );
            }

            // Error yang boleh dicoba ulang
            const retryable =
                response.status === 408 ||
                response.status === 429 ||
                response.status >= 500;

            if (!retryable || attempt === MAX_RETRIES) {

                throw new Error(
                    data.error?.message ||
                    "Gemini API error"
                );
            }

            // 2s → 4s → 8s + sedikit random
            const delay =
                BASE_DELAY * Math.pow(2, attempt) +
                Math.floor(Math.random() * 1000);

            console.log(
                `Gemini sedang sibuk. Retry ${attempt + 1}/${MAX_RETRIES} dalam ${delay}ms`
            );

            await sleep(delay);

        } catch (error) {

            // Kalau error jaringan, coba lagi
            if (attempt === MAX_RETRIES) {
                throw error;
            }

            const delay =
                BASE_DELAY * Math.pow(2, attempt) +
                Math.floor(Math.random() * 1000);

            console.log(
                `Request gagal. Retry ${attempt + 1}/${MAX_RETRIES} dalam ${delay}ms`
            );

            await sleep(delay);
        }
    }
}


// Halaman utama
app.get("/", (req, res) => {

    res.send("Lan AI Server sedang aktif 🤖");

});


// Chat
app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        if (!message || typeof message !== "string") {

            return res.status(400).json({
                error: "Pesan kosong"
            });

        }

        const cleanMessage = message.trim();

        if (!cleanMessage) {

            return res.status(400).json({
                error: "Pesan kosong"
            });

        }

        console.log(
            "Pesan masuk:",
            cleanMessage
        );

        const reply = await askGemini(cleanMessage);

        res.json({
            reply: reply
        });

    } catch (error) {

        console.error(
            "ERROR:",
            error.message
        );

        res.status(500).json({
            error:
                "Gemini sedang sibuk atau terjadi kesalahan. Coba lagi sebentar."
        });

    }

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Lan AI Server aktif di port ${PORT}`
    );

});
