import { AnimatePresence, motion } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import DropDown, { VibeType } from "../components/DropDown";
import Footer from "../components/Footer";
// import Header from "../components/Header";
import Github from "../components/GitHub";
import LoadingDots from "../components/LoadingDots";
import ResizablePanel from "../components/ResizablePanel";
import { signIn, signOut, useSession } from "next-auth/react";

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [desc, setDesc] = useState("");
  const [lang, setLang] = useState<VibeType>("English");
  const [tone, setTone] = useState("formal");
  const { data: session, status } = useSession();
  const [replyHistory, setReplyHistory] = useState<any[]>([]);
  const [classification, setClassification] = useState<{
    intent: string;
    urgency: string;
  } | null>(null);
  const [generatedDescs, setGeneratedDescs] = useState<string>("");
  const defultDesc = 'Tell David to have a meeting next Monday morning from Hudson.'
  console.log("Streamed response: ", {generatedDescs});
  let promptObj = {
    'English': "UK English",
    "中文": "Simplified Chinese",
    "繁體中文": "Traditional Chinese",
    "日本語": "Japanese",
    "Italiano": "Italian",
    "Deutsch": "German",
    "Español": "Spanish",
    "Français": "French",
    "Nederlands": "Dutch",
    "한국어": "Korean",
    "ភាសាខ្មែរ":"Khmer",
    "हिंदी" : "Hindi"
  }
  let text = desc;
  // Generate a business email in UK English that is friendly, but still professional and appropriate for the workplace. The email topic is:
  const prompt = `
  You are an AI email assistant.

  Write a reply to the following incoming business email.

  Language: ${promptObj[lang]}
  Tone: ${tone}

  The reply should:
  - directly address the sender's message
  - be professional and appropriate for the workplace
  - use the requested tone
  - not invent facts, commitments, attachments, refunds, dates, or actions that were not provided
  - be ready for the user to review and edit before sending

  Incoming email:
  ${text}
  `;

  const generateDesc = async (e: any) => {
    e.preventDefault();
    setGeneratedDescs("");
    setLoading(true);
    setClassification(null);

    const classificationResponse = await fetch("/api/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: desc,
      }),
    });

    if (classificationResponse.ok) {
      const classificationData = await classificationResponse.json();
      setClassification(classificationData);
    }
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });
    console.log("Edge function returned.");

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setGeneratedDescs((prev) => prev + chunkValue);
    }

    setLoading(false);
  };

  const loadReplyHistory = async () => {
    const response = await fetch("/api/replies");

    if (response.ok) {
      const data = await response.json();
      setReplyHistory(data);
    }
  };

  const saveReply = async () => {
    if (!desc || !generatedDescs) {
      alert("Generate a reply first.");
      return;
    }

    const response = await fetch("/api/replies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incomingEmail: desc,
        generatedReply: generatedDescs,
        tone: tone,
        intent: classification?.intent,
        urgency: classification?.urgency,
      }),
    });

    if (response.ok) {
      alert("Reply saved!");
      await loadReplyHistory();
    } else {
      alert("Failed to save reply.");
    }
  };

  return (
    <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Head>
        <title>Email Generator</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex justify-end items-center gap-3 my-4">
        {session ? (
          <>
            <span className="text-sm">
              Signed in as {session.user?.email}
            </span>

            <button
              onClick={() => signOut()}
              className="rounded-md border px-4 py-2"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("github")}
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Sign in with GitHub
          </button>
        )}
      </div>

      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-2 sm:mt-4">
        <div className="flex flex-wrap justify-center space-x-5">
          <a
            className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 shadow-md transition-colors hover:bg-gray-100 mb-5"
            href="https://twitter.com/shengxj1/status/1619207448547692547"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6 fill-slate-500 group-hover:fill-slate-700"
            >
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0 0 22 5.92a8.19 8.19 0 0 1-2.357.646 4.118 4.118 0 0 0 1.804-2.27 8.224 8.224 0 0 1-2.605.996 4.107 4.107 0 0 0-6.993 3.743 11.65 11.65 0 0 1-8.457-4.287 4.106 4.106 0 0 0 1.27 5.477A4.073 4.073 0 0 1 2.8 9.713v.052a4.105 4.105 0 0 0 3.292 4.022 4.093 4.093 0 0 1-1.853.07 4.108 4.108 0 0 0 3.834 2.85A8.233 8.233 0 0 1 2 18.407a11.615 11.615 0 0 0 6.29 1.84" />
            </svg>
            <p>Introduction</p>
          </a>

          <a
            className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 shadow-md transition-colors hover:bg-gray-100 mb-5"
            href="https://github.com/Mahajanchahat20/ai-email-assistant"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github />
            <p>GitHub Repository</p>
          </a>

        </div>

        <h1 className="sm:text-3xl text-2xl max-w-1xl font-bold text-slate-900">
          Generate your business emails in seconds
        </h1>
        {/* <p className="text-slate-500 mt-5">18,167 bios generated so far.</p> */}
        <div className="max-w-xl w-full">
          <div className="flex mt-4 items-center space-x-3 mb-3">
            <Image
              src="/1-black.png"
              width={30}
              height={30}
              alt="1 icon"
            />
            <p className="text-left font-medium">
              Paste the incoming email you want to reply to.
            </p>
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-2"
            placeholder="Paste the incoming email here..."
          />
          <div className="flex mb-5 items-center space-x-3">
            <Image src="/2-black.png" width={30} height={30} alt="1 icon" />
            <p className="text-left font-medium">Select your language.</p>
          </div>
          <div className="block">
            <DropDown vibe={lang} setVibe={(newLang) => setLang(newLang)} />
          </div>

          {!loading && (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-4 mt-3 hover:bg-black/80 w-full"
              onClick={(e) => generateDesc(e)}
            >
              Generate your email &rarr;
            </button>
          )}
          {loading && (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-4 mt-3 hover:bg-black/80 w-full"
              disabled
            >
              <LoadingDots color="white" style="large" />
            </button>
          )}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Email tone
          </label>

          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3"
          >
            <option value="formal">Formal</option>
            <option value="friendly">Friendly</option>
            <option value="concise">Concise</option>
          </select>
        </div>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{ duration: 2000 }}
        />
        <hr className="h-px bg-gray-700 border-1 dark:bg-gray-700" />
        <ResizablePanel>
          <AnimatePresence mode="wait">
            <motion.div className="space-y-10 my-4">
              {classification && (
                <div className="mt-6 w-full rounded-lg border border-gray-200 p-4">
                  <p className="font-semibold">Email Classification</p>

                  <p className="mt-2">
                    Intent:{" "}
                    <span className="font-medium capitalize">
                      {classification.intent}
                    </span>
                  </p>

                  <p>
                    Urgency:{" "}
                    <span className="font-medium capitalize">
                      {classification.urgency}
                    </span>
                  </p>
                </div>
              )}
              {generatedDescs && (
                <>
                  <div>
                    <h2 className="sm:text-4xl text-3xl font-bold text-slate-900 mx-auto">
                      Your generated email
                    </h2>
                  </div>
                  <div className="space-y-8 flex flex-col items-center justify-center max-w-xl mx-auto  whitespace-pre-wrap">

                    <div
                      className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border text-left"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedDescs);
                        toast("Email copied to clipboard", {
                          icon: "✂️",
                        });
                      }}
                    >
                      <textarea
                        value={generatedDescs}
                        onChange={(e) => setGeneratedDescs(e.target.value)}
                        className="w-full min-h-[250px] rounded-lg border border-gray-300 p-4"
                        placeholder="Your generated reply will appear here..."
                      />
                      {session && (
                        <button
                          onClick={saveReply}
                          className="mt-4 rounded-md bg-black px-4 py-2 text-white"
                        >
                          Save Reply
                        </button>
                      )}
                      {session && (
                        <button
                          onClick={loadReplyHistory}
                          className="mt-4 ml-3 rounded-md border border-gray-300 px-4 py-2"
                        >
                          Load History
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </ResizablePanel>

        {session && replyHistory.length > 0 && (
          <div className="mt-10 w-full max-w-2xl text-left">
            <h2 className="mb-4 text-2xl font-bold">
              Reply History
            </h2>

            {replyHistory.map((reply) => (
              <div
                key={reply.id}
                className="mb-4 rounded-lg border border-gray-200 p-4"
              >
                <p className="font-semibold">Incoming Email</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {reply.incoming_email}
                </p>

                <p className="mt-4 font-semibold">Saved Reply</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {reply.generated_reply}
                </p>

                <div className="mt-4 text-sm text-gray-500">
                  <span>Tone: {reply.tone}</span>
                  {reply.intent && (
                    <span className="ml-4">
                      Intent: {reply.intent}
                    </span>
                  )}
                  {reply.urgency && (
                    <span className="ml-4">
                      Urgency: {reply.urgency}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;
