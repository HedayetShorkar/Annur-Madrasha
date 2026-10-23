// LiveClassSecure.jsx — আগের LiveClass.jsx-এর বদলে এটা ব্যবহার করুন
// রুট:
//   /teacher/login   -> <TeacherLogin />
//   /teacher         -> <TeacherDashboard />
//   /class/:room     -> <ClassRoom />

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:4000"; // ডিপ্লয় করলে ব্যাকএন্ডের আসল ঠিকানা দিন

const getToken = () => localStorage.getItem("teacherToken");

async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "কিছু একটা সমস্যা হয়েছে");
  return data;
}

// ---------- শিক্ষকের লগইন / রেজিস্টার ----------
export function TeacherLogin() {
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", signupCode: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    try {
      const data = await api(`/api/auth/${mode}`, { method: "POST", body: f });
      localStorage.setItem("teacherToken", data.token);
      localStorage.setItem("teacherName", data.teacher.name);
      nav("/teacher");
    } catch (e) {
      setErr(e.message);
    }
  };

  const input = { width: "100%", padding: 10, marginBottom: 10 };
  return (
    <div style={{ maxWidth: 380, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h2>{mode === "login" ? "শিক্ষক লগইন" : "শিক্ষক রেজিস্ট্রেশন"}</h2>
      {mode === "register" && (
        <>
          <input style={input} placeholder="আপনার নাম" onChange={set("name")} />
          <input style={input} placeholder="রেজিস্ট্রেশন কোড" onChange={set("signupCode")} />
        </>
      )}
      <input style={input} type="email" placeholder="ইমেইল" onChange={set("email")} />
      <input style={input} type="password" placeholder="পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" onChange={set("password")} />
      {err && <p style={{ color: "red" }}>{err}</p>}
      <button onClick={submit} style={{ padding: "10px 20px" }}>
        {mode === "login" ? "লগইন" : "রেজিস্টার করুন"}
      </button>
      <p>
        <a href="#" onClick={(e) => { e.preventDefault(); setErr(""); setMode(mode === "login" ? "register" : "login"); }}>
          {mode === "login" ? "নতুন শিক্ষক? রেজিস্টার করুন" : "আগে থেকেই অ্যাকাউন্ট আছে? লগইন"}
        </a>
      </p>
    </div>
  );
}

// ---------- শিক্ষকের ড্যাশবোর্ড ----------
export function TeacherDashboard() {
  const nav = useNavigate();
  const [classes, setClasses] = useState([]);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");

  const load = async () => {
    try {
      setClasses(await api("/api/classes", { auth: true }));
    } catch {
      nav("/teacher/login");
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api("/api/classes", {
        method: "POST", auth: true,
        body: { title, scheduledAt: when ? new Date(when).toISOString() : null },
      });
      setTitle(""); setWhen(""); setErr("");
      load();
    } catch (e) { setErr(e.message); }
  };

  const remove = async (id) => {
    if (!confirm("ক্লাসটি মুছে ফেলবেন? এই লিংক আর কাজ করবে না।")) return;
    await api(`/api/classes/${id}`, { method: "DELETE", auth: true });
    load();
  };

  const copy = async (room) => {
    await navigator.clipboard.writeText(`${window.location.origin}/class/${room}`);
    setCopied(room);
  };

  const logout = () => { localStorage.removeItem("teacherToken"); nav("/teacher/login"); };

  return (
    <div style={{ maxWidth: 700, margin: "30px auto", fontFamily: "sans-serif", padding: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>স্বাগতম, {localStorage.getItem("teacherName")}</h2>
        <button onClick={logout}>লগআউট</button>
      </div>

      <h3>নতুন ক্লাস</h3>
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="ক্লাসের নাম (ইংরেজিতে ভালো, যেমন physics)" style={{ width: "100%", padding: 10, marginBottom: 8 }} />
      <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
        style={{ padding: 10, marginBottom: 8 }} />
      <br />
      <button onClick={create} disabled={!title.trim()}>ক্লাস তৈরি করুন</button>
      {err && <p style={{ color: "red" }}>{err}</p>}

      <h3 style={{ marginTop: 30 }}>আমার ক্লাসসমূহ</h3>
      {classes.length === 0 && <p>এখনো কোনো ক্লাস নেই।</p>}
      {classes.map((c) => (
        <div key={c.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <strong>{c.title}</strong>
          {c.scheduledAt && <div>সময়: {new Date(c.scheduledAt).toLocaleString("bn-BD")}</div>}
          <div style={{ fontSize: 13, color: "#666", wordBreak: "break-all" }}>
            {window.location.origin}/class/{c.room}
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={() => nav(`/class/${c.room}`)}>ক্লাস শুরু করুন</button>
            <button onClick={() => copy(c.room)}>{copied === c.room ? "কপি হয়েছে ✓" : "ছাত্রদের লিংক কপি"}</button>
            <button onClick={() => remove(c.id)}>মুছুন</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- ক্লাস পেজ ----------
// শিক্ষক লগইন থাকলে এবং ক্লাসটি তার হলে মডারেটর, নাহলে ছাত্র হিসেবে ঢোকে
export function ClassRoom() {
  const { room } = useParams();
  const ref = useRef(null);
  const apiRef = useRef(null);
  const [name, setName] = useState(localStorage.getItem("teacherName") || "");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!joined) return;
    let script;
    let cancelled = false;

    (async () => {
      try {
        let info;
        try {
          info = await api(`/api/join/${room}/teacher`, { auth: true }); // শিক্ষক
        } catch {
          info = await api(`/api/join/${room}?name=${encodeURIComponent(name)}`); // ছাত্র
        }
        if (cancelled) return;

        script = document.createElement("script");
        script.src = `https://${info.domain}/external_api.js`;
        script.async = true;
        script.onload = () => {
          apiRef.current = new window.JitsiMeetExternalAPI(info.domain, {
            roomName: info.room,
            jwt: info.jwt,
            parentNode: ref.current,
            width: "100%",
            height: "100%",
            configOverwrite: { prejoinPageEnabled: false, disableDeepLinking: true },
          });
        };
        script.onerror = () => setError("ভিডিও সার্ভারে সংযোগ হয়নি");
        document.body.appendChild(script);
      } catch (e) {
        setError(e.message);
      }
    })();

    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      if (script) document.body.removeChild(script);
    };
  }, [joined, room, name]);

  if (!joined) {
    return (
      <div style={{ maxWidth: 400, margin: "60px auto", fontFamily: "sans-serif" }}>
        <h2>ক্লাসে যোগ দিন</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম"
          style={{ width: "100%", padding: 10, marginBottom: 10 }} />
        <button disabled={!name.trim()} onClick={() => setJoined(true)}>ক্লাসে ঢুকুন</button>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {error && <p style={{ color: "red", padding: 10 }}>{error}</p>}
      <div ref={ref} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
