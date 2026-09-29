import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {" "}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            backgroundColor: "green",
            height: "600px",
            width: "300px",
          }}
        >
          <div
            style={{
              backgroundColor: "red",
              height: "500px",
              width: "100px",
              marginTop: "20px",
              marginRight: "20px",
              padding: "10px",
            }}
          >
            123123123
          </div>
          <div
            style={{
              backgroundColor: "blue",
              height: "500px",
              width: "100px",
              marginTop: "20px",
              padding: "10px",
            }}
          >
            123123123
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
    </div>
  );
}
