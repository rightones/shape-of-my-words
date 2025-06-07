"use server";

const DEBUG_MODE = true;

export async function getVectorOfWord(word: string) {
    if (DEBUG_MODE) {
        // For example: map each word to a unique but deterministic vector
        const hash = [...word].reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const x = ((hash % 100) - 50) / 100;
        const y = (((hash / 100) % 100) - 50) / 100;
        return [x, y] as [number, number];
    }

    const res = await fetch("http://localhost:3000/word-to-coordinates", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ words: [word] }),
    });

    if (!res.ok) {
        return null;
    }

    const data = await res.json();
    console.log(data);

    if (word in data) {
        return data[word] as [number, number];
    }

    return null;
}
