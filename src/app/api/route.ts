import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_NAME,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // maksimal file upload 5MB
const ALLOWED_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/webp"];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        // ini buat validasi kalo gaada file terkirim langsung balas dengan error HTTP status 400 (bad request)
        if (!file) {
            return NextResponse.json(
                { error: "No file was sent!" },
                { status: 400 }
            );
        }

        // cek tipe file kalo ga sesuai
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "File does not comply with the requirements." },
                { status: 400 }
            );
        }

        // cek ukuran file
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size are to big!" },
                { status: 400 } // ini 400 karena error pada kesalahan client
            )
        }

        const byte = await file.arrayBuffer(); // ini buat ngubah data menjadi kode biner
        const buffer = Buffer.from(byte); // ini karena node.js itu butuh tipe buffer buat diproses
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        const result: UploadApiResponse = await cloudinary.uploader.upload(base64, {
            folder: "comment_photos",
            transformation: [
                { width: 200, height: 200, crop: "fill", gravity: "face", }
            ],
        });

        return NextResponse.json({ url: result.secure_url });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload, please try again." },
            { status: 500 } // ini 500 karena error di server
        );
    }
}