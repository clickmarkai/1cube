import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6C5CE7",
          color: "white",
          fontSize: 36,
          fontWeight: 700,
          fontFamily: "Inter, sans-serif",
        }}
      >
        1
      </div>
    ),
    {
      ...size,
    }
  );
}
