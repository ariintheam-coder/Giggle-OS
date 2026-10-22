import { useMemo, useState } from "react";

const TIPS = [
  { id: "start", name: "Getting started", summary: "Find your way around the desktop.", steps: [
    "Tap an icon on the desktop, or open the Start menu, to open an app in its own window.",
    "Drag a window by its top bar to move it. Use the buttons in the corner to shrink, enlarge or close it.",
    "Drag icons around the desktop to put them in your own order.",
    "Everything you make is saved to your account, so it is there next time you sign in.",
  ], extra: "Open Customize desktop in the Start menu to change the wallpaper, colours, icon size, taskbar position and clock." },
  { id: "folders", name: "Desktop folders", summary: "Keep your apps tidy.", steps: [
    "Choose Organise apps into folders in the Start menu, or press New folder on the desktop.",
    "Name the folder, pick a colour and tick the apps that belong inside.",
    "Or drag an app icon straight onto a folder to put it inside.",
    "To take an app out, open the folder and drag the app onto the dashed strip at the bottom.",
  ], extra: "Dragging needs a mouse or trackpad. On a phone or tablet, use Organise apps into folders." },
  { id: "files", name: "Files", summary: "Store important files privately.", steps: [
    "Press Upload, or drag files into the window.",
    "Make folders to sort things. Use the menu on a file to rename, move, download or delete it.",
    "Click a picture to preview it. Use the search box and sort options to find things.",
  ], extra: "Files up to 500 MB each work. Big files go up in pieces, so keep the window open until they finish. Only you can see your files." },
  { id: "browser", name: "Browser", summary: "Browse the web in tabs, with bookmarks and history.", steps: [
    "Type a web address or a search in the bar at the top and press Enter. Searches use Wikipedia.",
    "Press + for another tab. Use the arrows to go back and forward, and the circular arrow to reload.",
    "Press the star to bookmark a page. Bookmarks and History open from the bar and are saved to your account.",
    "If a page stays blank, press Open in new tab. That site does not allow itself to be shown inside another page.",
  ], extra: "Many big sites (such as Google, YouTube and social networks) refuse to open inside the Browser. Wikipedia, Project Gutenberg, the Internet Archive and many smaller sites work." },
  { id: "share", name: "Share", summary: "Share files with other users and find what they share.", steps: [
    "Open Share and press Share a file. Add a short note if you like.",
    "Everyone signed in to Giggle OS can now see your file and save it to their own Files.",
    "Use the search box and the type buttons (Music, Pictures, Documents) to find files others shared.",
    "Press Save to Files next to any file and it lands in your Files app, ready to open. Choose To my device if you want it in your browser downloads instead.",
    "To stop sharing, press the bin next to your own file. Turn on Just mine to see only your files.",
  ], extra: "Each file can be up to 500 MB. Big files go up and come down in pieces and are put back together for you, so keep the window open until they finish. Only share files you have the right to share. Files are stored on the site and handed out from there, so they stay available even when you are signed out." },
  { id: "editor", name: "Text Editor", summary: "Write documents and save them into Files.", steps: [
    "Type your document, then press Save or Ctrl + S and choose a name.",
    "Press Open to pick a saved document and keep editing it.",
    "Save again to update it. You get a warning before you lose unsaved changes.",
  ], extra: "It opens text-style files such as .txt, .md and .csv." },
  { id: "musmobile", name: "musmobile", summary: "Your music player, with playlists and FLAC support.", steps: [
    "Open musmobile and press Add music to choose audio files from your device (MP3, WAV, M4A, FLAC and more).",
    "Tap a song to play it, and use next, previous, shuffle, repeat, the seek bar and volume.",
    "Build playlists from your songs to keep your favourites together.",
  ], extra: "Your songs are chosen from your device each visit, so add them again if the list is empty." },
  { id: "videos", name: "Videos", summary: "Watch YouTube links here.", steps: [
    "On YouTube, press Share under the video, then Copy.",
    "Come back to Videos and paste the link into the YouTube link box with Ctrl + V (Cmd + V on a Mac).",
    "The video starts straight away. If not, press Watch.",
    "Tap Favorite on a video in Your video history to pin it, and use the search box to find old ones.",
  ], extra: "If a video won't play here, its owner has blocked it. Use Open on YouTube under the player." },
  { id: "calendar", name: "Calendar", summary: "Dates and reminders.", steps: [
    "Pick a day in the calendar.",
    "Type a reminder, add a time if you like, and press Add.",
    "Tick a reminder when it is done. Days with reminders show a dot.",
    "The Coming up list shows what is next.",
  ], extra: "Reminders don't send alerts, so check the Calendar to see them." },
  { id: "clock", name: "Clock & Timer", summary: "Time, countdowns and a stopwatch.", steps: [
    "The clock shows the time and date.",
    "In Timer, set minutes and seconds and press Start. It beeps when it ends.",
    "In Stopwatch, press Start, then Lap to mark a time.",
  ], extra: "The timer only runs while its window is open." },
  { id: "calculator", name: "Calculator", summary: "Quick sums.", steps: [
    "Tap the buttons or type on your keyboard.",
    "Use % for percent, +/- to flip the sign, and delete to remove a digit.",
  ], extra: "Dividing by zero shows Error. Press clear and carry on." },
  { id: "carrel", name: "Carrel", summary: "Your personal book library.", steps: [
    "Add a book file from your device.",
    "Open it from the library to read.",
  ], extra: "Carrel may show a blank page for some books. If it does, tell me the message at the bottom." },
  { id: "games", name: "Games", summary: "Play in their own windows.", steps: [
    "Open the Games folder on the desktop and choose a game.",
    "Click inside the game first so it can see your keyboard.",
    "Your progress is saved to your account where the game allows it.",
  ], extra: "Haven is a fantasy adventure game. NotePlate is for notes. LocalMind is a private AI that needs a recent Chrome or Edge on a computer with a good graphics card." },
  { id: "help", name: "Help and feedback", summary: "Tell me what you need.", steps: [
    "Choose Send feedback in the Start menu to report a problem or suggest an idea.",
    "Use the app request option to ask for a new app to be added.",
  ] },
];

export default function Tips() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState("start");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return TIPS;
    return TIPS.filter((t) => (t.name + " " + t.summary + " " + t.steps.join(" ") + " " + (t.extra || "")).toLowerCase().includes(s));
  }, [q]);
  const cur = list.find((t) => t.id === sel) || list[0];
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#12121a] text-white sm:flex-row">
      <nav aria-label="Tips topics" className="flex shrink-0 flex-col gap-2 border-b border-[#55556e] bg-[#1c1c28] p-3 sm:w-56 sm:border-b-0 sm:border-r sm:overflow-y-auto">
        <label htmlFor="tips-search" className="sr-only">Search tips</label>
        <input id="tips-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tips" className="min-h-11 w-full rounded-lg border border-[#55556e] bg-[#12121a] px-3 text-white placeholder:text-[#b4b4c8]" />
        <div role="tablist" aria-label="Topics" className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
          {list.map((t) => (
            <button key={t.id} role="tab" aria-selected={cur && cur.id === t.id} onClick={() => setSel(t.id)}
              className={"min-h-11 shrink-0 rounded-lg px-3 text-left font-semibold " + (cur && cur.id === t.id ? "bg-[#ffd166] text-[#111]" : "bg-[#2a2a3c] text-white hover:bg-[#35354b]")}>
              {t.name}
            </button>
          ))}
        </div>
        {list.length === 0 && <p className="m-0 text-sm text-[#d6d6e4]">No tips match that search.</p>}
      </nav>
      <section role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {cur ? (
          <div className="mx-auto max-w-2xl">
            <h2 className="m-0 text-2xl font-bold">{cur.name}</h2>
            <p className="mt-1 text-[#d6d6e4]">{cur.summary}</p>
            <ol className="mt-4 grid list-decimal gap-3 pl-5 text-[#f0f0f8]">
              {cur.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            {cur.extra && <p className="mt-5 rounded-xl border border-[#55556e] bg-[#1c1c28] p-3 text-[#e6e6f0]"><b>Good to know: </b>{cur.extra}</p>}
          </div>
        ) : <p className="text-[#d6d6e4]">Try a different word, such as files, music or folders.</p>}
      </section>
    </div>
  );
}
