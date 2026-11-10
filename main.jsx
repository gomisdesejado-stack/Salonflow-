import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard, CalendarDays, Users, Scissors, Settings, LogOut, Plus,
  Search, Bell, ChevronDown, ChevronLeft, ChevronRight, Clock, Euro,
  CheckCircle2, XCircle, Menu, X, Sparkles, ArrowUpRight, MoreHorizontal,
  CreditCard, UserRound, Mail, Phone, CalendarCheck, LoaderCircle
} from "lucide-react";
import "./style.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const demoClients = [
  { id: "c1", name: "Emma Laurent", email: "emma.laurent@email.com", phone: "06 12 34 56 78", visits: 12, last: "Aujourd'hui" },
  { id: "c2", name: "Lucas Bernard", email: "lucas.b@email.com", phone: "06 23 45 67 89", visits: 8, last: "Hier" },
  { id: "c3", name: "Chloé Martin", email: "chloe.m@email.com", phone: "06 34 56 78 90", visits: 5, last: "12 juin" },
  { id: "c4", name: "Nathan Petit", email: "nathan.p@email.com", phone: "06 45 67 89 01", visits: 3, last: "10 juin" },
  { id: "c5", name: "Sarah Robert", email: "sarah.r@email.com", phone: "06 56 78 90 12", visits: 9, last: "9 juin" }
];
const demoServices = [
  { id: "s1", name: "Coupe femme", duration: 45, price: 45, color: "lilac" },
  { id: "s2", name: "Coupe homme", duration: 30, price: 28, color: "blue" },
  { id: "s3", name: "Coloration", duration: 90, price: 85, color: "peach" },
  { id: "s4", name: "Brushing", duration: 30, price: 32, color: "green" }
];
const today = new Date();
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const shiftDay = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const demoBookings = [
  { id:"b1", client_name:"Emma Laurent", service_name:"Coupe femme", date:isoDay(today), time:"09:00", duration:45, price:45, status:"confirmed", color:"lilac" },
  { id:"b2", client_name:"Lucas Bernard", service_name:"Coupe homme", date:isoDay(today), time:"10:00", duration:30, price:28, status:"confirmed", color:"blue" },
  { id:"b3", client_name:"Chloé Martin", service_name:"Coloration", date:isoDay(today), time:"11:00", duration:90, price:85, status:"pending", color:"peach" },
  { id:"b4", client_name:"Nathan Petit", service_name:"Brushing", date:isoDay(today), time:"14:00", duration:30, price:32, status:"confirmed", color:"green" },
  { id:"b5", client_name:"Sarah Robert", service_name:"Coupe femme", date:isoDay(shiftDay(today,1)), time:"09:30", duration:45, price:45, status:"confirmed", color:"lilac" },
  { id:"b6", client_name:"Emma Laurent", service_name:"Coloration", date:isoDay(shiftDay(today,1)), time:"13:00", duration:90, price:85, status:"pending", color:"peach" },
  { id:"b7", client_name:"Lucas Bernard", service_name:"Coupe homme", date:isoDay(shiftDay(today,2)), time:"15:00", duration:30, price:28, status:"confirmed", color:"blue" }
];
const money = (n) => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n || 0);
const dateLabel = (date) => new Date(date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
const initials = (name="") => name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();

function App() {
  const [session,setSession] = useState(null);
  const [authReady,setAuthReady] = useState(!supabase);
  const [page,setPage] = useState("dashboard");
  const [mobileOpen,setMobileOpen] = useState(false);
  const [bookings,setBookings] = useState(demoBookings);
  const [clients,setClients] = useState(demoClients);
  const [services,setServices] = useState(demoServices);
  const [selectedDate,setSelectedDate] = useState(isoDay(today));
  const [search,setSearch] = useState("");
  const [modal,setModal] = useState("");
  const [toast,setToast] = useState("");
  const [loading,setLoading] = useState(false);
  const [userEmail,setUserEmail] = useState("");
  const [salonName,setSalonName] = useState("Atelier Camille");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setAuthReady(true);});
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,s)=>setSession(s));
    return () => subscription.unsubscribe();
  },[]);
  useEffect(()=>{ if(toast){const t=setTimeout(()=>setToast(""),2800);return()=>clearTimeout(t);} },[toast]);

  useEffect(() => {
    if (!supabase || !session?.user) return;
    setUserEmail(session.user.email || "");
    loadCloudData();
  },[session]);

  async function loadCloudData() {
    const [b,c,s] = await Promise.all([
      supabase.from("bookings").select("*").order("date").order("time"),
      supabase.from("clients").select("*").order("created_at",{ascending:false}),
      supabase.from("services").select("*").order("created_at")
    ]);
    if (!b.error && b.data) setBookings(b.data.map(x=>({...x,client_name:x.client_name || "Client",service_name:x.service_name || "Prestation"})));
    if (!c.error && c.data) setClients(c.data);
    if (!s.error && s.data) setServices(s.data);
  }

  async function signOut(){ if(supabase) await supabase.auth.signOut(); setSession(null); }
  async function saveBooking(form) {
    const service = services.find(s=>s.id===form.service_id) || services[0];
    let client = clients.find(c=>c.id===form.client_id);
    let clientId = form.client_id || null;
    if (form.client_id === "new") {
      const newRecord = { name: form.client_name, email: form.email || null, phone: form.phone || null };
      if (supabase && session) {
        const { data, error } = await supabase.from("clients").insert(newRecord).select().single();
        if (error) { setToast(error.message); return; }
        client = data; clientId = data.id;
      } else {
        client = { ...newRecord, id: "c" + Date.now(), visits: 1, last: "Aujourd'hui" };
        clientId = client.id;
        setClients(prev => [client, ...prev]);
      }
    }
    const record = { client_id:clientId, client_name:client?.name || form.client_name,
      service_id:service?.id || null, service_name:service?.name || form.service_name,
      date:form.date,time:form.time,duration:service?.duration || 30,price:service?.price || 0,status:"confirmed" };
    if(supabase && session) {
      const {error} = await supabase.from("bookings").insert(record);
      if(error){setToast(error.message);return;}
      await loadCloudData();
    } else {
      setBookings(prev=>[...prev,{...record,id:"b"+Date.now(),color:service?.color || "lilac"}]);
      if(!clients.some(c=>c.name===record.client_name)) setClients(prev=>[{id:"c"+Date.now(),name:record.client_name,email:form.email||"",phone:form.phone||"",visits:1,last:"Aujourd'hui"},...prev]);
    }
    setModal(""); setToast("Rendez-vous ajouté avec succès");
  }
  async function updateStatus(id,status) {
    if(supabase && session) { const {error}=await supabase.from("bookings").update({status}).eq("id",id); if(error){setToast(error.message);return;} }
    setBookings(prev=>prev.map(b=>b.id===id?{...b,status}:b)); setToast("Rendez-vous mis à jour");
  }
  async function addService(data) {
    const row={name:data.name,price:Number(data.price),duration:Number(data.duration),color:"lilac"};
    if(supabase && session){const {error}=await supabase.from("services").insert(row);if(error){setToast(error.message);return;}await loadCloudData();}
    else setServices(prev=>[...prev,{...row,id:"s"+Date.now()}]);
    setModal("");setToast("Prestation ajoutée");
  }

  const todayBookings = bookings.filter(b=>b.date===isoDay(today));
  const revenue = bookings.filter(b=>b.date===isoDay(today) && b.status!=="cancelled").reduce((a,b)=>a+Number(b.price||0),0);
  const upcoming = [...bookings].filter(b=>b.date>=isoDay(today)&&b.status!=="cancelled").sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5);
  const filteredClients = clients.filter(c=>(c.name+" "+(c.email||"")+" "+(c.phone||"")).toLowerCase().includes(search.toLowerCase()));

  if(!authReady) return <div className="loading-screen"><LoaderCircle className="spin"/> Chargement…</div>;
  if(supabase && !session) return <AuthScreen/>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?"open":""}`}>
      <div className="brand"><div className="brand-mark"><Scissors size={20}/></div><span>salon<span className="brand-light">flow</span></span></div>
      <div className="salon-switch"><div className="salon-avatar">AC</div><div className="salon-info"><b>{salonName}</b><small>Plan essentiel</small></div><ChevronDown size={16}/></div>
      <div className="nav-label">MENU PRINCIPAL</div>
      <nav>
        <NavItem icon={<LayoutDashboard/>} label="Vue d'ensemble" active={page==="dashboard"} onClick={()=>{setPage("dashboard");setMobileOpen(false)}}/>
        <NavItem icon={<CalendarDays/>} label="Réservations" active={page==="calendar"} onClick={()=>{setPage("calendar");setMobileOpen(false)}} count={bookings.filter(b=>b.status==="pending").length}/>
        <NavItem icon={<Users/>} label="Clients" active={page==="clients"} onClick={()=>{setPage("clients");setMobileOpen(false)}}/>
        <NavItem icon={<Scissors/>} label="Prestations" active={page==="services"} onClick={()=>{setPage("services");setMobileOpen(false)}}/>
      </nav>
      <div className="sidebar-bottom">
        <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><b>Passez à Pro</b><p>Développez votre salon avec des outils avancés.</p><button onClick={()=>setToast("Les offres seront bientôt disponibles.")}>Découvrir <ArrowUpRight size={14}/></button></div>
        <NavItem icon={<Settings/>} label="Paramètres" active={page==="settings"} onClick={()=>{setPage("settings");setMobileOpen(false)}}/>
        <button className="nav-item logout" onClick={signOut}><LogOut/><span>Déconnexion</span></button>
        <div className="profile"><div className="profile-avatar">CM</div><div><b>Camille Moreau</b><small>{userEmail||"Administratrice"}</small></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>
    {mobileOpen&&<div className="mobile-scrim" onClick={()=>setMobileOpen(false)}/>}
    <main className="main-content">
      <header className="topbar">
        <button className="mobile-menu icon-btn" onClick={()=>setMobileOpen(true)}><Menu/></button>
        <div className="breadcrumb">Espace salon <span>/</span> <b>{pageTitle(page)}</b></div>
        <div className="top-actions"><button className="icon-btn notification" onClick={()=>setToast("Vous êtes à jour !")}><Bell size={19}/><i/></button><div className="top-divider"/><div className="top-user"><div className="profile-avatar small">CM</div><span>Camille</span><ChevronDown size={15}/></div></div>
      </header>
      <div className="page-wrap">
        {page==="dashboard"&&<Dashboard bookings={bookings} todayBookings={todayBookings} revenue={revenue} upcoming={upcoming} setPage={setPage} setModal={setModal} updateStatus={updateStatus}/>}
        {page==="calendar"&&<CalendarPage bookings={bookings} selectedDate={selectedDate} setSelectedDate={setSelectedDate} setModal={setModal} updateStatus={updateStatus}/>}
        {page==="clients"&&<ClientsPage clients={filteredClients} search={search} setSearch={setSearch} setModal={setModal}/>}
        {page==="services"&&<ServicesPage services={services} setModal={setModal}/>}
        {page==="settings"&&<SettingsPage salonName={salonName} setSalonName={setSalonName} userEmail={userEmail} cloud={!!supabase}/>}
      </div>
    </main>
    {modal==="booking"&&<BookingModal clients={clients} services={services} onClose={()=>setModal("")} onSave={saveBooking}/>}
    {modal==="service"&&<ServiceModal onClose={()=>setModal("")} onSave={addService}/>}
    {modal==="client"&&<ClientModal onClose={()=>setModal("")} onSave={async(d)=>{if(supabase&&session){const {error}=await supabase.from("clients").insert(d);if(error){setToast(error.message);return;}await loadCloudData();}else setClients(p=>[{...d,id:"c"+Date.now(),visits:0,last:"Nouveau client"},...p]);setModal("");setToast("Client ajouté");}}/>}
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}

function pageTitle(p){return ({dashboard:"Vue d'ensemble",calendar:"Réservations",clients:"Clients",services:"Prestations",settings:"Paramètres"})[p];}
function NavItem({icon,label,active,onClick,count}){return <button className={`nav-item ${active?"active":""}`} onClick={onClick}>{icon}<span>{label}</span>{count>0&&<em>{count}</em>}</button>}

function Dashboard({todayBookings,revenue,upcoming,setPage,setModal,updateStatus}) {
  const confirmed=todayBookings.filter(b=>b.status==="confirmed").length;
  return <div className="fade-in">
    <div className="welcome-row"><div><div className="eyebrow">MARDI, 18 JUIN 2024</div><h1>Bonjour Camille <span>✦</span></h1><p>Voici ce qui se passe dans votre salon aujourd'hui.</p></div><button className="primary-btn" onClick={()=>setModal("booking")}><Plus size={17}/> Nouveau rendez-vous</button></div>
    <div className="stats-grid">
      <StatCard label="Rendez-vous aujourd'hui" value={todayBookings.length} note={`${confirmed} confirmés`} icon={<CalendarCheck/>} tone="purple"/>
      <StatCard label="Chiffre d'affaires du jour" value={money(revenue)} note="Sur les rendez-vous du jour" icon={<Euro/>} tone="green"/>
      <StatCard label="Clients reçus" value={confirmed} note="Aujourd'hui" icon={<Users/>} tone="orange"/>
      <StatCard label="En attente" value={todayBookings.filter(b=>b.status==="pending").length} note="À confirmer" icon={<Clock/>} tone="blue"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel schedule-panel"><div className="panel-head"><div><h2>Prochains rendez-vous</h2><p>Gardez un œil sur votre planning.</p></div><button className="text-btn" onClick={()=>setPage("calendar")}>Tout voir <ArrowUpRight size={15}/></button></div>
        {upcoming.length? <div className="appointment-list">{upcoming.map((b,i)=><Appointment key={b.id||i} booking={b} updateStatus={updateStatus}/>)}</div>:<Empty text="Aucun rendez-vous à venir."/>}
      </section>
      <section className="panel quick-panel"><div className="panel-head"><div><h2>Actions rapides</h2><p>Accédez rapidement aux outils.</p></div></div>
        <button className="quick-action" onClick={()=>setModal("booking")}><div className="quick-icon lavender"><CalendarDays/></div><span><b>Ajouter un rendez-vous</b><small>Planifier une visite client</small></span><ChevronRight/></button>
        <button className="quick-action" onClick={()=>setPage("clients")}><div className="quick-icon mint"><UserRound/></div><span><b>Voir les clients</b><small>Consulter votre clientèle</small></span><ChevronRight/></button>
        <button className="quick-action" onClick={()=>setModal("service")}><div className="quick-icon peach"><Scissors/></div><span><b>Ajouter une prestation</b><small>Gérer votre carte de services</small></span><ChevronRight/></button>
        <div className="tip-box"><Sparkles size={17}/><div><b>Le conseil du jour</b><p>Envoyez un rappel la veille pour réduire les rendez-vous oubliés.</p></div></div>
      </section>
    </div>
  </div>;
}
function StatCard({label,value,note,icon,tone}){return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tone}`}>{icon}</div></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>}
function Appointment({booking,updateStatus}){return <div className="appointment-row"><div className="appointment-time">{booking.time}</div><div className={`service-dot ${booking.color||"lilac"}`}/><div className="appointment-main"><b>{booking.client_name}</b><span>{booking.service_name} · {booking.duration||30} min</span></div><div className="appointment-price">{money(booking.price)}</div><Status status={booking.status}/>{booking.status==="pending"&&<button className="tiny-action" title="Confirmer" onClick={()=>updateStatus(booking.id,"confirmed")}><CheckCircle2 size={17}/></button>}</div>}
function Status({status}){const label={confirmed:"Confirmé",pending:"En attente",cancelled:"Annulé"}[status]||status;return <span className={`status ${status}`}>{label}</span>}
function Empty({text}){return <div className="empty-state"><CalendarDays size={25}/><p>{text}</p></div>}

function CalendarPage({bookings,selectedDate,setSelectedDate,setModal,updateStatus}) {
  const date=new Date(selectedDate+"T12:00:00");
  const week=Array.from({length:7},(_,i)=>shiftDay(date,i-3));
  const dayBookings=bookings.filter(b=>b.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));
  return <div className="fade-in"><div className="page-heading"><div><div className="eyebrow">ORGANISATION</div><h1>Réservations</h1><p>Consultez et gérez le planning de votre salon.</p></div><button className="primary-btn" onClick={()=>setModal("booking")}><Plus size={17}/> Nouveau rendez-vous</button></div>
    <section className="panel calendar-panel"><div className="calendar-toolbar"><div><h2>{date.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}</h2><p>Sélectionnez une journée pour voir les rendez-vous.</p></div><div className="calendar-nav"><button className="icon-btn" onClick={()=>setSelectedDate(isoDay(shiftDay(date,-7)))}><ChevronLeft/></button><button className="today-btn" onClick={()=>setSelectedDate(isoDay(today))}>Aujourd'hui</button><button className="icon-btn" onClick={()=>setSelectedDate(isoDay(shiftDay(date,7)))}><ChevronRight/></button></div></div>
      <div className="week-strip">{week.map(d=><button key={isoDay(d)} className={`day-cell ${isoDay(d)===selectedDate?"selected":""}`} onClick={()=>setSelectedDate(isoDay(d))}><span>{d.toLocaleDateString("fr-FR",{weekday:"short"})}</span><b>{d.getDate()}</b><i/></button>)}</div>
      <div className="day-heading"><h3>{dateLabel(selectedDate)}</h3><span>{dayBookings.length} rendez-vous</span></div>
      <div className="day-schedule">{Array.from({length:11},(_,i)=>i+9).map(hour=>{const items=dayBookings.filter(b=>Number(b.time.split(":")[0])===hour);return <div className="hour-row" key={hour}><div className="hour-label">{String(hour).padStart(2,"0")}:00</div><div className="hour-content">{items.length?items.map(b=><div className={`calendar-event ${b.color||"lilac"}`} key={b.id}><div><b>{b.time} · {b.client_name}</b><span>{b.service_name} · {money(b.price)}</span></div><Status status={b.status}/>{b.status==="pending"&&<button className="event-confirm" onClick={()=>updateStatus(b.id,"confirmed")}>Confirmer</button>}</div>):<span className="free-slot">Disponible</span>}</div></div>})}</div>
    </section>
  </div>;
}

function ClientsPage({clients,search,setSearch,setModal}){return <div className="fade-in"><div className="page-heading"><div><div className="eyebrow">VOTRE COMMUNAUTÉ</div><h1>Clients</h1><p>Retrouvez les informations et l'historique de vos clients.</p></div><button className="primary-btn" onClick={()=>setModal("client")}><Plus size={17}/> Ajouter un client</button></div>
  <section className="panel"><div className="table-toolbar"><div><h2>Tous les clients <span className="count-pill">{clients.length}</span></h2><p>Votre fichier clientèle.</p></div><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client…"/></div></div>
    <div className="table-scroll"><table><thead><tr><th>CLIENT</th><th>CONTACT</th><th>VISITES</th><th>DERNIÈRE VISITE</th><th></th></tr></thead><tbody>{clients.map(c=><tr key={c.id}><td><div className="client-cell"><div className="client-avatar">{initials(c.name)}</div><b>{c.name}</b></div></td><td><div className="contact-cell">{c.email||"—"}<small>{c.phone||""}</small></div></td><td><span className="visits-pill">{c.visits??0} visites</span></td><td>{c.last||"—"}</td><td><button className="icon-btn subtle-btn" title="Options"><MoreHorizontal/></button></td></tr>)}</tbody></table>{!clients.length&&<Empty text="Aucun client trouvé."/ >}</div>
  </section></div>}

function ServicesPage({services,setModal}){return <div className="fade-in"><div className="page-heading"><div><div className="eyebrow">VOTRE CARTE</div><h1>Prestations</h1><p>Gérez les services proposés par votre salon.</p></div><button className="primary-btn" onClick={()=>setModal("service")}><Plus size={17}/> Ajouter une prestation</button></div>
  <div className="services-grid">{services.map(s=><div className="service-card" key={s.id}><div className={`service-art ${s.color||"lilac"}`}><Scissors size={23}/></div><div className="service-card-body"><div><h3>{s.name}</h3><p><Clock size={14}/> {s.duration} minutes</p></div><b>{money(s.price)}</b></div><div className="service-card-footer"><span><i className="online-dot"/> Disponible à la réservation</span><MoreHorizontal size={18}/></div></div>)}</div>
  </div>}
function SettingsPage({salonName,setSalonName,userEmail,cloud}){return <div className="fade-in"><div className="page-heading"><div><div className="eyebrow">CONFIGURATION</div><h1>Paramètres</h1><p>Personnalisez les informations de votre espace.</p></div></div><div className="settings-layout"><section className="panel settings-panel"><h2>Informations du salon</h2><p>Ces informations sont utilisées dans votre espace de gestion.</p><label>Nom du salon<input value={salonName} onChange={e=>setSalonName(e.target.value)}/></label><label>Email du compte<input value={userEmail||"demo@salonflow.fr"} disabled/></label><label>Devise<select defaultValue="EUR"><option value="EUR">Euro (€)</option></select></label><button className="primary-btn" onClick={()=>alert("Paramètres locaux mis à jour.")}>Enregistrer les modifications</button></section><section className="panel settings-panel"><h2>Connexion & données</h2><p>{cloud?"Votre projet Supabase est configuré. Les données sont synchronisées avec la base.":"Vous êtes en mode démonstration. Les changements restent dans cette session."}</p><div className={`connection-state ${cloud?"connected":""}`}><span/><b>{cloud?"Supabase connecté":"Mode démonstration"}</b></div><small>Pour activer les comptes et la sauvegarde permanente, configurez les variables d'environnement et exécutez le script SQL fourni.</small></section></div></div>}

function Modal({title,subtitle,onClose,children}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-btn" onClick={onClose}><X/></button></div>{children}</div></div>}
function BookingModal({clients,services,onClose,onSave}){const [form,setForm]=useState({client_id:"",client_name:"",service_id:services[0]?.id||"",date:isoDay(today),time:"09:00",email:"",phone:""});const [newClient,setNewClient]=useState(false);const set=(k,v)=>setForm(p=>({...p,[k]:v}));return <Modal title="Nouveau rendez-vous" subtitle="Ajoutez une réservation au planning." onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(form)}} className="modal-form"><label>Client<select value={form.client_id} onChange={e=>{set("client_id",e.target.value);setNewClient(e.target.value==="new");}} required><option value="">Sélectionner un client</option>{clients.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}<option value="new">+ Nouveau client</option></select></label>{newClient&&<><label>Nom du client<input required value={form.client_name} onChange={e=>set("client_name",e.target.value)}/></label><label>Email<input type="email" value={form.email} onChange={e=>set("email",e.target.value)}/></label><label>Téléphone<input value={form.phone} onChange={e=>set("phone",e.target.value)}/></label></>}<label>Prestation<select value={form.service_id} onChange={e=>set("service_id",e.target.value)}>{services.map(s=><option value={s.id} key={s.id}>{s.name} · {money(s.price)} · {s.duration} min</option>)}</select></label><div className="form-two"><label>Date<input type="date" value={form.date} onChange={e=>set("date",e.target.value)} required/></label><label>Heure<input type="time" value={form.time} onChange={e=>set("time",e.target.value)} required/></label></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Annuler</button><button className="primary-btn" type="submit">Créer le rendez-vous</button></div></form></Modal>}
function ServiceModal({onClose,onSave}){const [d,setD]=useState({name:"",price:"",duration:"30"});return <Modal title="Nouvelle prestation" subtitle="Ajoutez un service à votre carte." onClose={onClose}><form className="modal-form" onSubmit={e=>{e.preventDefault();onSave(d)}}><label>Nom de la prestation<input required placeholder="Ex. Coupe femme" value={d.name} onChange={e=>setD({...d,name:e.target.value})}/></label><div className="form-two"><label>Prix (€)<input type="number" min="0" required value={d.price} onChange={e=>setD({...d,price:e.target.value})}/></label><label>Durée (min)<input type="number" min="5" step="5" required value={d.duration} onChange={e=>setD({...d,duration:e.target.value})}/></label></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Annuler</button><button className="primary-btn">Ajouter la prestation</button></div></form></Modal>}
function ClientModal({onClose,onSave}){const [d,setD]=useState({name:"",email:"",phone:""});return <Modal title="Ajouter un client" subtitle="Créez une fiche client." onClose={onClose}><form className="modal-form" onSubmit={e=>{e.preventDefault();onSave(d)}}><label>Nom complet<input required value={d.name} onChange={e=>setD({...d,name:e.target.value})}/></label><label>Email<input type="email" value={d.email} onChange={e=>setD({...d,email:e.target.value})}/></label><label>Téléphone<input value={d.phone} onChange={e=>setD({...d,phone:e.target.value})}/></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Annuler</button><button className="primary-btn">Enregistrer le client</button></div></form></Modal>}

function AuthScreen(){const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);async function submit(e){e.preventDefault();setBusy(true);setError("");const result=mode==="login"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});setBusy(false);if(result.error)setError(result.error.message);else if(mode==="signup")setError("Vérifiez votre boîte mail pour confirmer votre adresse.");}return <div className="auth-screen"><div className="auth-card"><div className="brand auth-brand"><div className="brand-mark"><Scissors/></div><span>salon<span className="brand-light">flow</span></span></div><h1>{mode==="login"?"Bon retour parmi nous":"Créer votre compte"}</h1><p>Connectez-vous à votre espace de gestion.</p><form onSubmit={submit}><label>Email professionnel<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@salon.fr"/></label><label>Mot de passe<input type="password" minLength="8" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 caractères minimum"/></label>{error&&<div className="auth-error">{error}</div>}<button className="primary-btn full-btn" disabled={busy}>{busy?"Chargement…":mode==="login"?"Se connecter":"Créer mon compte"}</button></form><div className="auth-switch">{mode==="login"?"Pas encore de compte ?":"Déjà inscrit ?"} <button onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Créer un compte":"Se connecter"}</button></div></div></div>}

createRoot(document.getElementById("root")).render(<App/>);
