const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Lan AI Server aktif 🤖");
});

app.post("/chat", async (req, res) => {
    const message = req.body.message;

    if (!message) {
        return res.status(400).json({
            error: "Pesan kosong"
        });
    }

    res.json({
        reply: "Server menerima: " + message
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Lan AI Server aktif di port " + PORT);
});
