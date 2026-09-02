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
        <section className="w-full max-w-3xl mx-auto py-10 px-4">
            <h2 className="text-2xl font-bold mb-6">Leave a Comment</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mb-10">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                        Message
                    </label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write your comment..."
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="photo" className="block text-sm font-medium mb-1">
                        Photo (Optional, max 5MB)
                    </label>
                    <input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 dark:file:bg-neutral-800 dark:file:text-neutral-300 cursor-pointer"
                    />
                    {preview && (
                        <div className="mt-3 relative w-16 h-16 rounded-full overflow-hidden border border-neutral-300 dark:border-neutral-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isSubmitting ? "Sending..." : "Post Comment"}
                </button>
            </form>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Comments ({comments.length})</h3>
                {comments.length === 0 ? (
                    <p className="text-neutral-500 text-sm">No comments yet. Be the first to comment!</p>
                ) : (
                    comments.map((item) => (
                        <div
                            key={item.id}
                            className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex gap-4 items-start"
                        >
                            {item.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={item.photoUrl}
                                    alt={item.name}
                                    className="w-10 h-10 rounded-full object-cover shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-semibold text-neutral-600 dark:text-neutral-300 shrink-0">
                                    {item.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-sm">{item.name}</h4>
                                    <span className="text-xs text-neutral-400">
                                        {item.createAt?.toDate ? item.createAt.toDate().toLocaleDateString() : "Just now"}
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300 break-words">
                                    {item.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}