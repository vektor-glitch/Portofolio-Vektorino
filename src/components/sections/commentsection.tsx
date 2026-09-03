'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Comment {
    id: string;
    name: string;
    message: string;
    photoUrl?: string;
    createAt?: Timestamp | null;
}

export default function CommentSection() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const q = query(collection(db, "comments"), orderBy("createAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Comment, "id">),
            }));
            setComments(data);
        });
        return () => unsubscribe();
    }, []);

    const ALLOWED_TYPES = ["image/jpg", "image/jpeg", "image/png", "image/webp"];

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("File does not comply with the requirements")
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("File size cannot exceed 5MB");
            return;
        }

        setError("");
        setPhotoFile(file);
        setPreview(URL.createObjectURL(file));
    };

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!name.trim() || !message.trim()) {
            setError("Nama dan komentar tidak boleh kosong");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            let uploadedPhotoUrl = "";

            if (photoFile) {
                const formData = new FormData();
                formData.append("file", photoFile);

                const res = await fetch("/api", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Gagal upload foto");
                }
                uploadedPhotoUrl = data.url;
            }

            await addDoc(collection(db, "comments"), {
                name: name.trim(),
                message: message.trim(),
                photoUrl: uploadedPhotoUrl,
                createAt: serverTimestamp(),
            });

            setName("");
            setMessage("");
            setPhotoFile(null);
            setPreview(null);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi";
            setError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div>

        </div>
    );
}