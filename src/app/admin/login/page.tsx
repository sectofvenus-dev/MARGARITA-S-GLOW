"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AdminLoginPage(){
 const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function login(e:React.FormEvent){e.preventDefault();setError("");const sb=getSupabaseBrowserClient();if(!sb){setError("La conexión con Supabase todavía no está configurada.");return;}setBusy(true);const {error}=await sb.auth.signInWithPassword({email,password});setBusy(false);if(error){setError("No se pudo iniciar sesión. Verificá tus datos y que la cuenta esté habilitada.");return;}router.replace("/admin");}
 return <section className="content-container"><div className="login-card"><img src="/brand/wordmark.png" alt="Margarita's Glow"/><h1>Panel de administración</h1><p>Ingresá con la cuenta privada de la propietaria.</p><form onSubmit={login}><label>Correo electrónico<input type="email" autoComplete="username" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label><label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} required/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={busy}>{busy?"Ingresando…":"Ingresar al panel"}</button></form><p style={{marginTop:20}}><Link className="text-link" href="/">Volver a la tienda</Link></p></div></section>;
}
