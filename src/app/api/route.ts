import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_NAME,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // maksimal file upload 5MB

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

        // double cek di server, karena validasi di client site itu bisa di baypass orang yang iseng buat manggil API langsung
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "File size is too large!" },
                { status: 400 }
            );
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
            { status: 400 }
        );
    }
}