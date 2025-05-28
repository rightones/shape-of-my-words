"use client";

import dynamic from "next/dynamic";

const Sketch = dynamic(() => import("./sketch"), {
    ssr: false,
});

const Page = () => {
    return <Sketch />;
};

export default Page;
