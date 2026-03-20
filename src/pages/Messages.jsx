import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Send, Paperclip, Search, Shield, FileText,
  Wallet, AlertTriangle, X, Sparkles, Lock, File,
  ChevronRight, Loader2, Bot, Briefcase, Bell, Plus,
  CheckCircle, Clock, DollarSign
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth, ROLES } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const SCAM_WORDS = [
  'outside the platform', 'pay me directly', 'whatsapp me',
  'bank transfer directly', 'bypass', 'off platform', 'my personal account',
  'send to my account', 'pay cash'
]

const COLLE_TRIGGER = /^colle\b/i

// ── Message bubble ─────────────────────────────────────────
function MsgBubble({ msg, isDark, c, myId }) {
  const isMe = msg.sender_id === myId

  if (msg.type === 'system') return (
    <div className="flex justify-center my-4">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium max-w-xs text-center
        ${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e] text-[#888]' : 'bg-[#f0f0f0] border-[#e0e0e0] text-[#666]'}`}>
        {msg.content}
      </div>
    </div>
  )

  if (msg.type === 'colle') return (
    <div className="flex justify-start my-3 px-2">
      <div className={`max-w-[85%] rounded-2xl border overflow-hidden border-green-500/20 bg-green-500/5`}>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-green-500/20">
          <Bot size={12} className="text-green-500"/>
          <span className="text-xs font-bold text-green-500">Colle AI</span>
          <span className="text-xs text-green-500/50 ml-auto">Collectica AI</span>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs leading-relaxed text-green-400 whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    </div>
  )

  if (msg.type === 'file') return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 px-2`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border max-w-[70%]
        ${isMe
          ? isDark ? 'bg-white text-[#0a0a0a] border-white' : 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
          : isDark ? 'bg-[#1a1a1a] text-white border-[#2e2e2e]' : 'bg-white border-[#e0e0e0]'}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
          ${isMe ? 'bg-black/10' : isDark ? 'bg-[#2e2e2e]' : 'bg-[#f0f0f0]'}`}>
          <File size={16}/>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate max-w-[140px]">{msg.file_name || 'File'}</p>
          <p className="text-xs opacity-60">
            {msg.file_size ? `${(msg.file_size / 1024 / 1024).toFixed(1)} MB` : 'Attachment'}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 px-2`}>
      <div className="max-w-[75%] flex flex-col gap-1">
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isMe
            ? isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'
            : isDark ? 'bg-[#1a1a1a] text-white border border-[#2e2e2e]' : 'bg-white text-[#0a0a0a] border border-[#e0e0e0]'}`}>
          {msg.content}
        </div>
        <p className={`text-xs px-1 ${c.muted} ${isMe ? 'text-right' : ''}`}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ── Chat view ──────────────────────────────────────────────
function ChatView({ chat, isDark, c, onBack, myId, displayName }) {
  const [msgs, setMsgs]           = useState([])
  const [input, setInput]         = useState('')
  const [scamFlag, setScamFlag]   = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [colleActive, setColleActive] = useState(false)
  const [showInfo, setShowInfo]   = useState(false)
  const [loading, setLoading]     = useState(true)
  const bottomRef = useRef(null)
  const fileRef   = useRef(null)

  const partyName = myId === chat.client_id
    ? chat.freelancer?.full_name
    : chat.client?.full_name
  const initials = (partyName || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel('chat-' + chat.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'messages', filter: `chat_id=eq.${chat.id}`
      }, payload => {
        setMsgs(prev => {
          // avoid duplicates
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [chat.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })
    if (data) setMsgs(data)
    setLoading(false)
  }

  const sendMsg = async () => {
    const text = input.trim()
    if (!text) return

    // Scam detection
    if (SCAM_WORDS.some(w => text.toLowerCase().includes(w))) {
      setScamFlag(true)
      return
    }

    // Colle trigger
    if (COLLE_TRIGGER.test(text)) {
      setInput('')
      callColle(text)
      return
    }

    setInput('')
    setScamFlag(false)

    await supabase.from('messages').insert({
      chat_id: chat.id,
      sender_id: myId,
      content: text,
      type: 'text',
    })
  }

  const sendFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const path = `${chat.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage
      .from('deliverables')
      .upload(path, file, { upsert: false })

    if (!error) {
      const { data } = supabase.storage.from('deliverables').getPublicUrl(path)
      await supabase.from('messages').insert({
        chat_id: chat.id,
        sender_id: myId,
        content: file.name,
        file_url: data.publicUrl,
        file_name: file.name,
        file_size: file.size,
        type: 'file',
      })
    } else {
      // Still show locally even if storage fails
      await supabase.from('messages').insert({
        chat_id: chat.id,
        sender_id: myId,
        content: file.name,
        file_name: file.name,
        file_size: file.size,
        type: 'file',
      })
    }
    e.target.value = ''
  }

  const callColle = async (userMessage) => {
    setAiLoading(true)
    setColleActive(true)

    // First insert a "Colle is thinking..." system message
    await supabase.from('messages').insert({
      chat_id: chat.id,
      sender_id: null,
      content: `${displayName} called Colle...`,
      type: 'system',
    })

    // Build conversation history for context
    const history = msgs
      .filter(m => m.type === 'text')
      .map(m => `${m.sender_id === myId ? displayName : partyName}: ${m.content}`)
      .join('\n')

    const prompt = userMessage.length > 6
      ? `The user said: "${userMessage}"\n\nConversation so far:\n${history || 'No messages yet.'}`
      : `Conversation so far:\n${history || 'No messages yet — just introduced yourself.'}`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are Colle, the AI legal assistant built into Collectica — a contract-first freelance platform for Africa. You are present in every chat between a client and freelancer. You help them:
1. Draft contracts from their conversation
2. Define milestones and payment terms
3. Protect both parties from disputes
4. Answer questions about their agreement

Be concise, professional, and helpful. Address both parties. If asked to draft a contract, extract key terms from the conversation and present them clearly. Always remind users that funds are held in escrow for protection.`,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || 'I could not process that request. Please try again.'

      await supabase.from('messages').insert({
        chat_id: chat.id,
        sender_id: null,
        content: text,
        type: 'colle',
      })
    } catch {
      await supabase.from('messages').insert({
        chat_id: chat.id,
        sender_id: null,
        content: 'I\'m having trouble connecting right now. Please try again in a moment.',
        type: 'colle',
      })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${c.border} flex-shrink-0 ${isDark ? 'bg-[#111]' : 'bg-white'}`}>
        {onBack && (
          <button onClick={onBack}
            className={`p-1.5 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} md:hidden`}>
            <ArrowLeft size={16} className={c.text}/>
          </button>
        )}
        <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} border ${c.border} flex items-center justify-center font-bold text-sm ${c.text} flex-shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${c.text}`}>{partyName || 'Unknown'}</p>
          <p className={`text-xs ${c.muted}`}>
            {chat.contract?.title || chat.job?.title || 'Contract chat'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {chat.contract && (
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${c.border} text-xs font-bold text-green-500`}>
              <Lock size={10}/> Escrow Active
            </div>
          )}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${c.border} text-xs font-bold`}
            style={{ color: colleActive ? '#22c55e' : undefined }}>
            <Bot size={10} className={colleActive ? 'text-green-500' : c.muted}/>
            <span className={colleActive ? 'text-green-500' : c.muted}>Colle</span>
          </div>
          <button onClick={() => setShowInfo(p => !p)}
            className={`p-2 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} ${c.light}`}>
            <ChevronRight size={15} className={showInfo ? 'rotate-90 transition-transform' : 'transition-transform'}/>
          </button>
        </div>
      </div>

      {/* Contract info panel */}
      {showInfo && (
        <div className={`border-b ${c.border} px-4 py-3 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f8f8f8]'}`}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <FileText size={13}/>, label: 'Contracts', path: '/contracts' },
              { icon: <Wallet size={13}/>, label: 'Escrow', path: '/escrow' },
              { icon: <Shield size={13}/>, label: 'Trust', path: '/trust' },
            ].map(item => (
              <Link key={item.label} to={item.path}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border ${c.border} text-xs font-semibold ${c.light} text-center transition-all ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f0f0f0]'}`}>
                {item.icon}{item.label}
              </Link>
            ))}
          </div>
          <p className={`text-xs ${c.muted} mt-3 text-center`}>
            💡 Type <span className="font-bold text-green-500">Colle</span> in the chat to summon AI contract assistance
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
            <div className="text-4xl">👋</div>
            <div>
              <p className={`font-bold ${c.text}`}>Start the conversation</p>
              <p className={`text-xs ${c.muted} mt-1`}>
                Type <span className="text-green-500 font-bold">Colle</span> at any time to get AI help drafting your contract.
              </p>
            </div>
          </div>
        ) : (
          msgs.map(m => (
            <MsgBubble key={m.id} msg={m} isDark={isDark} c={c} myId={myId}/>
          ))
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Scam warning */}
      {scamFlag && (
        <div className="mx-4 mb-3 flex items-start gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10">
          <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0"/>
          <div className="flex-1">
            <p className="text-xs font-bold text-red-500">⚠️ Off-platform payment detected</p>
            <p className="text-xs text-red-400 mt-0.5">
              This message suggests payment outside Collectica. This removes your escrow protection. Please edit your message.
            </p>
          </div>
          <button onClick={() => setScamFlag(false)}><X size={12} className="text-red-400"/></button>
        </div>
      )}

      {/* Colle typing indicator */}
      {aiLoading && (
        <div className="flex items-center gap-2 px-6 py-2">
          <Bot size={12} className="text-green-500"/>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}/>
            ))}
          </div>
          <span className="text-xs text-green-500 font-medium">Colle is thinking...</span>
        </div>
      )}

      {/* Input bar */}
      <div className={`flex items-center gap-2 px-4 py-3 border-t ${c.border} flex-shrink-0 ${isDark ? 'bg-[#111]' : 'bg-white'}`}>
        <input ref={fileRef} type="file" className="hidden" onChange={sendFile}/>
        <button onClick={() => fileRef.current?.click()}
          className={`p-2.5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} ${c.light} flex-shrink-0`}>
          <Paperclip size={15}/>
        </button>
        <button onClick={() => { setInput('Colle'); }}
          title="Summon Colle AI"
          className="p-2.5 rounded-xl flex-shrink-0 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 transition-all">
          <Bot size={15}/>
        </button>
        <input
          type="text"
          placeholder='Message... or type "Colle" for AI help'
          value={input}
          onChange={e => { setInput(e.target.value); setScamFlag(false) }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
          className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
            ${isDark
              ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-green-500/50'
              : 'bg-[#f8f8f8] text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]'}`}/>
        <button onClick={sendMsg} disabled={!input.trim() || aiLoading}
          className={`p-2.5 rounded-xl flex-shrink-0 transition-all disabled:opacity-30
            ${isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'}`}>
          <Send size={15}/>
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
export default function Messages() {
  const { theme, toggle } = useTheme()
  const { user, displayName, isFreelancer } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDark = theme === 'dark'

  const [chats, setChats]           = useState([])
  const [jobs, setJobs]             = useState([])
  const [selected, setSelected]     = useState(null)
  const [mobileView, setMobileView] = useState('list')
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)

  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    card:    isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:   isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    bgAcc:   isDark ? 'bg-[#242424]'     : 'bg-[#e8e8e8]',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'      : 'text-[#666]',
    divider: isDark ? 'bg-[#2e2e2e]'     : 'bg-[#e0e0e0]',
    input:   isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e]'
      : 'bg-[#f8f8f8] text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0]',
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchChats()
    if (isFreelancer) fetchJobs()
  }, [user, isFreelancer])

  // Auto-select chat from URL param
  useEffect(() => {
    const contractId = searchParams.get('contract')
    const jobId = searchParams.get('job')
    if ((contractId || jobId) && chats.length > 0) {
      const match = chats.find(ch =>
        ch.contract_id === contractId || ch.job_id === jobId
      )
      if (match) { setSelected(match); setMobileView('chat') }
    }
  }, [searchParams, chats])

  const fetchChats = async () => {
    const { data } = await supabase
      .from('chats')
      .select(`
        *,
        client:users!chats_client_id_fkey(id, full_name, trust_score),
        freelancer:users!chats_freelancer_id_fkey(id, full_name, trust_score),
        contract:contracts(id, title, status, total_value),
        job:jobs(id, title, budget_min, budget_max)
      `)
      .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (data) {
      // Get last message for each chat
      const chatsWithLast = await Promise.all(data.map(async ch => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, type')
          .eq('chat_id', ch.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        return { ...ch, lastMessage: lastMsg }
      }))
      setChats(chatsWithLast)
    }
    setLoading(false)
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, client:users!jobs_client_id_fkey(full_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setJobs(data)
  }

  const filtered = chats.filter(ch => {
    const party = user.id === ch.client_id ? ch.freelancer : ch.client
    const name = party?.full_name || ''
    const title = ch.contract?.title || ch.job?.title || ''
    return name.toLowerCase().includes(search.toLowerCase()) ||
           title.toLowerCase().includes(search.toLowerCase())
  })

  const totalUnread = 0 // will implement with read receipts later

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>

      {/* Header */}
      <header className={`flex items-center justify-between px-6 py-4 border-b ${c.border} ${c.card} flex-shrink-0`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}>
            <ArrowLeft size={15}/> Dashboard
          </Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <span className={`text-sm font-bold ${c.text}`}>Messages</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.border} text-xs font-bold ${c.muted}`}>
            <Bot size={11} className="text-green-500"/> Colle Active
          </div>
          <button onClick={toggle}
            className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm
              ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a]' : 'border-[#e0e0e0] bg-[#f0f0f0]'}`}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Left panel — conversations + job alerts */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r ${c.border} ${c.card} flex flex-col
          ${mobileView === 'chat' ? 'hidden md:flex' : ''}`}>

          {/* Freelancer job alerts banner */}
          {isFreelancer && jobs.length > 0 && (
            <div className={`border-b ${c.border} ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f8f8f8]'}`}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell size={13} className="text-green-500"/>
                  <span className={`text-xs font-bold ${c.text}`}>New Job Alerts</span>
                  <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {jobs.length}
                  </span>
                </div>
                <Link to="/jobs" className="text-xs text-green-500 font-bold hover:underline">
                  See all
                </Link>
              </div>
              <div className="px-3 pb-3 space-y-2">
                {jobs.slice(0, 3).map(job => (
                  <Link key={job.id} to={`/jobs`}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${c.border} transition-all
                      ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-white'} block`}>
                    <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                      <Briefcase size={12} className={c.muted}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${c.text}`}>{job.title}</p>
                      <p className={`text-xs ${c.muted} mt-0.5`}>
                        ₦{job.budget_min?.toLocaleString()} – ₦{job.budget_max?.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className={`px-4 py-3 border-b ${c.border}`}>
            <div className="relative">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.muted}`}/>
              <input type="text" placeholder="Search conversations..."
                value={search} onChange={e => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none ${c.input}`}/>
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(ch => {
                const party = user.id === ch.client_id ? ch.freelancer : ch.client
                const name = party?.full_name || 'Unknown'
                const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
                const title = ch.contract?.title || ch.job?.title || 'New conversation'
                const lastMsg = ch.lastMessage

                return (
                  <button key={ch.id}
                    onClick={() => { setSelected(ch); setMobileView('chat') }}
                    className={`w-full flex items-start gap-3 px-4 py-4 text-left border-b ${c.border} transition-colors
                      ${selected?.id === ch.id
                        ? isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'
                        : isDark ? 'hover:bg-[#111]' : 'hover:bg-[#f8f8f8]'}`}>
                    <div className={`w-11 h-11 rounded-xl ${c.bgAcc} border ${c.border} flex items-center justify-center font-bold text-sm ${c.text} flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold truncate ${c.text}`}>{name}</p>
                        {lastMsg && (
                          <span className={`text-xs flex-shrink-0 ${c.muted}`}>
                            {new Date(lastMsg.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${c.muted}`}>{title}</p>
                      {lastMsg && (
                        <p className={`text-xs truncate mt-1 ${c.light}`}>
                          {lastMsg.type === 'colle' ? '🤖 Colle responded'
                            : lastMsg.type === 'file' ? '📎 File shared'
                            : lastMsg.type === 'system' ? '🔔 ' + lastMsg.content
                            : lastMsg.content}
                        </p>
                      )}
                      {ch.contract && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Lock size={9} className="text-green-500"/>
                          <span className="text-xs text-green-500 font-medium">
                            ₦{ch.contract.total_value?.toLocaleString()} escrow
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className={`font-bold text-sm ${c.text}`}>No conversations yet</p>
                <p className={`text-xs ${c.muted} mt-1`}>
                  {isFreelancer
                    ? 'Apply for a job to start a conversation with a client.'
                    : 'Post a job or create a contract to connect with freelancers.'}
                </p>
                <Link to={isFreelancer ? '/jobs' : '/contracts/new'}
                  className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                    ${isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'}`}>
                  <Plus size={12}/>
                  {isFreelancer ? 'Find Jobs' : 'New Contract'}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${c.bg}
          ${mobileView === 'list' ? 'hidden md:flex' : ''}`}>
          {selected ? (
            <ChatView
              chat={selected}
              isDark={isDark}
              c={c}
              onBack={() => setMobileView('list')}
              myId={user.id}
              displayName={displayName}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <div className={`w-16 h-16 rounded-2xl ${c.card} border ${c.border} flex items-center justify-center`}>
                <Bot size={28} className="text-green-500"/>
              </div>
              <div>
                <p className={`font-bold ${c.text}`}>Select a conversation</p>
                <p className={`text-sm ${c.muted} mt-1 max-w-xs`}>
                  Choose a chat to open it. Type <span className="text-green-500 font-bold">Colle</span> in any conversation to get AI contract assistance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
