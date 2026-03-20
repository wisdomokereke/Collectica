import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Paperclip, Search, Shield, FileText, Wallet, AlertTriangle, X, Sparkles, Lock, Image, File, ChevronRight, Loader2, Check, Bot } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const SCAM_WORDS = ['outside the platform','pay me directly','whatsapp me','bank transfer directly','bypass','off platform','my personal account']

const DEMO_CONVS = [
  { id:'c1', party:'TechFlow Nigeria', initials:'TF', contract:'Brand Identity', amount:'₦450,000', escrow:'active', online:true, unread:2,
    messages:[
      {id:'m1',from:'system',text:'🔒 Contract signed. Escrow of ₦450,000 funded.',time:'Mar 4, 10:00 AM',type:'system'},
      {id:'m2',from:'them',text:"Hi! Really excited to get started. Any questions about the brief?",time:'Mar 4, 10:15 AM',type:'text'},
      {id:'m3',from:'me',text:"Brief is clear. Starting with the moodboard — will send by Friday.",time:'Mar 4, 10:22 AM',type:'text'},
      {id:'m4',from:'system',text:'✅ Milestone 1 approved. ₦90,000 released.',time:'Mar 7, 4:45 PM',type:'system'},
      {id:'m5',from:'them',text:'The moodboard is perfect. Really captures the fintech energy.',time:'Mar 7, 5:00 PM',type:'text'},
      {id:'m6',from:'me',text:'Moving into logo concepts now. 3 options ready by Tuesday.',time:'Mar 7, 5:10 PM',type:'text'},
      {id:'m7',from:'them',text:'Looking great! Can we tweak the primary colour slightly?',time:'2m ago',type:'text'},
    ]
  },
  { id:'c2', party:'BuildLagos', initials:'BL', contract:'Pitch Deck', amount:'₦210,000', escrow:'active', online:false, unread:1,
    messages:[
      {id:'m1',from:'system',text:'🔒 Contract signed. Escrow of ₦210,000 funded.',time:'Mar 5, 9:00 AM',type:'system'},
      {id:'m2',from:'them',text:'We need the deck to be investor-ready. 15 slides as agreed.',time:'Mar 5, 9:30 AM',type:'text'},
      {id:'m3',from:'me',text:"Understood. I'll follow the agreed structure exactly.",time:'Mar 5, 9:45 AM',type:'text'},
      {id:'m4',from:'them',text:'Please include the missing 3 slides before resubmitting.',time:'1h ago',type:'text'},
    ]
  },
  { id:'c3', party:'Kemi Adeyemi', initials:'KA', contract:'Social Media Kit', amount:'₦180,000', escrow:'completed', online:false, unread:0,
    messages:[
      {id:'m1',from:'system',text:'🔒 Contract signed. Escrow of ₦180,000 funded.',time:'Mar 6',type:'system'},
      {id:'m2',from:'them',text:'Super excited! All brand assets attached.',time:'Mar 6',type:'text'},
      {id:'m3',from:'system',text:'✅ Full payment released. ₦180,000 sent to freelancer.',time:'Mar 8',type:'system'},
      {id:'m4',from:'them',text:'Thanks so much! Left you a 5-star review 🌟',time:'Mar 8',type:'text'},
    ]
  },
]

function MsgBubble({ msg, isDark, c }) {
  const isMe = msg.from === 'me'
  if (msg.type === 'system') return (
    <div className="flex justify-center my-4">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium max-w-sm text-center ${isDark?'bg-[#1a1a1a] border-[#2e2e2e] text-[#888]':'bg-[#f0f0f0] border-[#e0e0e0] text-[#666]'}`}>{msg.text}</div>
    </div>
  )
  if (msg.type === 'ai') return (
    <div className="flex justify-start my-3">
      <div className={`max-w-[80%] rounded-2xl border overflow-hidden ${isDark?'border-green-500/20 bg-green-500/5':'border-green-500/20 bg-green-500/5'}`}>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-green-500/20"><Bot size={12} className="text-green-500"/><span className="text-xs font-bold text-green-500">Collectica AI</span></div>
        <div className="px-4 py-3"><p className="text-xs leading-relaxed text-green-500/90 whitespace-pre-wrap">{msg.text}</p></div>
      </div>
    </div>
  )
  if (msg.type === 'file') return (
    <div className={`flex ${isMe?'justify-end':'justify-start'} mb-3`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border max-w-[70%] ${isMe?(isDark?'bg-white text-[#0a0a0a] border-white':'bg-[#0a0a0a] text-white border-[#0a0a0a]'):(isDark?'bg-[#1a1a1a] text-white border-[#2e2e2e]':'bg-white border-[#e0e0e0]')}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMe?(isDark?'bg-black/10':'bg-white/20'):isDark?'bg-[#2e2e2e]':'bg-[#f0f0f0]'}`}><File size={16}/></div>
        <div>
          <p className="text-sm font-bold truncate max-w-[150px]">{msg.file.name}</p>
          <p className="text-xs opacity-60">{msg.file.size}</p>
        </div>
        {msg.milestoneFlag && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>}
      </div>
    </div>
  )
  return (
    <div className={`flex ${isMe?'justify-end':'justify-start'} mb-3`}>
      <div className="max-w-[75%] flex flex-col gap-1">
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe?(isDark?'bg-white text-[#0a0a0a]':'bg-[#0a0a0a] text-white'):(isDark?'bg-[#1a1a1a] text-white border border-[#2e2e2e]':'bg-white text-[#0a0a0a] border border-[#e0e0e0]')}`}>{msg.text}</div>
        <p className={`text-xs px-1 ${c.muted} ${isMe?'text-right':''}`}>{msg.time}</p>
      </div>
    </div>
  )
}

function ChatView({ conv, isDark, c, onBack }) {
  const { user, displayName } = useAuth()
  const [msgs, setMsgs]       = useState(conv.messages)
  const [input, setInput]     = useState('')
  const [scamFlag, setScamFlag] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showInfo, setShowInfo]   = useState(false)
  const bottomRef = useRef(null)
  const fileRef   = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  useEffect(() => {
    if (!conv.dbId) return
    channelRef.current = supabase.channel('chat-' + conv.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${conv.dbId}` },
        (payload) => setMsgs(prev => [...prev, { id: payload.new.id, from: payload.new.sender_id === user?.id ? 'me' : 'them', text: payload.new.content, time: 'Just now', type: payload.new.type || 'text' }])
      ).subscribe()
    return () => supabase.removeChannel(channelRef.current)
  }, [conv.dbId])

  const sendMsg = async () => {
    if (!input.trim()) return
    const isScam = SCAM_WORDS.some(w => input.toLowerCase().includes(w))
    if (isScam) { setScamFlag(true); return }
    const newMsg = { id:'new-'+Date.now(), from:'me', text:input, time:'Just now', type:'text' }
    setMsgs(p => [...p, newMsg])
    setInput(''); setScamFlag(false)
    if (conv.dbId) {
      await supabase.from('messages').insert({ chat_id: conv.dbId, sender_id: user?.id, content: input, type: 'text' })
    }
    setTimeout(() => {
      setMsgs(p => [...p, { id:'rep-'+Date.now(), from:'them', text:"Got it, thanks! I'll get back to you shortly.", time:'Just now', type:'text' }])
    }, 1500)
  }

  const sendFile = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const isMilestone = file.name.includes('final') || file.name.includes('v1') || file.name.includes('complete')
    const fileMsg = { id:'f-'+Date.now(), from:'me', file:{ name:file.name, size:(file.size/1024/1024).toFixed(1)+' MB' }, time:'Just now', type:'file', milestoneFlag: isMilestone }
    setMsgs(p => [...p, fileMsg])
    if (isMilestone) {
      setTimeout(() => {
        setMsgs(p => [...p, { id:'sys-'+Date.now(), from:'system', text:'🤖 AI detected a potential milestone delivery. Client has been notified to review.', time:'Just now', type:'system' }])
      }, 1000)
    }
    if (conv.dbId && user) {
      const path = `${conv.dbId}/${Date.now()}-${file.name}`
      await supabase.storage.from('deliverables').upload(path, file, { upsert: false })
      const { data } = supabase.storage.from('deliverables').getPublicUrl(path)
      await supabase.from('messages').insert({ chat_id: conv.dbId, sender_id: user.id, content: file.name, file_url: data.publicUrl, file_name: file.name, file_size: file.size, type: 'file' })
    }
  }

  const callAI = async () => {
    setAiLoading(true)
    const history = msgs.filter(m => m.type === 'text').map(m => `${m.from === 'me' ? displayName : conv.party}: ${m.text}`).join('\n')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: `You are Collectica AI, a smart contract assistant. Based on this chat between a freelancer and client, identify the key agreements and draft a brief contract summary with: scope of work, deliverables, payment terms, and milestones.\n\nChat:\n${history}\n\nRespond in a clear, structured format.` }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || 'Could not generate contract at this time.'
      setMsgs(p => [...p, { id:'ai-'+Date.now(), from:'ai', text, time:'Just now', type:'ai' }])
    } catch {
      setMsgs(p => [...p, { id:'ai-'+Date.now(), from:'ai', text:'AI contract generation failed. Please try again.', time:'Just now', type:'ai' }])
    } finally { setAiLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${c.border} flex-shrink-0`}>
        {onBack && <button onClick={onBack} className={`p-1.5 rounded-lg ${isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]'} md:hidden`}><ArrowLeft size={16} className={c.text}/></button>}
        <div className="relative">
          <div className={`w-10 h-10 rounded-xl ${isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]'} border ${c.border} flex items-center justify-center font-bold text-sm ${c.text}`}>{conv.initials}</div>
          {conv.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2" style={{borderColor:isDark?'#111':'white'}}/>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${c.text}`}>{conv.party}</p>
          <p className={`text-xs ${c.muted}`}>{conv.contract}</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${c.border} text-xs font-bold ${conv.escrow==='completed'?'text-green-500':'text-orange-500'}`}>
            <Lock size={10}/> {conv.escrow==='completed'?'Complete':'Escrow Active'}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${c.border} text-xs font-bold ${c.muted}`}><Wallet size={10}/> {conv.amount}</div>
        </div>
        <button onClick={()=>setShowInfo(p=>!p)} className={`p-2 rounded-xl ${isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]'} ${c.light}`}><ChevronRight size={15} className={showInfo?'rotate-90':'rotate-0'}/></button>
      </div>

      {showInfo && (
        <div className={`border-b ${c.border} px-4 py-3 ${isDark?'bg-[#0a0a0a]':'bg-[#f8f8f8]'}`}>
          <div className="grid grid-cols-3 gap-2">
            {[{icon:<FileText size={13}/>,label:'Contract',path:'/contracts'},{icon:<Wallet size={13}/>,label:'Escrow',path:'/escrow'},{icon:<Shield size={13}/>,label:'Trust',path:'/trust'}].map(item=>(
              <Link key={item.label} to={item.path} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border ${c.border} text-xs font-semibold ${c.light} text-center`}>{item.icon}{item.label}</Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {msgs.map(m => <MsgBubble key={m.id} msg={m} isDark={isDark} c={c}/>)}
        <div ref={bottomRef}/>
      </div>

      {scamFlag && (
        <div className="mx-4 mb-3 flex items-start gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10">
          <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0"/>
          <div className="flex-1"><p className="text-xs font-bold text-red-500">⚠️ Off-platform payment detected</p><p className="text-xs text-red-400 mt-0.5">This message suggests payment outside Collectica. This removes your escrow protection. Edit your message to continue.</p></div>
          <button onClick={()=>setScamFlag(false)}><X size={12} className="text-red-400"/></button>
        </div>
      )}

      <div className={`flex items-center gap-2 px-4 py-3 border-t ${c.border} flex-shrink-0`}>
        <input ref={fileRef} type="file" className="hidden" onChange={sendFile}/>
        <button onClick={()=>fileRef.current?.click()} className={`p-2.5 rounded-xl ${isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]'} ${c.light} flex-shrink-0`}><Paperclip size={15}/></button>
        <button onClick={callAI} disabled={aiLoading} title="Ask AI to draft contract from this chat" className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${isDark?'bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20':'bg-green-500/10 border border-green-500/20 text-green-600 hover:bg-green-500/20'} disabled:opacity-40`}>
          {aiLoading?<Loader2 size={15} className="animate-spin"/>:<Sparkles size={15}/>}
        </button>
        <input type="text" placeholder="Type a message..." value={input} onChange={e=>{setInput(e.target.value);setScamFlag(false)}} onKeyDown={e=>{if(e.key==='Enter')sendMsg()}} className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${isDark?'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white':'bg-[#f8f8f8] text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]'}`}/>
        <button onClick={sendMsg} disabled={!input.trim()} className={`p-2.5 rounded-xl flex-shrink-0 transition-all disabled:opacity-30 ${isDark?'bg-white text-[#0a0a0a]':'bg-[#0a0a0a] text-white'}`}><Send size={15}/></button>
      </div>
    </div>
  )
}

export default function Messages() {
  const { theme, toggle } = useTheme()
  const { user } = useAuth()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [convs, setConvs]           = useState(DEMO_CONVS)
  const [selected, setSelected]     = useState(DEMO_CONVS[0])
  const [mobileView, setMobileView] = useState('list')
  const [search, setSearch]         = useState('')

  useEffect(() => { if (!user) navigate('/login') }, [user])

  const c = {
    bg:     isDark?'bg-[#0a0a0a]':'bg-[#f8f8f8]',
    card:   isDark?'bg-[#111]':'bg-white',
    bgMid:  isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]',
    bgAcc:  isDark?'bg-[#242424]':'bg-[#e8e8e8]',
    border: isDark?'border-[#2e2e2e]':'border-[#e0e0e0]',
    text:   isDark?'text-white':'text-[#0a0a0a]',
    muted:  isDark?'text-[#555]':'text-[#aaa]',
    light:  isDark?'text-[#888]':'text-[#666]',
    divider:isDark?'bg-[#2e2e2e]':'bg-[#e0e0e0]',
  }

  const filtered = convs.filter(cv=>cv.party.toLowerCase().includes(search.toLowerCase())||cv.contract.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>
      <header className={`flex items-center justify-between px-6 py-4 border-b ${c.border} ${c.card} flex-shrink-0`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}><ArrowLeft size={15}/> Dashboard</Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <span className={`text-sm font-bold ${c.text}`}>Messages</span>
          {convs.reduce((s,c)=>s+c.unread,0) > 0 && <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isDark?'bg-white text-[#0a0a0a]':'bg-[#0a0a0a] text-white'}`}>{convs.reduce((s,c)=>s+c.unread,0)}</div>}
        </div>
        <div className="flex items-center gap-2">
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.border} text-xs font-bold ${c.muted}`}><Sparkles size={11} className="text-green-500"/> AI Monitoring</div>
          <button onClick={toggle} className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm ${isDark?'border-[#2e2e2e] bg-[#1a1a1a]':'border-[#e0e0e0] bg-[#f0f0f0]'}`}>{isDark?'☀️':'🌙'}</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r ${c.border} ${c.card} flex flex-col ${mobileView==='chat'?'hidden md:flex':''}`}>
          <div className={`px-4 py-3 border-b ${c.border}`}>
            <div className="relative">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.muted}`}/>
              <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none ${isDark?'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e]':'bg-[#f8f8f8] text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0]'}`}/>
            </div>
          </div>
          <p className={`px-4 pt-3 text-xs font-bold uppercase tracking-widest ${c.muted}`}>All Conversations are contract-scoped</p>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(cv=>(
              <button key={cv.id} onClick={()=>{setSelected(cv);setMobileView('chat')}} className={`w-full flex items-start gap-3 px-4 py-4 text-left border-b ${c.border} transition-colors ${selected?.id===cv.id?(isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]'):(isDark?'hover:bg-[#111]':'hover:bg-[#f8f8f8]')}`}>
                <div className="relative flex-shrink-0">
                  <div className={`w-11 h-11 rounded-xl ${c.bgAcc} border ${c.border} flex items-center justify-center font-bold text-sm ${c.text}`}>{cv.initials}</div>
                  {cv.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2" style={{borderColor:isDark?'#111':'white'}}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-bold truncate ${c.text}`}>{cv.party}</p>
                    <span className={`text-xs flex-shrink-0 ${c.muted}`}>{cv.messages[cv.messages.length-1]?.time}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.muted}`}>{cv.contract}</p>
                  <p className={`text-xs truncate mt-1 ${cv.unread>0?(isDark?'text-white font-semibold':'text-[#0a0a0a] font-semibold'):c.muted}`}>{cv.messages[cv.messages.length-1]?.text}</p>
                </div>
                {cv.unread>0 && <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${isDark?'bg-white text-[#0a0a0a]':'bg-[#0a0a0a] text-white'}`}>{cv.unread}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${c.bg} ${mobileView==='list'?'hidden md:flex':''}`}>
          {selected ? <ChatView conv={selected} isDark={isDark} c={c} onBack={()=>setMobileView('list')}/> : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <div className={`w-16 h-16 rounded-2xl ${c.card} border ${c.border} flex items-center justify-center text-3xl`}>💬</div>
              <div><p className={`font-bold ${c.text}`}>Select a conversation</p><p className={`text-sm ${c.muted} mt-1`}>Choose a contract thread to start messaging</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
