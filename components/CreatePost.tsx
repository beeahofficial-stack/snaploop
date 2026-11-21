"use client";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Post } from "@/lib/types";

export default function CreatePost({ onCreated }: { onCreated: (post: Post) => void }) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Max 10MB image");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !file) {
      toast.error("Add a caption or image");
      return;
    }
    setLoading(true);
    const fd = new FormData();
    if (caption) fd.append("caption", caption);
    if (file) fd.append("image", file);

    try {
      const res = await fetch("/api/posts", { method: "POST", body: fd });
      const data = await res.json();

      if (res.ok && data.post) {
        toast.success("Posted to feed! 🎉", { icon: "🌱" });
        onCreated(data.post);
        setCaption("");
        setFile(null);
        setPreview(null);
        setOpen(false);
      } else {
        const message = data?.message || data?.error || `Failed to post (${res.status})`;
        console.error("[CreatePost] Post mutation failed:", { status: res.status, data });
        toast.error(message);
      }
    } catch (error) {
      console.error("[CreatePost] Network mutation failed:", error);
      toast.error("Could not reach the post service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <div style={createRow} className="snaploop-composer-row">
        <button onClick={() => setOpen(true)} style={createBtn}>
          <span style={cameraBadge}>✍️</span>
          <span style={promptText}>Share a thought or snap…</span>
        </button>
        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => fileRef.current?.click(), 60);
          }}
          style={quickGalleryBtn}
          title="Choose photo from device gallery"
        >
          📷 Gallery
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            handleFile(e);
            setOpen(true);
          }}
          style={{ display: "none" }}
        />
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={cardHeader}>
        <span style={cardTitle}>Create New Post</span>
        <button
          onClick={() => {
            setOpen(false);
            setCaption("");
            setFile(null);
            setPreview(null);
          }}
          style={closeBtn}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's on your mind? Share something cozy… ✨"
          style={textarea}
          rows={3}
          maxLength={1000}
        />

        {/* Photo Preview or Gallery Picker Dropzone */}
        {preview ? (
          <div style={previewWrap}>
            <img src={preview} alt="preview" style={previewImg} />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              style={removeImg}
              title="Remove image"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            style={pickDropzone}
            title="Click to select image from your device gallery"
          >
            <span style={{ fontSize: 24 }}>🖼️</span>
            <span style={pickDropzoneText}>Tap to choose a photo from gallery</span>
          </div>
        )}

        <div className="snaploop-composer-footer" style={footer}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={photoBtn}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Choose Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: "none" }}
          />

          <button
            type="submit"
            disabled={loading || (!caption.trim() && !file)}
            style={{
              ...submitBtn,
              opacity: loading || (!caption.trim() && !file) ? 0.6 : 1,
            }}
          >
            {loading ? "Posting…" : "Post 🚀"}
          </button>
        </div>
      </form>
    </div>
  );
}

const createRow: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginBottom: "16px",
};

const createBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flex: 1,
  padding: "13px 16px",
  background: "#FFFFFF",
  border: "1px solid #E6E1D4",
  borderRadius: "20px",
  cursor: "pointer",
  color: "#5D664F",
  fontSize: "14px",
  textAlign: "left",
  boxShadow: "0 8px 24px rgba(54, 69, 29, 0.05)",
};

const quickGalleryBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 18px",
  background: "linear-gradient(135deg, #EAF6C6, #D8EFAE)",
  border: "1.5px solid #C8DE7A",
  borderRadius: "20px",
  color: "#2C3318",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(95, 133, 32, 0.12)",
  whiteSpace: "nowrap",
};

const cameraBadge: React.CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #EAF6C6, #D8EFAE)",
  display: "grid",
  placeItems: "center",
  fontSize: "15px",
};

const promptText: React.CSSProperties = {
  flex: 1,
  fontWeight: 600,
  color: "#2C3318",
};

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E6E1D4",
  borderRadius: "22px",
  marginBottom: "16px",
  overflow: "hidden",
  boxShadow: "0 10px 28px rgba(70, 80, 40, 0.07)",
};

const cardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 16px",
  borderBottom: "1px solid #E6E1D4",
};

const cardTitle: React.CSSProperties = {
  fontWeight: "700",
  fontSize: "16px",
  color: "#2C3318",
};

const closeBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#6F7658",
  fontSize: "18px",
  cursor: "pointer",
};

const textarea: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  background: "transparent",
  border: "none",
  color: "#2C3318",
  fontSize: "15px",
  resize: "none",
  lineHeight: "1.6",
  boxSizing: "border-box",
  outline: "none",
};

const pickDropzone: React.CSSProperties = {
  margin: "0 16px 12px",
  padding: "18px",
  borderRadius: "14px",
  border: "2px dashed #D6DEC2",
  background: "#FAF9F5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  cursor: "pointer",
};

const pickDropzoneText: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#5D664F",
};

const previewWrap: React.CSSProperties = {
  position: "relative",
  padding: "0 16px 12px",
};

const previewImg: React.CSSProperties = {
  width: "100%",
  maxHeight: "320px",
  objectFit: "cover",
  borderRadius: "14px",
};

const removeImg: React.CSSProperties = {
  position: "absolute",
  top: "8px",
  right: "24px",
  background: "rgba(44,51,24,0.65)",
  border: "none",
  color: "white",
  borderRadius: "50%",
  width: "28px",
  height: "28px",
  cursor: "pointer",
  fontSize: "14px",
  display: "grid",
  placeItems: "center",
};

const footer: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderTop: "1px solid #E6E1D4",
};

const photoBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 14px",
  background: "#F6F3EB",
  border: "1px solid #E6E1D4",
  borderRadius: "10px",
  color: "#46502B",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
};

const submitBtn: React.CSSProperties = {
  padding: "10px 22px",
  background: "linear-gradient(135deg, #A8D63A, #5F8520)",
  border: "none",
  borderRadius: "14px",
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(95, 133, 32, 0.22)",
};
