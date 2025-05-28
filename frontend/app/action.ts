"use server";

export async function getVectorOfWord(word: string) {
    "use server";
    const res = await fetch("http://localhost:5001/word-to-coordinates", {
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
